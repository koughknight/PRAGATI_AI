"""
PRAGATI AI Snowflake Formatter Module
Prepares cleaned datasets for Snowflake ingestion by standardizing column names,
handling multi-sheet workbooks, and exporting Snowflake-ready UTF-8 CSV files.
"""

from pathlib import Path
import re
import pandas as pd
from typing import Dict, List, Tuple


class SnowflakeFormatter:
    """
    SnowflakeFormatter formats cleaned DataFrames into Snowflake-compatible CSV files.
    """

    def __init__(self, target_dir: Path, target_map: Dict[str, str] = None):
        self.target_dir = target_dir
        self.target_map = target_map or {}

    def format_columns(self, columns: pd.Index) -> List[str]:
        """
        Converts column names to Snowflake-friendly uppercase identifiers:
        - Uppercase
        - Spaces & special characters converted to single underscores
        - Guarantees uniqueness across column names
        """
        seen = {}
        new_cols = []

        for idx, col in enumerate(columns):
            col_str = str(col).strip().upper()
            cleaned = re.sub(r"[^A-Z0-9_]", "_", col_str)
            cleaned = re.sub(r"_+", "_", cleaned).strip("_")

            if not cleaned:
                cleaned = f"COLUMN_{idx + 1}"

            if cleaned in seen:
                seen[cleaned] += 1
                unique_name = f"{cleaned}_{seen[cleaned]}"
            else:
                seen[cleaned] = 0
                unique_name = cleaned

            new_cols.append(unique_name)

        return new_cols

    def export_snowflake_ready(
        self, file_stem: str, processed_outputs: Dict[str, pd.DataFrame]
    ) -> List[Tuple[Path, int, int]]:
        """
        Exports processed outputs (dict of sheet_name -> cleaned_df) as Snowflake-ready CSVs.
        Returns a list of tuples: (output_csv_path, row_count, col_count).
        """
        self.target_dir.mkdir(parents=True, exist_ok=True)
        base_name = self.target_map.get(file_stem)

        if not base_name:
            # Fallback sanitization for unmapped stems
            base_name = re.sub(r"[^A-Z0-9_]", "_", file_stem.upper())
            base_name = re.sub(r"_+", "_", base_name).strip("_")

        exported_info = []
        num_sheets = len(processed_outputs)

        for sheet_name, df in processed_outputs.items():
            if num_sheets == 1:
                csv_filename = f"{base_name}.csv"
            else:
                clean_sheet = re.sub(r"[^A-Z0-9_]", "_", str(sheet_name).upper())
                clean_sheet = re.sub(r"_+", "_", clean_sheet).strip("_")
                csv_filename = f"{base_name}_{clean_sheet}.csv"

            output_path = self.target_dir / csv_filename

            # Create a copy and format column headers for Snowflake
            sf_df = df.copy()
            sf_df.columns = self.format_columns(sf_df.columns)

            # Export to CSV without index, utf-8 encoding, and safe null representation
            sf_df.to_csv(output_path, index=False, encoding="utf-8", na_rep="")

            exported_info.append((output_path, len(sf_df), len(sf_df.columns)))

        return exported_info
