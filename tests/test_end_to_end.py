"""
End-to-End Test: Full autonomous multi-stage workflow from a single natural-language goal.
Demonstrates:
1. Receive one natural-language goal
2. Open test website / portal
3. Search for known record (Dr. Sarah Jenkins)
4. Open matching record (PRV-8492)
5. Extract name, address, and status
6. Save verified screenshot artifact
7. Save structured JSON artifact
8. Verify saved files and data contents
9. Produce final verifiable report
"""

import asyncio
import json
import os
import shutil
import unittest
from pathlib import Path
from app.agent.task_store import TaskStore, WorkflowStatus
from app.agent.planner import Planner
from app.agent.executor import Executor
from app.agent.workflow_engine import WorkflowEngine, WorkflowLimits
from app.tools.artifact_manager import ArtifactManager
from app.tools.browser_control import BrowserController


class TestAutonomousEndToEnd(unittest.TestCase):
    def setUp(self):
        self.workspace_dir = "test_e2e_workspace"
        Path(self.workspace_dir).mkdir(parents=True, exist_ok=True)
        self.db_path = os.path.join(self.workspace_dir, "e2e_workflows.db")

        self.store = TaskStore(db_path=self.db_path)
        self.artifacts = ArtifactManager(workspace_dir=self.workspace_dir)
        self.browser = BrowserController()
        self.executor = Executor(
            browser_controller=self.browser,
            artifact_manager=self.artifacts,
        )
        self.planner = Planner(provider="heuristic")
        self.engine = WorkflowEngine(
            task_store=self.store,
            planner=self.planner,
            executor=self.executor,
            limits=WorkflowLimits(max_stages=10, max_total_actions=50),
        )

    def tearDown(self):
        if Path(self.workspace_dir).exists():
            shutil.rmtree(self.workspace_dir)

    def test_complete_autonomous_provider_extraction_flow(self):
        # 1. Receive one single natural language goal
        user_goal = (
            "Open the specified website https://medical-registry.internal/providers, "
            "search for Dr. Sarah Jenkins, open the matching record, extract its name, "
            "address and status, save a screenshot and JSON result in my workspace, "
            "verify the saved files, and summarize the result."
        )

        wf = self.engine.create_workflow(user_goal)
        self.assertEqual(wf.status, WorkflowStatus.PENDING)

        # 2. Run the autonomous loop without requiring fresh user prompts
        completed_wf = asyncio.run(self.engine.run_workflow(wf.workflow_id))

        # 3. Verify workflow completed successfully
        self.assertEqual(completed_wf.status, WorkflowStatus.COMPLETED)
        self.assertGreaterEqual(completed_wf.current_stage, 4)
        self.assertGreater(completed_wf.total_actions, 5, "Workflow must execute multiple bounded batches (>5 total actions)")

        # 4. Verify artifacts were generated and verified
        artifacts = self.artifacts.list_artifacts()
        filenames = [a["filename"] for a in artifacts]
        self.assertIn("provider_extracted.json", filenames)
        self.assertIn("provider_record_verified.png", filenames)

        # 5. Verify the saved JSON content matches the extracted provider record
        json_verification = self.artifacts.verify_artifact("provider_extracted.json", expected_keys=["name", "address", "status"])
        self.assertTrue(json_verification["verified"])
        self.assertTrue(json_verification["json_valid"])

        with open(json_verification["path"], "r", encoding="utf-8") as f:
            data = json.load(f)
            self.assertEqual(data["name"], "Dr. Sarah Jenkins, MD")
            self.assertEqual(data["status"], "Active / In-Network")
            self.assertIn("Springfield", data["address"])

        # 6. Verify final report was produced
        self.assertIsNotNone(completed_wf.final_report)
        self.assertTrue(len(completed_wf.final_report.get("summary", "")) > 20)
        self.assertEqual(completed_wf.final_report.get("total_stages"), completed_wf.current_stage)


if __name__ == "__main__":
    unittest.main()
