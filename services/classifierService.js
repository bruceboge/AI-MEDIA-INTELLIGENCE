/**
 * Fast High-Throughput Classification Engine for Kenya Media & Social Intelligence
 * 
 * Pre-filters and scores raw news articles and social posts into major national pillars:
 * - politics: Elections, government, legislation, coalitions, parliament
 * - governance: Public service, cabinet decisions, parastatals, judiciary
 * - corruption: EACC investigations, graft, bribery, audits, procurement
 * - health: SHA/NHIF rollout, hospitals, doctors/nurses strikes, medicine shortages
 * - education: CBC curriculum, university funding, HELB loans, teachers/KNUT strikes
 * - economy: Taxes, KRA, cost of living, inflation, fuel prices, shilling
 * - security: Police operations, banditry, protests, teargas, crime
 * - trends: Civic campaigns, viral topics, public sentiment
 * 
 * Execution time: < 5ms per item (avoids expensive LLM token consumption).
 */

const NATIONAL_PILLARS = {
  politics: {
    id: 'politics',
    label: 'Politics & Elections',
    icon: '🏛️',
    color: '#e4a83b',
    keywords: [
      'politics', 'politician', 'political party', 'opposition', 'ruling coalition',
      'uda', 'azimio', 'odm', 'jubilee', 'wiper', 'ruto', 'raila', 'gachagua', 'kalonzo',
      'rigathi', 'election', 'by-election', 'voter registration', 'iebc', 'ballot',
      'campaign', 'rally', 'primaries', 'nomination', 'tallying', 'impeachment'
    ],
    weight: 1.0
  },
  governance: {
    id: 'governance',
    label: 'Governance & Public Policy',
    icon: '📜',
    color: '#ffffff',
    keywords: [
      'governance', 'government', 'cabinet', 'state house', 'national assembly', 'senate',
      'parliament', 'order paper', 'hansard', 'bill', 'gazette', 'judiciary', 'chief justice',
      'high court', 'supreme court', 'ruling', 'injunction', 'constitution', 'devolution',
      'county government', 'governor', 'public service commission', 'ombudsman', 'parastatal'
    ],
    weight: 1.0
  },
  corruption: {
    id: 'corruption',
    label: 'Corruption & Accountability',
    icon: '🛡️',
    color: '#e4a83b',
    keywords: [
      'corruption', 'eacc', 'graft', 'bribery', 'embezzlement', 'auditor general',
      'scandal', 'kickback', 'procurement fraud', 'unexplained wealth', 'asset recovery',
      'dci', 'dpp', 'arraigned in court', 'charged', 'pleaded not guilty', 'bail', 'tender row'
    ],
    weight: 1.2
  },
  health: {
    id: 'health',
    label: 'Health & Social Welfare',
    icon: '🏥',
    color: '#cbd5e1',
    keywords: [
      'health', 'healthcare', 'hospital', 'sha', 'social health authority', 'nhif',
      'kmpdu', 'doctors strike', 'nurses strike', 'clinical officers', 'kemsa',
      'medical supplies', 'medicine shortage', 'maternity', 'cancer', 'epidemic',
      'clinic', 'ministry of health', 'cs health', 'patients stranded'
    ],
    weight: 1.1
  },
  education: {
    id: 'education',
    label: 'Education & CBC',
    icon: '🎓',
    color: '#ffffff',
    keywords: [
      'education', 'school', 'cbc', 'competency based curriculum', 'teachers',
      'tsc', 'teachers service commission', 'knut', 'kuppet', 'teachers strike',
      'university funding model', 'helb', 'student loans', 'kcse', 'kcpe', 'junior secondary',
      'jss', 'ministry of education', 'tuition fees', 'school reopening'
    ],
    weight: 1.1
  },
  economy: {
    id: 'economy',
    label: 'Economy & Finance',
    icon: '📈',
    color: '#e4a83b',
    keywords: [
      'economy', 'finance', 'finance bill', 'taxes', 'kra', 'revenue authority',
      'treasury', 'central bank', 'cbk', 'shilling', 'inflation', 'cost of living',
      'fuel prices', 'epra', 'kerosene', 'diesel', 'public debt', 'imf', 'world bank',
      'interest rates', 'forex', 'unemployment', 'budget estimates'
    ],
    weight: 1.0
  },
  security: {
    id: 'security',
    label: 'Security & Public Order',
    icon: '🚨',
    color: '#e4a83b',
    keywords: [
      'security', 'police', 'national police service', 'nps', 'inspector general',
      'dci', 'banditry', 'north rift', 'terror', 'al-shabaab', 'protest', 'maandamano',
      'teargas', 'arrested', 'clash', 'gunfire', 'curfew', 'crime', 'kdf', 'military'
    ],
    weight: 1.2
  },
  trends: {
    id: 'trends',
    label: 'Civic Trends & Public Pulse',
    icon: '🌐',
    color: '#cbd5e1',
    keywords: [
      'trending', 'viral', 'social media', 'citizens', 'public outcry', 'gen z',
      'activism', 'petition', 'boycott', 'civil society', 'human rights', 'knhrc',
      'hashtag', 'twitter space', 'influencer', 'public debate'
    ],
    weight: 0.9
  }
};

