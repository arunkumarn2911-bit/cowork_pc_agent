"""
WorkflowEngine: Central autonomous loop for Cowork-style computer-use agents.
Executes multi-stage goals autonomously: Observe -> Plan -> Validate -> Execute -> Observe -> Verify -> Replan.
"""

from __future__ import annotations
import asyncio
import logging
import time
import uuid
from typing import Any, Dict, List, Optional
from app.agent.action_schema import (
    Action,
    ActionType,
    ActionRisk,
    StagePlan,
    Observation,
    ExecutionResult,
)
from app.agent.task_store import TaskStore, WorkflowRecord, WorkflowStatus
from app.agent.planner import Planner
from app.agent.executor import Executor
from app.tools.browser_control import BrowserController
from app.tools.desktop_control import DesktopController
from app.tools.artifact_manager import ArtifactManager

logger = logging.getLogger("workflow_engine")
logging.basicConfig(level=logging.INFO, format="[%(asctime)s] [%(levelname)s] %(message)s")


class WorkflowLimits:
    def __init__(
        self,
        max_actions_per_stage: int = 5,
        max_stages: int = 20,
        max_total_actions: int = 100,
        max_runtime_sec: float = 600.0,
        max_recovery_per_failure: int = 2,
    ):
        self.max_actions_per_stage = max_actions_per_stage
        self.max_stages = max_stages
        self.max_total_actions = max_total_actions
        self.max_runtime_sec = max_runtime_sec
        self.max_recovery_per_failure = max_recovery_per_failure


