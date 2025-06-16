#!/usr/bin/env python3

"""
ABO Converter Suite - Main Entry Point
=====================================

Convenience script that calls the main orchestrator from the src/ directory.
This allows running the converter from the project root without changing paths.

Usage:
    python3 abo_converter.py --help
    python3 abo_converter.py --csv-to-abo input.csv --output output.kpc
"""

import os
import sys

# Add src directory to path and import main orchestrator
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from main import main

if __name__ == '__main__':
    sys.exit(main())
