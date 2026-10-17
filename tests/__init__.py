"""
Test suite for Cowork PC Agent autonomous computer-use framework.
"""

import os
import sys

_pkg_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".python_packages"))
if os.path.isdir(_pkg_dir) and _pkg_dir not in sys.path:
    sys.path.append(_pkg_dir)
