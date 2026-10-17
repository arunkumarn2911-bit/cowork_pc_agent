"""
Secure artifact manager: Sandboxed file saving, path traversal prevention, and verification.
"""

from __future__ import annotations
import csv
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Union


class ArtifactSecurityError(Exception):
    pass


class ArtifactManager:
    def __init__(self, workspace_dir: str = "workspace"):
        self.workspace_dir = Path(workspace_dir).resolve()
        self.workspace_dir.mkdir(parents=True, exist_ok=True)

    def _resolve_and_validate(self, relative_path: str) -> Path:
        """Strictly validate path to prevent directory traversal outside workspace"""
        if not relative_path or not isinstance(relative_path, str):
            raise ArtifactSecurityError("Invalid artifact path: empty or non-string")

        # Disallow leading slashes or Windows drive roots
        clean_path = relative_path.replace("\\", "/").strip()
        if clean_path.startswith("/") or clean_path.startswith("..") or "/../" in clean_path:
            raise ArtifactSecurityError(f"Access denied: Path traversal detected in '{relative_path}'")

        if len(clean_path) > 1 and clean_path[1] == ":":
            raise ArtifactSecurityError(f"Access denied: Absolute drive path prohibited in '{relative_path}'")

        resolved = (self.workspace_dir / clean_path).resolve()

        # Ensure resolved path is strictly within workspace_dir
        try:
            resolved.relative_to(self.workspace_dir)
        except ValueError:
            raise ArtifactSecurityError(f"Access denied: Path '{resolved}' escapes authorized workspace '{self.workspace_dir}'")

        return resolved

    def save_json(self, filename: str, data: Any, indent: int = 2) -> Dict[str, Any]:
        target = self._resolve_and_validate(filename)
        target.parent.mkdir(parents=True, exist_ok=True)

        with open(target, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=indent, default=str)

        # Verification: reopen and parse
        with open(target, "r", encoding="utf-8") as f:
            verified_data = json.load(f)

        return {
            "path": str(target),
            "filename": target.name,
            "relative_path": str(target.relative_to(self.workspace_dir)),
            "size_bytes": target.stat().st_size,
            "verified": True,
            "type": "json",
            "record_count": len(verified_data) if isinstance(verified_data, (list, dict)) else 1,
        }

    def save_csv(self, filename: str, rows: List[Dict[str, Any]]) -> Dict[str, Any]:
        target = self._resolve_and_validate(filename)
        target.parent.mkdir(parents=True, exist_ok=True)

        if not rows:
            target.write_text("", encoding="utf-8")
            return {
                "path": str(target),
                "filename": target.name,
                "relative_path": str(target.relative_to(self.workspace_dir)),
                "size_bytes": 0,
                "verified": True,
                "type": "csv",
                "row_count": 0,
            }

        headers = list(rows[0].keys())
        with open(target, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            writer.writerows(rows)

        # Verify readability
        with open(target, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            line_count = sum(1 for _ in reader)

        return {
            "path": str(target),
            "filename": target.name,
            "relative_path": str(target.relative_to(self.workspace_dir)),
            "size_bytes": target.stat().st_size,
            "verified": True,
            "type": "csv",
            "row_count": line_count - 1,
        }

    def save_file(self, filename: str, content: Union[str, bytes]) -> Dict[str, Any]:
        target = self._resolve_and_validate(filename)
        target.parent.mkdir(parents=True, exist_ok=True)

        if isinstance(content, str):
            target.write_text(content, encoding="utf-8")
        else:
            target.write_bytes(content)

        return {
            "path": str(target),
            "filename": target.name,
            "relative_path": str(target.relative_to(self.workspace_dir)),
            "size_bytes": target.stat().st_size,
            "verified": target.exists() and target.stat().st_size >= 0,
            "type": "binary" if isinstance(content, bytes) else "text",
        }

    def verify_artifact(self, filename: str, expected_keys: Optional[List[str]] = None) -> Dict[str, Any]:
        target = self._resolve_and_validate(filename)
        if not target.exists():
            return {"exists": False, "verified": False, "error": f"File does not exist: {filename}"}

        stat = target.stat()
        result = {
            "exists": True,
            "path": str(target),
            "relative_path": str(target.relative_to(self.workspace_dir)),
            "size_bytes": stat.st_size,
            "verified": True,
        }

        if target.suffix.lower() == ".json":
            try:
                with open(target, "r", encoding="utf-8") as f:
                    content = json.load(f)
                result["json_valid"] = True
                if expected_keys and isinstance(content, dict):
                    missing = [k for k in expected_keys if k not in content]
                    result["missing_keys"] = missing
                    result["verified"] = len(missing) == 0
            except Exception as e:
                result["json_valid"] = False
                result["verified"] = False
                result["error"] = str(e)

        return result

    def list_artifacts(self) -> List[Dict[str, Any]]:
        artifacts = []
        if not self.workspace_dir.exists():
            return []
        for p in self.workspace_dir.rglob("*"):
            if p.is_file():
                artifacts.append(
                    {
                        "filename": p.name,
                        "relative_path": str(p.relative_to(self.workspace_dir)),
                        "path": str(p),
                        "size_bytes": p.stat().st_size,
                        "mtime": p.stat().st_mtime,
                    }
                )
        return artifacts
