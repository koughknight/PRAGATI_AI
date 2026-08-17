"""
PRAGATI AI - Intelligent Census Data ETL and Processing System
Main Application Controller
"""

import sys
import time
from pathlib import Path
import pandas as pd

import config
from etl import (
    setup_logger,
    DataExtractor,
    DataCleaner,
    DataValidator,
    SnowflakeFormatter,
)


def run_pipeline():
    """
    Main ETL Pipeline Controller Routine.
    """
    # Step 1: Ensure output directories exist
    config.ensure_directories()

    # Step 2: Initialize Logger
    logger, log_file_path = setup_logger(config.LOG_PATH)
    start_time = time.time()

    logger.info("========================================")
    logger.info("PRAGATI AI ETL PIPELINE STARTED")
    logger.info("========================================")

    # Step 3: Initialize ETL components
    extractor = DataExtractor(config.RAW_DATA_PATH, config.SUPPORTED_EXTENSIONS)
    cleaner = DataCleaner(config.MISSING_VALUES)
    validator = DataValidator()
    snowflake_formatter = SnowflakeFormatter(
        config.SNOWFLAKE_READY_PATH, config.SNOWFLAKE_TARGET_MAP
    )

    # Step 4: Discover raw data files
    discovered_files = extractor.discover_files()
    total_files = len(discovered_files)

    logger.info(f"Files detected in Raw_Data: {total_files}\n")

    # Metrics counters
    stats = {
        "detected": total_files,
        "success": 0,
        "failed": 0,
        "skipped": 0,
        "csv_count": 0,
        "excel_count": 0,
        "snowflake_ready_count": 0,
    }

    if total_files == 0:
        logger.info("No files found in Raw_Data directory.")
        logger.info("========================================")
        return

    # Step 5: Process files sequentially
    for file_path in discovered_files:
        filename = file_path.name
        ext = file_path.suffix.lower()

        logger.info("----------------------------------------")
        logger.info(f"Processing file: {filename}")
        logger.info(f"File type: {ext}")

        # Check for supported extensions
        if ext not in config.SUPPORTED_EXTENSIONS:
            logger.info("Status: SKIPPED - Unsupported file type")
            stats["skipped"] += 1
            continue

        try:
            # Route and extract
            if ext == ".csv":
                stats["csv_count"] += 1
            else:
                stats["excel_count"] += 1

            logger.info("Extracting data...")
            extracted_data = extractor.extract(file_path)

            processed_outputs = {}
            total_orig_rows = 0
            total_orig_cols = 0
            total_clean_rows = 0
            total_clean_cols = 0

            # Step 6: Clean and Validate each sheet/DataFrame
            for identifier, raw_df in extracted_data.items():
                orig_r, orig_c = len(raw_df), len(raw_df.columns)
                total_orig_rows += orig_r
                total_orig_cols = max(total_orig_cols, orig_c)

                logger.info(f"-> Sheet/Dataset '{identifier}': Raw shape = ({orig_r} rows, {orig_c} cols)")

                cleaned_df, clean_metrics = cleaner.clean(raw_df)
                val_report = validator.validate(cleaned_df)

                c_r, c_c = len(cleaned_df), len(cleaned_df.columns)
                total_clean_rows += c_r
                total_clean_cols = max(total_clean_cols, c_c)

                logger.info(
                    f"   Cleaned shape = ({c_r} rows, {c_c} cols) | "
                    f"Duplicates removed = {clean_metrics['duplicates_removed']} | "
                    f"Empty rows removed = {clean_metrics['empty_rows_removed']}"
                )
                logger.info(f"   Validation Status: {val_report['status']} ({val_report['message']})")

                processed_outputs[identifier] = cleaned_df

            # Step 7: Save Cleaned Data to Clean_Data
            clean_stem = file_path.stem.replace(" ", "_")
            if ext == ".csv":
                out_filename = f"{clean_stem}_cleaned.csv"
                out_path = config.CLEAN_DATA_PATH / out_filename
                
                # Single DataFrame for CSV
                first_df = next(iter(processed_outputs.values()))
                first_df.to_csv(out_path, index=False, encoding="utf-8-sig")

            else:
                # Excel output (.xlsx format)
                out_filename = f"{clean_stem}_cleaned.xlsx"
                out_path = config.CLEAN_DATA_PATH / out_filename

                with pd.ExcelWriter(out_path, engine="openpyxl") as writer:
                    for sheet_name, df_out in processed_outputs.items():
                        # Truncate sheet name to max 31 chars (Excel limit)
                        safe_sheet_name = str(sheet_name)[:31]
                        df_out.to_excel(writer, sheet_name=safe_sheet_name, index=False)

            logger.info(f"Saved: Clean_Data\\{out_filename}")

            # Step 8: Export Snowflake-Ready CSV files
            sf_exports = snowflake_formatter.export_snowflake_ready(
                file_path.stem, processed_outputs
            )
            for sf_path, sf_rows, sf_cols in sf_exports:
                logger.info(
                    f"Created Snowflake-ready CSV: Snowflake_Ready\\{sf_path.name} "
                    f"({sf_rows} rows, {sf_cols} cols)"
                )
                stats["snowflake_ready_count"] += 1

            stats["success"] += 1

        except Exception as e:
            logger.error(f"ERROR processing file '{filename}': {str(e)}", exc_info=False)
            logger.info("Status: FAILED - Processed failed for this file, continuing with remaining datasets.")
            stats["failed"] += 1

    # Step 9: Execution Summary
    elapsed_time = round(time.time() - start_time, 2)

    logger.info("========================================")
    logger.info("PRAGATI AI ETL PIPELINE COMPLETED")
    logger.info("========================================")
    logger.info(f"Total files detected      : {stats['detected']}")
    logger.info(f"Successfully processed    : {stats['success']}")
    logger.info(f"Failed                   : {stats['failed']}")
    logger.info(f"Skipped                  : {stats['skipped']}")
    logger.info(f"CSV files processed      : {stats['csv_count']}")
    logger.info(f"Excel files processed    : {stats['excel_count']}")
    logger.info(f"Snowflake CSVs created   : {stats['snowflake_ready_count']}")
    logger.info(f"Execution duration       : {elapsed_time} seconds")
    logger.info("")
    logger.info(f"Cleaned datasets saved to:\n  {config.CLEAN_DATA_PATH}")
    logger.info(f"Snowflake-ready CSVs saved to:\n  {config.SNOWFLAKE_READY_PATH}")
    logger.info(f"Logs saved to:\n  {log_file_path}")
    logger.info("========================================")


if __name__ == "__main__":
    run_pipeline()

