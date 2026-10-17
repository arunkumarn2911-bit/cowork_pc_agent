"""
Tests for Planner stage decomposition, heuristic fallback, and recovery planning.
"""

import unittest
import time
from app.agent.action_schema import Observation, ActionType
from app.agent.planner import Planner


class TestPlanner(unittest.TestCase):
    def setUp(self):
        self.planner = Planner(provider="heuristic")
        self.dummy_obs = Observation(
            timestamp=time.time(),
            url="https://medical-registry.internal",
            page_title="Registry",
            visible_text="Directory search",
        )

    def test_initial_stage_decomposition(self):
        plan = self.planner.plan_next_stage(
            goal="Open the specified website, search for Dr. Sarah Jenkins, and extract details",
            completion_criteria=["Navigate to portal", "Extract fields"],
            current_stage=0,
            completed_stages=[],
            observation=self.dummy_obs,
        )
        self.assertEqual(plan.stage_number, 1)
        self.assertTrue(len(plan.steps) <= 5)
        self.assertTrue(plan.continue_task)
        # First step should open URL
        self.assertEqual(plan.steps[0].name, ActionType.OPEN_URL)

    def test_stage_progression_advances(self):
        # Stage 1: search
        plan_stage_2 = self.planner.plan_next_stage(
            goal="Search for Dr. Sarah Jenkins and save details",
            completion_criteria=[],
            current_stage=1,
            completed_stages=[{"stage_number": 1}],
            observation=self.dummy_obs,
        )
        self.assertEqual(plan_stage_2.stage_number, 2)
        step_names = [s.name for s in plan_stage_2.steps]
        self.assertIn(ActionType.FILL_FIELD, step_names)
        self.assertIn(ActionType.CLICK_ELEMENT, step_names)

    def test_recovery_planning_on_error(self):
        plan_recovery = self.planner.plan_next_stage(
            goal="Search for provider",
            completion_criteria=[],
            current_stage=2,
            completed_stages=[{"stage_number": 1}],
            observation=self.dummy_obs,
            recovery_attempts=1,
            recent_error="missing_element: Button #search not found",
        )
        self.assertTrue("Recovery stage" in plan_recovery.stage_objective)
        self.assertEqual(plan_recovery.steps[0].name, ActionType.INSPECT_PAGE)


if __name__ == "__main__":
    unittest.main()
