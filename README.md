# PRAGATI AI – Intelligent Census Data ETL and Processing System

## Project Objective
**PRAGATI AI** is an automated, modular, Python-based ETL (Extract, Transform, Load) system designed to process heterogeneous census and government datasets. It scans raw input files, identifies file formats (`.csv`, `.xlsx`, `.xls`), extracts sheet/tabular data, standardizes and cleans datasets safely without domain value fabrication, validates data integrity, and saves clean output files along with comprehensive execution logs.

---

## Architecture & Project Structure
The application follows a clean modular design tailored for academic (MCA) clarity and demonstration:

```text
D:\CLT\PRAGATI_AI
│
├── Raw_Data/             # Input datasets (READ-ONLY)
├── Clean_Data/           # Processed datasets (Generated)
├── Logs/                 # Execution logs (Generated)
│
├── main.py               # Main pipeline controller
├── config.py             # Central path & ETL configuration
├── requirements.txt      # Dependencies specification
├── README.md             # Project documentation
│
└── etl/                  # Core ETL Package
    ├── __init__.py       # Package initializer
    ├── extractor.py      # Format discovery & data reader
    ├── cleaner.py        # Conservative cleaning routines
    ├── validator.py      # Quality assurance & metric reporting
    └── logger.py         # Dual file & console logger
```

---

## ETL Pipeline Stages

1. **Extract (`etl/extractor.py`)**
   - Automatically scans `Raw_Data/`.
   - Supports `.csv`, `.xlsx`, and `.xls` formats.
   - Handles multi-sheet Excel workbooks and robust CSV encoding fallbacks (`utf-8`, `latin-1`, `cp1252`).

2. **Transform & Clean (`etl/cleaner.py`)**
   - Strips leading/trailing whitespace from string fields and column headers.
   - Standardizes headers to `snake_case` format and removes special characters.
   - Standardizes missing value string representations (`"NA"`, `"N/A"`, `"null"`, `"-"`, etc.) to standard `NaN`.
   - Removes completely empty rows and columns.
   - Eliminates exact duplicate rows.
   - Performs safe numeric conversions (e.g., stripping formatted commas) while preserving original domain meanings.

3. **Validate (`etl/validator.py`)**
   - Validates dataset shape, non-emptiness, remaining duplicates, missing data percentages, and data type summaries.

4. **Load & Save (`main.py`)**
   - Saves cleaned datasets to `Clean_Data/` with `_cleaned` suffix (`.csv` and multi-sheet `.xlsx`).
   - Writes detailed timestamped logs to `Logs/`.

---

## Installation & Setup

### Prerequisites
- Python 3.9+ (Windows compatible)

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Run the ETL Pipeline
```bash
python main.py
```

---

## Input & Output Locations

- **Raw Input Directory**: `D:\CLT\PRAGATI_AI\Raw_Data` (READ-ONLY)
- **Cleaned Output Directory**: `D:\CLT\PRAGATI_AI\Clean_Data`
- **Execution Logs Directory**: `D:\CLT\PRAGATI_AI\Logs`
