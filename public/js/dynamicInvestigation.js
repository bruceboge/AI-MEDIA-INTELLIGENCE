/**
 * Dynamic Multi-Source Topic Search & Pre-Classification Module
 * 
 * Allows users to type any topic/query (e.g. Doctors Strike, CBC, SHIF, Finance Bill),
 * dynamically harvests from newsrooms and key figures, applies fast pre-sorting,
 * triggers real AI synthesis, and saves into Supabase sessions.
 */

let activeSessionId = null;

document.addEventListener('DOMContentLoaded', () => {
  initDynamicInvestigation();
});

function initDynamicInvestigation() {
  const searchBtn = document.getElementById('btn-dynamic-investigate');
  const clearBtn = document.getElementById('btn-clear-investigation');
  const inputEl = document.getElementById('dynamic-topic-input');

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      triggerDynamicSearch();
    });
  }

  if (inputEl) {
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        triggerDynamicSearch();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearActiveInvestigation();
    });
  }
}

/**
 * Run dynamic topic search & AI synthesis
 */
async function triggerDynamicSearch() {
  const inputEl = document.getElementById('dynamic-topic-input');
  const categorySelect = document.getElementById('dynamic-category-select');
  const customPromptEl = document.getElementById('dynamic-custom-prompt');
  const searchBtn = document.getElementById('btn-dynamic-investigate');

  const query = inputEl ? inputEl.value.trim() : '';
  const category = categorySelect ? categorySelect.value : 'all';
  const customPrompt = customPromptEl ? customPromptEl.value.trim() : '';

  if (!query) {
    if (window.showToast) window.showToast('Please enter a topic or keyword to search.', 'warning');
    if (inputEl) inputEl.focus();
    return;
  }

  if (searchBtn) {
    searchBtn.disabled = true;
    searchBtn.innerHTML = `<span>⏳</span> Harvesting & Analyzing...`;
  }

  if (window.showToast) {
    window.showToast(`Scanning news & key figures for "${query}"...`, 'info');
  }

  try {
    const user = window.mediwatchAuth ? window.mediwatchAuth.getCurrentUser() : null;
    const userId = user ? user.id : 'anon';

    const res = await fetch('/api/analysis/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        category,
        userId,
        customPrompt
      })
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to complete dynamic investigation.');
    }

    activeSessionId = data.sessionId;

    // Update global state and re-render dashboard
    if (Array.isArray(data.items) && data.items.length > 0) {
      window.allArticles = data.items;
      if (window.renderArticles) window.renderArticles();
    }

    if (data.report) {
      window.currentAnalysis = data.report;
      if (window.renderDashboardSummary) window.renderDashboardSummary(data.report);
      if (window.renderNarrativesView) window.renderNarrativesView(data.report.narratives || []);
      if (window.renderClaimsView) window.renderClaimsView(data.report.spreadingClaims || []);
      if (window.renderAlertsView) window.renderAlertsView(data.report.activeAlerts || []);
    }

    // Update KPI counts
    const countBadge = document.getElementById('filtered-count-badge');
    if (countBadge) countBadge.innerText = `${data.totalHarvested} verified items for "${query}"`;

    if (window.showToast) {
      window.showToast(`Analysis complete: ${data.newsCount} news stories + ${data.socialCount} 𝕏 posts analyzed!`, 'info');
    }

    // Scroll to dashboard overview
    const mainPane = document.getElementById('view-dashboard');
    if (mainPane) {
      mainPane.scrollIntoView({ behavior: 'smooth' });
    }
  } catch (err) {
    console.error('[DYNAMIC INVESTIGATION ERROR]', err);
    if (window.showToast) window.showToast(`Search error: ${err.message}`, 'error');
  } finally {
    if (searchBtn) {
      searchBtn.disabled = false;
      searchBtn.innerHTML = `<span>🔍</span> Harvest & Analyze with AI`;
    }
  }
}

/**
 * 1-Click Clear / Reset Investigation Data
 */
async function clearActiveInvestigation() {
  const inputEl = document.getElementById('dynamic-topic-input');
  if (inputEl) inputEl.value = '';

  const customPromptEl = document.getElementById('dynamic-custom-prompt');
  if (customPromptEl) customPromptEl.value = '';

  try {
    const res = await fetch('/api/analysis/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: activeSessionId })
    });

    const data = await res.json();
    activeSessionId = null;

    if (window.showToast) {
      window.showToast('Data cleared. Ready for fresh investigation.', 'info');
    }

    // Re-load initial clean snapshot
    if (window.loadDashboard) {
      window.loadDashboard();
    }
  } catch (err) {
    console.warn('Clear session error:', err);
  }
}

window.dynamicInvestigation = {
  triggerDynamicSearch,
  clearActiveInvestigation
};
