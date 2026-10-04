/**
 * MediWatch Authentication & Session Management
 * Standard Email/Password sign-in and sign-up with Supabase & local fallback.
 */

let currentUser = null;

// Initialize Auth on page load
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
});

async function initAuth() {
  // Check localStorage for saved session
  const savedUser = localStorage.getItem('mediwatch_user');
  const savedToken = localStorage.getItem('mediwatch_token');

  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      updateAuthUI(currentUser);
    } catch (e) {
      console.warn('Invalid stored session');
    }
  }

  // Check backend Supabase connection status
  try {
    const res = await fetch('/api/auth/status');
    const status = await res.json();
    console.log('[AUTH STATUS]', status);
  } catch (err) {
    console.warn('[AUTH STATUS] Offline check failed');
  }

  // Bind topbar auth button
  const authBtn = document.getElementById('btn-auth-modal');
  if (authBtn) {
    authBtn.addEventListener('click', () => {
      if (currentUser) {
        // Show profile / sign out prompt
        openProfileModal();
      } else {
        openAuthModal('signin');
      }
    });
  }
}

function updateAuthUI(user) {
  const authBtnLabel = document.getElementById('auth-btn-label');
  const authBtnIcon = document.getElementById('auth-btn-icon');
  if (authBtnLabel) {
    if (user && user.email) {
      const shortName = user.email.split('@')[0];
      authBtnLabel.innerText = shortName;
      if (authBtnIcon) authBtnIcon.innerText = '👤';
    } else {
      authBtnLabel.innerText = 'Sign In';
      if (authBtnIcon) authBtnIcon.innerText = '🔑';
    }
  }
}

