"""
SQLite-backed persistent store for autonomous workflows, execution history, and state recovery.
Supports Pydantic and standard library environments.
"""

from __future__ import annotations
import json
import sqlite3
import time
from contextlib import contextmanager
from enum import Enum
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional
from app.agent.action_schema import _PydanticBaseModel as BaseModel, Field


class WorkflowStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    AWAITING_CLARIFICATION = "AWAITING_CLARIFICATION"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class WorkflowRecord(BaseModel):
    workflow_id: str
    goal: str
    completion_criteria: List[str] = Field(default_factory=list)
    status: WorkflowStatus = Field(default=WorkflowStatus.PENDING)
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)
    current_stage: int = 0
    completed_stages: List[Dict[str, Any]] = Field(default_factory=list)
    pending_stage: Optional[Dict[str, Any]] = None
    last_observation: Optional[Dict[str, Any]] = None
    last_plan: Optional[Dict[str, Any]] = None
    last_execution_result: Optional[List[Dict[str, Any]]] = None
    verification_results: List[Dict[str, Any]] = Field(default_factory=list)
    recovery_attempts: int = 0
    artifacts: List[Dict[str, Any]] = Field(default_factory=list)
    approval_state: Optional[Dict[str, Any]] = None
    clarification: Optional[Dict[str, Any]] = None
    error_summary: Optional[str] = None
    total_actions: int = 0
    elapsed_time: float = 0.0
    final_report: Optional[Dict[str, Any]] = None

    def __init__(self, **kwargs: Any):
        if "completion_criteria" not in kwargs:
            kwargs["completion_criteria"] = []
        if "status" in kwargs and isinstance(kwargs["status"], str):
            kwargs["status"] = WorkflowStatus(kwargs["status"])
        elif "status" not in kwargs:
            kwargs["status"] = WorkflowStatus.PENDING
        if "created_at" not in kwargs:
            kwargs["created_at"] = time.time()
        if "updated_at" not in kwargs:
            kwargs["updated_at"] = time.time()
        if "current_stage" not in kwargs:
            kwargs["current_stage"] = 0
        if "completed_stages" not in kwargs:
            kwargs["completed_stages"] = []
        if "verification_results" not in kwargs:
            kwargs["verification_results"] = []
        if "recovery_attempts" not in kwargs:
            kwargs["recovery_attempts"] = 0
        if "artifacts" not in kwargs:
            kwargs["artifacts"] = []
        if "total_actions" not in kwargs:
            kwargs["total_actions"] = 0
        if "elapsed_time" not in kwargs:
            kwargs["elapsed_time"] = 0.0
        super().__init__(**kwargs)


