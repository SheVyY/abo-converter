# Examples Directory

**Author**: Sebastian Hozak <hozaksebastian@gmail.com>

This directory contains templates, samples, and documentation for using the ABO Converter Suite.

## Directory Structure

```
examples/
├── templates/              # CSV templates for creating payments
│   ├── google_sheets_template.csv    # Google Sheets template (20 payments)
│   ├── fio_bank_template.csv         # FIO Bank template (10 payments)
│   └── basic_payments.csv            # Basic template (10 payments)
├── input_samples/          # Sample input files
│   └── sample_payments.csv           # Sample CSV data for testing
├── output_samples/         # Example ABO output files
│   ├── fio_bank_example.kpc          # FIO Bank ABO format example
│   ├── fio_bank_template_output.kpc  # Generated from FIO Bank template
│   └── raiffeisen_20_payments.kpc    # Generated from Google Sheets template
├── docs/                   # Documentation
│   └── csv_format_guide.md           # Complete CSV format guide
└── README.md              # This file
```

## Quick Start

### 1. Using Templates

**For Google Sheets:**
```bash
# Download and import templates/google_sheets_template.csv into Google Sheets
# Customize with your data, export as CSV, then convert:
python3 abo_converter.py --csv-to-abo your_payments.csv --output payments.kpc --client "YOUR COMPANY"
```

**For Excel or other tools:**
```bash
# Use templates/basic_payments.csv as starting point (Raiffeisenbank)
python3 abo_converter.py --csv-to-abo templates/basic_payments.csv --bank raiffeisen --output test.kpc --client "TEST"

# Use templates/fio_bank_template.csv for FIO Bank
python3 abo_converter.py --csv-to-abo templates/fio_bank_template.csv --bank fio --output test.kpc --client "TEST"
```

### 2. Testing with Samples

```bash
# Convert sample data
python3 abo_converter.py --csv-to-abo input_samples/sample_payments.csv --output test.kpc

# Validate output
python3 abo_converter.py --validate test.kpc
```

### 3. Viewing Examples

```bash
# Analyze existing ABO files
python3 abo_converter.py --validate output_samples/fio_bank_example.kpc
python3 abo_converter.py --validate output_samples/raiffeisen_20_payments.kpc
```

## File Descriptions

### Templates (`templates/`)

#### `google_sheets_template.csv`
- **Purpose**: Ready-to-use template for Google Sheets
- **Content**: 20 sample payments covering all major Czech banks
- **Features**: Realistic amounts, proper bank codes, sequential numbering
- **Usage**: Download → Import to Google Sheets → Customize → Export → Convert

#### `fio_bank_template.csv`
- **Purpose**: Ready-to-use template for FIO Bank
- **Content**: 10 sample payments with FIO Bank account formats
- **Features**: FIO Bank specific account prefixes, realistic data
- **Usage**: Download → Customize → Convert with --bank fio

#### `basic_payments.csv`
- **Purpose**: Simple template for quick testing
- **Content**: 10 basic payments with essential data
- **Features**: Clean, minimal example data
- **Usage**: Copy format for your own payments

### Input Samples (`input_samples/`)

#### `sample_payments.csv`
- **Purpose**: Test data for validating converter functionality
- **Content**: Sample payments for testing
- **Usage**: Use for testing and learning the format

### Output Samples (`output_samples/`)

#### `fio_bank_example.kpc`
- **Purpose**: Real-world example of FIO Bank ABO format
- **Bank**: FIO Bank (code 2010)
- **Features**: Shows different bank format variations
- **Usage**: Compare output formats between banks

#### `fio_bank_template_output.kpc`
- **Purpose**: Generated example from FIO Bank template
- **Bank**: FIO Bank (code 2010)
- **Features**: Shows FIO Bank specific formatting and structure
- **Usage**: Compare FIO Bank output format with this example

#### `raiffeisen_20_payments.kpc`
- **Purpose**: Generated example from Google Sheets template
- **Bank**: Raiffeisenbank (code 5500)
- **Features**: Shows converter output for multiple payments
- **Usage**: Validate your converter output against this example

### Documentation (`docs/`)

#### `csv_format_guide.md`
- **Purpose**: Complete guide to CSV format requirements
- **Content**: Field descriptions, bank codes, examples, troubleshooting
- **Usage**: Reference for creating proper CSV files

## Common Workflows

### Google Sheets Integration

1. **Setup**:
   - Download `templates/google_sheets_template.csv`
   - Import into Google Sheets (File → Import → Upload)

2. **Customize**:
   - Replace sample data with your actual payments
   - Update account numbers, amounts, dates
   - Add/remove rows as needed

3. **Export & Convert**:
   ```bash
   # Export from Google Sheets as CSV
   python3 abo_converter.py --csv-to-abo downloaded_file.csv --output payments.kpc --client "YOUR COMPANY"
   ```

### Bank Format Testing

```bash
# Test different output formats
python3 abo_converter.py --validate output_samples/fio_bank_example.kpc           # FIO format (real example)
python3 abo_converter.py --validate output_samples/fio_bank_template_output.kpc  # FIO format (generated)
python3 abo_converter.py --validate output_samples/raiffeisen_20_payments.kpc    # Raiffeisen format
```

### Development & Testing

```bash
# Quick test with sample data
python3 abo_converter.py --csv-to-abo input_samples/sample_payments.csv --output dev_test.kpc

# Run full test suite
python3 tests/test_runner.py
```

## Tips for Success

1. **Start with Templates**: Always begin with provided templates
2. **Check Bank Codes**: Ensure correct bank codes for all accounts
3. **Validate Early**: Test with small datasets first
4. **Use Samples**: Compare your output with provided examples
5. **Read Documentation**: Check `docs/csv_format_guide.md` for details

## Troubleshooting

- **Format Issues**: See `docs/csv_format_guide.md`
- **Validation Errors**: Compare with `output_samples/`
- **Bank Compatibility**: Test with provided examples first

---

This organized structure makes it easy to find the right template or example for your specific use case.