/**
 * ABO Converter for Google Sheets
 * ===============================
 * 
 * This Google Apps Script converts CSV data from Google Sheets into ABO format
 * supporting multiple Czech banks: Raiffeisenbank (5500) and FIO Bank (2010).
 * 
 * Author: Sebastian Hozak <hozaksebastian@gmail.com>
 * Created: 2025
 * License: MIT
 * 
 * Features:
 * - Direct conversion from Google Sheets to ABO format
 * - Support for Raiffeisenbank and FIO Bank ABO specifications
 * - Account number validation using Modulo 11 algorithm
 * - Czech character normalization for ASCII compliance
 * - Automatic file download or Google Drive storage
 * 
 * Usage:
 * 1. Import your CSV template into Google Sheets
 * 2. Add a button that calls generateABOFile()
 * 3. Click the button to generate and download the ABO file
 */

// Configuration constants
const RAIFFEISEN_BANK_CODE = '5500';
const FIO_BANK_CODE = '2010';
const OUTPUT_ENCODING = 'windows-1250'; // Note: Apps Script uses UTF-8, but we'll simulate

/**
 * Main function to generate ABO file from current Google Sheet
 * This function should be triggered by a button in the sheet
 */
function generateABOFile() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = getSheetData(sheet);
    
    if (!data || data.length === 0) {
      SpreadsheetApp.getUi().alert('Error', 'No data found in the sheet. Please check your data format.', SpreadsheetApp.getUi().Buttons.OK);
      return;
    }
    
    // Get client name and bank selection from user
    const ui = SpreadsheetApp.getUi();
    
    // Bank selection dialog
    const bankResponse = ui.alert(
      'Select Bank',
      'Which bank format should be used for the ABO file?\n\n' +
      'Click "Yes" for Raiffeisenbank (5500)\n' +
      'Click "No" for FIO Bank (2010)\n' +
      'Click "Cancel" to abort',
      ui.Buttons.YES_NO_CANCEL
    );
    
    if (bankResponse === ui.Button.CANCEL) {
      return; // User cancelled
    }
    
    const isRaiffeisen = bankResponse === ui.Button.YES;
    const bankName = isRaiffeisen ? 'Raiffeisenbank' : 'FIO Bank';
    const bankCode = isRaiffeisen ? RAIFFEISEN_BANK_CODE : FIO_BANK_CODE;
    
    // Client name dialog
    const clientResponse = ui.prompt('Client Name', `Enter client name for ${bankName} ABO file header (max 20 characters):`, ui.Buttons.OK_CANCEL);
    
    if (clientResponse.getSelectedButton() !== ui.Button.OK) {
      return; // User cancelled
    }
    
    const clientName = clientResponse.getResponseText() || 'KLIENT';
    
    // Generate ABO content
    let converter, aboContent;
    if (isRaiffeisen) {
      converter = new CSVToABORaiffeisen();
      aboContent = converter.generateABO(data, clientName);
    } else {
      converter = new CSVToABOFIO();
      aboContent = converter.generateABO(data, clientName);
    }
    
    // Create filename with current date and bank name
    const now = new Date();
    const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd');
    const bankPrefix = isRaiffeisen ? 'raiffeisen' : 'fio';
    const filename = `${bankPrefix}_payments_${dateStr}.kpc`;
    
    // Create blob and download
    const blob = Utilities.newBlob(aboContent, 'text/plain; charset=windows-1250', filename);
    
    // Option 1: Save to Google Drive
    const file = DriveApp.createFile(blob);
    const fileUrl = file.getUrl();
    
    // Show success message with download link
    const htmlOutput = HtmlService.createHtmlOutput(`
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h3 style="color: #2e7d32;">✅ ABO File Generated Successfully!</h3>
        <p><strong>File:</strong> ${filename}</p>
        <p><strong>Bank:</strong> ${bankName} (${bankCode})</p>
        <p><strong>Records processed:</strong> ${data.length}</p>
        <p><strong>Client:</strong> ${clientName}</p>
        <br>
        <p>The file has been saved to your Google Drive:</p>
        <a href="${fileUrl}" target="_blank" style="background: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          📁 Open File in Google Drive
        </a>
        <br><br>
        <p style="font-size: 12px; color: #666;">
          Note: You can download the file from Google Drive and upload it to your banking system.
        </p>
      </div>
    `).setWidth(500).setHeight(300);
    
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'ABO File Generated');
    
  } catch (error) {
    console.error('Error generating ABO file:', error);
    SpreadsheetApp.getUi().alert('Error', `Failed to generate ABO file: ${error.message}`, SpreadsheetApp.getUi().Buttons.OK);
  }
}

