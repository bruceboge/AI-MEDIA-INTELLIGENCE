'use client';
import React from 'react';

export default function MentionVolumeChart() {
  const points = [
    { x: 30, y: 75, val: 240 },
    { x: 70, y: 65, val: 410 },
    { x: 110, y: 40, val: 820 },
    { x: 150, y: 55, val: 630 },
    { x: 190, y: 30, val: 990 },
    { x: 230, y: 20, val: 1240 },
    { x: 270, y: 35, val: 850 }
  ];

  const pathD = `M 30 75 Q 50 70, 70 65 T 110 40 T 150 55 T 190 30 T 230 20 T 270 35`;
  const areaD = `${pathD} L 270 95 L 30 95 Z`;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h4 style={{ margin: 0, fontSize: '13px', color: '#ffffff' }}>Hourly Story Velocity</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#e4a83b' }}>
          <span style={{ width: '8px', height: '8px', background: '#e4a83b', borderRadius: '1px' }}></span>
          <span>Verified Volume</span>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: '130px' }}>
        <svg viewBox="0 0 300 115" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e4a83b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#e4a83b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="20" y1="95" x2="280" y2="95" stroke="#142945" strokeWidth="1" />
          <line x1="20" y1="55" x2="280" y2="55" stroke="#142945" strokeWidth="1" strokeDasharray="3,3" />

          {/* Area & Line */}
          <path d={areaD} fill="url(#volGrad)" />
          <path d={pathD} fill="none" stroke="#e4a83b" strokeWidth="2.4" strokeLinecap="round" />

          {/* Data Points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="3"
              fill="#071324"
              stroke="#e4a83b"
              strokeWidth="1.8"
              aria-label={`${p.val} mentions`}
            />
          ))}

          {/* Labels */}
          <text x="30" y="110" fill="#8fa3bf" fontSize="8" fontFamily="var(--font-mono)">06:00</text>
          <text x="110" y="110" fill="#8fa3bf" fontSize="8" fontFamily="var(--font-mono)">10:00</text>
          <text x="190" y="110" fill="#8fa3bf" fontSize="8" fontFamily="var(--font-mono)">14:00</text>
          <text x="270" y="110" fill="#8fa3bf" fontSize="8" fontFamily="var(--font-mono)">Now</text>
        </svg>
      </div>
    </div>
  );
}
