#!/usr/bin/env python3

"""
Integration tests for full ABO converter workflow

Author: Sebastian Hozak <hozaksebastian@gmail.com>
"""

import csv
import os
import subprocess
import sys
import tempfile
import unittest

# Add project root to path
project_root = os.path.join(os.path.dirname(__file__), '..', '..')
sys.path.insert(0, project_root)


class TestFullWorkflow(unittest.TestCase):
    """Integration tests for complete workflow"""

    def setUp(self):
        """Set up test fixtures"""
        self.project_root = os.path.join(os.path.dirname(__file__), '..', '..')
        self.main_script = os.path.join(self.project_root, 'abo_converter.py')
        self.fixtures_dir = os.path.join(os.path.dirname(__file__), '..', 'fixtures')

        # Test CSV data
        self.test_csv_data = [
            ['vlastní účet', 'účet protistrany', 'pořadové číslo', 'částka', 'kód účtování', 'VS', 'KS', 'SS', 'název účtu prostistrany', 'kód měny', 'datum zaúčtování'],
            ['123456-1234567890', '654321-0987654321/0300', '001', '1500.50', '2', '1234567890', '0308', '9876543210', 'PRIJEMCE PLATBY S.R.O.', 'CZK', '15.12.2024'],
            ['123456-1234567890', '111111-2222222222/5500', '002', '2750.00', '2', '9876543210', '0308', '1234567890', 'RAIFFEISEN KLIENT', 'CZK', '15.12.2024'],
            ['789012-3456789012', '333333-4444444444/0100', '003', '500.75', '2', '5555555555', '0308', '7777777777', 'KOMERČNÍ BANKA KLIENT', 'CZK', '16.12.2024']
        ]

    def test_csv_to_abo_conversion(self):
        """Test CSV to ABO conversion workflow"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8') as csv_file:
            writer = csv.writer(csv_file)
            writer.writerows(self.test_csv_data)
            csv_file.flush()

            with tempfile.NamedTemporaryFile(suffix='.kpc', delete=False) as abo_file:
                try:
                    # Run conversion
                    result = subprocess.run([
                        'python3', self.main_script,
                        '--csv-to-abo', csv_file.name,
                        '--output', abo_file.name,
                        '--client', 'TEST INTEGRATION'
                    ], capture_output=True, text=True, cwd=self.project_root, check=False)

                    assert result.returncode == 0, f"Conversion failed: {result.stderr}"

                    # Verify output file exists and has content
                    assert os.path.exists(abo_file.name)
                    assert os.path.getsize(abo_file.name) > 0

                    # Read and verify basic structure
                    with open(abo_file.name, encoding='windows-1250') as f:
                        content = f.read()
                        assert content.startswith('UHL1')
                        assert '1 1501 111111 5500' in content
                        assert 'TEST INTEGRATION' in content
                        assert '5 +' in content  # File terminator

                finally:
                    # Cleanup
                    if os.path.exists(csv_file.name):
                        os.unlink(csv_file.name)
                    if os.path.exists(abo_file.name):
                        os.unlink(abo_file.name)

    def test_abo_validation_workflow(self):
        """Test ABO validation workflow"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.kpc', delete=False, encoding='windows-1250') as abo_file:
            # Create valid ABO content
            valid_abo = [
                'UHL1090625TEST VALIDATION     1234567890001999111111222222',
                '1 1501 111111 5500',
                '2 123456-1234567890 150050 151224',
                '654321-0987654321/0300 150050 1234567890 03080300 9876543210 AV:TEST COMPANY',
                '3 +',
                '5 +'
            ]
            abo_file.write('\r\n'.join(valid_abo))
            abo_file.flush()

            try:
                # Run validation
                result = subprocess.run([
                    'python3', self.main_script,
                    '--validate', abo_file.name
                ], capture_output=True, text=True, cwd=self.project_root, check=False)

                assert result.returncode == 0, f"Validation failed: {result.stderr}"
                assert 'valid' in result.stdout.lower()

            finally:
                # Cleanup
                if os.path.exists(abo_file.name):
                    os.unlink(abo_file.name)

    def test_round_trip_conversion_validation(self):
        """Test CSV→ABO→Validation round trip"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8') as csv_file:
            writer = csv.writer(csv_file)
            writer.writerows(self.test_csv_data)
            csv_file.flush()

            with tempfile.NamedTemporaryFile(suffix='.kpc', delete=False) as abo_file:
                try:
                    # Step 1: Convert CSV to ABO
                    convert_result = subprocess.run([
                        'python3', self.main_script,
                        '--csv-to-abo', csv_file.name,
                        '--output', abo_file.name,
                        '--client', 'ROUND TRIP TEST'
                    ], capture_output=True, text=True, cwd=self.project_root, check=False)

                    assert convert_result.returncode == 0, f"Conversion failed: {convert_result.stderr}"

                    # Step 2: Validate the generated ABO file
                    validate_result = subprocess.run([
                        'python3', self.main_script,
                        '--validate', abo_file.name
                    ], capture_output=True, text=True, cwd=self.project_root, check=False)

                    assert validate_result.returncode == 0, f"Validation failed: {validate_result.stderr}"
                    assert 'valid' in validate_result.stdout.lower()

                finally:
                    # Cleanup
                    if os.path.exists(csv_file.name):
                        os.unlink(csv_file.name)
                    if os.path.exists(abo_file.name):
                        os.unlink(abo_file.name)

    def test_error_handling_invalid_csv(self):
        """Test error handling with invalid CSV input"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8') as csv_file:
            # Write invalid CSV (missing required columns)
            csv_file.write('invalid,headers\n1,2\n')
            csv_file.flush()

            with tempfile.NamedTemporaryFile(suffix='.kpc', delete=False) as abo_file:
                try:
                    # This should handle the error gracefully
                    result = subprocess.run([
                        'python3', self.main_script,
                        '--csv-to-abo', csv_file.name,
                        '--output', abo_file.name,
                        '--client', 'ERROR TEST'
                    ], capture_output=True, text=True, cwd=self.project_root, check=False)

                    # Should either succeed with default values or fail gracefully
                    # (not crash with unhandled exception)
                    assert result.returncode in [0, 1]

                finally:
                    # Cleanup
                    if os.path.exists(csv_file.name):
                        os.unlink(csv_file.name)
                    if os.path.exists(abo_file.name):
                        os.unlink(abo_file.name)

    def test_help_command(self):
        """Test help command functionality"""
        result = subprocess.run([
            'python3', self.main_script, '--help'
        ], capture_output=True, text=True, cwd=self.project_root, check=False)

        assert result.returncode == 0
        assert 'ABO Converter Suite' in result.stdout
        assert '--csv-to-abo' in result.stdout
        assert '--validate' in result.stdout

    def test_large_file_handling(self):
        """Test handling of larger CSV files"""
        # Create a larger CSV file with 100 transactions
        large_csv_data = [self.test_csv_data[0]]  # Header

        for i in range(100):
            row = self.test_csv_data[1].copy()  # Use first data row as template
            row[2] = f'{i+1:03d}'  # Change record number
            row[3] = f'{1000 + i}.{i % 100:02d}'  # Vary amounts
            row[5] = f'{1234567890 + i}'  # Vary VS
            large_csv_data.append(row)

        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8') as csv_file:
            writer = csv.writer(csv_file)
            writer.writerows(large_csv_data)
            csv_file.flush()

            with tempfile.NamedTemporaryFile(suffix='.kpc', delete=False) as abo_file:
                try:
                    # Test conversion performance and correctness
                    result = subprocess.run([
                        'python3', self.main_script,
                        '--csv-to-abo', csv_file.name,
                        '--output', abo_file.name,
                        '--client', 'LARGE FILE TEST'
                    ], capture_output=True, text=True, cwd=self.project_root, timeout=60, check=False)

                    assert result.returncode == 0, f"Large file conversion failed: {result.stderr}"

                    # Validate the result
                    validate_result = subprocess.run([
                        'python3', self.main_script,
                        '--validate', abo_file.name
                    ], capture_output=True, text=True, cwd=self.project_root, check=False)

                    assert validate_result.returncode == 0

                finally:
                    # Cleanup
                    if os.path.exists(csv_file.name):
                        os.unlink(csv_file.name)
                    if os.path.exists(abo_file.name):
                        os.unlink(abo_file.name)

    def test_existing_fixtures(self):
        """Test with existing fixture files"""
        fixtures_csv = os.path.join(self.fixtures_dir, 'test_payments.csv')

        if os.path.exists(fixtures_csv):
            with tempfile.NamedTemporaryFile(suffix='.kpc', delete=False) as abo_file:
                try:
                    # Convert fixture CSV
                    result = subprocess.run([
                        'python3', self.main_script,
                        '--csv-to-abo', fixtures_csv,
                        '--output', abo_file.name,
                        '--client', 'FIXTURE TEST'
                    ], capture_output=True, text=True, cwd=self.project_root, check=False)

                    assert result.returncode == 0, f"Fixture conversion failed: {result.stderr}"

                    # Validate result
                    validate_result = subprocess.run([
                        'python3', self.main_script,
                        '--validate', abo_file.name
                    ], capture_output=True, text=True, cwd=self.project_root, check=False)

                    assert validate_result.returncode == 0

                finally:
                    if os.path.exists(abo_file.name):
                        os.unlink(abo_file.name)


if __name__ == '__main__':
    unittest.main()
