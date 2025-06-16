# CLAUDE.md - Project Memory

## Project Overview
ABO Converter Suite - Comprehensive tools for converting bank statements between various formats used by Czech banks.

## Project Goals
1. **Reverse-engineer GPC to CSV process** - Create CSV to ABO converter for Raiffeisenbank
2. **Support multiple bank formats** - Handle variations in ABO implementations 
3. **Provide validation tools** - Ensure generated files meet banking standards
4. **Maintain legacy compatibility** - Keep existing GPC converters functional

## Key Requirements
- Python 3.x compatibility
- Windows-1250 encoding for ABO files
- Czech banking standards compliance (Modulo 11 validation)
- Raiffeisenbank-specific format support (bank code 5500)
- Proper ABO structure (UHL1 headers, groups, terminators)

## Architecture Decisions

### File Structure
```
abo_converter/
├── abo_converter.py           # Main entry point
├── src/                       # Core source code
│   ├── main.py               # Orchestrator (uses direct imports)
│   ├── csv_to_abo_raiffeisen.py # Raiffeisenbank converter
│   ├── csv_to_abo_fio.py    # FIO Bank converter
│   ├── abo_validator.py      # Multi-bank validator
│   └── utils/                # Shared utilities
│       ├── __init__.py
│       └── banking_utils.py  # Modulo 11, character conversion
├── legacy/                   # Backward compatibility
│   ├── gpc_to_csv.py        # Original GPC→CSV
│   └── csv_to_gpc.py        # Original CSV→GPC
├── examples/                 # Test data and samples
├── docs/                     # Documentation and specs
├── tests/                    # Unit and integration tests
├── web-app/                  # React web interface
├── google_apps_script/       # Google Sheets integration
└── .github/                  # GitHub workflows and templates

### Key Components

#### 1. CSV to ABO Converter (`csv_to_abo_raiffeisen.py`)
- **Purpose**: Convert CSV payment data to Raiffeisenbank ABO format
- **Key Features**:
  - UHL1 header generation (58 characters)
  - Payment grouping by payer account
  - Amount conversion (decimal → 1/100 format)
  - Czech character normalization for ASCII compliance
  - Account number validation using Modulo 11

#### 2. CSV to ABO Converter (`csv_to_abo_fio.py`)
- **Purpose**: Convert CSV payment data to FIO Bank ABO format
- **Key Features**:
  - FIO-specific UHL1 header (spaces instead of client name)
  - 12-digit zero-padded amounts
  - Account formatting without bank codes in payment lines
  - Shared utilities for validation and conversion

#### 3. ABO Validator (`abo_validator.py`)
- **Purpose**: Validate ABO files from various Czech banks
- **Supports**: Raiffeisenbank (5500), FIO Bank (2010), others
- **Features**: 
  - Comprehensive validation with detailed error messages
  - File structure analysis with line-by-line reporting
  - Summary statistics (groups, payments)

#### 4. Main Orchestrator (`main.py`)
- **Purpose**: Unified interface for all conversion operations
- **Features**: 
  - Direct imports (no os.system() calls - security improvement)
  - Command-line interface with argument parsing
  - File path resolution and error handling

#### 5. Shared Utilities (`utils/banking_utils.py`)
- **Purpose**: Common banking functions to avoid code duplication
- **Functions**:
  - `validate_account_modulo11()`: Czech account validation
  - `convert_czech_to_ascii()`: Character normalization
  - `format_account_number()`: Consistent formatting
  - `format_amount_to_cents()`: Decimal to cents conversion
  - `format_symbol()`: VS/SS formatting

## Technical Implementation

### ABO Format Structure
```
UHL1[date][client_name][security_codes]     # File header (58 chars)
1 1501 111111 5500                          # Account file header  
2 [account] [amount] [date]                 # Group header
[payment_items]                             # Space-separated fields
3 +                                         # Group terminator
5 +                                         # File terminator
```

### Payment Item Format
```
[payee_account] [amount] [VS] [CS+bank] [SS] AV:[description]
```

### Data Transformations
- **Amounts**: Decimal (1500.50) → Integer cents (150050)
- **Dates**: DD.MM.YYYY → DDMMYY
- **Accounts**: Various formats → Standardized with bank codes
- **Encoding**: UTF-8 (input) → Windows-1250 (output)

## Testing Strategy
- **Unit tests**: Individual converter functions
- **Integration tests**: Full workflow (CSV→ABO→validation)
- **Bank format tests**: Compare against working examples
- **Round-trip validation**: Ensure data integrity

## Known Bank Variations

### Raiffeisenbank (5500)
- Includes bank codes in account numbers
- Variable-length amounts
- Full payment descriptions in AV fields

### FIO Bank (2010) 
- 12-digit zero-padded amounts
- Simplified payment format
- No bank codes in account numbers

## Dependencies
- Python 3.x standard library only
- No external packages required
- Cross-platform compatibility (Windows, macOS, Linux)

## Usage Patterns

### Common Operations
```bash
# Convert CSV to Raiffeisenbank ABO
python3 abo_converter.py --csv-to-abo payments.csv --output result.kpc --client "COMPANY"

