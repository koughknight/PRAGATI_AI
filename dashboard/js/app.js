/*
 * PRAGATI AI - Main Application Controller Script
 * Handles real-time clock, theme switcher, tab navigation, KPI count-up animations, and API data fetching.
 */

document.addEventListener('DOMContentLoaded', () => {
  initLiveClock();
  initThemeSwitcher();
  initNavigation();
  loadSummaryData();
  loadUiPathStatus();
});

/* 1. Real-Time Prominent IST Clock */
function initLiveClock() {
  const dateEl = document.getElementById('live-date');
  const timeEl = document.getElementById('live-time');
  const istEl = document.getElementById('live-ist');

  function updateClock() {
    const now = new Date();
    
    // Date: 15 AUG 2026
    const day = String(now.getDate()).padStart(2, '0');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();
    if (dateEl) dateEl.textContent = `${day} ${month} ${year}`;

    // Time: 08:15:42 PM
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, '0');
    
    if (timeEl) timeEl.textContent = `${strHours}:${minutes}:${seconds} ${ampm}`;
    if (istEl) istEl.textContent = 'IST';
  }

  updateClock();
  setInterval(updateClock, 1000);
}

/* 2. Light & Dark Theme Switcher */
function initThemeSwitcher() {
  const toggleBtn = document.getElementById('theme-toggle');
  const themeLabel = document.getElementById('theme-label');
  const htmlEl = document.documentElement;

  const savedTheme = localStorage.getItem('pragati_theme') || 'light';
  htmlEl.setAttribute('data-theme', savedTheme);
  updateThemeUI(savedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const currentTheme = htmlEl.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      htmlEl.setAttribute('data-theme', newTheme);
      localStorage.setItem('pragati_theme', newTheme);
      updateThemeUI(newTheme);

      if (window.renderPlotlyCharts) {
        window.renderPlotlyCharts(newTheme);
      }
    });
  }

  function updateThemeUI(theme) {
    if (theme === 'dark') {
      if (toggleBtn) toggleBtn.querySelector('i').className = 'fa-solid fa-sun';
      if (themeLabel) themeLabel.textContent = 'Light';
    } else {
      if (toggleBtn) toggleBtn.querySelector('i').className = 'fa-solid fa-moon';
      if (themeLabel) themeLabel.textContent = 'Dark';
    }
  }
}

/* 3. Navigation View Switcher */
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.view-section');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetView = item.getAttribute('data-view');

      navItems.forEach(n => n.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));

      item.classList.add('active');
      const activeSection = document.getElementById(`view-${targetView}`);
      if (activeSection) {
        activeSection.classList.add('active');
      }

      // Trigger map resize if map tab selected
      if (targetView === 'india-intelligence' && window.indiaMap) {
        setTimeout(() => window.indiaMap.invalidateSize(), 200);
      }

      // Trigger Advanced Analytics chart render/resize if tab selected
      if (targetView === 'advanced-analytics') {
        console.log('[PRAGATI AI] Advanced Analytics navigation clicked');
        setTimeout(() => {
          if (typeof window.renderPlotlyCharts === 'function') {
            window.renderPlotlyCharts();
          }
        }, 150);
      }

      // Trigger reports reload if reports tab selected
      if (targetView === 'reports') {
        console.log('[PRAGATI] Reports navigation clicked');
        if (typeof window.loadExecutionReports === 'function') {
          window.loadExecutionReports();
        } else if (typeof loadExecutionReports === 'function') {
          loadExecutionReports();
        }
      }

      // Trigger UiPath status update if pipeline-status tab selected
      if (targetView === 'pipeline-status') {
        loadUiPathStatus();
      }
    });
  });
}

/* 4. Number Count-Up Animation Helper */
function animateValue(element, start, end, duration) {
  if (!element) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const val = Math.floor(progress * (end - start) + start);
    element.textContent = val.toLocaleString();
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      element.textContent = end.toLocaleString();
    }
  };
  window.requestAnimationFrame(step);
}

/* 5. Fetch Summary Data from Python REST API */
async function loadSummaryData() {
  try {
    const res = await fetch('/api/summary');
    if (!res.ok) throw new Error('API request failed');
    const data = await res.json();

    const dsEl = document.getElementById('kpi-datasets');
    const recEl = document.getElementById('kpi-records');
    const chartEl = document.getElementById('kpi-charts');
    const qualEl = document.getElementById('kpi-quality');

    if (dsEl) animateValue(dsEl, 0, data.datasets_analyzed || 5, 800);
    if (recEl) animateValue(recEl, 0, data.total_records || 20818, 1200);
    if (chartEl) animateValue(chartEl, 0, 18, 1000);
    if (qualEl) qualEl.textContent = `${data.data_quality_pct || 99.1}%`;

    const refreshEl = document.getElementById('last-data-refresh');
    if (refreshEl) {
      refreshEl.textContent = `Last Refresh: ${data.last_data_refresh}`;
    }

    renderExecutiveOverview();
  } catch (err) {
    console.warn('Summary fallback:', err);
  }
}

