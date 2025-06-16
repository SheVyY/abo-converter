# CSV Format Guide for Raiffeisenbank ABO Conversion

**Author**: Sebastian Hozak <hozaksebastian@gmail.com>

## Overview

This guide explains the CSV format required for converting payment data to Raiffeisenbank ABO format. Use this as a template for creating your own payment files in Google Sheets, Excel, or any CSV editor.

## CSV Template Files

1. **`raiffeisen_payments_template.csv`** - Basic template with 10 sample transactions
2. **`raiffeisen_google_sheets_template.csv`** - Extended template with 20 transactions covering all major Czech banks

## CSV Column Structure

### Required Columns (Czech Headers)

| Column | Czech Name | Description | Example | Notes |
|--------|------------|-------------|---------|-------|
| 1 | `vlastní účet` | Payer account number | `123456-1234567890` | Your Raiffeisenbank account |
| 2 | `účet protistrany` | Payee account number | `654321-0987654321/0300` | Include bank code after / |
| 3 | `pořadové číslo` | Transaction sequence number | `001` | Sequential numbering |
| 4 | `částka` | Amount | `1500.50` | Decimal format, use . or , |
| 5 | `kód účtování` | Transaction type code | `2` | Usually 2 for outgoing payments |
| 6 | `VS` | Variable symbol | `1234567890` | Up to 10 digits |
| 7 | `KS` | Constant symbol | `0308` | Usually 0308 for payments |
| 8 | `SS` | Specific symbol | `9876543210` | Up to 10 digits, optional |
| 9 | `název účtu prostistrany` | Payee name | `COMPANY NAME S.R.O.` | Recipient organization |
| 10 | `kód měny` | Currency code | `CZK` | Usually CZK |
| 11 | `datum zaúčtování` | Payment date | `15.12.2024` | DD.MM.YYYY format |

## Field Details

### 1. Vlastní účet (Payer Account)
- **Format**: `prefix-account` or just `account`
- **Example**: `123456-1234567890`
- **Notes**: Your Raiffeisenbank account number

### 2. Účet protistrany (Payee Account)
- **Format**: `account/bank_code` or `prefix-account/bank_code`
- **Examples**: 
  - `654321-0987654321/0300` (ČSOB)
  - `111111-2222222222/5500` (Raiffeisenbank)
  - `2892650103/2010` (FIO Bank - no prefix)

### 3. Částka (Amount)
- **Format**: Decimal number
- **Examples**: `1500.50`, `25000.00`, `890.25`
- **Notes**: Use either `.` or `,` as decimal separator

### 4. Kód účtování (Transaction Code)
- **Values**:
  - `1` = Debit (outgoing, negative)
  - `2` = Credit (incoming, positive)
  - `4` = Debit reversal
  - `5` = Credit reversal
- **Default**: Use `2` for standard outgoing payments

### 5. VS (Variable Symbol)
- **Format**: Up to 10 digits
- **Examples**: `1234567890`, `2025010001`
- **Notes**: Used for payment identification

### 6. KS (Constant Symbol)
- **Common values**:
  - `0308` = Standard payments
  - `0558` = Loan payments
  - `0968` = Insurance payments
- **Default**: Use `0308` for general payments

### 7. SS (Specific Symbol)
- **Format**: Up to 10 digits
- **Examples**: `9876543210`, `1111111111`
- **Notes**: Additional payment reference, often optional

### 8. Název účtu prostistrany (Payee Name)
- **Format**: Text, up to 35 characters
- **Examples**: `DODAVATEL MATERIÁLU S.R.O.`, `RAIFFEISEN KLIENT`
- **Notes**: Company or person name receiving payment

### 9. Datum zaúčtování (Payment Date)
- **Format**: `DD.MM.YYYY`
- **Examples**: `15.01.2025`, `31.12.2024`
- **Notes**: When the payment should be processed

## Czech Bank Codes Reference

| Bank | Code | Example Account |
|------|------|----------------|
| Raiffeisenbank | 5500 | `123456-1234567890/5500` |
| ČSOB | 0300 | `654321-0987654321/0300` |
| Komerční banka | 0100 | `333333-4444444444/0100` |
| FIO Banka | 2010 | `777777-8888888888/2010` |
| Česká spořitelna | 0800 | `999999-0000000000/0800` |
| Moneta Money Bank | 6000 | `123123-4564564567/6000` |
| Air Bank | 3030 | `456789-1234567890/3030` |
| Equa Bank | 4000 | `321321-9876543210/4000` |
| UniCredit Bank | 2700 | `654654-3213213210/2700` |

## Google Sheets Setup

### 1. Create New Spreadsheet
1. Open Google Sheets
2. Create new spreadsheet
3. Name it "Raiffeisenbank Payments"

### 2. Import Template
1. Download `raiffeisen_google_sheets_template.csv`
2. File → Import → Upload → Select file
3. Choose "Replace spreadsheet"

### 3. Customize Data
1. Replace sample data with your actual payments
2. Update account numbers to your real accounts
3. Modify amounts, dates, and recipient details
4. Add/remove rows as needed

### 4. Export for Conversion
1. File → Download → Comma-separated values (.csv)
2. Save file locally
3. Use with ABO converter: `python3 abo_converter.py --csv-to-abo payments.csv --output payments.kpc`

## Validation Tips

### Account Numbers
- Use valid Czech account format with Modulo 11 check
- Include bank codes for non-Raiffeisenbank accounts
- Omit bank code for internal Raiffeisenbank transfers

### Amounts
- Use consistent decimal separator (. or ,)
- No currency symbols or thousands separators
- Positive numbers for outgoing payments

### Dates
- Use DD.MM.YYYY format consistently
- Ensure dates are not in the past
- Consider banking holidays and weekends

### Names
- Use official company names
- Avoid special characters that might cause encoding issues
- Maximum 35 characters for compatibility

## Example Usage

```bash
# Convert your CSV to ABO format
python3 abo_converter.py --csv-to-abo my_payments.csv --output payments.kpc --client "MY COMPANY"

# Validate the generated file
python3 abo_converter.py --validate payments.kpc

# Check the structure
python3 src/abo_validator.py payments.kpc
```

## Common Errors

### Invalid Account Numbers
- **Error**: Account fails Modulo 11 validation
- **Solution**: Use valid Czech account numbers or disable validation

### Encoding Issues
- **Error**: Special characters not displaying correctly
- **Solution**: Save CSV in UTF-8 encoding

### Date Format Problems
- **Error**: Date not recognized
- **Solution**: Use DD.MM.YYYY format consistently

### Amount Formatting
- **Error**: Amount conversion fails
- **Solution**: Use decimal format without currency symbols

---

This template provides a complete foundation for creating Raiffeisenbank payment files that can be processed by the ABO converter.