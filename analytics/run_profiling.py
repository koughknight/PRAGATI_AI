"""
PRAGATI AI - Phase 2A Data Profiling Execution Runner
Executes comprehensive data profiling across 5 Snowflake datasets and outputs reports.
Usage: python analytics/run_profiling.py
"""

import sys
import logging
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.snowflake import SnowflakeExtractor
from analytics.profiling import SnowflakeDataProfiler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("RunProfiling")


def main():
    print("\n=======================================================")
    print("  PRAGATI AI – PHASE 2A: DATA PROFILING RUNNER        ")
    print("=======================================================\n")

    output_dir = PROJECT_ROOT / "Analytics_Results" / "profiling"
    logger.info(f"Target Output Directory: {output_dir}")

    try:
        with SnowflakeExtractor() as extractor:
            logger.info("Initializing SnowflakeDataProfiler...")
            profiler = SnowflakeDataProfiler(output_dir=output_dir)

            # Step 1: Load datasets
            datasets = profiler.load_datasets(extractor)
            print(f"\n✅ Successfully retrieved {len(datasets)} datasets from Snowflake:")
            for name, df in datasets.items():
                print(f"   • {name:<25}: {len(df):>5} rows x {len(df.columns):>3} columns")

            # Step 2: Perform profiling
            print("\n-------------------------------------------------------")
            print("Executing Data Profiling Algorithms...")
            print("-------------------------------------------------------")
            df_summary, df_schema, df_missing, df_categorical = profiler.profile_all()

            # Step 3: Export CSV reports
            file_map = profiler.save_reports(df_summary, df_schema, df_missing, df_categorical)

            print("\n=======================================================")
            print("           DATA PROFILING SUMMARY RESULTS              ")
            print("=======================================================")
            print(df_summary.to_string(index=False))

            print("\n=======================================================")
            print("           PROFILING REPORTS GENERATED                 ")
            print("=======================================================")
            for fname, fpath in file_map.items():
                exists_icon = "✅" if fpath.exists() else "❌"
                size_kb = round(fpath.stat().st_size / 1024, 2) if fpath.exists() else 0
                print(f"{exists_icon} {fname:<25} -> {fpath} ({size_kb} KB)")

            print("\n=======================================================")
            print("Phase 2A Data Profiling Execution Completed Successfully.")
            print("=======================================================\n")

    except Exception as e:
        logger.error(f"❌ Profiling execution failed: {str(e)}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