/**
 * Tension risk tokens for strategic threat intelligence
 */
const TENSION_TOKENS = {
  HIGH: [
    'crisis', 'protest', 'strike', 'clashes', 'killed', 'arrest', 'violence', 'impeach',
    'boycott', 'paralyzed', 'threat', 'court halts', 'row', 'chaos', 'ultimatum', 'warns',
    'feud', 'bribery', 'scandal', 'deadlock', 'teargas', 'standoff', 'sabotage'
  ],
  MEDIUM: [
    'warning', 'dispute', 'split', 'faults', 'demands', 'probe', 'rejects', 'defiant',
    'petition', 'heats up', 'allegation', 'controversy', 'backlash', 'scrutiny', 'concern'
  ]
};

/**
 * Classifies a document (title + content) into primary and secondary pillars.
 * @param {string} title 
 * @param {string} content 
 * @returns {object} Classification result
 */
function classifyItem(title, content) {
  const cleanTitle = (title || '').toLowerCase();
  const cleanContent = (content || '').toLowerCase();
  const fullText = `${cleanTitle} ${cleanContent}`;

  const scores = {};
  const matchedTokensPerCategory = {};

  for (const [key, pillar] of Object.entries(NATIONAL_PILLARS)) {
    let score = 0;
    const matches = [];

    for (const kw of pillar.keywords) {
      // Title match gets 3x weighting
      if (cleanTitle.includes(kw)) {
        score += 3 * pillar.weight;
        matches.push(kw);
      } else if (cleanContent.includes(kw)) {
        score += 1 * pillar.weight;
        matches.push(kw);
      }
    }

    scores[key] = score;
    matchedTokensPerCategory[key] = matches;
  }

  // Find category with highest score
  let bestCategory = 'trends';
  let highestScore = 0;

  for (const [cat, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      bestCategory = cat;
    }
  }

  // If score is negligible, default to general trends or politics if government entities exist
  if (highestScore === 0) {
    if (fullText.includes('kenya') || fullText.includes('nairobi')) {
      bestCategory = 'trends';
    } else {
      bestCategory = 'governance';
    }
  }

  // Calculate early tension risk
  const highHits = TENSION_TOKENS.HIGH.filter(t => fullText.includes(t));
  const medHits = TENSION_TOKENS.MEDIUM.filter(t => fullText.includes(t));

  let tensionRisk = 'LOW';
  if (highHits.length >= 2 || (highHits.length >= 1 && medHits.length >= 2)) {
    tensionRisk = 'HIGH';
  } else if (highHits.length === 1 || medHits.length >= 2) {
    tensionRisk = 'MEDIUM';
  }

  const pillarMeta = NATIONAL_PILLARS[bestCategory] || NATIONAL_PILLARS.trends;

  return {
    category: bestCategory,
    categoryLabel: pillarMeta.label,
    categoryIcon: pillarMeta.icon,
    categoryColor: pillarMeta.color,
    confidenceScore: Math.min(100, Math.round(highestScore * 12)),
    matchedKeywords: matchedTokensPerCategory[bestCategory] || [],
    allScores: scores,
    tensionRisk,
    riskSignals: [...highHits, ...medHits]
  };
}

/**
 * Batch classifies a list of items and groups them by national category.
 * @param {Array} items 
 * @returns {object} { categorizedItems, summaryCounts }
 */
function classifyBatch(items) {
  if (!Array.isArray(items)) return { categorized: {}, counts: {} };

  const categorized = {};
  const counts = {};

  for (const key of Object.keys(NATIONAL_PILLARS)) {
    categorized[key] = [];
    counts[key] = 0;
  }

  items.forEach(item => {
    const classification = classifyItem(item.title, item.summary || item.content || item.text);
    const enriched = {
      ...item,
      ...classification
    };
    categorized[classification.category].push(enriched);
    counts[classification.category] = (counts[classification.category] || 0) + 1;
  });

  return { categorized, counts };
}

module.exports = {
  NATIONAL_PILLARS,
  classifyItem,
  classifyBatch
};
