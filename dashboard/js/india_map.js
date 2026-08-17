/*
 * PRAGATI AI - India Intelligence Map Script
 * Renders an interactive map of Indian States & Union Territories with indicator pickers and hover cards.
 */

let stateMapData = {};
let currentMetric = 'population';

document.addEventListener('DOMContentLoaded', () => {
  initIndiaMap();
  initMapControls();
});

async function initIndiaMap() {
  const mapContainer = document.getElementById('india-map-container');
  if (!mapContainer) return;

  // Initialize Leaflet map centered over India
  window.indiaMap = L.map('india-map-container', {
    center: [22.5937, 78.9629],
    zoom: 5,
    zoomControl: true,
    scrollWheelZoom: false
  });

  // Dark/Light tile layer
  const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  L.tileLayer(tileUrl, {
    attribution: 'PRAGATI AI India Analytics | &copy; OpenStreetMap',
    maxZoom: 10,
    minZoom: 4
  }).addTo(window.indiaMap);

  // Fetch state aggregated data from API
  try {
    const res = await fetch('/api/india-map');
    if (res.ok) {
      const data = await res.json();
      stateMapData = data.states || {};
    }
  } catch (err) {
    console.warn('Map API fallback:', err);
  }

  // Render State Markers / Choropleth Nodes
  renderStateNodes();
}

const STATE_COORDINATES = {
  "JAMMU AND KASHMIR": [33.7782, 76.5762],
  "LADAKH": [34.1526, 77.5771],
  "HIMACHAL PRADESH": [31.1048, 77.1734],
  "PUNJAB": [31.1471, 75.3412],
  "UTTARAKHAND": [30.0668, 79.0193],
  "HARYANA": [29.0588, 76.0856],
  "DELHI": [28.7041, 77.1025],
  "RAJASTHAN": [27.0238, 74.2179],
  "UTTAR PRADESH": [26.8467, 80.9462],
  "BIHAR": [25.0961, 85.3131],
  "SIKKIM": [27.5330, 88.5122],
  "ARUNACHAL PRADESH": [28.2180, 94.7278],
  "NAGALAND": [26.1584, 94.5624],
  "MANIPUR": [24.6637, 93.9063],
  "MIZORAM": [23.1645, 92.9376],
  "TRIPURA": [23.9408, 91.9882],
  "MEGHALAYA": [25.4670, 91.3662],
  "ASSAM": [26.2006, 92.9376],
  "WEST BENGAL": [22.9868, 87.8550],
  "JHARKHAND": [23.6102, 85.2799],
  "ODISHA": [20.9517, 85.0985],
  "CHHATTISGARH": [21.2787, 81.8661],
  "MADHYA PRADESH": [22.9734, 78.6569],
  "GUJARAT": [22.2587, 71.1924],
  "MAHARASHTRA": [19.7515, 75.7139],
  "ANDHRA PRADESH": [15.9129, 79.7400],
  "TELANGANA": [18.1124, 79.0193],
  "KARNATAKA": [15.3173, 75.7139],
  "GOA": [15.2993, 74.1240],
  "KERALA": [10.8505, 76.2711],
  "TAMIL NADU": [11.1271, 78.6569],
  "PUDUCHERRY": [11.9416, 79.8083],
  "ANDAMAN AND NICOBAR ISLANDS": [11.7401, 92.6586]
};

function renderStateNodes() {
  if (!window.indiaMap) return;

  // Clear existing markers
  if (window.mapMarkers) {
    window.mapMarkers.forEach(m => m.remove());
  }
  window.mapMarkers = [];

  Object.keys(STATE_COORDINATES).forEach(stateName => {
    const coords = STATE_COORDINATES[stateName];
    const data = stateMapData[stateName] || {};

    const marker = L.circleMarker(coords, {
      radius: getMetricRadius(data, currentMetric),
      fillColor: getMetricColor(data, currentMetric),
      color: '#3D2314',
      weight: 1.5,
      opacity: 0.9,
      fillOpacity: 0.75
    }).addTo(window.indiaMap);

    marker.on('mouseover', () => {
      marker.setStyle({ weight: 3, fillOpacity: 0.95 });
      updateStateDetailPanel(stateName, data);
    });

    marker.on('mouseout', () => {
      marker.setStyle({ weight: 1.5, fillOpacity: 0.75 });
    });

    marker.on('click', () => {
      updateStateDetailPanel(stateName, data);
    });

    window.mapMarkers.push(marker);
  });

  // Select default state (e.g. MAHARASHTRA or UTTAR PRADESH)
  const defaultState = stateMapData["MAHARASHTRA"] ? "MAHARASHTRA" : Object.keys(stateMapData)[0];
  if (defaultState) {
    updateStateDetailPanel(defaultState, stateMapData[defaultState]);
  }
}

