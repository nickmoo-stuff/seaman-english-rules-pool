"""Check the active maintenance browser release and frozen published bundles."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('maintenance-assets.py')),run_name='__main__')
