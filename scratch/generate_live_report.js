require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const articles = JSON.parse(fs.readFileSync('./data/articles.json', 'utf8')).slice(0, 20);

const payload = articles.map((a, i) => ({
  index: i + 1,
  title: a.title,
  source: a.sourceName,
  topic: a.topic,
  summary: a.summary
}));

const systemPrompt = `You are the lead media intelligence analyst at the AI Early-Warning Conflict & Governance Monitoring Center in Nairobi, Kenya.
Analyze ONLY these real news stories from Daily Nation, The Standard, Capital FM, and KBC News.
Return a STRICT JSON object with schema:
{
  "nationalTensionIndex": number (0-100),
  "overallThreatLevel": "LOW" | "ELEVATED" | "HIGH" | "CRITICAL",
  "executiveSummary": "2-3 paragraphs synthesizing what is happening in Kenya based on these real news stories",
  "topEmergingIssues": [
    {
      "title": "Clear title describing the real issue from the news",
      "category": "Elections" | "Governance" | "Civil Unrest" | "Economic Discontent" | "Judiciary",
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "tensionScore": number (0-100),
      "hotspots": ["Kenya counties or cities directly mentioned"],
      "warningSignals": ["Specific trigger from news 1", "Specific trigger from news 2"],
      "contributingOutlets": ["Outlets that reported this"],
      "recommendedAction": "Practical early warning advisory"
    }
  ],
  "regionalFlashpoints": [
    {
      "region": "e.g. Nairobi, Mt Kenya, Rift Valley, Western, Coast",
      "status": "ALERT" | "WATCH" | "STABLE",
      "drivers": "Specific real drivers from news"
    }
  ],
  "keyActorsUnderWatch": [
    {
      "name": "Real person or party from news",
      "role": "What they said or did",
      "sentiment": "Aggressive" | "Conciliatory" | "Defiant" | "Neutral"
    }
  ],
  "flashAlertText": "Urgent 2-3 line dispatch for WhatsApp/Telegram"
}
DO NOT wrap in markdown fences. Return ONLY the JSON string.`;

(async () => {
  try {
    console.log('Sending real Kenyan articles to Gemini 3.5 Flash...');
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: 'Articles:\n' + JSON.stringify(payload, null, 2) }
    ]);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(text);
    parsed.modelUsed = 'Google Gemini 3.5 Flash';
    parsed.analyzedAt = new Date().toISOString();
    parsed.articlesAnalyzedCount = articles.length;
    fs.writeFileSync('./data/analysis.json', JSON.stringify(parsed, null, 2));
    console.log('SUCCESS! Real Gemini report generated and saved to ./data/analysis.json');
    console.log('National Tension Index:', parsed.nationalTensionIndex);
    console.log('Threat Level:', parsed.overallThreatLevel);
    console.log('Top Issues:', parsed.topEmergingIssues.map(i => i.title));
    console.log('Real Actors Under Watch:', parsed.keyActorsUnderWatch.map(a => a.name));
  } catch (err) {
    console.error('Gemini error:', err);
  }
})();
