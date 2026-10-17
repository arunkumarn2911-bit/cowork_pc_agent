"""
Tests for WorkflowEngine autonomous loop, multi-stage state transitions, and budget enforcement.
"""

import asyncio
import os
import shutil
import unittest
from pathlib import Path
from app.agent.task_store import TaskStore, WorkflowStatus
from app.agent.planner import Planner
from app.agent.executor import Executor
from app.agent.workflow_engine import WorkflowEngine, WorkflowLimits
from app.tools.artifact_manager import ArtifactManager


class TestWorkflowEngine(unittest.TestCase):
    def setUp(self):
        self.test_dir = "test_engine_temp"
        Path(self.test_dir).mkdir(parents=True, exist_ok=True)
        self.store = TaskStore(db_path=os.path.join(self.test_dir, "test.db"))
        self.artifacts = ArtifactManager(workspace_dir=os.path.join(self.test_dir, "workspace"))
        self.executor = Executor(artifact_manager=self.artifacts)
        self.planner = Planner(provider="heuristic")
        self.engine = WorkflowEngine(
            task_store=self.store,
            planner=self.planner,
            executor=self.executor,
            limits=WorkflowLimits(max_stages=10, max_total_actions=50),
        )

    def tearDown(self):
        if Path(self.test_dir).exists():
            shutil.rmtree(self.test_dir)

    def test_workflow_creation(self):
        wf = self.engine.create_workflow("Search provider directory and extract data")
        self.assertTrue(wf.workflow_id.startswith("wf_"))
        self.assertEqual(wf.status, WorkflowStatus.PENDING)
        self.assertEqual(len(wf.completion_criteria), 5)

    def test_single_stage_step(self):
        wf = self.engine.create_workflow("Search provider directory")
        stepped_wf = asyncio.run(self.engine.step_workflow(wf.workflow_id))
        self.assertEqual(stepped_wf.current_stage, 1)
        self.assertEqual(len(stepped_wf.completed_stages), 1)

    def test_pause_and_resume(self):
        wf = self.engine.create_workflow("Test pause and resume")
        asyncio.run(self.engine.step_workflow(wf.workflow_id))

        paused = self.engine.pause_workflow(wf.workflow_id)
        self.assertEqual(paused.status, WorkflowStatus.PAUSED)

        resumed = self.engine.resume_workflow(wf.workflow_id)
        self.assertEqual(resumed.status, WorkflowStatus.RUNNING)

    def test_cancellation(self):
        wf = self.engine.create_workflow("Test cancellation")
        cancelled = self.engine.cancel_workflow(wf.workflow_id)
        self.assertEqual(cancelled.status, WorkflowStatus.CANCELLED)

    def test_resource_budget_exhaustion(self):
        strict_limits = WorkflowLimits(max_stages=2)
        engine_strict = WorkflowEngine(
            task_store=self.store,
            planner=self.planner,
            executor=self.executor,
            limits=strict_limits,
        )
        wf = engine_strict.create_workflow("Goal with strict limits")
        # Step twice
        asyncio.run(engine_strict.step_workflow(wf.workflow_id))
        asyncio.run(engine_strict.step_workflow(wf.workflow_id))
        # Now run: it should hit stage limit
        final_wf = asyncio.run(engine_strict.run_workflow(wf.workflow_id))
        self.assertEqual(final_wf.status, WorkflowStatus.FAILED)
        self.assertIn("Resource limit exceeded", final_wf.error_summary)


if __name__ == "__main__":
    unittest.main()
