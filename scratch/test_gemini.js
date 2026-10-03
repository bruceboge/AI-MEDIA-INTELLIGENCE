require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const articles = JSON.parse(fs.readFileSync('./data/articles.json', 'utf8')).slice(0, 15);
console.log('Real Kenyan articles loaded:', articles.length);
console.log('Sample headlines:', articles.slice(0, 3).map(a => a.title));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-3.5-flash',
  generationConfig: { responseMimeType: 'application/json' }
});

const payload = articles.map((a, i) => ({ index: i + 1, title: a.title, source: a.sourceName, summary: a.summary }));
const prompt = `Analyze these real live Kenya news articles from Daily Nation, Standard, Capital FM, and KBC.
Return a JSON object with:
{
  "nationalTensionIndex": number (0-100),
  "overallThreatLevel": "LOW" | "ELEVATED" | "HIGH" | "CRITICAL",
  "executiveSummary": "2 paragraphs analyzing these specific events",
  "keyRealActorsMentioned": ["actors from these headlines"],
  "topEmergingIssues": [{"title": "issue title", "severity": "HIGH"|"MEDIUM"|"LOW"}]
}
Articles:
` + JSON.stringify(payload, null, 2);

model.generateContent(prompt).then(r => {
  console.log('--- GEMINI SYNTHESIS OF REAL NEWS ---');
  console.log(r.response.text());
}).catch(console.error);