# Validate any ABO file
python3 abo_converter.py --validate file.kpc

# Legacy GPC operations
python3 abo_converter.py --gpc-to-csv legacy.gpc --output modern.csv
```

### Expected CSV Format
```csv
vlastní účet,účet protistrany,částka,VS,KS,SS,název účtu prostistrany,datum zaúčtování
123456-1234567890,654321-0987654321/0300,1500.50,1234567890,0308,9876543210,COMPANY NAME,15.12.2024
```

## Error Handling
- **File encoding issues**: Automatic character conversion
- **Invalid account numbers**: Modulo 11 validation with warnings
- **Missing data**: Sensible defaults and clear error messages
- **Format violations**: Detailed validation reports

## Future Enhancements
1. **Additional bank support**: ČSOB, Komerční banka, etc.
2. **GUI interface**: User-friendly desktop application
3. **API endpoints**: Web service for conversions
4. **Advanced validation**: Business rule checking
5. **Batch processing**: Handle multiple files

## Development Notes
- All code includes comprehensive docstrings
- Follows Python PEP 8 style guidelines
- Uses snake_case naming convention
- Modular design for easy extension
- Extensive error handling and validation

## Recent Improvements (2025)

### Security Enhancements
- **Eliminated os.system() vulnerability**: Replaced shell command execution with direct Python imports
- **No command injection risk**: All converters now use proper function calls

### Code Quality
- **Eliminated 200+ lines of duplicate code**: Extracted shared functions to `utils/banking_utils.py`
- **Fixed broken validator**: Now provides detailed structure analysis and proper error reporting
- **Cleaned up project structure**: Removed redundant files and misplaced components

### Repository Setup
- **GitHub Actions CI/CD**: Automated testing across Python 3.8-3.11
- **Dependabot integration**: Automated dependency updates
- **Issue/PR templates**: Standardized contribution workflow
- **Security policy**: Clear vulnerability reporting process

## Maintenance
- **Code reviews**: Ensure banking compliance
- **Format updates**: Track changes in bank specifications
- **Security**: No sensitive data logging or storage
- **Performance**: Optimize for large payment batches

## GitHub Repository
- **Repository**: https://github.com/SheVyY/abo-converter (private)
- **CI/CD**: GitHub Actions for automated testing
- **Dependencies**: Managed by Dependabot
- **Contributions**: Via pull requests with templates

---

**Author**: Sebastian Hozak <hozaksebastian@gmail.com>  
**Created**: 2025  
**License**: MIT

This project successfully reverse-engineers the GPC→CSV process to create a comprehensive CSV→ABO converter suite, with particular focus on Raiffeisenbank compatibility while maintaining support for other Czech banking formats.