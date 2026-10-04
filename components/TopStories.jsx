'use client';
import React from 'react';

export default function TopStories({ narratives = [] }) {
  const displayList = narratives.length > 0 ? narratives.slice(0, 3) : [
    { title: 'Healthcare Transition & SHA Insurance Rollout Scrutiny', domain: 'Health', velocity: 'HIGH' },
    { title: 'Elections & Succession Politics Alignment Ahead of 2027', domain: 'Politics', velocity: 'MEDIUM' },
    { title: 'Cost of Living, KRA Targets & Fiscal Discontent', domain: 'Economy', velocity: 'HIGH' }
  ];

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '13px', color: '#ffffff' }}>Top Clustered Narratives</h4>
        <span style={{ fontSize: '11px', color: '#e4a83b' }}>Active Watch</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {displayList.map((item, idx) => (
          <div
            key={idx}
            style={{
              background: '#091628',
              border: '1px solid #142945',
              borderRadius: '2px',
              padding: '10px 12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: '#8fa3bf', textTransform: 'uppercase', fontWeight: 600 }}>
                {item.domain || 'National'}
              </span>
              <span className={`badge-sentiment ${item.velocity === 'HIGH' ? '' : 'neut'}`}>
                {item.velocity || 'ACTIVE'}
              </span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', lineHeight: 1.4 }}>
              {item.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
