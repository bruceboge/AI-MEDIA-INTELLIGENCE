'use client';
import React, { useMemo } from 'react';

export default function MentionVolumeChart({ articles = [] }) {
  // Compute real hourly distribution buckets from articles' pub_date / pubDate
  const { points, maxVal, totalMentions, pathD, areaD, labels } = useMemo(() => {
    // 6 time buckets across the past 24 hours: 4h chunks
    const now = Date.now();
    const bucketHours = [20, 16, 12, 8, 4, 0]; // hours ago
    const bucketLabels = ['-20h', '-16h', '-12h', '-8h', '-4h', 'Now'];
    const counts = [0, 0, 0, 0, 0, 0];

    articles.forEach(art => {
      const dateStr = art.pub_date || art.pubDate || art.created_at;
      if (!dateStr) return;
      const t = new Date(dateStr).getTime();
      if (isNaN(t)) return;
      const diffHours = (now - t) / (1000 * 60 * 60);

      if (diffHours >= 16) counts[0]++;
      else if (diffHours >= 12) counts[1]++;
      else if (diffHours >= 8) counts[2]++;
      else if (diffHours >= 4) counts[3]++;
      else if (diffHours >= 1) counts[4]++;
      else counts[5]++;
    });

    const max = Math.max(...counts, 1);
    const pts = counts.map((count, idx) => {
      const x = 30 + idx * (240 / 5);
      // Normalized between y=85 (baseline) and y=25 (peak)
      const y = Math.round(85 - (count / max) * 60);
      return { x, y, val: count, label: bucketLabels[idx] };
    });

    // Build SVG path
    let pD = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const midX = (prev.x + curr.x) / 2;
      pD += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const aD = `${pD} L ${pts[pts.length - 1].x} 95 L ${pts[0].x} 95 Z`;

    return {
      points: pts,
      maxVal: max,
      totalMentions: articles.length,
      pathD: pD,
      areaD: aD,
      labels: bucketLabels
    };
  }, [articles]);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '13px', color: '#ffffff' }}>Hourly Story Velocity</h4>
          <span style={{ fontSize: '10px', color: '#8fa3bf' }}>
            Derived from {totalMentions} live database records
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#e4a83b' }}>
          <span style={{ width: '8px', height: '8px', background: '#e4a83b', borderRadius: '1px' }}></span>
          <span>Peak: {maxVal} / bucket</span>
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
              r="3.5"
              fill="#071324"
              stroke="#e4a83b"
              strokeWidth="1.8"
              aria-label={`${p.val} items at ${p.label}`}
            />
          ))}

          {/* Dynamic Labels */}
          {points.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y="108"
              fill="#8fa3bf"
              fontSize="8"
              fontFamily="var(--font-mono)"
              textAnchor="middle"
            >
              {p.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
