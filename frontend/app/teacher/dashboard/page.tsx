'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TeacherBackground from '../../../components/TeacherBackground'

interface ChildRow {
  id: string
  name: string
  avatar: string
  dyslexia_type: string
  reading_stage: number
  input_mode: string
  conditions: string[]
  last_session: string
  candy_count: number
}

const FALLBACK_CHILDREN: ChildRow[] = [
  {
    id: 'emma',
    name: 'Emma Clarke',
    avatar: '👧',
    dyslexia_type: 'Phonological',
    reading_stage: 3,
    input_mode: 'voice',
    conditions: ['ADHD'],
    last_session: 'Today',
    candy_count: 5,
  },
  {
    id: 'liam',
    name: "Liam O'Connor",
    avatar: '👦',
    dyslexia_type: 'Surface',
    reading_stage: 2,
    input_mode: 'tap',
    conditions: ['Dyspraxia', 'ADHD'],
    last_session: 'Yesterday',
    candy_count: 4,
  },
  {
    id: 'james',
    name: 'James Patel',
    avatar: '🚀',
    dyslexia_type: 'Visual / Spatial',
    reading_stage: 2,
    input_mode: 'tap',
    conditions: ['Dyspraxia'],
    last_session: 'Oct 16',
    candy_count: 3,
  },
  {
    id: 'sofia',
    name: 'Sofia Mensah',
    avatar: '🌟',
    dyslexia_type: 'Surface',
    reading_stage: 4,
    input_mode: 'voice',
    conditions: [],
    last_session: 'Oct 15',
    candy_count: 5,
  },
  {
    id: 'alex',
    name: 'Alex',
    avatar: '🦊',
    dyslexia_type: 'Non-dyslexic',
    reading_stage: 4,
    input_mode: 'type',
    conditions: [],
    last_session: 'Oct 17',
    candy_count: 4,
  },
]

