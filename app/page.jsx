'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import DynamicSearchBar from '@/components/DynamicSearchBar';
import KpiCards from '@/components/KpiCards';
import MentionVolumeChart from '@/components/MentionVolumeChart';
import SentimentDonut from '@/components/SentimentDonut';
import TopStories from '@/components/TopStories';
import ArticleFeed from '@/components/ArticleFeed';
import AuthModal from '@/components/AuthModal';
import SocialRadarModal from '@/components/SocialRadarModal';
import ViewDataModal from '@/components/ViewDataModal';
import { extractTrendingHashtags } from '@/lib/trends';

export default function DashboardPage() {
  const [articles, setArticles] = useState([]);
  const [report, setReport] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [viewDataOpen, setViewDataOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [activeSession, setActiveSession] = useState(null);

  // Extraction loading states
  const [isExtractingRss, setIsExtractingRss] = useState(false);
  const [isExtractingApify, setIsExtractingApify] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    loadInitialData();
    const stored = localStorage.getItem('mw_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch (e) {}
    }
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 5000);
  };

  const loadInitialData = async () => {
    try {
      const res = await fetch('/api/articles?limit=80');
      const data = await res.json();
      if (Array.isArray(data)) {
        setArticles(data);
      }
    } catch (e) {
      console.warn('Initial load warning');
    }
  };

  // Manual Trigger 1: Extract RSS News
  const handleExtractRss = async () => {
    setIsExtractingRss(true);
    try {
      const res = await fetch('/api/extract/rss', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ ${data.message}`);
        await loadInitialData();
      } else {
        showToast(`⚠️ Extraction note: ${data.error || 'Failed'}`);
      }
    } catch (err) {
      showToast(`❌ Error extracting RSS: ${err.message}`);
    } finally {
      setIsExtractingRss(false);
    }
  };

  // Manual Trigger 2: Harvest Apify 𝕏 Posts (bypassing 24h shield)
  const handleExtractApify = async () => {
    setIsExtractingApify(true);
    try {
      const res = await fetch('/api/extract/apify', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ ${data.message}`);
        await loadInitialData();
      } else {
        showToast(`⚠️ Harvest note: ${data.error || 'Failed'}`);
      }
    } catch (err) {
      showToast(`❌ Error harvesting Apify: ${err.message}`);
    } finally {
      setIsExtractingApify(false);
    }
  };

  // Manual Trigger 3: Nuclear Reset All
  const handleResetAll = async () => {
    if (!window.confirm('Nuclear Reset: This will purge all active sessions, invalidate cache shields, and reset all database items. Proceed?')) {
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('🔄 Complete system reset done. Cache shields cleared.');
        setReport(null);
        setActiveSession(null);
        await loadInitialData();
      }
    } catch (err) {
      showToast(`❌ Error resetting: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleDynamicSearch = async ({ query, category, customPrompt }) => {
    setIsSearching(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          category,
          customPrompt,
          userId: user ? user.id : 'anon'
        })
      });

      const data = await res.json();
      if (data.items) setArticles(data.items);
      if (data.report) setReport(data.report);
      if (data.sessionId) setActiveSession(data.sessionId);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const rssCount = articles.filter(a => a.sourceType !== 'social_x').length;
  const socialCount = articles.filter(a => a.sourceType === 'social_x').length;

  const highRiskCount = articles.filter(a => (a.tensionRisk || a.risk_level || a.initialRisk) === 'HIGH').length;
  const computedRisk = report
    ? report.strategicRiskLevel
    : (highRiskCount >= 5 || (articles.length > 0 && highRiskCount / articles.length > 0.15) ? 'HIGH' : (highRiskCount > 0 ? 'MEDIUM' : 'STABLE'));

  // Calculate dynamic top 5 trending hashtags and topics from active articles
  const trendingTopics = useMemo(() => extractTrendingHashtags(articles, 5), [articles]);

  return (
    <div style={{ minHeight: '100vh', background: '#071324', color: '#ffffff' }}>
      <Navbar
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenSocial={() => setSocialOpen(true)}
        onOpenViewData={() => setViewDataOpen(true)}
        onExtractRss={handleExtractRss}
        onExtractApify={handleExtractApify}
        onResetAll={handleResetAll}
        isExtractingRss={isExtractingRss}
        isExtractingApify={isExtractingApify}
        isResetting={isResetting}
      />

      {/* Floating Status Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#09182d',
          border: '1px solid #e4a83b',
          borderRadius: '2px',
          padding: '12px 18px',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          zIndex: 999
        }}>
          {toastMsg}
        </div>
      )}

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 24px' }}>
        {/* Dynamic Investigation Bar */}
        <DynamicSearchBar onSearch={handleDynamicSearch} isSearching={isSearching} />

        {/* Executive Strategic Brief Banner (When AI report is active) */}
        {report && (
          <div style={{
            background: '#0b1a2f',
            border: '1px solid #142945',
            borderLeft: '4px solid #e4a83b',
            borderRadius: '2px',
            padding: '16px 20px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <strong style={{ fontSize: '13px', color: '#e4a83b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ⚡ Gemini Strategic Intelligence Synthesis
              </strong>
              <span className={`badge-sentiment ${report.strategicRiskLevel === 'HIGH' ? '' : 'pos'}`}>
                {report.strategicRiskLevel} RISK
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
              {report.nationalExecutiveBrief}
            </p>
          </div>
        )}

        {/* Adjusted Consolidated KPI Cards + Dynamic Swiping Trending Hashtags */}
        <KpiCards
          totalStories={articles.length}
          rssCount={rssCount}
          socialCount={socialCount}
          riskLevel={computedRisk}
          trends={trendingTopics}
          onSelectTag={(tag) => handleDynamicSearch({ query: tag.replace('#', '') })}
        />

        {/* Middle Analytics Grid (Dynamically Calculated from Database Items) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <MentionVolumeChart articles={articles} />
          <SentimentDonut sentiment={report ? report.sentimentDistribution : null} articles={articles} />
          <TopStories narratives={report ? report.narratives : []} articles={articles} />
        </div>

        {/* Main Corroborated Feed */}
        <ArticleFeed articles={articles} />
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthSuccess={(u) => setUser(u)}
        initialUser={user}
      />

      <SocialRadarModal
        isOpen={socialOpen}
        onClose={() => setSocialOpen(false)}
      />

      <ViewDataModal
        isOpen={viewDataOpen}
        onClose={() => setViewDataOpen(false)}
        onRefreshData={loadInitialData}
      />
    </div>
  );
}