class TaskStore:
    def __init__(self, db_path: str = "workflows.db"):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    @contextmanager
    def _connection(self) -> Iterator[sqlite3.Connection]:
        conn = self._get_connection()
        try:
            with conn:
                yield conn
        finally:
            conn.close()

    def _init_db(self) -> None:
        if self.db_path != ":memory:":
            Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        with self._connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS workflows (
                    workflow_id TEXT PRIMARY KEY,
                    goal TEXT NOT NULL,
                    completion_criteria TEXT NOT NULL,
                    status TEXT NOT NULL,
                    created_at REAL NOT NULL,
                    updated_at REAL NOT NULL,
                    current_stage INTEGER NOT NULL,
                    completed_stages TEXT NOT NULL,
                    pending_stage TEXT,
                    last_observation TEXT,
                    last_plan TEXT,
                    last_execution_result TEXT,
                    verification_results TEXT NOT NULL,
                    recovery_attempts INTEGER NOT NULL,
                    artifacts TEXT NOT NULL,
                    approval_state TEXT,
                    clarification TEXT,
                    error_summary TEXT,
                    total_actions INTEGER NOT NULL,
                    elapsed_time REAL NOT NULL,
                    final_report TEXT,
                    is_locked INTEGER NOT NULL DEFAULT 0
                )
                """
            )
            conn.commit()

    def create_workflow(self, record: WorkflowRecord) -> WorkflowRecord:
        with self._connection() as conn:
            conn.execute(
                """
                INSERT INTO workflows (
                    workflow_id, goal, completion_criteria, status,
                    created_at, updated_at, current_stage, completed_stages,
                    pending_stage, last_observation, last_plan, last_execution_result,
                    verification_results, recovery_attempts, artifacts, approval_state,
                    clarification, error_summary, total_actions, elapsed_time, final_report, is_locked
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
                """,
                (
                    record.workflow_id,
                    record.goal,
                    json.dumps(record.completion_criteria),
                    record.status.value if isinstance(record.status, Enum) else str(record.status),
                    record.created_at,
                    record.updated_at,
                    record.current_stage,
                    json.dumps(record.completed_stages),
                    json.dumps(record.pending_stage) if record.pending_stage else None,
                    json.dumps(record.last_observation) if record.last_observation else None,
                    json.dumps(record.last_plan) if record.last_plan else None,
                    json.dumps(record.last_execution_result) if record.last_execution_result else None,
                    json.dumps(record.verification_results),
                    record.recovery_attempts,
                    json.dumps(record.artifacts),
                    json.dumps(record.approval_state) if record.approval_state else None,
                    json.dumps(record.clarification) if record.clarification else None,
                    record.error_summary,
                    record.total_actions,
                    record.elapsed_time,
                    json.dumps(record.final_report) if record.final_report else None,
                ),
            )
            conn.commit()
        return record

    def get_workflow(self, workflow_id: str) -> Optional[WorkflowRecord]:
        with self._connection() as conn:
            cursor = conn.execute("SELECT * FROM workflows WHERE workflow_id = ?", (workflow_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return self._row_to_record(row)

    def list_workflows(self, limit: int = 50) -> List[WorkflowRecord]:
        with self._connection() as conn:
            cursor = conn.execute("SELECT * FROM workflows ORDER BY updated_at DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            return [self._row_to_record(row) for row in rows]

    def update_workflow(self, record: WorkflowRecord) -> None:
        record.updated_at = time.time()
        with self._connection() as conn:
            conn.execute(
                """
                UPDATE workflows SET
                    goal = ?,
                    completion_criteria = ?,
                    status = ?,
                    updated_at = ?,
                    current_stage = ?,
                    completed_stages = ?,
                    pending_stage = ?,
                    last_observation = ?,
                    last_plan = ?,
                    last_execution_result = ?,
                    verification_results = ?,
                    recovery_attempts = ?,
                    artifacts = ?,
                    approval_state = ?,
                    clarification = ?,
                    error_summary = ?,
                    total_actions = ?,
                    elapsed_time = ?,
                    final_report = ?
                WHERE workflow_id = ?
                """,
                (
                    record.goal,
                    json.dumps(record.completion_criteria),
                    record.status.value if isinstance(record.status, Enum) else str(record.status),
                    record.updated_at,
                    record.current_stage,
                    json.dumps(record.completed_stages),
                    json.dumps(record.pending_stage) if record.pending_stage else None,
                    json.dumps(record.last_observation) if record.last_observation else None,
                    json.dumps(record.last_plan) if record.last_plan else None,
                    json.dumps(record.last_execution_result) if record.last_execution_result else None,
                    json.dumps(record.verification_results),
                    record.recovery_attempts,
                    json.dumps(record.artifacts),
                    json.dumps(record.approval_state) if record.approval_state else None,
                    json.dumps(record.clarification) if record.clarification else None,
                    record.error_summary,
                    record.total_actions,
                    record.elapsed_time,
                    json.dumps(record.final_report) if record.final_report else None,
                    record.workflow_id,
                ),
            )
            conn.commit()

    def acquire_lock(self, workflow_id: str) -> bool:
        with self._connection() as conn:
            cursor = conn.execute(
                "UPDATE workflows SET is_locked = 1 WHERE workflow_id = ? AND is_locked = 0",
                (workflow_id,),
            )
            conn.commit()
            return cursor.rowcount > 0

    def release_lock(self, workflow_id: str) -> None:
        with self._connection() as conn:
            conn.execute(
                "UPDATE workflows SET is_locked = 0 WHERE workflow_id = ?",
                (workflow_id,),
            )
            conn.commit()

    def _row_to_record(self, row: sqlite3.Row) -> WorkflowRecord:
        return WorkflowRecord(
            workflow_id=row["workflow_id"],
            goal=row["goal"],
            completion_criteria=json.loads(row["completion_criteria"]),
            status=WorkflowStatus(row["status"]),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            current_stage=row["current_stage"],
            completed_stages=json.loads(row["completed_stages"]),
            pending_stage=json.loads(row["pending_stage"]) if row["pending_stage"] else None,
            last_observation=json.loads(row["last_observation"]) if row["last_observation"] else None,
            last_plan=json.loads(row["last_plan"]) if row["last_plan"] else None,
            last_execution_result=json.loads(row["last_execution_result"]) if row["last_execution_result"] else None,
            verification_results=json.loads(row["verification_results"]),
            recovery_attempts=row["recovery_attempts"],
            artifacts=json.loads(row["artifacts"]),
            approval_state=json.loads(row["approval_state"]) if row["approval_state"] else None,
            clarification=json.loads(row["clarification"]) if row["clarification"] else None,
            error_summary=row["error_summary"],
            total_actions=row["total_actions"],
            elapsed_time=row["elapsed_time"],
            final_report=json.loads(row["final_report"]) if row["final_report"] else None,
        )
