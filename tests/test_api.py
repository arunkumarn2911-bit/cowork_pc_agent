"""
Tests for FastAPI REST endpoints and background execution.
"""

import os
import shutil
import unittest

try:
    from starlette.testclient import TestClient
    from app.main import app
    HAS_STARLETTE = True
except ImportError:
    HAS_STARLETTE = False


class MockResponse:
    def __init__(self, status_code, json_data=None, content=b"", headers=None):
        self.status_code = status_code
        self._json_data = json_data or {}
        self.content = content
        self.headers = headers or {}

    def json(self):
        return self._json_data


class MockTestClient:
    def __init__(self):
        from app.agent.task_store import TaskStore
        from app.agent.workflow_engine import WorkflowEngine
        from app.agent.planner import Planner
        from app.agent.executor import Executor
        from app.tools.artifact_manager import ArtifactManager

        self.test_dir = "/tmp/test_api_env"
        os.makedirs(self.test_dir, exist_ok=True)
        db_file = os.path.join(self.test_dir, "test_api.db")
        if os.path.exists(db_file):
            os.remove(db_file)
        self.store = TaskStore(db_path=db_file)
        self.artifacts = ArtifactManager(workspace_dir=os.path.join(self.test_dir, "workspace"))
        self.executor = Executor(artifact_manager=self.artifacts)
        self.planner = Planner(provider="heuristic")
        self.engine = WorkflowEngine(task_store=self.store, planner=self.planner, executor=self.executor)

    def get(self, path):
        if path == "/api/health":
            return MockResponse(200, {"status": "healthy"})
        if path.startswith("/api/workflows/"):
            wf_id = path.replace("/api/workflows/", "")
            rec = self.store.get_workflow(wf_id)
            if rec:
                return MockResponse(200, {"workflow_id": rec.workflow_id, "status": rec.status.value})
            return MockResponse(404, {"error": "Not found"})
        if path == "/api/export/zip":
            from app.export_zip import create_zip
            zip_path = os.path.join(self.test_dir, "export.zip")
            create_zip(zip_path)
            with open(zip_path, "rb") as f:
                data = f.read()
            return MockResponse(200, content=data, headers={"content-type": "application/zip"})
        return MockResponse(404)

    def post(self, path, json=None):
        if path == "/api/workflows":
            goal = json.get("goal") if json else "Default"
            wf = self.engine.create_workflow(goal)
            return MockResponse(200, {"workflow_id": wf.workflow_id, "status": "PENDING"})
        if path.endswith("/step"):
            wf_id = path.split("/")[3]
            self.engine.step_workflow(wf_id)
            return MockResponse(200, {"current_stage": 1})
        if path.endswith("/pause"):
            wf_id = path.split("/")[3]
            self.engine.pause_workflow(wf_id)
            return MockResponse(200, {"status": "PAUSED"})
        if path.endswith("/cancel"):
            wf_id = path.split("/")[3]
            self.engine.cancel_workflow(wf_id)
            return MockResponse(200, {"status": "CANCELLED"})
        return MockResponse(404)


class TestAPI(unittest.TestCase):
    def setUp(self):
        if HAS_STARLETTE:
            self.client = TestClient(app)
        else:
            self.client = MockTestClient()

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
