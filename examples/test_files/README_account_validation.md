# Czech Bank Account Number Validation

## ČNB Regulation Compliance

This document explains the Czech bank account number validation implemented in the ABO converter, which follows ČNB (Czech National Bank) regulations.

## Account Number Format

Czech bank account numbers follow the format: `[prefix]-[account]/[bank_code]`

- **Prefix**: Optional, 0-6 digits (e.g., `000055`)
- **Account**: Required, 1-10 digits (e.g., `1234567890`)
- **Bank Code**: 4 digits identifying the bank (e.g., `2010` for FIO Bank)

Examples:
- `2000775809/2010` (simple account with bank code)
- `000055-1234567890/2010` (prefix-account with bank code)
- `1000000005` (account only, for ABO payment lines)

## Modulo 11 Validation

Czech account numbers use the **Modulo 11 algorithm** for validation:

### Prefix Validation (if present)
- **Weights**: `[10, 5, 8, 4, 2, 1]`
- **Process**: Pad prefix to 6 digits, multiply by weights, sum must be divisible by 11

### Account Number Validation
- **Weights**: `[6, 3, 7, 9, 10, 5, 8, 4, 2, 1]`
- **Process**: Pad account to 10 digits, multiply by weights, sum must be divisible by 11

## Test Accounts (ČNB Valid)

### Valid Test Accounts for FIO Bank
```
Payer Account: 2000775809/2010 ✅ VALID
Payee Accounts:
- 1000000005 ✅ VALID (simple format)
- 1000000013 ✅ VALID
- 1000000021 ✅ VALID  
- 1000000048 ✅ VALID
- 1000000056 ✅ VALID
```

### From Official FIO Example (Also Valid)
```
- 2101936931 ✅ VALID
- 000000-2101936931 ✅ VALID (with prefix)
- 2892650103 ✅ VALID
- 279837114 ✅ VALID
```

## Files Generated

1. **test_valid_accounts.csv** - CSV with ČNB-compliant account numbers
2. **test_valid_accounts.kpc** - Generated ABO file for FIO Bank
3. **test_small_transactions_fixed.csv** - Previous version (some invalid accounts)

## Import Testing Results

### Previous Errors (Now Fixed)
```
❌ "Nenalezen oddělovač" - Missing account in group header
❌ "Hodnota čísla účtu má chybný formát" - Bank codes in payment lines  
❌ "Neodpovídá povinnému formátu ČNB" - Invalid account numbers
```

### Current Status
```
✅ Format validation: PASSED
✅ Account validation: PASSED  
✅ ČNB compliance: PASSED
Ready for FIO Bank import!
```

## Webapp Features

The webapp now includes:
- **Real-time validation** of account numbers using Modulo 11
- **Error prevention** - blocks conversion if invalid accounts detected
- **Detailed warnings** showing which accounts fail validation
- **Row-by-row feedback** for easy CSV file correction

## Usage

1. Use accounts from the valid test list above
2. Or generate new valid accounts using the Modulo 11 algorithm
3. The webapp will validate all accounts before conversion
4. Only ČNB-compliant files will be generated

## Technical Implementation

- **Backend**: `src/csv_to_abo_fio.py` - Full validation with warnings
- **Frontend**: `src/app/page.tsx` - Real-time validation during conversion  
- **Algorithm**: Standard Czech banking Modulo 11 checksum

---

**Result**: Czech bank account validation fully implemented per ČNB regulations! 🇨🇿 ✅