function dedupeName(name: string): string {
  if (!name) return ''
  let cleaned = name.trim().replace(/\s+/g, ' ')
  while (/\b([A-Za-z'.-]+)\s+\1\b/i.test(cleaned)) {
    cleaned = cleaned.replace(/\b([A-Za-z'.-]+)\s+\1\b/gi, '$1')
  }
  return cleaned
}

function formatDyslexiaType(raw?: string): string {
  if (!raw) return 'Phonological'
  const lower = raw.toLowerCase()
  if (lower.includes('unknown') || lower.includes('not sure') || lower.includes('undetermined')) return 'Not sure yet'
  if (lower.includes('non')) return 'Non-dyslexic'
  if (lower.includes('surface')) return 'Surface'
  if (lower.includes('visual')) return 'Visual / Spatial'
  if (lower.includes('attentional')) return 'Attentional'
  if (lower.includes('double')) return 'Double Deficit'
  if (lower.includes('phono')) return 'Phonological'
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function enrichChildrenWithLocalStorage(baseList: ChildRow[]): ChildRow[] {
  if (typeof window === 'undefined') return baseList

  const seenIds = new Set<string>()
  const result: ChildRow[] = []

  baseList.forEach(c => {
    let child = { ...c }
    const lookupId = child.id.toLowerCase()
    seenIds.add(lookupId)
    if (lookupId === 'sofia') seenIds.add('sony')
    if (lookupId === 'sony') seenIds.add('sofia')

    try {
      let savedRaw = localStorage.getItem(`wb_profile_${lookupId}`)
      if (!savedRaw && lookupId === 'sofia') savedRaw = localStorage.getItem('wb_profile_sony')
      if (!savedRaw && lookupId === 'sony') savedRaw = localStorage.getItem('wb_profile_sofia')

      if (savedRaw) {
        const p = JSON.parse(savedRaw)
        if (p.fullName && p.fullName.trim()) child.name = dedupeName(p.fullName.trim())
        if (p.dyslexiaType) child.dyslexia_type = formatDyslexiaType(p.dyslexiaType)
        if (p.readingLevel !== undefined) child.reading_stage = Number(p.readingLevel)
        if (p.inputMode) child.input_mode = p.inputMode
        if (Array.isArray(p.coOccurring)) child.conditions = p.coOccurring
        if (p.candyGoal !== undefined) child.candy_count = Number(p.candyGoal)
      } else {
        child.name = dedupeName(child.name)
      }

      const sessionRaw = localStorage.getItem(`wb_session_words_${lookupId}`)
      if (sessionRaw) {
        const words = JSON.parse(sessionRaw)
        if (Array.isArray(words) && words.length > 0) {
          const correctCount = words.filter((w: any) => w.is_correct).length
          child.candy_count = correctCount
          child.last_session = 'Today'
        }
      }
    } catch (e) {}

    result.push(child)
  })

  // Discover newly added or custom children from localStorage
  try {
    const customKeys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('wb_profile_')) {
        customKeys.push(key)
      }
    }

    customKeys.forEach(key => {
      const id = key.replace('wb_profile_', '').toLowerCase()
      if (seenIds.has(id)) return
      if (id === 'sony' && seenIds.has('sofia')) return
      if (id === 'sofia' && seenIds.has('sony')) return

      seenIds.add(id)
      const raw = localStorage.getItem(key)
      if (!raw) return
      try {
        const p = JSON.parse(raw)
        result.push({
          id,
          name: p.fullName || (id.charAt(0).toUpperCase() + id.slice(1)),
          avatar: id === 'emma' ? '👧' : id === 'liam' ? '👦' : id === 'james' ? '🚀' : id === 'sofia' || id === 'sony' ? '🌟' : '🎨',
          dyslexia_type: formatDyslexiaType(p.dyslexiaType),
          reading_stage: Number(p.readingLevel) || 1,
          input_mode: p.inputMode || 'voice',
          conditions: Array.isArray(p.coOccurring) ? p.coOccurring : [],
          last_session: 'Today',
          candy_count: Number(p.candyGoal) || 5,
        })
      } catch (e) {}
    })
  } catch (e) {}

  return result
}

export default function TeacherDashboardPage() {
  const router = useRouter()
  const [teacherName, setTeacherName] = useState('Ms. Rachel Edwards')
  const [children, setChildren] = useState<ChildRow[]>(FALLBACK_CHILDREN)
  const [loading, setLoading] = useState(true)

  // Verify authentication on mount (client-side safety check alongside middleware)
  useEffect(() => {
    const rawTeacher = localStorage.getItem('wb_teacher')
    if (rawTeacher) {
      try {
        const parsed = JSON.parse(rawTeacher)
        if (parsed.name) setTeacherName(parsed.name)
      } catch (e) {}
    } else {
      // Check cookie
      if (!document.cookie.includes('wb_teacher_session')) {
        router.push('/teacher/login')
        return
      }
    }

    // 1. Immediately enrich fallback children from localStorage to reflect user edits instantly
    setChildren(enrichChildrenWithLocalStorage(FALLBACK_CHILDREN))

    // 2. Fetch children list from API and enrich with localStorage
    fetch('/api/children')
      .then(res => res.json())
      .then(data => {
        if (data.children && data.children.length > 0) {
          setChildren(enrichChildrenWithLocalStorage(data.children))
        }
      })
      .catch(err => {
        console.error('Error fetching children:', err)
      })
      .finally(() => setLoading(false))
  }, [router])

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/teacher', { method: 'DELETE' })
    } catch (e) {}

    document.cookie = 'wb_teacher_session=; path=/; max-age=0'
    localStorage.removeItem('wb_teacher')
    router.push('/teacher/login')
  }

  const formatConditions = (conditions?: string[]) => {
    if (!conditions || conditions.length === 0) return ''
    return ' · ' + conditions.join(', ')
  }

  return (
    <main
      suppressHydrationWarning
      style={{
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: '#06080F',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2.5rem 1.5rem 4rem',
        overflow: 'hidden',
      }}
    >
      <TeacherBackground />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 1040,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header Bar */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '2.5rem',
            padding: '1.25rem 2rem',
            borderRadius: 24,
            background: 'rgba(255, 255, 255, 0.18)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '2px solid rgba(255, 255, 255, 0.35)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: '2.4rem' }}>🌸</span>
            <div>
              <h1
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                Welcome back, {teacherName} 👋
              </h1>
              <p style={{ color: '#FDF4FF', fontSize: '0.9rem', fontWeight: 600 }}>
                WordBloom Educator &amp; Learning Insights Center
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link
              href="/"
              className="wb-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 40,
                background: 'rgba(255, 255, 255, 0.22)',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              <span role="img" aria-label="home" style={{ fontSize: '1rem' }}>🏠</span>
              <span>Home</span>
            </Link>

            <button
              onClick={handleSignOut}
              className="wb-btn"
              style={{
                padding: '9px 20px',
                borderRadius: 40,
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 6px 16px rgba(220, 38, 38, 0.3)',
              }}
            >
              Sign Out 🚪
            </button>
          </div>
        </header>

        {/* Dashboard Main Card */}
        <section
          className="wb-teacher-card"
          style={{
            background: 'rgba(255, 255, 255, 0.96)',
            borderRadius: 28,
            padding: '2.5rem 2rem',
            boxShadow: '0 24px 60px rgba(76, 29, 149, 0.22)',
            border: '2px solid rgba(255, 255, 255, 0.9)',
          }}
        >
          {/* Subheader */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: '2rem',
              paddingBottom: '1.25rem',
              borderBottom: '2px solid #ede9fe',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  color: '#4c1d95',
                  letterSpacing: '-0.01em',
                }}
              >
                Classroom Students ({children.length})
              </h2>
              <p style={{ color: '#6b7280', fontSize: '0.92rem', fontWeight: 600 }}>
                Monitor learning profiles, check candy achievements, and inspect dyslexia mirrors.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Link
                href="/profile?child=new"
                className="wb-btn"
                style={{
                  padding: '11px 24px',
                  borderRadius: 50,
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#FFFFFF',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 6px 16px rgba(16, 185, 129, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>➕</span> Add New Child
              </Link>

              <Link
                href="/teacher?child=emma"
                className="wb-btn"
                style={{
                  padding: '11px 24px',
                  borderRadius: 50,
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  color: '#FFFFFF',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: '0 6px 16px rgba(124, 58, 237, 0.3)',
                }}
              >
                📝 Review Session Reports →
              </Link>
            </div>
          </div>

          {/* Children List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {children.map(child => (
              <div
                key={child.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  padding: '1.25rem 1.5rem',
                  borderRadius: 20,
                  background: '#fbf9ff',
                  border: '1.5px solid #e9d5ff',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                {/* Child Identity & Profile Info */}
                <Link
                  href={`/teacher/children/${child.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 260, textDecoration: 'none' }}
                >
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: '50%',
                      background: 'rgba(124, 58, 237, 0.12)',
                      border: '2px solid #c084fc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      flexShrink: 0,
                    }}
                  >
                    {child.avatar || '👧'}
                  </div>

                  <div>
                    <h3
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 900,
                        color: '#1e1b4b',
                        marginBottom: 3,
                      }}
                    >
                      {child.name}
                    </h3>

                    {/* dyslexia_type · Stage N · input_mode · conditions */}
                    <div
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: '#6d28d9',
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <span>{child.dyslexia_type}</span>
                      <span>·</span>
                      <span>Stage {child.reading_stage}</span>
                      <span>·</span>
                      <span style={{ textTransform: 'capitalize' }}>{child.input_mode}</span>
                      {child.conditions && child.conditions.length > 0 && (
                        <span>{formatConditions(child.conditions)}</span>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Last session date + Candy count */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '9px 18px',
                    borderRadius: 14,
                    background: '#ffffff',
                    border: '1px solid #e9d5ff',
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>
                      Last Session
                    </div>
                    <div style={{ fontSize: '1.02rem', fontWeight: 800, color: '#374151' }}>
                      {child.last_session || 'Today'}
                    </div>
                  </div>

                  <div style={{ height: 28, width: 1, background: '#e5e7eb' }} />

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>
                      Blooms
                    </div>
                    <div style={{ fontSize: '1.12rem', fontWeight: 900, color: '#059669' }}>
                      {child.candy_count ?? 5} 🌸
                    </div>
                  </div>
                </div>

                {/* Action Buttons: 📋 Profile & 👁️ Mirror (Mirror only for dyslexic profiles) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Link
                    href={`/teacher/profile/${child.id}`}
                    className="wb-btn"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '11px 20px',
                      borderRadius: 12,
                      background: '#ede9fe',
                      border: '1.5px solid #c4b5fd',
                      color: '#5b21b6',
                      fontSize: '1.02rem',
                      fontWeight: 800,
                      textDecoration: 'none',
                    }}
                  >
                    📋 Profile
                  </Link>

                  {(child.dyslexia_type || '').toLowerCase().includes('non') ||
                   ['none', 'general', 'standard', 'normal'].includes((child.dyslexia_type || '').toLowerCase().trim()) ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '11px 18px',
                        borderRadius: 12,
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1.5px solid rgba(16, 185, 129, 0.35)',
                        color: '#059669',
                        fontSize: '0.98rem',
                        fontWeight: 800,
                      }}
                    >
                      🌱 Standard Reader
                    </span>
                  ) : (
                    <Link
                      href={`/teacher/children/${child.id}/mirror`}
                      className="wb-btn"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '11px 20px',
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                        border: 'none',
                        color: '#FFFFFF',
                        fontSize: '1.02rem',
                        fontWeight: 800,
                        textDecoration: 'none',
                        boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)',
                      }}
                    >
                      👁️ Mirror
                    </Link>
                  )}
                </div>
              </div>
            ))}


          </div>
        </section>
      </div>
    </main>
  )
}
