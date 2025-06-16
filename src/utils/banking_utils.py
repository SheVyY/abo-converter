#!/usr/bin/env python3

"""
Banking Utilities for ABO Converter Suite
=========================================

Shared utility functions for Czech banking operations including
account validation, character conversion, and common formatting.

Author: Sebastian Hozak <hozaksebastian@gmail.com>
Created: 2025
License: MIT
"""

import re


def validate_account_modulo11(account_str):
    """
    Validate Czech account number using Modulo 11 algorithm.

    Czech account numbers use a specific checksum algorithm to validate
    both the prefix (optional) and main account number parts.

    Args:
        account_str (str): Account number in format "prefix-account" or just "account"

    Returns:
        bool: True if account number is valid, False otherwise
    """
    # Remove bank code if present
    if '/' in account_str:
        account_str = account_str.split('/')[0]

    # Remove dashes and spaces
    account_clean = re.sub(r'[-\s]', '', account_str)

    if not account_clean.isdigit():
        return False

    # Split into prefix and account number
    if '-' in account_str:
        parts = account_str.split('-')
        prefix = parts[0] if len(parts) > 1 else ''
        account = parts[-1]
    else:
        prefix = ''
        account = account_clean

    # Validate prefix (if exists)
    if prefix:
        prefix_clean = re.sub(r'[^0-9]', '', prefix)
        if prefix_clean:
            weights = [10, 5, 8, 4, 2, 1]
            checksum = sum(int(digit) * weights[i % len(weights)] for i, digit in enumerate(prefix_clean.zfill(6)))
            if checksum % 11 != 0:
                return False

    # Validate account number
    account_clean = re.sub(r'[^0-9]', '', account)
    if len(account_clean) > 10:
        return False

    weights = [6, 3, 7, 9, 10, 5, 8, 4, 2, 1]
    checksum = sum(int(digit) * weights[i] for i, digit in enumerate(account_clean.zfill(10)))

    return checksum % 11 == 0


def convert_czech_to_ascii(text):
    """
    Convert Czech characters to ASCII-safe equivalents for ABO format.
    
    ABO format requires ASCII-only characters, so Czech diacritics must
    be converted to their base equivalents.
    
    Args:
        text (str): Text with Czech characters
        
    Returns:
        str: ASCII-safe text with Czech characters converted
    """
    if not text:
        return text
        
    # Czech character conversion map
    conversions = {
        'Č': 'C', 'č': 'c', 'Ř': 'R', 'ř': 'r',
        'Š': 'S', 'š': 's', 'Ž': 'Z', 'ž': 'z',
        'Ý': 'Y', 'ý': 'y', 'Á': 'A', 'á': 'a',
        'É': 'E', 'é': 'e', 'Í': 'I', 'í': 'i',
        'Ó': 'O', 'ó': 'o', 'Ú': 'U', 'ú': 'u',
        'Ů': 'U', 'ů': 'u', 'Ě': 'E', 'ě': 'e',
        'Ď': 'D', 'ď': 'd', 'Ť': 'T', 'ť': 't',
        'Ň': 'N', 'ň': 'n'
    }
    
    # Apply conversions
    result = text
    for czech_char, ascii_char in conversions.items():
        result = result.replace(czech_char, ascii_char)
    
    return result


def format_account_number(account_str):
    """
    Format account number for ABO format.
    
    Handles various input formats and ensures consistent output
    for the ABO file format.
    
    Args:
        account_str (str): Account number in various formats
        
    Returns:
        str: Formatted account number or empty string if invalid
    """
    if not account_str:
        return ''
    
    # Clean input
    account_clean = str(account_str).strip()
    
    # Handle different formats
    if '/' in account_clean:
        # Format: account/bank_code or prefix-account/bank_code
        account_part = account_clean.split('/')[0]
        bank_code = account_clean.split('/')[1]
    else:
        account_part = account_clean
        bank_code = ''
    
    # Remove spaces and normalize dashes
    account_part = account_part.replace(' ', '').replace('–', '-').replace('—', '-')
    
    # Validate basic format
    if not re.match(r'^(\d{1,6}-)?(\d{1,10})$', account_part):
        return account_clean  # Return as-is if doesn't match expected pattern
    
    # Split prefix and account
    if '-' in account_part:
        prefix, account = account_part.split('-', 1)
        # Format: PPPPPP-AAAAAAAAAA
        formatted = f"{prefix.zfill(6)}-{account.zfill(10)}"
    else:
        # Format: AAAAAAAAAA (no prefix)
        formatted = account_part.zfill(10)
    
    # Add bank code back if present
    if bank_code:
        formatted += f"/{bank_code}"
    
    return formatted


def format_amount_to_cents(amount_str):
    """
    Convert decimal amount to integer cents format for ABO.
    
    Args:
        amount_str (str|float): Amount in decimal format (e.g., "1500.50")
        
    Returns:
        int: Amount in cents (e.g., 150050)
    """
    if not amount_str:
        return 0
        
    try:
        # Handle comma decimal separator
        amount_clean = str(amount_str).replace(',', '.')
        amount_float = float(amount_clean)
        return int(abs(amount_float) * 100)
    except (ValueError, TypeError):
        return 0


def format_symbol(symbol_value, pad_length=10):
    """
    Format symbol (VS, SS) for ABO format.
    
    Args:
        symbol_value (str): Symbol value
        pad_length (int): Length to pad to (default 10)
        
    Returns:
        str: Formatted symbol or empty string if not valid
    """
    if not symbol_value:
        return ''
        
    symbol_clean = str(symbol_value).strip()
    if symbol_clean == '0' or not symbol_clean:
        return ''
        
    # Ensure numeric
    if not symbol_clean.isdigit():
        return ''
        
    return symbol_clean.zfill(pad_length)