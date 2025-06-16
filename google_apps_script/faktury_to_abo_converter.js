/**
 * Google Apps Script: Faktury CSV to ABO Converter Format
 * 
 * This script transforms invoice CSV format to ABO converter format
 * for use with the Czech banking ABO conversion tool.
 * 
 * Author: Sebastian Hozak
 * Created: 2025-06-10
 */

function transformFakturyToABO() {
  // Configuration
  const SOURCE_SHEET_NAME = 'Faktury'; // Name of sheet with invoice data
  
  // Predefined payer account (empty = ask user)
  // Example: '1234567890/2010' for FIO Bank or '987654321/5500' for Raiffeisenbank
  let PAYER_ACCOUNT = ''; // Leave empty to prompt user
  
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Get source data
  const sourceSheet = spreadsheet.getSheetByName(SOURCE_SHEET_NAME);
  if (!sourceSheet) {
    throw new Error(`Sheet "${SOURCE_SHEET_NAME}" not found. Please create it or update the sheet name.`);
  }
  
  const sourceData = sourceSheet.getDataRange().getValues();
  const headers = sourceData[0];
  const rows = sourceData.slice(1);
  
  // Find column indices in source data
  const columnMap = {};
  headers.forEach((header, index) => {
    columnMap[header] = index;
  });
  
  // Validate required columns exist
  const requiredColumns = ['Jméno dodavatele', 'Celkem k úhradě', 'Číslo účtu', 'Kód banky', 'Variabilní symbol'];
  for (const col of requiredColumns) {
    if (columnMap[col] === undefined) {
      throw new Error(`Required column "${col}" not found in source data.`);
    }
  }
  
  // Get payer account - prompt user if not predefined
  if (!PAYER_ACCOUNT || PAYER_ACCOUNT.trim() === '') {
    const ui = SpreadsheetApp.getUi();
    const response = ui.prompt(
      'Vlastní účet (Payer Account)',
      'Zadejte číslo svého účtu ve formátu: číslo/kód_banky\n\n' +
      'Příklady:\n' +
      '• FIO Bank: 1234567890/2010\n' +
      '• Raiffeisenbank: 987654321/5500\n' +
      '• Komerční banka: 555666777/0100\n' +
      '• Česká spořitelna: 888999000/0800\n' +
      '• S prefixem: 000055-1122334455/2010\n\n' +
      'Váš účet:',
      ui.ButtonSet.OK_CANCEL
    );
    
    if (response.getSelectedButton() === ui.Button.CANCEL) {
      throw new Error('Conversion cancelled by user.');
    }
    
    PAYER_ACCOUNT = response.getResponseText().trim();
    if (!PAYER_ACCOUNT) {
      throw new Error('Payer account is required. Please run the script again and enter your account number.');
    }
    
    // Basic validation of payer account format
    if (!validateAccountFormat(PAYER_ACCOUNT)) {
      throw new Error(`Invalid account format: "${PAYER_ACCOUNT}". Expected format: number/bank_code (e.g., 1234567890/2010)`);
    }
  }
  
  // Create unique sheet name with timestamp
  const now = new Date();
  const timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmm');
  const TARGET_SHEET_NAME = `ABO_${timestamp}`;
  
  // Create new target sheet (always new, never overwrite)
  const targetSheet = spreadsheet.insertSheet(TARGET_SHEET_NAME);
  
  // ABO converter format headers
  const aboHeaders = [
    'vlastní účet',
    'účet protistrany', 
    'částka',
    'VS',
    'KS',
    'SS',
    'poznámka pro příjemce', // Renamed from "název účtu prostistrany"
    'datum zaúčtování'
  ];
  
  // Set headers
  targetSheet.getRange(1, 1, 1, aboHeaders.length).setValues([aboHeaders]);
  
  // Get current date for datum zaúčtování
  const currentDate = new Date();
  const formattedDate = Utilities.formatDate(currentDate, Session.getScriptTimeZone(), 'dd.MM.yyyy');
  
  // Transform data with comprehensive edge case handling
  const transformedRows = [];
  const warnings = [];
  let skippedRows = 0;
  
  rows.forEach((row, index) => {
    try {
      const rowNumber = index + 2; // +2 for header and 0-based index
      
      // Skip completely empty rows
      if (isRowEmpty(row)) {
        skippedRows++;
        return;
      }
      
      // Extract source values with sanitization
      const dodavatel = sanitizeText(row[columnMap['Jméno dodavatele']] || '');
      const celkem = row[columnMap['Celkem k úhradě']] || '';
      const cisloUctu = sanitizeAccountNumber(row[columnMap['Číslo účtu']] || '');
      const kodBanky = sanitizeBankCode(row[columnMap['Kód banky']] || '');
      const variabilniSymbol = sanitizeVariableSymbol(row[columnMap['Variabilní symbol']] || '');
      
      // Extract message for recipient (optional column)
      let zpravaPrijemce = '';
      if (columnMap['Zpráva pro příjemce'] !== undefined) {
        zpravaPrijemce = sanitizeRecipientMessage(row[columnMap['Zpráva pro příjemce']] || '');
      }
      
      // Validate required fields
      if (!cisloUctu || !kodBanky) {
        warnings.push(`Row ${rowNumber}: Missing account number or bank code`);
        return; // Skip this row
      }
      
      // Transform and validate amount
      let castka = '';
      try {
        castka = processAmount(celkem);
        if (parseFloat(castka) <= 0) {
          warnings.push(`Row ${rowNumber}: Invalid amount "${celkem}" - must be positive`);
          return; // Skip this row
        }
      } catch (amountError) {
        warnings.push(`Row ${rowNumber}: Invalid amount format "${celkem}" - ${amountError.message}`);
        return; // Skip this row
      }
      
      // Create and validate účet protistrany
      let ucetProtistrany = `${cisloUctu}/${kodBanky}`;
      if (!validateAccountFormat(ucetProtistrany)) {
        warnings.push(`Row ${rowNumber}: Invalid account format "${ucetProtistrany}"`);
        // Continue with the row but flag the issue
      }
      
      // Validate variable symbol length
      if (variabilniSymbol && variabilniSymbol.length > 10) {
        warnings.push(`Row ${rowNumber}: Variable symbol too long, truncating to 10 digits`);
      }
      
      // Create transformed row
      const transformedRow = [
        PAYER_ACCOUNT, // vlastní účet - user provided or predefined
        ucetProtistrany, // účet protistrany - account/bank format
        castka, // částka - decimal format
        variabilniSymbol.substring(0, 10), // VS - variable symbol (max 10 digits)
        '0308', // KS - always 0308 as requested
        '', // SS - empty
        zpravaPrijemce.substring(0, 35), // poznámka pro příjemce - max 35 chars for ABO format
        formattedDate // datum zaúčtování - current date
      ];
      
      transformedRows.push(transformedRow);
      
    } catch (error) {
      console.error(`Error processing row ${index + 2}:`, error);
      warnings.push(`Row ${index + 2}: Processing error - ${error.message}`);
      // Add error row for debugging
      transformedRows.push([
        `ERROR: Row ${index + 2}`,
        error.message,
        '', '', '', '', '', ''
      ]);
    }
  });
  
  // Write transformed data
  if (transformedRows.length > 0) {
    targetSheet.getRange(2, 1, transformedRows.length, aboHeaders.length).setValues(transformedRows);
  }
  
  // Format the output sheet
  formatABOSheet(targetSheet, transformedRows.length + 1);
  
  // Activate the new sheet so it's selected for the user
  targetSheet.activate();
  
  // Show completion message with unique sheet name
  const ui = SpreadsheetApp.getUi();
  const hasRecipientMessages = rows.some(row => 
    columnMap['Zpráva pro příjemce'] !== undefined && 
    (row[columnMap['Zpráva pro příjemce']] || '').trim() !== ''
  );
  
  // Show warnings if any
  let warningMessage = '';
  if (warnings.length > 0) {
    warningMessage = `\n⚠️ Warnings (${warnings.length}):\n${warnings.slice(0, 5).join('\n')}`;
    if (warnings.length > 5) {
      warningMessage += `\n... and ${warnings.length - 5} more warnings`;
    }
  }
  
  ui.alert(
    'Transformation Complete!',
    `✅ Successfully transformed ${transformedRows.length} invoice records to ABO format.\n\n` +
    `📋 New sheet created: "${TARGET_SHEET_NAME}"\n` +
    `📅 Generated: ${Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm')}\n` +
    `💳 Payer account: ${PAYER_ACCOUNT}\n` +
    `💬 Recipient messages: ${hasRecipientMessages ? 'Included' : 'None found'}\n` +
    `📊 Processed: ${rows.length} rows, ${skippedRows} empty rows skipped\n` +
    warningMessage + '\n\n' +
    `📥 Next steps:\n` +
    `1. Select the "${TARGET_SHEET_NAME}" sheet\n` +
    `2. Download as CSV: File → Download → Comma-separated values (.csv)\n` +
    `3. Upload to ABO Converter at http://localhost:3333\n\n` +
    `💡 Each conversion creates a new sheet to preserve history.`,
    ui.ButtonSet.OK
  );
  
  return {
    success: true,
    recordsProcessed: transformedRows.length,
    outputSheet: TARGET_SHEET_NAME,
    timestamp: Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
  };
}

