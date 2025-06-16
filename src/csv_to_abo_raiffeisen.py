#!/usr/bin/env python3

"""
CSV to ABO Converter for Raiffeisenbank
======================================

This script converts CSV files containing payment data into ABO format
specifically designed for Raiffeisenbank (bank code 5500).

ABO (Automatic Banking Operations) is a standardized text format used by
Czech banks for exchanging payment information. Each bank has slight
variations in their implementation.

Author: Sebastian Hozak <hozaksebastian@gmail.com>
Created: 2025
License: MIT

Usage:
    python3 csv2abo_raiffeisen.py input.csv [output.kpc] [client_name]

CSV Format Expected:
    - vlastní účet: Payer account number
    - účet protistrany: Payee account number
    - částka: Amount (decimal format)
    - VS: Variable symbol
    - KS: Constant symbol
    - SS: Specific symbol
    - název účtu prostistrany: Payee name
    - datum zaúčtování: Due date (DD.MM.YYYY or YYYY-MM-DD)
"""

import csv
import os
import re
import sys
from datetime import datetime
from utils.banking_utils import validate_account_modulo11, convert_czech_to_ascii, format_account_number

# Configuration constants
OUTPUT_ENCODING = 'windows-1250'  # Required encoding for ABO files
RAIFFEISEN_BANK_CODE = '5500'     # Raiffeisenbank code

# Python version check


