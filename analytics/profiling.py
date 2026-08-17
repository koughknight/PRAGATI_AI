"""
PRAGATI AI - Snowflake Dataset Profiler
Performs data profiling on extracted Snowflake clean datasets and exports CSV reports.
"""

import logging
from pathlib import Path
from typing import Dict, List, Tuple, Any
import pandas as pd
import numpy as np

from src.snowflake import SnowflakeExtractor

logger = logging.getLogger("PRAGATI_AI.AnalyticsProfiler")


class SnowflakeDataProfiler:
    """
    Data profiler for inspecting schemas, missing values, categorical distributions,
    and summary stats of Snowflake datasets.
    """

    TARGET_TABLES = [
        "CENSUS_POPULATION_AREA",
        "INDIA_CENSUS_2011",
        "NFHS_5_FACTSHEETS",
        "RS_SESSION_262",
        "TOURISM_STATISTICS",
    ]

    GEOGRAPHIC_KEYWORDS = ["STATE", "DISTRICT", "REGION", "COUNTRY", "UT"]
    TIME_KEYWORDS = ["YEAR", "DATE", "2017", "2018", "2019", "2020", "2021", "SESSION"]

    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.datasets: Dict[str, pd.DataFrame] = {}

    def load_datasets(self, extractor: SnowflakeExtractor) -> Dict[str, pd.DataFrame]:
        """Fetches full tables from Snowflake using the existing extractor."""
        logger.info("Fetching datasets from Snowflake...")
        available_tables = extractor.list_tables()
        
        for table in self.TARGET_TABLES:
            matching = [t for t in available_tables if t.upper() == table.upper()]
            table_name = matching[0] if matching else table
            logger.info(f"Retrieving table '{table_name}'...")
            df = extractor.fetch_table_dataframe(table_name)
            self.datasets[table] = df
            logger.info(f"Loaded '{table}': {len(df)} rows, {len(df.columns)} cols.")
            
        return self.datasets

    def infer_column_type(self, col_name: str, dtype: np.dtype) -> str:
        """Categorizes column type based on name and data type."""
        name_upper = col_name.upper()
        
        if any(geo in name_upper for geo in self.GEOGRAPHIC_KEYWORDS):
            return "Geographic"
        elif any(t in name_upper for t in self.TIME_KEYWORDS):
            return "Time/Year"
        elif name_upper in ["SL_NO", "ID", "INDEX"]:
            return "Identifier"
        elif pd.api.types.is_numeric_dtype(dtype):
            return "Numeric"
        else:
            return "Categorical"

    def profile_all(self) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Runs comprehensive profiling across all loaded datasets.
        Returns DataFrames for:
          1. profiling_summary
          2. dataset_schema
          3. missing_values
          4. categorical_summary
        """
        summary_rows = []
        schema_rows = []
        missing_rows = []
        categorical_rows = []

        for name, df in self.datasets.items():
            total_rows = len(df)
            total_cols = len(df.columns)
            total_cells = total_rows * total_cols
            total_missing = int(df.isna().sum().sum())
            missing_pct = round((total_missing / total_cells * 100) if total_cells > 0 else 0, 2)
            duplicate_rows = int(df.duplicated().sum())
            memory_usage_mb = round(df.memory_usage(deep=True).sum() / (1024 * 1024), 4)

            numeric_count = 0
            categorical_count = 0
            time_count = 0
            geo_count = 0

            for col in df.columns:
                dtype = df[col].dtype
                inferred_type = self.infer_column_type(col, dtype)

                if inferred_type == "Numeric":
                    numeric_count += 1
                elif inferred_type == "Categorical":
                    categorical_count += 1
                elif inferred_type == "Time/Year":
                    time_count += 1
                elif inferred_type == "Geographic":
                    geo_count += 1

                null_count = int(df[col].isna().sum())
                non_null_count = total_rows - null_count
                null_pct = round((null_count / total_rows * 100) if total_rows > 0 else 0, 2)
                unique_vals = int(df[col].nunique(dropna=False))

                # Schema entry
                schema_rows.append({
                    "dataset_name": name,
                    "column_name": col,
                    "data_type": str(dtype),
                    "inferred_type": inferred_type,
                    "non_null_count": non_null_count,
                    "null_count": null_count,
                    "null_percentage": null_pct,
                    "unique_values_count": unique_vals,
                })

                # Missing values entry
                if null_count > 0:
                    valid_samples = df[col].dropna().unique()[:3].tolist()
                    sample_str = ", ".join(map(str, valid_samples))
                    missing_rows.append({
                        "dataset_name": name,
                        "column_name": col,
                        "total_rows": total_rows,
                        "missing_count": null_count,
                        "missing_percentage": null_pct,
                        "sample_valid_values": sample_str,
                    })

                # Categorical summary entry
                if inferred_type in ["Categorical", "Geographic"] or not pd.api.types.is_numeric_dtype(dtype):
                    val_counts = df[col].value_counts(dropna=True)
                    top_cats = val_counts.head(3).to_dict()
                    cat_items = list(top_cats.items())

                    top1_cat = cat_items[0][0] if len(cat_items) > 0 else "N/A"
                    top1_freq = cat_items[0][1] if len(cat_items) > 0 else 0
                    top2_cat = cat_items[1][0] if len(cat_items) > 1 else "N/A"
                    top2_freq = cat_items[1][1] if len(cat_items) > 1 else 0
                    top3_cat = cat_items[2][0] if len(cat_items) > 2 else "N/A"
                    top3_freq = cat_items[2][1] if len(cat_items) > 2 else 0

                    cardinality_ratio = round((unique_vals / total_rows) if total_rows > 0 else 0, 4)

                    categorical_rows.append({
                        "dataset_name": name,
                        "column_name": col,
                        "unique_count": unique_vals,
                        "cardinality_ratio": cardinality_ratio,
                        "top_category_1": str(top1_cat),
                        "top_category_1_freq": top1_freq,
                        "top_category_2": str(top2_cat),
                        "top_category_2_freq": top2_freq,
                        "top_category_3": str(top3_cat),
                        "top_category_3_freq": top3_freq,
                    })

            # Summary entry
            summary_rows.append({
                "dataset_name": name,
                "total_rows": total_rows,
                "total_cols": total_cols,
                "numeric_cols_count": numeric_count,
                "categorical_cols_count": categorical_count,
                "date_year_cols_count": time_count,
                "geographic_cols_count": geo_count,
                "total_missing_cells": total_missing,
                "missing_cell_percentage": missing_pct,
                "duplicate_rows_count": duplicate_rows,
                "memory_usage_mb": memory_usage_mb,
            })

        df_summary = pd.DataFrame(summary_rows)
        df_schema = pd.DataFrame(schema_rows)
        df_missing = pd.DataFrame(missing_rows)
        df_categorical = pd.DataFrame(categorical_rows)

        return df_summary, df_schema, df_missing, df_categorical

    def save_reports(
        self,
        df_summary: pd.DataFrame,
        df_schema: pd.DataFrame,
        df_missing: pd.DataFrame,
        df_categorical: pd.DataFrame,
    ) -> Dict[str, Path]:
        """Saves profiling DataFrames to CSV files in output_dir."""
        file_map = {
            "profiling_summary.csv": self.output_dir / "profiling_summary.csv",
            "dataset_schema.csv": self.output_dir / "dataset_schema.csv",
            "missing_values.csv": self.output_dir / "missing_values.csv",
            "categorical_summary.csv": self.output_dir / "categorical_summary.csv",
        }

        df_summary.to_csv(file_map["profiling_summary.csv"], index=False)
        df_schema.to_csv(file_map["dataset_schema.csv"], index=False)
        df_missing.to_csv(file_map["missing_values.csv"], index=False)
        df_categorical.to_csv(file_map["categorical_summary.csv"], index=False)

        for name, path in file_map.items():
            logger.info(f"Saved '{name}' to {path}")

        return file_map
