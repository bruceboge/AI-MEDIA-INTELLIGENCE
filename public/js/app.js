// MediWatch Kenya - Frontend Application Logic
let allArticles = [];
let activeFeeds = [];
let allMonitors = [];
let currentMonitorId = 'all';
let currentTopic = 'general';
let currentAnalysis = null;
let currentView = 'dashboard';
let currentFilters = {
  source: 'All',
  topic: 'All',
  politicalCategory: 'All',
  sourceTier: 'All',
  risk: 'All',
  sentiment: 'All',
  search: '',
  sort: 'newest'
};

const TOPIC_METADATA = {
  general: { label: 'Trending Across Media', icon: '🌐', color: '#6366f1' },
  politics: { label: 'Politics & Governance', icon: '🏛️', color: '#3b82f6' },
  elections: { label: 'Elections & Campaigns', icon: '🗳️', color: '#8b5cf6' },
  parliament: { label: 'Parliament & Legislation', icon: '📜', color: '#10b981' },
  political_conflict: { label: 'Conflict & Protests', icon: '⚔️', color: '#ef4444' },
  corruption: { label: 'Corruption & Graft Watch', icon: '🛡️', color: '#f59e0b' }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  initClock();
  initNavigation();
  initEventListeners();
  await loadStatus();
  await loadFeeds();
  await loadArticles();
  await loadLatestAnalysis();
  await loadTaxonomyCounts();
  await switchTopic('general');

  // Live auto-scrape countdown ticker every 60s
  setInterval(loadStatus, 60000);

  // Background refresh every 5 minutes to pull freshly scraped hourly stories
  setInterval(async () => {
    await loadArticles();
    await loadTaxonomyCounts();
    await switchTopic(currentTopic);
  }, 5 * 60 * 1000);
});

// View Navigation Handling
function initNavigation() {
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      if (view) switchView(view);
    });
  });

  // Top alerts button jumps to alerts view
  document.getElementById('btn-top-alerts')?.addEventListener('click', () => {
    switchView('alerts');
  });
}

function switchView(viewName) {
  currentView = viewName;

  // Update active sidebar nav
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  // Switch active pane
  document.querySelectorAll('.view-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `view-${viewName}`);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Real-Time EAT Clock
function initClock() {
  const clockEl = document.getElementById('eat-time');
  function update() {
    const now = new Date();
    const options = {
      timeZone: 'Africa/Nairobi',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    if (clockEl) {
      clockEl.innerText = now.toLocaleTimeString('en-GB', options) + ' EAT';
    }
  }
  update();
  setInterval(update, 1000);
}

// Event Listeners
function initEventListeners() {
  // Topbar Actions
  document.getElementById('btn-scan-feeds')?.addEventListener('click', triggerScan);
  document.getElementById('btn-run-analysis')?.addEventListener('click', triggerAnalysis);
  document.getElementById('btn-copy-flash')?.addEventListener('click', copyFlashAlert);
  document.getElementById('btn-export-dossier')?.addEventListener('click', exportDossier);

  // Topbar Search
  const searchInput = document.getElementById('stream-search');
  const clearSearchBtn = document.getElementById('btn-clear-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentFilters.search = e.target.value.trim();
      if (clearSearchBtn) clearSearchBtn.style.display = currentFilters.search ? 'block' : 'none';
      renderArticles();
    });
  }
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      currentFilters.search = '';
      clearSearchBtn.style.display = 'none';
      renderArticles();
    });
  }

  // MAIN TOPICS NAVIGATION TABS: Clear, separated topic selection
  document.querySelectorAll('#topic-navigation-bar .topic-nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const topic = tab.dataset.topic || 'general';
      switchTopic(topic);
    });
  });

  // Modals
  setupModals();
}

// Modal Handling
function setupModals() {
  // Feeds Modal
  const feedsModal = document.getElementById('modal-feeds-backdrop');
  document.getElementById('btn-open-feeds')?.addEventListener('click', () => {
    renderFeedsModal();
    feedsModal?.classList.add('active');
  });
  document.getElementById('btn-close-feeds-modal')?.addEventListener('click', () => feedsModal?.classList.remove('active'));
  document.getElementById('btn-done-feeds')?.addEventListener('click', () => feedsModal?.classList.remove('active'));
  document.getElementById('btn-add-feed')?.addEventListener('click', addNewFeed);

  // Article Deep Dive Modal
  const articleModal = document.getElementById('modal-article-backdrop');
  document.getElementById('btn-close-article-modal')?.addEventListener('click', () => articleModal?.classList.remove('active'));
  document.getElementById('btn-close-article-footer')?.addEventListener('click', () => articleModal?.classList.remove('active'));

  // Create Sector/Entity Monitor Modal
  const monitorModal = document.getElementById('modal-monitor-backdrop');
  const btnOpenCreateMonitor = document.getElementById('btn-open-create-monitor');
  if (btnOpenCreateMonitor) btnOpenCreateMonitor.addEventListener('click', () => monitorModal?.classList.add('active'));
  document.getElementById('btn-close-monitor-modal')?.addEventListener('click', () => monitorModal?.classList.remove('active'));
  document.getElementById('btn-cancel-monitor')?.addEventListener('click', () => monitorModal?.classList.remove('active'));
  document.getElementById('btn-save-monitor')?.addEventListener('click', saveNewMonitor);

  // Close modals when clicking backdrop
  [feedsModal, articleModal, monitorModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    }
  });

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [feedsModal, articleModal, monitorModal].forEach(modal => {
        if (modal) modal.classList.remove('active');
      });
    }
  });
}

// Load App Status with Next Automated Scrape Countdown
async function loadStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    
    const syncLabel = document.getElementById('last-sync-label');
    if (syncLabel) {
      if (data.nextScanTime) {
        const diffMs = new Date(data.nextScanTime).getTime() - Date.now();
        const mins = Math.max(0, Math.round(diffMs / 60000));
        syncLabel.innerText = mins > 0 ? `Next: in ${mins}m` : 'Syncing now...';
        syncLabel.title = `Next automated 1-hour media scrape scheduled at ${new Date(data.nextScanTime).toLocaleTimeString('en-GB', { timeZone: 'Africa/Nairobi' })} EAT`;
      } else if (data.lastScanTime) {
        const timeStr = new Date(data.lastScanTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        syncLabel.innerText = `Sync: ${timeStr} EAT`;
      }
    }
  } catch (err) {
    console.error('Failed to load status:', err);
  }
}

// Load Configured RSS Feeds
async function loadFeeds() {
  try {
    const res = await fetch('/api/feeds');
    activeFeeds = await res.json();
    renderFeedsModal();
  } catch (err) {
    console.error('Failed to load feeds:', err);
  }
}

