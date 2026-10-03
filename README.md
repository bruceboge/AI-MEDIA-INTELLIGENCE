# 🇰🇪 Kenya Media Radar: AI Early-Warning System for Emerging Public Issues & Elections

An AI-powered Media Intelligence and Conflict Early-Warning prototype built for the Kenya Media Intelligence Hackathon.

It connects to live Kenyan newsrooms (Daily Nation / Nation Africa, The Standard, Capital FM, KBC News, and national political aggregators), ingests breaking coverage on **Politics, Elections (2027), Governance, and Civil Unrest**, and runs cognitive synthesis using **Google Gemini LLM** to forecast emerging tensions and generate actionable early alerts.

---

## 🚀 Key Features

1. **Real Data Ingestion Engine**:
   - Ingests real-time RSS from up to 5 mainstream Kenyan outlets:
     - 📰 **Daily Nation (Nation Africa)** (`https://nation.africa/kenya/rss.xml` with Google News fallback)
     - 📰 **The Standard Kenya** (`https://www.standardmedia.co.ke/rss/headlines.php`)
     - 📻 **Capital FM Kenya** (`https://www.capitalfm.co.ke/news/feed/`)
     - 📺 **KBC News (Kenya Broadcasting Corp)** (`https://www.kbc.co.ke/feed/`)
     - 📡 **Kenya Politics & Election Radar** (Aggregated feed covering The Star, Citizen TV, People Daily)
   - Real-time deduplication, timestamp normalization, and excerpt extraction.

2. **Automated Threat & Topic Tagging**:
   - Classifies stories into:
     - *Elections & Succession (2027, IEBC, voter dynamics)*
     - *Civil Unrest & Protests (strikes, Gen Z movements, demonstrations)*
     - *Economy & Fiscal Policy (tax disputes, finance bills, cost of living)*
     - *Executive & Coalition Dynamics (Ruto, Gachagua, ODM/Azimio/UDA maneuvers)*
     - *Judiciary & Legal Disputes (High Court rulings, petitions)*
     - *County & Regional Politics*
   - Heuristic risk scoring (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).

3. **Gemini LLM Cognitive Intelligence Center**:
   - Computes the **National Tension Index** (0 to 100 gauge).
   - Generates an **Executive Situational Assessment** of emerging threats over 7–14 days.
   - Identifies **Regional Flashpoints** (Nairobi Metropolitan, Mt. Kenya, Rift Valley, Western, Coast).
   - Tracks **Key Political Actors** and their sentiment posture (Aggressive, Defiant, Conciliatory).
   - Proposes **Actionable Early Interventions** for civil society, election monitors, and government agencies.
   - Formats a 1-click **Urgent Flash Dispatch** for WhatsApp and Telegram broadcasting.

4. **Resilient Hackathon Presentation Design**:
   - Sleek dark glassmorphism dashboard with Nairobi live EAT clock (UTC+3).
   - Dual-column Operations Center layout.
   - Works immediately out-of-the-box: if no Gemini key is provided, an intelligent heuristic engine powers the report, and the moment a Gemini API key is entered, it automatically switches to live Gemini LLM generation.

---

## 🛠️ Quick Start

### 1. Install & Run

```bash
# Clone / navigate to project directory
cd "AI MEDIA INTELLIGENCE"

# Install dependencies (already installed in workspace)
npm install

# Start the application server
npm start
```

Open your browser to:
👉 **`http://localhost:3000`**

---

### 2. Configure Your Gemini API Key

You can configure your Google Gemini API Key in two ways:

#### Option A: In the Web Dashboard (Recommended for Demos)
1. Click the **"🔑 Gemini API"** button in the top right header.
2. Paste your Google AI Studio API key (`AIzaSy...`).
3. Click **"Save & Connect"**. The app will immediately use Gemini for subsequent analyses.

#### Option B: In `.env`
Create or edit `.env` in the root folder:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=3000
```
Then restart the server (`npm start`).

---

## 🎯 How to Present the Demo at the Hackathon

1. **Show Live Data Ingestion**:
   - Point out the active feeds: Daily Nation, The Standard, Capital FM, and KBC.
   - Click **"⚡ Scan Live Feeds"** to demonstrate live HTTP requests fetching live Kenyan headlines into the database.
   - Filter by source (e.g. click *Daily Nation* or *The Standard*) to show real headlines.
2. **Demonstrate AI Early-Warning Intelligence**:
   - Click **"🧠 Run AI Analysis"**.
   - Show the **National Tension Index** update (e.g., 65/100 Elevated).
   - Point out the **Regional Flashpoints** (e.g., Nairobi, Mt. Kenya, Rift Valley).
   - Walk through the **Actionable Advisory** for election monitors or policymakers.
3. **Showcase Rapid Incident Dispatch**:
   - Click **"📲 Copy Alert"** in the top right of the intelligence panel.
   - Paste into WhatsApp/Telegram or show the toast confirming instant broadcast formatting.
4. **Export Dossier**:
   - Click **"📥 Export Dossier"** to instantly generate a downloadable Markdown intelligence briefing for judges.

---

## 📁 Project Structure

```
├── server.js               # Express server, RSS ingestion pipeline & Gemini API integration
├── package.json            # Node.js dependencies (express, rss-parser, @google/generative-ai)
├── public/
│   ├── index.html          # Operations center dashboard UI
│   ├── css/
│   │   └── style.css       # Dark glassmorphism & responsive styling
│   └── js/
│       └── app.js          # Client-side state, live EAT clock, filtering & modal handling
├── data/                   # Persistent cache
│   ├── articles.json       # Ingested articles cache
│   ├── analysis.json       # Latest intelligence report
│   └── feeds.json          # Monitored Kenyan media feeds
├── .env.example            # Environment variables template
└── README.md               # Documentation & presentation guide
```