/**
 * Format the ABO output sheet for better readability
 */
function formatABOSheet(sheet, totalRows) {
  // Set column widths
  const columnWidths = [120, 200, 100, 120, 80, 80, 200, 120];
  columnWidths.forEach((width, index) => {
    sheet.setColumnWidth(index + 1, width);
  });
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, 8);
  headerRange.setBackground('#e8f0fe');
  headerRange.setFontWeight('bold');
  headerRange.setBorder(true, true, true, true, true, true);
  
  // Format data rows
  if (totalRows > 1) {
    const dataRange = sheet.getRange(2, 1, totalRows - 1, 8);
    dataRange.setBorder(true, true, true, true, true, true);
    
    // Alternate row colors
    for (let i = 2; i <= totalRows; i++) {
      if (i % 2 === 0) {
        sheet.getRange(i, 1, 1, 8).setBackground('#f8f9fa');
      }
    }
  }
  
  // Freeze header row
  sheet.setFrozenRows(1);
}

/**
 * Create a menu item for easy access
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('ABO Tools')
    .addItem('Transform Faktury to ABO Format', 'transformFakturyToABO')
    .addSeparator()
    .addItem('Clean Old ABO Sheets', 'cleanOldABOSheets')
    .addSeparator()
    .addItem('Help', 'showHelp')
    .addToUi();
}

/**
 * Clean up old ABO conversion sheets (keep only last 5)
 */
