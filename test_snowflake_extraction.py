"""
PRAGATI AI - Snowflake Data Extraction & Validation Test Script
Tests secure connection, table discovery, and extraction sampling for clean tables:
  1. CENSUS_POPULATION_AREA
  2. INDIA_CENSUS_2011
  3. NFHS_5_FACTSHEETS
  4. RS_SESSION_262
  5. TOURISM_STATISTICS
"""

import sys
import logging
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.snowflake import get_snowflake_connection, SnowflakeExtractor, validate_extracted_dataframe

# Configure logging to output cleanly to console
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("TestSnowflakeExtraction")

# Target clean tables specified for validation
TARGET_TABLES = [
    "CENSUS_POPULATION_AREA",
    "INDIA_CENSUS_2011",
    "NFHS_5_FACTSHEETS",
    "RS_SESSION_262",
    "TOURISM_STATISTICS",
]

SAMPLE_LIMIT = 10


def run_test():
    print("\n=======================================================")
    print("  PRAGATI AI – SNOWFLAKE DATA EXTRACTION LAYER TEST  ")
    print("=======================================================\n")

    logger.info("Initializing Snowflake Extractor...")
    
    try:
        with SnowflakeExtractor() as extractor:
            logger.info("Connection established successfully.")
            
            # Step 1: Table Discovery
            discovered_tables = extractor.list_tables()
            print(f"\n📋 Discovered Tables in CLEAN_DATA Schema ({len(discovered_tables)} total):")
            for t in discovered_tables:
                print(f"   • {t}")
            
            print("\n-------------------------------------------------------")
            print(f"Sampling Target Tables (LIMIT = {SAMPLE_LIMIT})")
            print("-------------------------------------------------------")

            extraction_summary = []

            # Step 2: Iterate through specified target tables
            for target_table in TARGET_TABLES:
                print(f"\n🔍 Testing Table: '{target_table}'")
                
                if target_table not in discovered_tables:
                    # Case-insensitive match check
                    matching = [t for t in discovered_tables if t.upper() == target_table.upper()]
                    if matching:
                        table_to_fetch = matching[0]
                    else:
                        logger.warning(f"⚠️ Table '{target_table}' not found in discovered tables! Trying query directly...")
                        table_to_fetch = target_table
                else:
                    table_to_fetch = target_table

                try:
                    df, val_report = extractor.fetch_and_validate(table_to_fetch, limit=SAMPLE_LIMIT)
                    
                    print(f"   ✓ Extracted Shape       : {val_report['row_count']} rows x {val_report['column_count']} columns")
                    print(f"   ✓ Memory Footprint      : {val_report['memory_usage_mb']} MB")
                    print(f"   ✓ Total Nulls           : {val_report['total_nulls']}")
                    print(f"   ✓ Duplicate Rows        : {val_report['duplicate_rows']}")
                    print(f"   ✓ Columns ({len(val_report['columns'])}): {val_report['columns'][:5]}{'...' if len(val_report['columns']) > 5 else ''}")
                    print("\n   Sample Data Head (First 3 rows):")
                    print(df.head(3).to_string(index=False))

                    extraction_summary.append({
                        "table": target_table,
                        "status": "SUCCESS",
                        "rows_sampled": len(df),
                        "cols": len(df.columns),
                    })

                except Exception as e:
                    logger.error(f"❌ Failed to extract table '{target_table}': {str(e)}")
                    extraction_summary.append({
                        "table": target_table,
                        "status": f"FAILED ({str(e)})",
                        "rows_sampled": 0,
                        "cols": 0,
                    })

            print("\n=======================================================")
            print("                EXTRACTION TEST SUMMARY                ")
            print("=======================================================")
            success_count = sum(1 for item in extraction_summary if item["status"] == "SUCCESS")
            for item in extraction_summary:
                status_icon = "✅" if item["status"] == "SUCCESS" else "❌"
                print(f"{status_icon} Table: {item['table']:<25} | Status: {item['status']} | Shape: ({item['rows_sampled']} rows, {item['cols']} cols)")
            
            print(f"\nFinal Result: {success_count}/{len(TARGET_TABLES)} target clean tables successfully extracted and validated.")
            print("=======================================================\n")

    except Exception as exc:
        logger.error(f"❌ Extraction test failed at connection/initialization stage: {str(exc)}")
        sys.exit(1)


if __name__ == "__main__":
    run_test()