class CSV_to_ABO_Raiffeisen:
    """
    Converter class for transforming CSV payment data into Raiffeisenbank ABO format.

    The ABO format consists of:
    1. UHL1 header (58 characters)
    2. File header (data type and bank code)
    3. Groups of payments with headers and items
    4. Group and file terminators
    """

    def __init__(self):
        """Initialize the converter with empty data and current date."""
        self.csv_data = []                    # Will store parsed CSV records
        self.creation_date = datetime.now()   # Used for file headers and dates


    def format_account_number(self, account_str):
        """
        Format account number for ABO format.

        Handles various input formats and ensures consistent output
        for the ABO file format.

        Args:
            account_str (str): Account number in various formats

        Returns:
            str: Formatted account number for ABO
        """
        if not account_str:
            return ''

        # Clean account string
        account_clean = str(account_str).strip()

        # Handle format with bank code
        if '/' in account_clean:
            account_part, bank_code = account_clean.split('/', 1)
        else:
            account_part = account_clean
            bank_code = ''

        # Format account part
        if '-' in account_part:
            # Already has prefix-account format
            formatted_account = account_part
        else:
            # No prefix, just account number
            formatted_account = account_part

        # Add bank code if needed and not Raiffeisen
        if bank_code and bank_code != RAIFFEISEN_BANK_CODE:
            formatted_account += '/' + bank_code

        return formatted_account

    def generate_uhl1_header(self, client_name):
        """
        Generate UHL1 file header (58 characters total).

        UHL1 header structure:
        - Positions 1-4: "UHL1" (record type)
        - Positions 5-10: Creation date (DDMMYY)
        - Positions 11-30: Client name (20 chars, uppercase, ASCII only)
        - Positions 31-58: Fixed fields for security codes and intervals

        Args:
            client_name (str): Name of the client (will be converted to ASCII)

        Returns:
            str: 58-character UHL1 header
        """
        # UHL1 + creation date (DDMMYY) + client name (20 chars) + fixed fields
        header = 'UHL1'
        header += self.creation_date.strftime('%d%m%y')
        # Convert to ASCII-safe characters and uppercase
        safe_name = convert_czech_to_ascii(client_name)
        header += safe_name[:20].ljust(20).upper()  # No lowercase allowed
        header += '1234567890'  # Client ID (10 chars)
        header += '001'         # File interval start
        header += '999'         # File interval end
        header += '111111'      # Security code fixed
        header += '222222'      # Security code secret
        return header

    def generate_file_header(self, data_type='1501'):
        """
        Generate accounting file header.

        Format: "1 DDDD NNNNNN BBBB"
        Where:
        - 1: Record type
        - DDDD: Data type (1501=payment orders, 1502=collection orders)
        - NNNNNN: File number (default 111111)
        - BBBB: Bank code (5500 for Raiffeisenbank)

        Args:
            data_type (str): Type of data (default '1501' for payment orders)

        Returns:
            str: Formatted file header
        """
        # Format: "1 DDDD NNNNNN 5500"
        return f"1 {data_type} 111111 {RAIFFEISEN_BANK_CODE}"

    def generate_group_header(self, payer_account, total_amount, due_date):
        """
        Generate group header for a batch of payments.

        Format: "2 [account] amount DDMMYY"
        Groups payments by payer account and includes total amount.

        Args:
            payer_account (str): Payer account number (optional for bulk payments)
            total_amount (float): Sum of all payments in this group
            due_date (datetime|str): Due date for the group

        Returns:
            str: Formatted group header
        """
        # Format: "2 [account] amount DDMMYY"
        amount_str = str(int(abs(total_amount) * 100))
        date_str = due_date.strftime('%d%m%y') if isinstance(due_date, datetime) else due_date

        if payer_account:
            return f"2 {payer_account} {amount_str} {date_str}"
        return f"2 {amount_str} {date_str}"

    def generate_payment_item(self, record, payer_account=''):
        """
        Generate payment item record from CSV data.

        Creates a space-separated payment record with:
        - Payee account number
        - Amount (in 1/100 format)
        - Variable symbol
        - Constant symbol + bank code
        - Specific symbol (optional)
        - AV field with payment description

        Args:
            record (dict): CSV record with payment data
            payer_account (str): Payer account (if in group header, omit here)

        Returns:
            str: Formatted payment item
        """
        fields = []

        # Payer account (only if not in group header)
        if not payer_account:
            payer_acc = self.format_account_number(record.get('vlastní účet', ''))
            if payer_acc:
                fields.append(payer_acc)

        # Payee account (required)
        payee_acc = self.format_account_number(record.get('účet protistrany', ''))
        if payee_acc:
            fields.append(payee_acc)

        # Amount (required, in 1/100 format)
        amount_str = str(record.get('částka', '0')).replace(',', '.')
        try:
            amount_float = float(amount_str)
            amount_int = int(abs(amount_float) * 100)
            fields.append(str(amount_int))
        except:
            fields.append('0')

        # Variable symbol (optional)
        vs = str(record.get('VS', '')).strip()
        if vs and vs != '0':
            fields.append(vs.zfill(10))

        # Constant symbol + bank code (8-10 digits)
        # Per official spec: positions 1-4 (right) = KS, positions 5-8 (right) = bank code
        # This means: Bank Code + Constant Symbol
        ks = str(record.get('KS', '')).strip()
        if ks:
            # Get bank code from payee account
            payee_full = str(record.get('účet protistrany', ''))
            bank_code = payee_full.split('/', 1)[1] if '/' in payee_full else RAIFFEISEN_BANK_CODE

            # Raiffeisenbank format: Bank code (4 digits) + Constant symbol (4 digits)
            bank_code_padded = bank_code.ljust(4, '0')[:4]
            ks_padded = ks.ljust(4, '0')[:4]
            ks_field = bank_code_padded + ks_padded
            fields.append(ks_field)

        # Specific symbol (optional)
        ss = str(record.get('SS', '')).strip()
        if ss and ss != '0':
            fields.append(ss.zfill(10))

        # AV field (payment description)
        client_name = str(record.get('název účtu prostistrany', '')).strip()
        purpose = str(record.get('účel platby', '')).strip()
        message = str(record.get('zpráva', '')).strip()

        av_parts = []
        if client_name:
            av_parts.append(client_name[:35])
        if purpose:
            av_parts.append(purpose[:35])
        if message:
            av_parts.append(message[:35])

        if av_parts:
            av_field = 'AV:' + '|'.join(av_parts)
            fields.append(av_field)

        return ' '.join(fields)

    def read_csv(self, filename):
        """
        Read CSV file and store data for conversion.

        Expected CSV columns (Czech headers):
        - vlastní účet, účet protistrany, částka, VS, KS, SS,
          název účtu prostistrany, datum zaúčtování

        Args:
            filename (str): Path to CSV file with UTF-8 encoding
        """
        self.csv_data = []
        with open(filename, encoding='utf-8') as fp:
            reader = csv.DictReader(fp)
            for row in reader:
                self.csv_data.append(row)

    def write_abo(self, output_file, client_name='KLIENT', group_by_account=True):
        """
        Write ABO format file from loaded CSV data.

        Creates complete ABO file with:
        1. UHL1 header
        2. File header
        3. Payment groups (optionally grouped by payer account)
        4. Payment items
        5. Group and file terminators

        Args:
            output_file (str): Output file path (None for stdout)
            client_name (str): Client name for UHL1 header
            group_by_account (bool): Whether to group payments by payer account
        """
        if not self.csv_data:
            msg = "No CSV data loaded"
            raise Exception(msg)

        lines = []

        # UHL1 header
        lines.append(self.generate_uhl1_header(client_name))

        # File header
        lines.append(self.generate_file_header())

        if group_by_account:
            # Group payments by payer account
            groups = {}
            for record in self.csv_data:
                payer_acc = self.format_account_number(record.get('vlastní účet', ''))
                if payer_acc not in groups:
                    groups[payer_acc] = []
                groups[payer_acc].append(record)

            for payer_acc, group_records in groups.items():
                # Calculate total amount for group
                total_amount = 0
                due_date = self.creation_date

                for record in group_records:
                    amount_str = str(record.get('částka', '0')).replace(',', '.')
                    try:
                        amount_float = float(amount_str)
                        total_amount += abs(amount_float)
                    except:
                        pass

                    # Use first date found
                    date_str = str(record.get('datum zaúčtování', ''))
                    try:
                        if '.' in date_str:
                            due_date = datetime.strptime(date_str, '%d.%m.%Y')
                        elif '-' in date_str:
                            due_date = datetime.strptime(date_str, '%Y-%m-%d')
                    except:
                        pass

                # Group header
                lines.append(self.generate_group_header(payer_acc, total_amount, due_date))

                # Payment items
                for record in group_records:
                    item_line = self.generate_payment_item(record, payer_acc)
                    if item_line:
                        lines.append(item_line)

                # Group end
                lines.append("3 +")
        else:
            # Single group with all payments
            total_amount = 0
            due_date = self.creation_date

            for record in self.csv_data:
                amount_str = str(record.get('částka', '0')).replace(',', '.')
                try:
                    amount_float = float(amount_str)
                    total_amount += abs(amount_float)
                except:
                    pass

            # Group header (no account)
            lines.append(self.generate_group_header('', total_amount, due_date))

            # Payment items
            for record in self.csv_data:
                item_line = self.generate_payment_item(record)
                if item_line:
                    lines.append(item_line)

            # Group end
            lines.append("3 +")

        # File end
        lines.append("5 +")

        # Write to file
        fp = open(output_file, 'w', encoding=OUTPUT_ENCODING) if output_file else sys.stdout
        for line in lines:
            fp.write(line + '\r\n')  # CR+LF as required by spec
        if output_file:
            fp.close()


if __name__ == '__main__':
    if (len(sys.argv) <= 1):
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if (len(sys.argv) >= 3) else None
    client_name = sys.argv[3] if (len(sys.argv) >= 4) else 'KLIENT'

    if (not os.path.isfile(input_file)):
        sys.exit(1)

    converter = CSV_to_ABO_Raiffeisen()
    converter.read_csv(input_file)
    converter.write_abo(output_file, client_name)
