"""
PRAGATI AI - Configuration Module
Centralized path definitions and ETL setting parameters.
"""

from pathlib import Path

# Base project paths
BASE_PATH = Path(__file__).resolve().parent
RAW_DATA_PATH = BASE_PATH / "Raw_Data"
CLEAN_DATA_PATH = BASE_PATH / "Clean_Data"
LOG_PATH = BASE_PATH / "Logs"

# Additional output path for Snowflake-ready CSVs
SNOWFLAKE_READY_PATH = BASE_PATH / "Snowflake_Ready"

# Standardized target mapping for Snowflake CSV outputs
SNOWFLAKE_TARGET_MAP = {
    "6. India Census 2011": "INDIA_CENSUS_2011",
    "A-1_NO_OF_VILLAGES_TOWNS_HOUSEHOLDS_POPULATION_AND_AREA": "CENSUS_POPULATION_AREA",
    "NFHS_5_Factsheets_Data": "NFHS_5_FACTSHEETS",
    "India-Tourism-Statistics-2022-Table-2.1.4": "TOURISM_STATISTICS",
    "RS_Session_262_AU_1059_C_i": "RS_SESSION_262",
}

# Supported file formats
SUPPORTED_EXTENSIONS = {".csv", ".xlsx", ".xls"}

# Missing value representations to convert to standard NaN
MISSING_VALUES = [
    "",
    "NA",
    "N/A",
    "n/a",
    "null",
    "NULL",
    "None",
    "nan",
    "NaN",
    "-",
    "--",
    "N/A ",
    " NA ",
]

# Ensure required output directories exist
def ensure_directories():
    CLEAN_DATA_PATH.mkdir(parents=True, exist_ok=True)
    SNOWFLAKE_READY_PATH.mkdir(parents=True, exist_ok=True)
    LOG_PATH.mkdir(parents=True, exist_ok=True)

