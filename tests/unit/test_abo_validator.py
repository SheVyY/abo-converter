#!/usr/bin/env python3

"""
Unit tests for ABO validator

Author: Sebastian Hozak <hozaksebastian@gmail.com>
"""

import os
import sys
import tempfile
import unittest
from unittest.mock import patch

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from abo_validator import print_abo_structure
from abo_validator import validate_abo_file


class TestABOValidator(unittest.TestCase):
    """Test cases for ABO file validator"""

    def setUp(self):
        """Set up test fixtures"""
        self.valid_abo_content = [
            'UHL1090625TEST CLIENT         1234567890001999111111222222',
            '1 1501 111111 5500',
            '2 123456-1234567890 150050 151224',
            '654321-0987654321/0300 150050 1234567890 03080300 9876543210 AV:TEST COMPANY',
            '3 +',
            '5 +'
        ]

        self.invalid_abo_content = [
            'INVALID_HEADER',
            '1 1501 111111 5500',
            '2 123456-1234567890 150050 151224',
            '654321-0987654321/0300 150050 1234567890 03080300 9876543210 AV:TEST COMPANY',
            '3 +',
            '5 +'
        ]

    def test_validate_valid_abo_file(self):
        """Test validation of a valid ABO file"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.kpc', delete=False, encoding='windows-1250') as f:
            f.write('\r\n'.join(self.valid_abo_content))
            f.flush()

            try:
                errors = validate_abo_file(f.name)
                assert len(errors) == 0, f"Expected no errors, but got: {errors}"
            finally:
                os.unlink(f.name)

    def test_validate_invalid_uhl1_header(self):
        """Test validation with invalid UHL1 header"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.kpc', delete=False, encoding='windows-1250') as f:
            f.write('\r\n'.join(self.invalid_abo_content))
            f.flush()

            try:
                errors = validate_abo_file(f.name)
                assert len(errors) > 0
                assert any('UHL1' in error for error in errors)
            finally:
                os.unlink(f.name)

    def test_validate_wrong_uhl1_length(self):
        """Test validation with wrong UHL1 header length"""
        invalid_content = ['UHL1_TOO_SHORT'] + self.valid_abo_content[1:]

        with tempfile.NamedTemporaryFile(mode='w', suffix='.kpc', delete=False, encoding='windows-1250') as f:
            f.write('\r\n'.join(invalid_content))
            f.flush()

            try:
                errors = validate_abo_file(f.name)
                assert len(errors) > 0
                assert any('58 characters' in error for error in errors)
            finally:
                os.unlink(f.name)

    def test_validate_missing_file_header(self):
        """Test validation with missing file header"""
        invalid_content = [self.valid_abo_content[0]] + self.valid_abo_content[2:]

        with tempfile.NamedTemporaryFile(mode='w', suffix='.kpc', delete=False, encoding='windows-1250') as f:
            f.write('\r\n'.join(invalid_content))
            f.flush()

            try:
                errors = validate_abo_file(f.name)
                assert len(errors) > 0
                assert any('File header should start with' in error for error in errors)
            finally:
                os.unlink(f.name)

    def test_validate_missing_file_end(self):
        """Test validation with missing file end marker"""
        invalid_content = self.valid_abo_content[:-1]  # Remove '5 +'

        with tempfile.NamedTemporaryFile(mode='w', suffix='.kpc', delete=False, encoding='windows-1250') as f:
            f.write('\r\n'.join(invalid_content))
            f.flush()

            try:
                errors = validate_abo_file(f.name)
                assert len(errors) > 0
                assert any('file end marker' in error for error in errors)
            finally:
                os.unlink(f.name)

    def test_validate_unmatched_group(self):
        """Test validation with unmatched group (missing group end)"""
        invalid_content = self.valid_abo_content[:-2] + [self.valid_abo_content[-1]]  # Remove '3 +' but keep '5 +'

        with tempfile.NamedTemporaryFile(mode='w', suffix='.kpc', delete=False, encoding='windows-1250') as f:
            f.write('\r\n'.join(invalid_content))
            f.flush()

            try:
                errors = validate_abo_file(f.name)
                assert len(errors) > 0
                assert any('File end while in group' in error for error in errors)
            finally:
                os.unlink(f.name)

    def test_validate_empty_file(self):
        """Test validation with empty file"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.kpc', delete=False, encoding='windows-1250') as f:
            f.write('')
            f.flush()

            try:
                errors = validate_abo_file(f.name)
                assert len(errors) > 0
                assert any('File is empty' in error for error in errors)
            finally:
                os.unlink(f.name)

    def test_validate_payment_outside_group(self):
        """Test validation with payment item outside group"""
        invalid_content = [
            self.valid_abo_content[0],  # UHL1
            self.valid_abo_content[1],  # File header
            '654321-0987654321/0300 150050 1234567890 03080300 9876543210 AV:TEST COMPANY',  # Payment without group
            '5 +'
        ]

        with tempfile.NamedTemporaryFile(mode='w', suffix='.kpc', delete=False, encoding='windows-1250') as f:
            f.write('\r\n'.join(invalid_content))
            f.flush()

            try:
                errors = validate_abo_file(f.name)
                assert len(errors) > 0
                assert any('Payment item outside group' in error for error in errors)
            finally:
                os.unlink(f.name)

    @patch('sys.stdout')
    def test_print_abo_structure(self, mock_stdout):
        """Test ABO structure printing functionality"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.kpc', delete=False, encoding='windows-1250') as f:
            f.write('\r\n'.join(self.valid_abo_content))
            f.flush()

            try:
                # This should not raise an exception
                print_abo_structure(f.name)
                # Verify that print was called (structure analysis was performed)
                assert mock_stdout.write.called
            finally:
                os.unlink(f.name)

    def test_validate_insufficient_payment_fields(self):
        """Test validation with payment item having too few fields"""
        invalid_content = [
            self.valid_abo_content[0],  # UHL1
            self.valid_abo_content[1],  # File header
            self.valid_abo_content[2],  # Group header
            '654321 150050',  # Payment with only 2 fields
            '3 +',
            '5 +'
        ]

        with tempfile.NamedTemporaryFile(mode='w', suffix='.kpc', delete=False, encoding='windows-1250') as f:
            f.write('\r\n'.join(invalid_content))
            f.flush()

            try:
                errors = validate_abo_file(f.name)
                assert len(errors) > 0
                assert any('too few fields' in error for error in errors)
            finally:
                os.unlink(f.name)

    def test_validate_different_bank_formats(self):
        """Test validation with different bank format (FIO Bank style)"""
        fio_content = [
            'UHL1280525                    0000000000001999000000000000',
            '1 1501 001000 2010',
            '2 000000-2101936931 00000005543900 280525',
            '2892650103 000000612500 250509 08000308   AV:Test Client',
            '3 +',
            '5 +'
        ]

        with tempfile.NamedTemporaryFile(mode='w', suffix='.kpc', delete=False, encoding='windows-1250') as f:
            f.write('\r\n'.join(fio_content))
            f.flush()

            try:
                errors = validate_abo_file(f.name)
                # Should be valid (different bank format but valid structure)
                assert len(errors) == 0, f"FIO format should be valid, but got errors: {errors}"
            finally:
                os.unlink(f.name)


if __name__ == '__main__':
    unittest.main()
