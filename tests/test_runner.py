#!/usr/bin/env python3

"""
Test runner for ABO Converter Suite

Author: Sebastian Hozak <hozaksebastian@gmail.com>
"""

import argparse
import os
import sys
import unittest

# Add project root to path
project_root = os.path.join(os.path.dirname(__file__), '..')
sys.path.insert(0, project_root)


def discover_tests(test_dir='tests', pattern='test_*.py'):
    """Discover and load tests from directory"""
    loader = unittest.TestLoader()
    return loader.discover(test_dir, pattern=pattern)


def run_unit_tests():
    """Run only unit tests"""
    loader = unittest.TestLoader()
    return loader.discover('tests/unit', pattern='test_*.py')


def run_integration_tests():
    """Run only integration tests"""
    loader = unittest.TestLoader()
    return loader.discover('tests/integration', pattern='test_*.py')


def main():
    """Main test runner"""
    parser = argparse.ArgumentParser(description='ABO Converter Test Runner')
    parser.add_argument('--unit', action='store_true', help='Run only unit tests')
    parser.add_argument('--integration', action='store_true', help='Run only integration tests')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    parser.add_argument('--pattern', default='test_*.py', help='Test file pattern')
    parser.add_argument('--failfast', action='store_true', help='Stop on first failure')

    args = parser.parse_args()

    # Set verbosity
    verbosity = 2 if args.verbose else 1

    # Create test runner
    runner = unittest.TextTestRunner(
        verbosity=verbosity,
        failfast=args.failfast,
        buffer=True
    )

    # Discover tests based on arguments
    if args.unit:
        suite = run_unit_tests()
    elif args.integration:
        suite = run_integration_tests()
    else:
        suite = discover_tests(pattern=args.pattern)

    # Run tests
    result = runner.run(suite)

    # Print summary
    failures = len(result.failures)
    errors = len(result.errors)
    len(result.skipped) if hasattr(result, 'skipped') else 0


    if failures or errors:
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
