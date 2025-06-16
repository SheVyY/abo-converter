# Google Apps Script Workflow Test

**Author**: Sebastian Hozak <hozaksebastian@gmail.com>

This document provides a comprehensive test workflow to verify the Google Apps Script ABO converter is working correctly.

## Test Checklist

### ✅ Phase 1: Setup Verification

- [ ] **Template Import Test**
  - Import `../examples/templates/google_sheets_template.csv` to Google Sheets
  - Verify all 20 rows of data are imported correctly
  - Check column headers match expected format
  - Ensure no data corruption during import

- [ ] **Apps Script Setup Test**
  - Open Extensions → Apps Script
  - Copy `Code.gs` content to Apps Script editor
  - Save project successfully
  - No syntax errors reported

- [ ] **Permission Grant Test**
  - Run `validateSheetData()` function
  - Grant required permissions when prompted
  - Function executes without errors
  - Validation summary appears with correct data count

### ✅ Phase 2: Data Validation

- [ ] **Column Recognition Test**
  - `validateSheetData()` identifies all required columns
  - Reports correct number of payment records (20)
  - Account validation passes for sample data
  - No critical validation errors

- [ ] **Data Processing Test**
  - Sample data is correctly parsed
  - Amounts are properly converted (decimal → integer)
  - Account numbers are formatted correctly
  - Czech characters are handled properly

### ✅ Phase 3: ABO Generation

- [ ] **Basic Generation Test**
  - Run `generateABOFile()` function
  - Enter client name when prompted
  - Function completes without errors
  - Success dialog appears

- [ ] **File Creation Test**
  - ABO file is saved to Google Drive
  - File has correct .kpc extension
  - File contains valid ABO format data
  - Download link works correctly

- [ ] **Content Validation Test**
  - Generated file starts with UHL1 header
  - Contains correct number of payment items
  - Ends with proper terminators (3 +, 5 +)
  - File structure matches ABO specification

### ✅ Phase 4: Button Integration

- [ ] **Button Creation Test**
  - Insert → Drawing creates button successfully
  - Button is visually appropriate (blue background, white text)
  - Button is positioned correctly in sheet

- [ ] **Script Assignment Test**
  - Button → Assign script works
  - Function name `generateABOFile` is accepted
  - Assignment saves successfully

- [ ] **Button Functionality Test**
  - Clicking button triggers the function
  - No errors during button execution
  - Same results as manual function execution

### ✅ Phase 5: End-to-End Workflow

- [ ] **Complete User Workflow Test**
  1. User imports template to Google Sheets ✅
  2. User sets up Apps Script with provided code ✅
  3. User creates and assigns button ✅
  4. User clicks button to generate ABO file ✅
  5. User downloads file from Google Drive ✅
  6. File is ready for banking system upload ✅

## Sample Test Data

### Expected Input (from template)
```csv
vlastní účet,účet protistrany,částka,VS,KS,SS,název účtu prostistrany,datum zaúčtování
123456789/5500,987654321/0800,1500.50,1234567890,0308,0,ACME Corporation,09.12.2025
```

### Expected ABO Output
```
UHL1091225GOOGLE SHEETS DEMO  1234567890001999111111222222
1 1501 111111 5500
2 123456789/5500 150050 091225
987654321/0800 150050 1234567890 03080800 AV:ACME Corporation
...
3 +
5 +
```

## Test Results Template

### Test Environment
- **Google Sheets Version**: ___________
- **Apps Script Runtime**: V8
- **Browser**: ___________
- **Date**: ___________

### Test Results

| Test Phase | Status | Notes |
|------------|--------|-------|
| Template Import | ✅ Pass / ❌ Fail | _____________ |
| Apps Script Setup | ✅ Pass / ❌ Fail | _____________ |
| Data Validation | ✅ Pass / ❌ Fail | _____________ |
| ABO Generation | ✅ Pass / ❌ Fail | _____________ |
| Button Integration | ✅ Pass / ❌ Fail | _____________ |
| End-to-End Workflow | ✅ Pass / ❌ Fail | _____________ |

### Performance Metrics
- **Data Processing Time**: _______ seconds (for 20 payments)
- **File Generation Time**: _______ seconds
- **Total Workflow Time**: _______ seconds

### Issues Found
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

### Recommendations
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

## Common Test Scenarios

### Scenario 1: Minimal Data Test
- **Data**: 1 payment with required fields only
- **Expected**: Single payment ABO file generated correctly

### Scenario 2: Large Dataset Test
- **Data**: 100+ payments (performance test)
- **Expected**: All payments processed, reasonable execution time

### Scenario 3: Invalid Data Test
- **Data**: Missing required fields, invalid account numbers
- **Expected**: Appropriate error messages, graceful failure

### Scenario 4: Czech Characters Test
- **Data**: Payment descriptions with Czech characters
- **Expected**: Characters converted to ASCII equivalents

### Scenario 5: Different Bank Codes Test
- **Data**: Payments to various Czech banks
- **Expected**: Correct bank codes preserved in output

## Troubleshooting Guide

### Issue: "No data found"
**Cause**: Column headers don't match expected format
**Solution**: Check column names, ensure exact match with template

### Issue: "Script timeout"
**Cause**: Processing too many payments at once
**Solution**: Split into smaller batches (< 100 payments)

### Issue: "Permission denied"
**Cause**: Insufficient Apps Script permissions
**Solution**: Re-run function and grant all requested permissions

### Issue: "Invalid account number"
**Cause**: Account numbers fail Modulo 11 validation
**Solution**: Verify account format and bank codes

### Issue: "Button doesn't work"
**Cause**: Script assignment failed or function name incorrect
**Solution**: Re-assign script with exact function name `generateABOFile`

## Success Criteria

✅ **Complete Success**: All test phases pass, workflow completes end-to-end

✅ **Partial Success**: Core functionality works, minor issues with setup or UI

❌ **Failure**: Critical errors prevent basic ABO file generation

## Test Completion

**Test Completed By**: _________________________
**Date**: ___________
**Overall Result**: ✅ Pass / ❌ Fail
**Ready for Production Use**: ✅ Yes / ❌ No

**Notes**: 
_________________________________________________
_________________________________________________
_________________________________________________

---

This test workflow ensures the Google Apps Script integration meets all requirements and provides a seamless user experience for ABO file generation directly from Google Sheets.