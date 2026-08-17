"""
PRAGATI AI - Snowflake Data Extractor and Validator Module
Handles data retrieval from Snowflake CLEAN_DATA schema into Pandas DataFrames
and performs technical metadata validation.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
import pandas as pd
from snowflake.connector import SnowflakeConnection
from snowflake.connector.errors import Error as SnowflakeError

from .connection import get_snowflake_connection

logger = logging.getLogger("PRAGATI_AI.SnowflakeExtractor")


def validate_extracted_dataframe(df: pd.DataFrame, dataset_name: str) -> Dict[str, Any]:
    """
    Performs basic technical validation on an extracted Pandas DataFrame.
    Validates structural properties without altering business meaning:
      - Row count and Column count
      - Column names and data types
      - Null counts per column and total nulls
      - Duplicate row counts
      - Memory footprint
    """
    row_count = len(df)
    col_count = len(df.columns)
    column_names = list(df.columns)
    data_types = {col: str(dtype) for col, dtype in df.dtypes.items()}
    null_counts = {col: int(df[col].isna().sum()) for col in df.columns}
    total_nulls = sum(null_counts.values())
    duplicate_rows = int(df.duplicated().sum())
    memory_usage_mb = round(df.memory_usage(deep=True).sum() / (1024 * 1024), 3)

    report = {
        "dataset_name": dataset_name,
        "row_count": row_count,
        "column_count": col_count,
        "columns": column_names,
        "dtypes": data_types,
        "null_counts": null_counts,
        "total_nulls": total_nulls,
        "duplicate_rows": duplicate_rows,
        "memory_usage_mb": memory_usage_mb,
    }

    logger.info(
        f"Validation for dataset '{dataset_name}': {row_count} rows, {col_count} cols | "
        f"Duplicates={duplicate_rows} | Total Nulls={total_nulls} | Memory={memory_usage_mb} MB"
    )
    return report


class SnowflakeExtractor:
    """
    Modular Extractor for fetching clean census and business data from Snowflake.
    """

    def __init__(self, conn: Optional[SnowflakeConnection] = None):
        """
        Initializes extractor with an active Snowflake connection.
        If conn is None, creates a connection using default environment settings.
        """
        self._external_conn = conn is not None
        self.conn = conn or get_snowflake_connection()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def close(self):
        """Closes connection if managed internally."""
        if not self._external_conn and self.conn and not self.conn.is_closed():
            logger.info("Closing Snowflake extractor connection.")
            self.conn.close()

    def list_tables(self) -> List[str]:
        """
        Discovers all available tables in the current Snowflake database schema.
        Returns a list of table names.
        """
        logger.info("Discovering tables in current Snowflake schema...")
        query = """
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = CURRENT_SCHEMA()
              AND TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        """
        try:
            cursor = self.conn.cursor()
            cursor.execute(query)
            tables = [row[0] for row in cursor.fetchall()]
            cursor.close()
            logger.info(f"Discovered {len(tables)} tables: {tables}")
            return tables
        except SnowflakeError as se:
            logger.error(f"Failed to list tables from INFORMATION_SCHEMA: {se.msg}")
            # Fallback to SHOW TABLES
            try:
                cursor = self.conn.cursor()
                cursor.execute("SHOW TABLES")
                tables = [row[1] for row in cursor.fetchall()]  # Name is column 1
                cursor.close()
                logger.info(f"Discovered {len(tables)} tables via SHOW TABLES: {tables}")
                return tables
            except Exception as ex:
                logger.error(f"Fallback SHOW TABLES also failed: {str(ex)}")
                raise

    def fetch_table_dataframe(self, table_name: str, limit: Optional[int] = None) -> pd.DataFrame:
        """
        Fetches data from specified Snowflake table into a Pandas DataFrame.
        Supports optional row limit for sampling.
        """
        # Sanitize table_name identifier
        clean_table_name = table_name.strip().strip('"')
        
        sql = f'SELECT * FROM "{clean_table_name}"'
        if limit is not None and limit > 0:
            sql += f" LIMIT {int(limit)}"

        logger.info(f"Executing query: {sql}")
        try:
            cursor = self.conn.cursor()
            cursor.execute(sql)
            df = cursor.fetch_pandas_all()
            cursor.close()
            logger.info(f"Successfully retrieved {len(df)} rows and {len(df.columns)} columns from '{clean_table_name}'.")
            return df
        except SnowflakeError as se:
            logger.error(f"Snowflake error executing query for table '{table_name}': {se.msg}")
            raise
        except Exception as e:
            logger.error(f"Error fetching DataFrame for table '{table_name}': {str(e)}")
            raise

    def fetch_and_validate(
        self, table_name: str, limit: Optional[int] = None
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Fetches table data into a DataFrame and performs basic technical validation.
        Returns tuple of (DataFrame, ValidationReport).
        """
        df = self.fetch_table_dataframe(table_name, limit=limit)
        validation_report = validate_extracted_dataframe(df, dataset_name=table_name)
        return df, validation_report
