'use client';
import React, { useState, useEffect } from 'react';

export default function Navbar({
  onOpenAuth,
  onOpenSocial,
  onOpenViewData,
  onExtractRss,
  onExtractApify,
  onResetAll,
  user,
  isExtractingRss,
  isExtractingApify,
  isResetting
}) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-GB', { timeZone: 'Africa/Nairobi' }) + ' EAT');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header style={{
      height: '64px',
      background: '#071324',
      borderBottom: '1px solid #142945',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      flexWrap: 'wrap',
      gap: '10px'
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px', height: '32px', background: '#112747',
          border: '1px solid #e4a83b', color: '#e4a83b', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', borderRadius: '2px'
        }}>
          MW
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px' }}>
            MEDIWATCH <span style={{ color: '#e4a83b' }}>KENYA</span>
          </div>
          <div style={{ fontSize: '10px', color: '#8fa3bf', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            National Intelligence Engine
          </div>
        </div>
      </div>

      {/* Manual Extraction Controls & Database Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Extract RSS Button */}
        <button
          onClick={onExtractRss}
          disabled={isExtractingRss}
          style={{
            background: '#091628',
            border: '1px solid #1d3b63',
            borderRadius: '2px',
            padding: '6px 11px',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: isExtractingRss ? 'not-allowed' : 'pointer',
            opacity: isExtractingRss ? 0.7 : 1
          }}
          title="Scrape and save live Kenyan newsrooms (RSS) to database"
        >
          <span>{isExtractingRss ? '⏳' : '📰'}</span>
          <span>{isExtractingRss ? 'Extracting RSS...' : 'Extract RSS'}</span>
        </button>

        {/* Harvest Apify Button */}
        <button
          onClick={onExtractApify}
          disabled={isExtractingApify}
          style={{
            background: '#091628',
            border: '1px solid #1d9bf0',
            borderRadius: '2px',
            padding: '6px 11px',
            color: '#1d9bf0',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: isExtractingApify ? 'not-allowed' : 'pointer',
            opacity: isExtractingApify ? 0.7 : 1
          }}
          title="Force harvest Apify 𝕏 posts from 33 accounts and save to database"
        >
          <span>{isExtractingApify ? '⏳' : '𝕏'}</span>
          <span>{isExtractingApify ? 'Harvesting Apify...' : 'Harvest Apify'}</span>
        </button>

        {/* View Database Button */}
        <button
          onClick={onOpenViewData}
          style={{
            background: '#112747',
            border: '1px solid #e4a83b',
            borderRadius: '2px',
            padding: '6px 12px',
            color: '#e4a83b',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
          title="View all aggregated extraction sessions and raw database records"
        >
          <span>🗄️</span>
          <span>View Database</span>
        </button>

        {/* Social Radar Status Pill */}
        <button
          onClick={onOpenSocial}
          style={{
            background: '#071324',
            border: '1px solid #142945',
            borderRadius: '2px',
            padding: '6px 10px',
            color: '#8fa3bf',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
          title="Social Radar Status & Handles"
        >
          <span>Radar</span>
        </button>
      </div>

      {/* Right User & System Reset Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ fontSize: '11px', color: '#8fa3bf', fontFamily: 'var(--font-mono)' }} suppressHydrationWarning>
          {time || '--:--:-- EAT'}
        </div>

        {/* Nuclear Reset Button */}
        <button
          onClick={onResetAll}
          disabled={isResetting}
          style={{
            background: '#1a1012',
            border: '1px solid #5a1d24',
            color: '#ff7878',
            borderRadius: '2px',
            padding: '6px 11px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: isResetting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
          title="Nuclear Reset: Purge database sessions, invalidate cache shields, reset UI"
        >
          <span>{isResetting ? '⏳' : '🔄'}</span>
          <span>{isResetting ? 'Resetting...' : 'Reset All'}</span>
        </button>

        {/* User Auth Button */}
        <button
          onClick={onOpenAuth}
          style={{
            background: '#112747',
            border: '1px solid #e4a83b',
            color: '#e4a83b',
            borderRadius: '2px',
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <span>👤</span> {user ? user.email.split('@')[0] : 'Sign In'}
        </button>
      </div>
    </header>
  );
}
