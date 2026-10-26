'use client';
import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function InvestigationContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || 'latest';

  const [investigation, setInvestigation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [recentList, setRecentList] = useState([]);

  useEffect(() => {
    loadInvestigation(id);
    loadRecentList();
  }, [id]);

  const loadInvestigation = async (targetId) => {
    setLoading(true);
    setError('');

    // 1. Try reading from sessionStorage for instant render
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('current_investigation');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (!targetId || targetId === 'latest' || parsed.id === targetId) {
            setInvestigation(parsed);
            setLoading(false);
          }
        }
      } catch (e) {}
    }

    // 2. Fetch fresh record from API
    try {
      const res = await fetch(`/api/investigate?id=${encodeURIComponent(targetId || 'latest')}`);
      const data = await res.json();
      if (data.success && data.report) {
        setInvestigation(data);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('current_investigation', JSON.stringify(data));
        }
      } else {
        if (!investigation) {
          setError(data.error || 'Investigation dossier not found.');
        }
      }
    } catch (err) {
      if (!investigation) {
        setError(`Failed to load investigation: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadRecentList = async () => {
    try {
      const res = await fetch('/api/investigate?type=list');
      const data = await res.json();
      if (data.success && Array.isArray(data.investigations)) {
        setRecentList(data.investigations);
      }
    } catch (e) {}
  };

  const handleCopy = () => {
    if (!investigation?.report) return;
    const { report, sources = [], query } = investigation;
    const fullText = `
${report.headline}
${report.subhead}
${report.dateline}

TOPIC: ${query}
READING TIME: ${report.readingTimeMinutes || 5} min

EXECUTIVE BRIEF:
${report.executiveBrief}

${report.investigativeNarrative?.map(sec => `\n### ${sec.sectionTitle}\n${sec.paragraphs.join('\n\n')}`).join('\n')}

STRATEGIC VERDICT:
${report.strategicVerdict}

SOURCES CITED:
${sources.map(s => `- [${s.name}] ${s.title}: ${s.link}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      alert('🔗 Direct link to this dossier copied to clipboard!');
    }
  };

  if (loading && !investigation) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#071324',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid #142945',
          borderTop: '3px solid #e4a83b',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }} />
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Loading Broadsheet Dossier...</h2>
        <p style={{ color: '#8fa3bf', fontSize: '13px' }}>Retrieving corroborated evidence and journalistic synthesis</p>
      </div>
    );
  }

  if (error && !investigation) {
    return (
      <div style={{ minHeight: '100vh', background: '#071324', color: '#ffffff', padding: '40px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '40px auto', background: '#091628', border: '1px solid #e4a83b', padding: '32px', textAlign: 'center', borderRadius: '4px' }}>
          <h2 style={{ color: '#e4a83b', marginBottom: '12px' }}>⚠️ Dossier Notice</h2>
          <p style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '24px' }}>{error}</p>
          <Link href="/" className="btn-gold" style={{ padding: '10px 24px', textDecoration: 'none', display: 'inline-block' }}>
            ← Return to Operations Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { report, sources = [], query, createdAt } = investigation;

  const filteredSources = sources.filter(s => {
    if (sourceFilter === 'all') return true;
    if (sourceFilter === 'broadsheet') return s.category?.includes('Broadsheet') || s.category?.includes('Newspaper');
    if (sourceFilter === 'broadcast') return s.category?.includes('Broadcast') || s.category?.includes('Radio');
    if (sourceFilter === 'social') return s.category?.includes('Social');
    return true;
  });

  const formattedCreated = createdAt
    ? new Date(createdAt).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', dateStyle: 'medium', timeStyle: 'short' }) + ' EAT'
    : 'Live Wire';

  return (
    <div style={{ minHeight: '100vh', background: '#06101e', color: '#ffffff' }}>
      {/* Top Fixed Operations Bar */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#091628',
        borderBottom: '1px solid #142945',
        padding: '12px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#112747',
              border: '1px solid #1d3b63',
              color: '#cbd5e1',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              borderRadius: '2px',
              transition: 'all 0.2s ease'
            }}
          >
            <span>←</span>
            <span>Back to Operations Radar</span>
          </Link>

          <span style={{ color: '#8fa3bf', fontSize: '12px' }}>
            🇰🇪 <strong>MediWatch Kenya</strong> • Special Investigation Desk
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleCopy}
            style={{
              background: '#112747',
              border: '1px solid #1d3b63',
              color: '#cbd5e1',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              borderRadius: '2px'
            }}
          >
            {copied ? '✅ Copied' : '📋 Copy Text'}
          </button>

          <button
            onClick={handlePrint}
            style={{
              background: '#112747',
              border: '1px solid #1d3b63',
              color: '#cbd5e1',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              borderRadius: '2px'
            }}
          >
            🖨️ Print / PDF
          </button>

          <button
            onClick={handleShare}
            style={{
              background: '#e4a83b',
              border: 'none',
              color: '#071324',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              borderRadius: '2px'
            }}
          >
            🔗 Share Dossier
          </button>
        </div>
      </nav>

      {/* Main Newspaper Broadsheet Container */}
      <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '36px 24px 80px' }}>
        
        {/* Newspaper Masthead Banner */}
        <div style={{
          borderBottom: '3px double #1c3554',
          paddingBottom: '16px',
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '11px',
            color: '#8fa3bf',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '6px'
          }}>
            NATIONAL MEDIA INTELLIGENCE & CORROBORATION INITIATIVE
          </div>
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: '34px',
            fontWeight: 900,
            letterSpacing: '3px',
            color: '#ffffff',
            textTransform: 'uppercase'
          }}>
            THE KENYA INTELLIGENCE DISPATCH
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#8fa3bf',
            borderTop: '1px solid #142945',
            paddingTop: '8px',
            marginTop: '12px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            <span>EDITION: SPECIAL INVESTIGATION</span>
            <span>NAIROBI, KENYA • {formattedCreated}</span>
            <span>DOSSIER #{investigation.id?.slice(4) || 'LIVE'}</span>
          </div>
        </div>

        {/* Headline & Subhead */}
        <header style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'inline-block',
            background: '#e4a83b',
            color: '#071324',
            padding: '3px 10px',
            fontSize: '10.5px',
            fontWeight: 900,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            borderRadius: '2px',
            marginBottom: '14px'
          }}>
            TOPIC INVESTIGATION: {query}
          </div>

          <h1 style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '38px',
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.2,
            margin: '0 0 16px'
          }}>
            {report.headline}
          </h1>

          <h2 style={{
            fontSize: '19px',
            color: '#94a3b8',
            fontWeight: 400,
            lineHeight: 1.5,
            margin: '0 0 20px',
            fontStyle: 'italic'
          }}>
            {report.subhead}
          </h2>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '12px',
            color: '#e4a83b',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            borderTop: '1px solid #142945',
            borderBottom: '1px solid #142945',
            padding: '10px 0',
            flexWrap: 'wrap'
          }}>
            <span>📍 {report.dateline}</span>
            <span>•</span>
            <span>⏱️ {report.readingTimeMinutes || 5} Min In-Depth Read</span>
            <span>•</span>
            <span>⚡ {investigation.totalScrapedItems || sources.length} Dispatches Corroborated</span>
            <span>•</span>
            <span>🤖 AI Synthesis via {report.modelUsed || 'Gemini 3.5 Flash'}</span>
          </div>
        </header>

        {/* Executive Summary Callout Box */}
        <div style={{
          background: '#0a1b33',
          border: '1px solid #1d3b63',
          borderLeft: '5px solid #e4a83b',
          borderRadius: '3px',
          padding: '22px 28px',
          marginBottom: '40px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          <strong style={{
            fontSize: '12px',
            color: '#e4a83b',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            display: 'block',
            marginBottom: '10px'
          }}>
            ⚡ Executive Briefing & Context
          </strong>
          <p style={{ margin: 0, fontSize: '15.5px', color: '#f8fafc', lineHeight: 1.7 }}>
            {report.executiveBrief}
          </p>
        </div>

        {/* Multi-Section Journalistic Narrative */}
        <div style={{ marginBottom: '44px' }}>
          {report.investigativeNarrative?.map((section, idx) => (
            <section key={idx} style={{ marginBottom: '36px' }}>
              <h3 style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '22px',
                fontWeight: 700,
                color: '#ffffff',
                borderBottom: '1px solid #142945',
                paddingBottom: '10px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ color: '#e4a83b', fontSize: '16px' }}>§{idx + 1}</span>
                {section.sectionTitle}
              </h3>
              {section.paragraphs?.map((p, pIdx) => (
                <p
                  key={pIdx}
                  style={{
                    fontSize: '16px',
                    color: '#cbd5e1',
                    lineHeight: 1.85,
                    marginBottom: '18px',
                    textAlign: 'justify'
                  }}
                >
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        {/* Critical Disputed Claims / On The Record Quotes */}
        {Array.isArray(report.keyQuotesOrClaims) && report.keyQuotesOrClaims.length > 0 && (
          <div style={{
            background: '#091628',
            border: '1px solid #142945',
            borderRadius: '4px',
            padding: '24px 28px',
            marginBottom: '40px'
          }}>
            <strong style={{ fontSize: '13px', color: '#e4a83b', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '16px' }}>
              🎙️ Critical Statements & Disputed Dispatches on Record
            </strong>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {report.keyQuotesOrClaims.map((q, i) => (
                <div key={i} style={{ borderLeft: '3px solid #e4a83b', paddingLeft: '14px' }}>
                  <div style={{ fontSize: '14px', color: '#ffffff', fontStyle: 'italic', marginBottom: '6px' }}>
                    "{q.quoteOrClaim}"
                  </div>
                  <div style={{ fontSize: '12px', color: '#8fa3bf' }}>
                    — <strong style={{ color: '#cbd5e1' }}>{q.speakerOrSource}</strong> {q.context ? `(${q.context})` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategic Analytical Forecast */}
        {report.strategicVerdict && (
          <div style={{
            background: 'linear-gradient(135deg, #091a33 0%, #0d274c 100%)',
            border: '1px solid #1e3a5f',
            borderLeft: '5px solid #38bdf8',
            borderRadius: '4px',
            padding: '22px 28px',
            marginBottom: '48px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
          }}>
            <strong style={{ fontSize: '12px', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
              🎯 Strategic Analytical Forecast & Verdict
            </strong>
            <p style={{ margin: 0, fontSize: '15px', color: '#f8fafc', fontStyle: 'italic', lineHeight: 1.7 }}>
              "{report.strategicVerdict}"
            </p>
          </div>
        )}

        {/* ============================================================== */}
        {/* CLICKABLE VERIFIED SOURCES TRAY WITH BRAND ICONS */}
        {/* ============================================================== */}
        <section style={{
          borderTop: '2px solid #142945',
          paddingTop: '32px',
          marginTop: '40px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                🔗 Primary Scraped Sources & Evidentiary Desks
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#8fa3bf' }}>
                Click any newsroom card below to read the original live dispatches that informed this investigation:
              </p>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', fontSize: '11px' }}>
              <button
                onClick={() => setSourceFilter('all')}
                style={{
                  background: sourceFilter === 'all' ? '#e4a83b' : '#112747',
                  color: sourceFilter === 'all' ? '#071324' : '#cbd5e1',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                All ({sources.length})
              </button>
              <button
                onClick={() => setSourceFilter('broadsheet')}
                style={{
                  background: sourceFilter === 'broadsheet' ? '#e4a83b' : '#112747',
                  color: sourceFilter === 'broadsheet' ? '#071324' : '#cbd5e1',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Newspapers
              </button>
              <button
                onClick={() => setSourceFilter('broadcast')}
                style={{
                  background: sourceFilter === 'broadcast' ? '#e4a83b' : '#112747',
                  color: sourceFilter === 'broadcast' ? '#071324' : '#cbd5e1',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                TV & Radio
              </button>
              <button
                onClick={() => setSourceFilter('social')}
                style={{
                  background: sourceFilter === 'social' ? '#e4a83b' : '#112747',
                  color: sourceFilter === 'social' ? '#071324' : '#cbd5e1',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                𝕏 / Social
              </button>
            </div>
          </div>

          {/* Sources Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
            gap: '14px'
          }}>
            {filteredSources.map((src, i) => (
              <a
                key={i}
                href={src.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  background: '#091628',
                  border: '1px solid #142945',
                  borderRadius: '4px',
                  padding: '14px 16px',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#e4a83b';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#142945';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Brand Badge Icon */}
                <div style={{
                  background: src.badgeColor,
                  color: src.textColor,
                  width: '38px',
                  height: '38px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 800,
                  flexShrink: 0
                }}>
                  {src.icon}
                </div>

                {/* Source Metadata & Title */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#ffffff' }}>
                      {src.name}
                    </span>
                    <span style={{ fontSize: '10.5px', color: '#8fa3bf' }}>
                      {src.pubDate}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#cbd5e1',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {src.title}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#38bdf8',
                    marginTop: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600
                  }}>
                    <span>Open original news report</span>
                    <span>↗</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Recent Investigations Carousel / List */}
        {recentList.length > 1 && (
          <div style={{
            marginTop: '56px',
            borderTop: '1px solid #142945',
            paddingTop: '28px'
          }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '13px', color: '#8fa3bf', textTransform: 'uppercase', letterSpacing: '1px' }}>
              📚 Explore Other Recent Topic Dossiers
            </h4>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px' }}>
              {recentList.filter(item => item.id !== investigation.id).slice(0, 6).map((item, i) => (
                <Link
                  key={i}
                  href={`/investigation?id=${item.id}`}
                  style={{
                    minWidth: '240px',
                    background: '#091628',
                    border: '1px solid #142945',
                    borderRadius: '4px',
                    padding: '12px 14px',
                    textDecoration: 'none',
                    flexShrink: 0
                  }}
                >
                  <div style={{ fontSize: '10px', color: '#e4a83b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    {item.query}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#ffffff',
                    fontWeight: 600,
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {item.headline}
                  </div>
                  <div style={{ fontSize: '10px', color: '#8fa3bf', marginTop: '6px' }}>
                    {item.totalSources} sources • {item.readingTimeMinutes} min read
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function InvestigationPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#071324', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
        Loading Investigation Dossier...
      </div>
    }>
      <InvestigationContent />
    </Suspense>
  );
}
