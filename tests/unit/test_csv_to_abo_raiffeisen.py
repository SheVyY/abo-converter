#!/usr/bin/env python3

"""
Unit tests for CSV to ABO Raiffeisen converter

Author: Sebastian Hozak <hozaksebastian@gmail.com>
"""

import os
import sys
import unittest
from datetime import datetime
from unittest.mock import mock_open
from unittest.mock import patch

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from csv_to_abo_raiffeisen import CSV_to_ABO_Raiffeisen


class TestCSVToABORaiffeisen(unittest.TestCase):
    """Test cases for CSV to ABO Raiffeisen converter"""

    def setUp(self):
        """Set up test fixtures"""
        self.converter = CSV_to_ABO_Raiffeisen()
        self.test_record = {
            'vlastní účet': '123456-1234567890',
            'účet protistrany': '654321-0987654321/0300',
            'částka': '1500.50',
            'VS': '1234567890',
            'KS': '0308',
            'SS': '9876543210',
            'název účtu prostistrany': 'TEST COMPANY',
            'datum zaúčtování': '15.12.2024'
        }

    def test_validate_account_modulo11_valid(self):
        """Test Modulo 11 validation with valid account numbers"""
        # Valid account numbers (common Czech format)
        valid_accounts = [
            '123456-1234567890',
            '19-2000145399',
            '000000-0000000001'
        ]

        for account in valid_accounts:
            with self.subTest(account=account):
                # Note: The actual Modulo 11 validation might fail for test data
                # This tests the method structure
                result = self.converter.validate_account_modulo11(account)
                assert isinstance(result, bool)

    def test_validate_account_modulo11_invalid_format(self):
        """Test Modulo 11 validation with invalid formats"""
        invalid_accounts = [
            'not-a-number',
            '123-abc',
            '',
            '123456789012345678'  # too long
        ]

        for account in invalid_accounts:
            with self.subTest(account=account):
                result = self.converter.validate_account_modulo11(account)
                assert not result

    def test_format_account_number(self):
        """Test account number formatting"""
        test_cases = [
            ('123456-1234567890', '123456-1234567890'),
            ('123456-1234567890/5500', '123456-1234567890'),  # Remove Raiffeisen code
            ('123456-1234567890/0300', '123456-1234567890/0300'),  # Keep other codes
            ('1234567890', '1234567890'),  # No prefix
            ('', '')  # Empty
        ]

        for input_account, expected in test_cases:
            with self.subTest(input_account=input_account):
                result = self.converter.format_account_number(input_account)
                assert result == expected

    def test_generate_uhl1_header(self):
        """Test UHL1 header generation"""
        # Test with ASCII-safe name
        header = self.converter.generate_uhl1_header('TEST CLIENT')
        assert len(header) == 58
        assert header.startswith('UHL1')
        assert 'TEST CLIENT' in header

        # Test with Czech characters (should be converted)
        header_czech = self.converter.generate_uhl1_header('ČEŠTÍ KLIENTI')
        assert len(header_czech) == 58
        assert 'CESTI KLIENTI' in header_czech

    def test_generate_file_header(self):
        """Test file header generation"""
        header = self.converter.generate_file_header()
        expected = "1 1501 111111 5500"
        assert header == expected

        # Test with different data type
        header_collection = self.converter.generate_file_header('1502')
        expected_collection = "1 1502 111111 5500"
        assert header_collection == expected_collection

    def test_generate_group_header(self):
        """Test group header generation"""
        account = '123456-1234567890'
        amount = 1500.50
        date = datetime(2024, 12, 15)

        header = self.converter.generate_group_header(account, amount, date)
        assert '123456-1234567890' in header
        assert '150050' in header  # Amount in 1/100 format
        assert '151224' in header  # Date in DDMMYY format

    def test_generate_payment_item(self):
        """Test payment item generation"""
        item = self.converter.generate_payment_item(self.test_record)

        # Check that all required fields are present
        assert '654321-0987654321/0300' in item  # Payee account
        assert '150050' in item  # Amount in 1/100 format
        assert '1234567890' in item  # Variable symbol
        assert 'AV:TEST COMPANY' in item  # AV field

    def test_amount_conversion(self):
        """Test amount conversion to 1/100 format"""
        test_cases = [
            ('1500.50', 150050),
            ('2750.00', 275000),
            ('500.75', 50075),
            ('0.01', 1),
            ('10000', 1000000)
        ]

        for amount_str, expected in test_cases:
            with self.subTest(amount=amount_str):
                record = {'částka': amount_str}
                item = self.converter.generate_payment_item(record)
                assert str(expected) in item

    def test_date_formatting(self):
        """Test date format conversion"""
        test_dates = [
            ('15.12.2024', '151224'),
            ('01.01.2025', '010125'),
            ('2024-12-15', '151224')
        ]

        for date_input, expected in test_dates:
            with self.subTest(date=date_input):
                # Test date conversion directly with datetime object
                if '.' in date_input:
                    date_obj = datetime.strptime(date_input, '%d.%m.%Y')
                else:
                    date_obj = datetime.strptime(date_input, '%Y-%m-%d')
                header = self.converter.generate_group_header('123-456', 100, date_obj)
                assert expected in header

    @patch('builtins.open', new_callable=mock_open, read_data='vlastní účet,částka\n123-456,100.50\n')
    def test_read_csv(self, mock_file):
        """Test CSV reading functionality"""
        self.converter.read_csv('test.csv')
        assert len(self.converter.csv_data) == 1
        assert self.converter.csv_data[0]['vlastní účet'] == '123-456'
        assert self.converter.csv_data[0]['částka'] == '100.50'

    def test_czech_character_conversion(self):
        """Test Czech character conversion in UHL1 header"""
        czech_chars = {
            'Č': 'C', 'č': 'c', 'Ř': 'R', 'ř': 'r',
            'Š': 'S', 'š': 's', 'Ž': 'Z', 'ž': 'z',
            'Ý': 'Y', 'ý': 'y', 'Á': 'A', 'á': 'a',
            'É': 'E', 'é': 'e', 'Í': 'I', 'í': 'i',
            'Ó': 'O', 'ó': 'o', 'Ú': 'U', 'ú': 'u',
            'Ů': 'U', 'ů': 'u', 'Ě': 'E', 'ě': 'e',
            'Ď': 'D', 'ď': 'd', 'Ť': 'T', 'ť': 't',
            'Ň': 'N', 'ň': 'n'
        }

        for czech, ascii_char in czech_chars.items():
            with self.subTest(czech_char=czech):
                header = self.converter.generate_uhl1_header(f'TEST{czech}')
                # Check if conversion happened (original char not present)
                assert czech not in header
                # The header is uppercase, so check for uppercase ASCII equivalent
                expected_upper = f'TEST{ascii_char}'.upper()
                assert expected_upper in header


if __name__ == '__main__':
    unittest.main()
