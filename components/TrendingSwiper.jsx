'use client';
import React, { useState, useEffect } from 'react';

export default function TrendingSwiper({ trends = [], onSelectTag }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!trends || trends.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % trends.length);
    }, 3800);

    return () => clearInterval(timer);
  }, [trends, isPaused]);

  if (!trends || trends.length === 0) {
    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '115px' }}>
        <span style={{ fontSize: '12px', color: '#8fa3bf' }}>Scanning emerging trends...</span>
      </div>
    );
  }

  const current = trends[currentIndex] || trends[0];

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + trends.length) % trends.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % trends.length);
  };

  return (
    <div
      className="card"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #1c3558',
        background: '#091628',
        padding: '14px 16px',
        minHeight: '115px'
      }}
    >
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#8fa3bf', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            🔥 Live Trending ({currentIndex + 1}/{trends.length})
          </span>
          <span style={{
            fontSize: '10px',
            background: '#152945',
            color: '#e4a83b',
            padding: '2px 6px',
            borderRadius: '2px',
            fontWeight: 700
          }}>
            {current.badge}
          </span>
        </div>

        {/* Carousel Arrows */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={handlePrev}
            style={{
              background: '#0e2038',
              border: '1px solid #1c3558',
              color: '#cbd5e1',
              borderRadius: '2px',
              width: '22px',
              height: '22px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px'
            }}
            title="Previous trend"
          >
            ‹
          </button>
          <button
            onClick={handleNext}
            style={{
              background: '#0e2038',
              border: '1px solid #1c3558',
              color: '#cbd5e1',
              borderRadius: '2px',
              width: '22px',
              height: '22px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px'
            }}
            title="Next trend"
          >
            ›
          </button>
        </div>
      </div>

      {/* Main Dynamic Slide Content */}
      <div
        onClick={() => onSelectTag && onSelectTag(current.tag)}
        style={{ cursor: onSelectTag ? 'pointer' : 'default', transition: 'all 0.3s ease' }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#e4a83b', letterSpacing: '-0.3px' }}>
            {current.tag}
          </span>
          <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>
            {current.label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
          <span style={{ fontSize: '11px', color: '#8fa3bf' }}>
            📊 <strong>{current.count}</strong> mentions across <strong>{current.sourcesCount}</strong> outlets
          </span>
          {onSelectTag && (
            <span style={{ fontSize: '10px', color: '#e4a83b', textDecoration: 'underline' }}>
              Filter Feed →
            </span>
          )}
        </div>
      </div>

      {/* Bottom Swiper Progress Indicators */}
      <div style={{ display: 'flex', gap: '4px', marginTop: '10px' }}>
        {trends.map((t, idx) => (
          <div
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            style={{
              height: '3px',
              flex: 1,
              background: idx === currentIndex ? '#e4a83b' : '#142945',
              cursor: 'pointer',
              borderRadius: '1px',
              transition: 'background 0.3s ease'
            }}
            title={t.tag}
          />
        ))}
      </div>
    </div>
  );
}
