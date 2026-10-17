"""
Tests for action schemas, argument validation, and risk policies.
"""

import unittest
from app.agent.action_schema import (
    Action,
    ActionType,
    ActionRisk,
    StagePlan,
    Observation,
)


class TestActionSchema(unittest.TestCase):
    def test_valid_action_accepted(self):
        action = Action(
            name=ActionType.OPEN_URL,
            arguments={"url": "https://example.com"},
            description="Open example.com",
        )
        self.assertEqual(action.name, ActionType.OPEN_URL)
        self.assertEqual(action.determine_risk(), ActionRisk.SAFE)

    def test_unsupported_action_rejected(self):
        with self.assertRaises(ValueError):
            Action(name="unsupported_dangerous_action", arguments={})

    def test_invalid_url_protocol_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            Action(name=ActionType.OPEN_URL, arguments={"url": "javascript:alert(1)"})
        self.assertIn("Invalid URL protocol", str(ctx.exception))

    def test_missing_required_arguments_rejected(self):
        # fill_field requires selector and text
        with self.assertRaises(ValueError):
            Action(name=ActionType.FILL_FIELD, arguments={"selector": "#input"})

        with self.assertRaises(ValueError):
            Action(name=ActionType.FILL_FIELD, arguments={"text": "hello"})

    def test_stage_plan_bounded_to_five_steps(self):
        # 5 steps allowed
        valid_steps = [
            Action(name=ActionType.INSPECT_PAGE, arguments={}) for _ in range(5)
        ]
        plan = StagePlan(
            stage_number=1,
            stage_objective="Inspect page multiple times",
            steps=valid_steps,
        )
        self.assertEqual(len(plan.steps), 5)

        # 6 steps rejected
        with self.assertRaises(ValueError) as ctx:
            invalid_steps = [
                Action(name=ActionType.INSPECT_PAGE, arguments={}) for _ in range(6)
            ]
            StagePlan(
                stage_number=1,
                stage_objective="Too many steps",
                steps=invalid_steps,
            )
        self.assertIn("cannot contain more than 5 actions", str(ctx.exception))

    def test_consequential_risk_detection(self):
        # Normal click
        safe_click = Action(
            name=ActionType.CLICK_ELEMENT,
            arguments={"selector": "#view-record"},
            description="View details",
        )
        self.assertEqual(safe_click.determine_risk(), ActionRisk.SAFE)

        # Consequential click with delete keyword
        consequential_click = Action(
            name=ActionType.CLICK_ELEMENT,
            arguments={"selector": "#btn-delete-database"},
            description="Delete production database records",
        )
        self.assertEqual(consequential_click.determine_risk(), ActionRisk.CONSEQUENTIAL)

    def test_save_artifact_path_traversal_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            Action(
                name=ActionType.SAVE_ARTIFACT,
                arguments={"filename": "../../etc/passwd", "content": "bad"},
            )
        self.assertIn("rejects path traversal", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