class WorkflowEngine:
    def __init__(
        self,
        task_store: Optional[TaskStore] = None,
        planner: Optional[Planner] = None,
        executor: Optional[Executor] = None,
        limits: Optional[WorkflowLimits] = None,
    ):
        self.store = task_store or TaskStore()
        self.planner = planner or Planner()
        self.executor = executor or Executor()
        self.limits = limits or WorkflowLimits()
        self._active_runs: Dict[str, asyncio.Task] = {}

    def create_workflow(
        self,
        goal: str,
        context: Optional[Dict[str, Any]] = None,
        completion_criteria: Optional[List[str]] = None,
    ) -> WorkflowRecord:
        workflow_id = f"wf_{uuid.uuid4().hex[:10]}"

        # Derive initial measurable completion criteria if not specified
        criteria = completion_criteria or [
            "Navigate to required environment/portal",
            "Locate and select matching target record/content",
            "Extract requested attributes accurately",
            "Save verified screenshot and structured JSON in workspace",
            "Validate saved artifacts and compile final summary",
        ]

        record = WorkflowRecord(
            workflow_id=workflow_id,
            goal=goal.strip(),
            completion_criteria=criteria,
            status=WorkflowStatus.PENDING,
            created_at=time.time(),
            updated_at=time.time(),
            current_stage=0,
            completed_stages=[],
            total_actions=0,
            elapsed_time=0.0,
        )
        self.store.create_workflow(record)
        logger.info(f"Created workflow {workflow_id}: '{goal[:60]}...'")
        return record

    def get_workflow_status(self, workflow_id: str) -> Optional[WorkflowRecord]:
        return self.store.get_workflow(workflow_id)

    async def run_workflow(self, workflow_id: str) -> WorkflowRecord:
        """Run the full autonomous loop until completion, approval, blocker, or cancellation"""
        record = self.store.get_workflow(workflow_id)
        if not record:
            raise ValueError(f"Workflow '{workflow_id}' not found")

        if record.status in (WorkflowStatus.COMPLETED, WorkflowStatus.FAILED, WorkflowStatus.CANCELLED):
            return record

        if not self.store.acquire_lock(workflow_id):
            logger.warning(f"Workflow {workflow_id} is already running or locked.")
            return record

        record.status = WorkflowStatus.RUNNING
        self.store.update_workflow(record)

        try:
            start_loop_time = time.time() - record.elapsed_time

            while True:
                record = self.store.get_workflow(workflow_id)
                if not record or record.status != WorkflowStatus.RUNNING:
                    break

                # 1. Check resource limits & budgets
                elapsed = time.time() - start_loop_time
                record.elapsed_time = elapsed

                if elapsed > self.limits.max_runtime_sec:
                    record.status = WorkflowStatus.FAILED
                    record.error_summary = f"Resource limit exceeded: Maximum wall-clock runtime ({self.limits.max_runtime_sec}s) reached."
                    self.store.update_workflow(record)
                    break

                if record.current_stage >= self.limits.max_stages:
                    record.status = WorkflowStatus.FAILED
                    record.error_summary = f"Resource limit exceeded: Reached maximum allowed stages ({self.limits.max_stages})."
                    self.store.update_workflow(record)
                    break

                if record.total_actions >= self.limits.max_total_actions:
                    record.status = WorkflowStatus.FAILED
                    record.error_summary = f"Resource limit exceeded: Reached maximum action budget ({self.limits.max_total_actions})."
                    self.store.update_workflow(record)
                    break

                # 2. Step the workflow
                step_status = await self._execute_one_stage(record)

                if step_status in (
                    WorkflowStatus.COMPLETED,
                    WorkflowStatus.FAILED,
                    WorkflowStatus.AWAITING_APPROVAL,
                    WorkflowStatus.AWAITING_CLARIFICATION,
                    WorkflowStatus.PAUSED,
                    WorkflowStatus.CANCELLED,
                ):
                    break

            return self.store.get_workflow(workflow_id) or record

        finally:
            self.store.release_lock(workflow_id)

    async def step_workflow(self, workflow_id: str) -> WorkflowRecord:
        """Execute a single bounded stage and pause"""
        record = self.store.get_workflow(workflow_id)
        if not record:
            raise ValueError(f"Workflow '{workflow_id}' not found")

        if not self.store.acquire_lock(workflow_id):
            return record

        try:
            record.status = WorkflowStatus.RUNNING
            self.store.update_workflow(record)
            await self._execute_one_stage(record)
            return self.store.get_workflow(workflow_id) or record
        finally:
            self.store.release_lock(workflow_id)

    async def _execute_one_stage(self, record: WorkflowRecord) -> WorkflowStatus:
        logger.info(f"[{record.workflow_id}] Starting Stage {record.current_stage + 1}")

        # Step A: Observe environment
        observation = await self.executor.browser.inspect_page()
        record.last_observation = observation.model_dump()
        self.store.update_workflow(record)

        # Step B: Request bounded plan from Planner
        recent_err = record.error_summary
        stage_plan = self.planner.plan_next_stage(
            goal=record.goal,
            completion_criteria=record.completion_criteria,
            current_stage=record.current_stage,
            completed_stages=record.completed_stages,
            observation=observation,
            previous_results=record.last_execution_result,
            recovery_attempts=record.recovery_attempts,
            recent_error=recent_err,
        )

        record.last_plan = stage_plan.model_dump()
        self.store.update_workflow(record)

        # Check if planner requested clarification
        if stage_plan.clarification:
            record.status = WorkflowStatus.AWAITING_CLARIFICATION
            record.clarification = {
                "question": stage_plan.clarification,
                "requested_at": time.time(),
            }
            self.store.update_workflow(record)
            logger.info(f"[{record.workflow_id}] Pausing for clarification: {stage_plan.clarification}")
            return WorkflowStatus.AWAITING_CLARIFICATION

        # Step C: Validate actions & Check human approval requirement
        consequential_step = None
        for step in stage_plan.steps:
            if step.determine_risk() == ActionRisk.CONSEQUENTIAL and not self.executor.is_action_approved(step):
                consequential_step = step
                break

        if consequential_step or stage_plan.requires_approval:
            step_to_approve = consequential_step or (stage_plan.steps[0] if stage_plan.steps else None)
            record.status = WorkflowStatus.AWAITING_APPROVAL
            record.approval_state = {
                "action_name": step_to_approve.name.value if step_to_approve else "consequential_batch",
                "arguments": step_to_approve.arguments if step_to_approve else {},
                "description": step_to_approve.description if step_to_approve else "Consequential action requires approval",
                "risk": ActionRisk.CONSEQUENTIAL.value,
                "stage_number": record.current_stage + 1,
            }
            self.store.update_workflow(record)
            logger.info(f"[{record.workflow_id}] Pausing for human approval on '{record.approval_state['action_name']}'")
            return WorkflowStatus.AWAITING_APPROVAL

        # Step D: Execute the approved bounded batch
        exec_results = await self.executor.execute_batch(stage_plan.steps, workflow_id=record.workflow_id)
        record.last_execution_result = [r.model_dump() for r in exec_results]
        record.total_actions += len(exec_results)

        # Check for blocked approval during execution
        blocked = next((r for r in exec_results if r.status == "blocked_approval"), None)
        if blocked:
            record.status = WorkflowStatus.AWAITING_APPROVAL
            record.approval_state = blocked.output
            self.store.update_workflow(record)
            return WorkflowStatus.AWAITING_APPROVAL

        # Step E: Fresh Observation & Verification
        fresh_observation = await self.executor.browser.inspect_page()
        record.last_observation = fresh_observation.model_dump()

        has_errors = any(r.status == "error" for r in exec_results)
        if has_errors:
            failed_res = next(r for r in exec_results if r.status == "error")
            record.recovery_attempts += 1
            record.error_summary = f"{failed_res.error_category}: {failed_res.error_message}"

            if record.recovery_attempts > self.limits.max_recovery_per_failure:
                record.status = WorkflowStatus.FAILED
                record.error_summary = f"Recovery attempts exceeded ({self.limits.max_recovery_per_failure}). Last error: {failed_res.error_message}"
                self.store.update_workflow(record)
                return WorkflowStatus.FAILED
        else:
            # Clear transient error state on successful execution
            record.error_summary = None
            record.recovery_attempts = 0

            # Register completed stage
            record.completed_stages.append({
                "stage_number": record.current_stage + 1,
                "objective": stage_plan.stage_objective,
                "actions_executed": len(exec_results),
                "timestamp": time.time(),
            })
            record.current_stage += 1

            # Sync workspace artifacts
            record.artifacts = self.executor.artifacts.list_artifacts()

        # Step F: Check Terminal Completion
        terminal_action = next((r for r in exec_results if r.action_name == ActionType.COMPLETE_GOAL.value and r.status == "success"), None)
        if terminal_action or not stage_plan.continue_task:
            record.status = WorkflowStatus.COMPLETED
            record.final_report = {
                "summary": stage_plan.completion_reason or (terminal_action.output.get("summary") if terminal_action else "Goal completed autonomously"),
                "total_stages": record.current_stage,
                "total_actions": record.total_actions,
                "elapsed_time": record.elapsed_time,
                "evidence": terminal_action.output.get("evidence") if terminal_action else {},
                "artifacts": record.artifacts,
            }
            self.store.update_workflow(record)
            logger.info(f"[{record.workflow_id}] Goal successfully completed! Stages: {record.current_stage}, Actions: {record.total_actions}")
            return WorkflowStatus.COMPLETED

        self.store.update_workflow(record)
        return WorkflowStatus.RUNNING

    def approve_action(self, workflow_id: str, action_signature: Optional[str] = None) -> WorkflowRecord:
        record = self.store.get_workflow(workflow_id)
        if not record:
            raise ValueError(f"Workflow '{workflow_id}' not found")

        if record.approval_state:
            act_name = record.approval_state.get("action_name", "")
            args = record.approval_state.get("arguments", {})
            sig = action_signature or f"{act_name}:{str(sorted(args.items()))}"
            self.executor.approve_action(sig)
            record.approval_state = None
            record.status = WorkflowStatus.RUNNING
            self.store.update_workflow(record)
            logger.info(f"[{workflow_id}] Consequential action approved: {sig}")
        return record

    def reject_action(self, workflow_id: str, reason: str = "User rejected pending action") -> WorkflowRecord:
        record = self.store.get_workflow(workflow_id)
        if not record:
            raise ValueError(f"Workflow '{workflow_id}' not found")

        record.approval_state = None
        record.status = WorkflowStatus.CANCELLED
        record.error_summary = f"Action rejected by user: {reason}"
        self.store.update_workflow(record)
        logger.info(f"[{workflow_id}] Workflow cancelled due to rejected approval")
        return record

    def provide_clarification(self, workflow_id: str, answer: str) -> WorkflowRecord:
        record = self.store.get_workflow(workflow_id)
        if not record:
            raise ValueError(f"Workflow '{workflow_id}' not found")

        if record.clarification:
            record.clarification["answer"] = answer
            record.clarification["answered_at"] = time.time()
            record.status = WorkflowStatus.RUNNING
            self.store.update_workflow(record)
            logger.info(f"[{workflow_id}] Clarification received: {answer}")
        return record

    def pause_workflow(self, workflow_id: str) -> WorkflowRecord:
        record = self.store.get_workflow(workflow_id)
        if not record:
            raise ValueError(f"Workflow '{workflow_id}' not found")
        if record.status == WorkflowStatus.RUNNING:
            record.status = WorkflowStatus.PAUSED
            self.store.update_workflow(record)
        return record

    def resume_workflow(self, workflow_id: str) -> WorkflowRecord:
        record = self.store.get_workflow(workflow_id)
        if not record:
            raise ValueError(f"Workflow '{workflow_id}' not found")
        if record.status == WorkflowStatus.PAUSED:
            record.status = WorkflowStatus.RUNNING
            self.store.update_workflow(record)
        return record

    def cancel_workflow(self, workflow_id: str) -> WorkflowRecord:
        record = self.store.get_workflow(workflow_id)
        if not record:
            raise ValueError(f"Workflow '{workflow_id}' not found")
        record.status = WorkflowStatus.CANCELLED
        record.error_summary = "Workflow cancelled by user"
        self.store.update_workflow(record)
        return record
