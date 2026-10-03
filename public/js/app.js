// Kenya Media Radar - Frontend Application Logic
let allArticles = [];
let activeFeeds = [];
let allMonitors = [];
let currentMonitorId = 'all';
let currentAnalysis = null;
let currentFilters = {
  source: 'All',
  topic: 'All',
  risk: 'All',
  sentiment: 'All',
  search: '',
  sort: 'newest'
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  initClock();
  initEventListeners();
  await loadStatus();
  await loadFeeds();
  await loadArticles();
  await loadLatestAnalysis();
  await loadMonitors();
  await selectMonitor('all');
});

// Real-Time EAT Clock (Nairobi Time UTC+3)
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
  // Header Action Buttons
  document.getElementById('btn-scan-feeds')?.addEventListener('click', triggerScan);
  document.getElementById('btn-run-analysis')?.addEventListener('click', triggerAnalysis);
  document.getElementById('btn-refresh-stream')?.addEventListener('click', loadArticles);
  document.getElementById('btn-copy-flash')?.addEventListener('click', copyFlashAlert);
  document.getElementById('btn-export-dossier')?.addEventListener('click', exportDossier);

  // Select All / AI Batch button
  const btnSelectAll = document.getElementById('btn-select-all');
  if (btnSelectAll) {
    btnSelectAll.addEventListener('click', () => {
      if (allArticles.length === 0) {
        showToast('No articles loaded. Scan feeds first.', 'warning');
        return;
      }
      showToast(`Selected top ${Math.min(25, allArticles.length)} articles for AI batch analysis. Click "Run AI Analysis" to process.`, 'info');
    });
  }

  // Real-Time Search & Clear
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

  // Source Pills Filtering
  document.querySelectorAll('#source-filter-pills .source-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#source-filter-pills .source-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilters.source = pill.dataset.source;
      renderArticles();
    });
  });

  // Dropdown Filters
  document.getElementById('topic-select')?.addEventListener('change', (e) => {
    currentFilters.topic = e.target.value;
    renderArticles();
  });

  document.getElementById('risk-select')?.addEventListener('change', (e) => {
    currentFilters.risk = e.target.value;
    renderArticles();
  });

  // Sort Selector
  document.getElementById('sort-select')?.addEventListener('change', (e) => {
    currentFilters.sort = e.target.value;
    renderArticles();
  });

  // Interactive Sentiment Legend Filter
  document.querySelectorAll('.sentiment-legend .sent-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const sent = tag.dataset.sent;
      if (currentFilters.sentiment === sent) {
        currentFilters.sentiment = 'All';
        tag.style.opacity = '1';
        showToast('Reset sentiment filter to All', 'info');
      } else {
        currentFilters.sentiment = sent;
        document.querySelectorAll('.sentiment-legend .sent-tag').forEach(t => t.style.opacity = '0.5');
        tag.style.opacity = '1';
        showToast(`Filtering for ${sent.toUpperCase()} stories`, 'info');
      }
      renderArticles();
    });
  });

  // Interactive National Tension Index Card -> Direct tab jump
  const tensionCard = document.getElementById('kpi-tension-card');
  if (tensionCard) {
    tensionCard.addEventListener('click', () => {
      const execBtn = document.querySelector('#intel-tabs-bar .intel-tab-btn[data-tab="tab-executive"]');
      if (execBtn) execBtn.click();
      document.getElementById('intelligence-container')?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Interactive Topic Radar
  const topicInput = document.getElementById('topic-radar-input');
  const btnTopicScan = document.getElementById('btn-topic-scan');
  
  if (btnTopicScan) {
    btnTopicScan.addEventListener('click', () => triggerTopicScan());
  }
  if (topicInput) {
    topicInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        triggerTopicScan();
      }
    });
  }

  // Preset topic tags click
  document.querySelectorAll('#active-topics-row .topic-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const topic = tag.dataset.topic;
      if (topicInput) topicInput.value = topic;
      document.querySelectorAll('#active-topics-row .topic-tag').forEach(t => t.classList.remove('active-tag'));
      tag.classList.add('active-tag');
      triggerTopicScan(topic);
    });
  });

  // 8-Pillar Intelligence Tabs
  document.querySelectorAll('#intel-tabs-bar .intel-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      document.querySelectorAll('#intel-tabs-bar .intel-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('#intelligence-container .intel-tab-pane').forEach(pane => {
        const isActive = pane.id === targetTab;
        pane.style.display = isActive ? 'block' : 'none';
        if (isActive) pane.classList.add('active');
        else pane.classList.remove('active');
      });
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

// Load App Status (No API key on frontend)
async function loadStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    
    // Update Neural Model Indicator in Header
    const modelLabel = document.getElementById('ai-model-label');
    if (modelLabel) {
      modelLabel.innerText = data.modelUsed ? data.modelUsed.replace('Google ', '') : 'Gemini 2.5 Flash';
    }

    if (data.lastScanTime) {
      const timeStr = new Date(data.lastScanTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const syncLabel = document.getElementById('last-sync-label');
      if (syncLabel) syncLabel.innerText = `Sync: ${timeStr} EAT`;
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
    const pill = document.getElementById('active-feeds-pill');
    if (pill) pill.innerText = activeFeeds.filter(f => f.active).length;
  } catch (err) {
    console.error('Failed to load feeds:', err);
  }
}

