"""
Gemini Model Client for cloud-powered planning and vision reasoning.
"""

from __future__ import annotations
import json
import os
from typing import Any, Dict, List, Optional
import urllib.request
import urllib.error


class GeminiClient:
    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-2.5-flash"):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "")
        self.model = model

    def is_available(self) -> bool:
        return bool(self.api_key.strip())

    def generate_json(self, prompt: str, system: Optional[str] = None) -> Optional[Dict[str, Any]]:
        if not self.is_available():
            return None

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        contents = []
        if system:
            contents.append({"role": "user", "parts": [{"text": f"System Directive:\n{system}"}]})
            contents.append({"role": "model", "parts": [{"text": "Understood. I will follow the system directive."}]})
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        body = {
            "contents": contents,
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.2,
            },
        }

        data = json.dumps(body).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data_resp = json.loads(resp.read().decode("utf-8"))
                text = data_resp["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(text)
        except Exception:
            return None