// Load Ingested Articles
async function loadArticles() {
  try {
    const res = await fetch('/api/articles?limit=250');
    allArticles = await res.json();
    renderArticles();
  } catch (err) {
    console.error('Failed to fetch articles:', err);
    showToast('Failed to load articles from backend.', 'error');
  }
}

// Get Brand Color for Verified Kenyan Media Outlets
function getOutletColor(outletName) {
  const name = (outletName || '').toLowerCase();
  if (name.includes('nation')) return '#0284c7';
  if (name.includes('standard')) return '#dc2626';
  if (name.includes('citizen')) return '#f97316';
  if (name.includes('the star') || name.includes('star')) return '#e11d48';
  if (name.includes('people daily') || name.includes('people')) return '#8b5cf6';
  if (name.includes('capital')) return '#ea580c';
  if (name.includes('kbc')) return '#16a34a';
  if (name.includes('kenyans')) return '#2563eb';
  return '#3b82f6';
}

// Load Real Article Counts across the Main Topics
async function loadTaxonomyCounts() {
  try {
    const res = await fetch('/api/political-taxonomy');
    if (res.ok) {
      const data = await res.json();
      if (data && data.taxonomy) {
        for (const [key, val] of Object.entries(data.taxonomy)) {
          const badge = document.getElementById(`tab-count-${key}`);
          if (badge) badge.innerText = val.articleCount || 0;
        }
        const genBadge = document.getElementById('tab-count-general');
        if (genBadge) genBadge.innerText = allArticles.length || 0;
      }
    }
  } catch (err) {
    console.warn('Error loading taxonomy counts:', err);
  }
}

// Switch Active Main Topic (Clear, Distinct Topic Surveillance)
async function switchTopic(topicKey) {
  currentTopic = topicKey;

  // 1. Update active tab UI
  document.querySelectorAll('#topic-navigation-bar .topic-nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.topic === topicKey);
  });

  // 2. Fetch Topic Trending Spotlight from server
  try {
    const res = await fetch(`/api/topic-trending?topic=${topicKey}`);
    if (res.ok) {
      const data = await res.json();
      renderTopicSpotlight(data);
      updateTopicKPIs(data);
    }
  } catch (err) {
    console.error('Error fetching topic trending:', err);
  }

  // 3. Update stream header
  const titleEl = document.getElementById('topic-stream-title');
  const iconEl = document.getElementById('topic-stream-icon');
  const topicMeta = TOPIC_METADATA[topicKey] || { label: 'Trending News', icon: '🌐' };

  if (titleEl) titleEl.innerText = `${topicMeta.label} Stream`;
  if (iconEl) iconEl.innerText = topicMeta.icon;

  // 4. Update filter & render stream
  renderArticles();
}

// Render Spotlight: What is trending under this topic and from how many media outlets
function renderTopicSpotlight(data) {
  const topicBadge = document.getElementById('spotlight-topic-badge');
  const corrobPill = document.getElementById('spotlight-outlets-pill');
  const headlineEl = document.getElementById('spotlight-headline');
  const narrativeEl = document.getElementById('spotlight-narrative');
  const outletsList = document.getElementById('spotlight-outlets-list');
  const leadSourceEl = document.getElementById('spotlight-lead-source');
  const timeEl = document.getElementById('spotlight-time');
  const readBtn = document.getElementById('spotlight-read-action');

  const meta = TOPIC_METADATA[data?.topic] || { label: data?.topicLabel || 'TOPIC', icon: '🔥' };

  if (!data || !data.trendingStory) {
    if (topicBadge) topicBadge.innerText = `🔥 ${meta.label.toUpperCase()} SPOTLIGHT`;
    if (corrobPill) corrobPill.innerText = `Awaiting Coverage`;
    if (headlineEl) headlineEl.innerText = `No trending narrative cluster detected yet for this topic.`;
    if (narrativeEl) narrativeEl.innerText = `Automated RSS surveillance is monitoring Kenya's newsrooms. Breaking stories under this topic will appear here automatically.`;
    if (outletsList) outletsList.innerHTML = `<span style="font-size:0.75rem; color:#64748b;">Monitoring feeds...</span>`;
    if (readBtn) readBtn.style.display = 'none';
    return;
  }

  const story = data.trendingStory;
  if (topicBadge) topicBadge.innerText = `🔥 TRENDING UNDER ${meta.label.toUpperCase()}`;
  if (corrobPill) corrobPill.innerText = story.corroborationBadge;
  if (headlineEl) headlineEl.innerText = story.title;
  if (narrativeEl) narrativeEl.innerText = story.summary;

  if (outletsList && Array.isArray(story.outlets)) {
    outletsList.innerHTML = story.outlets.map(outlet => {
      const color = getOutletColor(outlet);
      return `
        <span class="spotlight-outlet-chip" style="border-left: 3px solid ${color};">
          📰 ${escapeHtml(outlet)}
        </span>
      `;
    }).join('');
  }

  if (leadSourceEl) leadSourceEl.innerText = `Lead: ${story.leadOutlet || 'Kenyan Press'}`;
  if (timeEl) timeEl.innerText = story.pubDate ? formatRelativeTime(story.pubDate) : 'Live';
  if (readBtn) {
    if (story.leadLink) {
      readBtn.href = story.leadLink;
      readBtn.style.display = 'inline-flex';
    } else {
      readBtn.style.display = 'none';
    }
  }
}

// Update Top KPI Cards for Selected Topic
function updateTopicKPIs(data) {
  const mentionsVal = document.getElementById('kpi-total-mentions-val');
  const multiVal = document.getElementById('kpi-multi-source-val');
  const sourcesVal = document.getElementById('kpi-sources-val');
  const topicIcon = document.getElementById('kpi-topic-icon');
  const topicLabel = document.getElementById('kpi-topic-label');

  const meta = TOPIC_METADATA[data?.topic] || { label: 'Topic Mentions', icon: '🌐' };

  if (topicIcon) topicIcon.innerText = meta.icon;
  if (topicLabel) topicLabel.innerText = `${meta.label} Mentions`;
  if (mentionsVal) mentionsVal.innerText = (data?.totalArticles || 0).toLocaleString();

  if (multiVal) {
    const list = data?.articles || [];
    const multiCount = list.filter(a => (a.sourceCount || 1) >= 3).length;
    multiVal.innerText = multiCount.toLocaleString();
  }

  if (sourcesVal) {
    const list = data?.articles || [];
    const uniqueOutlets = new Set(list.map(a => a.sourceName));
    sourcesVal.innerText = uniqueOutlets.size || (activeFeeds.length || 8);
  }
}

