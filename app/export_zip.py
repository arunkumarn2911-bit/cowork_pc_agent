"""
Standalone zip packager for Cowork PC Agent codebase.
"""

import os
import sys
import zipfile
from pathlib import Path


def create_zip(output_path: str = "cowork_pc_agent.zip") -> str:
    root_dir = Path(".").resolve()
    target = Path(output_path).resolve()

    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in root_dir.rglob("*"):
            rel = p.relative_to(root_dir)
            rel_str = str(rel).replace("\\", "/")

            if any(part in rel.parts for part in ("node_modules", ".git", ".aistudio", "__pycache__", "dist", ".cache", ".python_packages")):
                continue
            if rel_str.endswith(".pyc") or rel_str.endswith(".db"):
                continue

            if p.is_file() and p != target:
                zf.write(p, arcname=rel_str)

    print(f"Created package: {target} ({target.stat().st_size} bytes)")
    return str(target)


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "cowork_pc_agent.zip"
    create_zip(out)
