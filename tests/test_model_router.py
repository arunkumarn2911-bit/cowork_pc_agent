"""
Unit tests for ModelRouter and per-phase model selection matrix.
"""

import unittest
from unittest.mock import patch, MagicMock
from app.services.model_router import (
    ModelRouter,
    PHASE_CLARIFICATION,
    PHASE_PLANNING,
    PHASE_VERIFICATION,
    PHASE_REMEDIATION,
    DEFAULT_MODEL_MATRIX,
)


class TestModelRouter(unittest.TestCase):
    def setUp(self):
        self.router = ModelRouter(gemini_api_key="test-api-key")

    def test_default_matrix_contains_all_phases(self):
        config = self.router.get_config()
        self.assertIn(PHASE_CLARIFICATION, config)
        self.assertIn(PHASE_PLANNING, config)
        self.assertIn(PHASE_VERIFICATION, config)
        self.assertIn(PHASE_REMEDIATION, config)

    def test_update_config_and_set_phase_model(self):
        self.router.set_phase_model(PHASE_CLARIFICATION, "ollama", "qwen2.5:3b")
        cfg = self.router.get_config()
        self.assertEqual(cfg[PHASE_CLARIFICATION]["provider"], "ollama")
        self.assertEqual(cfg[PHASE_CLARIFICATION]["model"], "qwen2.5:3b")

        self.router.update_config({
            PHASE_PLANNING: {"provider": "gemini", "model": "gemini-4-argon"}
        })
        self.assertEqual(self.router.get_config()[PHASE_PLANNING]["model"], "gemini-4-argon")

    def test_ollama_offline_status_handling(self):
        # Should gracefully return offline status dictionary with remediation command without raising exception
        status = self.router.check_ollama_status()
        self.assertIn("online", status)
        self.assertIn("models", status)
        self.assertIn("remediation_cmd", status)

    def test_gemini_status_with_key(self):
        status = self.router.check_gemini_status()
        self.assertTrue(status["online"])
        self.assertTrue(status["has_key"])
        self.assertIn("gemini-3.8-flash", status["models"])

    @patch("app.services.ollama_client.OllamaClient.generate_json")
    def test_query_phase_ollama_success(self, mock_ollama_generate):
        mock_ollama_generate.return_value = {"ambiguous": False, "analysis": "Detailed requirements confirmed"}
        self.router.set_phase_model(PHASE_CLARIFICATION, "ollama", "qwen2.5:3b")
        
        result = self.router.query_phase(PHASE_CLARIFICATION, "Inspect chart AAPL")
        self.assertIsNotNone(result)
        self.assertFalse(result.get("ambiguous"))
        self.assertEqual(result.get("analysis"), "Detailed requirements confirmed")

    @patch("app.services.ollama_client.OllamaClient.generate_json")
    @patch("app.services.gemini_client.GeminiClient.generate_json")
    def test_query_phase_ollama_fallback_to_gemini(self, mock_gemini_generate, mock_ollama_generate):
        # Ollama fails (returns None)
        mock_ollama_generate.return_value = None
        # Gemini fallback succeeds
        mock_gemini_generate.return_value = {"recovered": True, "provider": "gemini_fallback"}

        self.router.set_phase_model(PHASE_PLANNING, "ollama", "qwen2.5:7b")
        result = self.router.query_phase(PHASE_PLANNING, "Plan workflow")

        self.assertIsNotNone(result)
        self.assertTrue(result.get("recovered"))


if __name__ == "__main__":
    unittest.main()
