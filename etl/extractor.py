"""
PRAGATI AI Data Extraction Module
Handles discovery and reading of CSV, XLSX, and XLS datasets with robust encoding and engine fallbacks.
"""

from pathlib import Path
import pandas as pd
from typing import Dict, List, Tuple


class DataExtractor:
    """
    DataExtractor scans directories for supported datasets and reads them into pandas DataFrames.
    Supports multi-sheet Excel files and robust encoding fallbacks for CSVs.
    """

    def __init__(self, raw_data_path: Path, supported_extensions: set):
        self.raw_data_path = raw_data_path
        self.supported_extensions = supported_extensions

    def discover_files(self) -> List[Path]:
        """
        Scans raw_data_path directory and returns list of all file paths.
        Sorted by filename for consistent processing order.
        """
        if not self.raw_data_path.exists():
            return []
        
        all_items = [f for f in self.raw_data_path.iterdir() if f.is_file()]
        return sorted(all_items, key=lambda p: p.name.lower())

    def extract(self, file_path: Path) -> Dict[str, pd.DataFrame]:
        """
        Extracts data from a given file path.
        Returns a dictionary mapping identifier (sheet name or file stem) to pandas DataFrame.
        """
        ext = file_path.suffix.lower()

        if ext == ".csv":
            df = self._read_csv(file_path)
            return {file_path.stem: df}

        elif ext in (".xlsx", ".xls"):
            return self._read_excel(file_path, ext)

        else:
            raise ValueError(f"Unsupported file extension: {ext}")

    def _read_csv(self, file_path: Path) -> pd.DataFrame:
        """
        Attempts to read CSV file with multiple encoding strategies.
        """
        encodings_to_try = ["utf-8", "utf-8-sig", "latin-1", "cp1252", "iso-8859-1"]
        
        for encoding in encodings_to_try:
            try:
                df = pd.read_csv(file_path, encoding=encoding, low_memory=False)
                return df
            except (UnicodeDecodeError, pd.errors.ParserError):
                continue
        
        # Final fallback with python engine and replacement strategy
        try:
            df = pd.read_csv(file_path, encoding="utf-8", encoding_errors="replace", engine="python")
            return df
        except Exception as e:
            raise RuntimeError(f"Failed to read CSV '{file_path.name}': {str(e)}")

    def _read_excel(self, file_path: Path, ext: str) -> Dict[str, pd.DataFrame]:
        """
        Reads Excel file (.xlsx or .xls) discovering all sheets.
        """
        engine = "openpyxl" if ext == ".xlsx" else "xlrd"

        try:
            excel_file = pd.ExcelFile(file_path, engine=engine)
            sheet_names = excel_file.sheet_names

            if not sheet_names:
                raise ValueError(f"Excel file '{file_path.name}' has no sheets.")

            sheets_data = {}
            for sheet in sheet_names:
                df = excel_file.parse(sheet)
                sheets_data[sheet] = df

            return sheets_data

        except Exception as e:
            # Fallback attempt if default engine fails
            fallback_engine = "xlrd" if engine == "openpyxl" else "openpyxl"
            try:
                excel_file = pd.ExcelFile(file_path, engine=fallback_engine)
                sheets_data = {}
                for sheet in excel_file.sheet_names:
                    df = excel_file.parse(sheet)
                    sheets_data[sheet] = df
                return sheets_data
            except Exception:
                raise RuntimeError(f"Failed to read Excel workbook '{file_path.name}' using engine '{engine}': {str(e)}")
