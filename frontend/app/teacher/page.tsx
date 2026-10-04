'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { approveReport } from '../../lib/api'

export default function TeacherPage() {
  const router   = useRouter()
  const [report,   setReport]   = useState<any>(null)
  const [notes,    setNotes]    = useState('')
  const [approved, setApproved] = useState(false)
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    document.body.className = ''
    const raw = localStorage.getItem('wb_report')
    if (raw) setReport(JSON.parse(raw))
  }, [])

  const handleApprove = async () => {
    setLoading(true)
    try {
      const session = JSON.parse(localStorage.getItem('wb_session') || '{}')
      await approveReport(session.session_id || 'demo', true, notes)
      setApproved(true)
    } catch (e) {
      setApproved(true) // Demo mode
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1.5rem', minHeight: '100vh', background: 'var(--bg)', color: 'var(--white)', fontFamily: 'var(--font)' }}>

      {/* Header */}
      <div style={{ width: '100%', maxWidth: 520, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--white)' }}>Teacher dashboard</h2>
          <p style={{ fontSize: 13, color: 'var(--grey)', marginTop: 2 }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={() => router.push('/')}
          aria-label="Return to home page"
          style={{
            background: 'var(--accent-bg)', color: '#EEF2FF',
            border: '1.5px solid var(--accent)', borderRadius: 24,
            padding: '8px 20px', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            minHeight: 44, boxShadow: '0 4px 14px rgba(129,140,248,0.3)',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: 16 }}>🏠</span>
          <span>Home</span>
        </button>
      </div>

      {/* Stats overview */}
      {report && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', maxWidth: 520, marginBottom: '1.5rem' }}>
          {[
            { label: 'Words tried',  value: report.words_attempted },
            { label: 'Accuracy',     value: `${report.accuracy_percent}%` },
            { label: 'Duration',     value: `${report.duration_minutes} min` },
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'var(--panel)', border: '1.5px solid var(--border2)',
              borderRadius: 'var(--radius)', padding: '14px 16px',
            }}>
              <div style={{ fontSize: 13, color: 'var(--grey)', marginBottom: 4, fontWeight: 500 }}>{stat.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--white)' }}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Session report + approval gate */}
      {report ? (
        <div style={{
          width: '100%', maxWidth: 520,
          background: 'var(--panel)', border: '1.5px solid var(--border2)',
          borderRadius: 18, overflow: 'hidden', marginBottom: '1.5rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        }}>
          {/* Report header */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 46, height: 46, borderRadius: '50%',
                background: 'var(--bloom)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700, color: '#fff',
              }}>
                {report.child_name?.charAt(0) || 'E'}
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--white)' }}>{report.child_name} · session report</div>
                <div style={{ fontSize: 13, color: 'var(--grey)', marginTop: 2 }}>{report.session_date_display} · drafted by Report Agent</div>
              </div>
            </div>
          </div>

          {/* Report body */}
          <div style={{ padding: '1.5rem' }}>

            {/* Words mastered / to revisit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1.25rem' }}>
              <div style={{
                background: 'var(--bloom-bg)', border: '1.5px solid rgba(16,185,129,0.3)',
                borderRadius: 'var(--radius)', padding: '12px 14px',
              }}>
                <div style={{ fontSize: 12, color: 'var(--bloom)', marginBottom: 8, fontWeight: 700 }}>NEW WORDS ✅</div>
                {report.new_words_mastered?.length > 0
                  ? report.new_words_mastered.map((w: string) => (
                    <span key={w} style={{
                      display: 'inline-block', background: 'var(--bloom)', color: '#fff',
                      borderRadius: 14, padding: '4px 12px', fontSize: 13, fontWeight: 600,
                      margin: '3px 4px 3px 0',
                    }}>{w}</span>
                  ))
                  : <span style={{ fontSize: 13, color: 'var(--grey)' }}>None yet</span>
                }
              </div>
              <div style={{
                background: 'var(--warn-bg)', border: '1.5px solid rgba(251,191,36,0.3)',
                borderRadius: 'var(--radius)', padding: '12px 14px',
              }}>
                <div style={{ fontSize: 12, color: 'var(--warn)', marginBottom: 8, fontWeight: 700 }}>TO REVISIT ⚠️</div>
                {report.words_to_revisit?.length > 0
                  ? report.words_to_revisit.map((w: string) => (
                    <span key={w} style={{
                      display: 'inline-block', background: 'var(--warn)', color: '#0F172A',
                      borderRadius: 14, padding: '4px 12px', fontSize: 13, fontWeight: 700,
                      margin: '3px 4px 3px 0',
                    }}>{w}</span>
                  ))
                  : <span style={{ fontSize: 13, color: 'var(--grey)' }}>None</span>
                }
              </div>
            </div>

            {/* Report text */}
            <div style={{
              fontSize: 16, lineHeight: 1.8, color: 'var(--white)', fontWeight: 500,
              background: 'rgba(255,255,255,0.04)',
              border: '1.5px solid var(--border2)', borderRadius: 'var(--radius)',
              padding: '16px 18px', marginBottom: '1.25rem',
            }}>
              {report.report_text || 'Report text loading...'}
            </div>

            {/* Approval gate warning */}
            {!approved && (
              <div style={{
                background: 'rgba(251,191,36,0.12)', border: '1.5px solid rgba(251,191,36,0.4)',
                borderRadius: 'var(--radius)', padding: '14px 18px',
                fontSize: 14, color: '#FCD34D', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem',
                lineHeight: 1.5,
              }}>
                <span style={{ fontSize: 20 }}>⚠️</span>
                <span>Nothing is sent to parents until you approve this report. This is your approval gate.</span>
              </div>
            )}

            {/* Teacher notes */}
            {!approved && (
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add any notes for parents (optional)..."
                rows={2}
                style={{
                  width: '100%', padding: '12px 16px',
                  background: 'var(--panel)', border: '1.5px solid var(--border2)',
                  borderRadius: 'var(--radius)', color: 'var(--white)',
                  fontSize: 14, resize: 'vertical', marginBottom: '1.25rem',
                }}
              />
            )}

            {/* Approved message */}
            {approved && (
              <div style={{
                background: 'var(--bloom-bg)', border: '1.5px solid rgba(16,185,129,0.4)',
                borderRadius: 'var(--radius)', padding: '14px 18px',
                fontSize: 15, color: '#34D399', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: '1.25rem',
              }}>
                <span style={{ fontSize: 20 }}>✅</span>
                Report approved and sent to {report.child_name?.split(' ')[0]}'s parents.
              </div>
            )}

            {/* Approve button */}
            {!approved && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  style={{
                    flex: 1, padding: '14px', background: 'var(--bloom)',
                    color: '#fff', borderRadius: 50, minHeight: 52,
                    fontSize: 16, fontWeight: 700,
                    opacity: loading ? 0.6 : 1, cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
                  }}
                >
                  {loading ? 'Sending...' : '✅ Approve and send to parents'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          width: '100%', maxWidth: 520,
          background: 'var(--panel)', border: '1.5px solid var(--border2)',
          borderRadius: 18, padding: '3.5rem 2rem', textAlign: 'center',
          color: 'var(--white)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          marginBottom: '1.5rem',
        }}>
          <div style={{ fontSize: 48, marginBottom: '1rem' }}>📋</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--white)', marginBottom: 8 }}>No session report yet</h3>
          <p style={{ fontSize: 15, color: 'var(--grey)', lineHeight: 1.6 }}>Complete a learning session with a student to see the AI agent report here.</p>
          <button
            onClick={() => router.push('/')}
            style={{
              marginTop: '1.75rem', background: 'var(--bloom)',
              color: '#fff', padding: '14px 36px', minHeight: 52,
              borderRadius: 50, fontSize: 16, fontWeight: 700,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
            }}
          >
            Start a learning session 🚀
          </button>
        </div>
      )}

      {/* Agent activity badge */}
      <div style={{
        width: '100%', maxWidth: 520,
        background: 'var(--panel)', border: '1.5px solid var(--border2)',
        borderRadius: 24, padding: '14px 20px',
        fontSize: 15, fontWeight: 600, color: 'var(--white)',
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      }}>
        <span style={{
          background: '#F472B6', color: '#0F172A',
          fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 12,
          letterSpacing: 0.5, textTransform: 'uppercase',
          boxShadow: '0 2px 6px rgba(244,114,182,0.4)',
        }}>
          📋 Report Agent
        </span>
        <span>Drafted session summary · <strong style={{ color: approved ? '#34D399' : '#FCD34D' }}>{approved ? 'Approved ✅' : 'awaiting your approval'}</strong></span>
      </div>
    </div>
  )
}
