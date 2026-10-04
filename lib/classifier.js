/**
 * Sub-5ms Pre-Classification Engine for Kenya National Pillars
 */

export const NATIONAL_PILLARS = {
  politics: {
    id: 'politics',
    label: 'Politics & Elections',
    icon: '🏛️',
    color: '#e4a83b',
    keywords: ['politics', 'politician', 'election', 'iebc', 'ruto', 'raila', 'gachagua', 'kalonzo', 'uda', 'azimio', 'odm', 'impeachment', 'ballot', 'campaign']
  },
  governance: {
    id: 'governance',
    label: 'Governance & Policy',
    icon: '📜',
    color: '#ffffff',
    keywords: ['governance', 'cabinet', 'state house', 'parliament', 'senate', 'judiciary', 'supreme court', 'high court', 'governor', 'devolution', 'bill', 'gazette']
  },
  corruption: {
    id: 'corruption',
    label: 'Corruption & Graft',
    icon: '🛡️',
    color: '#e4a83b',
    keywords: ['corruption', 'eacc', 'graft', 'bribery', 'scandal', 'auditor general', 'embezzlement', 'dci', 'tender row', 'unexplained wealth']
  },
  health: {
    id: 'health',
    label: 'Health & Social Welfare',
    icon: '🏥',
    color: '#cbd5e1',
    keywords: ['health', 'hospital', 'sha', 'nhif', 'kmpdu', 'doctors strike', 'nurses strike', 'kemsa', 'medicine', 'clinic', 'patients stranded']
  },
  education: {
    id: 'education',
    label: 'Education & CBC',
    icon: '🎓',
    color: '#ffffff',
    keywords: ['education', 'school', 'cbc', 'tsc', 'knut', 'teachers strike', 'helb', 'student loans', 'kcse', 'junior secondary', 'tuition fees']
  },
  economy: {
    id: 'economy',
    label: 'Economy & Finance',
    icon: '📈',
    color: '#e4a83b',
    keywords: ['economy', 'finance', 'finance bill', 'taxes', 'kra', 'treasury', 'cbk', 'shilling', 'inflation', 'cost of living', 'fuel prices', 'epra', 'debt']
  },
  security: {
    id: 'security',
    label: 'Security & Public Order',
    icon: '🚨',
    color: '#e4a83b',
    keywords: ['security', 'police', 'nps', 'banditry', 'terror', 'protest', 'maandamano', 'teargas', 'arrested', 'clash', 'crime', 'curfew']
  },
  trends: {
    id: 'trends',
    label: 'Civic Trends & Pulse',
    icon: '🌐',
    color: '#cbd5e1',
    keywords: ['trending', 'viral', 'social media', 'citizens', 'public outcry', 'gen z', 'activism', 'petition', 'boycott', 'human rights']
  }
};

const TENSION_HIGH = ['crisis', 'protest', 'strike', 'clashes', 'killed', 'arrest', 'violence', 'impeach', 'boycott', 'chaos', 'teargas', 'deadlock'];
const TENSION_MED = ['warning', 'dispute', 'split', 'faults', 'demands', 'probe', 'rejects', 'defiant', 'petition', 'controversy', 'backlash'];

export function classifyItem(title = '', content = '') {
  const text = `${title} ${content}`.toLowerCase();
  let bestCategory = 'trends';
  let maxMatches = 0;

  for (const [key, pillar] of Object.entries(NATIONAL_PILLARS)) {
    const matches = pillar.keywords.filter(kw => text.includes(kw)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestCategory = key;
    }
  }

  const highHits = TENSION_HIGH.filter(t => text.includes(t)).length;
  const medHits = TENSION_MED.filter(t => text.includes(t)).length;

  let tensionRisk = 'LOW';
  if (highHits >= 2 || (highHits >= 1 && medHits >= 1)) tensionRisk = 'HIGH';
  else if (highHits === 1 || medHits >= 2) tensionRisk = 'MEDIUM';

  const meta = NATIONAL_PILLARS[bestCategory] || NATIONAL_PILLARS.trends;

  return {
    category: bestCategory,
    categoryLabel: meta.label,
    categoryIcon: meta.icon,
    categoryColor: meta.color,
    tensionRisk
  };
}

export function classifyBatch(items = []) {
  const categorized = {};
  const counts = {};

  for (const key of Object.keys(NATIONAL_PILLARS)) {
    categorized[key] = [];
    counts[key] = 0;
  }

  items.forEach(item => {
    const res = classifyItem(item.title, item.summary || item.text || item.content);
    const enriched = { ...item, ...res };
    categorized[res.category].push(enriched);
    counts[res.category] = (counts[res.category] || 0) + 1;
  });

  return { categorized, counts };
}
