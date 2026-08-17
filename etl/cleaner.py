"""
PRAGATI AI Data Cleaning Module
Performs standardized, safe, and conservative data cleaning operations on DataFrames.
"""

import re
import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any


class DataCleaner:
    """
    DataCleaner provides automated cleaning routines for census datasets:
    - Standardizing column headers to unique snake_case names
    - Removing completely empty rows and columns
    - Stripping trailing/leading whitespaces from strings
    - Replacing string-based missing representations with standard NaN
    - Deduplicating identical rows
    - Safe numeric type coercion without value fabrication
    """

    def __init__(self, missing_value_tokens: list):
        self.missing_value_tokens = missing_value_tokens

    def clean(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Executes cleaning pipeline on input DataFrame.
        Returns (cleaned_dataframe, cleaning_metrics_dict).
        """
        metrics = {
            "original_rows": len(df),
            "original_cols": len(df.columns),
            "empty_rows_removed": 0,
            "empty_cols_removed": 0,
            "duplicates_removed": 0,
            "rows_after_cleaning": 0,
            "cols_after_cleaning": 0,
            "total_missing_values": 0,
        }

        if df.empty:
            metrics["rows_after_cleaning"] = 0
            metrics["cols_after_cleaning"] = 0
            return df, metrics

        # Work on a copy
        cleaned_df = df.copy()

        # 1. Standardize column names
        cleaned_df.columns = self._clean_column_names(cleaned_df.columns)

        # 2. Convert missing value representations across object columns
        cleaned_df = self._standardize_missing_values(cleaned_df)

        # 3. Trim whitespace from string cells
        cleaned_df = self._strip_string_whitespace(cleaned_df)

        # 4. Remove completely empty rows & columns
        rows_before = len(cleaned_df)
        cols_before = len(cleaned_df.columns)

        cleaned_df = cleaned_df.dropna(how="all", axis=0)

        # Drop columns that are completely empty / all NaN / unnamed empty columns
        cleaned_df = cleaned_df.dropna(how="all", axis=1)

        metrics["empty_rows_removed"] = rows_before - len(cleaned_df)
        metrics["empty_cols_removed"] = cols_before - len(cleaned_df.columns)

        # 5. Remove exact duplicate rows
        rows_before_dedup = len(cleaned_df)
        cleaned_df = cleaned_df.drop_duplicates()
        metrics["duplicates_removed"] = rows_before_dedup - len(cleaned_df)

        # 6. Perform safe numeric conversions (e.g. strip formatted commas in numbers)
        cleaned_df = self._safe_numeric_conversion(cleaned_df)

        # Record final metrics
        metrics["rows_after_cleaning"] = len(cleaned_df)
        metrics["cols_after_cleaning"] = len(cleaned_df.columns)
        metrics["total_missing_values"] = int(cleaned_df.isna().sum().sum())

        return cleaned_df, metrics

    def _clean_column_names(self, columns: pd.Index) -> list:
        """
        Converts column names into snake_case and ensures uniqueness.
        """
        new_cols = []
        seen = {}

        for idx, col in enumerate(columns):
            col_str = str(col).strip()
            
            # If unnamed or empty, create default name
            if not col_str or col_str.startswith("Unnamed:"):
                col_str = f"column_{idx + 1}"

            # Convert to snake_case: lowercase, replace non-alphanumeric chars with '_'
            cleaned = col_str.lower()
            cleaned = re.sub(r"[^\w\s]", "_", cleaned)
            cleaned = re.sub(r"\s+", "_", cleaned)
            cleaned = re.sub(r"_+", "_", cleaned).strip("_")

            if not cleaned:
                cleaned = f"column_{idx + 1}"

            # Handle duplicate column names by appending suffix
            if cleaned in seen:
                seen[cleaned] += 1
                unique_name = f"{cleaned}_{seen[cleaned]}"
            else:
                seen[cleaned] = 0
                unique_name = cleaned

            new_cols.append(unique_name)

        return new_cols

    def _standardize_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Replaces custom string missing tokens (NA, N/A, null, -, etc.) with np.nan.
        """
        # Create map of missing tokens
        missing_set = {str(val).strip().lower() for val in self.missing_value_tokens}

        def replace_val(val):
            if pd.isna(val):
                return np.nan
            if isinstance(val, str) and val.strip().lower() in missing_set:
                return np.nan
            return val

        # Replace in object columns
        for col in df.select_dtypes(include=["object", "string"]).columns:
            df[col] = df[col].map(replace_val)

        return df

    def _strip_string_whitespace(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Strips leading and trailing whitespace from string elements.
        """
        for col in df.select_dtypes(include=["object", "string"]).columns:
            df[col] = df[col].apply(lambda x: x.strip() if isinstance(x, str) else x)
        return df

    def _safe_numeric_conversion(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Safely attempts to convert string columns formatted with commas or numbers to float/int.
        Only converts if a significant majority of non-null values are numeric.
        """
        for col in df.select_dtypes(include=["object", "string"]).columns:
            non_null_series = df[col].dropna()
            if non_null_series.empty:
                continue

            # Check if values look like numbers with commas, e.g. "1,234.56"
            cleaned_series = non_null_series.astype(str).str.replace(",", "", regex=False).str.strip()
            numeric_coerced = pd.to_numeric(cleaned_series, errors="coerce")

            valid_numeric_count = numeric_coerced.notna().sum()
            total_non_null = len(non_null_series)

            # If > 80% of non-null values can be converted, apply numeric conversion
            if total_non_null > 0 and (valid_numeric_count / total_non_null) >= 0.80:
                df[col] = pd.to_numeric(
                    df[col].astype(str).str.replace(",", "", regex=False).str.strip(),
                    errors="coerce"
                )

        return df
