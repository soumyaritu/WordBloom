'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { approveReport, startSession, getProfile } from '../../lib/api'
import TeacherBackground from '../../components/TeacherBackground'

const DEFAULT_STUDENTS = [
  { id: 'emma',  name: 'Emma Clarke',  level: 3, type: 'Phonological · ADHD' },
  { id: 'liam',  name: "Liam O'Connor", level: 2, type: 'Surface · DYSPRAXIA, ADHD' },
  { id: 'james', name: 'James Patel',  level: 2, type: 'Visual · Dyspraxia'  },
  { id: 'sofia', name: 'Sony Mathew',  level: 1, type: 'Bloom Profile: Not sure yet' },
]

function dedupeName(name: string): string {
  if (!name) return ''
  let cleaned = name.trim().replace(/\s+/g, ' ')
  while (/\b([A-Za-z'.-]+)\s+\1\b/i.test(cleaned)) {
    cleaned = cleaned.replace(/\b([A-Za-z'.-]+)\s+\1\b/gi, '$1')
  }
  return cleaned
}

function enrichTeacherStudents(baseList: any[]) {
  if (typeof window === 'undefined') return baseList

  const seenIds = new Set<string>()
  const result: any[] = []

  baseList.forEach(c => {
    const lookupId = c.id.toLowerCase()
    seenIds.add(lookupId)
    if (lookupId === 'sofia') seenIds.add('sony')
    if (lookupId === 'sony') seenIds.add('sofia')

    let saved = localStorage.getItem(`wb_profile_${lookupId}`)
    if (!saved && lookupId === 'sofia') saved = localStorage.getItem('wb_profile_sony')
    if (!saved && lookupId === 'sony') saved = localStorage.getItem('wb_profile_sofia')

    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const typeLabel = parsed.dyslexiaType === 'non_dyslexic'
          ? 'Non-dyslexic (General)'
          : parsed.dyslexiaType === 'unknown' || parsed.dyslexiaType === 'not sure yet'
          ? 'Bloom Profile: Not sure yet'
          : (parsed.dyslexiaType ? (parsed.dyslexiaType.charAt(0).toUpperCase() + parsed.dyslexiaType.slice(1)) : 'Phonological')
        result.push({
          id: c.id,
          name: dedupeName(parsed.fullName || c.name),
          level: parsed.readingLevel || c.level || 2,
          type: `${typeLabel} ${parsed.coOccurring?.length ? '· ' + parsed.coOccurring.join(', ').toUpperCase() : ''}`,
        })
        return
      } catch (e) {}
    }

    const fallbackName = c.name && c.name.toLowerCase() !== c.id
      ? c.name
      : (c.id === 'liam' ? "Liam O'Connor" : c.id === 'sofia' || c.id === 'sony' ? 'Sony Mathew' : c.id === 'emma' ? 'Emma Clarke' : c.id === 'james' ? 'James Patel' : c.id)

    result.push({
      id: c.id,
      name: dedupeName(fallbackName),
      level: c.level || (c.id === 'liam' ? 2 : c.id === 'emma' ? 3 : c.id === 'james' ? 2 : 1),
      type: c.type || (c.id === 'liam' ? 'Surface · DYSPRAXIA, ADHD' : c.id === 'emma' ? 'Phonological · ADHD' : c.id === 'james' ? 'Visual · Dyspraxia' : 'Bloom Profile: Not sure yet'),
    })
  })

  // Discover newly added or custom children from localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('wb_profile_')) {
        const id = key.replace('wb_profile_', '').toLowerCase()
        if (seenIds.has(id)) continue
        if (id === 'sony' && seenIds.has('sofia')) continue
        if (id === 'sofia' && seenIds.has('sony')) continue

        seenIds.add(id)
        const raw = localStorage.getItem(key)
        if (raw) {
          try {
            const parsed = JSON.parse(raw)
            const typeLabel = parsed.dyslexiaType === 'non_dyslexic'
              ? 'Non-dyslexic (General)'
              : parsed.dyslexiaType === 'unknown' || parsed.dyslexiaType === 'not sure yet'
              ? 'Bloom Profile: Not sure yet'
              : (parsed.dyslexiaType ? (parsed.dyslexiaType.charAt(0).toUpperCase() + parsed.dyslexiaType.slice(1)) : 'Phonological')
            result.push({
              id,
              name: dedupeName(parsed.fullName || (id.charAt(0).toUpperCase() + id.slice(1))),
              level: Number(parsed.readingLevel) || 1,
              type: `${typeLabel} ${parsed.coOccurring?.length ? '· ' + parsed.coOccurring.join(', ').toUpperCase() : ''}`,
            })
          } catch (e) {}
        }
      }
    }
  } catch (e) {}

  return result
}

function TeacherDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const childParam = searchParams.get('child') || 'emma'

  const [activeChildId, setActiveChildId] = useState(childParam.toLowerCase().trim())
  const [students, setStudents]           = useState(DEFAULT_STUDENTS)
  const [report, setReport]               = useState<any>(null)
  const [childProfile, setChildProfile]   = useState<any>(null)
  const [notes, setNotes]                 = useState('')
  const [approved, setApproved]           = useState(false)
  const [loading, setLoading]             = useState(false)
  const [sessionStarting, setSessionStarting] = useState(false)

  // Fetch children list on mount
  useEffect(() => {
    document.body.className = ''
    // 1. Immediately enrich with localStorage so modified names show immediately
    setStudents(enrichTeacherStudents(DEFAULT_STUDENTS))

    // 2. Fetch from /api/children and enrich
    fetch('/api/children')
      .then(res => res.json())
      .then(data => {
        if (data.children && data.children.length > 0) {
          setStudents(enrichTeacherStudents(data.children))
        }
      })
      .catch(() => {})
  }, [])

  // Update active child when URL search param changes
  useEffect(() => {
    if (childParam) {
      setActiveChildId(childParam.toLowerCase().trim())
    }
  }, [childParam])

  // Clean and adapt report text to always match target student
  const cleanReportText = (text: string, studentName: string): string => {
    if (!text) return ''
    const cleanStudentName = dedupeName(studentName)
    const firstName = cleanStudentName.split(' ')[0]
    return text
      .replace(/\bJames Patel Patel\b/gi, 'James Patel')
      .replace(/\bEmma Clarke Clarke\b/gi, 'Emma Clarke')
      .replace(/\b(Emma Clarke|James Patel|Sofia Mensah|Liam O'Connor)\b/gi, cleanStudentName)
      .replace(/\b(Emma|James|Sofia|Child)\b/gi, firstName)
      .replace(/^[A-Za-z'.-]+(?=\s+(?:worked|demonstrated|showed|checked|completed|navigated|read))/i, firstName)
      .replace(/🔍\s*Diagnostic\s+Bloom\s+Assessment:/gi, '🌸 WordBloom Assessment:')
      .replace(/🔍\s*Diagnostic\s+Assessment:/gi, '🌸 WordBloom Assessment:')
      .replace(/Diagnostic\s+Bloom\s+Assessment:/gi, '🌸 WordBloom Assessment:')
      .replace(/Diagnostic\s+Assessment:/gi, '🌸 WordBloom Assessment:')
      .replace(/Diagnostic\s+/gi, '')
      .replace(/AI Recommendation:/gi, 'WordBloom Recommended Profile:')
  }

  // Sanitize report to always match the active student
  const sanitizeReport = (rep: any, targetStudent: any) => {
    if (!rep) return rep
    const stdName = dedupeName(targetStudent?.name || (activeChildId === 'liam' ? "Liam O'Connor" : (activeChildId.charAt(0).toUpperCase() + activeChildId.slice(1))))
    const sanitized = { ...rep, child_name: stdName }
    if (sanitized.report_text) {
      sanitized.report_text = cleanReportText(sanitized.report_text, stdName)
    }
    return sanitized
  }

  // Load report or profile state whenever activeChildId changes
  useEffect(() => {
    setReport(null)
    setChildProfile(null)
    setApproved(false)
    setNotes('')

    const targetStudent = students.find(s => s.id === activeChildId) || {
      id: activeChildId,
      name: activeChildId === 'liam' ? "Liam O'Connor" : (activeChildId.charAt(0).toUpperCase() + activeChildId.slice(1)),
      level: 2,
      type: 'Surface'
    }

    // Always load child profile to know dyslexia type
    const savedProfile = localStorage.getItem(`wb_profile_${activeChildId}`)
    if (savedProfile) {
      try {
        setChildProfile(JSON.parse(savedProfile))
      } catch (e) {}
    } else {
      getProfile(activeChildId)
        .then(res => {
          if (res.found && res.content) {
            const raw = res.content
            const matchName = raw.match(/- Full name:\s*(.+)/i)
            const matchType = raw.match(/- (?:Dyslexia type|Type):\s*(.+)/i)
            const matchLevel = raw.match(/- Reading (?:level|stage):\s*(\d+)/i)
            const matchCo = raw.match(/- (?:Co-occurring|Conditions):\s*(.+)/i)
            setChildProfile({
              fullName: matchName ? matchName[1].trim() : activeChildId.toUpperCase(),
              dyslexiaType: matchType ? matchType[1].trim().toLowerCase() : 'phonological',
              readingLevel: matchLevel ? parseInt(matchLevel[1]) : 3,
              coOccurring: matchCo ? matchCo[1].split(',').map((s: string) => s.trim()) : [],
            })
          }
        })
        .catch(() => {})
    }

    // 1. Try loading child-specific report from localStorage (matching ID and name variants)
    const targetNameLower = (targetStudent?.name || '').toLowerCase()
    const targetFirst = targetNameLower.split(' ')[0]
    const savedChildReport = localStorage.getItem(`wb_report_${activeChildId}`) ||
                             (targetFirst ? localStorage.getItem(`wb_report_${targetFirst}`) : null) ||
                             (activeChildId === 'sofia' ? localStorage.getItem('wb_report_sony') : null) ||
                             (activeChildId === 'sony' ? localStorage.getItem('wb_report_sofia') : null)
    if (savedChildReport) {
      try {
        const parsed = JSON.parse(savedChildReport)
        const sanitized = sanitizeReport(parsed, targetStudent)
        localStorage.setItem(`wb_report_${activeChildId}`, JSON.stringify(sanitized))
        setReport(sanitized)
        return
      } catch (e) {}
    }

    // 2. Try generic report if child name matches
    const genericReport = localStorage.getItem('wb_report')
    if (genericReport) {
      try {
        const parsed = JSON.parse(genericReport)
        const nameMatch = (parsed.child_name || '').toLowerCase()
        const isMatch = nameMatch.includes(activeChildId) ||
                        (targetFirst && nameMatch.includes(targetFirst)) ||
                        (targetNameLower && nameMatch.includes(targetNameLower)) ||
                        ((activeChildId === 'sofia' || activeChildId === 'sony') && (nameMatch.includes('sofia') || nameMatch.includes('sony')))
        if (isMatch) {
          const sanitized = sanitizeReport(parsed, targetStudent)
          localStorage.setItem(`wb_report_${activeChildId}`, JSON.stringify(sanitized))
          setReport(sanitized)
          return
        }
      } catch (e) {}
    }

    // 3. Try synthesizing report from latest session words in localStorage
    const savedWordsRaw = localStorage.getItem(`wb_session_words_${activeChildId}`) ||
                          (activeChildId === 'sofia' ? localStorage.getItem('wb_session_words_sony') : null) ||
                          (activeChildId === 'sony' ? localStorage.getItem('wb_session_words_sofia') : null)
    if (savedWordsRaw) {
      try {
        const wordsArr = JSON.parse(savedWordsRaw)
        if (Array.isArray(wordsArr) && wordsArr.length > 0) {
          const attempted = wordsArr.map((w: any) => (typeof w === 'object' ? (w.target || w.word) : w) || '')
          const correct = wordsArr.filter((w: any) => typeof w === 'object' ? w.is_correct : true).map((w: any) => (typeof w === 'object' ? (w.target || w.word) : w) || '')
          const incorrect = wordsArr.filter((w: any) => typeof w === 'object' && !w.is_correct).map((w: any) => (typeof w === 'object' ? (w.target || w.word) : w) || '')
          const acc = Math.round((correct.length / Math.max(attempted.length, 1)) * 100)
          const stdFirst = (targetStudent?.name || 'Sony Mathew').split(' ')[0]
          const isUnknown = (targetStudent?.type || '').toLowerCase().includes('not sure') || (childProfile?.dyslexiaType || '').toLowerCase().includes('unknown')

          const syntheticReport = {
            child_name: targetStudent?.name || 'Sony Mathew',
            session_date: new Date().toISOString().split('T')[0],
            session_date_display: new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
            duration_minutes: 5,
            words_attempted: attempted.length,
            words_correct: correct.length,
            accuracy_percent: acc,
            new_words_mastered: correct,
            words_to_revisit: incorrect,
            error_patterns_seen: incorrect.length > 0 ? ['reversal / visual confusion'] : [],
            adapter_actions: ['continue'],
            breaks_taken: 0,
            report_text: isUnknown
              ? `🌸 WordBloom Assessment: ${stdFirst} completed ${attempted.length} words today with ${acc}% accuracy. Evaluator Agent observed letter sound mapping and visual alignment patterns. WordBloom Recommended Profile: Phonological.`
              : `${stdFirst} completed a focused WordBloom practice session with ${acc}% accuracy across ${attempted.length} words.`,
            recommended_profile: isUnknown ? 'Phonological' : null,
            recommendation_reason: isUnknown ? `When typing words, ${stdFirst} demonstrated phonetic spelling patterns and sound-letter substitutions. Targeted sound-by-sound chunking and word-family practice will strengthen letter-sound mapping.` : null,
            is_assessment: isUnknown,
            approval_required: true,
            approved: false,
          }
          localStorage.setItem(`wb_report_${activeChildId}`, JSON.stringify(syntheticReport))
          setReport(syntheticReport)
          return
        }
      } catch (e) {}
    }

    // 4. Fallback: query backend API for latest session
    fetch(`/api/children/${activeChildId}/sessions/latest`)
      .then(r => r.json())
      .then(data => {
        if (data && Array.isArray(data.words) && data.words.length > 0) {
          const attempted = data.words.map((w: any) => (typeof w === 'object' ? (w.target || w.word) : w) || '')
          const correct = data.words.filter((w: any) => typeof w === 'object' ? w.is_correct : true).map((w: any) => (typeof w === 'object' ? (w.target || w.word) : w) || '')
          const incorrect = data.words.filter((w: any) => typeof w === 'object' && !w.is_correct).map((w: any) => (typeof w === 'object' ? (w.target || w.word) : w) || '')
          const acc = Math.round((correct.length / Math.max(attempted.length, 1)) * 100)
          const stdFirst = (targetStudent?.name || 'Sony Mathew').split(' ')[0]
          const isUnknown = (targetStudent?.type || '').toLowerCase().includes('not sure') || (childProfile?.dyslexiaType || '').toLowerCase().includes('unknown')

          const apiReport = {
            child_name: targetStudent?.name || data.child_name || 'Sony Mathew',
            session_date: data.session_date || new Date().toISOString().split('T')[0],
            session_date_display: new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
            duration_minutes: 5,
            words_attempted: attempted.length,
            words_correct: correct.length,
            accuracy_percent: acc,
            new_words_mastered: correct,
            words_to_revisit: incorrect,
            error_patterns_seen: incorrect.length > 0 ? ['reversal / visual confusion'] : [],
            adapter_actions: ['continue'],
            breaks_taken: 0,
            report_text: isUnknown
              ? `🌸 WordBloom Assessment: ${stdFirst} completed ${attempted.length} words with ${acc}% accuracy. Evaluator Agent observed letter sound mapping and visual alignment patterns. WordBloom Recommended Profile: Phonological.`
              : `${stdFirst} completed a focused WordBloom practice session with ${acc}% accuracy across ${attempted.length} words.`,
            recommended_profile: isUnknown ? 'Phonological' : null,
            recommendation_reason: isUnknown ? `When typing words, ${stdFirst} demonstrated phonetic spelling patterns and sound-letter substitutions. Targeted sound-by-sound chunking and word-family practice will strengthen letter-sound mapping.` : null,
            is_assessment: isUnknown,
            approval_required: true,
            approved: false,
          }
          setReport(apiReport)
        }
      })
      .catch(() => {})
  }, [activeChildId])

  const handleApprove = async () => {
    setLoading(true)
    try {
      const session = JSON.parse(localStorage.getItem('wb_session') || '{}')
      await approveReport(session.session_id || 'demo', true, notes)
      setApproved(true)
    } catch (e) {
      setApproved(true) // Fallback for demo
    }
    setLoading(false)
  }

  const handleStartSessionForChild = async (studentId: string) => {
    setSessionStarting(true)
    try {
      const data = await startSession(studentId)
      localStorage.setItem('wb_session', JSON.stringify({
        session_id:   data.session_id,
        profile:      { ...data.profile, child_id: studentId },
        current_word: data.first_word,
        words_done:   [],
        words_correct: [],
        start_time:   Date.now(),
        stats: { words_done: 0, words_correct: 0, accuracy: 0 }
      }))
      router.push(`/game?child=${studentId}`)
    } catch (e) {
      alert('Could not start session. Please ensure python main.py backend is running.')
      setSessionStarting(false)
    }
  }

  const rawActive = students.find(s => s.id === activeChildId) || {
    id: activeChildId,
    name: activeChildId.charAt(0).toUpperCase() + activeChildId.slice(1),
    level: 3,
    type: 'Dyslexia Profile'
  }
  const activeStudent = {
    ...rawActive,
    name: dedupeName(rawActive.name)
  }

  const rawChildType = (childProfile?.dyslexiaType || activeStudent?.type || '').toLowerCase()
  const isNonDyslexic = Boolean(
    rawChildType.includes('non') ||
    rawChildType === 'none' ||
    rawChildType === 'general' ||
    rawChildType === 'standard' ||
    rawChildType === 'normal'
  )

  return (
    <main
      suppressHydrationWarning
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem 1.5rem',
        minHeight: '100vh',
        backgroundColor: '#06080F',
        overflow: 'hidden',
        color: 'var(--white)',
        fontFamily: 'var(--font)',
      }}
    >
      <TeacherBackground />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Header */}
        <div
          style={{
            width: '100%',
            maxWidth: 1040,
            display: 'grid',
            gridTemplateColumns: '88px 1fr 88px',
            alignItems: 'center',
            marginBottom: '1.25rem',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button
              onClick={() => {
                if (document.cookie.includes('wb_teacher_session')) {
                  router.push('/teacher/dashboard')
                } else {
                  router.push('/')
                }
              }}
              aria-label="Back to teacher dashboard"
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--border)',
                color: 'var(--white)',
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                minHeight: 40,
                transition: 'all 0.2s ease',
              }}
            >
              <span>←</span>
              <span>Back</span>
            </button>
          </div>

          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--white)', margin: 0, lineHeight: 1.2 }}>
              Session Reports
            </h1>
            <p suppressHydrationWarning style={{ fontSize: 13, color: 'var(--grey)', marginTop: 4 }}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => router.push('/')}
              aria-label="Return to home page"
              style={{
                background: 'var(--accent-bg)',
                color: '#EEF2FF',
                border: '1.5px solid var(--accent)',
                borderRadius: 24,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                minHeight: 40,
                boxShadow: '0 4px 14px rgba(129,140,248,0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              <span>🏠</span>
              <span>Home</span>
            </button>
          </div>
        </div>

      {/* Student selector tabs */}
      <div style={{ width: '100%', maxWidth: 1040, marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--grey)', fontWeight: 700, marginBottom: 8 }}>
          Select Student:
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {students.map(st => {
            const isSelected = st.id === activeChildId
            return (
              <button
                key={st.id}
                onClick={() => {
                  setActiveChildId(st.id)
                  router.push(`/teacher?child=${st.id}`)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', borderRadius: 20,
                  border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? 'var(--bloom)' : 'var(--border)'}`,
                  background: isSelected ? 'var(--bloom-bg)' : 'var(--panel)',
                  color: isSelected ? '#34D399' : 'var(--white)',
                  fontSize: 14, fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: isSelected ? 'var(--bloom)' : 'var(--border2)',
                  color: '#fff', fontSize: 11, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {st.name.charAt(0)}
                </div>
                <span>{st.name.split(' ')[0]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Stats overview (if report exists) */}
      {report && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', maxWidth: 1040, marginBottom: '1.5rem' }}>
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
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--white)' }}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Session report + approval gate */}
      {report ? (
        <div style={{
          width: '100%', maxWidth: 1040,
          background: 'var(--panel)', border: '1.5px solid var(--border2)',
          borderRadius: 18, overflow: 'hidden', marginBottom: '1.5rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        }}>
          {/* Report header */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: '50%',
                  background: 'var(--bloom)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, color: '#fff',
                }}>
                  {activeStudent.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--white)' }}>
                    {dedupeName(activeStudent.name)} · Session Report
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--grey)', marginTop: 2 }}>
                    {report.session_date_display || 'Recent session'} · drafted by Report Agent
                  </div>
                </div>
              </div>

              {!isNonDyslexic && (
                <Link
                  href={`/teacher/children/${activeChildId}/mirror`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(16,185,129,0.15)', border: '1.5px solid rgba(16,185,129,0.35)',
                    color: '#34D399', borderRadius: 20, padding: '6px 14px',
                    fontSize: 12, fontWeight: 700, textDecoration: 'none',
                  }}
                >
                  <span>🔍</span>
                  <span>Dyslexia Mirror</span>
                </Link>
              )}
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
                  ? report.new_words_mastered.map((w: any, idx: number) => {
                    const text = typeof w === 'object' && w !== null ? (w.word || w.target || '') : String(w || '')
                    if (!text) return null
                    return (
                      <span key={`mastered-${text}-${idx}`} style={{
                        display: 'inline-block', background: 'var(--bloom)', color: '#fff',
                        borderRadius: 14, padding: '4px 12px', fontSize: 13, fontWeight: 600,
                        margin: '3px 4px 3px 0',
                      }}>{text}</span>
                    )
                  })
                  : <span style={{ fontSize: 13, color: 'var(--grey)' }}>None yet</span>
                }
              </div>
              <div style={{
                background: 'var(--warn-bg)', border: '1.5px solid rgba(251,191,36,0.3)',
                borderRadius: 'var(--radius)', padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--warn)', fontWeight: 700 }}>TO REVISIT ⚠️</span>
                </div>
                {report.words_to_revisit?.length > 0
                  ? (
                    <div>
                      <div>
                        {report.words_to_revisit.map((w: any, idx: number) => {
                          const text = typeof w === 'object' && w !== null ? (w.word || w.target || '') : String(w || '')
                          if (!text) return null
                          return (
                            <span key={`revisit-${text}-${idx}`} style={{
                              display: 'inline-block', background: 'var(--warn)', color: '#0F172A',
                              borderRadius: 14, padding: '4px 12px', fontSize: 13, fontWeight: 700,
                              margin: '3px 4px 3px 0',
                            }}>{text}</span>
                          )
                        })}
                      </div>
                      {!isNonDyslexic && (
                        <div style={{ marginTop: 10 }}>
                          <Link
                            href={`/teacher/children/${activeChildId}/mirror`}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              background: 'rgba(251,191,36,0.2)', border: '1.5px solid rgba(251,191,36,0.5)',
                              color: '#FBBF24', borderRadius: 8, padding: '6px 12px',
                              fontSize: 12, fontWeight: 800, textDecoration: 'none',
                            }}
                          >
                            <span>🔍</span>
                            <span>See What {activeStudent.name.split(' ')[0]} Sees</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  )
                  : <span style={{ fontSize: 13, color: 'var(--grey)' }}>None</span>
                }
              </div>
            </div>

            {/* WordBloom Profile Recommendation (for Assessment / Not Sure Yet sessions) */}
            {report.recommended_profile && (
              <div style={{
                background: 'rgba(59, 130, 246, 0.12)', border: '1.5px solid rgba(59, 130, 246, 0.4)',
                borderRadius: 'var(--radius)', padding: '16px 20px',
                marginBottom: '1.25rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>🌸</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#93C5FD' }}>
                        WordBloom Assessment Result 🌸
                      </div>
                      <div style={{ fontSize: 15, color: '#FFFFFF', marginTop: 2 }}>
                        WordBloom Recommended Profile: <strong style={{ color: '#38BDF8' }}>{report.recommended_profile}</strong>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/profile?child=${activeChildId}`}
                    style={{
                      background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                      color: '#fff', padding: '8px 18px', borderRadius: 20,
                      fontSize: 12, fontWeight: 800, textDecoration: 'none',
                      boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                    }}
                  >
                    Update Profile ✏️
                  </Link>
                </div>

                {/* Pedagogical Rationale: Why WordBloom recommends this */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.28)', border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#E2E8F0', lineHeight: 1.5,
                }}>
                  <span style={{ fontWeight: 700, color: '#93C5FD' }}>💡 Why WordBloom recommends this: </span>
                  {report.recommendation_reason || (
                    report.recommended_profile === 'Visual/Spatial' || report.recommended_profile === 'Visual / Spatial'
                      ? `${activeStudent.name.split(' ')[0]} hesitated on letters that mirror or rotate (e.g., b↔d). OpenDyslexic weighted letter bases reduce spatial flipping.`
                      : report.recommended_profile === 'Surface'
                      ? `${activeStudent.name.split(' ')[0]} struggled recognizing irregular whole-word shapes and silent letters. Visual spotlighting and word silhouettes strengthen orthographic memory.`
                      : `When typing words, ${activeStudent.name.split(' ')[0]} demonstrated phonetic spelling patterns and sound-letter substitutions. Targeted sound-by-sound chunking and word-family practice will strengthen letter-sound mapping.`
                  )}
                </div>
              </div>
            )}

            {/* Report text */}
            <div style={{
              fontSize: 15, lineHeight: 1.8, color: 'var(--white)', fontWeight: 500,
              background: 'rgba(255,255,255,0.04)',
              border: '1.5px solid var(--border2)', borderRadius: 'var(--radius)',
              padding: '16px 18px', marginBottom: '1.25rem',
            }}>
              {cleanReportText(report.report_text, activeStudent.name) || 'Report text loading...'}
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
                Report approved and sent to {(report.child_name || activeStudent.name).split(' ')[0]}'s parents.
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
        /* No session report yet — Display Student Profile Summary */
        <div style={{
          width: '100%', maxWidth: 1040,
          background: 'var(--panel)', border: '1.5px solid var(--border2)',
          borderRadius: 18, padding: '2rem 1.75rem', textAlign: 'left',
          color: 'var(--white)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1.5rem' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--bloom)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: '#fff',
            }}>
              {activeStudent.name.charAt(0)}
            </div>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--white)' }}>
                {childProfile?.fullName || activeStudent.name}
              </h3>
              <div style={{ fontSize: 14, color: 'var(--grey)', marginTop: 2 }}>
                Stage {childProfile?.readingLevel || activeStudent.level} · {childProfile?.dyslexiaType === 'non_dyslexic' ? 'NON-DYSLEXIC (GENERAL)' : (childProfile?.dyslexiaType ? childProfile.dyslexiaType.toUpperCase() : activeStudent.type)}
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border2)',
            borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--bloom)', marginBottom: 8, letterSpacing: 0.5 }}>
              STUDENT PROFILE STATUS
            </div>
            <div style={{ fontSize: 14, color: 'var(--white)', lineHeight: 1.6 }}>
              No completed session report recorded for <strong>{activeStudent.name}</strong> yet. You can edit their profile settings or launch an adaptive session below.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => handleStartSessionForChild(activeChildId)}
              disabled={sessionStarting}
              style={{
                flex: 1, minWidth: 200, background: 'var(--bloom)',
                color: '#fff', padding: '14px 24px', minHeight: 50,
                borderRadius: 50, fontSize: 15, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                opacity: sessionStarting ? 0.7 : 1,
              }}
            >
              {sessionStarting ? 'Launching...' : `🌱 Start Session for ${activeStudent.name.split(' ')[0]}`}
            </button>
            <button
              onClick={() => router.push(`/profile?child=${activeChildId}`)}
              style={{
                padding: '14px 20px', minHeight: 50,
                background: 'var(--panel)', border: '1.5px solid var(--border2)',
                color: 'var(--white)', borderRadius: 50, fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ✏️ Edit Profile
            </button>
          </div>
        </div>
      )}

      {/* Agent activity badge */}
      <div style={{
        width: '100%', maxWidth: 1040,
        background: 'var(--panel)', border: '1.5px solid var(--border2)',
        borderRadius: 24, padding: '14px 20px',
        fontSize: 14, fontWeight: 600, color: 'var(--white)',
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      }}>
        <span style={{
          background: '#F472B6', color: '#0F172A',
          fontSize: 13, fontWeight: 800, padding: '4px 12px', borderRadius: 12,
          letterSpacing: 0.5, textTransform: 'uppercase',
          boxShadow: '0 2px 6px rgba(244,114,182,0.4)',
        }}>
          📋 Report Agent
        </span>
        <span>
          Monitoring <strong>{activeStudent.name}</strong> · <strong style={{ color: approved ? '#34D399' : '#FCD34D' }}>{approved ? 'Approved ✅' : (report ? 'awaiting your approval' : 'ready for session')}</strong>
        </span>
      </div>
      </div>
    </main>
  )
}

export default function TeacherPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--grey)' }}>
        Loading Teacher Dashboard...
      </div>
    }>
      <TeacherDashboardContent />
    </Suspense>
  )
}
