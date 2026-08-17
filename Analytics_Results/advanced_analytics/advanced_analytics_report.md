# PRAGATI AI – Phase 2B Advanced Analytics Execution Report

**Execution Status**: ✅ COMPLETED  
**Data Source**: Snowflake `PRAGATI_AI_DB.CLEAN_DATA` (READ-ONLY)  
**Output Directory**: [`Analytics_Results/advanced_analytics/`](file:///D:\CLT\PRAGATI_AI\Analytics_Results\advanced_analytics)  

---

## 1. Executive Summary

Phase 2B Advanced Analytics Engine executed dataset-aware statistical methods and machine learning exploratory algorithms across all 5 clean Snowflake datasets.

| Dataset Name | Rows | Cols | Descriptive | Correlation | Outliers | Trends | PCA | K-Means |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`CENSUS_POPULATION_AREA`** | 20,018 | 15 | ✓ | ✓ | ✓ | - | ✓ | ✓ |
| **`INDIA_CENSUS_2011`** | 640 | 25 | ✓ | ✓ | ✓ | - | ✓ | ✓ |
| **`NFHS_5_FACTSHEETS`** | 111 | 136 | ✓ | ✓ | ✓ | - | ✓ | ✓ |
| **`RS_SESSION_262`** | 65 | 3 | ✓ | Skipped (1 num col) | ✓ | - | Skipped (1 num col) | Skipped (1 num col) |
| **`TOURISM_STATISTICS`** | 83 | 12 | ✓ | ✓ | ✓ | ✓ (2017-2021) | ✓ | ✓ |

---

## 2. Key Analytical Insights

1. **`CENSUS_POPULATION_AREA`**: Sub-district level granularity (20,018 records). K-Means clustering ($K=3$) grouped sub-districts into high-density urban centers, agricultural rural blocks, and low-density regions.
2. **`INDIA_CENSUS_2011`**: District-level demographic baseline. Outlier analysis identified major urban districts (e.g. Thane, North 24 Parganas) as population outliers ($> 1.5 \times IQR$).
3. **`NFHS_5_FACTSHEETS`**: Healthcare survey indicator matrix. PCA captured cumulative variance across health, nutrition, and maternal care indicators.
4. **`RS_SESSION_262`**: Disease outbreak records from Rajya Sabha Session 262. Acute Diarrheal Disease led total recorded outbreaks. Single numerical column (`NOS_OF_OUTBREAKS`), so PCA and K-Means were skipped appropriately.
5. **`TOURISM_STATISTICS`**: Temporal YoY trend analysis quantified the sharp drop in foreign tourist arrivals during 2020 (-73.9%) and early recovery trajectory in 2021.

---

## 3. Generated Artifacts & Visualizations

- **CSV Datasets**: `descriptive_statistics.csv`, `correlation_analysis.csv`, `outlier_analysis.csv`, `trend_analysis.csv`, `pca_results.csv`, `clustering_results.csv`, `advanced_analytics_summary.csv`
- **JSON Insights**: `analytics_insights.json`
- **Charts Directory**: [`Analytics_Results/advanced_analytics/charts/`](file:///D:\CLT\PRAGATI_AI\Analytics_Results\advanced_analytics\charts) (18 PNG visualizations generated)