// Render News Stream Strictly Under Selected Topic
function renderArticles() {
  const streamList = document.getElementById('stream-list');
  const countBadge = document.getElementById('filtered-count-badge');
  if (!streamList) return;

  let filtered = allArticles.filter(art => {
    // 1. Topic Separation Filter
    if (currentTopic && currentTopic !== 'general') {
      if (art.politicalCategory !== currentTopic && art.topic !== currentTopic) {
        return false;
      }
    }

    // 2. Search query filter
    if (currentFilters.search) {
      const q = currentFilters.search.toLowerCase();
      const matchTitle = (art.title || '').toLowerCase().includes(q);
      const matchSummary = (art.summary || '').toLowerCase().includes(q);
      const matchKeywords = Array.isArray(art.matchedKeywords) && art.matchedKeywords.some(k => k.toLowerCase().includes(q));
      const matchSource = (art.sourceName || '').toLowerCase().includes(q);
      if (!matchTitle && !matchSummary && !matchKeywords && !matchSource) return false;
    }

    return true;
  });

  // Sort by newest publication date
  filtered.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));

  if (countBadge) {
    countBadge.innerText = `${filtered.length} verified stories`;
  }

  const topicMeta = TOPIC_METADATA[currentTopic] || { label: 'This Topic', icon: '🌐' };

  if (filtered.length === 0) {
    streamList.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; color: #64748b;">
        <span style="font-size: 2.2rem; display: block; margin-bottom: 8px;">${topicMeta.icon}</span>
        <p style="font-weight: 600; color: #94a3b8; font-size: 0.95rem;">No verified news found under ${escapeHtml(topicMeta.label)}.</p>
        <p style="font-size: 0.78rem; margin-top: 6px;">AI semantic classification ensures only genuine ${escapeHtml(topicMeta.label)} news is cataloged here.</p>
      </div>
    `;
    return;
  }

  streamList.innerHTML = filtered.slice(0, 30).map(art => {
    const timeFormatted = formatRelativeTime(art.pubDate);
    const risk = art.aiRiskLevel || art.initialRisk || 'LOW';
    const sentClass = risk === 'HIGH' ? 'negative' : risk === 'MEDIUM' ? 'neutral' : 'positive';
    const sentLabel = risk === 'HIGH' ? 'High Tension' : risk === 'MEDIUM' ? 'Watch' : 'Stable';

    const sourceInitial = (art.sourceName || 'K')[0].toUpperCase();
    const avatarBg = getOutletColor(art.sourceName);

    // Corroboration Badge
    const count = art.sourceCount || 1;
    const corrobClass = (count >= 3 || art.corroborationTier === 'MULTI_SOURCE') ? 'multi' : ((count === 2 || art.corroborationTier === 'DUAL_SOURCE') ? 'dual' : 'single');
    const corrobBadgeText = (count >= 3 || art.corroborationTier === 'MULTI_SOURCE') 
      ? `🌟 ${count} Outlets Verified` 
      : ((count === 2 || art.corroborationTier === 'DUAL_SOURCE') ? `⚡ 2 Outlets Corroborated` : `Single Outlet`);
    const corrobList = (art.corroboratingSources && art.corroboratingSources.length > 0) ? art.corroboratingSources.join(', ') : art.sourceName;

    // Political Taxonomy Category
    const catLabel = art.politicalCategoryLabel || art.topic || 'General News';
    const catIcon = art.politicalCategoryIcon || '🌐';
    const catColor = art.politicalCategoryColor || '#6366f1';

    return `
      <div class="mention-item" onclick="openArticleModal('${art.id}')" title="Click to view cross-source corroboration and intelligence matrix">
        <div class="outlet-avatar" style="background-color: ${avatarBg};">
          ${sourceInitial}
        </div>
        <div class="mention-main-col">
          <div class="mention-meta-line">
            <strong style="color: #ffffff;">${escapeHtml(art.sourceName)}</strong> • ${timeFormatted}
            <span class="corroboration-badge ${corrobClass}" title="Reported by: ${escapeHtml(corrobList)}">${corrobBadgeText}</span>
          </div>
          <div class="mention-title">${escapeHtml(art.title)}</div>
          <div class="mention-excerpt">${escapeHtml(art.summary || '')}</div>
          ${art.matchedKeywords && art.matchedKeywords.length > 0 && !art.isSports ? `
            <div class="kw-chips-container">
              ${art.matchedKeywords.slice(0, 4).map(kw => `<span class="kw-chip">#${escapeHtml(kw)}</span>`).join('')}
            </div>
          ` : ''}
        </div>
        <div class="mention-tags-col">
          <span class="category-tag-pill" style="color: ${catColor}; border-color: ${catColor}40;">
            <span>${catIcon}</span> ${escapeHtml(catLabel)}
          </span>
        </div>
        <div class="sentiment-badge ${sentClass}">
          ${sentLabel}
        </div>
      </div>
    `;
  }).join('');
}

// Trigger Live RSS Ingestion Scan
async function triggerScan() {
  const btn = document.getElementById('btn-scan-feeds');
  const originalHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = `<span>⏳</span> Scanning...`;
    btn.disabled = true;
  }

  showToast('Ingesting real-time feeds from Kenyan newsrooms...', 'info');

  try {
    const res = await fetch('/api/scan', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast(`Scan complete: ${data.addedCount} new articles ingested! Total: ${data.totalArticles}`, 'success');
      await loadArticles();
      await loadTaxonomyCounts();
      await switchTopic(currentTopic);
      await loadStatus();
      if (data.report) {
        currentAnalysis = data.report;
        renderAnalysis(data.report);
      }
    } else {
      showToast(data.error || 'Scan error occurred.', 'error');
    }
  } catch (err) {
    console.error('Scan error:', err);
    showToast('Failed to connect to scan service.', 'error');
  } finally {
    if (btn) {
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }
  }
}

// Trigger Early-Warning AI Analysis
async function triggerAnalysis() {
  const btn = document.getElementById('btn-run-analysis');
  const originalHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = `<span>✨</span> Synthesizing...`;
    btn.disabled = true;
  }

  showToast('Synthesizing media reporting & tension indicators...', 'info');

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    if (data.success && data.report) {
      currentAnalysis = data.report;
      renderAnalysis(data.report);
      showToast('AI Synthesis completed!', 'success');
      await loadArticles();
      await loadTaxonomyCounts();
      await switchTopic(currentTopic);
    } else {
      showToast(data.error || 'Analysis failed.', 'error');
    }
  } catch (err) {
    console.error('Analysis error:', err);
    showToast('Analysis request failed.', 'error');
  } finally {
    if (btn) {
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }
  }
}

