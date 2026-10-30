'use client'

import React, { useState, useEffect } from 'react'

interface PatternComparison {
  previous: number
  current: number
  change: number
  descriptor: string
}

interface ProgressComparison {
  first_try_percent: {
    previous: number
    current: number
    change: number
    descriptor: string
  }
  hints_per_10: {
    previous: number
    current: number
    change: number
    descriptor: string
  }
  self_corrections: {
    previous: number
    current: number
    change: number
    descriptor: string
  }
  stage: {
    previous: number
    current: number
    change: number
    descriptor: string
  }
  patterns: Record<string, PatternComparison>
}

interface SessionHistoryItem {
  session_number: number
  ended_at: string
  first_try_percent: number
  hints_per_10: number
  words_attempted: number
  self_corrections: number
  stage: number
}

interface ProgressData {
  status: 'ok' | 'not_enough_sessions' | 'error'
  child_id?: string
  total_sessions?: number
  session_count?: number
  message?: string
  comparison?: ProgressComparison
  history?: SessionHistoryItem[]
}

interface ProgressTabProps {
  childId: string
  studentName?: string
}

export default function ProgressTab({ childId, studentName }: ProgressTabProps) {
  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [hasError, setHasError] = useState<boolean>(false)

  const cleanId = (childId || 'emma').toLowerCase().trim().split(' ')[0]
  const displayName = studentName || (cleanId.charAt(0).toUpperCase() + cleanId.slice(1))
  const firstName = displayName.split(' ')[0]

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setHasError(false)

    async function fetchProgress() {
      // Try local endpoints in order of preference
      const urls = [
        `/children/${cleanId}/progress`,
        `/api/backend/children/${cleanId}/progress`,
        `http://127.0.0.1:8000/children/${cleanId}/progress`,
      ]

      let result: ProgressData | null = null

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            cache: 'no-store',
            signal: AbortSignal.timeout(2500),
          })
          if (res.ok) {
            const json = await res.json()
            if (json && (json.status === 'ok' || json.status === 'not_enough_sessions')) {
              result = json
              break
            }
          }
        } catch {
          // Try next URL fallback
        }
      }

      if (isMounted) {
        if (result) {
          setData(result)
          setHasError(false)
        } else {
          setHasError(true)
        }
        setLoading(false)
      }
    }

    fetchProgress()
    return () => {
      isMounted = false
    }
  }, [cleanId])

  if (loading) {
    return (
      <div
        role="tabpanel"
        id="tabpanel-progress"
        aria-labelledby="tab-progress"
        style={{
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          color: '#9CA3AF',
          fontSize: '1rem',
          minHeight: 240,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span>Loading session progress...</span>
      </div>
    )
  }

  if (hasError || !data) {
    return (
      <div
        role="tabpanel"
        id="tabpanel-progress"
        aria-labelledby="tab-progress"
        style={{
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          color: '#E2E8F0',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1.5px solid #1F2937',
          borderRadius: 14,
          margin: '1rem 0',
        }}
      >
        <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#F3F4F6', margin: 0 }}>
          Progress isn&apos;t available right now
        </p>
        <p style={{ fontSize: '0.9rem', color: '#9CA3AF', marginTop: 8 }}>
          The progress tracking service could not be reached. The rest of the session report remains active.
        </p>
      </div>
    )
  }

  if (data.status === 'not_enough_sessions') {
    return (
      <div
        role="tabpanel"
        id="tabpanel-progress"
        aria-labelledby="tab-progress"
        style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1.5px dashed rgba(16, 185, 129, 0.3)',
          borderRadius: 16,
          margin: '1rem 0',
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🌱</div>
        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#F9FAFB', margin: '0 0 8px' }}>
          Progress appears after 2 sessions.
        </h3>
        <p style={{ fontSize: '0.95rem', color: '#D1D5DB', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
          {firstName} currently has {data.session_count || 0} completed session. WordBloom calculates authentic,
          evidence-based progress comparisons as soon as a second practice session is completed.
        </p>
      </div>
    )
  }

  const comp = data.comparison
  const history = data.history || []

  const formatPatternLabel = (key: string): string => {
    switch (key.toLowerCase()) {
      case 'reversal':
        return 'b/d letter mix-ups'
      case 'blend':
        return 'Consonant blend patterns'
      case 'vowel_team':
        return 'Vowel team patterns'
      case 'silent_letter':
        return 'Silent letter patterns'
      case 'digraph':
        return 'Letter digraphs'
      default:
        return `${key.replace(/_/g, ' ')} patterns`
    }
  }

  const getDescriptorStyle = (desc: string) => {
    switch (desc.toLowerCase()) {
      case 'fewer':
      case 'more':
      case 'advanced':
        return {
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#34D399',
          border: '1px solid rgba(16, 185, 129, 0.35)',
        }
      case 'worth practising':
      case 'consolidating':
        return {
          background: 'rgba(245, 158, 11, 0.12)',
          color: '#FBBF24',
          border: '1px solid rgba(245, 158, 11, 0.35)',
        }
      default:
        return {
          background: 'rgba(156, 163, 175, 0.12)',
          color: '#D1D5DB',
          border: '1px solid rgba(156, 163, 175, 0.3)',
        }
    }
  }

  const getArrowSymbol = (desc: string, change: number) => {
    if (change === 0 || desc === 'same' || desc === 'steady') return '→'
    if (desc === 'fewer') return '↓'
    if (desc === 'more' || desc === 'advanced') return '↑'
    return '→'
  }

  return (
    <div
      role="tabpanel"
      id="tabpanel-progress"
      aria-labelledby="tab-progress"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.75rem',
        padding: '1.5rem',
      }}
    >
      {/* Section 1: Then and Now */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F9FAFB', margin: 0 }}>
              Then and now
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#9CA3AF', margin: '4px 0 0' }}>
              Comparing {firstName}&apos;s previous session to the current session
            </p>
          </div>
          <span style={{ fontSize: '0.82rem', color: '#9CA3AF', fontWeight: 600 }}>
            Total sessions: {data.total_sessions || history.length}
          </span>
        </div>

        {comp && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {/* Metric 1: Right first time */}
            <div
              style={{
                background: '#0B0F19',
                border: '1.5px solid #1F2937',
                borderRadius: 14,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 700 }}>
                Right first time
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#F9FAFB', margin: '8px 0' }}>
                {comp.first_try_percent.previous}% → {comp.first_try_percent.current}%
              </div>
              <div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 10px',
                    borderRadius: 12,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    ...getDescriptorStyle(comp.first_try_percent.descriptor),
                  }}
                >
                  <span>{getArrowSymbol(comp.first_try_percent.descriptor, comp.first_try_percent.change)}</span>
                  <span>{comp.first_try_percent.descriptor}</span>
                </span>
              </div>
            </div>

            {/* Metric 2: Hints per 10 words */}
            <div
              style={{
                background: '#0B0F19',
                border: '1.5px solid #1F2937',
                borderRadius: 14,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 700 }}>
                Hints used
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#F9FAFB', margin: '8px 0' }}>
                {comp.hints_per_10.previous} → {comp.hints_per_10.current}{' '}
                <span style={{ fontSize: '0.9rem', color: '#9CA3AF', fontWeight: 500 }}>per 10 words</span>
              </div>
              <div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 10px',
                    borderRadius: 12,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    ...getDescriptorStyle(comp.hints_per_10.descriptor),
                  }}
                >
                  <span>{getArrowSymbol(comp.hints_per_10.descriptor, comp.hints_per_10.change)}</span>
                  <span>{comp.hints_per_10.descriptor}</span>
                </span>
              </div>
            </div>

            {/* Metric 3: Self-corrections */}
            <div
              style={{
                background: '#0B0F19',
                border: '1.5px solid #1F2937',
                borderRadius: 14,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 700 }}>
                Self-corrections
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#F9FAFB', margin: '8px 0' }}>
                {comp.self_corrections.previous} → {comp.self_corrections.current}
              </div>
              <div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 10px',
                    borderRadius: 12,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    ...getDescriptorStyle(comp.self_corrections.descriptor),
                  }}
                >
                  <span>{getArrowSymbol(comp.self_corrections.descriptor, comp.self_corrections.change)}</span>
                  <span>{comp.self_corrections.descriptor}</span>
                </span>
              </div>
            </div>

            {/* Metric 4: Reading Stage */}
            <div
              style={{
                background: '#0B0F19',
                border: '1.5px solid #1F2937',
                borderRadius: 14,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 700 }}>
                Reading Stage
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#F9FAFB', margin: '8px 0' }}>
                Stage {comp.stage.previous} → Stage {comp.stage.current}
              </div>
              <div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 10px',
                    borderRadius: 12,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    ...getDescriptorStyle(comp.stage.descriptor),
                  }}
                >
                  <span>{getArrowSymbol(comp.stage.descriptor, comp.stage.change)}</span>
                  <span>{comp.stage.descriptor}</span>
                </span>
              </div>
            </div>

            {/* Specific Pattern Comparisons */}
            {Object.entries(comp.patterns).map(([key, val]) => (
              <div
                key={key}
                style={{
                  background: '#0B0F19',
                  border: '1.5px solid #1F2937',
                  borderRadius: 14,
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 700 }}>
                  {formatPatternLabel(key)}
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#F9FAFB', margin: '8px 0' }}>
                  {val.previous} → {val.current}
                </div>
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      ...getDescriptorStyle(val.descriptor),
                    }}
                  >
                    <span>{getArrowSymbol(val.descriptor, val.change)}</span>
                    <span>{val.descriptor}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Last 5 sessions */}
      {history.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px' }}>
            Last {Math.min(5, history.length)} sessions
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#9CA3AF', margin: '0 0 14px' }}>
            Tracking right first time % and hint frequency over recent sessions
          </p>

          {/* Visual Mini Chart (accessible SVG with text companion) */}
          <div
            role="img"
            aria-label={`Progress chart for the last ${history.length} sessions showing first try percentage and hints per 10 words`}
            style={{
              background: '#0B0F19',
              border: '1.5px solid #1F2937',
              borderRadius: 14,
              padding: '18px 20px',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 14, fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 4, background: '#10B981' }} />
                <span style={{ color: '#D1D5DB', fontWeight: 600 }}>Right first time %</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 4, background: '#60A5FA' }} />
                <span style={{ color: '#D1D5DB', fontWeight: 600 }}>Hints per 10 words</span>
              </div>
            </div>

            {/* SVG Visual Bars */}
            <svg
              viewBox={`0 0 ${history.length * 90 + 40} 140`}
              style={{ width: '100%', maxHeight: 150, overflow: 'visible' }}
            >
              <line x1="20" y1="110" x2={history.length * 90 + 20} y2="110" stroke="#374151" strokeWidth="1" />
              {history.map((s, idx) => {
                const x = 35 + idx * 90
                // Scale first try % (0-100) to height (0-80)
                const barHeight = Math.max(6, Math.min(80, (s.first_try_percent / 100) * 80))
                const barY = 110 - barHeight

                // Scale hints per 10 (0-10) to height (0-80)
                const hintBarHeight = Math.max(6, Math.min(80, (s.hints_per_10 / 10) * 80))
                const hintBarY = 110 - hintBarHeight

                return (
                  <g key={idx}>
                    {/* First Try % Bar */}
                    <rect
                      x={x - 22}
                      y={barY}
                      width={18}
                      height={barHeight}
                      rx={3}
                      fill="#10B981"
                    />
                    <text
                      x={x - 13}
                      y={barY - 5}
                      fill="#A7F3D0"
                      fontSize="11"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {Math.round(s.first_try_percent)}%
                    </text>

                    {/* Hints Bar */}
                    <rect
                      x={x + 2}
                      y={hintBarY}
                      width={18}
                      height={hintBarHeight}
                      rx={3}
                      fill="#60A5FA"
                    />
                    <text
                      x={x + 11}
                      y={hintBarY - 5}
                      fill="#BFDBFE"
                      fontSize="11"
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {s.hints_per_10}
                    </text>

                    {/* Session Label */}
                    <text
                      x={x}
                      y="126"
                      fill="#9CA3AF"
                      fontSize="11"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      S{s.session_number}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Numbers As Text Table (Accessibility companion) */}
          <div
            style={{
              overflowX: 'auto',
              borderRadius: 12,
              border: '1px solid #1F2937',
              background: '#0B0F19',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1F2937', color: '#9CA3AF' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Session</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Right first time</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Hints per 10</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Words tried</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Stage</th>
                </tr>
              </thead>
              <tbody>
                {history.map((s, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: i === history.length - 1 ? 'none' : '1px solid #1F2937',
                      color: '#F9FAFB',
                    }}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 700 }}>Session {s.session_number}</td>
                    <td style={{ padding: '10px 14px', color: '#34D399', fontWeight: 700 }}>{s.first_try_percent}%</td>
                    <td style={{ padding: '10px 14px', color: '#93C5FD' }}>{s.hints_per_10}</td>
                    <td style={{ padding: '10px 14px' }}>{s.words_attempted}</td>
                    <td style={{ padding: '10px 14px' }}>Stage {s.stage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

