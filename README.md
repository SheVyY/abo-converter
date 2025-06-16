# ABO Converter Suite

Kompletní sada nástrojů pro převod bankovních výpisů mezi různými formáty používanými českými bankami.

A comprehensive suite of tools for converting bank statements between various formats used by Czech banks.

[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

## Přehled / Overview

Tato sada obsahuje nástroje pro:
- **Převod CSV do ABO formátu** pro Raiffeisenbank
- **Validaci ABO souborů** různých bank
- **Integraci s Google Sheets** pomocí Apps Script
- **Komplexní templaty a dokumentaci** pro snadné použití

This suite includes tools for:
- **Converting CSV to ABO format** for Raiffeisenbank
- **Validating ABO files** from various banks  
- **Google Sheets integration** with Apps Script
- **Comprehensive templates and documentation** for easy use

## Rychlý start / Quick Start

```bash
# Převod CSV do ABO formátu pro Raiffeisenbank
python3 abo_converter.py --csv-to-abo platby.csv --output vystup.kpc --client "MOJE FIRMA"

# Validace ABO souboru
python3 abo_converter.py --validate soubor.kpc

# Zobrazit nápovědu
python3 abo_converter.py --help
```

## Co je ABO formát / What is ABO Format

ABO formát (Automatické Bankovní Operace) je standardizovaný textový formát vytvořený Českou národní bankou pro výměnu informací o bankovních operacích. Každá banka má mírně odlišnou implementaci tohoto standardu.

ABO format (Automatic Banking Operations) is a standardized text format created by the Czech National Bank for exchanging banking operation information. Each bank has slightly different implementation of this standard.

### Podporované banky / Supported Banks

- ✅ **Raiffeisenbank** (kód 5500) - plná podpora CSV→ABO
- ✅ **FIO Banka** (kód 2010) - plná podpora CSV→ABO
- 🔄 **Ostatní banky** - validace, konverze v přípravě

- ✅ **Raiffeisenbank** (code 5500) - full CSV→ABO support
- ✅ **FIO Bank** (code 2010) - full CSV→ABO support
- 🔄 **Other banks** - validation, conversion in development

## Struktura projektu / Project Structure

```
abo_converter/
├── abo_converter.py           # Hlavní vstupní bod / Main entry point
├── src/                       # Zdrojové kódy / Source code
│   ├── main.py               # Orchestrační skript / Orchestrator
│   ├── csv_to_abo_raiffeisen.py # CSV→ABO převodník pro Raiffeisenbank
│   ├── csv_to_abo_fio.py     # CSV→ABO převodník pro FIO Bank
│   ├── abo_validator.py      # ABO validátor / ABO validator
│   └── utils/                # Sdílené utility / Shared utilities
│       └── banking_utils.py  # Modulo 11, konverze znaků / Character conversion
├── google_apps_script/        # Google Sheets integrace / Google Sheets integration
│   ├── Code.gs               # Apps Script kód / Apps Script code
│   ├── README.md             # Dokumentace / Documentation
│   ├── setup_guide.md        # Návod k nastavení / Setup guide
│   └── examples/             # Ukázky / Examples
├── examples/                  # Ukázkové soubory / Example files
│   ├── templates/                # CSV šablony / CSV templates
│   │   ├── google_sheets_template.csv       # Google Sheets template
│   │   ├── fio_bank_template.csv            # FIO Bank template
│   │   └── basic_payments.csv               # Basic template
│   ├── input_samples/            # Vzorové vstupy / Sample inputs
│   │   └── sample_payments.csv              # Test data
│   ├── output_samples/           # Ukázkové výstupy / Sample outputs
│   │   ├── fio_bank_example.kpc             # FIO Bank example
│   │   ├── fio_bank_template_output.kpc     # FIO Bank template output
│   │   └── raiffeisen_20_payments.kpc       # Raiffeisen example
│   ├── docs/                     # Dokumentace / Documentation
│   │   └── csv_format_guide.md              # Format guide
│   └── README.md                 # Examples documentation
├── docs/                      # Dokumentace / Documentation
│   └── *.pdf                 # Specifikace formátů
├── tests/                     # Testovací sada / Test suite
│   ├── unit/                 # Unit testy
│   ├── integration/          # Integrační testy
│   ├── fixtures/             # Testovací data
│   └── test_runner.py        # Spouštěč testů
├── web-app/                   # React webové rozhraní / React web interface
├── .github/                   # GitHub workflows a šablony / GitHub workflows
│   ├── workflows/            # CI/CD pipeline
│   ├── ISSUE_TEMPLATE/       # Šablony issues / Issue templates
│   └── SECURITY.md           # Bezpečnostní politika / Security policy
├── CLAUDE.md                  # Projektová paměť / Project memory
├── pyproject.toml            # Python konfigurace / Python configuration
├── .gitignore                 # Git ignorované soubory
└── README.md                  # Tato dokumentace / This documentation
```

## Použití / Usage

### Hlavní orchestrátor / Main Orchestrator

```bash
python3 abo_converter.py [možnosti]
```

**Možnosti / Options:**
- `--csv-to-abo FILE` - Převést CSV do ABO formátu
- `--validate FILE` - Validovat ABO soubor
- `--output FILE` - Výstupní soubor
- `--client NAME` - Jméno klienta pro hlavičku
- `--bank BANK` - Cílová banka (raiffeisen, fio, csob)

### Přímé použití jednotlivých skriptů / Direct Script Usage

```bash
# CSV do ABO (Raiffeisenbank)
python3 src/csv_to_abo_raiffeisen.py vstup.csv [vystup.kpc] [jmeno_klienta]

# Validace ABO souboru
python3 src/abo_validator.py soubor.kpc
```

## Formát CSV / CSV Format

Pro převod do ABO formátu použijte CSV se sloupci definovanými v `examples/docs/csv_format_guide.md`.

For conversion to ABO format, use CSV with columns defined in `examples/docs/csv_format_guide.md`.

### Rychlé templaty / Quick Templates

- **`examples/templates/google_sheets_template.csv`** - Připravený template pro Google Sheets s 20 transakcemi
- **`examples/templates/basic_payments.csv`** - Základní template s 10 transakcemi  
- **`examples/docs/csv_format_guide.md`** - Kompletní průvodce formátem CSV

### Základní sloupce / Basic Columns

| Sloupec / Column | Popis / Description |
|------------------|---------------------|
| `vlastní účet` | Plátcův účet / Payer account |
| `účet protistrany` | Příjemcův účet / Payee account |
| `částka` | Částka / Amount |
| `VS` | Variabilní symbol / Variable symbol |
| `KS` | Konstantní symbol / Constant symbol |
| `SS` | Specifický symbol / Specific symbol |
| `název účtu prostistrany` | Název příjemce / Payee name |
| `datum zaúčtování` | Datum / Date (DD.MM.YYYY) |

## Příklady / Examples

### Google Sheets Integration

**Bez stahování/nahrávání souborů / Without downloading/uploading files:**

```
1. Import examples/templates/google_sheets_template.csv do Google Sheets
2. Přejděte na Extensions → Apps Script
3. Zkopírujte kód z google_apps_script/Code.gs
4. Přidejte tlačítko "Generate ABO" (viz google_apps_script/setup_guide.md)
5. Klikněte na tlačítko pro vygenerování ABO souboru

1. Import examples/templates/google_sheets_template.csv to Google Sheets  
2. Go to Extensions → Apps Script
3. Copy code from google_apps_script/Code.gs
4. Add "Generate ABO" button (see google_apps_script/setup_guide.md)
5. Click button to generate ABO file
```

**Návod / Guide**: `google_apps_script/setup_guide.md`

### Raiffeisenbank ABO

```bash
# Převod CSV do ABO pro Raiffeisenbank
python3 abo_converter.py \
  --csv-to-abo platby.csv \
  --bank raiffeisen \
  --output platby.kpc \
  --client "TESTOVACI FIRMA"

# Validace výsledku
python3 abo_converter.py --validate platby.kpc
```

### FIO Bank ABO

```bash
# Převod CSV do ABO pro FIO Bank
python3 abo_converter.py \
  --csv-to-abo platby.csv \
  --bank fio \
  --output platby.kpc \
  --client "TESTOVACI FIRMA"

# Validace výsledku
python3 abo_converter.py --validate platby.kpc
```

### Validace existujících souborů

```bash
# Validace Raiffeisenbank souboru
python3 abo_converter.py --validate raiffeisen_platby.kpc

# Validace FIO Bank souboru  
python3 abo_converter.py --validate fio_platby.kpc
```

## Technické detaily / Technical Details

### ABO Struktura

```
UHL1                    # Hlavička souboru (58 znaků)
1 1501 111111 5500     # Hlavička účetního souboru
2 účet částka datum    # Hlavička skupiny
[položky plateb]       # Platební položky
3 +                    # Konec skupiny
5 +                    # Konec souboru
```

### Kódování

- **Vstup**: UTF-8 (CSV soubory)
- **Výstup**: Windows-1250 (ABO soubory)
- **Konce řádků**: CR+LF (dle specifikace ABO)

## Chyby a řešení / Troubleshooting

### Časté problémy / Common Issues

**UnicodeEncodeError**: Použijte pouze ASCII znaky v názvech klientů nebo nechte skript automaticky převést české znaky.

**Neplatný účet**: Zkontrolujte formát čísla účtu a správnost kontrolního součtu (Modulo 11).

**Neplatné datum**: Použijte formát DD.MM.YYYY nebo YYYY-MM-DD.

## Vývoj / Development

### Bezpečnost / Security

Projekt používá přímé importy funkcí místo volání shell příkazů pro lepší bezpečnost.

The project uses direct function imports instead of shell command execution for better security.

### Přidání podpory nové banky

1. Analyzujte formát ABO souboru dané banky
2. Vytvořte nový převodník podle vzoru `csv_to_abo_raiffeisen.py`
3. Přidejte podporu do `main.py` s přímým importem
4. Aktualizujte validátor `abo_validator.py`
5. Využijte sdílené funkce z `utils/banking_utils.py`

### Testování / Testing

```bash
# Spustit všechny testy / Run all tests
python3 tests/test_runner.py

# Pouze unit testy / Unit tests only
python3 tests/test_runner.py --unit

# Pouze integrační testy / Integration tests only
python3 tests/test_runner.py --integration

# S podrobným výstupem / Verbose output
python3 tests/test_runner.py --verbose

# Test převodu / Test conversion
python3 abo_converter.py --csv-to-abo examples/input_samples/sample_payments.csv --output test.kpc
python3 abo_converter.py --validate test.kpc
```

## Reference

- [Specifikace ABO - ČNB](https://www.cnb.cz/cs/platebni-styk/)
- [Raiffeisenbank ABO formát](https://www.rb.cz/firemni-klienti/platebni-styk)
- [České bankovní kódy](https://www.cnb.cz/cs/platebni-styk/kodovniky/)

## Kontribuování / Contributing

Projekt je na GitHubu s nastavenými CI/CD workflows a šablonami pro issues a pull requesty.

The project is on GitHub with CI/CD workflows and templates for issues and pull requests.

### GitHub Features

- **CI/CD**: Automatické testování napříč Python 3.8-3.11
- **Dependabot**: Automatické aktualizace závislostí
- **Templates**: Šablony pro bug reporty a feature requesty
- **Security Policy**: Jasný proces hlášení bezpečnostních problémů

## Licence / License

MIT License - viz LICENSE soubor

## Podpora / Support

Pro hlášení chyb a návrhy vytvořte issue v repositáři.

For bug reports and suggestions, please create an issue in the repository.

## Autor / Author

Sebastian Hozak <hozaksebastian@gmail.com>