// Load Ingested Articles
async function loadArticles() {
  try {
    const res = await fetch('/api/articles?limit=150');
    allArticles = await res.json();
    
    updateTickerMarquee();
    renderArticles();
  } catch (err) {
    console.error('Failed to fetch articles:', err);
    showToast('Failed to load articles from backend.', 'error');
  }
}

// Render Articles with active filters and sorting
function renderArticles() {
  const streamList = document.getElementById('stream-list');
  const countBadge = document.getElementById('filtered-count-badge');
  if (!streamList) return;

  let filtered = allArticles.filter(art => {
    // Source filter
    if (currentFilters.source !== 'All') {
      if (art.sourceId !== currentFilters.source && !art.sourceName.toLowerCase().includes(currentFilters.source.toLowerCase())) {
        return false;
      }
    }
    // Topic filter
    if (currentFilters.topic !== 'All' && art.topic !== currentFilters.topic) {
      return false;
    }
    // Risk filter
    const effectiveRisk = art.aiRiskLevel || art.initialRisk || 'LOW';
    if (currentFilters.risk !== 'All' && effectiveRisk !== currentFilters.risk) {
      return false;
    }
    // Sentiment filter
    if (currentFilters.sentiment !== 'All') {
      const text = `${art.title} ${art.summary}`.toLowerCase();
      if (currentFilters.sentiment === 'pos' && !text.match(/boost|launch|reform|growth|deal|peace|agreement|recovery/)) return false;
      if (currentFilters.sentiment === 'neg' && !text.match(/loss|shortage|delay|debt|deficit|flaw|trouble|burden/)) return false;
      if (currentFilters.sentiment === 'heat' && !text.match(/protest|strike|corruption|clash|scandal|reject|probe|arrest|ultimatum/)) return false;
    }
    // Search query
    if (currentFilters.search) {
      const q = currentFilters.search.toLowerCase();
      const match = art.title.toLowerCase().includes(q) || (art.summary && art.summary.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Apply Sorting
  if (currentFilters.sort === 'risk') {
    const riskScore = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    filtered.sort((a, b) => {
      const rA = riskScore[a.aiRiskLevel || a.initialRisk || 'LOW'] || 1;
      const rB = riskScore[b.aiRiskLevel || b.initialRisk || 'LOW'] || 1;
      return rB - rA;
    });
  } else if (currentFilters.sort === 'source') {
    filtered.sort((a, b) => (a.sourceName || '').localeCompare(b.sourceName || ''));
  } else {
    // Newest first
    filtered.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));
  }

  if (countBadge) {
    countBadge.innerText = `${filtered.length} of ${allArticles.length} items`;
  }

  if (filtered.length === 0) {
    streamList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔎</div>
        <h3>No matching news articles found</h3>
        <p>Try clearing your search terms or changing your active outlet/topic filters.</p>
        <button class="btn btn-outline btn-sm" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  streamList.innerHTML = filtered.map(art => {
    const timeFormatted = formatRelativeTime(art.pubDate);
    const risk = art.aiRiskLevel || art.initialRisk || 'LOW';
    const riskClass = risk.toLowerCase();

    return `
      <div class="article-card" onclick="openArticleModal('${art.id}')" title="Click to view full analysis and story background">
        <div class="card-top-row">
          <span class="source-tag" style="background-color: ${art.sourceColor || '#0284c7'}" onclick="event.stopPropagation(); filterBySource('${escapeHtml(art.sourceName)}')">
            ${art.sourceName}
          </span>
          <span class="card-time">${timeFormatted}</span>
        </div>
        <h4 class="article-title">${escapeHtml(art.title)}</h4>
        <p class="article-summary">${escapeHtml(art.summary || '')}</p>
        <div class="card-bottom-row">
          <span class="topic-chip" onclick="event.stopPropagation(); filterByTopic('${escapeHtml(art.topic)}')">${art.topic}</span>
          <span class="risk-pill ${riskClass}">
            ${risk === 'HIGH' ? '⚠️ HIGH RISK' : risk === 'MEDIUM' ? '⚡ ELEVATED' : '✓ LOW RISK'}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

// Quick filter helper by Source
function filterBySource(sourceName) {
  const pills = document.querySelectorAll('#source-filter-pills .source-pill');
  let matched = false;
  pills.forEach(p => {
    if (p.dataset.source !== 'All' && sourceName.toLowerCase().includes(p.dataset.source.toLowerCase())) {
      p.click();
      matched = true;
    }
  });
  if (!matched) {
    currentFilters.source = sourceName;
    renderArticles();
  }
  showToast(`Filtered stream for: ${sourceName}`, 'info');
}

// Quick filter helper by Topic
function filterByTopic(topicName) {
  const topicSelect = document.getElementById('topic-select');
  if (topicSelect) {
    let matchedOption = Array.from(topicSelect.options).find(o => o.value.toLowerCase() === topicName.toLowerCase());
    if (matchedOption) {
      topicSelect.value = matchedOption.value;
      currentFilters.topic = matchedOption.value;
      renderArticles();
      showToast(`Filtered topic: ${topicName}`, 'info');
      return;
    }
  }
  triggerTopicScan(topicName);
}

// Reset all stream filters
function resetFilters() {
  currentFilters = {
    source: 'All',
    topic: 'All',
    risk: 'All',
    sentiment: 'All',
    search: '',
    sort: 'newest'
  };
  const searchInput = document.getElementById('stream-search');
  if (searchInput) searchInput.value = '';
  const clearSearchBtn = document.getElementById('btn-clear-search');
  if (clearSearchBtn) clearSearchBtn.style.display = 'none';

  document.querySelectorAll('#source-filter-pills .source-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.source === 'All');
  });
  document.querySelectorAll('.sentiment-legend .sent-tag').forEach(t => t.style.opacity = '1');

  const topicSelect = document.getElementById('topic-select');
  if (topicSelect) topicSelect.value = 'All';
  const riskSelect = document.getElementById('risk-select');
  if (riskSelect) riskSelect.value = 'All';
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = 'newest';

  renderArticles();
  showToast('All filters have been reset.', 'info');
}

// Ticker Update with clickable headlines
function updateTickerMarquee() {
  const ticker = document.getElementById('ticker-content');
  if (ticker && allArticles.length > 0) {
    const headlines = allArticles.slice(0, 10).map(a => `[${a.sourceName.split(' ')[0]}] ${a.title}`).join('   •   ');
    ticker.innerText = headlines;
  }
}

// Trigger Live RSS Ingestion Scan
async function triggerScan() {
  const btn = document.getElementById('btn-scan-feeds');
  const originalHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = `<span>⏳</span><span>Scanning Feeds...</span>`;
    btn.disabled = true;
  }

  showToast('Ingesting real-time feeds from Kenyan newsrooms...', 'info');

  try {
    const res = await fetch('/api/scan', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast(`Scan complete: ${data.addedCount} new articles ingested! Total: ${data.totalArticles}`, 'success');
      await loadArticles();
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

// Trigger Gemini AI Early-Warning Analysis
async function triggerAnalysis() {
  const btn = document.getElementById('btn-run-analysis');
  const originalHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = `<span>✨</span><span>Synthesizing Intelligence...</span>`;
    btn.disabled = true;
  }

  showToast('Gemini LLM synthesizing tension indicators & conflict forecasting...', 'info');

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
      showToast(`AI Synthesis completed via ${data.report.modelUsed || 'Gemini'}!`, 'success');
      await loadArticles();
      await selectMonitor(currentMonitorId);
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

// Trigger Topic Radar Scan
async function triggerTopicScan(selectedTopic) {
  const topicInput = document.getElementById('topic-radar-input');
  const topic = (selectedTopic || (topicInput ? topicInput.value : '')).trim();

  if (!topic || topic.length < 2) {
    showToast('Please type a topic (e.g. "healthcare", "corruption", "economy") to analyze.', 'warning');
    if (topicInput) topicInput.focus();
    return;
  }

  const btn = document.getElementById('btn-topic-scan');
  const originalHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = `<span>⏳</span> Analyzing "${escapeHtml(topic)}"...`;
    btn.disabled = true;
  }

  const tickerEl = document.getElementById('ticker-content');
  if (tickerEl) {
    tickerEl.innerText = `[TARGET RADAR] Filtering Kenyan news feeds for "${topic}" and synthesizing Gemini early-warning dossier...`;
  }

  showToast(`Scanning Kenyan media for "${topic}" and generating Gemini analysis...`, 'info');

  try {
    const res = await fetch('/api/topics/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    });
    const data = await res.json();

    if (data.success && data.report) {
      currentAnalysis = data.report;
      renderAnalysis(data.report);

      await loadArticles();

      const searchInput = document.getElementById('stream-search');
      const clearSearchBtn = document.getElementById('btn-clear-search');
      if (searchInput) {
        searchInput.value = topic;
        currentFilters.search = topic.toLowerCase();
        if (clearSearchBtn) clearSearchBtn.style.display = 'block';
        renderArticles();
      }

      const tagsRow = document.getElementById('active-topics-row');
      if (tagsRow) {
        let existingTag = tagsRow.querySelector(`.topic-tag[data-topic="${CSS.escape(topic)}"]`);
        tagsRow.querySelectorAll('.topic-tag').forEach(t => t.classList.remove('active-tag'));
        if (!existingTag) {
          const newTag = document.createElement('span');
          newTag.className = 'topic-tag active-tag';
          newTag.dataset.topic = topic;
          newTag.innerText = `🎯 ${topic}`;
          newTag.addEventListener('click', () => {
            if (topicInput) topicInput.value = topic;
            tagsRow.querySelectorAll('.topic-tag').forEach(t => t.classList.remove('active-tag'));
            newTag.classList.add('active-tag');
            triggerTopicScan(topic);
          });
          tagsRow.appendChild(newTag);
        } else {
          existingTag.classList.add('active-tag');
        }
      }

      showToast(`Radar targeted "${topic}": ${data.matchedFromCache} articles from cache, ${data.freshFetched} fresh items!`, 'success');
    } else {
      showToast(data.error || 'Topic scan failed.', 'error');
    }
  } catch (err) {
    console.error('Topic scan error:', err);
    showToast('Topic scan connection failed.', 'error');
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

// Render Analysis Report in Operations Center
function renderAnalysis(report) {
  // Update KPI Ribbon
  const tensionScore = report.nationalTensionIndex || 60;
  const tensionValEl = document.getElementById('tension-score-val');
  if (tensionValEl) tensionValEl.innerText = tensionScore;
  
  const threatBadge = document.getElementById('threat-level-badge');
  const tensionFill = document.getElementById('tension-meter-fill');
  const tensionDesc = document.getElementById('tension-desc');
  
  if (tensionFill) tensionFill.style.width = `${tensionScore}%`;
  
  if (tensionScore >= 75) {
    if (threatBadge) {
      threatBadge.innerText = 'HIGH TENSION';
      threatBadge.className = 'kpi-tag badge-danger';
    }
    if (tensionFill) tensionFill.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
    if (tensionDesc) tensionDesc.innerText = 'High Risk of Escalation';
  } else if (tensionScore >= 55) {
    if (threatBadge) {
      threatBadge.innerText = 'ELEVATED';
      threatBadge.className = 'kpi-tag badge-warning';
    }
    if (tensionFill) tensionFill.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
    if (tensionDesc) tensionDesc.innerText = 'Heated Political Contest';
  } else {
    if (threatBadge) {
      threatBadge.innerText = 'MODERATE';
      threatBadge.className = 'kpi-tag badge-success';
    }
    if (tensionFill) tensionFill.style.background = 'linear-gradient(90deg, #10b981, #059669)';
    if (tensionDesc) tensionDesc.innerText = 'Normal Discourse';
  }

  // Timestamp badge
  const time = report.analyzedAt ? new Date(report.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live';
  const topicTag = report.userTopic ? `[Topic: ${report.userTopic}] ` : '';
  const timestampBadge = document.getElementById('report-timestamp-badge');
  if (timestampBadge) {
    timestampBadge.innerText = `${topicTag}Synthesized at ${time} EAT • ${report.modelUsed || 'Gemini'}`;
  }

  // Flash Alert Card
  const flashText = document.getElementById('flash-alert-text');
  const flashBadge = document.getElementById('flash-severity-badge');

  if (flashText) flashText.innerText = report.flashAlertText || 'Early warning surveillance active across Kenyan media channels.';
  if (flashBadge) flashBadge.innerText = report.overallThreatLevel || 'MONITORED';

  // Executive Summary
  const execBox = document.getElementById('exec-summary-text');
  if (execBox) {
    const briefingTitle = execBox.previousElementSibling ? execBox.previousElementSibling.querySelector('h3') : null;
    if (briefingTitle) {
      briefingTitle.innerText = report.userTopic ? `Executive Situational Briefing: ${report.userTopic}` : 'Executive Situational Briefing';
    }
    execBox.innerHTML = report.executiveSummary ? escapeHtml(report.executiveSummary).replace(/\n\n/g, '<br><br>') : 'Analysis completed.';
  }

  // Top Emerging Issues
  const issuesContainer = document.getElementById('emerging-issues-list');
  if (issuesContainer && report.topEmergingIssues && report.topEmergingIssues.length > 0) {
    issuesContainer.innerHTML = report.topEmergingIssues.map(issue => `
      <div class="issue-card">
        <div class="issue-card-top">
          <span class="issue-title">${escapeHtml(issue.title)}</span>
          <span class="issue-tension-tag badge-${issue.severity === 'CRITICAL' || issue.severity === 'HIGH' ? 'danger' : 'warning'}">
            Tension ${issue.tensionScore || 70}/100
          </span>
        </div>
        <ul class="signals-list">
          ${(issue.warningSignals || []).map(sig => `<li>${escapeHtml(sig)}</li>`).join('')}
        </ul>
        ${issue.recommendedAction ? `
          <div class="issue-recommendation">
            <strong>Advisory / Early Action:</strong> ${escapeHtml(issue.recommendedAction)}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  // Regional Flashpoints
  const regionalContainer = document.getElementById('regional-flashpoints-list');
  if (regionalContainer && report.regionalFlashpoints && report.regionalFlashpoints.length > 0) {
    regionalContainer.innerHTML = report.regionalFlashpoints.map(reg => `
      <div class="region-card">
        <div class="region-header">
          <span class="region-name">${escapeHtml(reg.region)}</span>
          <span class="region-status badge-${reg.status === 'ALERT' ? 'danger' : reg.status === 'WATCH' ? 'warning' : 'success'}">
            ${reg.status}
          </span>
        </div>
        <p class="region-drivers">${escapeHtml(reg.drivers || '')}</p>
      </div>
    `).join('');
  }

  // Key Actors Under Watch
  const actorsContainer = document.getElementById('actors-list');
  if (actorsContainer && report.keyActorsUnderWatch && report.keyActorsUnderWatch.length > 0) {
    actorsContainer.innerHTML = report.keyActorsUnderWatch.map(actor => `
      <div class="actor-card">
        <div class="actor-name">
          <span>${escapeHtml(actor.name)}</span>
          <span class="actor-sentiment-badge">${escapeHtml(actor.sentiment || 'Active')}</span>
        </div>
        <p class="actor-role">${escapeHtml(actor.role || '')}</p>
      </div>
    `).join('');
  }

  // 8-Pillar Engine Renderers: Narratives, Claims, and Alerts
  const narratives = report.narratives || [];
  const claims = report.spreadingClaims || [];
  const alerts = report.activeAlerts || [];

  const narrEl = document.getElementById('kpi-narratives-count');
  if (narrEl) narrEl.innerText = narratives.length;

  const bNarr = document.getElementById('tab-badge-narratives');
  if (bNarr) bNarr.innerText = narratives.length;
  const bClaims = document.getElementById('tab-badge-claims');
  if (bClaims) bClaims.innerText = claims.length;
  const bAlerts = document.getElementById('tab-badge-alerts');
  if (bAlerts) bAlerts.innerText = alerts.length;

  renderNarratives(narratives);
  renderClaims(claims);
  renderAlerts(alerts);
}

// Render Clustered Narratives & Patient Zero Origins
function renderNarratives(narratives) {
  const container = document.getElementById('narratives-list');
  if (!container) return;

  if (!narratives || narratives.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🧭</div>
        <h3>No Narrative Clusters Formed</h3>
        <p>Run AI Analysis or scan a topic to group incoming stories into narratives.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = narratives.map(n => {
    const vLower = (n.growthRate || n.velocity || '').toLowerCase();
    const velClass = vLower.includes('surging') ? 'velocity-surging' : vLower.includes('escalating') ? 'velocity-escalating' : 'velocity-steady';
    const outlets = (n.sources || n.outletsCovering || []);
    const locations = (n.locations || ['National Scope']);

    return `
      <div class="narrative-card">
        <div class="narrative-top-row">
          <span class="narrative-domain-pill">${escapeHtml(n.domain || 'General')}</span>
          <span class="patient-zero-tag" title="First outlet to break or lead this story">
            <span>📻 Origin:</span> ${escapeHtml(n.originOutlet || 'Kenyan Press')}
          </span>
          <span class="velocity-pill ${velClass}">📈 ${escapeHtml(n.growthRate || n.velocity || 'ACTIVE')}</span>
        </div>
        <h3 class="narrative-title">${escapeHtml(n.title)}</h3>
        <p class="narrative-summary">${escapeHtml(n.summary || '')}</p>

        <div class="narrative-metrics-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 10px 0; background: rgba(0,0,0,0.25); padding: 8px 12px; border-radius: 8px; font-size: 0.78rem;">
          <div>📊 <strong>Mention Count:</strong> <span class="text-accent" style="font-weight: 700;">${n.mentionCount || n.articleCount || 1} articles</span></div>
          <div>📈 <strong>Growth Rate:</strong> <span class="${velClass}" style="padding: 1px 6px; border-radius: 4px; font-weight: 700;">${escapeHtml(n.growthRate || n.velocity || '+45% Steady')}</span></div>
          <div style="grid-column: span 2;">📍 <strong>Locations Affected:</strong> <span class="text-warning" style="font-weight: 600;">${locations.map(l => escapeHtml(l)).join(', ')}</span></div>
        </div>

        <div class="narrative-footer">
          <span><strong>${outlets.length}</strong> Sources Reporting:</span>
          <div class="outlets-chips">
            ${outlets.map(o => `<span class="outlet-chip" style="cursor: pointer;" onclick="filterBySource('${escapeHtml(o)}')">${escapeHtml(o)}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Render Atomic Spreading Claims & Verification Matrix
function renderClaims(claims) {
  const container = document.getElementById('claims-list');
  if (!container) return;

  if (!claims || claims.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚖️</div>
        <h3>No Spreading Claims Extracted</h3>
        <p>Run AI Analysis to extract atomic factual claims and evaluate cross-source contradictions.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = claims.map(c => {
    const status = (c.status || 'UNVERIFIED').toUpperCase();
    const statusClass = status === 'VERIFIED' ? 'claim-status-verified' : status === 'DISPUTED' ? 'claim-status-disputed' : 'claim-status-unverified';

    return `
      <div class="claim-card ${c.hasContradiction ? 'has-dispute' : ''}">
        <div class="claim-header">
          <span class="claim-status-badge ${statusClass}">
            ${status === 'DISPUTED' ? '⚠️ DISPUTED CLAIM' : status === 'VERIFIED' ? '✅ VERIFIED' : '⏳ UNVERIFIED'}
          </span>
          <span class="velocity-pill ${c.velocityScore >= 70 ? 'velocity-surging' : 'velocity-escalating'}">
            ⚡ ${escapeHtml(c.velocityLabel || 'SPREADING')} (${c.velocityScore || 65}/100)
          </span>
        </div>
        <p class="claim-text">"${escapeHtml(c.claim)}"</p>
        <p class="claim-claimant">Source / Claimant: <strong>${escapeHtml(c.claimant || 'Media Report')}</strong></p>

        ${c.hasContradiction ? `
          <div class="contradiction-box">
            <span class="warn-icon">⚡</span>
            <div>
              <strong>CONTRADICTION DETECTED:</strong> ${escapeHtml(c.contradictionDetails || 'Contradictory accounts reported across media outlets.')}
            </div>
          </div>
        ` : ''}

        <div class="evidence-matrix">
          <div class="evidence-col">
            <div class="evidence-col-title support">🟢 Corroborating Evidence (${(c.supportingEvidence || []).length})</div>
            ${(c.supportingEvidence && c.supportingEvidence.length > 0) ? c.supportingEvidence.map(ev => `
              <div class="evidence-item">
                <span class="evidence-outlet">[${escapeHtml(ev.outlet || 'Source')}]:</span> ${escapeHtml(ev.quoteOrProof || '')}
              </div>
            `).join('') : '<p class="text-dim text-xs">No primary citations attached yet.</p>'}
          </div>

          <div class="evidence-col">
            <div class="evidence-col-title refute">🔴 Counter-Evidence / Denials (${(c.refutingEvidence || []).length})</div>
            ${(c.refutingEvidence && c.refutingEvidence.length > 0) ? c.refutingEvidence.map(ev => `
              <div class="evidence-item">
                <span class="evidence-outlet">[${escapeHtml(ev.outlet || 'Rejoinder')}]:</span> ${escapeHtml(ev.quoteOrProof || '')}
              </div>
            `).join('') : '<p class="text-dim text-xs">No active counter-claims logged.</p>'}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Render Strategic Alerts with Copy Action
function renderAlerts(alerts) {
  const container = document.getElementById('alerts-list');
  if (!container) return;

  if (!alerts || alerts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛡️</div>
        <h3>No Critical Alert Triggers Active</h3>
        <p>All monitored narratives and claims are within baseline stability parameters.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = alerts.map((a, idx) => {
    const sev = (a.severity || 'WATCH').toLowerCase();
    const sevClass = sev === 'critical' ? 'critical' : sev === 'high' ? 'high' : 'watch';

    return `
      <div class="alert-card ${sev === 'critical' ? 'severity-critical' : ''}">
        <div class="alert-top">
          <span class="alert-severity-pill ${sevClass}">🚨 ${escapeHtml(a.severity || 'ALERT')}</span>
          <span class="narrative-domain-pill">${escapeHtml(a.triggerType || 'EARLY_WARNING')}</span>
        </div>
        <h4 class="alert-title">${escapeHtml(a.title)}</h4>
        <p class="alert-desc">${escapeHtml(a.description)}</p>
        ${a.actionableAdvisory ? `
          <div class="advisory-box">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span class="advisory-label">💡 Recommended Stakeholder Advisory:</span>
              <button class="btn btn-xs btn-outline" style="font-size: 0.7rem; padding: 2px 8px;" onclick="copyTextToClipboard('${escapeHtml(a.actionableAdvisory)}', 'Advisory copied!')">
                📋 Copy
              </button>
            </div>
            ${escapeHtml(a.actionableAdvisory)}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

// Copy Text Helper
function copyTextToClipboard(text, successMsg = 'Copied to clipboard!') {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast(successMsg, 'success'))
      .catch(() => fallbackCopy(text, successMsg));
  } else {
    fallbackCopy(text, successMsg);
  }
}

// Copy Executive Flash Alert with fallback
function copyFlashAlert() {
  if (!currentAnalysis || !currentAnalysis.flashAlertText) {
    showToast('No flash alert generated yet. Run AI Analysis first.', 'warning');
    return;
  }

  const alertContent = `🇰🇪 KENYA MEDIA RADAR - EARLY WARNING ALERT\nTimestamp: ${new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })} EAT\nThreat Level: ${currentAnalysis.overallThreatLevel}\nNational Tension Index: ${currentAnalysis.nationalTensionIndex}/100\n\n${currentAnalysis.flashAlertText}\n\nSource: Kenya AI Early-Warning Intelligence Platform`;

  copyTextToClipboard(alertContent, 'Executive Flash Alert copied to clipboard!');
}

function fallbackCopy(text, successMsg = 'Copied to clipboard!') {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(successMsg, 'success');
  } catch (e) {
    showToast('Could not copy to clipboard.', 'error');
  }
}

// Export Full Intelligence Dossier
function exportDossier() {
  if (!currentAnalysis) {
    showToast('Run AI Analysis first to export report.', 'warning');
    return;
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const content = `# KENYA MEDIA INTELLIGENCE & EARLY-WARNING DOSSIER
Generated: ${new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })} EAT
Cognitive Model: ${currentAnalysis.modelUsed || 'Google Gemini'}
Monitored Outlets: Daily Nation, The Standard, Capital FM, KBC News

## SITUATIONAL SUMMARY
National Tension Index: ${currentAnalysis.nationalTensionIndex}/100
Overall Threat Level: ${currentAnalysis.overallThreatLevel}

${currentAnalysis.executiveSummary}

## TOP EMERGING ISSUES & EARLY WARNING SIGNALS
${(currentAnalysis.topEmergingIssues || []).map(i => `
### ${i.title} (${i.category}) - Severity: ${i.severity}
Tension Score: ${i.tensionScore}/100
Hotspots: ${(i.hotspots || []).join(', ')}
Warning Signals:
${(i.warningSignals || []).map(s => `- ${s}`).join('\n')}
Advisory: ${i.recommendedAction || 'N/A'}
`).join('\n')}

## REGIONAL FLASHPOINTS
${(currentAnalysis.regionalFlashpoints || []).map(r => `- **${r.region}** [${r.status}]: ${r.drivers}`).join('\n')}

## FLASH DISPATCH
${currentAnalysis.flashAlertText}
`;

  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Kenya_Media_Intelligence_Dossier_${dateStr}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Intelligence Dossier downloaded successfully.', 'success');
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
  if (linkEl) linkEl.href = art.link;

  const risk = art.aiRiskLevel || art.initialRisk || 'LOW';

  if (body) {
    body.innerHTML = `
      <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 14px; flex-wrap: wrap;">
        <span class="source-tag" style="background-color: ${art.sourceColor || '#0284c7'}">${art.sourceName}</span>
        <span class="topic-chip">${art.topic}</span>
        <span class="risk-pill ${risk.toLowerCase()}">${risk} RISK</span>
        <span class="card-time" style="margin-left: auto;">${new Date(art.pubDate).toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })} EAT</span>
      </div>
      <div style="background: rgba(255,255,255,0.03); padding: 16px; border-radius: 8px; border: 1px solid var(--border-subtle); line-height: 1.6; color: #cbd5e1; font-size: 0.86rem;">
        <strong>Story Excerpt / Summary:</strong>
        <p style="margin-top: 8px;">${escapeHtml(art.summary)}</p>
      </div>
      ${art.aiKeyTrigger ? `
        <div style="margin-top: 14px; background: rgba(239, 68, 68, 0.08); border-left: 3px solid #ef4444; padding: 12px 16px; border-radius: 0 8px 8px 0; color: #fca5a5; font-size: 0.84rem;">
          <strong>Early-Warning Detection Signal:</strong> ${escapeHtml(art.aiKeyTrigger)}
        </div>
      ` : ''}
      <div style="margin-top: 14px; display: flex; gap: 8px;">
        <button class="btn btn-outline btn-sm" onclick="filterByTopic('${escapeHtml(art.topic)}')">🎯 Focus Topic: ${escapeHtml(art.topic)}</button>
        <button class="btn btn-outline btn-sm" onclick="copyTextToClipboard('${escapeHtml(art.title)}', 'Headline copied!')">📋 Copy Title</button>
      </div>
    `;
  }

  modal?.classList.add('active');
}

// Feeds Modal Rendering with Toggle and Delete
function renderFeedsModal() {
  const list = document.getElementById('modal-feeds-list');
  if (!list) return;

  list.innerHTML = activeFeeds.map(f => `
    <div class="feed-row-item">
      <div class="feed-row-left">
        <span class="feed-dot" style="background-color: ${f.color}"></span>
        <div>
          <div class="feed-row-name">${escapeHtml(f.name)}</div>
          <div class="feed-row-url">${escapeHtml(f.url)}</div>
        </div>
      </div>
      <div class="feed-row-actions" style="display: flex; gap: 8px; align-items: center;">
        <button class="badge ${f.active ? 'badge-success' : 'badge-danger'}" style="cursor: pointer; border: none; font-size: 0.72rem; padding: 3px 8px;" onclick="toggleFeed('${f.id}')" title="Click to toggle active monitoring">
          ${f.active ? 'ACTIVE' : 'PAUSED'}
        </button>
        <button class="btn btn-outline" style="padding: 2px 7px; font-size: 0.72rem; color: #ef4444; border-color: rgba(239, 68, 68, 0.3); border-radius: 4px;" onclick="deleteFeed('${f.id}')" title="Delete Feed">
          ✕
        </button>
      </div>
    </div>
  `).join('');
}

// Toggle Feed Active Status
async function toggleFeed(feedId) {
  try {
    const res = await fetch(`/api/feeds/${feedId}/toggle`, { method: 'PATCH' });
    const data = await res.json();
    if (data.success) {
      activeFeeds = data.feeds;
      renderFeedsModal();
      const pill = document.getElementById('active-feeds-pill');
      if (pill) pill.innerText = activeFeeds.filter(f => f.active).length;
      showToast(`Feed status updated: ${data.feed.name} is now ${data.feed.active ? 'ACTIVE' : 'PAUSED'}`, 'info');
    }
  } catch (err) {
    showToast('Failed to toggle feed.', 'error');
  }
}

// Delete Feed
async function deleteFeed(feedId) {
  const feed = activeFeeds.find(f => f.id === feedId);
  if (!confirm(`Remove "${feed?.name || 'this feed'}" from monitored sources?`)) return;
  try {
    const res = await fetch(`/api/feeds/${feedId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      activeFeeds = data.feeds;
      renderFeedsModal();
      const pill = document.getElementById('active-feeds-pill');
      if (pill) pill.innerText = activeFeeds.filter(f => f.active).length;
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
  }, 4000);
}

// Feature 2: Sector & Entity Monitors Engine
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

// Render Monitors Bar Pills
function renderMonitorsBar() {
  const container = document.getElementById('monitors-pills-list');
  if (!container) return;

  const allPill = `
    <button class="monitor-pill ${currentMonitorId === 'all' ? 'active' : ''}" onclick="selectMonitor('all')">
      <span>🌐</span> All News
    </button>
  `;

  const defaultIds = ['monitor_energy', 'monitor_genz', 'monitor_taxation', 'monitor_elections'];

  const monitorPills = allMonitors.map(m => `
    <div style="display: inline-flex; align-items: center; position: relative;">
      <button class="monitor-pill ${currentMonitorId === m.id ? 'active' : ''}" onclick="selectMonitor('${m.id}')">
        <span>${m.icon || '🎯'}</span> ${escapeHtml(m.name)}
      </button>
      ${!defaultIds.includes(m.id) ? `
        <button onclick="deleteMonitor('${m.id}', event)" title="Delete custom monitor" style="background: none; border: none; color: #94a3b8; font-size: 0.72rem; cursor: pointer; padding: 2px 4px; margin-left: -8px; margin-right: 6px; z-index: 2;">✕</button>
      ` : ''}
    </div>
  `).join('');

  container.innerHTML = allPill + monitorPills;
}

// Delete Custom Monitor
async function deleteMonitor(id, e) {
  if (e) e.stopPropagation();
  const monitor = allMonitors.find(m => m.id === id);
  if (!confirm(`Delete custom monitor "${monitor?.name || ''}"?`)) return;

  try {
    const res = await fetch(`/api/monitors/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      allMonitors = data.monitors;
      showToast('Monitor deleted.', 'info');
      if (currentMonitorId === id) {
        selectMonitor('all');
      } else {
        renderMonitorsBar();
      }
    }
  } catch (err) {
    showToast('Failed to delete monitor.', 'error');
  }
}

// Select Active Monitor & Update Dashboard Analytics (Feature 1, 2, 3, 4)
async function selectMonitor(monitorId) {
  currentMonitorId = monitorId;
  renderMonitorsBar();

  try {
    const url = monitorId === 'all' ? '/api/dashboard/overview' : `/api/monitors/${monitorId}/analytics`;
    const res = await fetch(url);
    if (!res.ok) return;

    const data = await res.json();

    // 1. Dashboard Metrics (Feature 1)
    const mentionsVal = document.getElementById('kpi-total-mentions-val');
    if (mentionsVal) mentionsVal.innerText = data.totalMentions;

    const monitorNameBadge = document.getElementById('kpi-monitor-name-badge');
    if (monitorNameBadge) monitorNameBadge.innerText = data.monitorName;

    const volumeRate = document.getElementById('kpi-volume-rate');
    if (volumeRate) volumeRate.innerText = `Baseline: ${data.baselinePerDay}/day (Current: ${data.currentDayMentions})`;

    const narrCount = document.getElementById('kpi-narratives-count');
    if (narrCount) narrCount.innerText = (data.trendingNarratives || []).length;

    const alertsCount = document.getElementById('kpi-alerts-count-val');
    if (alertsCount) alertsCount.innerText = data.alertCount;

    const spikeStatus = document.getElementById('kpi-spike-status');
    if (spikeStatus) {
      if (data.isSpike) {
        spikeStatus.innerText = `🚨 ${data.spikeRatio}x Velocity Spike!`;
        spikeStatus.className = 'text-danger';
      } else {
        spikeStatus.innerText = `Baseline Normal (${data.spikeRatio}x)`;
        spikeStatus.className = 'text-success';
      }
    }

    // 2. Trend Spike Anomaly Banner (Feature 4)
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

    // 3. Sentiment Overview (Feature 1)
    if (data.sentimentOverview) {
      const s = data.sentimentOverview;
      const posBar = document.getElementById('sent-pos-bar');
      const neutBar = document.getElementById('sent-neut-bar');
      const negBar = document.getElementById('sent-neg-bar');
      const heatBar = document.getElementById('sent-heat-bar');

      if (posBar) posBar.style.width = `${s.positivePct}%`;
      if (neutBar) neutBar.style.width = `${s.neutralPct}%`;
      if (negBar) negBar.style.width = `${s.negativePct}%`;
      if (heatBar) heatBar.style.width = `${s.heatedPct}%`;

      const posVal = document.getElementById('sent-pos-val');
      if (posVal) posVal.innerText = `${s.positivePct}% (${s.positiveCount})`;
      const neutVal = document.getElementById('sent-neut-val');
      if (neutVal) neutVal.innerText = `${s.neutralPct}% (${s.neutralCount})`;
      const negVal = document.getElementById('sent-neg-val');
      if (negVal) negVal.innerText = `${s.negativePct}% (${s.negativeCount})`;
      const heatVal = document.getElementById('sent-heat-val');
      if (heatVal) heatVal.innerText = `${s.heatedPct}% (${s.heatedCount})`;
    }

    // 4. Source Distribution (Feature 1)
    const sourceChipsContainer = document.getElementById('source-distribution-chips');
    if (sourceChipsContainer && data.sourceDistribution) {
      const sources = Object.entries(data.sourceDistribution);
      const distCount = document.getElementById('source-dist-count');
      if (distCount) distCount.innerText = `${sources.length} Media Outlets`;
      sourceChipsContainer.innerHTML = sources.map(([name, count]) => `
        <div class="source-chip-item" onclick="filterBySource('${escapeHtml(name)}')">
          <span>📰 ${escapeHtml(name)}</span>
          <span class="source-chip-count">${count}</span>
        </div>
      `).join('') || '<span class="text-dim text-xs">No active mentions</span>';
    }

    // 5. Mention Trends Chart (Feature 1)
    const trendsChart = document.getElementById('mention-trends-chart');
    if (trendsChart && data.mentionTrends) {
      const maxCount = Math.max(1, ...data.mentionTrends.map(t => t.count));
      const trendSummary = document.getElementById('mention-trend-summary');
      if (trendSummary) trendSummary.innerText = `Peak: ${maxCount} mentions/interval`;

      trendsChart.innerHTML = data.mentionTrends.map(t => {
        const heightPct = Math.max(10, Math.round((t.count / maxCount) * 100));
        return `
          <div class="trend-bar-col" title="${t.label}: ${t.count} mentions">
            <span class="trend-bar-val">${t.count}</span>
            <div class="trend-bar-fill" style="height: ${heightPct}%;"></div>
            <span class="trend-bar-label">${t.label.split(' - ')[0]}</span>
          </div>
        `;
      }).join('');
    }

    // 6. Narrative Detection (Feature 3)
    if (data.trendingNarratives) {
      renderNarratives(data.trendingNarratives);
    }

    // 7. Auto-filter article stream to monitor keywords if specific
    if (monitorId !== 'all') {
      const selectedMon = allMonitors.find(m => m.id === monitorId);
      if (selectedMon) {
        const searchInput = document.getElementById('stream-search');
        if (searchInput) {
          searchInput.value = selectedMon.keywords[0] || selectedMon.name;
          currentFilters.search = (selectedMon.keywords[0] || selectedMon.name).toLowerCase();
          const clearSearchBtn = document.getElementById('btn-clear-search');
          if (clearSearchBtn) clearSearchBtn.style.display = 'block';
          renderArticles();
        }
      }
    } else {
      const searchInput = document.getElementById('stream-search');
      if (searchInput && searchInput.value) {
        searchInput.value = '';
        currentFilters.search = '';
        const clearSearchBtn = document.getElementById('btn-clear-search');
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        renderArticles();
      }
    }

  } catch (err) {
    console.error('Error fetching monitor analytics:', err);
  }
}

// Create New Custom Sector / Entity Monitor (Feature 2)
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
