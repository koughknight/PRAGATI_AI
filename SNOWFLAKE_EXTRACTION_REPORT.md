# PRAGATI AI – Snowflake Data Extraction Execution Report

**Date & Time**: 2026-08-14 15:05:00 IST  
**Environment**: `PRAGATI_AI_DB.CLEAN_DATA` on Warehouse `PRAGATI_WH`  
**User**: `THILAKRB007`  

---

## 1. Extraction Status: ❌ FAILED (Account Temporarily Locked)

Data extraction was attempted for all five clean tables:
- `CENSUS_POPULATION_AREA`
- `INDIA_CENSUS_2011`
- `NFHS_5_FACTSHEETS`
- `RS_SESSION_262`
- `TOURISM_STATISTICS`

The extraction process could not retrieve data rows because Snowflake rejected the connection at the authentication layer due to a **temporary account lock**.

---

## 2. Snowflake Diagnostic Output

- **Account Host**: `EJEUIFW-NK85801.snowflakecomputing.com:443`
- **User Identifier**: `THILAKRB007`
- **Snowflake Error Code**: `390102 (08001)`
- **Exact Snowflake Error Message**:
  > `390102 (08001): Failed to connect to DB: EJEUIFW-NK85801.snowflakecomputing.com:443. Your user account has been temporarily locked. Try again later or contact your account administrator for assistance. For more information about this error, go to https://community.snowflake.com/s/error-your-user-login-has-been-locked.`

---

## 3. Root Cause Analysis

Snowflake security policies enforce an automated temporary lock on user accounts when multiple invalid authentication requests occur within a short time window.

Because the account `THILAKRB007` is currently locked by Snowflake, any programmatic or web connection attempt using standard password authentication is blocked until the lock period expires.

---

## 4. Resolution Steps

To complete the data fetch once the account is accessible:

1. **Wait for Lock Expiry (Automatic)**:
   - Snowflake account locks typically auto-expire after 15 to 30 minutes.

2. **Manual Admin Unlock (Alternative)**:
   - If you have administrative access in Snowflake, run the following SQL command in Snowsight:
     ```sql
     ALTER USER THILAKRB007 UNSET IS_LOCKED;
     ```

3. **Re-run Data Extraction**:
   - Set your password in `.env`:
     ```env
     SNOWFLAKE_PASSWORD=your_password
     ```
   - Execute the test script:
     ```powershell
     python test_snowflake_extraction.py
     ```

---

## 5. Security & Safety Verification

- [x] No passwords, client secrets, or auth tokens are exposed in code files, logs, or reports.
- [x] `.env` is listed in `.gitignore` to prevent credential leaks.