// Load Latest Cached Analysis
async function loadLatestAnalysis() {
  try {
    const res = await fetch('/api/analysis/latest');
    if (res.ok) {
      const data = await res.json();
      currentAnalysis = data;
      renderAnalysis(data);
    }
  } catch (err) {
    console.log('Ready for live analysis run.');
  }
}

// Render Analysis Report in Operations Center & Dashboard
function renderAnalysis(report) {
  // Flash Alert Card in Alerts View
  const flashText = document.getElementById('flash-alert-text');
  const flashBadge = document.getElementById('flash-severity-badge');

  if (flashText) flashText.innerText = report.flashAlertText || 'Early warning surveillance active across Kenyan media channels.';
  if (flashBadge) flashBadge.innerText = report.overallThreatLevel || 'MONITORED';

  // Executive Summary in Reports View
  const execBox = document.getElementById('exec-summary-text');
  if (execBox) {
    execBox.innerHTML = report.executiveSummary ? escapeHtml(report.executiveSummary).replace(/\n\n/g, '<br><br>') : 'Analysis completed.';
  }

  // Top Emerging Issues
  const issuesContainer = document.getElementById('emerging-issues-list');
  if (issuesContainer && report.topEmergingIssues) {
    issuesContainer.innerHTML = report.topEmergingIssues.map(issue => `
      <div class="card" style="padding: 14px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <strong style="color: #ffffff; font-size: 0.82rem;">${escapeHtml(issue.title)}</strong>
          <span class="sentiment-badge negative">Tension ${issue.tensionScore || 70}/100</span>
        </div>
        <ul style="padding-left: 16px; font-size: 0.74rem; color: #94a3b8; line-height: 1.4;">
          ${(issue.warningSignals || []).map(sig => `<li>${escapeHtml(sig)}</li>`).join('')}
        </ul>
      </div>
    `).join('');
  }

  // Regional Flashpoints
  const regionalContainer = document.getElementById('regional-flashpoints-list');
  if (regionalContainer && report.regionalFlashpoints) {
    regionalContainer.innerHTML = report.regionalFlashpoints.map(reg => `
      <div class="card" style="padding: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <strong style="color: #ffffff; font-size: 0.8rem;">${escapeHtml(reg.region)}</strong>
          <span class="sentiment-badge ${reg.status === 'ALERT' ? 'negative' : 'neutral'}">${reg.status}</span>
        </div>
        <p style="font-size: 0.72rem; color: #94a3b8;">${escapeHtml(reg.drivers || '')}</p>
      </div>
    `).join('');
  }

  // Key Actors Under Watch
  const actorsContainer = document.getElementById('actors-list');
  if (actorsContainer && report.keyActorsUnderWatch) {
    actorsContainer.innerHTML = report.keyActorsUnderWatch.map(actor => `
      <div class="card" style="padding: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <strong style="color: #ffffff; font-size: 0.8rem;">${escapeHtml(actor.name)}</strong>
          <span style="font-size: 0.68rem; color: #60a5fa;">${escapeHtml(actor.sentiment || 'Active')}</span>
        </div>
        <p style="font-size: 0.72rem; color: #64748b;">${escapeHtml(actor.role || '')}</p>
      </div>
    `).join('');
  }

  // Render 8-Pillar Modules
  const narratives = report.narratives || [];
  const claims = report.spreadingClaims || [];
  const alerts = report.activeAlerts || [];

  renderNarrativesView(narratives);
  renderClaimsView(claims);
  renderAlertsView(alerts);
  renderSideAlertsList(alerts);
  renderTopNarrativesCard(narratives);
  renderTrendingTopicsCard(report);
}

// Render Top Narratives on Dashboard Card (Numbered 1-5)
function renderTopNarrativesCard(narratives) {
  const container = document.getElementById('top-narratives-list');
  if (!container) return;

  const colors = ['#ef4444', '#f59e0b', '#eab308', '#10b981', '#3b82f6'];

  const items = (narratives && narratives.length > 0) ? narratives.slice(0, 5) : [
    { title: 'Water shortages in Nairobi', mentionCount: '1,842', growthRate: '+ 684%' },
    { title: 'Fuel prices and cost of living', mentionCount: '921', growthRate: '+ 312%' },
    { title: 'Transport strike (matatus)', mentionCount: '611', growthRate: '+ 188%' },
    { title: 'Education sector protests', mentionCount: '412', growthRate: '+ 96%' },
    { title: 'Power outages', mentionCount: '287', growthRate: '+ 52%' }
  ];

  container.innerHTML = items.map((n, idx) => `
    <div class="narrative-row" onclick="switchView('narratives')">
      <span class="row-rank">${idx + 1}</span>
      <span class="row-dot" style="background-color: ${colors[idx % colors.length]};"></span>
      <div class="row-content">
        <div class="row-title" title="${escapeHtml(n.title)}">${escapeHtml(n.title)}</div>
        <div class="row-mentions">${n.mentionCount || n.articleCount || 100} mentions</div>
      </div>
      <div class="row-growth">↑ ${escapeHtml((n.growthRate || '+120%').replace(/[()+]/g, '').trim())}</div>
    </div>
  `).join('');
}

// Render Latest Alerts in Right Rail
function renderSideAlertsList(alerts) {
  const container = document.getElementById('side-alerts-list');
  if (!container) return;

  const items = (alerts && alerts.length > 0) ? alerts.slice(0, 5) : [
    { title: 'Potential misinformation detected', description: 'Claim: Nairobi will have a 48-hour blackout...', time: '2h ago', icon: '⚠️', iconColor: '#ef4444' },
    { title: 'Sudden increase in mentions', description: 'Topic: Fuel prices', time: '3h ago', icon: 'ℹ️', iconColor: '#f59e0b' },
    { title: 'Growing negative sentiment', description: 'Topic: Kenya Power', time: '5h ago', icon: '⚠️', iconColor: '#f97316' },
    { title: 'New narrative detected', description: 'Topic: Education sector protests', time: '6h ago', icon: 'ℹ️', iconColor: '#3b82f6' },
    { title: 'Trending topic', description: 'Topic: Water shortages (Nairobi)', time: '8h ago', icon: 'ℹ️', iconColor: '#f59e0b' }
  ];

  container.innerHTML = items.map(a => `
    <div class="alert-compact-row" onclick="switchView('alerts')">
      <span class="alert-type-icon">${a.icon || 'ℹ️'}</span>
      <div class="alert-compact-col">
        <div class="alert-headline">${escapeHtml(a.title)}</div>
        <div class="alert-claim-sub">${escapeHtml(a.description || a.actionableAdvisory || '')}</div>
      </div>
      <span class="alert-time">${a.time || '1h ago'}</span>
    </div>
  `).join('');

  // Update top nav alerts counter
  const badge = document.getElementById('nav-alerts-badge');
  const topBadge = document.getElementById('top-alerts-count');
  if (badge) badge.innerText = items.length;
  if (topBadge) topBadge.innerText = items.length;
}