/**
 * Extract payment data from Google Sheet
 * Expected columns: vlastní účet, účet protistrany, částka, VS, KS, SS, název účtu prostistrany, datum zaúčtování
 */
function getSheetData(sheet) {
  const range = sheet.getDataRange();
  const values = range.getValues();
  
  if (values.length < 2) {
    return [];
  }
  
  // Get headers from first row
  const headers = values[0].map(header => header.toString().trim().toLowerCase());
  const data = [];
  
  // Expected column mappings (flexible header matching)
  const columnMappings = {
    'vlastní účet': ['vlastní účet', 'vlastni ucet', 'payer account', 'from account'],
    'účet protistrany': ['účet protistrany', 'ucet protistrany', 'payee account', 'to account'],
    'částka': ['částka', 'castka', 'amount', 'suma'],
    'VS': ['vs', 'variable symbol', 'variabilní symbol'],
    'KS': ['ks', 'constant symbol', 'konstantní symbol'],
    'SS': ['ss', 'specific symbol', 'specifický symbol'],
    'název účtu prostistrany': ['název účtu prostistrany', 'nazev uctu protistrany', 'payee name', 'recipient name'],
    'datum zaúčtování': ['datum zaúčtování', 'datum zauctovani', 'date', 'due date']
  };
  
  // Find column indices
  const columnIndices = {};
  Object.keys(columnMappings).forEach(key => {
    const variations = columnMappings[key];
    for (let i = 0; i < headers.length; i++) {
      if (variations.some(variation => headers[i].includes(variation))) {
        columnIndices[key] = i;
        break;
      }
    }
  });
  
  // Process data rows
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const record = {};
    
    // Map columns to record
    Object.keys(columnIndices).forEach(key => {
      const columnIndex = columnIndices[key];
      if (columnIndex !== undefined && columnIndex < row.length) {
        record[key] = row[columnIndex] ? row[columnIndex].toString().trim() : '';
      }
    });
    
    // Skip empty rows (no amount or no payee account)
    if (record['částka'] && record['účet protistrany']) {
      data.push(record);
    }
  }
  
  return data;
}

/**
 * CSV to ABO Converter Class for Raiffeisenbank
 */
class CSVToABORaiffeisen {
  constructor() {
    this.creationDate = new Date();
  }
  
  /**
   * Validate Czech account number using Modulo 11 algorithm
   */
  validateAccountModulo11(accountStr) {
    if (!accountStr) return false;
    
    // Remove bank code if present
    let account = accountStr.split('/')[0];
    
    // Remove dashes and spaces
    account = account.replace(/[-\s]/g, '');
    
    if (!/^\d+$/.test(account)) {
      return false;
    }
    
    // Split into prefix and account number
    let prefix = '';
    let accountNum = account;
    
    if (accountStr.includes('-')) {
      const parts = accountStr.split('-');
      prefix = parts[0] || '';
      accountNum = parts[parts.length - 1];
    }
    
    // Validate prefix (if exists)
    if (prefix) {
      const prefixClean = prefix.replace(/[^0-9]/g, '');
      if (prefixClean) {
        const weights = [10, 5, 8, 4, 2, 1];
        const paddedPrefix = prefixClean.padStart(6, '0');
        let checksum = 0;
        for (let i = 0; i < paddedPrefix.length; i++) {
          checksum += parseInt(paddedPrefix[i]) * weights[i % weights.length];
        }
        if (checksum % 11 !== 0) {
          return false;
        }
      }
    }
    
    // Validate account number
    const accountClean = accountNum.replace(/[^0-9]/g, '');
    if (accountClean.length > 10) {
      return false;
    }
    
    const weights = [6, 3, 7, 9, 10, 5, 8, 4, 2, 1];
    const paddedAccount = accountClean.padStart(10, '0');
    let checksum = 0;
    for (let i = 0; i < paddedAccount.length; i++) {
      checksum += parseInt(paddedAccount[i]) * weights[i];
    }
    
    return checksum % 11 === 0;
  }
  
