/*
 * PRAGATI AI - Advanced Analytics & Visual Intelligence Controller
 * Renders Section A (Executive Overview) and Section B (Dataset-Aware Visual Intelligence).
 */

let analyticsData = {};
let datasetsData = {};
let currentDataset = 'CENSUS_POPULATION_AREA';

document.addEventListener('DOMContentLoaded', () => {
  console.log('[PRAGATI AI] Advanced Analytics initialized');
  loadAnalyticsData();
  loadDatasetsTable();
});

async function loadAnalyticsData() {
  try {
    const [analyticsRes, datasetsRes] = await Promise.all([
      fetch('/api/analytics'),
      fetch('/api/datasets')
    ]);

    if (analyticsRes.ok) {
      analyticsData = await analyticsRes.json();
    }
    if (datasetsRes.ok) {
      datasetsData = await datasetsRes.json();
    }

    if (window.renderPlotlyCharts) {
      window.renderPlotlyCharts();
    }
  } catch (err) {
    console.warn('[PRAGATI AI] Analytics API fetch error:', err);
  }
}

window.selectAnalyticsDataset = function(datasetName) {
  console.log('[PRAGATI AI] Dataset selected:', datasetName);
  currentDataset = datasetName;

  // Update button active state
  const btns = document.querySelectorAll('#analytics-dataset-selector .dataset-btn');
  btns.forEach(btn => {
    if (btn.getAttribute('data-dataset') === datasetName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  renderDatasetVisualizations(datasetName);
};

window.renderPlotlyCharts = function(theme = null) {
  const currentTheme = theme || document.documentElement.getAttribute('data-theme') || 'light';
  const isDark = currentTheme === 'dark';

  const fontColor = isDark ? '#F5F0E6' : '#2C1810';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const paperBg = 'transparent';
  const plotBg = 'transparent';

  // Section A: Overview Charts
  console.log('[PRAGATI AI] Rendering overview charts');
  renderOverviewCharts(fontColor, gridColor, paperBg, plotBg);

  // Section B: Dataset-Aware Visual Intelligence
  renderDatasetVisualizations(currentDataset, theme);
};

/* ==================================================
   SECTION A: EXECUTIVE OVERVIEW CHARTS
   ================================================== */
function renderOverviewCharts(fontColor, gridColor, paperBg, plotBg) {
  // 1. Overview PCA Variance Chart
  try {
    const pcaContainer = document.getElementById('plotly-pca-chart');
    if (pcaContainer && analyticsData.pca && analyticsData.pca.length > 0) {
      const pcaList = analyticsData.pca;
      const labels = pcaList.map(item => `${item.dataset_name} (${item.component})`);
      const varRatio = pcaList.map(item => (parseFloat(item.explained_variance_ratio) || 0) * 100);
      const cumVar = pcaList.map(item => (parseFloat(item.cumulative_explained_variance) || 0) * 100);

      const trace1 = {
        x: labels,
        y: varRatio,
        name: 'Explained Variance (%)',
        type: 'bar',
        marker: { color: '#C85A32' }
      };

      const trace2 = {
        x: labels,
        y: cumVar,
        name: 'Cumulative Variance (%)',
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: '#FF9933', width: 3 },
        marker: { size: 8, color: '#FFC107' }
      };

      const layout = {
        paper_bgcolor: paperBg,
        plot_bgcolor: plotBg,
        font: { color: fontColor, family: 'Plus Jakarta Sans, sans-serif' },
        margin: { t: 30, b: 80, l: 50, r: 30 },
        xaxis: { tickangle: -30, gridcolor: gridColor },
        yaxis: { title: 'Variance Ratio (%)', gridcolor: gridColor },
        legend: { orientation: 'h', y: 1.15 }
      };

      Plotly.react('plotly-pca-chart', [trace1, trace2], layout, { responsive: true });
    }
  } catch (err) {
    console.error('[PRAGATI AI] Overview PCA chart error:', err);
  }

  // 2. Overview Clustering Distribution Chart
  try {
    const clusterContainer = document.getElementById('plotly-cluster-chart');
    if (clusterContainer && analyticsData.clustering && analyticsData.clustering.length > 0) {
      const clusters = analyticsData.clustering;
      const labels = clusters.map(item => `${item.dataset_name} - Cluster ${item.cluster_id}`);
      const values = clusters.map(item => parseFloat(item.percentage_of_data) || 0);

      const trace = {
        labels: labels,
        values: values,
        type: 'pie',
        hole: 0.4,
        marker: {
          colors: ['#3D2314', '#C85A32', '#FF9933', '#FFC107', '#5C3A21', '#8C7063']
        },
        textinfo: 'label+percent'
      };

      const layout = {
        paper_bgcolor: paperBg,
        plot_bgcolor: plotBg,
        font: { color: fontColor, family: 'Plus Jakarta Sans, sans-serif' },
        margin: { t: 20, b: 20, l: 20, r: 20 },
        showlegend: false
      };

      Plotly.react('plotly-cluster-chart', [trace], layout, { responsive: true });
    }
  } catch (err) {
    console.error('[PRAGATI AI] Overview cluster chart error:', err);
  }

  // 3. Overview YoY Tourism Trend Chart
  try {
    const trendContainer = document.getElementById('plotly-trend-chart');
    if (trendContainer && analyticsData.trends && analyticsData.trends.length > 0) {
      const grandTotals = analyticsData.trends.filter(item => item.region === 'Grand Total');
      const periods = grandTotals.map(item => item.period);
      const growth = grandTotals.map(item => parseFloat(item.percentage_growth) || 0);

      const trace = {
        x: periods,
        y: growth,
        type: 'bar',
        marker: {
          color: growth.map(g => g >= 0 ? '#2ECC71' : '#E74C3C')
        },
        text: growth.map(g => `${g}%`),
        textposition: 'auto'
      };

      const layout = {
        paper_bgcolor: paperBg,
        plot_bgcolor: plotBg,
        font: { color: fontColor, family: 'Plus Jakarta Sans, sans-serif' },
        margin: { t: 30, b: 40, l: 50, r: 30 },
        yaxis: { title: 'YoY Growth Rate (%)', gridcolor: gridColor },
        xaxis: { title: 'Time Period', gridcolor: gridColor }
      };

      Plotly.react('plotly-trend-chart', [trace], layout, { responsive: true });
    }
  } catch (err) {
    console.error('[PRAGATI AI] Overview trend chart error:', err);
  }
}

/* ==================================================
   SECTION B: DATASET-AWARE VISUAL INTELLIGENCE
   ================================================== */
function renderDatasetVisualizations(datasetName, theme = null) {
  const currentTheme = theme || document.documentElement.getAttribute('data-theme') || 'light';
  const isDark = currentTheme === 'dark';

  const fontColor = isDark ? '#F5F0E6' : '#2C1810';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const paperBg = 'transparent';
  const plotBg = 'transparent';

  // Update Dataset Badges
  ['badge-cluster-dataset', 'badge-pca-dataset', 'badge-correlation-dataset', 'badge-outlier-dataset', 'badge-trend-dataset'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = datasetName;
  });

  // 1. UPDATE DATA-AWARE KPI STRIP
  updateKpiStrip(datasetName);

  // 2. K-MEANS CLUSTER INTELLIGENCE
  try {
    console.log('[PRAGATI AI] Rendering cluster intelligence');
    renderClusterIntelligence(datasetName, fontColor, gridColor, paperBg, plotBg);
  } catch (e) {
    console.error('[PRAGATI AI] Cluster intelligence error:', e);
  }

  // 3. PCA INTELLIGENCE
  try {
    console.log('[PRAGATI AI] Rendering PCA intelligence');
    renderPcaIntelligence(datasetName, fontColor, gridColor, paperBg, plotBg);
  } catch (e) {
    console.error('[PRAGATI AI] PCA intelligence error:', e);
  }

  // 4. CORRELATION INTELLIGENCE
  try {
    console.log('[PRAGATI AI] Rendering correlation intelligence');
    renderCorrelationIntelligence(datasetName, fontColor, gridColor, paperBg, plotBg, isDark);
  } catch (e) {
    console.error('[PRAGATI AI] Correlation intelligence error:', e);
  }

  // 5. OUTLIER INTELLIGENCE
  try {
    console.log('[PRAGATI AI] Rendering outlier intelligence');
    renderOutlierIntelligence(datasetName, fontColor, gridColor, paperBg, plotBg);
  } catch (e) {
    console.error('[PRAGATI AI] Outlier intelligence error:', e);
  }

  // 6. TEMPORAL TREND INTELLIGENCE
  try {
    console.log('[PRAGATI AI] Rendering temporal intelligence');
    renderTrendIntelligence(datasetName, fontColor, gridColor, paperBg, plotBg);
  } catch (e) {
    console.error('[PRAGATI AI] Temporal intelligence error:', e);
  }
}

/* 1. DATA-AWARE KPI STRIP VALUES FROM REAL API RESPONSES */
function updateKpiStrip(datasetName) {
  const summaryList = (datasetsData && datasetsData.summary) || [];
  const dsSummary = summaryList.find(s => s.dataset_name === datasetName) || {};

  const recEl = document.getElementById('vi-kpi-records');
  const featEl = document.getElementById('vi-kpi-features');
  const numFeatEl = document.getElementById('vi-kpi-num-features');
  const outEl = document.getElementById('vi-kpi-outliers');
  const clusEl = document.getElementById('vi-kpi-clusters');
  const pcaVarEl = document.getElementById('vi-kpi-pca-var');
  const corrEl = document.getElementById('vi-kpi-max-corr');

  if (recEl) recEl.textContent = dsSummary.total_rows != null ? dsSummary.total_rows.toLocaleString() : 'N/A';
  if (featEl) featEl.textContent = dsSummary.total_cols != null ? dsSummary.total_cols.toLocaleString() : 'N/A';
  if (numFeatEl) numFeatEl.textContent = dsSummary.numeric_cols_count != null ? dsSummary.numeric_cols_count.toLocaleString() : 'N/A';

  // Outliers
  const datasetOutliers = (analyticsData.outliers || []).filter(o => o.dataset_name === datasetName);
  console.log('[PRAGATI AI] Outlier records:', datasetOutliers.length);
  if (datasetOutliers.length > 0) {
    const totalOutliers = datasetOutliers.reduce((sum, item) => sum + (parseInt(item.outlier_count) || 0), 0);
    if (outEl) outEl.textContent = totalOutliers.toLocaleString();
  } else {
    if (outEl) outEl.textContent = 'N/A';
  }

  // Clusters
  const datasetClusters = (analyticsData.clustering || []).filter(c => c.dataset_name === datasetName);
  console.log('[PRAGATI AI] Clustering records:', datasetClusters.length);
  if (datasetClusters.length > 0) {
    if (clusEl) clusEl.textContent = datasetClusters[0].selected_k || datasetClusters.length;
  } else {
    if (clusEl) clusEl.textContent = 'N/A';
  }

  // PCA Variance
  const datasetPca = (analyticsData.pca || []).filter(p => p.dataset_name === datasetName);
  console.log('[PRAGATI AI] PCA records:', datasetPca.length);
  if (datasetPca.length > 0) {
    const maxCum = Math.max(...datasetPca.map(p => parseFloat(p.cumulative_explained_variance) || 0));
    if (pcaVarEl) pcaVarEl.textContent = (maxCum * 100).toFixed(1) + '%';
  } else {
    if (pcaVarEl) pcaVarEl.textContent = 'N/A';
  }

  // Max Correlation
  const datasetCorr = (analyticsData.correlation || []).filter(c => c.dataset_name === datasetName && c.feature_1 !== c.feature_2);
  console.log('[PRAGATI AI] Correlation records:', datasetCorr.length);
  if (datasetCorr.length > 0) {
    const maxCorr = Math.max(...datasetCorr.map(c => Math.abs(parseFloat(c.pearson_correlation) || 0)));
    if (corrEl) corrEl.textContent = maxCorr.toFixed(2);
  } else {
    if (corrEl) corrEl.textContent = 'N/A';
  }
}

/* 2. K-MEANS CLUSTER INTELLIGENCE */
function renderClusterIntelligence(datasetName, fontColor, gridColor, paperBg, plotBg) {
  const container = document.getElementById('container-cluster-intelligence');
  const unavailable = document.getElementById('unavailable-cluster');

  const clusters = (analyticsData.clustering || []).filter(c => c.dataset_name === datasetName);

  if (!clusters || clusters.length === 0) {
    if (container) container.style.display = 'none';
    if (unavailable) unavailable.style.display = 'flex';
    return;
  }

  if (container) container.style.display = 'block';
  if (unavailable) unavailable.style.display = 'none';

  // Populate Cluster KPI Boxes
  const kVal = clusters[0].selected_k || clusters.length;
  const silhouette = clusters[0].silhouette_score ? parseFloat(clusters[0].silhouette_score).toFixed(4) : 'N/A';
  
  const sortedByCount = [...clusters].sort((a, b) => (b.cluster_size || 0) - (a.cluster_size || 0));
  const largest = sortedByCount[0] ? `Cluster ${sortedByCount[0].cluster_id} (${(sortedByCount[0].percentage_of_data || 0)}%)` : 'N/A';
  const smallest = sortedByCount[sortedByCount.length - 1] ? `Cluster ${sortedByCount[sortedByCount.length - 1].cluster_id} (${(sortedByCount[sortedByCount.length - 1].percentage_of_data || 0)}%)` : 'N/A';

  const kEl = document.getElementById('ckpi-k');
  const silEl = document.getElementById('ckpi-silhouette');
  const lgEl = document.getElementById('ckpi-largest');
  const smEl = document.getElementById('ckpi-smallest');
  const insightEl = document.getElementById('cluster-insight-text');

  if (kEl) kEl.textContent = kVal;
  if (silEl) silEl.textContent = silhouette;
  if (lgEl) lgEl.textContent = largest;
  if (smEl) smEl.textContent = smallest;

  if (insightEl && sortedByCount[0]) {
    insightEl.textContent = `Cluster ${sortedByCount[0].cluster_id} contains the largest share of observations (${sortedByCount[0].percentage_of_data}%), forming the core statistical grouping for ${datasetName}.`;
  }

  // Donut Chart
  const labels = clusters.map(c => `Cluster ${c.cluster_id}`);
  const values = clusters.map(c => c.cluster_size || 0);

  const traceDonut = {
    labels: labels,
    values: values,
    type: 'pie',
    hole: 0.45,
    marker: {
      colors: ['#C85A32', '#FF9933', '#FFC107', '#3D2314', '#5C3A21', '#8C7063']
    },
    textinfo: 'label+percent'
  };

  const layoutDonut = {
    paper_bgcolor: paperBg,
    plot_bgcolor: plotBg,
    font: { color: fontColor, family: 'Plus Jakarta Sans, sans-serif' },
    margin: { t: 20, b: 20, l: 20, r: 20 },
    showlegend: false
  };

  Plotly.react('plotly-cluster-dist', [traceDonut], layoutDonut, { responsive: true });

  // Profile Bar Breakdown Chart
  const pData = clusters.map(c => parseFloat(c.percentage_of_data) || 0);
  const traceProfile = {
    x: labels,
    y: pData,
    type: 'bar',
    marker: { color: '#C85A32' },
    text: pData.map(p => `${p}%`),
    textposition: 'auto'
  };

  const layoutProfile = {
    paper_bgcolor: paperBg,
    plot_bgcolor: plotBg,
    font: { color: fontColor, family: 'Plus Jakarta Sans, sans-serif' },
    margin: { t: 20, b: 40, l: 50, r: 20 },
    yaxis: { title: '% of Dataset', gridcolor: gridColor },
    xaxis: { gridcolor: gridColor }
  };

  Plotly.react('plotly-cluster-profile', [traceProfile], layoutProfile, { responsive: true });
}

/* 3. PCA INTELLIGENCE */
function renderPcaIntelligence(datasetName, fontColor, gridColor, paperBg, plotBg) {
  const container = document.getElementById('container-pca-intelligence');
  const unavailable = document.getElementById('unavailable-pca');

  const pcaList = (analyticsData.pca || []).filter(p => p.dataset_name === datasetName);

  if (!pcaList || pcaList.length === 0) {
    if (container) container.style.display = 'none';
    if (unavailable) unavailable.style.display = 'flex';
    return;
  }

  if (container) container.style.display = 'block';
  if (unavailable) unavailable.style.display = 'none';

  // 3A. PCA Scatter (PC1 vs PC2)
  const pc1 = pcaList.find(p => p.component === 'PC1') || pcaList[0] || {};
  const pc2 = pcaList.find(p => p.component === 'PC2') || pcaList[1] || {};

  const pc1Var = (parseFloat(pc1.explained_variance_ratio) || 0) * 100;
  const pc2Var = (parseFloat(pc2.explained_variance_ratio) || 0) * 100;

  const traceScatter = {
    x: [pc1Var],
    y: [pc2Var],
    mode: 'markers+text',
    type: 'scatter',
    text: [`PC1 vs PC2 (${datasetName})`],
    textposition: 'top center',
    marker: { size: 24, color: '#C85A32' }
  };

  const layoutScatter = {
    paper_bgcolor: paperBg,
    plot_bgcolor: plotBg,
    font: { color: fontColor, family: 'Plus Jakarta Sans, sans-serif' },
    margin: { t: 30, b: 40, l: 50, r: 30 },
    xaxis: { title: `PC1 Explained Var (${pc1Var.toFixed(1)}%)`, gridcolor: gridColor },
    yaxis: { title: `PC2 Explained Var (${pc2Var.toFixed(1)}%)`, gridcolor: gridColor }
  };

  Plotly.react('plotly-pca-scatter', [traceScatter], layoutScatter, { responsive: true });

  // 3B. Explained Variance Bar + Line
  const components = pcaList.map(p => p.component);
  const varRatios = pcaList.map(p => (parseFloat(p.explained_variance_ratio) || 0) * 100);
  const cumRatios = pcaList.map(p => (parseFloat(p.cumulative_explained_variance) || 0) * 100);

  const traceVarBar = {
    x: components,
    y: varRatios,
    name: 'Explained Var (%)',
    type: 'bar',
    marker: { color: '#C85A32' }
  };

  const traceCumLine = {
    x: components,
    y: cumRatios,
    name: 'Cumulative Var (%)',
    type: 'scatter',
    mode: 'lines+markers',
    line: { color: '#FF9933', width: 3 },
    marker: { size: 8, color: '#FFC107' }
  };

  const layoutVariance = {
    paper_bgcolor: paperBg,
    plot_bgcolor: plotBg,
    font: { color: fontColor, family: 'Plus Jakarta Sans, sans-serif' },
    margin: { t: 30, b: 40, l: 50, r: 30 },
    yaxis: { title: 'Variance (%)', gridcolor: gridColor },
    legend: { orientation: 'h', y: 1.15 }
  };

  Plotly.react('plotly-pca-variance', [traceVarBar, traceCumLine], layoutVariance, { responsive: true });

  // 3C. Top Feature Contributions
  const labels = pcaList.map(p => `${p.component}: ${p.top_contributing_feature || 'N/A'}`);
  const loadings = pcaList.map(p => Math.abs(parseFloat(p.top_feature_loading) || 0));

  const traceLoadings = {
    y: labels,
    x: loadings,
    type: 'bar',
    orientation: 'h',
    marker: { color: '#FF9933' }
  };

  const layoutLoadings = {
    paper_bgcolor: paperBg,
    plot_bgcolor: plotBg,
    font: { color: fontColor, family: 'Plus Jakarta Sans, sans-serif' },
    margin: { t: 20, b: 40, l: 120, r: 20 },
    xaxis: { title: 'Absolute Loading Value', gridcolor: gridColor }
  };

  Plotly.react('plotly-pca-loadings', [traceLoadings], layoutLoadings, { responsive: true });
}

/* 4. CORRELATION INTELLIGENCE */
function renderCorrelationIntelligence(datasetName, fontColor, gridColor, paperBg, plotBg, isDark) {
  const container = document.getElementById('container-correlation-intelligence');
  const unavailable = document.getElementById('unavailable-correlation');

  const correlations = (analyticsData.correlation || []).filter(c => c.dataset_name === datasetName);

  if (!correlations || correlations.length === 0) {
    if (container) container.style.display = 'none';
    if (unavailable) unavailable.style.display = 'flex';
    return;
  }

  if (container) container.style.display = 'block';
  if (unavailable) unavailable.style.display = 'none';

  // Compute Strongest Positive and Negative Relationships
  const nonSelfCorr = correlations.filter(c => c.feature_1 !== c.feature_2);
  const posEl = document.getElementById('corr-strongest-pos');
  const negEl = document.getElementById('corr-strongest-neg');

  if (nonSelfCorr.length > 0) {
    const sortedPos = [...nonSelfCorr].sort((a, b) => (parseFloat(b.pearson_correlation) || 0) - (parseFloat(a.pearson_correlation) || 0));
    const sortedNeg = [...nonSelfCorr].sort((a, b) => (parseFloat(a.pearson_correlation) || 0) - (parseFloat(b.pearson_correlation) || 0));

    const topPos = sortedPos[0];
    const topNeg = sortedNeg[0];

    if (posEl && topPos && parseFloat(topPos.pearson_correlation) > 0) {
      posEl.textContent = `${topPos.feature_1} ↔ ${topPos.feature_2} (+${parseFloat(topPos.pearson_correlation).toFixed(2)})`;
    } else if (posEl) {
      posEl.textContent = 'N/A';
    }

    if (negEl && topNeg && parseFloat(topNeg.pearson_correlation) < 0) {
      negEl.textContent = `${topNeg.feature_1} ↔ ${topNeg.feature_2} (${parseFloat(topNeg.pearson_correlation).toFixed(2)})`;
    } else if (negEl) {
      negEl.textContent = 'N/A';
    }
  }

  // Extract unique feature names
  const featureSet = new Set();
  correlations.forEach(c => {
    if (c.feature_1) featureSet.add(c.feature_1);
    if (c.feature_2) featureSet.add(c.feature_2);
  });

  let features = Array.from(featureSet);
  if (features.length > 10) {
    features = features.slice(0, 10);
  }

  // Construct 2D correlation z-matrix
  const zMatrix = [];
  features.forEach(f1 => {
    const row = [];
    features.forEach(f2 => {
      if (f1 === f2) {
        row.push(1.0);
      } else {
        const item = correlations.find(c => (c.feature_1 === f1 && c.feature_2 === f2) || (c.feature_1 === f2 && c.feature_2 === f1));
        row.push(item ? parseFloat(item.pearson_correlation) || 0 : 0);
      }
    });
    zMatrix.push(row);
  });

  const shortLabels = features.map(f => f.length > 18 ? f.slice(0, 15) + '...' : f);

  const traceHeatmap = {
    z: zMatrix,
    x: shortLabels,
    y: shortLabels,
    type: 'heatmap',
    colorscale: 'YlOrRd',
    hoverongaps: false
  };

  const layoutHeatmap = {
    paper_bgcolor: paperBg,
    plot_bgcolor: plotBg,
    font: { color: fontColor, family: 'Plus Jakarta Sans, sans-serif' },
    margin: { t: 20, b: 80, l: 120, r: 20 },
    xaxis: { tickangle: -35 }
  };

  Plotly.react('plotly-correlation-heatmap', [traceHeatmap], layoutHeatmap, { responsive: true });
}

/* 5. OUTLIER INTELLIGENCE */
function renderOutlierIntelligence(datasetName, fontColor, gridColor, paperBg, plotBg) {
  const container = document.getElementById('container-outlier-intelligence');
  const unavailable = document.getElementById('unavailable-outlier');

  const outliersList = (analyticsData.outliers || []).filter(o => o.dataset_name === datasetName);

  if (!outliersList || outliersList.length === 0) {
    if (container) container.style.display = 'none';
    if (unavailable) unavailable.style.display = 'flex';
    return;
  }

  if (container) container.style.display = 'block';
  if (unavailable) unavailable.style.display = 'none';

  // Box Plot for Top Numerical Features
  const topCols = [...outliersList]
    .sort((a, b) => (parseInt(b.outlier_count) || 0) - (parseInt(a.outlier_count) || 0))
    .slice(0, 5);

  const boxTraces = topCols.map(col => {
    const q1 = parseFloat(col.q1) || 0;
    const q3 = parseFloat(col.q3) || 0;
    const iqr = parseFloat(col.iqr) || 0;
    const lower = parseFloat(col.lower_bound) || 0;
    const upper = parseFloat(col.upper_bound) || 0;
    const median = q1 + (iqr / 2);

    const shortName = col.column_name.length > 15 ? col.column_name.slice(0, 12) + '...' : col.column_name;

    return {
      type: 'box',
      name: shortName,
      q1: [q1],
      median: [median],
      q3: [q3],
      lowerfence: [lower],
      upperfence: [upper],
      marker: { color: '#C85A32' }
    };
  });

  const layoutBox = {
    paper_bgcolor: paperBg,
    plot_bgcolor: plotBg,
    font: { color: fontColor, family: 'Plus Jakarta Sans, sans-serif' },
    margin: { t: 20, b: 50, l: 50, r: 20 },
    showlegend: false,
    xaxis: { gridcolor: gridColor },
    yaxis: { gridcolor: gridColor }
  };

  Plotly.react('plotly-outlier-boxplot', boxTraces, layoutBox, { responsive: true });

  // Normal vs Outlier Donut
  const summaryList = (datasetsData && datasetsData.summary) || [];
  const dsSummary = summaryList.find(s => s.dataset_name === datasetName) || {};
  const totalRecs = dsSummary.total_rows || (outliersList[0] ? parseInt(outliersList[0].total_records) || 100 : 100);

  const totalOutliers = outliersList.reduce((sum, o) => sum + (parseInt(o.outlier_count) || 0), 0);
  const normalCount = Math.max(0, totalRecs - totalOutliers);

  const traceDonut = {
    labels: ['Normal Observations', 'Outlier Observations'],
    values: [normalCount, totalOutliers],
    type: 'pie',
    hole: 0.5,
    marker: {
      colors: ['#2ECC71', '#C85A32']
    },
    textinfo: 'label+percent'
  };

  const layoutDonut = {
    paper_bgcolor: paperBg,
    plot_bgcolor: plotBg,
    font: { color: fontColor, family: 'Plus Jakarta Sans, sans-serif' },
    margin: { t: 20, b: 20, l: 20, r: 20 },
    showlegend: false
  };

  Plotly.react('plotly-outlier-donut', [traceDonut], layoutDonut, { responsive: true });
}

/* 6. TEMPORAL TREND INTELLIGENCE */
function renderTrendIntelligence(datasetName, fontColor, gridColor, paperBg, plotBg) {
  const card = document.getElementById('card-temporal-trend-intelligence');
  const container = document.getElementById('container-trend-intelligence');

  const trends = (analyticsData.trends || []).filter(t => t.dataset_name === datasetName);

  if (!trends || trends.length === 0 || datasetName !== 'TOURISM_STATISTICS') {
    if (card) card.style.display = 'none';
    return;
  }

  if (card) card.style.display = 'block';
  if (container) container.style.display = 'block';

  const grandTotals = trends.filter(t => t.region === 'Grand Total');
  const periods = grandTotals.map(t => t.period);
  const growths = grandTotals.map(t => parseFloat(t.percentage_growth) || 0);

  const traceTrend = {
    x: periods,
    y: growths,
    type: 'bar',
    marker: {
      color: growths.map(g => g >= 0 ? '#2ECC71' : '#E74C3C')
    },
    text: growths.map(g => `${g}%`),
    textposition: 'auto'
  };

  const layoutTrend = {
    paper_bgcolor: paperBg,
    plot_bgcolor: plotBg,
    font: { color: fontColor, family: 'Plus Jakarta Sans, sans-serif' },
    margin: { t: 20, b: 40, l: 50, r: 20 },
    yaxis: { title: 'YoY Growth Rate (%)', gridcolor: gridColor },
    xaxis: { title: 'Year-over-Year Period', gridcolor: gridColor }
  };

  Plotly.react('plotly-trend-analysis-chart', [traceTrend], layoutTrend, { responsive: true });
}

/* Load Dataset Explorer Summary Table */
async function loadDatasetsTable() {
  const tbody = document.querySelector('#dataset-summary-table tbody');
  if (!tbody) return;

  try {
    const res = await fetch('/api/datasets');
    if (!res.ok) return;
    const data = await res.json();
    const summaryList = data.summary || [];

    if (summaryList.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7">No datasets discovered.</td></tr>';
      return;
    }

    tbody.innerHTML = summaryList.map(item => `
      <tr>
        <td style="font-weight: 700; color: var(--brand-terracotta);">${item.dataset_name}</td>
        <td>${(item.total_rows || 0).toLocaleString()}</td>
        <td>${item.total_cols || 0}</td>
        <td>${item.numeric_cols_count || 0}</td>
        <td>${item.categorical_cols_count || 0}</td>
        <td>${item.total_missing_cells || 0} (${item.missing_cell_percentage || 0}%)</td>
        <td>${item.memory_usage_mb ? item.memory_usage_mb + ' MB' : '0.1 MB'}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.warn('[PRAGATI AI] Dataset summary table error:', err);
  }
}
