"""
Cowork PC Agent - Autonomous Computer-Use Agent Package
"""

import os
import sys

# Automatically prepend persistent local package directory if present
_pkg_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".python_packages"))
if os.path.isdir(_pkg_dir) and _pkg_dir not in sys.path:
    sys.path.insert(0, _pkg_dir)

__version__ = "1.0.0"
