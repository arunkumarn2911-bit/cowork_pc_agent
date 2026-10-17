"""
ModelRouter: Multi-Model Matrix for Phase-Specific Execution.
Allows dynamically routing each phase (Clarification, Planning, Verification, Remediation)
to either a local Ollama model (e.g. qwen2.5:3b, llama3.2:3b, qwen2.5:7b) or Google Gemini API.
"""

from __future__ import annotations
import json
import logging
import os
import time
from typing import Any, Dict, List, Optional
import urllib.request
import urllib.error

from app.services.ollama_client import OllamaClient
from app.services.gemini_client import GeminiClient

logger = logging.getLogger("model_router")

# Phase keys
PHASE_CLARIFICATION = "clarification"
PHASE_PLANNING = "planning"
PHASE_VERIFICATION = "verification"
PHASE_REMEDIATION = "remediation"

DEFAULT_MODEL_MATRIX: Dict[str, Dict[str, Any]] = {
    PHASE_CLARIFICATION: {
        "provider": "gemini",
        "model": "gemini-3.8-flash",
        "description": "Fast conversational intent triage & interactive clarification",
        "temperature": 0.2,
    },
    PHASE_PLANNING: {
        "provider": "gemini",
        "model": "gemini-3.8-flash",
        "description": "High-reasoning action plan (DAG) decomposition into sub-agents",
        "temperature": 0.1,
    },
    PHASE_VERIFICATION: {
        "provider": "ollama",
        "model": "qwen2.5:3b",
        "description": "Deterministic post-condition and DOM verification",
        "temperature": 0.0,
    },
    PHASE_REMEDIATION: {
        "provider": "gemini",
        "model": "gemini-3.8-flash",
        "description": "Failure diagnosis and automated recovery path generation",
        "temperature": 0.2,
    },
}


class ModelRouter:
    def __init__(
        self,
        config: Optional[Dict[str, Dict[str, Any]]] = None,
        ollama_base_url: Optional[str] = None,
        gemini_api_key: Optional[str] = None,
    ):
        self.config = config or dict(DEFAULT_MODEL_MATRIX)
        self.ollama_base_url = ollama_base_url or os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
        self.gemini_api_key = gemini_api_key or os.environ.get("GEMINI_API_KEY", "")
        self.auto_fallback_to_gemini = True

    def get_config(self) -> Dict[str, Dict[str, Any]]:
        return self.config

    def update_config(self, new_config: Dict[str, Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        for phase, cfg in new_config.items():
            if phase in self.config:
                self.config[phase].update(cfg)
            else:
                self.config[phase] = cfg
        return self.config

    def set_phase_model(self, phase: str, provider: str, model: str) -> None:
        if phase not in self.config:
            self.config[phase] = {}
        self.config[phase]["provider"] = provider
        self.config[phase]["model"] = model

    def check_ollama_status(self) -> Dict[str, Any]:
        """Check if local Ollama daemon is responsive and list available models"""
        try:
            req = urllib.request.Request(f"{self.ollama_base_url}/api/tags")
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    models = [m.get("name", "") for m in data.get("models", [])]
                    return {
                        "online": True,
                        "base_url": self.ollama_base_url,
                        "models": models,
                        "count": len(models),
                    }
        except Exception as e:
            logger.debug(f"Ollama status check failed: {e}")

        # Return structured offline status with common popular models for UI selection
        return {
            "online": False,
            "base_url": self.ollama_base_url,
            "models": ["qwen2.5:3b", "qwen2.5:7b", "llama3.2:3b", "phi3.5:3.8b", "mistral:7b"],
            "count": 0,
            "remediation_cmd": "ollama serve",
        }

    def check_gemini_status(self) -> Dict[str, Any]:
        has_key = bool(self.gemini_api_key.strip())
        return {
            "online": has_key,
            "has_key": has_key,
            "models": ["gemini-3.8-flash", "gemini-4-argon", "gemini-3.1-flash-lite"],
        }

    def test_model_latency(self, provider: str, model: str) -> Dict[str, Any]:
        """Test model connectivity and measure latency"""
        start_time = time.time()
        test_prompt = "Respond with JSON: {\"status\": \"ok\", \"ping\": \"pong\"}"

        if provider == "ollama":
            client = OllamaClient(base_url=self.ollama_base_url, model=model)
            res = client.generate_json(test_prompt)
            latency_ms = round((time.time() - start_time) * 1000, 1)
            if res:
                return {"success": True, "provider": provider, "model": model, "latency_ms": latency_ms, "result": res}
            return {
                "success": False,
                "provider": provider,
                "model": model,
                "latency_ms": latency_ms,
                "error": "Ollama daemon unreachable or model not pulled (run: ollama pull " + model + ")",
            }
        else:
            client = GeminiClient(api_key=self.gemini_api_key, model=model)
            res = client.generate_json(test_prompt)
            latency_ms = round((time.time() - start_time) * 1000, 1)
            if res:
                return {"success": True, "provider": provider, "model": model, "latency_ms": latency_ms, "result": res}
            return {
                "success": False,
                "provider": provider,
                "model": model,
                "latency_ms": latency_ms,
                "error": "Gemini API unavailable or API key not configured",
            }

    def query_phase(
        self,
        phase: str,
        prompt: str,
        system_prompt: Optional[str] = None,
        schema: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Execute an LLM call for a specific lifecycle phase according to the configured matrix.
        Falls back safely if the preferred local provider is offline.
        """
        phase_cfg = self.config.get(phase, DEFAULT_MODEL_MATRIX.get(phase, {}))
        provider = phase_cfg.get("provider", "gemini")
        model = phase_cfg.get("model", "gemini-3.8-flash")

        # Attempt preferred provider
        if provider == "ollama":
            client = OllamaClient(base_url=self.ollama_base_url, model=model)
            res = client.generate_json(prompt, system=system_prompt)
            if res is not None:
                return res

            logger.warning(f"Ollama '{model}' failed for phase '{phase}'. Checking fallback...")
            if self.auto_fallback_to_gemini and self.gemini_api_key:
                fallback_client = GeminiClient(api_key=self.gemini_api_key, model="gemini-3.8-flash")
                res = fallback_client.generate_json(prompt, system=system_prompt)
                if res is not None:
                    logger.info(f"Fallback to Gemini succeeded for phase '{phase}'")
                    return res

        elif provider == "gemini":
            client = GeminiClient(api_key=self.gemini_api_key, model=model)
            res = client.generate_json(prompt, system=system_prompt)
            if res is not None:
                return res

            logger.warning(f"Gemini '{model}' failed for phase '{phase}'. Checking local fallback...")
            ollama_status = self.check_ollama_status()
            if ollama_status["online"] and ollama_status["models"]:
                fallback_model = ollama_status["models"][0]
                fallback_client = OllamaClient(base_url=self.ollama_base_url, model=fallback_model)
                res = fallback_client.generate_json(prompt, system=system_prompt)
                if res is not None:
                    return res

        return None
