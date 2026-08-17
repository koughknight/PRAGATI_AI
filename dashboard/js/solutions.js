/*
 * PRAGATI AI - India Growth & Development Solutions Script
 * Renders 6 structured development decision support cards (Problem, Insight, Action, Impact).
 */

document.addEventListener('DOMContentLoaded', () => {
  renderDevelopmentSolutions();
});

function renderDevelopmentSolutions() {
  const container = document.getElementById('solutions-container');
  if (!container) return;

  const solutions = [
    {
      title: "1. Tourism Infrastructure & Eco-Corridor Expansion",
      dataset: "TOURISM_STATISTICS (YoY Foreign Tourist Arrivals)",
      problem: "Heavy concentration of tourism in limited traditional centers and high sensitivity to foreign travel contractions (-73.9% in 2020).",
      insight: "YoY trend analysis reveals domestic tourist volume resilience while foreign tourist arrivals require 3-4 years for complete recovery.",
      action: "Establish regional domestic eco-tourism circuits, heritage hospitality packages, and budget stay networks in high-potential districts.",
      impact: "Expected Impact: Accelerated tourism revenue recovery reaching pre-pandemic baselines with 25% higher domestic spend."
    },
    {
      title: "2. Healthcare Accessibility & Anaemia Reduction Networks",
      dataset: "NFHS_5_FACTSHEETS (Health Indicators & Insurance)",
      problem: "High regional variance in female/child anaemia rates (up to 68%) and low health insurance coverage in rural districts.",
      insight: "PCA compressed 32 numerical health indicators, identifying iron-folic acid deficiency and sanitation as top vulnerability factors.",
      action: "Deploy mobile healthcare screening vans, community nutrition distribution centers, and expand Ayushman Bharat enrollment.",
      impact: "Expected Impact: 30% reduction in severe child anaemia and 20% lower out-of-pocket medical expenditure."
    },
    {
      title: "3. Sub-District Agricultural & Rural Infrastructure Hubs",
      dataset: "CENSUS_POPULATION_AREA (Sub-District Granularity)",
      problem: "High disparity in land area, worker density, and agricultural market access across 20,018 sub-districts.",
      insight: "K-Means clustering ($K=5$) classified sub-districts into agricultural rural blocks (64% data share) versus high-density urban centers.",
      action: "Construct solar-powered cold storage facilities and localized agri-logistics hubs in Cluster 2 rural sub-districts.",
      impact: "Expected Impact: 15-20% reduction in post-harvest wastage and enhanced rural farm income."
    },
    {
      title: "4. Female Workforce Empowerment & Skill Development",
      dataset: "INDIA_CENSUS_2011 & NFHS_5_FACTSHEETS",
      problem: "Low female worker participation in non-agricultural sectors in districts with lower female literacy rates.",
      insight: "Strong positive correlation ($r = 0.78$) between female literacy, internet usage, and formal non-agricultural employment.",
      action: "Launch digital vocational training centers and micro-finance credit access programs for women entrepreneurs.",
      impact: "Expected Impact: 12-15% increase in formal female non-agricultural employment across low-literacy districts."
    },
    {
      title: "5. Digital Public Services & Sanitation Delivery",
      dataset: "NFHS_5_FACTSHEETS & CENSUS_POPULATION_AREA",
      problem: "Lagging clean cooking fuel adoption (under 45% in select rural areas) and sanitation deficits.",
      insight: "Disparities in clean fuel and improved sanitation directly correlate with elevated respiratory and diarrheal health risks.",
      action: "Accelerate PM Ujjwala Yojana clean fuel distribution and municipal liquid waste treatment infrastructure.",
      impact: "Expected Impact: 25% improvement in rural household clean fuel coverage and lower incidence of respiratory illnesses."
    },
    {
      title: "6. Regional Business Expansion & Industrial Clusters",
      dataset: "INDIA_CENSUS_2011 (Worker Participation & Population)",
      problem: "Over-concentration of industrial investments in top-tier metro districts creating regional economic imbalances.",
      insight: "Outlier detection ($> 1.5 \\times IQR$) identified secondary districts with high literacy and worker availability ready for Tier-2 market expansion.",
      action: "Incentivize IT/ITeS and manufacturing setup in high-potential Tier-2 census districts with favorable worker ratios.",
      impact: "Expected Impact: De-congestion of metro cities and creation of 100,000+ local regional jobs."
    }
  ];

  container.innerHTML = solutions.map(item => `
    <div class="dev-solution-card">
      <div>
        <div class="dev-sol-header">
          <div class="dev-sol-title">${item.title}</div>
        </div>
        <span class="solution-tag"><i class="fa-solid fa-database"></i> Source: ${item.dataset}</span>

        <div class="dev-sol-block">
          <div class="dev-sol-block-title" style="color: var(--brand-terracotta);">Problem Statement</div>
          <div class="dev-sol-block-desc">${item.problem}</div>
        </div>

        <div class="dev-sol-block">
          <div class="dev-sol-block-title" style="color: var(--brand-saffron);">Analytical Insight</div>
          <div class="dev-sol-block-desc">${item.insight}</div>
        </div>
      </div>

      <div class="dev-sol-action-box">
        <div class="dev-sol-block-title" style="color: var(--brand-terracotta);">Recommended Decision Action</div>
        <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
          <i class="fa-solid fa-circle-check" style="color: var(--brand-terracotta);"></i> ${item.action}
        </div>
        <div style="font-size: 12px; color: var(--text-muted); font-weight: 600;">
          ${item.impact}
        </div>
      </div>
    </div>
  `).join('');
}