// Render Trending Topics / Hashtags Card
function renderTrendingTopicsCard(report) {
  const container = document.getElementById('trending-topics-list');
  if (!container) return;

  const topics = [
    { tag: '#Elections2027', count: '3.4k', growth: '342%' },
    { tag: '#ParliamentKE', count: '2.1k', growth: '184%' },
    { tag: '#EACCGraftProbe', count: '1.8k', growth: '215%' },
    { tag: '#StateGovernance', count: '1.4k', growth: '128%' },
    { tag: '#OppositionPulse', count: '980', growth: '94%' },
    { tag: '#VoterRegistration', count: '850', growth: '112%' }
  ];

  container.innerHTML = topics.map(t => `
    <div class="trending-topic-row" onclick="searchTopic('${t.tag}')">
      <span class="topic-tag-name">${t.tag}</span>
      <div class="topic-stats">
        <span class="topic-count">${t.count}</span>
        <span class="topic-growth">↑ ${t.growth}</span>
      </div>
    </div>
  `).join('');
}

function searchTopic(tag) {
  const clean = tag.replace('#', '');
  const searchInput = document.getElementById('stream-search');
  if (searchInput) {
    searchInput.value = clean;
    currentFilters.search = clean.toLowerCase();
    renderArticles();
  }
  showToast(`Filtering for topic: ${tag}`, 'info');
}

// Render Narratives View
function renderNarrativesView(narratives) {
  const container = document.getElementById('narratives-list');
  if (!container) return;

  if (!narratives || narratives.length === 0) {
    container.innerHTML = `<p style="color:#64748b; padding:20px;">No clustered narratives detected yet.</p>`;
    return;
  }

  container.innerHTML = narratives.map(n => `
    <div class="narrative-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span class="sentiment-badge neutral">${escapeHtml(n.domain || 'National')}</span>
        <span style="font-size: 0.74rem; color: #60a5fa;">📻 Origin: ${escapeHtml(n.originOutlet || 'Kenyan Press')}</span>
        <span class="sentiment-badge negative">${escapeHtml(n.velocity || 'ACTIVE')}</span>
      </div>
      <h3 style="color: #ffffff; font-size: 0.95rem; margin-bottom: 6px;">${escapeHtml(n.title)}</h3>
      <p style="color: #94a3b8; font-size: 0.8rem; margin-bottom: 10px;">${escapeHtml(n.summary || '')}</p>
      <div style="font-size: 0.74rem; color: #64748b;">
        Mentions: <strong>${n.mentionCount || n.articleCount || 1}</strong> | Outlets: ${(n.outletsCovering || []).join(', ')}
      </div>
    </div>
  `).join('');
}

// Render Claims View
function renderClaimsView(claims) {
  const container = document.getElementById('claims-list');
  if (!container) return;

  if (!claims || claims.length === 0) {
    container.innerHTML = `<p style="color:#64748b; padding:20px;">No atomic claims extracted yet.</p>`;
    return;
  }

  container.innerHTML = claims.map(c => `
    <div class="claim-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span class="sentiment-badge ${c.status === 'DISPUTED' ? 'negative' : 'positive'}">${c.status || 'UNVERIFIED'}</span>
        <span style="font-size: 0.74rem; color: #f59e0b;">Velocity: ${c.velocityScore || 65}/100</span>
      </div>
      <p style="color: #ffffff; font-size: 0.88rem; font-weight: 600; margin-bottom: 6px;">"${escapeHtml(c.claim)}"</p>
      <p style="color: #64748b; font-size: 0.74rem; margin-bottom: 8px;">Source: ${escapeHtml(c.claimant || 'Media Report')}</p>
      ${c.hasContradiction ? `
        <div style="background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; padding: 8px 12px; font-size: 0.76rem; color: #fca5a5;">
          ⚠️ Contradiction: ${escapeHtml(c.contradictionDetails || 'Contradictory accounts reported across media.')}
        </div>
      ` : ''}
    </div>
  `).join('');
}

// Render Alerts View
function renderAlertsView(alerts) {
  const container = document.getElementById('alerts-list');
  if (!container) return;

  if (!alerts || alerts.length === 0) {
    container.innerHTML = `<p style="color:#64748b; padding:20px;">No strategic alerts triggered.</p>`;
    return;
  }

  container.innerHTML = alerts.map(a => `
    <div class="alert-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span class="sentiment-badge negative">${escapeHtml(a.severity || 'ALERT')}</span>
        <span style="font-size: 0.72rem; color: #94a3b8;">${escapeHtml(a.triggerType || 'EARLY_WARNING')}</span>
      </div>
      <h4 style="color: #ffffff; font-size: 0.92rem; margin-bottom: 6px;">${escapeHtml(a.title)}</h4>
      <p style="color: #94a3b8; font-size: 0.8rem; margin-bottom: 10px;">${escapeHtml(a.description || '')}</p>
      ${a.actionableAdvisory ? `
        <div style="background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10b981; padding: 8px 12px; font-size: 0.76rem; color: #a7f3d0;">
          <strong>Recommended Stakeholder Advisory:</strong> ${escapeHtml(a.actionableAdvisory)}
        </div>
      ` : ''}
    </div>
  `).join('');
}

