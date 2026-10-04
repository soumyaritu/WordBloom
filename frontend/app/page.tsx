'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { startSession } from '../lib/api'

// Default children if API not reachable
const DEFAULT_CHILDREN = [
  { id: 'emma',  name: 'Emma Clarke',  level: 3, words: 47, type: 'Phonological · ADHD' },
  { id: 'james', name: 'James Patel',  level: 2, words: 31, type: 'Visual · Dyspraxia'  },
  { id: 'sofia', name: 'Sofia Mensah', level: 4, words: 62, type: 'Surface'              },
]

export default function HomePage() {
  const router = useRouter()
  const [selected,   setSelected]   = useState('emma')
  const [loading,    setLoading]    = useState(false)
  const [children,   setChildren]   = useState(DEFAULT_CHILDREN)
  const [agentReady, setAgentReady] = useState(false)

  useEffect(() => {
    // Check if backend is running
    fetch('http://localhost:8000/children')
      .then(res => res.json())
      .then(data => {
        setAgentReady(true)
        if (data.children && data.children.length > 0) {
          const loaded = data.children.map((c: any) => {
            const saved = localStorage.getItem(`wb_profile_${c.id}`)
            if (saved) {
              const parsed = JSON.parse(saved)
              return {
                id: c.id,
                name: parsed.fullName || c.name,
                level: parsed.readingLevel || 3,
                words: 45,
                type: `${parsed.dyslexiaType || 'Phonological'} ${parsed.coOccurring?.length ? '· ' + parsed.coOccurring.join(', ').toUpperCase() : ''}`,
              }
            }
            return {
              id: c.id,
              name: c.name + (c.id === 'emma' ? ' Clarke' : c.id === 'james' ? ' Patel' : c.id === 'sofia' ? ' Mensah' : ''),
              level: c.id === 'emma' ? 3 : c.id === 'james' ? 2 : 4,
              words: c.id === 'emma' ? 47 : c.id === 'james' ? 31 : 62,
              type: c.id === 'emma' ? 'Phonological · ADHD' : c.id === 'james' ? 'Visual · Dyspraxia' : 'Surface',
            }
          })
          setChildren(loaded)
        }
      })
      .catch(() => setAgentReady(false))
  }, [])

  const handleStart = async () => {
    setLoading(true)
    try {
      const data = await startSession(selected)
      // Store session in localStorage for game page
      localStorage.setItem('wb_session', JSON.stringify({
        session_id:   data.session_id,
        profile:      data.profile,
        current_word: data.first_word,
        words_done:   [],
        words_correct: [],
        start_time:   Date.now(),
        stats: { words_done: 0, words_correct: 0, accuracy: 0 }
      }))
      router.push('/game')
    } catch (e) {
      alert('Could not connect to WordBloom server.\nMake sure python main.py is running.')
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1.5rem', minHeight: '100vh' }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: 'var(--bloom)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 34, margin: '0 auto 1.25rem',
          boxShadow: '0 10px 25px rgba(16,185,129,0.3)',
        }}>🌱</div>
        <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: -0.5, color: 'var(--white)' }}>WordBloom</h1>
        <p style={{ color: 'var(--grey)', fontSize: 13, marginTop: 6, letterSpacing: 2, fontWeight: 600 }}>
          EVERY WORD · EVERY CHILD · EVERY WAY
        </p>
      </div>

      {/* Agent status badge */}
      <div
        role="status"
        aria-live="polite"
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: agentReady ? 'var(--bloom-bg)' : 'rgba(239,68,68,0.12)',
          border: `1.5px solid ${agentReady ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
          borderRadius: 24, padding: '8px 20px',
          fontSize: 13, fontWeight: 600,
          color: agentReady ? '#34D399' : '#FCA5A5',
          marginBottom: '2rem',
        }}
      >
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: agentReady ? '#34D399' : '#EF4444',
        }} />
        {agentReady ? '6 Google ADK agents ready' : 'Backend offline — run python main.py'}
      </div>

      {/* Child selector */}
      <div style={{ width: '100%', maxWidth: 460, marginBottom: '2rem' }}>
        <h2 style={{ fontSize: 14, color: 'var(--grey)', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>
          Who is learning today?
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} role="radiogroup" aria-label="Select student profile">
          {children.map(child => (
            <div
              key={child.id}
              role="radio"
              aria-checked={selected === child.id}
              tabIndex={0}
              onClick={() => setSelected(child.id)}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSelected(child.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 18px', borderRadius: 'var(--radius)',
                border: `${selected === child.id ? '2px' : '1.5px'} solid ${selected === child.id ? 'var(--bloom)' : 'var(--border)'}`,
                background: selected === child.id ? 'var(--bloom-bg)' : 'var(--panel)',
                cursor: 'pointer', transition: 'all 0.2s ease',
                minHeight: 64, position: 'relative',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: selected === child.id ? 'var(--bloom)' : 'var(--border2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, flexShrink: 0,
                color: '#fff',
              }}>
                {child.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--white)' }}>
                  {child.name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--grey)', marginTop: 2 }}>
                  Stage {child.level} · {child.type}
                </div>
              </div>

              {/* Edit button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/profile?child=${child.id}`)
                }}
                title={`Edit ${child.name}'s profile`}
                aria-label={`Edit ${child.name}'s profile`}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid var(--border2)',
                  borderRadius: '50%', width: 36, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, cursor: 'pointer', color: 'var(--white)',
                  transition: 'all 0.2s ease',
                }}
              >
                ✏️
              </button>

              {selected === child.id && (
                <span style={{ color: 'var(--bloom)', fontSize: 20, fontWeight: 'bold' }}>✓</span>
              )}
            </div>
          ))}

          {/* + Add a child button */}
          <button
            onClick={() => router.push('/profile?child=new')}
            aria-label="Add a child profile"
            style={{
              width: '100%', minHeight: 52, padding: '12px 18px',
              borderRadius: 'var(--radius)',
              border: '1.5px dashed var(--border2)',
              background: 'transparent',
              color: '#34D399', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 4,
            }}
          >
            <span>+ Add a child</span>
          </button>
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={loading || !agentReady}
        aria-label="Start learning session"
        style={{
          width: '100%', maxWidth: 460,
          minHeight: 54, padding: '14px 0',
          background: loading || !agentReady ? 'var(--border2)' : 'var(--bloom)',
          color: '#fff', fontSize: 17, fontWeight: 700,
          borderRadius: 50, transition: 'all 0.2s ease',
          cursor: loading || !agentReady ? 'not-allowed' : 'pointer',
          boxShadow: agentReady ? '0 8px 20px rgba(16,185,129,0.3)' : 'none',
        }}
      >
        {loading ? 'Starting session...' : '🌱 Start Session'}
      </button>

      {/* Teacher Dashboard Button */}
      <button
        onClick={() => router.push('/teacher')}
        aria-label="Go to teacher dashboard"
        style={{
          width: '100%', maxWidth: 460,
          minHeight: 52, padding: '14px 0',
          marginTop: '1.25rem',
          background: 'var(--panel)',
          border: '1.5px solid var(--accent)',
          color: '#EEF2FF', fontSize: 16, fontWeight: 700,
          borderRadius: 50, transition: 'all 0.2s ease',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 4px 16px rgba(129,140,248,0.25)',
        }}
      >
        <span>👩‍🏫 Teacher Dashboard</span>
        <span style={{ fontSize: 18 }}>➔</span>
      </button>
    </div>
  )
}