function cleanOldABOSheets() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Clean Old ABO Sheets',
    'This will keep only the 5 most recent ABO conversion sheets and delete the rest.\n\nDo you want to continue?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    return;
  }
  
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = spreadsheet.getSheets();
  
  // Find all ABO sheets (sheets starting with "ABO_")
  const aboSheets = sheets
    .filter(sheet => sheet.getName().startsWith('ABO_'))
    .sort((a, b) => a.getName().localeCompare(b.getName()))
    .reverse(); // Newest first
  
  // Keep only the 5 most recent, delete the rest
  const sheetsToDelete = aboSheets.slice(5);
  
  if (sheetsToDelete.length === 0) {
    ui.alert('No Cleanup Needed', 'You have 5 or fewer ABO sheets. No cleanup required.', ui.ButtonSet.OK);
    return;
  }
  
  sheetsToDelete.forEach(sheet => {
    spreadsheet.deleteSheet(sheet);
  });
  
  ui.alert(
    'Cleanup Complete',
    `Deleted ${sheetsToDelete.length} old ABO conversion sheets.\nKept the 5 most recent conversions.`,
    ui.ButtonSet.OK
  );
}

/**
 * Show help dialog
 */
function showHelp() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'ABO Converter Help',
    'This tool transforms invoice data to ABO converter format.\n\n' +
    'Required columns in source sheet "Faktury":\n' +
    '• Jméno dodavatele\n' +
    '• Celkem k úhradě\n' +
    '• Číslo účtu\n' +
    '• Kód banky\n' +
    '• Variabilní symbol\n\n' +
    'Optional columns:\n' +
    '• Zpráva pro příjemce (recipient message)\n\n' +
    'Output format:\n' +
    '• vlastní účet: prompted from user or predefined\n' +
    '• účet protistrany: account/bank format\n' +
    '• částka: decimal format\n' +
    '• VS: variable symbol\n' +
    '• KS: always 0308\n' +
    '• SS: (empty)\n' +
    '• poznámka pro příjemce: from "Zpráva pro příjemce"\n' +
    '• datum zaúčtování: current date\n\n' +
    'Configuration:\n' +
    '• You can predefine PAYER_ACCOUNT in the script\n' +
    '• If empty, you will be prompted to enter your account\n\n' +
    'After transformation, download as CSV and upload to ABO Converter.',
    ui.ButtonSet.OK
  );
}