  /**
   * Format account number for ABO format
   */
  formatAccountNumber(accountStr) {
    if (!accountStr) return '';
    
    const accountClean = accountStr.toString().trim();
    
    // Handle format with bank code
    let accountPart, bankCode;
    if (accountClean.includes('/')) {
      [accountPart, bankCode] = accountClean.split('/');
    } else {
      accountPart = accountClean;
      bankCode = '';
    }
    
    // Format account part
    let formattedAccount = accountPart;
    
    // Add bank code if needed and not Raiffeisen
    if (bankCode && bankCode !== RAIFFEISEN_BANK_CODE) {
      formattedAccount += '/' + bankCode;
    }
    
    return formattedAccount;
  }
  
  /**
   * Generate UHL1 file header (58 characters total)
   */
  generateUHL1Header(clientName) {
    let header = 'UHL1';
    
    // Creation date (DDMMYY)
    const dateStr = Utilities.formatDate(this.creationDate, Session.getScriptTimeZone(), 'ddMMyy');
    header += dateStr;
    
    // Convert to ASCII-safe characters and uppercase
    let safeName = this.convertCzechToAscii(clientName);
    header += safeName.substring(0, 20).padEnd(20, ' ').toUpperCase();
    
    // Fixed fields
    header += '1234567890'; // Client ID (10 chars)
    header += '001';        // File interval start
    header += '999';        // File interval end
    header += '111111';     // Security code fixed
    header += '222222';     // Security code secret
    
    return header;
  }
  
  /**
   * Convert Czech characters to ASCII equivalents
   */
  convertCzechToAscii(text) {
    const replacements = {
      'Č': 'C', 'č': 'c', 'Ř': 'R', 'ř': 'r',
      'Š': 'S', 'š': 's', 'Ž': 'Z', 'ž': 'z',
      'Ý': 'Y', 'ý': 'y', 'Á': 'A', 'á': 'a',
      'É': 'E', 'é': 'e', 'Í': 'I', 'í': 'i',
      'Ó': 'O', 'ó': 'o', 'Ú': 'U', 'ú': 'u',
      'Ů': 'U', 'ů': 'u', 'Ě': 'E', 'ě': 'e',
      'Ď': 'D', 'ď': 'd', 'Ť': 'T', 'ť': 't',
      'Ň': 'N', 'ň': 'n'
    };
    
    let result = text;
    Object.keys(replacements).forEach(key => {
      result = result.replace(new RegExp(key, 'g'), replacements[key]);
    });
    
    return result;
  }
  
  /**
   * Generate accounting file header
   */
  generateFileHeader(dataType = '1501') {
    return `1 ${dataType} 111111 ${RAIFFEISEN_BANK_CODE}`;
  }
  
  /**
   * Generate group header for a batch of payments
   */
  generateGroupHeader(payerAccount, totalAmount, dueDate) {
    const amountStr = Math.abs(parseFloat(totalAmount) * 100).toString();
    const dateStr = Utilities.formatDate(dueDate, Session.getScriptTimeZone(), 'ddMMyy');
    
    if (payerAccount) {
      return `2 ${payerAccount} ${amountStr} ${dateStr}`;
    } else {
      return `2 ${amountStr} ${dateStr}`;
    }
  }
  
