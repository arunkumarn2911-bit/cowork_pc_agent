"""
Tests for Executor execution, safety gates, and artifact sandboxing.
"""

import asyncio
import os
import shutil
import unittest
from pathlib import Path
from app.agent.action_schema import Action, ActionType, ActionRisk
from app.agent.executor import Executor
from app.tools.artifact_manager import ArtifactManager, ArtifactSecurityError
from app.tools.browser_control import BrowserController


class TestExecutor(unittest.TestCase):
    def setUp(self):
        self.test_workspace = "test_workspace_temp"
        self.artifacts = ArtifactManager(workspace_dir=self.test_workspace)
        self.browser = BrowserController()
        self.executor = Executor(
            browser_controller=self.browser,
            artifact_manager=self.artifacts,
        )

    def tearDown(self):
        if Path(self.test_workspace).exists():
            shutil.rmtree(self.test_workspace)

    def test_safe_action_execution(self):
        action = Action(
            name=ActionType.OPEN_URL,
            arguments={"url": "https://example.internal/test"},
        )
        res = asyncio.run(self.executor.execute_action(action))
        self.assertEqual(res.status, "success")
        self.assertTrue(res.verified)

    def test_consequential_action_blocked_without_approval(self):
        consequential_action = Action(
            name=ActionType.CLICK_ELEMENT,
            arguments={"selector": "#btn-delete-account"},
            description="Delete account records",
        )
        results = asyncio.run(self.executor.execute_batch([consequential_action]))
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].status, "blocked_approval")
        self.assertEqual(results[0].error_category, "safety")

    def test_consequential_action_allowed_after_approval(self):
        consequential_action = Action(
            name=ActionType.CLICK_ELEMENT,
            arguments={"selector": "#btn-delete-account"},
            description="Delete account records",
        )
        sig = f"{consequential_action.name.value}:{str(sorted(consequential_action.arguments.items()))}"
        self.executor.approve_action(sig)
        results = asyncio.run(self.executor.execute_batch([consequential_action]))
        self.assertEqual(results[0].status, "success")

    def test_artifact_path_traversal_blocked(self):
        with self.assertRaises(ArtifactSecurityError):
            self.artifacts.save_json("../escaped.json", {"test": 123})

    def test_json_artifact_save_and_verification(self):
        data = {"provider": "Dr. Jenkins", "status": "Active", "npi": "123456"}
        save_res = self.artifacts.save_json("provider_test.json", data)
        self.assertTrue(save_res["verified"])
        self.assertEqual(save_res["type"], "json")

        ver_res = self.artifacts.verify_artifact("provider_test.json", expected_keys=["provider", "status"])
        self.assertTrue(ver_res["verified"])
        self.assertTrue(ver_res["json_valid"])


if __name__ == "__main__":
    unittest.main()
