'use client';
import React, { useState } from 'react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialUser }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [org, setOrg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isSignUp ? 'signup' : 'signin',
          email,
          password,
          organizationName: org
        })
      });

      const data = await res.json();
      if (!data.success && data.error) throw new Error(data.error);

      const user = data.user || { email, organizationName: org };
      localStorage.setItem('mw_user', JSON.stringify(user));
      onAuthSuccess(user);
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card"
        style={{ width: '90%', maxWidth: '380px', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', color: '#ffffff' }}>
            {isSignUp ? 'Create Workspace Account' : 'Sign In to MediWatch'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8fa3bf', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isSignUp && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#8fa3bf', marginBottom: '4px', textTransform: 'uppercase' }}>Organization</label>
              <input
                type="text"
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                placeholder="e.g. Kenya Comms Council"
                style={{ width: '100%', background: '#050d18', border: '1px solid #1d3b63', borderRadius: '2px', padding: '8px 12px', color: '#fff', fontSize: '13px' }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#8fa3bf', marginBottom: '4px', textTransform: 'uppercase' }}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="analyst@organization.org"
              style={{ width: '100%', background: '#050d18', border: '1px solid #1d3b63', borderRadius: '2px', padding: '8px 12px', color: '#fff', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#8fa3bf', marginBottom: '4px', textTransform: 'uppercase' }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{ width: '100%', background: '#050d18', border: '1px solid #1d3b63', borderRadius: '2px', padding: '8px 12px', color: '#fff', fontSize: '13px' }}
            />
          </div>

          {error && (
            <div style={{ background: '#112747', borderLeft: '3px solid #e4a83b', padding: '8px', fontSize: '11px', color: '#e4a83b' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-gold" style={{ marginTop: '8px' }}>
            {loading ? 'Processing...' : (isSignUp ? 'Register Account' : 'Sign In')}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '11px', color: '#8fa3bf' }}>
          {isSignUp ? (
            <span>Already have an account? <a href="#" onClick={() => setIsSignUp(false)} style={{ color: '#e4a83b' }}>Sign in</a></span>
          ) : (
            <span>Need an account? <a href="#" onClick={() => setIsSignUp(true)} style={{ color: '#e4a83b' }}>Create one</a></span>
          )}
        </div>
      </div>
    </div>
  );
}