// =============================================================================
// VALIDATION AND SANITIZATION HELPER FUNCTIONS
// =============================================================================

/**
 * Validate Czech bank account format
 * Supports: number/bank_code or prefix-number/bank_code
 */
function validateAccountFormat(account) {
  if (!account || typeof account !== 'string') {
    return false;
  }
  
  // Pattern: [prefix-]account/bank_code
  // Examples: 1234567890/2010, 000055-1122334455/2010, 123456/0800
  const accountPattern = /^(\d{1,6}-)?[\d\s]{2,10}\/\d{4}$/;
  return accountPattern.test(account.replace(/\s/g, ''));
}

/**
 * Sanitize general text fields
 */
function sanitizeText(text) {
  if (!text) return '';
  
  return String(text)
    .trim()
    .replace(/[\r\n\t]/g, ' ')  // Replace newlines/tabs with spaces
    .replace(/\s+/g, ' ')       // Multiple spaces to single space
    .replace(/[^\x20-\x7E\u00C0-\u017F]/g, ''); // Keep ASCII + Latin extended
}

/**
 * Sanitize and format account number
 */
function sanitizeAccountNumber(account) {
  if (!account) return '';
  
  return String(account)
    .trim()
    .replace(/\s/g, '')  // Remove all spaces
    .replace(/[^0-9-]/g, ''); // Keep only digits and hyphens
}

/**
 * Sanitize bank code
 */
function sanitizeBankCode(bankCode) {
  if (!bankCode) return '';
  
  // Convert to string and keep only digits
  const sanitized = String(bankCode)
    .trim()
    .replace(/[^0-9]/g, '');
  
  // Pad with leading zeros to 4 digits if needed
  return sanitized.padStart(4, '0');
}

/**
 * Sanitize variable symbol
 */
function sanitizeVariableSymbol(vs) {
  if (!vs) return '';
  
  return String(vs)
    .trim()
    .replace(/[^0-9]/g, '') // Keep only digits
    .substring(0, 10); // Max 10 digits for ABO format
}

/**
 * Sanitize recipient message for ABO format
 */
function sanitizeRecipientMessage(message) {
  if (!message) return '';
  
  return sanitizeText(message)
    .substring(0, 35); // ABO format limit is 35 characters
}

/**
 * Process and validate amount from various formats
 * Handles: "1500,50", "1500.50", 1500.50, "1 500,50", etc.
 */
function processAmount(amount) {
  if (!amount && amount !== 0) {
    throw new Error('Amount is required');
  }
  
  let cleanAmount = String(amount).trim();
  
  // Remove currency symbols and extra spaces
  cleanAmount = cleanAmount
    .replace(/[^\d,.\-\s]/g, '')  // Keep only digits, comma, dot, minus, spaces
    .replace(/\s/g, '');          // Remove spaces
  
  // Handle Czech format: "1500,50" -> "1500.50"
  if (cleanAmount.includes(',')) {
    // If both comma and dot exist, assume comma is decimal separator
    if (cleanAmount.includes('.')) {
      // Format like "1.500,50" (European style with thousand separator)
      cleanAmount = cleanAmount.replace(/\./g, '').replace(',', '.');
    } else {
      // Simple comma decimal: "1500,50"
      cleanAmount = cleanAmount.replace(',', '.');
    }
  }
  
  const numericAmount = parseFloat(cleanAmount);
  
  if (isNaN(numericAmount)) {
    throw new Error(`Invalid amount format: "${amount}"`);
  }
  
  if (numericAmount < 0) {
    throw new Error('Amount cannot be negative');
  }
  
  if (numericAmount > 999999999.99) {
    throw new Error('Amount too large (max 999,999,999.99)');
  }
  
  // Return formatted to 2 decimal places
  return numericAmount.toFixed(2);
}

/**
 * Check if a row is completely empty or contains only whitespace
 */
function isRowEmpty(row) {
  if (!row || !Array.isArray(row)) {
    return true;
  }
  
  return row.every(cell => {
    if (cell === null || cell === undefined) return true;
    if (typeof cell === 'string') return cell.trim() === '';
    if (typeof cell === 'number') return false; // Numbers are never empty
    return String(cell).trim() === '';
  });
}