  /**
   * Generate payment item record from CSV data
   */
  generatePaymentItem(record, payerAccount = '') {
    const fields = [];
    
    // Payer account (only if not in group header)
    if (!payerAccount) {
      const payerAcc = this.formatAccountNumber(record['vlastní účet'] || '');
      if (payerAcc) {
        fields.push(payerAcc);
      }
    }
    
    // Payee account (required)
    const payeeAcc = this.formatAccountNumber(record['účet protistrany'] || '');
    if (payeeAcc) {
      fields.push(payeeAcc);
    }
    
    // Amount (required, in 1/100 format)
    const amountStr = (record['částka'] || '0').toString().replace(',', '.');
    try {
      const amountFloat = parseFloat(amountStr);
      const amountInt = Math.abs(amountFloat) * 100;
      fields.push(Math.round(amountInt).toString());
    } catch (e) {
      fields.push('0');
    }
    
    // Variable symbol (optional)
    const vs = (record['VS'] || '').toString().trim();
    if (vs && vs !== '0') {
      fields.push(vs.padStart(10, '0'));
    }
    
    // Constant symbol + bank code (8-10 digits)
    // Per official spec: positions 1-4 (right) = KS, positions 5-8 (right) = bank code  
    // This means: Bank Code + Constant Symbol
    const ks = (record['KS'] || '').toString().trim();
    if (ks) {
      // Get bank code from payee account
      const payeeFull = (record['účet protistrany'] || '').toString();
      let bankCode = RAIFFEISEN_BANK_CODE;
      if (payeeFull.includes('/')) {
        bankCode = payeeFull.split('/')[1];
      }
      
      // Raiffeisenbank format: Bank code (4 digits) + Constant symbol (4 digits)
      const bankCodePadded = bankCode.padEnd(4, '0').substring(0, 4);
      const ksPadded = ks.padEnd(4, '0').substring(0, 4);
      const ksField = bankCodePadded + ksPadded;
      fields.push(ksField);
    }
    
    // Specific symbol (optional)
    const ss = (record['SS'] || '').toString().trim();
    if (ss && ss !== '0') {
      fields.push(ss.padStart(10, '0'));
    }
    
    // AV field (payment description)
    const clientName = (record['název účtu prostistrany'] || '').toString().trim();
    const purpose = (record['účel platby'] || '').toString().trim();
    const message = (record['zpráva'] || '').toString().trim();
    
    const avParts = [];
    if (clientName) {
      avParts.push(clientName.substring(0, 35));
    }
    if (purpose) {
      avParts.push(purpose.substring(0, 35));
    }
    if (message) {
      avParts.push(message.substring(0, 35));
    }
    
    if (avParts.length > 0) {
      const avField = 'AV:' + avParts.join('|');
      fields.push(avField);
    }
    
    return fields.join(' ');
  }
  
