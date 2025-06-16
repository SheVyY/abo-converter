# Faktury to ABO Converter - Setup Guide

## Overview
This Google Apps Script transforms invoice CSV data from your accounting system into the format required by the ABO Converter tool.

## Transformation Details

### Source Format (Faktury CSV)
```csv
Jméno dodavatele,Celkem k úhradě,Číslo účtu,Kód banky,IBAN,Variabilní symbol,Zpráva pro příjemce,Datum splatnosti,...
Marie Čiháková,"3501,00",2600860716,2010,CZ80 2010 0000 0026 0086 0716,20250469,BELLA VIDA RESTAURANT s.r.o.,14.05.2025,...
```

### Target Format (ABO Converter)
```csv
vlastní účet,účet protistrany,částka,VS,KS,SS,poznámka pro příjemce,datum zaúčtování
,2600860716/2010,3501.00,20250469,0308,,,10.06.2025
```

## Setup Instructions

### 1. Create Google Sheets Document
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Faktury ABO Converter"

### 2. Prepare Data Sheet
1. Create a sheet named **"Faktury"**
2. Import your invoice CSV data into this sheet
3. Ensure the following columns are present:
   - `Jméno dodavatele`
   - `Celkem k úhradě`
   - `Číslo účtu`
   - `Kód banky`
   - `Variabilní symbol`

### 3. Install the Script
1. Go to **Extensions** → **Apps Script**
2. Delete the default `Code.gs` content
3. Copy and paste the content from `faktury_to_abo_converter.js`
4. Save the project (Ctrl+S or Cmd+S)
5. Name the project "Faktury ABO Converter"

### 4. Run the Transformation
1. Go back to your Google Sheets
2. Refresh the page
3. You'll see a new menu: **"ABO Tools"**
4. Click **ABO Tools** → **Transform Faktury to ABO Format**
5. Grant necessary permissions when prompted

### 5. Configure and Run
1. **First run**: You'll be prompted to enter your bank account number
   - Examples: `1234567890/2010` (FIO), `987654321/5500` (Raiffeisenbank)
   - You can pre-configure this in the script by setting `PAYER_ACCOUNT`
2. **Each run creates a unique timestamped sheet** (e.g., `ABO_2025-06-10_1545`)
3. **Automatic validation** handles edge cases and data errors

### 6. Download and Use
1. The script creates a new timestamped sheet (preserves conversion history)
2. Download this sheet as CSV:
   - **File** → **Download** → **Comma-separated values (.csv)**
3. Upload the downloaded CSV to your ABO Converter at `http://localhost:3333`

## Data Transformation Rules

| Source Column | Target Column | Transformation |
|---------------|---------------|----------------|
| *User Input* | `vlastní účet` | **User-prompted** payer account (e.g., `1234567890/2010`) |
| `Číslo účtu` + `Kód banky` | `účet protistrany` | Combined as `account/bank` format |
| `Celkem k úhradě` | `částka` | Convert `"3501,00"` → `3501.00` |
| `Variabilní symbol` | `VS` | Direct copy (max 10 digits) |
| - | `KS` | **Always "0308"** (as requested) |
| - | `SS` | **Empty** |
| `Zpráva pro příjemce` | `poznámka pro příjemce` | **Recipient message** (max 35 chars) |
| - | `datum zaúčtování` | **Current date** when script runs |

## Example Transformation

**Input:**
```csv
Jméno dodavatele,Celkem k úhradě,Číslo účtu,Kód banky,Variabilní symbol,Zpráva pro příjemce
Marie Čiháková,"3501,00",2600860716,2010,20250469,BELLA VIDA RESTAURANT s.r.o.
Jan Novák,"1250,50",1234567890,0800,20250470,Konzultace IT služby
```

**Output (with user-provided payer account: 9988776655/2010):**
```csv
vlastní účet,účet protistrany,částka,VS,KS,SS,poznámka pro příjemce,datum zaúčtování
9988776655/2010,2600860716/2010,3501.00,20250469,0308,,BELLA VIDA RESTAURANT s.r.o.,10.06.2025
9988776655/2010,1234567890/0800,1250.50,20250470,0308,,Konzultace IT služby,10.06.2025
```

## Features

✅ **Comprehensive Data Validation**: Account numbers, amounts, variable symbols
✅ **Automatic Format Conversion**: Handles Czech decimal format (`"3501,00"` → `3501.00`)
✅ **Account Number Formatting**: Combines account and bank code (`2600860716/2010`)
✅ **Recipient Messages**: Uses `Zpráva pro příjemce` from source data (max 35 chars)
✅ **User Account Prompt**: Interactive prompt for payer account if not predefined
✅ **Unique Sheet Names**: Timestamped sheets preserve conversion history
✅ **Edge Case Handling**: Empty rows, invalid amounts, malformed data
✅ **Text Sanitization**: Removes special characters, normalizes encoding
✅ **Warning System**: Detailed warnings for data issues and processing errors
✅ **Current Date**: Automatically sets today's date for `datum zaúčtování`
✅ **Error Recovery**: Continues processing despite individual row errors
✅ **User-Friendly Menu**: Easy access through "ABO Tools" menu with cleanup
✅ **Formatted Output**: Professional-looking output sheet with styling

## Troubleshooting

### Common Issues:

1. **"Sheet Faktury not found"**
   - Ensure your data sheet is named exactly "Faktury"
   - Check for extra spaces in the sheet name

2. **"Required column not found"**
   - Verify all required columns exist in your CSV
   - Check for typos in column headers

3. **"Invalid account format"**
   - Account numbers should be in format: `number/bank_code`
   - Examples: `1234567890/2010`, `000055-1122334455/2010`
   - Check for missing bank codes or invalid characters

4. **"Invalid amount format"**
   - Script handles: `"3501,00"`, `3501.00`, `"1 500,50"`, `1500.50`
   - Negative amounts are rejected
   - Maximum amount: 999,999,999.99

5. **Permission Errors**
   - Grant necessary permissions when prompted
   - Ensure you're the owner of the spreadsheet

6. **Data Processing Warnings**
   - Check the warning messages in the completion dialog
   - Common issues: empty rows, truncated variable symbols, long messages
   - Rows with critical errors are skipped but reported

## Next Steps

After transformation:
1. Download the CSV from the timestamped sheet (e.g., "ABO_2025-06-10_1545")
2. Open your ABO Converter at `http://localhost:3333`
3. Upload the transformed CSV file
4. Select your target bank (FIO Bank or Raiffeisenbank)
5. Generate your ABO file for banking import

**Note**: Each conversion creates a new timestamped sheet, preserving your conversion history. Use the "Clean Old ABO Sheets" menu option to keep only the 5 most recent conversions.

## Support

For issues with the transformation script, check:
- Column names match exactly
- Data format is consistent
- No empty required fields

The script automatically creates the proper format for the Czech ABO banking system with ČNB validation support.