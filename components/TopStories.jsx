'use client';
import React, { useMemo } from 'react';

// Specific Kenyan storyline clusters to group related news and tweets
const STORYLINE_DEFINITIONS = [
  {
    domain: '2027 Succession & Polls',
    terms: ['2027', 'election', 'polls', 'iebc', 'succession', 'voter'],
    defaultHeadline: 'Preparations and Coalition Maneuvers Ahead of 2027 Elections'
  },
  {
    domain: 'Opposition & Coalitions',
    terms: ['opposition', 'azimio', 'odm', 'sifuna', 'raila', 'equitable party', 'gachagua', 'uhuru'],
    defaultHeadline: 'Opposition Realignment and Inter-Party Power Dynamics'
  },
  {
    domain: 'Judiciary & Rule of Law',
    terms: ['court', 'courts', 'judiciary', 'chief justice', 'injunction', 'ruling', 'debt', 'kenha'],
    defaultHeadline: 'Court Battles Over Public Debt and Infrastructure Funds'
  },
  {
    domain: 'Security & Crime Probes',
    terms: ['police', 'murder', 'probes', 'ipoa', 'ngec', 'banditry', 'dci', 'crime', 'salama'],
    defaultHeadline: 'IPOA and Police Investigations into Criminal Events & Safety'
  },
  {
    domain: 'Healthcare & Social Welfare',
    terms: ['health', 'hospital', 'sha', 'nhif', 'kmpdu', 'doctors', 'cancer'],
    defaultHeadline: 'Reforms and Transition Challenges in the National Health System'
  },
  {
    domain: 'Economy & Fiscal Policy',
    terms: ['tax', 'kra', 'finance', 'debt', 'inflation', 'shilling', 'fuel', 'dangote'],
    defaultHeadline: 'Fiscal Scrutiny Over Public Revenue, Taxes, and Energy'
  }
];

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

    if (!articles || articles.length === 0) return [];

    // Cluster items into substantive storylines
    const clusters = STORYLINE_DEFINITIONS.map(def => {
      const matched = [];
      const sources = new Set();
      let highRiskCount = 0;

      articles.forEach(art => {
        const text = `${art.title || ''} ${art.summary || ''}`.toLowerCase();
        if (def.terms.some(t => text.includes(t))) {
          matched.push(art);
          sources.add(art.source_name || art.sourceName || 'Press');
          const risk = (art.tensionRisk || art.risk_level || art.initialRisk || 'LOW').toUpperCase();
          if (risk === 'HIGH') highRiskCount++;
        }
      });

      // Best representative headline: pick an item with multiple sources or shortest clean title
      const leadStory = matched.find(i => (i.sourceCount || 1) >= 2) || matched[0];

      return {
        domain: def.domain,
        title: leadStory ? leadStory.title : def.defaultHeadline,
        count: matched.length,
        sourcesCount: sources.size,
        highRiskCount,
        isHighVelocity: highRiskCount >= 2 || matched.length >= 6
      };
    });

    // Filter clusters that have actual matching stories and sort by volume & sources
    const activeClusters = clusters
      .filter(c => c.count > 0)
      .sort((a, b) => (b.count * 2 + b.sourcesCount) - (a.count * 2 + a.sourcesCount));

    return activeClusters.slice(0, 3).map(c => ({
      domain: c.domain,
      title: c.title,
      velocity: c.isHighVelocity ? 'HIGH' : 'ACTIVE',
      volumeText: `${c.count} Stories · ${c.sourcesCount} Outlets`
    }));
  }, [narratives, articles]);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '13px', color: '#ffffff' }}>Top Clustered Narratives</h4>
        <span style={{ fontSize: '11px', color: '#e4a83b', fontWeight: 600 }}>
          {narratives && narratives.length > 0 ? 'AI Clustered' : 'Dynamic Narrative Clusters'}
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
