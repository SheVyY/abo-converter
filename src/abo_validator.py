#!/usr/bin/env python3

"""
ABO File Format Validator
========================

This script validates ABO (Automatic Banking Operations) files according to
the Czech banking standard. It supports various bank implementations including
Raiffeisenbank, FIO Bank, and others.

The validator checks:
- File structure (UHL1 header, file header, groups, items, terminators)
- Header formats and lengths
- Group and payment item consistency
- Proper file termination

Author: Sebastian Hozak <hozaksebastian@gmail.com>
Created: 2025
License: MIT

Usage:
    python3 validate_abo.py filename.kpc
"""

import sys


def validate_abo_file(filename):
    """
    Validate ABO file format according to Czech banking specifications.

    Performs comprehensive validation of:
    - UHL1 header structure (58 characters)
    - File header format
    - Group headers and payment items
    - Proper nesting and termination

    Args:
        filename (str): Path to ABO file to validate

    Returns:
        list: List of validation error messages (empty if valid)
    """
    with open(filename, encoding='windows-1250') as fp:
        lines = [line.rstrip('\r\n') for line in fp]

    errors = []
    line_num = 0

    # Check UHL1 header
    if not lines:
        errors.append("File is empty")
        return errors

    line_num += 1
    uhl1 = lines[0]
    if not uhl1.startswith('UHL1'):
        errors.append(f"Line {line_num}: Missing UHL1 header")
    elif len(uhl1) != 58:
        errors.append(f"Line {line_num}: UHL1 header should be 58 characters, got {len(uhl1)}")

    # Check file header
    if len(lines) < 2:
        errors.append("Missing file header")
        return errors

    line_num += 1
    file_header = lines[1]
    if not file_header.startswith('1 '):
        errors.append(f"Line {line_num}: File header should start with '1 '")

    # Parse remaining lines
    expecting_group_header = True
    in_group = False

    for i in range(2, len(lines)):
        line_num += 1
        line = lines[i]

        if line.startswith('2 '):  # Group header
            if not expecting_group_header:
                errors.append(f"Line {line_num}: Unexpected group header")
            in_group = True
            expecting_group_header = False

        elif line == '3 +':  # Group end
            if not in_group:
                errors.append(f"Line {line_num}: Group end without group start")
            in_group = False
            expecting_group_header = True

        elif line == '5 +':  # File end
            if in_group:
                errors.append(f"Line {line_num}: File end while in group")
            if i != len(lines) - 1:
                errors.append(f"Line {line_num}: File end should be last line")
            break

        else:  # Payment item
            if not in_group:
                errors.append(f"Line {line_num}: Payment item outside group")

            # Basic validation of payment item format
            parts = line.split()
            if len(parts) < 3:
                errors.append(f"Line {line_num}: Payment item has too few fields")

    if 'Line ' + str(len(lines)) + ': ' not in ' '.join(errors) and not any('5 +' in l for l in lines):
        errors.append("Missing file end marker '5 +'")

    return errors

def print_abo_structure(filename):
    """Print ABO file structure for analysis"""
    with open(filename, encoding='windows-1250') as fp:
        lines = [line.rstrip('\r\n') for line in fp]

    print(f"\nABO File Structure Analysis: {filename}")
    print("=" * 50)
    
    group_count = 0
    payment_count = 0
    
    for i, line in enumerate(lines, 1):
        line_type = "UNKNOWN"
        details = ""
        
        if line.startswith('UHL1'):
            line_type = "HEADER"
            details = f"UHL1 header ({len(line)} chars)"
            
        elif line.startswith('1 '):
            line_type = "FILE_HEADER"
            parts = line.split()
            details = f"File header - Type: {parts[1] if len(parts) > 1 else 'N/A'}, Bank: {parts[3] if len(parts) > 3 else 'N/A'}"

        elif line.startswith('2 '):
            line_type = "GROUP_HEADER"
            group_count += 1
            parts = line.split()
            if len(parts) >= 3:
                details = f"Group {group_count} - Amount: {parts[-2] if len(parts) > 1 else 'N/A'}, Date: {parts[-1] if len(parts) > 0 else 'N/A'}"

        elif line in {'3 +', '5 +'}:
            line_type = "TERMINATOR"
            details = "Group end" if line == '3 +' else "File end"

        else:
            line_type = "PAYMENT"
            payment_count += 1
            parts = line.split(' AV:', 1)
            fields = parts[0].split()
            av_field = parts[1] if len(parts) > 1 else None

            if fields:
                account = fields[0] if len(fields) > 0 else 'N/A'
                amount = fields[1] if len(fields) > 1 else 'N/A'
                details = f"Payment {payment_count} - Account: {account}, Amount: {amount}"
                if av_field:
                    details += f", Note: {av_field[:30]}{'...' if len(av_field) > 30 else ''}"
        
        print(f"Line {i:3d}: {line_type:12} - {details}")
    
    print(f"\nSummary: {group_count} groups, {payment_count} payments")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(1)

    filename = sys.argv[1]

    # Validate format
    errors = validate_abo_file(filename)

    if errors:
        print("Validation errors found:")
        for error in errors:
            print(f"  - {error}")
        print()
    else:
        print("✓ File validation passed successfully\n")

    # Print structure
    print_abo_structure(filename)
