# Google Apps Script Setup Guide

**Author**: Sebastian Hozak <hozaksebastian@gmail.com>

Complete step-by-step guide for setting up ABO conversion in Google Sheets.

## Overview

This guide will help you set up a Google Sheet that can generate ABO (Automatic Banking Operations) files directly without downloading/uploading CSV files. Perfect for businesses that need to process payments regularly.

## Prerequisites

- Google account with Google Sheets access
- Basic understanding of Google Sheets
- Payment data ready for processing

## Step 1: Prepare Your Google Sheet

### 1.1 Import Template

1. **Download Template**:
   - Get `../examples/templates/google_sheets_template.csv`
   - This contains 20 sample payments with correct formatting

2. **Import to Google Sheets**:
   ```
   Google Sheets → File → Import → Upload
   Select: google_sheets_template.csv
   Import location: Create new spreadsheet
   Separator type: Detect automatically
   ```

3. **Verify Import**:
   - Check that headers are in row 1
   - Ensure data starts from row 2
   - Verify all columns are properly separated

### 1.2 Customize Your Data

**Replace Sample Data**:
- Column A: `vlastní účet` - Your payer accounts
- Column B: `účet protistrany` - Recipient accounts  
- Column C: `částka` - Payment amounts (use decimal point, not comma)
- Column D: `VS` - Variable symbols
- Column E: `KS` - Constant symbols
- Column F: `SS` - Specific symbols
- Column G: `název účtu prostistrany` - Recipient names
- Column H: `datum zaúčtování` - Due dates (DD.MM.YYYY format)

**Data Validation Rules**:
- ✅ Amounts: Use `1500.50` not `1,500.50`
- ✅ Dates: Use `15.12.2025` or `2025-12-15`
- ✅ Accounts: Include bank codes `123456789/5500`
- ✅ Required: Account numbers and amounts must not be empty

## Step 2: Set Up Apps Script

### 2.1 Open Apps Script Editor

```
Google Sheets → Extensions → Apps Script
```

This opens the Google Apps Script editor in a new tab.

### 2.2 Prepare the Code

1. **Delete Default Code**:
   - Remove any default `myFunction()` code
   
2. **Copy ABO Converter Code**:
   - Copy entire contents of `Code.gs`
   - Paste into the Apps Script editor
   
3. **Save the Project**:
   ```
   File → Save (or Ctrl+S)
   Project name: "ABO Converter for [Your Company]"
   ```

### 2.3 Test the Setup

1. **Run Validation Test**:
   ```
   Function: validateSheetData
   Run → (grant permissions if prompted)
   ```
   
2. **Check Results**:
   - Should show number of records found
   - Account validation summary
   - Any data format warnings

3. **Test File Generation**:
   ```
   Function: generateABOFile
   Run → Enter client name when prompted
   ```
   
   Expected result: ABO file created and saved to Google Drive

## Step 3: Add Generate Button

### 3.1 Method A: Drawing Button (Recommended)

1. **Insert Drawing**:
   ```
   Google Sheets → Insert → Drawing
   ```

