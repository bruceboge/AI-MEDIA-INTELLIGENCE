'use client';
import React, { useState, useEffect } from 'react';

export default function SocialRadarModal({ isOpen, onClose }) {
  const [posts, setPosts] = useState([]);
  const [accounts, setAccounts] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isHarvesting, setIsHarvesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resP, resA, resS] = await Promise.all([
        fetch('/api/social?type=posts'),
        fetch('/api/social?type=accounts'),
        fetch('/api/social?type=status')
      ]);
      setPosts(await resP.json());
      setAccounts(await resA.json());
      setStatus(await resS.json());
    } catch (e) {
      console.warn('Social radar load warning');
    } finally {
      setLoading(false);
    }
  };

  const handleForceHarvest = async () => {
    setIsHarvesting(true);
    try {
      await fetch('/api/extract/apify', { method: 'POST' });
      await loadData();
    } catch (e) {
      console.warn('Harvest failed');
    } finally {
      setIsHarvesting(false);
    }
  };

  if (!isOpen) return null;

  const isCached = Boolean(status && status.isCached && status.hoursRemaining > 0);
  const hoursRemaining = status ? (status.hoursRemaining !== undefined ? status.hoursRemaining : 0) : 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card"
        style={{ width: '92%', maxWidth: '780px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#ffffff' }}>Social Media Radar (𝕏 / Twitter)</h3>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#8fa3bf' }}>
              33 Monitored Kenyan Newsrooms, State Offices & Leaders via Apify Scraper
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8fa3bf', fontSize: '18px', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Dynamic Cache Status Banner */}
        <div style={{
          background: isCached ? '#091628' : '#141a24',
          border: '1px solid ' + (isCached ? '#142945' : '#e4a83b'),
          borderLeft: '4px solid ' + (isCached ? '#1d9bf0' : '#e4a83b'),
          borderRadius: '2px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <strong style={{ fontSize: '12px', color: isCached ? '#1d9bf0' : '#e4a83b' }}>
              {isCached ? '24-Hour Quota Protection Active' : 'Cache Shield Expired / Reset'}
            </strong>
            <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>
              {isCached
                ? `${hoursRemaining}h remaining until next automated scrape window`
                : '0.0h remaining — Next extraction will harvest live from Apify cloud'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`badge-sentiment ${isCached ? 'pos' : 'neut'}`}>
              {isCached ? 'CACHED' : 'RESET / LIVE'}
            </span>

            <button
              onClick={handleForceHarvest}
              disabled={isHarvesting}
              style={{
                background: '#112747',
                border: '1px solid #e4a83b',
                color: '#e4a83b',
                padding: '4px 10px',
                borderRadius: '2px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: isHarvesting ? 'not-allowed' : 'pointer'
              }}
            >
              {isHarvesting ? '⏳ Harvesting...' : '⚡ Force Harvest Now'}
            </button>
          </div>
        </div>

        {/* Accounts Overview Chips */}
        {accounts && accounts.categories && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {Object.entries(accounts.categories).map(([cat, handles]) => (
              <span
                key={cat}
                style={{
                  fontSize: '10px',
                  background: '#071324',
                  border: '1px solid #142945',
                  padding: '3px 8px',
                  borderRadius: '2px',
                  color: '#8fa3bf'
                }}
              >
                <strong style={{ color: '#ffffff', textTransform: 'capitalize' }}>{cat}:</strong> {handles.length} handles
              </span>
            ))}
          </div>
        )}

        {/* Posts List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#8fa3bf', fontSize: '12px' }}>
              Loading posts...
            </div>
          ) : posts.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#8fa3bf', fontSize: '12px' }}>
              No saved posts in database. Click "Force Harvest Now" to extract live posts.
            </div>
          ) : (
            posts.map((p, idx) => (
              <div
                key={p.id || idx}
                style={{
                  background: '#050d18',
                  border: '1px solid #142945',
                  borderLeft: '3px solid #1d9bf0',
                  borderRadius: '2px',
                  padding: '10px 14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '12px', color: '#ffffff' }}>{p.authorName || p.authorHandle}</strong>
                    <span style={{ fontSize: '11px', color: '#8fa3bf' }}>@{p.authorHandle || p.handle}</span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#e4a83b', fontWeight: 600 }}>
                    {p.topic || p.category || 'Politics'}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.4, marginBottom: '6px' }}>
                  {p.summary || p.text || p.title}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#8fa3bf' }}>
                  {p.metrics ? (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span>❤️ {p.metrics.likes || 0}</span>
                      <span>🔁 {p.metrics.retweets || 0}</span>
                      <span>💬 {p.metrics.replies || 0}</span>
                    </div>
                  ) : <span />}

                  {p.link && (
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1d9bf0', textDecoration: 'none', fontWeight: 600 }}
                    >
                      View on 𝕏 ↗
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
