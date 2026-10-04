/**
 * Gemini AI Synthesis Engine (ES Module)
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function synthesizeIntelligence(articles = [], customFocus = '') {
  if (!GEMINI_API_KEY || articles.length === 0) {
    return generateFallbackBrief(articles, customFocus);
  }

  const prompt = `You are the Lead Intelligence Analyst at MediWatch Kenya.
Analyze the following ${articles.length} verified news and social posts.
${customFocus ? `Custom Focus: ${customFocus}` : ''}

Return ONLY valid JSON matching this structure:
{
  "nationalExecutiveBrief": "2-3 sentences concise strategic summary of current events.",
  "strategicRiskLevel": "LOW" | "MEDIUM" | "HIGH",
  "narratives": [
    { "title": "Narrative Headline", "domain": "National", "velocity": "HIGH" | "MEDIUM", "summary": "1 sentence explanation." }
  ],
  "spreadingClaims": [
    { "claim": "Atomic factual claim", "claimant": "Originating outlet/figure", "hasContradiction": false }
  ],
  "activeAlerts": [
    { "title": "Critical warning", "severity": "HIGH" | "MEDIUM", "actionableAdvisory": "Actionable stakeholder advisory." }
  ],
  "sentimentDistribution": { "negativePct": 45, "neutralPct": 35, "positivePct": 20 }
}`;

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.15, responseMimeType: 'application/json' }
    });

    const payload = articles.slice(0, 20).map(a => ({
      title: a.title,
      source: a.sourceName,
      summary: (a.summary || a.text || '').slice(0, 160)
    }));

    const result = await model.generateContent([
      { text: prompt },
      { text: `Data:\n${JSON.stringify(payload)}` }
    ]);

    const cleaned = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('[GEMINI] Synthesis warning:', err.message);
    return generateFallbackBrief(articles, customFocus);
  }
}

function generateFallbackBrief(articles = [], customFocus = '') {
  const top = articles[0] || { title: 'General surveillance active', sourceName: 'Kenyan Press' };
  return {
    nationalExecutiveBrief: `Real-time intelligence active across verified Kenyan media. Current lead focus: "${top.title}".`,
    strategicRiskLevel: articles.some(a => a.tensionRisk === 'HIGH') ? 'HIGH' : 'MEDIUM',
    narratives: articles.slice(0, 3).map(a => ({
      title: a.title,
      domain: a.categoryLabel || 'National',
      velocity: a.tensionRisk === 'HIGH' ? 'HIGH' : 'MEDIUM',
      summary: a.summary ? a.summary.slice(0, 120) + '...' : 'Verified press reporting.'
    })),
    spreadingClaims: articles.slice(0, 2).map(a => ({
      claim: a.title,
      claimant: a.sourceName,
      hasContradiction: false
    })),
    activeAlerts: [
      {
        title: top.title,
        severity: 'MEDIUM',
        actionableAdvisory: 'Maintain ongoing monitoring of statements from verified officials and regulatory bodies.'
      }
    ],
    sentimentDistribution: { negativePct: 40, neutralPct: 40, positivePct: 20 }
  };
}
