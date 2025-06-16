'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Download, FileText, Building } from 'lucide-react'

type BankType = 'raiffeisen' | 'fio'

interface CSVRecord {
  'vlastní účet': string
  'účet protistrany': string
  'částka': string
  'VS': string
  'KS': string
  'SS': string
  'název účtu prostistrany': string
  'datum zaúčtování': string
}

export default function Home() {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [bankType, setBankType] = useState<BankType>('raiffeisen')
  const [clientName, setClientName] = useState('')
  const [isConverting, setIsConverting] = useState(false)
  const [result, setResult] = useState<{ filename: string; content: string; recordCount: number } | null>(null)
  const [error, setError] = useState('')

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setCsvFile(file)
      setError('')
      setResult(null)
    } else {
      setError('Please select a valid CSV file')
      setCsvFile(null)
    }
  }

  const parseCsv = (csvText: string): CSVRecord[] => {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const records: CSVRecord[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      if (values.length >= headers.length) {
        const record: any = {}
        headers.forEach((header, index) => {
          record[header] = values[index] || ''
        })
        records.push(record)
      }
    }

    return records
  }

  const convertCzechToAscii = (text: string): string => {
    const replacements: Record<string, string> = {
      'Č': 'C', 'č': 'c', 'Ř': 'R', 'ř': 'r',
      'Š': 'S', 'š': 's', 'Ž': 'Z', 'ž': 'z',
      'Ý': 'Y', 'ý': 'y', 'Á': 'A', 'á': 'a',
      'É': 'E', 'é': 'e', 'Í': 'I', 'í': 'i',
      'Ó': 'O', 'ó': 'o', 'Ú': 'U', 'ú': 'u',
      'Ů': 'U', 'ů': 'u', 'Ě': 'E', 'ě': 'e',
      'Ď': 'D', 'ď': 'd', 'Ť': 'T', 'ť': 't',
      'Ň': 'N', 'ň': 'n'
    }

    let result = text
    Object.keys(replacements).forEach(key => {
      result = result.replace(new RegExp(key, 'g'), replacements[key])
    })
    return result
  }

  const generateUHL1Header = (clientName: string, bankType: BankType): string => {
    const now = new Date()
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '')
    
    let header = 'UHL1' + dateStr
    const safeName = convertCzechToAscii(clientName).substring(0, 20).padEnd(20, ' ').toUpperCase()
    header += safeName
    
    if (bankType === 'raiffeisen') {
      header += '1234567890001999111111222222' // 58 chars total
    } else {
      header += '0000000000001999' // 46 chars total for FIO
    }
    
    return header
  }

  const formatAccountNumber = (accountStr: string, bankType: BankType): string => {
    if (!accountStr) return ''
    
    const targetBankCode = bankType === 'raiffeisen' ? '5500' : '2010'
    const accountClean = accountStr.trim()
    
    if (accountClean.includes('/')) {
      const [accountPart, bankCode] = accountClean.split('/')
      if (bankCode !== targetBankCode) {
        return accountPart + '/' + bankCode
      }
      return accountPart
    }
    
    return accountClean
  }

  const generateABO = (records: CSVRecord[], clientName: string, bankType: BankType): string => {
    const lines: string[] = []
    
    // UHL1 header
    lines.push(generateUHL1Header(clientName, bankType))
    
    // File header
    if (bankType === 'raiffeisen') {
      lines.push('1 1501 111111 5500')
    } else {
      lines.push('1 1501 001000 2010')
    }
    
    // Calculate total amount
    let totalAmount = 0
    records.forEach(record => {
      const amountStr = (record['částka'] || '0').replace(',', '.')
      try {
        totalAmount += Math.abs(parseFloat(amountStr))
      } catch (e) {
        // Skip invalid amounts
      }
    })
    
    // Group header
    const now = new Date()
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '')
    const amountStr = Math.round(totalAmount * 100).toString()
    
    if (bankType === 'fio') {
      lines.push(`2 ${amountStr.padStart(15, '0')} ${dateStr}`)
    } else {
      lines.push(`2 ${amountStr} ${dateStr}`)
    }
    
    // Payment items
    records.forEach(record => {
      const fields: string[] = []
      
      // Payee account
      const payeeAcc = formatAccountNumber(record['účet protistrany'] || '', bankType)
      if (payeeAcc) fields.push(payeeAcc)
      
      // Amount
      const amountStr = (record['částka'] || '0').replace(',', '.')
      try {
        const amountFloat = parseFloat(amountStr)
        const amountInt = Math.round(Math.abs(amountFloat) * 100)
        if (bankType === 'fio') {
          fields.push(amountInt.toString().padStart(15, '0'))
        } else {
          fields.push(amountInt.toString())
        }
      } catch (e) {
        fields.push(bankType === 'fio' ? '000000000000000' : '0')
      }
      
      // Variable symbol
      const vs = (record['VS'] || '').trim()
      if (vs && vs !== '0') {
        fields.push(vs.padStart(10, '0'))
      } else if (bankType === 'fio') {
        fields.push(' ')
      }
      
      // Bank code + Constant symbol
      const ks = (record['KS'] || '').trim()
      const payeeFull = record['účet protistrany'] || ''
      let bankCode = bankType === 'raiffeisen' ? '5500' : '2010'
      if (payeeFull.includes('/')) {
        bankCode = payeeFull.split('/')[1]
      }
      
      const bankCodePadded = bankCode.padEnd(4, '0').substring(0, 4)
      const ksPadded = ks ? ks.padEnd(4, '0').substring(0, 4) : '0000'
      fields.push(bankCodePadded + ksPadded)
      
      // Specific symbol
      const ss = (record['SS'] || '').trim()
      if (ss && ss !== '0') {
        fields.push(ss.padStart(10, '0'))
      } else if (bankType === 'fio') {
        fields.push(' ')
      }
      
      // AV field
      const clientName = (record['název účtu prostistrany'] || '').trim()
      if (clientName) {
        fields.push('AV:' + clientName.substring(0, 35))
      } else if (bankType === 'fio') {
        fields.push(' ')
      }
      
      lines.push(fields.join(' '))
    })
    
    // Group end and file end
    lines.push('3 +')
    lines.push('5 +')
    
    return lines.join('\r\n')
  }

  const handleConvert = async () => {
    if (!csvFile || !clientName.trim()) {
      setError('Please select a CSV file and enter client name')
      return
    }

    setIsConverting(true)
    setError('')

    try {
      const csvText = await csvFile.text()
      const records = parseCsv(csvText)
      
      if (records.length === 0) {
        throw new Error('No valid records found in CSV file')
      }

      const aboContent = generateABO(records, clientName.trim(), bankType)
      const now = new Date()
      const dateStr = now.toISOString().substring(0, 10).replace(/-/g, '')
      const bankPrefix = bankType === 'raiffeisen' ? 'raiffeisen' : 'fio'
      const filename = `${bankPrefix}_payments_${dateStr}.kpc`

      setResult({
        filename,
        content: aboContent,
        recordCount: records.length
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed')
    } finally {
      setIsConverting(false)
    }
  }

  const handleDownload = () => {
    if (!result) return

    const blob = new Blob([result.content], { type: 'text/plain;charset=windows-1250' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">CSV to ABO Converter</h1>
          <p className="text-lg text-gray-600">Convert CSV payment files to ABO format for Czech banks</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Upload and Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload & Configure
              </CardTitle>
              <CardDescription>
                Select your CSV file and configure conversion settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload */}
              <div>
                <Label htmlFor="csv-file">CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="mt-1"
                />
                {csvFile && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {/* Bank Selection */}
              <div>
                <Label htmlFor="bank-select">Bank</Label>
                <Select value={bankType} onValueChange={(value: BankType) => setBankType(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raiffeisen">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Raiffeisenbank (5500)
                      </div>
                    </SelectItem>
                    <SelectItem value="fio">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        FIO Bank (2010)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Client Name */}
              <div>
                <Label htmlFor="client-name">Client Name (max 20 characters)</Label>
                <Input
                  id="client-name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value.substring(0, 20))}
                  placeholder="Enter your company name"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {clientName.length}/20 characters
                </p>
              </div>

              {/* Convert Button */}
              <Button
                onClick={handleConvert}
                disabled={!csvFile || !clientName.trim() || isConverting}
                className="w-full"
              >
                {isConverting ? 'Converting...' : 'Convert to ABO'}
              </Button>

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Conversion Results
              </CardTitle>
              <CardDescription>
                Download your converted ABO file
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <h3 className="font-medium text-green-800 mb-2">✅ Conversion Successful!</h3>
                    <div className="text-sm text-green-700 space-y-1">
                      <p><strong>File:</strong> {result.filename}</p>
                      <p><strong>Bank:</strong> {bankType === 'raiffeisen' ? 'Raiffeisenbank (5500)' : 'FIO Bank (2010)'}</p>
                      <p><strong>Records processed:</strong> {result.recordCount}</p>
                      <p><strong>Client:</strong> {clientName}</p>
                    </div>
                  </div>
                  
                  <Button onClick={handleDownload} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download ABO File
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No conversion results yet</p>
                  <p className="text-sm">Upload a CSV file and click Convert to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          CSV to ABO Converter | Author: Sebastian Hozak | 
          <a href="https://github.com/sebastianhozak/abo-converter" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
            GitHub
          </a>
        </div>
      </div>
    </div>
  )
}