  /**
   * Generate complete ABO file content
   */
  generateABO(csvData, clientName = 'KLIENT', groupByAccount = true) {
    if (!csvData || csvData.length === 0) {
      throw new Error('No CSV data provided');
    }
    
    const lines = [];
    
    // UHL1 header
    lines.push(this.generateUHL1Header(clientName));
    
    // File header
    lines.push(this.generateFileHeader());
    
    if (groupByAccount) {
      // Group payments by payer account
      const groups = {};
      csvData.forEach(record => {
        const payerAcc = this.formatAccountNumber(record['vlastní účet'] || '');
        if (!groups[payerAcc]) {
          groups[payerAcc] = [];
        }
        groups[payerAcc].push(record);
      });
      
      Object.keys(groups).forEach(payerAcc => {
        const groupRecords = groups[payerAcc];
        
        // Calculate total amount for group
        let totalAmount = 0;
        let dueDate = this.creationDate;
        
        groupRecords.forEach(record => {
          const amountStr = (record['částka'] || '0').toString().replace(',', '.');
          try {
            const amountFloat = parseFloat(amountStr);
            totalAmount += Math.abs(amountFloat);
          } catch (e) {
            // Skip invalid amounts
          }
          
          // Use first valid date found
          const dateStr = (record['datum zaúčtování'] || '').toString();
          try {
            if (dateStr.includes('.')) {
              const parts = dateStr.split('.');
              dueDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            } else if (dateStr.includes('-')) {
              dueDate = new Date(dateStr);
            }
          } catch (e) {
            // Keep default date
          }
        });
        
        // Group header
        lines.push(this.generateGroupHeader(payerAcc, totalAmount, dueDate));
        
        // Payment items
        groupRecords.forEach(record => {
          const itemLine = this.generatePaymentItem(record, payerAcc);
          if (itemLine) {
            lines.push(itemLine);
          }
        });
        
        // Group end
        lines.push('3 +');
      });
    } else {
      // Single group with all payments
      let totalAmount = 0;
      const dueDate = this.creationDate;
      
      csvData.forEach(record => {
        const amountStr = (record['částka'] || '0').toString().replace(',', '.');
        try {
          const amountFloat = parseFloat(amountStr);
          totalAmount += Math.abs(amountFloat);
        } catch (e) {
          // Skip invalid amounts
        }
      });
      
      // Group header (no account)
      lines.push(this.generateGroupHeader('', totalAmount, dueDate));
      
      // Payment items
      csvData.forEach(record => {
        const itemLine = this.generatePaymentItem(record);
        if (itemLine) {
          lines.push(itemLine);
        }
      });
      
      // Group end
      lines.push('3 +');
    }
    
    // File end
    lines.push('5 +');
    
    // Join with CR+LF as required by ABO specification
    return lines.join('\r\n');
  }
}

/**
 * CSV to ABO Converter Class for FIO Bank
 */
class CSVToABOFIO {
  constructor() {
    this.creationDate = new Date();
  }
  
  /**
   * Validate Czech account number using Modulo 11 algorithm
   */
  validateAccountModulo11(accountStr) {
    if (!accountStr) return false;
    
    // Remove bank code if present
    let account = accountStr.split('/')[0];
    
    // Remove dashes and spaces
    account = account.replace(/[-\s]/g, '');
    
    if (!/^\d+$/.test(account)) {
      return false;
    }
    
    // Split into prefix and account number
    let prefix = '';
    let accountNum = account;
    
    if (accountStr.includes('-')) {
      const parts = accountStr.split('-');
      prefix = parts[0] || '';
      accountNum = parts[parts.length - 1];
    }
    
    // Validate prefix (if exists)
    if (prefix) {
      const prefixClean = prefix.replace(/[^0-9]/g, '');
      if (prefixClean) {
        const weights = [10, 5, 8, 4, 2, 1];
        const paddedPrefix = prefixClean.padStart(6, '0');
        let checksum = 0;
        for (let i = 0; i < paddedPrefix.length; i++) {
          checksum += parseInt(paddedPrefix[i]) * weights[i % weights.length];
        }
        if (checksum % 11 !== 0) {
          return false;
        }
      }
    }
    
    // Validate account number
    const accountClean = accountNum.replace(/[^0-9]/g, '');
    if (accountClean.length > 10) {
      return false;
    }
    
    const weights = [6, 3, 7, 9, 10, 5, 8, 4, 2, 1];
    const paddedAccount = accountClean.padStart(10, '0');
    let checksum = 0;
    for (let i = 0; i < paddedAccount.length; i++) {
      checksum += parseInt(paddedAccount[i]) * weights[i];
    }
    
    return checksum % 11 === 0;
  }
  
  /**
   * Format account number for ABO format
   */
  formatAccountNumber(accountStr) {
    if (!accountStr) return '';
    
    const accountClean = accountStr.toString().trim();
    
    // Handle format with bank code
    let accountPart, bankCode;
    if (accountClean.includes('/')) {
      [accountPart, bankCode] = accountClean.split('/');
    } else {
      accountPart = accountClean;
      bankCode = '';
    }
    
    // Format account part
    let formattedAccount = accountPart;
    
    // Add bank code if needed and not FIO
    if (bankCode && bankCode !== FIO_BANK_CODE) {
      formattedAccount += '/' + bankCode;
    }
    
    return formattedAccount;
  }
  
