"""
Tests for FastAPI REST endpoints and background execution.
"""

import unittest
from starlette.testclient import TestClient
from app.main import app


class TestAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_endpoint(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "healthy")

    def test_create_and_get_workflow(self):
        res = self.client.post(
            "/api/workflows",
            json={"goal": "Test goal through API", "completion_criteria": ["Criteria 1"]},
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        wf_id = data["workflow_id"]
        self.assertTrue(wf_id.startswith("wf_"))
        self.assertEqual(data["status"], "PENDING")

        # Get status
        get_res = self.client.get(f"/api/workflows/{wf_id}")
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.json()["workflow_id"], wf_id)

    def test_step_workflow_api(self):
        res = self.client.post(
            "/api/workflows",
            json={"goal": "Step test goal"},
        )
        wf_id = res.json()["workflow_id"]

        step_res = self.client.post(f"/api/workflows/{wf_id}/step")
        self.assertEqual(step_res.status_code, 200)
        self.assertEqual(step_res.json()["current_stage"], 1)

    def test_pause_and_cancel_api(self):
        res = self.client.post(
            "/api/workflows",
            json={"goal": "Control test goal"},
        )
        wf_id = res.json()["workflow_id"]

        # Step first to make it active
        self.client.post(f"/api/workflows/{wf_id}/step")

        pause_res = self.client.post(f"/api/workflows/{wf_id}/pause")
        self.assertEqual(pause_res.status_code, 200)
        self.assertEqual(pause_res.json()["status"], "PAUSED")

        cancel_res = self.client.post(f"/api/workflows/{wf_id}/cancel")
        self.assertEqual(cancel_res.status_code, 200)
        self.assertEqual(cancel_res.json()["status"], "CANCELLED")

    def test_export_zip_api(self):
        res = self.client.get("/api/export/zip")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers["content-type"], "application/zip")
        self.assertTrue(len(res.content) > 100)


if __name__ == "__main__":
    unittest.main()
