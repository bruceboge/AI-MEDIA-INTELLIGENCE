'use client';
import React, { useState } from 'react';

export default function DynamicSearchBar({ onSearch, isSearching }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [customPrompt, setCustomPrompt] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch({ query: query.trim(), category, customPrompt: customPrompt.trim() });
  };

  return (
    <div style={{
      background: '#0b1a2f',
      border: '1px solid #142945',
      borderLeft: '3px solid #e4a83b',
      borderRadius: '2px',
      padding: '16px 20px',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#e4a83b', fontWeight: 800, fontSize: '13px' }}>⚡ DYNAMIC TOPIC INVESTIGATION</span>
          <span style={{ fontSize: '11px', color: '#8fa3bf', background: '#112747', padding: '2px 8px', border: '1px solid #1d3b63', borderRadius: '2px' }}>
            Real-Time News & 𝕏 Scraping + Fast Pre-Classifier
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter any topic or question (e.g. Doctors Strike, CBC Funding, SHIF Rollout, Finance Bill)..."
            style={{
              flex: 2, minWidth: '280px', background: '#050d18',
              border: '1px solid #1d3b63', borderRadius: '2px',
              padding: '10px 14px', color: '#ffffff', fontSize: '13px'
            }}
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              flex: 1, minWidth: '180px', background: '#050d18',
              border: '1px solid #1d3b63', borderRadius: '2px',
              padding: '10px 12px', color: '#cbd5e1', fontSize: '13px'
            }}
          >
            <option value="all">All National Pillars</option>
            <option value="politics">🏛️ Politics & Elections</option>
            <option value="governance">📜 Governance & Policy</option>
            <option value="corruption">🛡️ Corruption & EACC</option>
            <option value="health">🏥 Health & Social</option>
            <option value="education">🎓 Education & CBC</option>
            <option value="economy">📈 Economy & Finance</option>
            <option value="security">🚨 Security & Order</option>
            <option value="trends">🌐 Civic Trends</option>
          </select>

          <button
            type="submit"
            disabled={isSearching}
            className="btn-gold"
            style={{ padding: '10px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isSearching ? '⏳ Analyzing...' : '🔍 Harvest & Analyze'}
          </button>
        </div>

        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#8fa3bf' }}>Custom AI Prompt (Optional):</span>
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g. Focus on economic impact, rural counties, and official government rebuttals..."
            style={{
              flex: 1, background: '#050d18', border: '1px solid #142945',
              borderRadius: '2px', padding: '6px 12px', color: '#cbd5e1', fontSize: '12px'
            }}
          />
        </div>
      </form>
    </div>
  );
}