  /**
   * Generate UHL1 file header for FIO Bank (46 characters + CR+LF)
   */
  generateUHL1Header(clientName) {
    let header = 'UHL1';
    
    // Creation date (DDMMYY)
    const dateStr = Utilities.formatDate(this.creationDate, Session.getScriptTimeZone(), 'ddMMyy');
    header += dateStr;
    
    // Convert to ASCII-safe characters and uppercase
    let safeName = this.convertCzechToAscii(clientName);
    header += safeName.substring(0, 20).padEnd(20, ' ').toUpperCase();
    
    // FIO Bank specific fixed fields (per official specification)
    header += '0000000000'; // Client ID (10 chars) - FIO requires zeros
    header += '001';        // File interval start
    header += '999';        // File interval end
    
    return header;
  }
  
  /**
   * Convert Czech characters to ASCII equivalents
   */
  convertCzechToAscii(text) {
    const replacements = {
      'Č': 'C', 'č': 'c', 'Ř': 'R', 'ř': 'r',
      'Š': 'S', 'š': 's', 'Ž': 'Z', 'ž': 'z',
      'Ý': 'Y', 'ý': 'y', 'Á': 'A', 'á': 'a',
      'É': 'E', 'é': 'e', 'Í': 'I', 'í': 'i',
      'Ó': 'O', 'ó': 'o', 'Ú': 'U', 'ú': 'u',
      'Ů': 'U', 'ů': 'u', 'Ě': 'E', 'ě': 'e',
      'Ď': 'D', 'ď': 'd', 'Ť': 'T', 'ť': 't',
      'Ň': 'N', 'ň': 'n'
    };
    
    let result = text;
    Object.keys(replacements).forEach(key => {
      result = result.replace(new RegExp(key, 'g'), replacements[key]);
    });
    
    return result;
  }
  
  /**
   * Generate accounting file header for FIO Bank
   */
  generateFileHeader(dataType = '1501', fileNumber = '001') {
    // Official FIO Format: "1 DDDD SSSPPB BBBB" (SSS=file number, PPB=zeros)
    const fileNumPadded = fileNumber.padStart(3, '0') + '000';
    return `1 ${dataType} ${fileNumPadded} ${FIO_BANK_CODE}`;
  }
  
  /**
   * Generate group header for a batch of payments
   */
  generateGroupHeader(payerAccount, totalAmount, dueDate) {
    const amountStr = Math.abs(parseFloat(totalAmount) * 100).toString().padStart(15, '0'); // 15 digits per FIO spec
    const dateStr = Utilities.formatDate(dueDate, Session.getScriptTimeZone(), 'ddMMyy');
    
    if (payerAccount) {
      return `2 ${payerAccount} ${amountStr} ${dateStr}`;
    } else {
      return `2 ${amountStr} ${dateStr}`;
    }
  }
  
