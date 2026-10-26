'use client';
import React, { useState } from 'react';

export default function InvestigativeReport({ data, onClose }) {
  const [copied, setCopied] = useState(false);
  const [sourceFilter, setSourceFilter] = useState('all');

  if (!data || !data.report) return null;
  const { report, sources = [], query, totalScrapedItems = 0 } = data;

  const handleCopy = () => {
    const fullText = `
${report.headline}
${report.subhead}
${report.dateline}

EXECUTIVE BRIEF:
${report.executiveBrief}

${report.investigativeNarrative?.map(sec => `\n### ${sec.sectionTitle}\n${sec.paragraphs.join('\n\n')}`).join('\n')}

VERDICT:
${report.strategicVerdict}

SOURCES CITED:
${sources.map(s => `- [${s.name}] ${s.title}: ${s.link}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const filteredSources = sources.filter(s => {
    if (sourceFilter === 'all') return true;
    if (sourceFilter === 'broadsheet') return s.category?.includes('Broadsheet') || s.category?.includes('Newspaper');
    if (sourceFilter === 'broadcast') return s.category?.includes('Broadcast') || s.category?.includes('Radio');
    if (sourceFilter === 'social') return s.category?.includes('Social');
    return true;
  });

  return (
    <article style={{
      background: '#091628',
      border: '1px solid #1c3554',
      borderTop: '4px solid #e4a83b',
      borderRadius: '4px',
      padding: '32px 36px',
      marginBottom: '32px',
      boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
      position: 'relative'
    }}>
      {/* Top Editorial Ribbon */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #142945',
        paddingBottom: '14px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{
            background: '#e4a83b',
            color: '#071324',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 900,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            borderRadius: '2px'
          }}>
            SPECIAL INVESTIGATION
          </span>
          <span style={{ fontSize: '13px', color: '#8fa3bf' }}>
            Investigative Dossier: <strong style={{ color: '#ffffff' }}>"{query}"</strong>
          </span>
          <span style={{
            fontSize: '11px',
            color: '#cbd5e1',
            background: '#112747',
            padding: '3px 10px',
            border: '1px solid #1d3b63',
            borderRadius: '12px'
          }}>
            ⚡ {totalScrapedItems} Dispatches Scraped & Verified
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleCopy}
            style={{
              background: '#112747',
              border: '1px solid #1d3b63',
              color: '#cbd5e1',
              padding: '6px 14px',
              fontSize: '12px',
              cursor: 'pointer',
              borderRadius: '2px',
              transition: 'all 0.2s ease'
            }}
          >
            {copied ? '✅ Dossier Copied' : '📋 Copy Full Report'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: '#112747',
                border: '1px solid #1d3b63',
                color: '#8fa3bf',
                padding: '6px 12px',
                fontSize: '14px',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
              title="Close Dossier"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Broadsheet Newspaper Header */}
      <header style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: '32px',
          fontWeight: 800,
          color: '#ffffff',
          lineHeight: 1.25,
          margin: '0 0 12px'
        }}>
          {report.headline}
        </h1>
        <h2 style={{
          fontSize: '17px',
          color: '#94a3b8',
          fontWeight: 400,
          lineHeight: 1.5,
          margin: '0 0 16px',
          fontStyle: 'italic'
        }}>
          {report.subhead}
        </h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          fontSize: '11px',
          color: '#e4a83b',
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          flexWrap: 'wrap'
        }}>
          <span>📍 {report.dateline}</span>
          <span>•</span>
          <span>⏱️ {report.readingTimeMinutes || 5} Min In-Depth Read</span>
          <span>•</span>
          <span>🤖 AI Synthesis via {report.modelUsed || 'Google Gemini'}</span>
        </div>
      </header>

      {/* Executive Summary Callout Box */}
      <div style={{
        background: '#0c1e36',
        border: '1px solid #1d3b63',
        borderLeft: '4px solid #e4a83b',
        borderRadius: '3px',
        padding: '18px 24px',
        marginBottom: '32px'
      }}>
        <strong style={{
          fontSize: '11px',
          color: '#e4a83b',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          display: 'block',
          marginBottom: '8px'
        }}>
          ⚡ Executive At A Glance
        </strong>
        <p style={{ margin: 0, fontSize: '14.5px', color: '#f1f5f9', lineHeight: 1.65 }}>
          {report.executiveBrief}
        </p>
      </div>

      {/* Main Investigative Body Paragraphs */}
      <div style={{ marginBottom: '36px' }}>
        {report.investigativeNarrative?.map((section, idx) => (
          <section key={idx} style={{ marginBottom: '28px' }}>
            <h3 style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: '20px',
              fontWeight: 700,
              color: '#f8fafc',
              borderBottom: '1px solid #142945',
              paddingBottom: '8px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ color: '#e4a83b', fontSize: '14px' }}>§{idx + 1}</span>
              {section.sectionTitle}
            </h3>
            {section.paragraphs?.map((p, pIdx) => (
              <p
                key={pIdx}
                style={{
                  fontSize: '15px',
                  color: '#cbd5e1',
                  lineHeight: 1.8,
                  marginBottom: '16px',
                  textAlign: 'justify'
                }}
              >
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>

      {/* Key Disputed Claims or Quotes Callout (if present) */}
      {Array.isArray(report.keyQuotesOrClaims) && report.keyQuotesOrClaims.length > 0 && (
        <div style={{
          background: '#071220',
          border: '1px solid #142945',
          borderRadius: '4px',
          padding: '18px 22px',
          marginBottom: '32px'
        }}>
          <strong style={{ fontSize: '12px', color: '#e4a83b', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '12px' }}>
            🎙️ Critical Quotations & Disputed Dispatches on Record
          </strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {report.keyQuotesOrClaims.map((q, i) => (
              <div key={i} style={{ borderLeft: '2px solid #e4a83b', paddingLeft: '12px' }}>
                <div style={{ fontSize: '13px', color: '#ffffff', fontStyle: 'italic', marginBottom: '4px' }}>
                  "{q.quoteOrClaim}"
                </div>
                <div style={{ fontSize: '11px', color: '#8fa3bf' }}>
                  — <strong style={{ color: '#cbd5e1' }}>{q.speakerOrSource}</strong> {q.context ? `(${q.context})` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategic Analytical Verdict */}
      {report.strategicVerdict && (
        <div style={{
          background: 'linear-gradient(135deg, #091a33 0%, #0c2344 100%)',
          border: '1px solid #1e3a5f',
          borderLeft: '4px solid #38bdf8',
          borderRadius: '4px',
          padding: '18px 24px',
          marginBottom: '36px'
        }}>
          <strong style={{ fontSize: '12px', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '6px' }}>
            🎯 Strategic Analytical Forecast
          </strong>
          <p style={{ margin: 0, fontSize: '14px', color: '#f1f5f9', fontStyle: 'italic', lineHeight: 1.65 }}>
            "{report.strategicVerdict}"
          </p>
        </div>
      )}

      {/* ============================================================== */}
      {/* CLICKABLE VERIFIED SOURCES TRAY WITH BRAND ICONS */}
      {/* ============================================================== */}
      <footer style={{
        borderTop: '2px solid #142945',
        paddingTop: '24px',
        marginTop: '28px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <strong style={{ fontSize: '14px', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              🔗 Primary Scraped Sources & Evidentiary Desks
            </strong>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#8fa3bf' }}>
              Click any source card to read the full original story directly on the publisher's portal:
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', fontSize: '11px' }}>
            <button
              onClick={() => setSourceFilter('all')}
              style={{
                background: sourceFilter === 'all' ? '#e4a83b' : '#112747',
                color: sourceFilter === 'all' ? '#071324' : '#cbd5e1',
                border: 'none',
                padding: '4px 10px',
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
                padding: '4px 10px',
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
                padding: '4px 10px',
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
                padding: '4px 10px',
                borderRadius: '2px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              𝕏 / Social
            </button>
          </div>
        </div>

        {/* Sources Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '12px'
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
                background: '#071220',
                border: '1px solid #142945',
                borderRadius: '4px',
                padding: '12px 14px',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#e4a83b';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#142945';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Publication Icon Badge */}
              <div style={{
                background: src.badgeColor,
                color: src.textColor,
                width: '36px',
                height: '36px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 800,
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}>
                {src.icon}
              </div>

              {/* Source Title & Outbound Indicator */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>
                    {src.name}
                  </span>
                  <span style={{ fontSize: '10px', color: '#8fa3bf' }}>
                    {src.pubDate}
                  </span>
                </div>
                <div style={{
                  fontSize: '12.5px',
                  color: '#cbd5e1',
                  lineHeight: 1.35,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {src.title}
                </div>
                <div style={{
                  fontSize: '10.5px',
                  color: '#38bdf8',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600
                }}>
                  <span>Read original story</span>
                  <span>↗</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </footer>
    </article>
  );
}
