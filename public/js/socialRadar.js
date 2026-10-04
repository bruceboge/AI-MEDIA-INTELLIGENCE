/**
 * MediWatch Kenya - Apify Social Media Monitor (X / Twitter)
 * Solid dark blue #071324, white, and #e4a83b palette with 2px corner radius.
 */
(function () {
  'use strict';

  let socialState = {
    isCached: false,
    hoursRemaining: 24,
    totalPosts: 0,
    accountsCount: 33,
    categories: {},
    hasToken: false,
    lastHarvestedAt: null
  };

  async function fetchSocialStatus() {
    try {
      const res = await fetch('/api/social/status');
      if (!res.ok) return;
      socialState = await res.json();
      updateSocialBadge();
      updateModalDetails();
    } catch (err) {
      console.warn('[SocialRadar] Could not fetch social status:', err.message);
    }
  }

  function updateSocialBadge() {
    let badge = document.getElementById('social-radar-pill');
    if (!badge) {
      const wrapper = document.getElementById('social-radar-pill-wrapper');
      const actions = document.querySelector('.topbar-actions');
      if (wrapper) {
        badge = document.createElement('div');
        badge.id = 'social-radar-pill';
        badge.className = 'timeframe-pill';
        badge.title = 'Click to open Social Media Monitor';
        badge.onclick = openSocialModal;
        wrapper.appendChild(badge);
      } else if (actions) {
        badge = document.createElement('div');
        badge.id = 'social-radar-pill';
        badge.className = 'timeframe-pill';
        badge.title = 'Click to open Social Media Monitor';
        badge.onclick = openSocialModal;
        actions.appendChild(badge);
      }
    }

    if (badge) {
      badge.style.cursor = 'pointer';
      badge.style.borderColor = 'rgba(228, 168, 59, 0.4)';
      badge.style.background = 'rgba(228, 168, 59, 0.12)';
      badge.style.borderRadius = '2px';
      badge.onclick = openSocialModal;

      const count = socialState.totalPosts || 0;
      badge.innerHTML = `
        <span style="color:#e4a83b;font-weight:700;">𝕏 Posts</span>
        <span class="divider">|</span>
        <span style="font-size:12px;color:#cbd5e1;">${count} saved</span>
        <span class="divider">|</span>
        <span style="font-size:12px;color:#e4a83b;font-weight:600;">24h Saved</span>
      `;
    }
  }

  function injectSocialModal() {
    if (document.getElementById('modal-social-radar')) return;

    const modal = document.createElement('div');
    modal.id = 'modal-social-radar';
    modal.className = 'modal-backdrop';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="modal-card" style="max-width: 780px; width: 95%; border-radius: 2px;">
        <div class="modal-header">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="background:#112747;color:#e4a83b;border:1px solid #e4a83b;width:34px;height:34px;border-radius:2px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px;">𝕏</div>
            <div>
              <h3 style="margin:0;font-size:18px;color:#ffffff;">Social Media Monitor (X / Twitter)</h3>
              <p style="margin:2px 0 0;font-size:12px;color:#8fa3bf;">Saved posts from 33 top Kenyan newsrooms, public offices, and leaders</p>
            </div>
          </div>
          <button class="modal-close-btn" id="btn-close-social-radar">✕</button>
        </div>

        <div class="modal-body" style="max-height:70vh;overflow-y:auto;padding:20px;">
          <!-- 24-Hour Save Status -->
          <div style="background:#112747;border:1px solid #1d3b63;border-left:3px solid #e4a83b;border-radius:2px;padding:14px;margin-bottom:18px;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
              <div>
                <strong style="color:#e4a83b;display:flex;align-items:center;gap:6px;font-size:14px;">
                  🛡️ 24-Hour Save Active (No Extra Costs)
                </strong>
                <p style="margin:4px 0 0;font-size:13px;color:#cbd5e1;">
                  Posts are saved in our database. The system only fetches new data once a day to save your API quota.
                </p>
              </div>
              <div style="text-align:right;">
                <span id="social-cache-time-left" style="font-size:16px;font-weight:bold;color:#e4a83b;">--h remaining</span>
                <div id="social-cache-status-tag" style="font-size:11px;color:#8fa3bf;">Status: Active</div>
              </div>
            </div>
          </div>

          <!-- Apify Token Configuration -->
          <div style="background:#091628;border:1px solid #142945;border-radius:2px;padding:16px;margin-bottom:18px;">
            <h4 style="margin:0 0 8px;font-size:14px;color:#ffffff;display:flex;align-items:center;gap:8px;">
              🔑 Apify API Key
              <span id="token-status-pill" style="font-size:11px;padding:2px 8px;border-radius:2px;background:#112747;color:#e4a83b;border:1px solid #1d3b63;">Checking...</span>
            </h4>
            <p style="font-size:12px;color:#8fa3bf;margin:0 0 10px;">
              Enter your Apify key from <a href="https://console.apify.com/account/integrations" target="_blank" style="color:#e4a83b;">console.apify.com</a> to pull fresh live posts.
            </p>
            <div style="display:flex;gap:10px;">
              <input type="password" id="input-apify-token" placeholder="apify_api_xxxxxxxxxxxxxxxxxxxxxx" style="flex:1;background:#050d18;border:1px solid #1d3b63;border-radius:2px;padding:8px 12px;color:#fff;font-size:13px;" />
              <button class="btn btn-secondary" id="btn-save-apify-token" style="white-space:nowrap;padding:8px 16px;">Save Key</button>
            </div>
          </div>

          <!-- Monitored Accounts Directory -->
          <div style="margin-bottom:18px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
              <h4 style="margin:0;font-size:14px;color:#ffffff;">🇰🇪 Monitored Accounts (33 Active Handles)</h4>
              <span style="font-size:12px;color:#8fa3bf;">5 Key Groups</span>
            </div>
            <div id="social-accounts-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));gap:10px;">
              <!-- Populated dynamically -->
            </div>
          </div>
        </div>

        <div class="modal-footer" style="display:flex;justify-content:space-between;align-items:center;">
          <button class="btn btn-danger" id="btn-force-harvest" style="font-size:12px;padding:8px 14px;">
            ⚡ Fetch New Posts Now
          </button>
          <button class="btn btn-primary" id="btn-close-social-radar-footer">Done</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('btn-close-social-radar').onclick = closeSocialModal;
    document.getElementById('btn-close-social-radar-footer').onclick = closeSocialModal;
    modal.onclick = (e) => {
      if (e.target === modal) closeSocialModal();
    };

    document.getElementById('btn-save-apify-token').onclick = saveApifyToken;
    document.getElementById('btn-force-harvest').onclick = forceHarvest;
  }

  function openSocialModal() {
    injectSocialModal();
    const modal = document.getElementById('modal-social-radar');
    if (modal) modal.style.display = 'flex';
    fetchSocialStatus();
    renderAccountsList();
  }

  function closeSocialModal() {
    const modal = document.getElementById('modal-social-radar');
    if (modal) modal.style.display = 'none';
  }

  function updateModalDetails() {
    const timeLeft = document.getElementById('social-cache-time-left');
    const statusTag = document.getElementById('social-cache-status-tag');
    const tokenPill = document.getElementById('token-status-pill');

    if (timeLeft) {
      timeLeft.innerText = `${socialState.hoursRemaining || 0}h remaining`;
    }
    if (statusTag) {
      statusTag.innerText = socialState.isCached
        ? `Saved in Database (${socialState.totalPosts} posts)`
        : 'Update Ready (Next scheduled run will fetch new posts)';
    }
    if (tokenPill) {
      if (socialState.hasToken) {
        tokenPill.innerText = 'Key Saved';
        tokenPill.style.background = '#112747';
        tokenPill.style.color = '#e4a83b';
        tokenPill.style.border = '1px solid #1d3b63';
      } else {
        tokenPill.innerText = 'No Key Saved';
        tokenPill.style.background = '#091628';
        tokenPill.style.color = '#8fa3bf';
        tokenPill.style.border = '1px solid #142945';
      }
    }
  }

  async function renderAccountsList() {
    const grid = document.getElementById('social-accounts-grid');
    if (!grid) return;

    try {
      const res = await fetch('/api/social/accounts');
      if (!res.ok) return;
      const data = await res.json();
      const categories = data.categories || {};

      const categoryLabels = {
        media: '📰 News Media',
        executive: '🏛️ Government & Presidency',
        security: '🛡️ Police & Courts',
        political: '⚖️ Political Leaders',
        civic: '🔍 Fact Checkers & Traffic'
      };

      let html = '';
      for (const [key, handles] of Object.entries(categories)) {
        const label = categoryLabels[key] || key.toUpperCase();
        html += `
          <div style="background:#091628;border:1px solid #142945;border-radius:2px;padding:10px;">
            <div style="font-size:12px;font-weight:700;margin-bottom:6px;color:#e4a83b;">${label} (${handles.length})</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;">
              ${handles.map(h => `<a href="https://x.com/${h}" target="_blank" style="text-decoration:none;font-size:11px;background:#112747;color:#cbd5e1;padding:2px 6px;border-radius:2px;border:1px solid #1d3b63;">@${h}</a>`).join('')}
            </div>
          </div>
        `;
      }
      grid.innerHTML = html;
    } catch (err) {
      console.warn('[SocialRadar] Error rendering accounts:', err.message);
    }
  }

  async function saveApifyToken() {
    const input = document.getElementById('input-apify-token');
    const token = (input?.value || '').trim();
    if (!token) {
      alert('Please enter your Apify API key.');
      return;
    }

    try {
      const btn = document.getElementById('btn-save-apify-token');
      btn.innerText = 'Saving...';
      btn.disabled = true;

      const res = await fetch('/api/config/apify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await res.json();
      if (res.ok) {
        alert('Apify key saved successfully!');
        input.value = '';
        fetchSocialStatus();
      } else {
        alert(`Failed to save key: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Error saving key: ${err.message}`);
    } finally {
      const btn = document.getElementById('btn-save-apify-token');
      if (btn) {
        btn.innerText = 'Save Key';
        btn.disabled = false;
      }
    }
  }

  async function forceHarvest() {
    const confirmRun = confirm(
      'Fetch fresh posts right now?\n\n' +
      'This will call the Apify scraper to pull the newest posts from the 33 accounts.\n' +
      'Click OK to proceed.'
    );
    if (!confirmRun) return;

    const btn = document.getElementById('btn-force-harvest');
    try {
      btn.innerText = 'Fetching posts... (takes about 30 seconds)';
      btn.disabled = true;

      const res = await fetch('/api/social/harvest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true })
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Finished!\n${data.postsCount || 0} posts processed.`);
        fetchSocialStatus();
        if (typeof window.loadArticles === 'function') {
          window.loadArticles();
        }
      } else {
        alert(`Notice: ${data.error || 'Server error'}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      if (btn) {
        btn.innerText = '⚡ Fetch New Posts Now';
        btn.disabled = false;
      }
    }
  }

  // Check status on load
  document.addEventListener('DOMContentLoaded', () => {
    fetchSocialStatus();
    setInterval(fetchSocialStatus, 60 * 1000);
  });

  window.SocialRadar = {
    openModal: openSocialModal,
    refreshStatus: fetchSocialStatus
  };
})();