  /**
   * Generate payment item record from CSV data for FIO Bank
   */
  generatePaymentItem(record, payerAccount = '') {
    const fields = [];
    
    // Payer account (only if not in group header)
    if (!payerAccount) {
      const payerAcc = this.formatAccountNumber(record['vlastní účet'] || '');
      if (payerAcc) {
        fields.push(payerAcc);
      }
    }
    
    // Payee account (required)
    const payeeAcc = this.formatAccountNumber(record['účet protistrany'] || '');
    if (payeeAcc) {
      fields.push(payeeAcc);
    }
    
    // Amount (required, in 1/100 format, 15-digit for FIO per spec)
    const amountStr = (record['částka'] || '0').toString().replace(',', '.');
    try {
      const amountFloat = parseFloat(amountStr);
      const amountInt = Math.abs(amountFloat) * 100;
      fields.push(Math.round(amountInt).toString().padStart(15, '0'));
    } catch (e) {
      fields.push('000000000000000');
    }
    
    // Variable symbol (10 digits)
    const vs = (record['VS'] || '').toString().trim();
    if (vs && vs !== '0') {
      fields.push(vs.padStart(10, '0'));
    } else {
      fields.push(' '); // Use space if not provided per FIO spec
    }
    
    // Bank code (4 digits) + Constant symbol (4 digits) - per FIO spec
    const ks = (record['KS'] || '').toString().trim();
    // Get bank code from payee account
    const payeeFull = (record['účet protistrany'] || '').toString();
    let bankCode = FIO_BANK_CODE;
    if (payeeFull.includes('/')) {
      bankCode = payeeFull.split('/')[1];
    }
    
    // FIO format: Bank code (4 digits) + Constant symbol (4 digits)
    const bankCodePadded = bankCode.padEnd(4, '0').substring(0, 4);
    const ksPadded = ks ? ks.padEnd(4, '0').substring(0, 4) : '0000';
    fields.push(bankCodePadded + ksPadded);
    
    // Specific symbol (10 digits, optional - use space if not provided per FIO spec)
    const ss = (record['SS'] || '').toString().trim();
    if (ss && ss !== '0') {
      fields.push(ss.padStart(10, '0'));
    } else {
      fields.push(' '); // Use space if not provided per FIO spec
    }
    
    // AV field (payment description, optional - use space if not provided per FIO spec)
    const clientName = (record['název účtu prostistrany'] || '').toString().trim();
    const purpose = (record['účel platby'] || '').toString().trim();
    const message = (record['zpráva'] || '').toString().trim();
    
    const avParts = [];
    if (clientName) {
      avParts.push(clientName.substring(0, 35));
    }
    if (purpose) {
      avParts.push(purpose.substring(0, 35));
    }
    if (message) {
      avParts.push(message.substring(0, 35));
    }
    
    if (avParts.length > 0) {
      const avField = 'AV:' + avParts.join('|');
      fields.push(avField);
    } else {
      fields.push(' '); // Use space if not provided per FIO spec
    }
    
    return fields.join(' ');
  }
  
  /**
   * Generate complete ABO file content for FIO Bank
   */
  generateABO(csvData, clientName = 'KLIENT', groupByAccount = true) {
    if (!csvData || csvData.length === 0) {
      throw new Error('No CSV data provided');
    }
    
    const lines = [];
    
    // UHL1 header
    lines.push(this.generateUHL1Header(clientName));
    
    // File header
    lines.push(this.generateFileHeader());
    
    if (groupByAccount) {
      // Group payments by payer account
      const groups = {};
      csvData.forEach(record => {
        const payerAcc = this.formatAccountNumber(record['vlastní účet'] || '');
        if (!groups[payerAcc]) {
          groups[payerAcc] = [];
        }
        groups[payerAcc].push(record);
      });
      
      Object.keys(groups).forEach(payerAcc => {
        const groupRecords = groups[payerAcc];
        
        // Calculate total amount for group
        let totalAmount = 0;
        let dueDate = this.creationDate;
        
        groupRecords.forEach(record => {
          const amountStr = (record['částka'] || '0').toString().replace(',', '.');
          try {
            const amountFloat = parseFloat(amountStr);
            totalAmount += Math.abs(amountFloat);
          } catch (e) {
            // Skip invalid amounts
          }
          
          // Use first valid date found
          const dateStr = (record['datum zaúčtování'] || '').toString();
          try {
            if (dateStr.includes('.')) {
              const parts = dateStr.split('.');
              dueDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            } else if (dateStr.includes('-')) {
              dueDate = new Date(dateStr);
            }
          } catch (e) {
            // Keep default date
          }
        });
        
        // Group header
        lines.push(this.generateGroupHeader(payerAcc, totalAmount, dueDate));
        
        // Payment items
        groupRecords.forEach(record => {
          const itemLine = this.generatePaymentItem(record, payerAcc);
          if (itemLine) {
            lines.push(itemLine);
          }
        });
        
        // Group end
        lines.push('3 +');
      });
    } else {
      // Single group with all payments
      let totalAmount = 0;
      const dueDate = this.creationDate;
      
      csvData.forEach(record => {
        const amountStr = (record['částka'] || '0').toString().replace(',', '.');
        try {
          const amountFloat = parseFloat(amountStr);
          totalAmount += Math.abs(amountFloat);
        } catch (e) {
          // Skip invalid amounts
        }
      });
      
      // Group header (no account)
      lines.push(this.generateGroupHeader('', totalAmount, dueDate));
      
      // Payment items
      csvData.forEach(record => {
        const itemLine = this.generatePaymentItem(record);
        if (itemLine) {
          lines.push(itemLine);
        }
      });
      
      // Group end
      lines.push('3 +');
    }
    
    // File end
    lines.push('5 +');
    
    // Join with CR+LF as required by ABO specification
    return lines.join('\r\n');
  }
}

