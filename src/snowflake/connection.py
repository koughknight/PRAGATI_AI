"""
PRAGATI AI - Snowflake Connection Manager
Handles secure authentication and connection management for Snowflake operations.
"""

import os
import sys
import getpass
import logging
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
import snowflake.connector
from snowflake.connector import SnowflakeConnection
from snowflake.connector.errors import Error as SnowflakeError

# Ensure environment variables are loaded from root .env if present
env_path = Path(__file__).resolve().parents[2] / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path, override=True)
else:
    load_dotenv(override=True)

logger = logging.getLogger("PRAGATI_AI.SnowflakeConnection")


def _get_config_val(key: str, default: str = "") -> str:
    """Helper to fetch credential or config parameter from st.secrets, os.environ, or fallback default."""
    try:
        import streamlit as st
        # Check top-level secret key (e.g., st.secrets["SNOWFLAKE_ACCOUNT"])
        if hasattr(st, "secrets") and key in st.secrets:
            return str(st.secrets[key])
        # Check nested secret under [snowflake] section (e.g., st.secrets["snowflake"]["account"])
        short_key = key.lower().replace("snowflake_", "")
        if hasattr(st, "secrets") and "snowflake" in st.secrets and short_key in st.secrets["snowflake"]:
            return str(st.secrets["snowflake"][short_key])
    except Exception:
        pass
    return os.getenv(key, default)


def get_snowflake_connection(
    account: Optional[str] = None,
    user: Optional[str] = None,
    authenticator: Optional[str] = None,
    password: Optional[str] = None,
    warehouse: Optional[str] = None,
    database: Optional[str] = None,
    schema: Optional[str] = None,
    role: Optional[str] = None,
    prompt_password_if_missing: bool = True,
) -> SnowflakeConnection:
    """
    Creates and returns a secure connection to Snowflake.
    Prioritizes passed arguments, then Streamlit secrets, then environment variables.
    
    Supports:
      - Username & Password authentication
      - External browser (SSO) authentication (authenticator='externalbrowser')
      - Keypair / OAuth authentication

    IMPORTANT SECURITY RULE: Credentials and tokens are NEVER printed or logged.
    """
    sf_account = account or _get_config_val("SNOWFLAKE_ACCOUNT")
    sf_user = user or _get_config_val("SNOWFLAKE_USER")
    sf_authenticator = authenticator if authenticator is not None else _get_config_val("SNOWFLAKE_AUTHENTICATOR", "")
    sf_password = password if password is not None else _get_config_val("SNOWFLAKE_PASSWORD", "")
    sf_warehouse = warehouse or _get_config_val("SNOWFLAKE_WAREHOUSE", "PRAGATI_WH")
    sf_database = database or _get_config_val("SNOWFLAKE_DATABASE", "PRAGATI_AI_DB")
    sf_schema = schema or _get_config_val("SNOWFLAKE_SCHEMA", "CLEAN_DATA")
    sf_role = role or _get_config_val("SNOWFLAKE_ROLE", "")

    # Interactively prompt for password if missing and in terminal session
    if (
        not sf_password
        and not sf_authenticator
        and prompt_password_if_missing
        and sys.stdin.isatty()
    ):
        try:
            sf_password = getpass.getpass(f"Enter Snowflake password for user '{sf_user}': ")
        except Exception:
            pass

    conn_params = {
        "account": sf_account,
        "user": sf_user,
        "warehouse": sf_warehouse,
        "database": sf_database,
        "schema": sf_schema,
    }

    if sf_authenticator and sf_authenticator.strip():
        auth_val = sf_authenticator.strip()
        if auth_val.upper() != sf_account.strip().upper():
            conn_params["authenticator"] = auth_val
        else:
            logger.warning(
                f"Ignoring SNOWFLAKE_AUTHENTICATOR value because it equals SNOWFLAKE_ACCOUNT ('{sf_account}')."
            )
    if sf_password and sf_password.strip():
        conn_params["password"] = sf_password.strip()
    if sf_role and sf_role.strip():
        conn_params["role"] = sf_role.strip()

    logger.info(
        f"Initiating Snowflake connection: Account={sf_account}, User={sf_user}, "
        f"Warehouse={sf_warehouse}, Database={sf_database}, Schema={sf_schema}, "
        f"AuthMode={'externalbrowser' if conn_params.get('authenticator') == 'externalbrowser' else ('password' if 'password' in conn_params else 'default')}"
    )

    try:
        conn = snowflake.connector.connect(**conn_params)
        logger.info("✅ Snowflake connection established successfully.")
        return conn
    except SnowflakeError as se:
        logger.error(f"❌ Snowflake Error during connection: {se.msg} (Code: {se.errno})")
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error connecting to Snowflake: {str(e)}")
        raise