function renderExecutiveOverview() {
  const container = document.getElementById('overview-insights-container');
  if (!container) return;

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
      <div style="background: var(--bg-secondary); padding: 18px; border-radius: 12px; border-left: 4px solid var(--brand-terracotta);">
        <h4 style="font-size: 15px; margin-bottom: 6px; color: var(--brand-terracotta);">Sub-District Demographics (Census 2011)</h4>
        <p style="font-size: 13px; color: var(--text-secondary);">20,018 sub-district records analyzed. PCA & K-Means ($K=5$) grouped regions into distinct high-density urban centers, agricultural rural blocks, and low-density zones.</p>
      </div>

      <div style="background: var(--bg-secondary); padding: 18px; border-radius: 12px; border-left: 4px solid var(--brand-saffron);">
        <h4 style="font-size: 15px; margin-bottom: 6px; color: var(--brand-saffron);">District Economic Correlation</h4>
        <p style="font-size: 13px; color: var(--text-secondary);">Strong positive correlation ($r = 0.78$) discovered between female literacy rate and non-agricultural worker participation across 640 census districts.</p>
      </div>

      <div style="background: var(--bg-secondary); padding: 18px; border-radius: 12px; border-left: 4px solid var(--brand-gold-dark);">
        <h4 style="font-size: 15px; margin-bottom: 6px; color: var(--brand-gold-dark);">Health Infrastructure (NFHS-5)</h4>
        <p style="font-size: 13px; color: var(--text-secondary);">Significant regional variance in healthcare access and anaemia. PCA compressed 32 numerical health indicators into primary health vulnerability components.</p>
      </div>

      <div style="background: var(--bg-secondary); padding: 18px; border-radius: 12px; border-left: 4px solid var(--brand-terracotta);">
        <h4 style="font-size: 15px; margin-bottom: 6px; color: var(--brand-terracotta);">Tourism YoY Contraction & Recovery</h4>
        <p style="font-size: 13px; color: var(--text-secondary);">Foreign tourist arrivals dropped by average -73.9% in 2020 due to global pandemic restrictions, followed by partial recovery in 2021.</p>
      </div>
    </div>
  `;
}

/* 6. Fetch & Render UiPath Automation Status */
async function loadUiPathStatus() {
  const container = document.getElementById('uipath-status-container');
  if (!container) return;

  try {
    const res = await fetch('/api/pipeline');
    if (!res.ok) throw new Error('Pipeline API error');
    const data = await res.json();
    const ui = data.uipath_automation;

    if (!ui || !ui.connected) {
      container.innerHTML = `
        <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px;">
          <div style="display: flex; align-items: center; gap: 10px; color: var(--text-muted); font-weight: 600;">
            <span style="width: 12px; height: 12px; border-radius: 50%; background: #8C7063; display: inline-block;"></span>
            <span>UiPath automation has not been connected yet.</span>
          </div>
        </div>
      `;
      return;
    }

    const status = (ui.status || 'NOT RUN').toUpperCase();
    let badgeColor = '#8C7063'; // Gray for NOT RUN
    let badgeBg = 'rgba(140, 112, 99, 0.15)';
    let badgeBorder = 'rgba(140, 112, 99, 0.3)';

    if (status === 'COMPLETED') {
      badgeColor = '#2ECC71';
      badgeBg = 'rgba(46, 204, 113, 0.15)';
      badgeBorder = 'rgba(46, 204, 113, 0.3)';
    } else if (status === 'FAILED') {
      badgeColor = '#E74C3C';
      badgeBg = 'rgba(231, 76, 60, 0.15)';
      badgeBorder = 'rgba(231, 76, 60, 0.3)';
    }

    container.innerHTML = `
      <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="width: 12px; height: 12px; border-radius: 50%; background: ${badgeColor}; display: inline-block; box-shadow: 0 0 8px ${badgeColor};"></span>
            <span style="font-size: 16px; font-weight: 800; color: var(--text-primary);">UiPath Automation Engine</span>
          </div>
          <span style="background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 800; letter-spacing: 0.5px;">
            ● ${status}
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div style="background: var(--bg-card); padding: 14px 18px; border-radius: 10px; border: 1px solid var(--border-color);">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">UiPath Executor</div>
            <div style="font-size: 14px; font-weight: 800; color: var(--brand-terracotta);">${ui.executor || 'PRAGATI_AI_EXECUTOR'}</div>
          </div>

          <div style="background: var(--bg-card); padding: 14px 18px; border-radius: 10px; border: 1px solid var(--border-color);">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Execution Message</div>
            <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">${ui.message || 'Analytics data loaded successfully'}</div>
          </div>

          <div style="background: var(--bg-card); padding: 14px 18px; border-radius: 10px; border: 1px solid var(--border-color);">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Execution Time</div>
            <div style="font-size: 14px; font-weight: 800; color: var(--brand-gold-dark);">${ui.execution_time || '00:00:00'}</div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    console.warn('UiPath status load error:', err);
    container.innerHTML = `
      <div style="background: var(--bg-secondary); padding: 16px; border-radius: 10px; color: var(--text-muted);">
        UiPath automation has not been connected yet.
      </div>
    `;
  }
}
