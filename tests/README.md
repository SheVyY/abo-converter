# Test Suite Documentation

## Overview

This directory contains comprehensive tests for the ABO Converter Suite, ensuring reliability and correctness of all conversion operations.

**Author**: Sebastian Hozak <hozaksebastian@gmail.com>

## Test Structure

```
tests/
├── __init__.py                    # Test package initialization
├── README.md                      # This documentation
├── test_runner.py                 # Custom test runner
├── pytest.ini                    # Pytest configuration
├── unit/                          # Unit tests
│   ├── __init__.py
│   ├── test_csv_to_abo_raiffeisen.py  # CSV→ABO converter tests
│   └── test_abo_validator.py          # ABO validator tests
├── integration/                   # Integration tests
│   ├── __init__.py
│   └── test_full_workflow.py          # End-to-end workflow tests
└── fixtures/                      # Test data
    ├── test_payments.csv              # Sample CSV data
    └── expected_raiffeisen.kpc        # Expected ABO output
```

## Running Tests

### Using the Custom Test Runner

```bash
# Run all tests
python3 tests/test_runner.py

# Run only unit tests
python3 tests/test_runner.py --unit

# Run only integration tests
python3 tests/test_runner.py --integration

# Verbose output
python3 tests/test_runner.py --verbose

# Stop on first failure
python3 tests/test_runner.py --failfast
```

### Using Python's unittest

```bash
# Run all tests
python3 -m unittest discover tests

# Run specific test file
python3 -m unittest tests.unit.test_csv_to_abo_raiffeisen

# Run specific test method
python3 -m unittest tests.unit.test_csv_to_abo_raiffeisen.TestCSVToABORaiffeisen.test_amount_conversion
```

### Using pytest (if installed)

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src

# Run specific test types
pytest -m unit
pytest -m integration
```

## Test Categories

### Unit Tests

**Purpose**: Test individual functions and methods in isolation.

#### `test_csv_to_abo_raiffeisen.py`
- **Account validation**: Modulo 11 algorithm testing
- **Format conversion**: Account numbers, amounts, dates
- **Header generation**: UHL1, file, group headers
- **Payment items**: Field formatting and structure
- **Czech characters**: ASCII conversion for UHL1 headers
- **Edge cases**: Empty data, invalid formats

#### `test_abo_validator.py`
- **File structure**: Valid/invalid ABO file validation
- **Header validation**: UHL1 format and length checks
- **Group validation**: Proper nesting and termination
- **Error detection**: Missing components, malformed data
- **Multi-bank support**: Different bank format validation

### Integration Tests

**Purpose**: Test complete workflows and system interactions.

#### `test_full_workflow.py`
- **CSV→ABO→Validation**: Complete round-trip testing
- **Command-line interface**: Main script execution
- **File handling**: Temporary files, encoding, cleanup
- **Error handling**: Invalid inputs, graceful failures
- **Performance**: Large file processing
- **Real data**: Testing with fixture files

## Test Data

### Fixtures

#### `test_payments.csv`
Sample CSV file with typical payment data:
- Multiple payer accounts
- Various payee banks (Raiffeisenbank, ČSOB, FIO)
- Different amount formats
- Czech characters in names
- Date variations

#### `expected_raiffeisen.kpc`
Expected ABO output for test data:
- Proper UHL1 header
- Raiffeisenbank format (bank code 5500)
- Grouped payments
- Correct amount conversions

## Test Coverage

### Core Functionality
- ✅ CSV reading and parsing
- ✅ Account number formatting and validation
- ✅ Amount conversion (decimal → 1/100 format)
- ✅ Date formatting (various input formats → DDMMYY)
- ✅ ABO file generation (all record types)
- ✅ File validation (structure and content)

### Error Handling
- ✅ Invalid CSV formats
- ✅ Missing required fields
- ✅ Malformed ABO files
- ✅ Encoding issues
- ✅ File I/O errors

### Bank Compatibility
- ✅ Raiffeisenbank (5500) - Full support
- ✅ FIO Bank (2010) - Validation support
- ✅ Other banks - Basic validation

### Edge Cases
- ✅ Empty files
- ✅ Large datasets (100+ transactions)
- ✅ Special characters
- ✅ Invalid account numbers
- ✅ Future dates
- ✅ Zero amounts

## Continuous Integration

### Test Requirements
Tests are designed to run in various environments:
- **Python 3.7+**: Minimum supported version
- **No external dependencies**: Uses only standard library
- **Cross-platform**: Windows, macOS, Linux
- **Isolated**: No network access required

### Performance Benchmarks
- **Unit tests**: < 100ms total
- **Integration tests**: < 5 seconds total
- **Large file test**: 100 transactions in < 10 seconds

## Adding New Tests

### Unit Test Guidelines
1. **One test per function/method**
2. **Test both success and failure cases**
3. **Use descriptive test names**
4. **Include docstrings explaining purpose**
5. **Mock external dependencies**

### Integration Test Guidelines
1. **Test complete user workflows**
2. **Use temporary files for I/O**
3. **Clean up resources in finally blocks**
4. **Test with realistic data volumes**
5. **Verify end-to-end correctness**

### Example Test Template

```python
def test_new_functionality(self):
    """Test description explaining what is being tested"""
    # Arrange
    input_data = "test input"
    expected_output = "expected result"
    
    # Act
    result = function_under_test(input_data)
    
    # Assert
    self.assertEqual(result, expected_output)
```

## Debugging Tests

### Common Issues
1. **Encoding errors**: Ensure proper Windows-1250 handling
2. **File path issues**: Use absolute paths in tests
3. **Temporary files**: Always clean up in finally blocks
4. **Date formatting**: Account for locale differences

### Debug Mode
```bash
# Run with verbose output and stop on first failure
python3 tests/test_runner.py --verbose --failfast

# Run single test with full output
python3 -m unittest tests.unit.test_csv_to_abo_raiffeisen.TestCSVToABORaiffeisen.test_amount_conversion -v
```

## Quality Metrics

### Test Coverage Goals
- **Unit tests**: > 90% code coverage
- **Integration tests**: 100% user workflow coverage
- **Error paths**: 100% error handling coverage

### Test Quality
- **Fast execution**: Unit tests < 1ms each
- **Reliable**: No flaky tests
- **Maintainable**: Clear, documented test code
- **Comprehensive**: Edge cases covered

---

This test suite ensures the ABO Converter Suite maintains high quality and reliability across all supported banking formats and use cases.