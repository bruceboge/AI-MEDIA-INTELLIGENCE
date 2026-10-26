'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  const [investigationData, setInvestigationData] = useState(null);
  const [isInvestigating, setIsInvestigating] = useState(false);

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
        setInvestigationData(null);
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
    setIsInvestigating(true);
    try {
      const searchPromise = fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          category,
          customPrompt,
          userId: user ? user.id : 'anon'
        })
      }).then(r => r.json());

      const investigatePromise = fetch('/api/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      }).then(r => r.json());

      const [searchRes, investigateRes] = await Promise.allSettled([searchPromise, investigatePromise]);

      if (searchRes.status === 'fulfilled' && searchRes.value) {
        if (searchRes.value.items) setArticles(searchRes.value.items);
        if (searchRes.value.report) setReport(searchRes.value.report);
        if (searchRes.value.sessionId) setActiveSession(searchRes.value.sessionId);
      }

      if (investigateRes.status === 'fulfilled' && investigateRes.value && investigateRes.value.success) {
        const inv = investigateRes.value;
        setInvestigationData(inv);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('current_investigation', JSON.stringify(inv));
        }
        showToast(`📰 Broadsheet Feature Ready: "${inv.report?.headline?.slice(0, 45)}..."`);
      }
    } catch (err) {
      console.error('Search / Investigation error:', err);
    } finally {
      setIsSearching(false);
      setIsInvestigating(false);
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

        {/* Loading Indicator for Deep Investigative Broadsheet */}
        {isInvestigating && (
          <div style={{
            background: '#091628',
            border: '1px solid #1c3554',
            borderLeft: '4px solid #e4a83b',
            borderRadius: '4px',
            padding: '18px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '3px solid #142945',
              borderTop: '3px solid #e4a83b',
              borderRadius: '50%',
              display: 'inline-block'
            }} />
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>
                📰 Composing Broadsheet Investigative Feature...
              </div>
              <div style={{ fontSize: '12px', color: '#8fa3bf', marginTop: '2px' }}>
                Harvesting real-time dispatches from Daily Nation, Standard, Citizen, KBC & 𝕏, then synthesizing deep narrative with Google Gemini.
              </div>
            </div>
          </div>
        )}

        {/* Broadsheet Notification Card with 1-Click Redirect to Dedicated Page */}
        {investigationData && (
          <div style={{
            background: 'linear-gradient(135deg, #091a33 0%, #0d2547 100%)',
            border: '1px solid #e4a83b',
            borderLeft: '5px solid #e4a83b',
            borderRadius: '4px',
            padding: '20px 24px',
            marginBottom: '26px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            position: 'relative'
          }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '18px' }}>📰</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 900,
                  color: '#e4a83b',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Special Broadsheet Dossier Ready
                </span>
                <span style={{
                  fontSize: '10.5px',
                  background: '#142945',
                  color: '#cbd5e1',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  ⏱️ {investigationData.report?.readingTimeMinutes || 5} min read
                </span>
                <span style={{
                  fontSize: '10.5px',
                  background: '#112747',
                  color: '#38bdf8',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  ⚡ {investigationData.sources?.length || 0} Sources Corroborated
                </span>
              </div>

              <h2 style={{
                margin: '0 0 6px',
                fontFamily: 'Georgia, serif',
                fontSize: '20px',
                color: '#ffffff',
                lineHeight: 1.3
              }}>
                {investigationData.report?.headline}
              </h2>

              <p style={{
                margin: 0,
                fontSize: '13px',
                color: '#94a3b8',
                lineHeight: 1.45,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {investigationData.report?.subhead || investigationData.report?.executiveBrief}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link
                href={`/investigation?id=${investigationData.id}`}
                className="btn-gold"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 22px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  borderRadius: '3px',
                  boxShadow: '0 4px 16px rgba(228, 168, 59, 0.4)'
                }}
              >
                <span>Read Full Investigation</span>
                <span style={{ fontSize: '16px' }}>→</span>
              </Link>

              <button
                onClick={() => setInvestigationData(null)}
                style={{
                  background: '#112747',
                  border: '1px solid #1d3b63',
                  color: '#8fa3bf',
                  padding: '10px 12px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  borderRadius: '3px'
                }}
                title="Dismiss Banner"
              >
                ✕
              </button>
            </div>
          </div>
        )}

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
