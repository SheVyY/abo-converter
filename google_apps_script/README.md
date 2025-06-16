# Google Apps Script ABO Converter

**Author**: Sebastian Hozak <hozaksebastian@gmail.com>

This directory contains Google Apps Script code for converting Google Sheets data directly to ABO format without the need to download/upload CSV files.

## Quick Setup Guide

### 1. Prepare Your Google Sheet

1. **Import Template**: 
   - Download `../examples/templates/google_sheets_template.csv`
   - Import into Google Sheets (File → Import → Upload)

2. **Customize Data**:
   - Replace sample data with your actual payments
   - Ensure column headers match expected format
   - Required columns: `vlastní účet`, `účet protistrany`, `částka`, `VS`, `KS`, `SS`, `název účtu prostistrany`, `datum zaúčtování`

### 2. Set Up Apps Script

1. **Open Script Editor**:
   - In Google Sheets: Extensions → Apps Script

2. **Copy Code**:
   - Copy contents of `Code.gs` into the Apps Script editor
   - Save the project (Ctrl+S)

3. **Test Function**:
   - Run `validateSheetData()` to test your data
   - Run `generateABOFile()` to create your first ABO file

### 3. Add Generate Button

**Option A: Insert Drawing (Recommended)**

1. Insert → Drawing
2. Add a text box or shape with "Generate ABO File"
3. Save and close the drawing
4. Click the drawing → Three dots menu → "Assign script"
5. Enter function name: `generateABOFile`
6. Save

**Option B: Use Menu**

1. Extensions → Apps Script
2. Run `generateABOFile()` directly from the editor

## Features

### ✅ Core Functionality
- **Direct Conversion**: Converts Google Sheets data to ABO format
- **Raiffeisenbank Support**: Full support for bank code 5500
- **Account Validation**: Modulo 11 algorithm for Czech accounts
- **Czech Characters**: Automatic conversion to ASCII
- **File Download**: Creates downloadable .kpc files
- **Google Drive Integration**: Saves files directly to Drive

### ✅ Data Processing
- **Flexible Headers**: Supports various column name formats
- **Amount Formatting**: Converts decimals to 1/100 format
- **Date Handling**: Supports DD.MM.YYYY and YYYY-MM-DD formats
- **Payment Grouping**: Groups by payer account
- **Symbol Processing**: VS, KS, SS symbols with validation

### ✅ Error Handling
- **Data Validation**: Checks for required fields
- **User Feedback**: Clear error messages and success dialogs
- **Account Verification**: Validates account numbers before processing

## File Structure

```
google_apps_script/
├── Code.gs                 # Main Apps Script code
├── README.md              # This documentation
├── setup_guide.md         # Detailed setup instructions
└── examples/              # Example configurations
    ├── sample_button.png  # Button setup screenshot
    └── sample_output.kpc  # Example ABO output
```

## Functions Reference

### Main Functions

#### `generateABOFile()`
- **Purpose**: Main function to convert sheet data to ABO format
- **Triggers**: Button click or manual execution
- **Process**:
  1. Reads data from active sheet
  2. Prompts for client name
  3. Generates ABO content
  4. Saves to Google Drive
  5. Shows success dialog with download link

#### `validateSheetData()`
- **Purpose**: Validates current sheet data without generating file
- **Use**: Testing and debugging data format
- **Output**: Shows validation summary with account verification

#### `addGenerateABOButton()`
- **Purpose**: Helper to set up the Generate ABO button
- **Use**: Run once to get instructions for button setup

### Data Processing Functions

#### `getSheetData(sheet)`
- **Purpose**: Extracts payment data from Google Sheet
- **Input**: Sheet object
- **Output**: Array of payment records
- **Features**: Flexible column mapping, empty row filtering

### Conversion Class: `CSVToABORaiffeisen`

#### Core Methods
- `generateABO(csvData, clientName, groupByAccount)` - Main conversion
- `validateAccountModulo11(accountStr)` - Account validation
- `formatAccountNumber(accountStr)` - Account formatting
- `generateUHL1Header(clientName)` - File header generation
- `convertCzechToAscii(text)` - Character normalization

## Usage Examples

### Basic Usage

```javascript
// Run from Apps Script editor
function testConversion() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = getSheetData(sheet);
  const converter = new CSVToABORaiffeisen();
  const aboContent = converter.generateABO(data, 'TEST COMPANY');
  console.log(aboContent);
}
```

### Custom Validation

```javascript
function customValidation() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = getSheetData(sheet);
  
  data.forEach((record, index) => {
    const amount = parseFloat(record['částka'] || '0');
    if (amount > 1000000) {
      console.log(`Row ${index + 2}: Large amount detected - ${amount}`);
    }
  });
}
```

## Expected Data Format

### Required Columns
| Column Name | Description | Example |
|-------------|-------------|---------|
| `vlastní účet` | Payer account | `123456789/5500` |
| `účet protistrany` | Payee account | `987654321/0800` |
| `částka` | Amount | `1500.50` |
| `datum zaúčtování` | Due date | `15.12.2025` |

### Optional Columns
| Column Name | Description | Example |
|-------------|-------------|---------|
| `VS` | Variable symbol | `123456789` |
| `KS` | Constant symbol | `0308` |
| `SS` | Specific symbol | `123456789` |
| `název účtu prostistrany` | Payee name | `John Doe` |

## Troubleshooting

### Common Issues

**"No data found"**
- Check column headers match expected format
- Ensure data starts from row 2 (row 1 should be headers)
- Verify amounts and account numbers are not empty

**"Invalid account number"**
- Check account format: `123456789/5500`
- Ensure Czech account validation (Modulo 11)
- Verify bank codes are correct

**"Script timeout"**
- Process smaller batches (max 100-200 payments)
- Split large datasets into multiple files

**"Permission denied"**
- Grant necessary permissions to Apps Script
- Check Google Drive access permissions

### Data Validation Tips

1. **Test with Small Dataset**: Start with 5-10 payments
2. **Check Headers**: Use exact column names from template
3. **Validate Accounts**: Run `validateSheetData()` first
4. **Verify Amounts**: Use decimal format (1500.50, not 1,500.50)
5. **Date Format**: Use DD.MM.YYYY or YYYY-MM-DD

## Integration with Banking Systems

### Raiffeisenbank
1. Generate ABO file using this script
2. Download from Google Drive
3. Upload to Raiffeisenbank online banking
4. Process payments through their system

### File Specifications
- **Format**: Windows-1250 encoding (simulated in Apps Script)
- **Line Endings**: CR+LF (\\r\\n)
- **Extension**: .kpc (standard for ABO files)
- **Structure**: UHL1 header + payment groups + terminators

## Security Considerations

### Data Protection
- **No Data Storage**: Script doesn't store payment data permanently
- **Google Drive**: Files saved to your personal Drive only
- **Access Control**: Only you can access the generated files
- **Audit Trail**: Google Apps Script maintains execution logs

### Best Practices
1. **Limit Access**: Share sheet only with authorized users
2. **Regular Cleanup**: Delete old ABO files from Drive
3. **Data Validation**: Always validate before processing
4. **Test Environment**: Use sample data for testing

## Support and Updates

### Getting Help
1. **Validation Issues**: Run `validateSheetData()` for diagnostics
2. **Data Format**: Check `../examples/docs/csv_format_guide.md`
3. **Error Messages**: Check Google Apps Script execution logs

### Updating the Script
1. Copy new version of `Code.gs`
2. Test with sample data
3. Update button assignments if function names changed

---

This Google Apps Script implementation provides a seamless way to generate ABO files directly from Google Sheets without downloading/uploading CSV files.