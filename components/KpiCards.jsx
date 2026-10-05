'use client';
import React from 'react';
import TrendingSwiper from './TrendingSwiper';

export default function KpiCards({
  totalStories = 0,
  rssCount = 0,
  socialCount = 0,
  riskLevel = 'MEDIUM',
  trends = [],
  onSelectTag
}) {
  const total = totalStories || (rssCount + socialCount) || 0;
  const rss = rssCount || (total - socialCount) || 0;
  const social = socialCount || 0;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '16px',
      marginBottom: '20px'
    }}>
      {/* CARD 1: Consolidated Ingestion Telemetry (Total + RSS + Apify 𝕏 in ONE small card) */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '14px 16px', minHeight: '115px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', color: '#8fa3bf', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Total Ingestion Stream
          </span>
          <span style={{
            width: '26px', height: '26px', background: '#112747',
            border: '1px solid #1d3b63', borderRadius: '2px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '13px'
          }}>
            📡
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
            {total}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '11px',
              background: '#0d223f',
              border: '1px solid #18375e',
              color: '#cbd5e1',
              padding: '3px 8px',
              borderRadius: '2px',
              fontWeight: 600
            }}>
              📰 <strong>{rss}</strong> RSS Outlets
            </span>
            <span style={{
              fontSize: '11px',
              background: '#0d223f',
              border: '1px solid #18375e',
              color: '#cbd5e1',
              padding: '3px 8px',
              borderRadius: '2px',
              fontWeight: 600
            }}>
              𝕏 <strong>{social}</strong> Key Figures
            </span>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: '#5c7494', marginTop: '8px' }}>
          Unified cross-outlet press & social surveillance
        </div>
      </div>

      {/* CARD 2: National Tension Risk */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '14px 16px', minHeight: '115px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', color: '#8fa3bf', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            National Tension Risk
          </span>
          <span style={{
            width: '26px', height: '26px', background: '#112747',
            border: '1px solid #1d3b63', borderRadius: '2px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '13px'
          }}>
            🛡️
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <div style={{ fontSize: '26px', fontWeight: 800, color: riskLevel === 'HIGH' ? '#e4a83b' : '#38bdf8', lineHeight: 1 }}>
            {riskLevel}
          </div>
          <span className={`badge-sentiment ${riskLevel === 'HIGH' ? '' : 'neut'}`}>
            {riskLevel === 'HIGH' ? 'CRITICAL WATCH' : 'ACTIVE MONITORING'}
          </span>
        </div>

        <div style={{ fontSize: '11px', color: '#5c7494', marginTop: '8px' }}>
          Heuristic early warning & strike/unrest alert status
        </div>
      </div>

      {/* CARD 3: Dynamic Swiping Trending Hashtags */}
      <TrendingSwiper trends={trends} onSelectTag={onSelectTag} />
    </div>
  );
}
