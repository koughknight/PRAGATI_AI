/*
 * PRAGATI AI - Interactive Decision Calculators
 * Simulates scenarios for Tourism Opportunity, Healthcare Resource Gap, and Business Expansion.
 */

document.addEventListener('DOMContentLoaded', () => {
  initCalculators();
});

function initCalculators() {
  // 1. Tourism Calculator
  const btnTourism = document.getElementById('btn-calc-tourism');
  if (btnTourism) {
    btnTourism.addEventListener('click', runTourismCalc);
    runTourismCalc();
  }

  // 2. Healthcare Calculator
  const btnHealth = document.getElementById('btn-calc-health');
  if (btnHealth) {
    btnHealth.addEventListener('click', runHealthCalc);
    runHealthCalc();
  }

  // 3. Business Expansion Calculator
  const btnBiz = document.getElementById('btn-calc-biz');
  if (btnBiz) {
    btnBiz.addEventListener('click', runBizCalc);
    runBizCalc();
  }
}

/* 1. Tourism Opportunity Calculator */
function runTourismCalc() {
  const tourists = parseFloat(document.getElementById('calc-tourists')?.value) || 50000;
  const spend = parseFloat(document.getElementById('calc-spend')?.value) || 4500;
  const stay = parseFloat(document.getElementById('calc-stay')?.value) || 4;

  const totalRevenueINR = tourists * spend * stay;
  const revenueCrores = totalRevenueINR / 10000000;

  const multiplier = 1.65;
  const totalEconomicImpact = revenueCrores * multiplier;

  let recStrategy = 'Strategic Priority: High Growth Sector';
  if (revenueCrores >= 100) {
    recStrategy = 'Strategic Priority: Priority Investment Hub';
  } else if (revenueCrores < 40) {
    recStrategy = 'Strategic Priority: Niche Tourism Corridor';
  }

  const outRevEl = document.getElementById('out-revenue');
  const outRecEl = document.getElementById('out-rec');

  if (outRevEl) outRevEl.textContent = `₹ ${revenueCrores.toFixed(2)} Cr`;
  if (outRecEl) outRecEl.textContent = `${recStrategy} (Total Impact: ₹ ${totalEconomicImpact.toFixed(2)} Cr)`;
}

/* 2. Healthcare Resource Calculator */
function runHealthCalc() {
  const pop = parseFloat(document.getElementById('calc-health-pop')?.value) || 1500000;
  const anaemia = parseFloat(document.getElementById('calc-anaemia-rate')?.value) || 52.5;
  const bedsPerThousand = parseFloat(document.getElementById('calc-existing-beds')?.value) || 0.8;

  // National standard target: 2.0 beds per 1,000 people
  const targetBedsPerThousand = 2.0;
  const currentBeds = (pop / 1000) * bedsPerThousand;
  const requiredBeds = (pop / 1000) * targetBedsPerThousand;
  const bedDeficit = Math.max(0, Math.round(requiredBeds - currentBeds));

  let priorityTier = 'Priority Tier: High Health Intervention Required';
  if (anaemia > 60 || bedsPerThousand < 0.5) {
    priorityTier = 'Priority Tier: Critical Healthcare Vulnerability Zone';
  } else if (anaemia < 40 && bedsPerThousand >= 1.5) {
    priorityTier = 'Priority Tier: Moderate Infrastructure Maintenance';
  }

  const outBedEl = document.getElementById('out-bed-deficit');
  const outHealthPrioEl = document.getElementById('out-health-priority');

  if (outBedEl) outBedEl.textContent = `${bedDeficit.toLocaleString()} Beds Deficit`;
  if (outHealthPrioEl) outHealthPrioEl.textContent = priorityTier;
}

/* 3. Business Expansion Calculator */
function runBizCalc() {
  const pop = parseFloat(document.getElementById('calc-biz-pop')?.value) || 800000;
  const literacy = parseFloat(document.getElementById('calc-biz-literacy')?.value) || 78.5;
  const nonAgri = parseFloat(document.getElementById('calc-biz-nonagri')?.value) || 62.0;

  // Compute composite score (0 - 100)
  const popFactor = Math.min(100, (pop / 1000000) * 40);
  const literacyFactor = literacy * 0.35;
  const nonAgriFactor = nonAgri * 0.25;

  const totalScore = Math.min(100, Math.round((popFactor + literacyFactor + nonAgriFactor) * 10) / 10);

  let recommendation = 'Recommendation: Favorable for Regional Expansion';
  if (totalScore >= 80) {
    recommendation = 'Recommendation: Highly Favorable Tier-1 Market';
  } else if (totalScore < 60) {
    recommendation = 'Recommendation: Moderate Growth Market (Feasibility Study Required)';
  }

  const outScoreEl = document.getElementById('out-biz-score');
  const outBizRecEl = document.getElementById('out-biz-rec');

  if (outScoreEl) outScoreEl.textContent = `${totalScore} / 100`;
  if (outBizRecEl) outBizRecEl.textContent = recommendation;
}
