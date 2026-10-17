"""
Desktop automation controller using PyAutoGUI with strict failsafe checks,
window bounds inspection, and headless simulation fallback.
"""

from __future__ import annotations
import base64
import os
import platform
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
from app.agent.action_schema import Observation


class DesktopError(Exception):
    pass


class DesktopController:
    def __init__(self):
        self.os_name = platform.system()
        self._pyautogui = None
        self._headless = True
        self._init_pyautogui()

    def _init_pyautogui(self) -> None:
        try:
            # Check for display server on Linux or graphical desktop
            if self.os_name == "Linux" and not os.environ.get("DISPLAY"):
                self._headless = True
                return

            import pyautogui
            pyautogui.FAILSAFE = True
            pyautogui.PAUSE = 0.1
            self._pyautogui = pyautogui
            self._headless = False
        except Exception:
            self._headless = True

    def desktop_inspect(self) -> Observation:
        active_title = "Desktop Environment"
        if not self._headless and self._pyautogui:
            try:
                screen_width, screen_height = self._pyautogui.size()
                active_title = f"Screen {screen_width}x{screen_height} ({self.os_name})"
            except Exception:
                pass

        return Observation(
            timestamp=time.time(),
            page_title=active_title,
            active_window=active_title,
            visible_text=f"Desktop OS: {self.os_name} | Headless: {self._headless}",
            raw_status="ok",
            loading=False,
        )

    def desktop_click(self, x: int, y: int, clicks: int = 1) -> Dict[str, Any]:
        if x < 0 or y < 0:
            raise DesktopError(f"Invalid desktop coordinates: ({x}, {y})")

        if not self._headless and self._pyautogui:
            try:
                width, height = self._pyautogui.size()
                if x > width or y > height:
                    raise DesktopError(f"Coordinates ({x}, {y}) exceed screen resolution ({width}, {height})")
                self._pyautogui.click(x=x, y=y, clicks=clicks)
                return {"x": x, "y": y, "clicks": clicks, "status": "clicked"}
            except Exception as e:
                raise DesktopError(f"PyAutoGUI click failed: {e}")

        # Simulated fallback
        return {"x": x, "y": y, "clicks": clicks, "status": "simulated_click", "headless": True}

    def desktop_type(self, text: str, interval: float = 0.05) -> Dict[str, Any]:
        if not self._headless and self._pyautogui:
            try:
                self._pyautogui.write(text, interval=interval)
                return {"text_len": len(text), "status": "typed"}
            except Exception as e:
                raise DesktopError(f"PyAutoGUI type failed: {e}")

        return {"text_len": len(text), "status": "simulated_typed", "headless": True}

    def desktop_hotkey(self, keys: List[str]) -> Dict[str, Any]:
        if not keys:
            raise DesktopError("desktop_hotkey requires non-empty keys list")

        if not self._headless and self._pyautogui:
            try:
                self._pyautogui.hotkey(*keys)
                return {"keys": keys, "status": "hotkey_executed"}
            except Exception as e:
                raise DesktopError(f"PyAutoGUI hotkey failed: {e}")

        return {"keys": keys, "status": "simulated_hotkey", "headless": True}

    def desktop_screenshot(self, target_path: str) -> str:
        Path(target_path).parent.mkdir(parents=True, exist_ok=True)
        if not self._headless and self._pyautogui:
            try:
                screenshot = self._pyautogui.screenshot()
                screenshot.save(target_path)
                return str(target_path)
            except Exception:
                pass

        # Headless mock screenshot
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        with open(target_path, "wb") as f:
            f.write(png_data)
        return str(target_path)