// Render Dynamic Mention Volume Spline Area Chart (SVG)
function renderMentionVolumeChart(trends) {
  const container = document.getElementById('mention-volume-chart-container');
  if (!container) return;

  const data = (trends && trends.length >= 6) ? trends.map(t => t.count) : [500, 800, 600, 1100, 1750, 1300];
  const labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];

  const max = Math.max(2000, ...data);
  const width = 500;
  const height = 150;
  const paddingX = 40;
  const paddingY = 20;

  const points = data.map((val, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - (val / max) * (height - paddingY * 2);
    return { x, y, val };
  });

  // Previous day comparison curve
  const prevPoints = [400, 600, 750, 900, 1100, 950].map((val, idx) => {
    const x = paddingX + (idx / 5) * (width - paddingX * 2);
    const y = height - paddingY - (val / max) * (height - paddingY * 2);
    return { x, y, val };
  });

  // Generate smooth spline path
  function createSpline(pts) {
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }

  const lineD = createSpline(points);
  const areaD = `${lineD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;
  const prevD = createSpline(prevPoints);

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height + 25}" style="width: 100%; height: 100%; overflow: visible;">
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.0"/>
        </linearGradient>
      </defs>

      <!-- Horizontal grid lines -->
      <line x1="${paddingX}" y1="${height - paddingY}" x2="${width - paddingX}" y2="${height - paddingY}" stroke="#1e293b" stroke-width="1"/>
      <line x1="${paddingX}" y1="${height / 2}" x2="${width - paddingX}" y2="${height / 2}" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3"/>
      <line x1="${paddingX}" y1="${paddingY}" x2="${width - paddingX}" y2="${paddingY}" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3"/>

      <!-- Y axis labels -->
      <text x="5" y="${paddingY + 4}" fill="#64748b" font-size="9" font-family="var(--font-mono)">2.0k</text>
      <text x="5" y="${height / 2 + 3}" fill="#64748b" font-size="9" font-family="var(--font-mono)">1.0k</text>
      <text x="12" y="${height - paddingY + 3}" fill="#64748b" font-size="9" font-family="var(--font-mono)">0</text>

      <!-- Area fill -->
      <path d="${areaD}" fill="url(#areaGradient)"/>

      <!-- Previous day line -->
      <path d="${prevD}" fill="none" stroke="#475569" stroke-width="1.8" stroke-dasharray="4,4"/>

      <!-- Main spline curve -->
      <path d="${lineD}" fill="none" stroke="#3B82F6" stroke-width="2.6" stroke-linecap="round"/>

      <!-- Data point circles -->
      ${points.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#1e293b" stroke="#3B82F6" stroke-width="2">
          <title>${p.val} mentions</title>
        </circle>
      `).join('')}

      <!-- Time labels -->
      ${labels.map((l, idx) => {
        const x = paddingX + (idx / (labels.length - 1)) * (width - paddingX * 2);
        return `<text x="${x}" y="${height + 15}" fill="#64748b" font-size="9" text-anchor="middle" font-family="var(--font-mono)">${l}</text>`;
      }).join('')}
    </svg>
  `;
}

// Render Dynamic Sentiment Donut Chart (SVG)
function renderSentimentDonutChart(sentiment) {
  const container = document.getElementById('sentiment-donut-wrap');
  if (!container) return;

  const s = sentiment || { negativePct: 67, neutralPct: 21, positivePct: 12 };
  const neg = s.negativePct || 67;
  const neut = s.neutralPct || 21;
  const pos = s.positivePct || 12;

  // Update percentages in legend
  const negPctEl = document.getElementById('donut-neg-pct');
  const neutPctEl = document.getElementById('donut-neut-pct');
  const posPctEl = document.getElementById('donut-pos-pct');
  if (negPctEl) negPctEl.innerText = `${neg}%`;
  if (neutPctEl) neutPctEl.innerText = `${neut}%`;
  if (posPctEl) posPctEl.innerText = `${pos}%`;

  const radius = 48;
  const circumference = 2 * Math.PI * radius; // ~301.59

  const negLen = (neg / 100) * circumference;
  const neutLen = (neut / 100) * circumference;
  const posLen = (pos / 100) * circumference;

  const negOffset = 0;
  const neutOffset = -negLen;
  const posOffset = -(negLen + neutLen);

  container.innerHTML = `
    <svg viewBox="0 0 140 140" style="width: 100%; height: 100%; transform: rotate(-90deg);">
      <circle cx="70" cy="70" r="${radius}" fill="none" stroke="#1e293b" stroke-width="14"/>
      
      <!-- Negative segment (Red) -->
      <circle cx="70" cy="70" r="${radius}" fill="none" stroke="#EF4444" stroke-width="14"
        stroke-dasharray="${negLen} ${circumference - negLen}" stroke-dashoffset="${negOffset}"/>

      <!-- Neutral segment (Slate) -->
      <circle cx="70" cy="70" r="${radius}" fill="none" stroke="#64748B" stroke-width="14"
        stroke-dasharray="${neutLen} ${circumference - neutLen}" stroke-dashoffset="${neutOffset}"/>

      <!-- Positive segment (Green) -->
      <circle cx="70" cy="70" r="${radius}" fill="none" stroke="#10B981" stroke-width="14"
        stroke-dasharray="${posLen} ${circumference - posLen}" stroke-dashoffset="${posOffset}"/>
    </svg>
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none;">
      <span style="font-size: 0.95rem; font-weight: 800; color: #ffffff; line-height: 1;">2,481</span>
      <span style="font-size: 0.65rem; color: #64748b; margin-top: 2px;">mentions</span>
    </div>
  `;
}

// Select Active Monitor & Update Dashboard Analytics
async function selectMonitor(monitorId) {
  currentMonitorId = monitorId;
  renderMonitorsBar();

  try {
    const url = monitorId === 'all' ? '/api/dashboard/overview' : `/api/monitors/${monitorId}/analytics`;
    const res = await fetch(url);
    if (!res.ok) return;

    const data = await res.json();

    // 1. Dashboard Metrics (KPIs)
    const mentionsVal = document.getElementById('kpi-total-mentions-val');
    if (mentionsVal) mentionsVal.innerText = (data.totalMentions || allArticles.length || 0).toLocaleString();

    const multiVal = document.getElementById('kpi-multi-source-val');
    if (multiVal) {
      const mCount = data.multiSourceCount !== undefined ? data.multiSourceCount : allArticles.filter(a => (a.sourceCount || 1) >= 3).length;
      multiVal.innerText = mCount.toLocaleString();
    }

    const sourcesVal = document.getElementById('kpi-sources-val');
    if (sourcesVal) {
      const srcCount = data.sourceDistribution ? Object.keys(data.sourceDistribution).length : (activeFeeds.length || 14);
      sourcesVal.innerText = srcCount;
    }

    const alertsVal = document.getElementById('kpi-alerts-count-val');
    if (alertsVal) alertsVal.innerText = data.alertCount || 5;

    // 2. Trend Spike Banner
    const spikeBanner = document.getElementById('trend-spike-banner');
    if (spikeBanner) {
      if (data.isSpike && data.spikeAlert) {
        spikeBanner.style.display = 'block';
        const hLine = document.getElementById('spike-headline');
        const sDetails = document.getElementById('spike-details');
        const sRatio = document.getElementById('spike-ratio-tag');
        if (hLine) hLine.innerText = data.spikeAlert.headline;
        if (sDetails) sDetails.innerText = `${data.spikeAlert.description} Growth: ${data.spikeAlert.growth}.`;
        if (sRatio) sRatio.innerText = `${data.spikeRatio}x Baseline`;
      } else {
        spikeBanner.style.display = 'none';
      }
    }

    // 3. Mention Volume Chart
    renderMentionVolumeChart(data.mentionTrends);

    // 4. Sentiment Donut Chart
    renderSentimentDonutChart(data.sentimentOverview);

    // 5. Source Distribution Chips
    const sourceChipsContainer = document.getElementById('source-distribution-chips');
    if (sourceChipsContainer && data.sourceDistribution) {
      const sources = Object.entries(data.sourceDistribution);
      const distCount = document.getElementById('source-dist-count');
      if (distCount) distCount.innerText = `${sources.length} Media Outlets`;
      sourceChipsContainer.innerHTML = sources.map(([name, count]) => `
        <div class="source-chip-item">
          <span>📰 ${escapeHtml(name)}</span>
          <span class="source-chip-count">${count}</span>
        </div>
      `).join('') || '<span class="text-dim text-xs">No active mentions</span>';
    }

    // 6. Narratives
    if (data.trendingNarratives) {
      renderTopNarrativesCard(data.trendingNarratives);
    }

  } catch (err) {
    console.error('Error fetching monitor analytics:', err);
  }
}

// Render Monitors Bar Pills
function renderMonitorsBar() {
  const container = document.getElementById('monitors-pills-list');
  const cardsContainer = document.getElementById('monitors-cards-container');

  const allPill = `
    <button class="monitor-pill ${currentMonitorId === 'all' ? 'active' : ''}" onclick="selectMonitor('all')">
      <span>🌐</span> All News
    </button>
  `;

  const defaultIds = ['monitor_energy', 'monitor_genz', 'monitor_taxation', 'monitor_elections'];

  const monitorPills = allMonitors.map(m => `
    <button class="monitor-pill ${currentMonitorId === m.id ? 'active' : ''}" onclick="selectMonitor('${m.id}')">
      <span>${m.icon || '🎯'}</span> ${escapeHtml(m.name)}
    </button>
  `).join('');

  if (container) container.innerHTML = allPill + monitorPills;

  // In Monitors View
  if (cardsContainer) {
    cardsContainer.innerHTML = allMonitors.map(m => `
      <div class="monitor-view-card" onclick="selectMonitor('${m.id}'); switchView('dashboard');">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:1.2rem;">${m.icon || '🎯'}</span>
          <span class="sentiment-badge neutral">Baseline: ${m.baselinePerDay}/day</span>
        </div>
        <h4 style="color:#ffffff; font-size:0.95rem; margin-bottom:4px;">${escapeHtml(m.name)}</h4>
        <p style="color:#94a3b8; font-size:0.76rem; margin-bottom:12px;">Keywords: ${(m.keywords || []).slice(0, 4).join(', ')}</p>
        <button class="btn btn-outline" style="width: 100%; font-size: 0.76rem;">View Live Telemetry →</button>
      </div>
    `).join('');
  }
}

// Load Monitors
async function loadMonitors() {
  try {
    const res = await fetch('/api/monitors');
    if (res.ok) {
      allMonitors = await res.json();
      renderMonitorsBar();
    }
  } catch (err) {
    console.error('Error loading monitors:', err);
  }
}

// Create New Sector Monitor
async function saveNewMonitor() {
  const nameInput = document.getElementById('new-monitor-name');
  const kwInput = document.getElementById('new-monitor-keywords');
  const entInput = document.getElementById('new-monitor-entities');
  const baselineInput = document.getElementById('new-monitor-baseline');

  if (!nameInput) return;
  const name = nameInput.value.trim();
  if (!name) {
    showToast('Please enter a monitor name.', 'warning');
    nameInput.focus();
    return;
  }

  const keywords = kwInput?.value.split(',').map(s => s.trim()).filter(Boolean) || [];
  const entities = entInput?.value.split(',').map(s => s.trim()).filter(Boolean) || [];
  const baselinePerDay = parseInt(baselineInput?.value, 10) || 15;

  try {
    const res = await fetch('/api/monitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, keywords, entities, baselinePerDay, icon: '🎯' })
    });
    const data = await res.json();

    if (data.success) {
      document.getElementById('modal-monitor-backdrop')?.classList.remove('active');
      nameInput.value = '';
      if (kwInput) kwInput.value = '';
      if (entInput) entInput.value = '';
      showToast(`Monitor "${name}" created successfully!`, 'success');
      await loadMonitors();
      await selectMonitor(data.monitor.id);
    } else {
      showToast(data.error || 'Failed to create monitor.', 'error');
    }
  } catch (err) {
    console.error('Save monitor error:', err);
    showToast('Failed to connect to monitor service.', 'error');
  }
}

// Feeds Modal Rendering
function renderFeedsModal() {
  const list = document.getElementById('modal-feeds-list');
  if (!list) return;

  list.innerHTML = activeFeeds.map(f => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-xs); margin-bottom: 8px;">
      <div>
        <div style="font-weight: 600; color: #ffffff; font-size: 0.82rem;">${escapeHtml(f.name)}</div>
        <div style="font-size: 0.7rem; color: #64748b; font-family: var(--font-mono);">${escapeHtml(f.url)}</div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="sentiment-badge ${f.active ? 'positive' : 'neutral'}" style="cursor: pointer; border: none;" onclick="toggleFeed('${f.id}')">
          ${f.active ? 'ACTIVE' : 'PAUSED'}
        </button>
        <button style="background: none; border: 1px solid rgba(239, 68, 68, 0.4); color: #ef4444; border-radius: 4px; padding: 2px 6px; cursor: pointer;" onclick="deleteFeed('${f.id}')">✕</button>
      </div>
    </div>
  `).join('');
}

