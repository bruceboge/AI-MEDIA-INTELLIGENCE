'use client';
import React, { useState, useEffect } from 'react';

export default function ViewDataModal({ isOpen, onClose, onRefreshData }) {
  const [items, setItems] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all', 'rss', 'social_x'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({ total: 0, rss: 0, social: 0 });

  useEffect(() => {
    if (isOpen) {
      loadDatabaseContent();
      loadSessions();
    }
  }, [isOpen, selectedSession, sourceFilter, categoryFilter]);

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/database?type=sessions');
      const data = await res.json();
      if (Array.isArray(data.sessions)) {
        // Filter out empty ghost sessions
        setSessions(data.sessions.filter(s => (s.items_count || 0) > 0));
      }
    } catch (e) {
      console.warn('Could not load sessions');
    }
  };

  const loadDatabaseContent = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sourceFilter && sourceFilter !== 'all') params.set('source', sourceFilter);
      if (categoryFilter && categoryFilter !== 'all') params.set('category', categoryFilter);
      if (selectedSession && selectedSession !== 'all') params.set('sessionId', selectedSession);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/database?${params.toString()}`);
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
        setCounts({
          total: data.totalCount || data.items.length,
          rss: data.rssCount || data.items.filter(i => i.source_type === 'rss').length,
          social: data.socialCount || data.items.filter(i => i.source_type === 'social_x').length
        });
      }
    } catch (err) {
      console.error('Failed to load database items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSourceTabChange = (newSource) => {
    setSourceFilter(newSource);
    // Reset session filter if current session doesn't match the new tab
    if (selectedSession !== 'all') {
      const current = sessions.find(s => s.id === selectedSession);
      if (current && newSource !== 'all' && current.session_type !== newSource) {
        setSelectedSession('all');
      }
    }
  };

  const handleResetFilters = () => {
    setSourceFilter('all');
    setSelectedSession('all');
    setCategoryFilter('all');
    setSearchQuery('');
  };

  const formatSafeTime = (dateStr) => {
    if (!dateStr) return 'Live';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? 'Live' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Live';
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(7, 19, 36, 0.85)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#071324',
        border: '1px solid #1d3b63',
        borderRadius: '2px',
        width: '100%',
        maxWidth: '1100px',
        height: '88vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #142945',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🗄️</span>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#ffffff', fontWeight: 800 }}>
                Persistent Database Aggregation Explorer
              </h3>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#8fa3bf' }}>
              Real-time records from Supabase Postgres Cloud & Persistent Intelligence Store
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                loadDatabaseContent();
                loadSessions();
                if (onRefreshData) onRefreshData();
              }}
              style={{
                background: '#112747',
                border: '1px solid #1d3b63',
                color: '#e4a83b',
                padding: '5px 12px',
                borderRadius: '2px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🔄 Refresh DB
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#8fa3bf',
                fontSize: '20px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div style={{
          padding: '12px 20px',
          background: '#091628',
          borderBottom: '1px solid #142945',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Source Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: '#050d18', padding: '3px', borderRadius: '2px', border: '1px solid #142945' }}>
            <button
              onClick={() => handleSourceTabChange('all')}
              style={{
                background: sourceFilter === 'all' ? '#e4a83b' : 'transparent',
                color: sourceFilter === 'all' ? '#071324' : '#cbd5e1',
                border: 'none',
                borderRadius: '2px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              All Records ({counts.total})
            </button>
            <button
              onClick={() => handleSourceTabChange('rss')}
              style={{
                background: sourceFilter === 'rss' ? '#e4a83b' : 'transparent',
                color: sourceFilter === 'rss' ? '#071324' : '#cbd5e1',
                border: 'none',
                borderRadius: '2px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              📰 RSS News ({counts.rss})
            </button>
            <button
              onClick={() => handleSourceTabChange('social_x')}
              style={{
                background: sourceFilter === 'social_x' ? '#e4a83b' : 'transparent',
                color: sourceFilter === 'social_x' ? '#071324' : '#cbd5e1',
                border: 'none',
                borderRadius: '2px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              𝕏 Apify Scraped ({counts.social})
            </button>
          </div>

          {/* Session Selector & Keyword Search */}
          <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '320px', justifyContent: 'flex-end' }}>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              style={{
                background: '#071324',
                color: '#ffffff',
                border: '1px solid #1d3b63',
                borderRadius: '2px',
                padding: '4px 8px',
                fontSize: '11px',
                maxWidth: '220px'
              }}
            >
              <option value="all">All Extraction Batches</option>
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.session_type === 'rss' ? '📰 RSS' : '𝕏 Apify'} • {formatSafeTime(s.created_at)} ({s.items_count} items)
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search title or text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadDatabaseContent()}
              style={{
                background: '#071324',
                border: '1px solid #1d3b63',
                borderRadius: '2px',
                padding: '4px 10px',
                color: '#ffffff',
                fontSize: '11px',
                width: '180px'
              }}
            />
          </div>
        </div>

        {/* Database Rows Stream */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#e4a83b', fontSize: '13px' }}>
              Querying database records...
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8fa3bf', fontSize: '13px' }}>
              <p style={{ margin: '0 0 12px' }}>No records found matching current session and filter parameters.</p>
              <button
                onClick={handleResetFilters}
                style={{
                  background: '#112747',
                  border: '1px solid #e4a83b',
                  color: '#e4a83b',
                  padding: '6px 14px',
                  borderRadius: '2px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Reset Filters (Show All {counts.total} Records)
              </button>
            </div>
          ) : (
            items.map((item, idx) => {
              const isSocial = item.source_type === 'social_x';
              const safeId = String(item.id || item.link || idx).slice(0, 16);
              const authorText = isSocial
                ? (item.author_name ? `${item.author_name} (@${item.author_handle || ''})` : `@${item.author_handle || 'source'}`)
                : (item.source_name || 'Kenya Media');

              return (
                <div
                  key={`${item.id || item.link || 'row'}-${idx}`}
                  style={{
                    background: isSocial ? '#08182b' : '#071626',
                    border: '1px solid ' + (isSocial ? '#1c3d69' : '#142945'),
                    borderLeft: isSocial ? '4px solid #1d9bf0' : '4px solid #e4a83b',
                    borderRadius: '2px',
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: isSocial ? '#1d9bf0' : '#e4a83b',
                        background: isSocial ? '#0a2342' : '#231c0e',
                        border: '1px solid ' + (isSocial ? '#1d9bf0' : '#e4a83b'),
                        padding: '1px 5px',
                        borderRadius: '2px'
                      }}>
                        {isSocial ? '𝕏 APIFY POST' : '📰 PRESS RSS'}
                      </span>

                      <strong style={{ fontSize: '11px', color: '#ffffff' }}>
                        {authorText}
                      </strong>

                      <span style={{ fontSize: '10px', color: '#8fa3bf' }}>
                        • {formatSafeTime(item.pub_date)}
                      </span>

                      <span style={{ fontSize: '9px', color: '#5c7494', fontFamily: 'var(--font-mono)' }}>
                        ID: {safeId}...
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', marginBottom: '3px', lineHeight: 1.4 }}>
                      {item.title}
                    </div>

                    {item.summary && item.summary !== item.title && (
                      <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4, maxHeight: '36px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.summary}
                      </div>
                    )}

                    {isSocial && item.metrics && (
                      <div style={{ marginTop: '5px', fontSize: '10px', color: '#8fa3bf', display: 'flex', gap: '10px' }}>
                        <span>❤️ {item.metrics.likes || 0}</span>
                        <span>🔁 {item.metrics.retweets || 0}</span>
                        <span>💬 {item.metrics.replies || 0}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0 }}>
                    <span className={`badge-sentiment ${item.risk_level === 'HIGH' ? '' : (item.risk_level === 'MEDIUM' ? 'neut' : 'pos')}`}>
                      {item.risk_level || 'STABLE'}
                    </span>

                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '10px', color: '#e4a83b', textDecoration: 'none', fontWeight: 600, marginTop: '8px' }}
                      >
                        {isSocial ? 'Open 𝕏 ↗' : 'Read Outlet ↗'}
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #142945',
          background: '#071324',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#8fa3bf'
        }}>
          <div>
            Connected Storage: <strong style={{ color: '#ffffff' }}>Supabase PostgreSQL Cloud + High-Speed Local Cache</strong>
          </div>
          <div>
            Showing <strong style={{ color: '#ffffff' }}>{items.length}</strong> of <strong style={{ color: '#ffffff' }}>{counts.total}</strong> stored items
          </div>
        </div>
      </div>
    </div>
  );
}