function getMetricRadius(data, metric) {
  if (!data || Object.keys(data).length === 0) return 8;
  if (metric === 'population') {
    const pop = data.population || 0;
    return Math.max(8, Math.min(28, Math.sqrt(pop) / 3000));
  }
  return 12;
}

function getMetricColor(data, metric) {
  if (!data || Object.keys(data).length === 0) return '#8C7063';
  return '#C85A32'; // Terracotta theme
}

function initMapControls() {
  const buttons = document.querySelectorAll('.btn-indicator');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMetric = btn.getAttribute('data-metric');
      renderStateNodes();
    });
  });
}

function updateStateDetailPanel(stateName, data) {
  const panel = document.getElementById('state-detail-panel');
  if (!panel) return;

  if (!data || Object.keys(data).length === 0) {
    panel.innerHTML = `
      <h3 style="color: var(--brand-terracotta); margin-bottom: 8px;">${stateName}</h3>
      <div style="background: rgba(200, 90, 50, 0.1); padding: 12px; border-radius: 8px; color: var(--brand-terracotta); font-weight: 600;">
        <i class="fa-solid fa-circle-info"></i> Data unavailable for this state in selected indicator.
      </div>
    `;
    return;
  }

  const formatNum = (v) => v ? v.toLocaleString() : 'Data unavailable';
  const formatPct = (v) => (v !== null && v !== undefined) ? `${v}%` : 'Data unavailable';

  panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h3 style="font-size: 22px; color: var(--text-primary);">${stateName}</h3>
      ${data.population_rank ? `<span style="background: var(--gradient-accent); color:#fff; padding: 4px 12px; border-radius:12px; font-size:12px; font-weight:700;">Rank #${data.population_rank}</span>` : ''}
    </div>
    <div style="margin-bottom: 14px; font-size: 11px; color: var(--text-muted); font-weight: 600;">
      <i class="fa-solid fa-calendar-days"></i> Data Source: Census 2011 & NFHS-5 (2019–2021)
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
      <div style="background: var(--bg-secondary); padding: 14px; border-radius: 10px;">
        <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Total Population</div>
        <div style="font-size: 20px; font-weight: 800; color: var(--brand-terracotta);">${formatNum(data.population)}</div>
      </div>

      <div style="background: var(--bg-secondary); padding: 14px; border-radius: 10px;">
        <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Literacy Rate</div>
        <div style="font-size: 20px; font-weight: 800; color: var(--brand-saffron);">${formatPct(data.literacy_rate)}</div>
      </div>

      <div style="background: var(--bg-secondary); padding: 14px; border-radius: 10px;">
        <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Worker Ratio</div>
        <div style="font-size: 18px; font-weight: 700; color: var(--text-primary);">${formatPct(data.worker_ratio)}</div>
      </div>

      <div style="background: var(--bg-secondary); padding: 14px; border-radius: 10px;">
        <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Non-Agri Workers</div>
        <div style="font-size: 18px; font-weight: 700; color: var(--text-primary);">${formatPct(data.non_agri_worker_ratio)}</div>
      </div>

      <div style="background: var(--bg-secondary); padding: 14px; border-radius: 10px;">
        <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Health Insurance (NFHS-5)</div>
        <div style="font-size: 18px; font-weight: 700; color: var(--text-primary);">${formatPct(data.health_insurance_pct)}</div>
      </div>

      <div style="background: var(--bg-secondary); padding: 14px; border-radius: 10px;">
        <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Clean Cooking Fuel</div>
        <div style="font-size: 18px; font-weight: 700; color: var(--text-primary);">${formatPct(data.clean_fuel_pct)}</div>
      </div>
    </div>
  `;
}
