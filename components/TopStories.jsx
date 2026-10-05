'use client';
import React, { useMemo } from 'react';

export default function TopStories({ narratives = [], articles = [] }) {
  // Compute real clustered narratives dynamically from database articles
  const displayList = useMemo(() => {
    // If Gemini AI report has extracted strategic narratives, prioritize them
    if (narratives && narratives.length > 0) {
      return narratives.slice(0, 3).map(n => ({
        domain: n.domain || 'Strategic Narrative',
        title: n.title,
        velocity: n.velocity || 'ACTIVE',
        volumeText: n.volume ? `${n.volume} stories` : 'Synthesized'
      }));
    }

    if (!articles || articles.length === 0) {
      return [];
    }

    // Group articles by pillar / category
    const clusters = {};
    articles.forEach(art => {
      const cat = (art.category || art.politicalCategory || art.topic || 'General').toLowerCase();
      const pillarKey = cat.includes('polit') ? 'Politics'
        : cat.includes('econ') || cat.includes('tax') ? 'Economy'
        : cat.includes('health') || cat.includes('sha') ? 'Health'
        : cat.includes('secu') || cat.includes('police') ? 'Security'
        : cat.includes('corrup') ? 'Corruption'
        : cat.includes('gov') ? 'Governance'
        : 'National Media';

      if (!clusters[pillarKey]) {
        clusters[pillarKey] = {
          domain: pillarKey,
          items: [],
          highRiskCount: 0
        };
      }
      clusters[pillarKey].items.push(art);
      const risk = (art.tensionRisk || art.risk_level || art.initialRisk || 'STABLE').toUpperCase();
      if (risk === 'HIGH') clusters[pillarKey].highRiskCount++;
    });

    // Sort clusters by number of items descending
    const sorted = Object.values(clusters).sort((a, b) => b.items.length - a.items.length);

    // Pick top 3 clusters and extract most prominent story
    return sorted.slice(0, 3).map(c => {
      // Pick top representative story in this cluster
      const topStory = c.items.find(i => (i.sourceCount || 1) >= 2) || c.items[0];
      const isHighVelocity = c.highRiskCount >= 2 || c.items.length >= 8;

      return {
        domain: c.domain,
        title: topStory ? topStory.title : `${c.domain} Developments`,
        velocity: isHighVelocity ? 'HIGH' : 'ACTIVE',
        volumeText: `${c.items.length} Stories Reporting`
      };
    });
  }, [narratives, articles]);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '13px', color: '#ffffff' }}>Top Clustered Narratives</h4>
        <span style={{ fontSize: '11px', color: '#e4a83b', fontWeight: 600 }}>
          {narratives && narratives.length > 0 ? 'AI Clustered' : 'Dynamic Pillars'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {displayList.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#8fa3bf', fontSize: '12px' }}>
            No stories currently ingested to cluster.
          </div>
        ) : (
          displayList.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: '#091628',
                border: '1px solid #142945',
                borderLeft: item.velocity === 'HIGH' ? '3px solid #e4a83b' : '3px solid #142945',
                borderRadius: '2px',
                padding: '10px 12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', color: '#e4a83b', textTransform: 'uppercase', fontWeight: 700 }}>
                    {item.domain}
                  </span>
                  <span style={{ fontSize: '10px', color: '#8fa3bf' }}>
                    • {item.volumeText}
                  </span>
                </div>
                <span className={`badge-sentiment ${item.velocity === 'HIGH' ? '' : 'neut'}`}>
                  {item.velocity}
                </span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', lineHeight: 1.4 }}>
                {item.title}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
