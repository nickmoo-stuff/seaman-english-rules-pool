"""Validate the currently selected browser release (v1.0.0/build 1595).
The previous immutable release is also checked for byte-for-byte preservation.
"""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('v1-pages-static.py')),run_name='__main__')
