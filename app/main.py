"""
FastAPI application exposing REST endpoints for autonomous computer-use workflows.
"""

from __future__ import annotations
import asyncio
import io
import os
import zipfile
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse, JSONResponse
from pydantic import BaseModel, Field

from app.agent.action_schema import ActionRisk
from app.agent.task_store import TaskStore, WorkflowRecord, WorkflowStatus
from app.agent.planner import Planner
from app.agent.executor import Executor
from app.agent.workflow_engine import WorkflowEngine, WorkflowLimits

app = FastAPI(
    title="Cowork PC Agent - Autonomous Computer-Use Engine",
    description="API for multi-stage autonomous computer use, observation, bounded planning, and human-in-the-loop approvals.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global engine instances
store = TaskStore(db_path=os.environ.get("DB_PATH", "workflows.db"))
engine = WorkflowEngine(task_store=store)


class CreateWorkflowRequest(BaseModel):
    goal: str = Field(..., description="Natural language computer-use goal")
    context: Optional[Dict[str, Any]] = None
    completion_criteria: Optional[List[str]] = None


class ClarificationRequest(BaseModel):
    answer: str = Field(..., description="Response to the clarification prompt")


class ApprovalRequest(BaseModel):
    action_signature: Optional[str] = None


class RejectRequest(BaseModel):
    reason: str = "User declined pending action"


@app.get("/api/health")
def health_check() -> Dict[str, Any]:
    return {"status": "healthy", "service": "cowork-pc-agent", "version": "1.0.0"}


@app.post("/api/workflows", response_model=WorkflowRecord)
def create_workflow(req: CreateWorkflowRequest) -> WorkflowRecord:
    if not req.goal.strip():
        raise HTTPException(status_code=400, detail="Goal cannot be empty")
    record = engine.create_workflow(
        goal=req.goal,
        context=req.context,
        completion_criteria=req.completion_criteria,
    )
    return record


@app.get("/api/workflows", response_model=List[WorkflowRecord])
def list_workflows(limit: int = 50) -> List[WorkflowRecord]:
    return store.list_workflows(limit=limit)


@app.get("/api/workflows/{workflow_id}", response_model=WorkflowRecord)
def get_workflow(workflow_id: str) -> WorkflowRecord:
    record = engine.get_workflow_status(workflow_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Workflow '{workflow_id}' not found")
    return record


@app.post("/api/workflows/{workflow_id}/run")
async def run_workflow(workflow_id: str, background_tasks: BackgroundTasks) -> Dict[str, Any]:
    record = engine.get_workflow_status(workflow_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Workflow '{workflow_id}' not found")

    # Launch autonomous execution loop in background
    async def _runner():
        await engine.run_workflow(workflow_id)

    background_tasks.add_task(_runner)
    return {"status": "started", "workflow_id": workflow_id}


@app.post("/api/workflows/{workflow_id}/step", response_model=WorkflowRecord)
async def step_workflow(workflow_id: str) -> WorkflowRecord:
    try:
        return await engine.step_workflow(workflow_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/workflows/{workflow_id}/pause", response_model=WorkflowRecord)
def pause_workflow(workflow_id: str) -> WorkflowRecord:
    try:
        return engine.pause_workflow(workflow_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/workflows/{workflow_id}/resume", response_model=WorkflowRecord)
async def resume_workflow(workflow_id: str, background_tasks: BackgroundTasks) -> Dict[str, Any]:
    try:
        engine.resume_workflow(workflow_id)
        background_tasks.add_task(engine.run_workflow, workflow_id)
        return {"status": "resumed", "workflow_id": workflow_id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/workflows/{workflow_id}/cancel", response_model=WorkflowRecord)
def cancel_workflow(workflow_id: str) -> WorkflowRecord:
    try:
        return engine.cancel_workflow(workflow_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/workflows/{workflow_id}/approve")
async def approve_action(workflow_id: str, req: ApprovalRequest, background_tasks: BackgroundTasks) -> Dict[str, Any]:
    try:
        engine.approve_action(workflow_id, req.action_signature)
        background_tasks.add_task(engine.run_workflow, workflow_id)
        return {"status": "approved_and_resumed", "workflow_id": workflow_id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/workflows/{workflow_id}/reject", response_model=WorkflowRecord)
def reject_action(workflow_id: str, req: RejectRequest) -> WorkflowRecord:
    try:
        return engine.reject_action(workflow_id, req.reason)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/workflows/{workflow_id}/clarification")
async def provide_clarification(workflow_id: str, req: ClarificationRequest, background_tasks: BackgroundTasks) -> Dict[str, Any]:
    try:
        engine.provide_clarification(workflow_id, req.answer)
        background_tasks.add_task(engine.run_workflow, workflow_id)
        return {"status": "clarification_provided_and_resumed", "workflow_id": workflow_id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/workflows/{workflow_id}/artifacts")
def list_artifacts(workflow_id: str) -> Dict[str, Any]:
    record = engine.get_workflow_status(workflow_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Workflow '{workflow_id}' not found")
    return {"workflow_id": workflow_id, "artifacts": record.artifacts}


@app.get("/api/export/zip")
def export_project_zip() -> StreamingResponse:
    """Generate in-memory ZIP package of the entire Python PC Agent codebase"""
    buffer = io.BytesIO()
    root_dir = Path(".").resolve()

    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for py_path in root_dir.rglob("*"):
            rel_str = str(py_path.relative_to(root_dir))
            # Include app, tests, requirements.txt, and docs
            if any(rel_str.startswith(prefix) for prefix in ("app", "tests", "workspace")) or rel_str in ("requirements.txt", "README.md"):
                if "__pycache__" not in rel_str and not rel_str.endswith(".pyc") and py_path.is_file():
                    zip_file.write(py_path, arcname=rel_str)

    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=cowork_pc_agent.zip"},
    )