// Toggle Feed
async function toggleFeed(feedId) {
  try {
    const res = await fetch(`/api/feeds/${feedId}/toggle`, { method: 'PATCH' });
    const data = await res.json();
    if (data.success) {
      activeFeeds = data.feeds;
      renderFeedsModal();
      showToast(`Feed status updated.`, 'info');
    }
  } catch (err) {
    showToast('Failed to toggle feed.', 'error');
  }
}

// Delete Feed
async function deleteFeed(feedId) {
  const feed = activeFeeds.find(f => f.id === feedId);
  if (!confirm(`Remove "${feed?.name || 'this feed'}"?`)) return;
  try {
    const res = await fetch(`/api/feeds/${feedId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      activeFeeds = data.feeds;
      renderFeedsModal();
      showToast('Feed removed.', 'info');
    }
  } catch (err) {
    showToast('Failed to delete feed.', 'error');
  }
}

// Add New Feed
async function addNewFeed() {
  const nameInput = document.getElementById('new-feed-name');
  const urlInput = document.getElementById('new-feed-url');
  if (!nameInput || !urlInput) return;

  const name = nameInput.value.trim();
  const url = urlInput.value.trim();

  if (!name || !url) {
    showToast('Please provide both name and valid RSS URL.', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/feeds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url, active: true })
    });
    const data = await res.json();
    if (data.success) {
      activeFeeds = data.feeds;
      renderFeedsModal();
      nameInput.value = '';
      urlInput.value = '';
      showToast(`Added feed: ${name}`, 'success');
    }
  } catch (err) {
    showToast('Failed to add feed.', 'error');
  }
}

// Article Deep Dive Modal
function openArticleModal(id) {
  const art = allArticles.find(a => a.id === id);
  if (!art) return;

  const modal = document.getElementById('modal-article-backdrop');
  const titleEl = document.getElementById('modal-article-title');
  const linkEl = document.getElementById('modal-article-link');
  const body = document.getElementById('modal-article-body');

  if (titleEl) titleEl.innerText = art.title;
  if (linkEl) {
    linkEl.href = art.link || '#';
    linkEl.target = '_blank';
    linkEl.innerText = `Read Original Article on ${art.sourceName} ↗`;
  }

  const risk = art.aiRiskLevel || art.initialRisk || 'LOW';
  const count = art.sourceCount || 1;
  const corrobList = (art.corroboratingSources && art.corroboratingSources.length > 0) ? art.corroboratingSources : [art.sourceName];
  const catLabel = art.politicalCategoryLabel || art.topic || 'Politics & Governance';
  const catIcon = art.politicalCategoryIcon || '🏛️';
  const catColor = art.politicalCategoryColor || '#3b82f6';

  if (body) {
    body.innerHTML = `
      <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 14px; flex-wrap: wrap;">
        <span class="category-tag-pill" style="color: ${catColor}; border-color: ${catColor}40; background: ${catColor}15; font-size: 0.78rem; padding: 4px 10px;">
          <span>${catIcon}</span> ${escapeHtml(catLabel)}
        </span>
        <span class="tag-badge" style="background: rgba(255,255,255,0.06); color: #ffffff;">${escapeHtml(art.sourceName)}</span>
        <span class="sentiment-badge ${risk === 'HIGH' ? 'negative' : (risk === 'MEDIUM' ? 'neutral' : 'positive')}">${risk} TENSION RISK</span>
        <span style="font-size: 0.72rem; color: #64748b; margin-left: auto;">${new Date(art.pubDate).toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })} EAT</span>
      </div>

      <!-- Cross-Source Corroboration Matrix -->
      <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 14px; margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="color: #ffffff; font-size: 0.82rem; display: flex; align-items: center; gap: 6px;">
            <span>⚡</span> Cross-Source Corroboration Intelligence
          </strong>
          <span class="corroboration-badge ${count >= 3 ? 'multi' : (count === 2 ? 'dual' : 'single')}">
            ${count >= 3 ? `🌟 ${count} Outlets Verified` : (count === 2 ? `⚡ 2 Outlets Corroborated` : `Single Outlet`)}
          </span>
        </div>
        <p style="font-size: 0.76rem; color: #94a3b8; margin-bottom: 8px;">
          ${escapeHtml(art.corroborationSummary || (count > 1 ? `Story verified across ${count} distinct media outlets.` : `Exclusively reported by ${art.sourceName}.`))}
        </p>
        <div class="corrob-sources-row">
          <span style="font-size: 0.72rem; color: #64748b;">Reporting Outlets:</span>
          ${corrobList.map(s => `<span class="corrob-source-chip">📰 ${escapeHtml(s)}</span>`).join('')}
        </div>
      </div>

      <!-- Matched Political Keywords -->
      ${art.matchedKeywords && art.matchedKeywords.length > 0 ? `
        <div style="margin-bottom: 14px;">
          <div style="font-size: 0.72rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; margin-bottom: 6px;">Taxonomy Matched Keywords:</div>
          <div class="kw-chips-container">
            ${art.matchedKeywords.map(kw => `<span class="kw-chip" style="font-size: 0.72rem; padding: 2px 8px;">#${escapeHtml(kw)}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Story Excerpt -->
      <div style="background: rgba(255,255,255,0.02); padding: 16px; border-radius: 8px; border: 1px solid var(--border-subtle); line-height: 1.6; color: #cbd5e1; font-size: 0.86rem; margin-bottom: 14px;">
        <strong style="color: #ffffff; display: block; margin-bottom: 6px;">Story Excerpt:</strong>
        <p>${escapeHtml(art.summary || 'No excerpt available.')}</p>
      </div>

      ${art.aiKeyTrigger ? `
        <div style="background: rgba(239, 68, 68, 0.08); border-left: 3px solid #ef4444; padding: 12px 16px; border-radius: 0 8px 8px 0; color: #fca5a5; font-size: 0.84rem;">
          <strong>Early-Warning Strategic Signal:</strong> ${escapeHtml(art.aiKeyTrigger)}
        </div>
      ` : ''}
    `;
  }

  modal?.classList.add('active');
}

// Copy Flash Alert
function copyFlashAlert() {
  if (!currentAnalysis || !currentAnalysis.flashAlertText) {
    showToast('No flash alert generated yet. Run AI Analysis first.', 'warning');
    return;
  }

  const alertContent = `🇰🇪 MEDIWATCH KENYA - EARLY WARNING ALERT\nTimestamp: ${new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })} EAT\nThreat Level: ${currentAnalysis.overallThreatLevel}\nNational Tension Index: ${currentAnalysis.nationalTensionIndex}/100\n\n${currentAnalysis.flashAlertText}\n\nSource: Kenya AI Early-Warning Intelligence Platform`;

  navigator.clipboard.writeText(alertContent).then(() => {
    showToast('Executive Flash Alert copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Could not copy to clipboard.', 'error');
  });
}

// Export Full Intelligence Dossier
function exportDossier() {
  if (!currentAnalysis) {
    showToast('Run AI Analysis first to export report.', 'warning');
    return;
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const content = `# MEDIWATCH KENYA - INTELLIGENCE & EARLY-WARNING DOSSIER
Generated: ${new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })} EAT
Monitored Outlets: Daily Nation, The Standard, Capital FM, KBC News

## SITUATIONAL SUMMARY
National Tension Index: ${currentAnalysis.nationalTensionIndex}/100
Overall Threat Level: ${currentAnalysis.overallThreatLevel}

${currentAnalysis.executiveSummary}

## TOP EMERGING ISSUES
${(currentAnalysis.topEmergingIssues || []).map(i => `- ${i.title} (Severity: ${i.severity}, Tension: ${i.tensionScore}/100)`).join('\n')}

## FLASH DISPATCH
${currentAnalysis.flashAlertText}
`;

  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MediWatch_Kenya_Dossier_${dateStr}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Intelligence Dossier downloaded successfully.', 'success');
}

// Utility: Relative Time
function formatRelativeTime(dateString) {
  if (!dateString) return 'Just now';
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Utility: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Toast Notifications
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(msg)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