/**
 * Helper function to add the "Generate ABO" button to the sheet
 * Run this once to set up the button
 */
function addGenerateABOButton() {
  const sheet = SpreadsheetApp.getActiveSheet();
  
  // Add button as a drawing (alternative method)
  // Note: This creates a text instruction instead of an actual button
  // Users will need to manually create a button and assign this function
  
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'ABO Generator Setup',
    'To add a "Generate ABO" button:\n\n' +
    '1. Go to Insert → Drawing\n' +
    '2. Add a text box or shape with text "Generate ABO File"\n' +
    '3. Save and close the drawing\n' +
    '4. Click on the drawing and select the three dots menu\n' +
    '5. Choose "Assign script" and enter: generateABOFile\n' +
    '6. Save and test the button\n\n' +
    'Alternatively, you can run generateABOFile() from the script editor.',
    ui.Buttons.OK
  );
}

/**
 * Helper function to validate the current sheet data
 * Useful for testing and debugging
 */
function validateSheetData() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = getSheetData(sheet);
    
    if (!data || data.length === 0) {
      SpreadsheetApp.getUi().alert('Validation Result', 'No valid data found. Please check your column headers and data.', SpreadsheetApp.getUi().Buttons.OK);
      return;
    }
    
    // Use Raiffeisenbank converter for account validation (both use same algorithm)
    const converter = new CSVToABORaiffeisen();
    let validAccounts = 0;
    let invalidAccounts = 0;
    let raiffeisenAccounts = 0;
    let fioAccounts = 0;
    let otherBankAccounts = 0;
    
    data.forEach(record => {
      const payerAccount = record['vlastní účet'] || '';
      const payeeAccount = record['účet protistrany'] || '';
      
      [payerAccount, payeeAccount].forEach(account => {
        if (!account) return;
        
        if (converter.validateAccountModulo11(account)) {
          validAccounts++;
        } else {
          invalidAccounts++;
        }
        
        // Count bank types
        if (account.includes('/')) {
          const bankCode = account.split('/')[1];
          if (bankCode === RAIFFEISEN_BANK_CODE) {
            raiffeisenAccounts++;
          } else if (bankCode === FIO_BANK_CODE) {
            fioAccounts++;
          } else {
            otherBankAccounts++;
          }
        }
      });
    });
    
    SpreadsheetApp.getUi().alert(
      'Validation Result',
      `Data Summary:
      - ${data.length} payment records found
      - ${validAccounts} valid account numbers
      - ${invalidAccounts} invalid account numbers
      
      Bank Distribution:
      - ${raiffeisenAccounts} Raiffeisenbank accounts (${RAIFFEISEN_BANK_CODE})
      - ${fioAccounts} FIO Bank accounts (${FIO_BANK_CODE})
      - ${otherBankAccounts} other bank accounts
      
      ${invalidAccounts > 0 ? 'Warning: Some account numbers failed validation. Please check the format.' : 'All account numbers are valid!'}
      
      Recommended: Choose the bank format that matches most of your accounts.`,
      SpreadsheetApp.getUi().Buttons.OK
    );
    
  } catch (error) {
    SpreadsheetApp.getUi().alert('Validation Error', `Error validating data: ${error.message}`, SpreadsheetApp.getUi().Buttons.OK);
  }
}