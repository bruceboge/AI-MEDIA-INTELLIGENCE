'use client';
import React, { useMemo } from 'react';

export default function SentimentDonut({ sentiment, articles = [] }) {
  // Compute real public mood distribution from database articles' risk_level / tensionRisk
  const { neg, neut, pos, counts } = useMemo(() => {
    if (sentiment && sentiment.negativePct !== undefined) {
      return {
        neg: sentiment.negativePct,
        neut: sentiment.neutralPct,
        pos: sentiment.positivePct,
        counts: null
      };
    }

    const total = articles.length || 1;
    let high = 0;
    let med = 0;
    let low = 0;

    articles.forEach(art => {
      const risk = (art.tensionRisk || art.risk_level || art.initialRisk || 'STABLE').toUpperCase();
      if (risk === 'HIGH') high++;
      else if (risk === 'MEDIUM') med++;
      else low++;
    });

    const negPct = Math.round((high / total) * 100);
    const neutPct = Math.round((med / total) * 100);
    const posPct = Math.max(0, 100 - negPct - neutPct);

    return {
      neg: negPct,
      neut: neutPct,
      pos: posPct,
      counts: { high, med, low, total: articles.length }
    };
  }, [sentiment, articles]);

  const radius = 38;
  const circ = 2 * Math.PI * radius; // ~238.76

  const negLen = (neg / 100) * circ;
  const neutLen = (neut / 100) * circ;
  const posLen = (pos / 100) * circ;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '13px', color: '#ffffff' }}>Public Mood Breakdown</h4>
        <span style={{ fontSize: '10px', color: '#8fa3bf' }}>
          {counts ? `${counts.total} Analyzed` : 'AI Synthesis'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
        {/* Donut SVG */}
        <div style={{ width: '90px', height: '90px', position: 'relative', flexShrink: 0 }}>
          <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#142945" strokeWidth="12" />
            <circle
              cx="50" cy="50" r={radius} fill="none" stroke="#e4a83b" strokeWidth="12"
              strokeDasharray={`${negLen} ${circ - negLen}`} strokeDashoffset="0"
            />
            <circle
              cx="50" cy="50" r={radius} fill="none" stroke="#8fa3bf" strokeWidth="12"
              strokeDasharray={`${neutLen} ${circ - neutLen}`} strokeDashoffset={-negLen}
            />
            <circle
              cx="50" cy="50" r={radius} fill="none" stroke="#ffffff" strokeWidth="12"
              strokeDasharray={`${posLen} ${circ - posLen}`} strokeDashoffset={-(negLen + neutLen)}
            />
          </svg>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8fa3bf' }}>
              <span style={{ width: '8px', height: '8px', background: '#e4a83b', borderRadius: '1px' }}></span>
              Critical / Tension
            </span>
            <strong style={{ color: '#e4a83b' }}>
              {neg}% {counts ? `(${counts.high})` : ''}
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8fa3bf' }}>
              <span style={{ width: '8px', height: '8px', background: '#8fa3bf', borderRadius: '1px' }}></span>
              Neutral
            </span>
            <strong style={{ color: '#cbd5e1' }}>
              {neut}% {counts ? `(${counts.med})` : ''}
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8fa3bf' }}>
              <span style={{ width: '8px', height: '8px', background: '#ffffff', borderRadius: '1px' }}></span>
              Positive / Stable
            </span>
            <strong style={{ color: '#ffffff' }}>
              {pos}% {counts ? `(${counts.low})` : ''}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
