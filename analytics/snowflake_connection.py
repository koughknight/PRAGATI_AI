"""
PRAGATI AI - Snowflake Connection Module (Analytics Layer)
Delegates connection management to src.snowflake.connection.
"""

import sys
from pathlib import Path

# Add project root to path if needed for imports
project_root = Path(__file__).resolve().parents[1]
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from src.snowflake.connection import get_snowflake_connection


def get_connection():
    """
    Returns a secure Snowflake connection using environment parameters.
    """
    return get_snowflake_connection()


if __name__ == "__main__":
    conn = get_connection()

    print("✅ Connected to Snowflake!")

    cursor = conn.cursor()

    cursor.execute("""
        SELECT CURRENT_ACCOUNT(),
               CURRENT_WAREHOUSE(),
               CURRENT_DATABASE(),
               CURRENT_SCHEMA()
    """)

    result = cursor.fetchone()

    print("Account:", result[0])
    print("Warehouse:", result[1])
    print("Database:", result[2])
    print("Schema:", result[3])

    cursor.close()
    conn.close()