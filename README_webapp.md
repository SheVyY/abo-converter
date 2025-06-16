# CSV to ABO Converter Web App

A modern web application built with Next.js, TypeScript, and Shadcn UI for converting CSV payment files to ABO format for Czech banks.

## Features

- **Modern UI**: Built with Next.js 15, TypeScript, and Shadcn UI components
- **Multi-Bank Support**: Supports both Raiffeisenbank (5500) and FIO Bank (2010) ABO formats
- **File Upload**: Drag & drop or browse CSV file upload
- **Real-time Validation**: Instant feedback on file format and data validation
- **Secure Processing**: All conversion happens client-side, no data sent to servers
- **Download Results**: Direct download of converted ABO files

## Supported Banks

1. **Raiffeisenbank (5500)**
   - 58-character UHL1 header
   - Standard amount formatting
   - Bank code + Constant Symbol format

2. **FIO Bank (2010)**
   - 46-character UHL1 header  
   - 15-digit amount formatting
   - Specific field requirements per FIO specification

## CSV Format Requirements

Your CSV file should contain these columns (Czech headers):

- `vlastní účet` - Payer account number
- `účet protistrany` - Payee account number  
- `částka` - Amount (decimal format, e.g., 1500.50)
- `VS` - Variable symbol
- `KS` - Constant symbol
- `SS` - Specific symbol (optional)
- `název účtu prostistrany` - Payee name
- `datum zaúčtování` - Due date (DD.MM.YYYY)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Usage

1. **Upload CSV File**: Select or drag & drop your CSV file
2. **Select Bank**: Choose between Raiffeisenbank or FIO Bank
3. **Enter Client Name**: Provide your company name (max 20 characters)
4. **Convert**: Click "Convert to ABO" button
5. **Download**: Download the generated ABO file

## Sample Data

A sample CSV file is included in the `public/` directory for testing purposes.

## Technical Details

### ABO Format Compliance

The converter implements the official ABO specifications for both supported banks:

- **UHL1 Header**: Correct length and format for each bank
- **Field Formatting**: Proper padding, encoding, and field order
- **Amount Conversion**: Decimal to integer (1/100) conversion
- **Character Encoding**: Czech character normalization to ASCII
- **Account Validation**: Modulo 11 validation for Czech account numbers

### Architecture

- **Frontend**: Next.js 15 with TypeScript
- **UI Components**: Shadcn UI with Tailwind CSS
- **State Management**: React hooks
- **File Processing**: Client-side CSV parsing and ABO generation
- **Styling**: Responsive design with modern UI patterns

## Author

**Sebastian Hozak** <hozaksebastian@gmail.com>

## License

MIT License