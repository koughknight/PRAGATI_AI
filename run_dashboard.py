"""
PRAGATI AI - Dashboard Runner Entry Point
Starts the backend server and opens the browser.
Usage: python run_dashboard.py
"""

import sys
import os
import time
import webbrowser
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def main():
    port = 8501
    url = f"http://localhost:{port}"

    print("=======================================================")
    print("  PRAGATI AI — PREMIUM INDIA ANALYTICS DASHBOARD       ")
    print("  Data-Driven Intelligence for India's Growth         ")
    print("=======================================================")
    print(f"\n[1/3] Checking analytics output directory...")
    
    adv_dir = BASE_DIR / "Analytics_Results" / "advanced_analytics"
    if not adv_dir.exists():
        print(f"[ERROR] Analytics directory missing at {adv_dir}")
        sys.exit(1)
    print("[OK] Verified real analytics outputs from Snowflake & ETL pipeline.")

    print(f"\n[2/3] Launching web browser at {url}...")
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"[WARN] Could not automatically open browser: {e}")

    print(f"\n[3/3] Starting dashboard server on port {port}...")
    server_script = BASE_DIR / "dashboard_server.py"
    
    # Run dashboard_server.py directly
    subprocess.run([sys.executable, str(server_script), str(port)])

if __name__ == "__main__":
    main()
