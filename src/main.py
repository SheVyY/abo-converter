#!/usr/bin/env python3

"""
ABO Converter Suite - Main Orchestrator
=======================================

This is the main entry point for the ABO (Automatic Banking Operations)
converter suite. It provides a unified interface for all conversion and
validation operations.

Supported operations:
- CSV to ABO conversion (Raiffeisenbank, FIO Bank)
- ABO file validation (multi-bank)
- File format analysis

Author: Sebastian Hozak <hozaksebastian@gmail.com>
Created: 2025
License: MIT

Usage:
    python3 abo_converter.py --help
    python3 abo_converter.py --csv-to-abo input.csv --output output.kpc
    python3 abo_converter.py --validate file.kpc
"""

import argparse
import os
import sys

# Add current directory to path for importing our modules
sys.path.append(os.path.dirname(__file__))

# Import converter classes
from csv_to_abo_raiffeisen import CSV_to_ABO_Raiffeisen
from csv_to_abo_fio import CSV_to_ABO_FIO
from abo_validator import validate_abo_file

def show_help():
    """Show help for the ABO converter suite"""
    print("""
ABO Converter Suite
==================

Available operations:

1. CSV to ABO Raiffeisen:
   python3 src/csv_to_abo_raiffeisen.py input.csv [output.kpc] [client_name]

2. CSV to ABO FIO Bank:
   python3 src/csv_to_abo_fio.py input.csv [output.kpc] [client_name]

3. ABO file validation:
   python3 src/abo_validator.py file.kpc

4. This orchestrator:
   python3 abo_converter.py [options]

Orchestrator Options:
  --help              Show this help
  --csv-to-abo FILE   Convert CSV to ABO format
  --validate FILE     Validate ABO/KPC file format
  --bank BANK         Specify bank (raiffeisen, fio, csob) - default: raiffeisen
  --output FILE       Output file path
  --client NAME       Client name for headers

Examples:
  # Convert CSV to Raiffeisen ABO
  python3 abo_converter.py --csv-to-abo input.csv --bank raiffeisen --output output.kpc --client "MY COMPANY"

  # Convert CSV to FIO Bank ABO
  python3 abo_converter.py --csv-to-abo input.csv --bank fio --output output.kpc --client "MY COMPANY"

  # Validate ABO file
  python3 abo_converter.py --validate file.kpc
""")


def run_csv_to_abo_raiffeisen(input_file, output_file=None, client='KLIENT'):
    """Run CSV to ABO Raiffeisen conversion"""
    try:
        converter = CSV_to_ABO_Raiffeisen()
        converter.read_csv(input_file)
        converter.write_abo(output_file, client)
        return 0
    except Exception as e:
        print(f"Error: {e}")
        return 1

def run_csv_to_abo_fio(input_file, output_file=None, client='KLIENT'):
    """Run CSV to ABO FIO Bank conversion"""
    try:
        converter = CSV_to_ABO_FIO()
        converter.read_csv(input_file)
        converter.write_abo(output_file, client)
        return 0
    except Exception as e:
        print(f"Error: {e}")
        return 1

def run_validate(input_file):
    """Run ABO file validation"""
    try:
        errors = validate_abo_file(input_file)
        if errors:
            print("Validation errors found:")
            for error in errors:
                print(f"  - {error}")
            return 1
        else:
            print("File validation passed successfully")
            return 0
    except Exception as e:
        print(f"Error validating file: {e}")
        return 1

def main():
    parser = argparse.ArgumentParser(description='ABO Converter Suite', add_help=False)
    parser.add_argument('--help', action='store_true', help='Show help')
    parser.add_argument('--csv-to-abo', metavar='FILE', help='Convert CSV to ABO')
    parser.add_argument('--validate', metavar='FILE', help='Validate ABO/KPC file')
    parser.add_argument('--bank', choices=['raiffeisen', 'fio', 'csob'], default='raiffeisen', help='Target bank')
    parser.add_argument('--output', metavar='FILE', help='Output file path')
    parser.add_argument('--client', metavar='NAME', default='KLIENT', help='Client name')

    args = parser.parse_args()

    if args.help or len(sys.argv) == 1:
        show_help()
        return 0

    # Validate input files exist
    input_files = [f for f in [args.csv_to_abo, args.validate] if f]
    for file in input_files:
        if not os.path.isfile(file):
            print(f"Error: Input file '{file}' does not exist.")
            return 1

    result = 0

    if args.csv_to_abo:
        print(f"Converting CSV to ABO ({args.bank}): {args.csv_to_abo}")
        if args.bank == 'raiffeisen':
            result = run_csv_to_abo_raiffeisen(args.csv_to_abo, args.output, args.client)
        elif args.bank == 'fio':
            result = run_csv_to_abo_fio(args.csv_to_abo, args.output, args.client)
        else:
            print(f"Error: Bank '{args.bank}' not yet supported for ABO conversion.")
            print("Supported banks: raiffeisen, fio")
            return 1

    elif args.validate:
        print(f"Validating ABO file: {args.validate}")
        result = run_validate(args.validate)

    else:
        print("Error: No operation specified. Use --help for usage information.")
        return 1

    if result == 0:
        print("✓ Operation completed successfully")
        if args.output:
            print(f"Output saved to: {args.output}")
    else:
        print("✗ Operation failed")

    return result

if __name__ == '__main__':
    sys.exit(main())
