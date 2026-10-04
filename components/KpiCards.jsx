'use client';
import React from 'react';

export default function KpiCards({
  totalStories = 0,
  corroboratedCount = 0,
  rssCount = 0,
  socialCount = 0,
  riskLevel = 'MEDIUM'
}) {
  const cards = [
    {
      title: 'Total Ingestion',
      val: totalStories || (rssCount + socialCount) || '0',
      sub: 'All active intelligence',
      icon: '📡'
    },
    {
      title: 'News Outlets (RSS)',
      val: rssCount || (totalStories - socialCount) || '0',
      sub: 'Verified media press',
      icon: '📰'
    },
    {
      title: 'Key Figures (Apify 𝕏)',
      val: socialCount || '0',
      sub: 'Scraped 33+ leaders & bodies',
      icon: '𝕏'
    },
    {
      title: 'National Tension Risk',
      val: riskLevel,
      sub: 'Real-time alert status',
      icon: '🛡️',
      isRisk: true
    }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
      {cards.map((c, idx) => (
        <div key={idx} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: '#8fa3bf', fontWeight: 600 }}>{c.title}</span>
            <span style={{
              width: '26px', height: '26px', background: '#112747',
              border: '1px solid #1d3b63', borderRadius: '2px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '13px'
            }}>
              {c.icon}
            </span>
          </div>

          <div style={{ fontSize: '26px', fontWeight: 800, color: c.isRisk ? '#e4a83b' : '#ffffff', lineHeight: 1 }}>
            {c.val}
          </div>

          <div style={{ fontSize: '11px', color: '#5c7494', marginTop: '6px' }}>
            {c.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