2. **Create Button**:
   - Add text box with "Generate ABO File"
   - Choose background color (e.g., blue: #1976d2)
   - Set text color to white
   - Make it look like a button

3. **Save and Insert**:
   - Click "Save and Close"
   - Position the button in an empty area (e.g., cell J1)

4. **Assign Script**:
   - Click on the inserted drawing
   - Click three dots menu (⋮) in top right
   - Select "Assign script"
   - Enter function name: `generateABOFile`
   - Click "OK"

### 3.2 Method B: Custom Menu (Alternative)

Add this function to your Apps Script:

```javascript
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('ABO Converter')
    .addItem('Generate ABO File', 'generateABOFile')
    .addItem('Validate Data', 'validateSheetData')
    .addToUi();
}
```

This creates a custom menu in Google Sheets.

## Step 4: Configure Permissions

### 4.1 Grant Required Permissions

When you first run the script, Google will ask for permissions:

1. **Google Sheets Access**: ✅ Allow
   - Read and modify your spreadsheets
   
2. **Google Drive Access**: ✅ Allow
   - Create and manage files in your Drive
   
3. **External Services**: ✅ Allow
   - Display and run third-party web content

### 4.2 Security Review

- ✅ Script only accesses your own sheets and Drive
- ✅ No data is sent to external servers
- ✅ Generated files are private to your account

## Step 5: Test Complete Workflow

### 5.1 Prepare Test Data

1. **Small Dataset**: Start with 3-5 payments
2. **Valid Accounts**: Use real account numbers with correct bank codes
3. **Realistic Amounts**: Use actual payment amounts

### 5.2 Run Complete Test

1. **Click Generate Button**
2. **Enter Client Name**: Your company name (max 20 characters)
3. **Wait for Processing**: Usually 2-5 seconds
4. **Check Success Dialog**: Should show file creation confirmation
5. **Verify Google Drive**: Find the generated .kpc file

### 5.3 Validate Output

**Expected File Format**:
```
UHL1091225YOUR COMPANY      1234567890001999111111222222
1 1501 111111 5500
2 123456789/5500 150050 091225
987654321/0800 150050 1234567890 03085500 AV:John Doe
3 +
5 +
```

## Step 6: Production Use

### 6.1 Regular Workflow

1. **Update Data**: Replace test data with real payments
2. **Validate**: Click "Validate Data" to check format
3. **Generate**: Click "Generate ABO File" button
4. **Download**: Get file from Google Drive
5. **Upload**: Submit to your bank's system

### 6.2 Best Practices

**Data Management**:
- ✅ Keep backup of original data
- ✅ Use consistent date formats
- ✅ Validate account numbers before processing
- ✅ Process payments in manageable batches (< 100 items)

**File Management**:
- ✅ Use descriptive filenames with dates
- ✅ Delete old ABO files from Drive regularly
- ✅ Keep audit trail of processed payments

## Troubleshooting

### Common Setup Issues

**Script doesn't run**:
- Check permissions are granted
- Verify code was pasted correctly
- Try refreshing the Google Sheets page

**"No data found" error**:
- Check column headers match exactly
- Ensure data starts from row 2
- Verify sheet is not filtered

**Button doesn't work**:
- Re-assign script to drawing
- Check function name is exactly `generateABOFile`
- Try Method B (custom menu) instead

**File not generated**:
- Check Google Drive permissions
- Look for error messages in Apps Script logs
- Verify data validation passes

### Getting Help

1. **Run Diagnostics**: Use `validateSheetData()` function
2. **Check Logs**: Apps Script editor → Executions
3. **Test Data**: Use provided template first
4. **Documentation**: Refer to main README.md

## Advanced Configuration

### Custom Client Names

Edit the script to use a fixed client name:

```javascript
// In generateABOFile() function, replace the prompt with:
const clientName = 'YOUR COMPANY NAME'; // Fixed name
```

### Batch Processing

For large datasets, add batch processing:

```javascript
// Process in chunks of 50 payments
const chunkSize = 50;
const chunks = [];
for (let i = 0; i < csvData.length; i += chunkSize) {
  chunks.push(csvData.slice(i, i + chunkSize));
}
```

### Custom Validation Rules

Add business-specific validation:

```javascript
// Add to validateSheetData() function
data.forEach(record => {
  const amount = parseFloat(record['částka'] || '0');
  if (amount > 50000) {
    console.log(`High amount payment: ${amount} CZK`);
  }
});
```

## Security Considerations

### Data Protection
- ✅ Payment data remains in your Google account
- ✅ No external data transmission
- ✅ Files saved to your private Google Drive
- ✅ Access controlled by Google permissions

### Access Control
- 🔒 Limit sheet sharing to authorized users only
- 🔒 Use Google Workspace for enterprise control
- 🔒 Regular review of file access permissions
- 🔒 Enable 2-factor authentication on Google account

## Support

### Resources
- 📖 Main documentation: `README.md`
- 📊 Data format guide: `../examples/docs/csv_format_guide.md`
- 💻 Python version: `../src/csv_to_abo_raiffeisen.py`

### Updates
To update the script with new features:
1. Copy new version of `Code.gs`
2. Test with sample data
3. Re-assign button if function names changed

---

**Congratulations!** You now have a fully functional ABO file generator integrated directly into Google Sheets. This eliminates the need for downloading/uploading CSV files and provides a seamless payment processing workflow.