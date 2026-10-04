'use client';
import React, { useState } from 'react';

export default function ArticleFeed({ articles = [], onSelectArticle }) {
  const [filterSource, setFilterSource] = useState('all'); // 'all', 'rss', 'social_x'
  const [filterPillar, setFilterPillar] = useState('all');

  // Counts by source
  const rssCount = articles.filter(a => a.sourceType !== 'social_x').length;
  const socialCount = articles.filter(a => a.sourceType === 'social_x').length;

  // Multi-tier filtering
  const filtered = articles.filter(art => {
    // 1. Source filter
    if (filterSource === 'rss' && art.sourceType === 'social_x') return false;
    if (filterSource === 'social_x' && art.sourceType !== 'social_x') return false;

    // 2. Pillar / Category filter
    if (filterPillar !== 'all') {
      const p = filterPillar.toLowerCase();
      const cat = (art.category || art.politicalCategory || '').toLowerCase();
      const top = (art.topic || '').toLowerCase();
      if (!cat.includes(p) && !top.includes(p)) return false;
    }
    return true;
  });

  return (
    <div className="card">
      {/* Top Header & Source Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', color: '#ffffff' }}>Live Ingestion Stream</h3>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#8fa3bf' }}>
            Showing {filtered.length} items ({filterSource === 'all' ? `${rssCount} News + ${socialCount} 𝕏 Posts` : (filterSource === 'rss' ? `${rssCount} News Articles` : `${socialCount} Key Figure Posts`)})
          </p>
        </div>

        {/* Source Toggle Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: '#050d18', padding: '3px', borderRadius: '2px', border: '1px solid #142945' }}>
          <button
            onClick={() => setFilterSource('all')}
            style={{
              background: filterSource === 'all' ? '#e4a83b' : 'transparent',
              color: filterSource === 'all' ? '#071324' : '#cbd5e1',
              border: 'none',
              borderRadius: '2px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            All Stream ({articles.length})
          </button>
          <button
            onClick={() => setFilterSource('rss')}
            style={{
              background: filterSource === 'rss' ? '#e4a83b' : 'transparent',
              color: filterSource === 'rss' ? '#071324' : '#cbd5e1',
              border: 'none',
              borderRadius: '2px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            📰 News Outlets ({rssCount})
          </button>
          <button
            onClick={() => setFilterSource('social_x')}
            style={{
              background: filterSource === 'social_x' ? '#e4a83b' : 'transparent',
              color: filterSource === 'social_x' ? '#071324' : '#cbd5e1',
              border: 'none',
              borderRadius: '2px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            𝕏 Key Figures ({socialCount})
          </button>
        </div>
      </div>

      {/* Pillar Filter Pills */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '12px', borderBottom: '1px solid #142945', marginBottom: '14px' }}>
        {['all', 'politics', 'governance', 'corruption', 'health', 'education', 'economy', 'security'].map((p) => (
          <button
            key={p}
            onClick={() => setFilterPillar(p)}
            style={{
              background: filterPillar === p ? '#142945' : '#091628',
              color: filterPillar === p ? '#e4a83b' : '#8fa3bf',
              border: '1px solid ' + (filterPillar === p ? '#e4a83b' : '#142945'),
              borderRadius: '2px',
              padding: '3px 9px',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'capitalize',
              cursor: 'pointer'
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Feed List Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#8fa3bf', fontSize: '13px' }}>
            No items matching selected source and category filters.
          </div>
        ) : (
          filtered.slice(0, 50).map((art, idx) => {
            const isSocial = art.sourceType === 'social_x';
            const corrob = art.sourceCount || 1;

            return (
              <div
                key={`${art.id || art.link || 'art'}-${idx}`}
                onClick={() => onSelectArticle && onSelectArticle(art)}
                style={{
                  background: isSocial ? '#09182d' : '#091628',
                  border: '1px solid ' + (isSocial ? '#1c3d69' : '#142945'),
                  borderLeft: isSocial ? '4px solid #1d9bf0' : '4px solid #e4a83b',
                  borderRadius: '2px',
                  padding: '12px 14px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease'
                }}
              >
                {/* Source Icon / Letter Box */}
                <div style={{
                  width: '34px',
                  height: '34px',
                  background: isSocial ? '#071324' : '#112747',
                  border: '1px solid ' + (isSocial ? '#1d9bf0' : '#1d3b63'),
                  color: isSocial ? '#1d9bf0' : '#e4a83b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: isSocial ? '15px' : '12px',
                  borderRadius: '2px',
                  flexShrink: 0
                }}>
                  {isSocial ? '𝕏' : (art.sourceName || 'N')[0]}
                </div>

                {/* Content Column */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    {/* Origin Badge */}
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      letterSpacing: '0.4px',
                      textTransform: 'uppercase',
                      color: isSocial ? '#1d9bf0' : '#e4a83b',
                      background: isSocial ? '#0a2342' : '#231c0e',
                      border: '1px solid ' + (isSocial ? '#1d9bf0' : '#e4a83b'),
                      padding: '1px 5px',
                      borderRadius: '2px'
                    }}>
                      {isSocial ? '𝕏 Scraped Post (Apify)' : '📰 Press RSS'}
                    </span>

                    {/* Author or Newsroom */}
                    <strong style={{ fontSize: '11px', color: '#ffffff' }}>
                      {isSocial ? `${art.authorName || art.authorHandle} (@${art.authorHandle})` : art.sourceName}
                    </strong>

                    {/* Timestamp */}
                    <span style={{ fontSize: '10px', color: '#8fa3bf' }} suppressHydrationWarning>
                      • {art.pubDate ? new Date(art.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                    </span>

                    {/* News Corroboration Badge */}
                    {!isSocial && (
                      <span style={{
                        fontSize: '10px',
                        color: corrob >= 2 ? '#ffffff' : '#8fa3bf',
                        background: corrob >= 2 ? '#112747' : '#050d18',
                        border: '1px solid #1d3b63',
                        padding: '1px 6px',
                        borderRadius: '2px'
                      }}>
                        {corrob >= 2 ? `🌟 ${corrob} Outlets Corroborated` : 'Single Newsroom'}
                      </span>
                    )}

                    {/* Social Post Metrics */}
                    {isSocial && art.metrics && (
                      <span style={{ fontSize: '10px', color: '#cbd5e1', display: 'flex', gap: '8px' }}>
                        <span>❤️ {art.metrics.likes || 0}</span>
                        <span>🔁 {art.metrics.retweets || 0}</span>
                        <span>💬 {art.metrics.replies || 0}</span>
                      </span>
                    )}
                  </div>

                  {/* Title / Summary */}
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginBottom: '4px', lineHeight: 1.4 }}>
                    {art.title}
                  </div>

                  {art.summary && art.summary !== art.title && (
                    <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {art.summary}
                    </p>
                  )}

                  {/* External Link */}
                  {art.link && (
                    <div style={{ marginTop: '6px' }}>
                      <a
                        href={art.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontSize: '10px',
                          color: '#e4a83b',
                          textDecoration: 'none',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}
                      >
                        {isSocial ? 'View Tweet on 𝕏 ↗' : 'Read Full Story at Outlet ↗'}
                      </a>
                    </div>
                  )}
                </div>

                {/* Tension / Risk Badge */}
                <span className={`badge-sentiment ${art.tensionRisk === 'HIGH' || art.initialRisk === 'HIGH' ? '' : (art.tensionRisk === 'MEDIUM' || art.initialRisk === 'MEDIUM' ? 'neut' : 'pos')}`}>
                  {art.tensionRisk || art.initialRisk || 'STABLE'}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