function openAuthModal(mode = 'signin') {
  let modal = document.getElementById('auth-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card" style="max-width: 420px; width: 95%; background: #0b1a2f; border: 1px solid #1d3b63; border-radius: 2px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 28px; height: 28px; background: #112747; border: 1px solid #e4a83b; color: #e4a83b; display: flex; align-items: center; justify-content: center; font-weight: bold; border-radius: 2px;">MW</div>
          <h3 style="margin: 0; font-size: 16px; color: #ffffff;">${mode === 'signin' ? 'Sign In to MediWatch' : 'Create Account'}</h3>
        </div>
        <button onclick="closeAuthModal()" style="background: none; border: none; color: #8fa3bf; font-size: 18px; cursor: pointer;">✕</button>
      </div>

      <div style="background: #091628; border: 1px solid #142945; border-radius: 2px; padding: 12px; margin-bottom: 16px; font-size: 12px; color: #cbd5e1;">
        <span>🔒 Secure access powered by <strong>Supabase Auth</strong>. Single source of truth for media & social intelligence.</span>
      </div>

      <form id="auth-form" onsubmit="handleAuthSubmit(event, '${mode}')">
        ${mode === 'signup' ? `
          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 11px; text-transform: uppercase; color: #8fa3bf; margin-bottom: 6px; font-weight: 600;">Organization Name</label>
            <input type="text" id="auth-org" placeholder="e.g. Kenya Private Sector Alliance" style="width: 100%; box-sizing: border-box; background: #050d18; border: 1px solid #1d3b63; border-radius: 2px; padding: 8px 12px; color: #ffffff; font-size: 13px;" />
          </div>
        ` : ''}

        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 11px; text-transform: uppercase; color: #8fa3bf; margin-bottom: 6px; font-weight: 600;">Email Address</label>
          <input type="email" id="auth-email" required placeholder="analyst@organization.org" style="width: 100%; box-sizing: border-box; background: #050d18; border: 1px solid #1d3b63; border-radius: 2px; padding: 8px 12px; color: #ffffff; font-size: 13px;" />
        </div>

        <div style="margin-bottom: 18px;">
          <label style="display: block; font-size: 11px; text-transform: uppercase; color: #8fa3bf; margin-bottom: 6px; font-weight: 600;">Password</label>
          <input type="password" id="auth-password" required placeholder="••••••••••••" style="width: 100%; box-sizing: border-box; background: #050d18; border: 1px solid #1d3b63; border-radius: 2px; padding: 8px 12px; color: #ffffff; font-size: 13px;" />
        </div>

        <div id="auth-error-msg" style="display: none; background: #112747; border-left: 3px solid #e4a83b; padding: 8px 12px; font-size: 12px; color: #e4a83b; margin-bottom: 14px; border-radius: 2px;"></div>

        <button type="submit" id="auth-submit-btn" style="width: 100%; background: #e4a83b; color: #071324; border: none; border-radius: 2px; padding: 10px; font-weight: 700; font-size: 13px; cursor: pointer;">
          ${mode === 'signin' ? 'Sign In' : 'Register Account'}
        </button>
      </form>

      <div style="margin-top: 16px; text-align: center; font-size: 12px; color: #8fa3bf;">
        ${mode === 'signin' 
          ? `Don't have an account? <a href="#" onclick="openAuthModal('signup'); return false;" style="color: #e4a83b; text-decoration: underline;">Create one</a>`
          : `Already registered? <a href="#" onclick="openAuthModal('signin'); return false;" style="color: #e4a83b; text-decoration: underline;">Sign In</a>`}
      </div>
    </div>
  `;

  modal.style.display = 'flex';
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.style.display = 'none';
}

async function handleAuthSubmit(e, mode) {
  e.preventDefault();
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const orgInput = document.getElementById('auth-org');
  const org = orgInput ? orgInput.value : '';
  const errorMsg = document.getElementById('auth-error-msg');
  const submitBtn = document.getElementById('auth-submit-btn');

  if (errorMsg) errorMsg.style.display = 'none';
  if (submitBtn) {
    submitBtn.innerText = 'Processing...';
    submitBtn.disabled = true;
  }

  try {
    const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/signin';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, organizationName: org })
    });

    const data = await res.json();

    if (!data.success && data.error) {
      throw new Error(data.error);
    }

    // Success: store session
    currentUser = data.user || { email, organizationName: org };
    localStorage.setItem('mediwatch_user', JSON.stringify(currentUser));
    if (data.session && data.session.access_token) {
      localStorage.setItem('mediwatch_token', data.session.access_token);
    }

    updateAuthUI(currentUser);
    closeAuthModal();

    if (window.showToast) {
      window.showToast(mode === 'signup' ? 'Account created successfully!' : `Welcome back, ${email}`, 'info');
    }
  } catch (err) {
    if (errorMsg) {
      errorMsg.innerText = err.message || 'Authentication failed.';
      errorMsg.style.display = 'block';
    }
  } finally {
    if (submitBtn) {
      submitBtn.innerText = mode === 'signin' ? 'Sign In' : 'Register Account';
      submitBtn.disabled = false;
    }
  }
}

function openProfileModal() {
  let modal = document.getElementById('auth-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  const email = currentUser ? currentUser.email : 'Analyst';
  const org = (currentUser && currentUser.organizationName) ? currentUser.organizationName : 'National Intelligence Workspace';

  modal.innerHTML = `
    <div class="modal-card" style="max-width: 400px; width: 95%; background: #0b1a2f; border: 1px solid #1d3b63; border-radius: 2px; padding: 22px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="margin: 0; font-size: 15px; color: #ffffff;">Account Profile</h3>
        <button onclick="closeAuthModal()" style="background: none; border: none; color: #8fa3bf; font-size: 18px; cursor: pointer;">✕</button>
      </div>

      <div style="background: #091628; border: 1px solid #142945; border-radius: 2px; padding: 14px; margin-bottom: 16px;">
        <div style="font-size: 11px; color: #8fa3bf; text-transform: uppercase; font-weight: 600;">Active Account</div>
        <div style="font-size: 14px; font-weight: 700; color: #ffffff; margin: 4px 0;">${email}</div>
        <div style="font-size: 12px; color: #e4a83b;">${org}</div>
      </div>

      <button onclick="signOutUser()" style="width: 100%; background: #112747; border: 1px solid #1d3b63; color: #e4a83b; border-radius: 2px; padding: 8px 12px; cursor: pointer; font-size: 13px; font-weight: 600;">
        Sign Out
      </button>
    </div>
  `;

  modal.style.display = 'flex';
}

function signOutUser() {
  currentUser = null;
  localStorage.removeItem('mediwatch_user');
  localStorage.removeItem('mediwatch_token');
  updateAuthUI(null);
  closeAuthModal();
  if (window.showToast) {
    window.showToast('Signed out successfully.', 'info');
  }
}

// Export for app.js
window.mediwatchAuth = {
  getCurrentUser: () => currentUser,
  openAuthModal,
  closeAuthModal
};
