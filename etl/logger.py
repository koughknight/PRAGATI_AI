"""
PRAGATI AI Logging Module
Configures file and console logging for execution tracking.
"""

import logging
import sys
from datetime import datetime
from pathlib import Path


def setup_logger(log_dir: Path) -> tuple[logging.Logger, Path]:
    """
    Sets up dual logging to console and a timestamped file inside log_dir.
    Returns (logger, log_file_path).
    """
    log_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file_path = log_dir / f"etl_execution_{timestamp}.log"

    logger = logging.getLogger("PRAGATI_AI_ETL")
    logger.setLevel(logging.INFO)

    # Avoid duplicate handlers if setup_logger is called multiple times
    if logger.hasHandlers():
        logger.handlers.clear()

    # Formatter for log messages
    file_formatter = logging.Formatter(
        "%(asctime)s - [%(levelname)s] - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    console_formatter = logging.Formatter("%(message)s")

    # File Handler
    file_handler = logging.FileHandler(log_file_path, encoding="utf-8")
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)

    # Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    return logger, log_file_path
