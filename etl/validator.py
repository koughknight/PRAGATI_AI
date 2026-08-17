"""
PRAGATI AI Data Validation Module
Validates cleaned datasets and generates structured validation health reports.
"""

import pandas as pd
from typing import Dict, Any


class DataValidator:
    """
    DataValidator inspects cleaned DataFrames and produces health/validation reports.
    """

    def validate(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Validates a DataFrame after cleaning.
        Returns a validation report dictionary.
        """
        total_rows = len(df)
        total_cols = len(df.columns)

        if total_rows == 0 or total_cols == 0:
            return {
                "status": "FAILED",
                "message": "Dataset is empty (0 rows or 0 columns).",
                "total_rows": total_rows,
                "total_cols": total_cols,
                "duplicate_rows_remaining": 0,
                "total_missing_values": 0,
                "missing_percentage": 0.0,
                "column_datatypes": {},
            }

        remaining_duplicates = int(df.duplicated().sum())
        total_cells = total_rows * total_cols
        total_missing = int(df.isna().sum().sum())
        missing_pct = round((total_missing / total_cells) * 100, 2)

        # Datatype summary
        dtype_counts = df.dtypes.astype(str).value_counts().to_dict()

        # Status determination
        status = "PASSED"
        warnings = []

        if remaining_duplicates > 0:
            status = "WARNING"
            warnings.append(f"Contains {remaining_duplicates} duplicate rows.")

        if missing_pct > 50.0:
            status = "WARNING"
            warnings.append(f"High missing data ratio: {missing_pct}% of cells are null.")

        msg = "Dataset validation passed successfully." if status == "PASSED" else " | ".join(warnings)

        return {
            "status": status,
            "message": msg,
            "total_rows": total_rows,
            "total_cols": total_cols,
            "duplicate_rows_remaining": remaining_duplicates,
            "total_missing_values": total_missing,
            "missing_percentage": missing_pct,
            "column_datatypes": dtype_counts,
        }
