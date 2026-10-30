'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { saveProfile, getProfile } from '../../lib/api'
import TeacherBackground from '../../components/TeacherBackground'
import { DYSLEXIA_INPUT_DEFAULTS, getInputModeRecommendation } from '../../config/inputDefaults'

function ProfileForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const childParam = searchParams.get('child') || 'emma'
  const isNew = childParam === 'new'
  const cKey = childParam.toLowerCase().trim()

  // Child-specific defaults so initial render has zero layout jump before API resolves
  const CHILD_DEFAULTS: Record<string, any> = {
    emma: {
      fullName: 'Emma Clarke', age: 9, schoolYear: 'Year 4', dyslexiaType: 'phonological',
      coOccurring: ['adhd'], readingLevel: 3, inputMode: 'voice', displayMode: 'opendyslexic',
      colourOverlay: 'yellow', sessionLength: 5, candyGoal: 5, breakAfter: 5,
    },
    liam: {
      fullName: "Liam O'Connor", age: 8, schoolYear: 'Year 3', dyslexiaType: 'surface',
      coOccurring: ['dyspraxia', 'adhd'], readingLevel: 2, inputMode: 'tap', displayMode: 'standard',
      colourOverlay: 'none', sessionLength: 5, candyGoal: 5, breakAfter: 5,
    },
    james: {
      fullName: 'James Patel', age: 10, schoolYear: 'Year 5', dyslexiaType: 'visual',
      coOccurring: ['dyspraxia'], readingLevel: 2, inputMode: 'tap', displayMode: 'opendyslexic',
      colourOverlay: 'yellow', sessionLength: 10, candyGoal: 8, breakAfter: 10,
    },
    sofia: {
      fullName: 'Sony Mathew', age: 7, schoolYear: 'Year 3', dyslexiaType: 'unknown',
      coOccurring: [], readingLevel: 1, inputMode: 'type', displayMode: 'standard',
      colourOverlay: 'blue', sessionLength: 5, candyGoal: 5, breakAfter: 5,
    },
    sony: {
      fullName: 'Sony Mathew', age: 7, schoolYear: 'Year 3', dyslexiaType: 'unknown',
      coOccurring: [], readingLevel: 1, inputMode: 'type', displayMode: 'standard',
      colourOverlay: 'blue', sessionLength: 5, candyGoal: 5, breakAfter: 5,
    },
    alex: {
      fullName: 'Alex', age: 13, schoolYear: 'Year 9', dyslexiaType: 'non_dyslexic',
      coOccurring: [], readingLevel: 4, inputMode: 'type', displayMode: 'standard',
      colourOverlay: 'none', sessionLength: 10, candyGoal: 4, breakAfter: 10,
    },
  }

  const getInitialField = (field: string, fallbackVal: any) => {
    if (isNew) return fallbackVal
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`wb_profile_${cKey}`)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed[field] !== undefined && parsed[field] !== null) return parsed[field]
        }
      } catch (e) {}
    }
    const def = CHILD_DEFAULTS[cKey]
    if (def && def[field] !== undefined) return def[field]
    return fallbackVal
  }

  const [childId, setChildId] = useState(isNew ? 'child_new' : childParam)
  const [fullName, setFullName] = useState<string>(() => getInitialField('fullName', isNew ? '' : (childParam.charAt(0).toUpperCase() + childParam.slice(1))))
  const [parentEmail, setParentEmail] = useState<string>(() => getInitialField('parentEmail', isNew ? '' : 'parent@example.com'))
  const [age, setAge] = useState<string | number>(() => getInitialField('age', isNew ? '' : 9))
  const [schoolYear, setSchoolYear] = useState<string>(() => getInitialField('schoolYear', isNew ? '' : 'Year 4'))

  // Dyslexia Type — unselected by default for new child
  const [dyslexiaType, setDyslexiaType] = useState<string>(() => getInitialField('dyslexiaType', isNew ? '' : 'phonological'))

  // Co-occurring conditions
  const [coOccurring, setCoOccurring] = useState<string[]>(() => getInitialField('coOccurring', isNew ? [] : []))

  // Reading Level — unselected by default for new child
  const [readingLevel, setReadingLevel] = useState<number | null>(() => getInitialField('readingLevel', isNew ? null : 2))

  // Input Mode — unselected by default for new child
  const [inputMode, setInputMode] = useState<string>(() => getInitialField('inputMode', isNew ? '' : 'voice'))
  const [inputModeTouched, setInputModeTouched] = useState(false)

  // Display Mode — unselected by default for new child
  const [displayMode, setDisplayMode] = useState<string>(() => getInitialField('displayMode', isNew ? '' : 'opendyslexic'))

  // Colour Overlay — unselected by default for new child
  const [colourOverlay, setColourOverlay] = useState<string>(() => getInitialField('colourOverlay', isNew ? '' : 'none'))

  // Session Settings
  const [sessionLength, setSessionLength] = useState<number>(() => getInitialField('sessionLength', 5))
  const [candyGoal, setCandyGoal] = useState<number>(() => getInitialField('candyGoal', 5))
  const [breakAfter, setBreakAfter] = useState<number>(() => getInitialField('breakAfter', 5))

  const [saving, setSaving] = useState(false)

  const hasADHD = coOccurring.includes('adhd')
  const hasAutism = coOccurring.includes('autism')
  const recommendation = getInputModeRecommendation(dyslexiaType)

  // Sync ADHD locks
  useEffect(() => {
    if (hasADHD) {
      setSessionLength(5)
      setCandyGoal(5)
      setBreakAfter(5)
    }
  }, [hasADHD])

  // Try loading existing profile on mount (only if not already hydrated from localStorage)
  useEffect(() => {
    if (!isNew && childParam) {
      if (typeof window !== 'undefined' && localStorage.getItem(`wb_profile_${cKey}`)) {
        return
      }
      getProfile(childParam)
        .then(res => {
          if (res.found && res.content) {
            const raw = res.content
            const matchName = raw.match(/- Full name:\s*(.+)/i)
            if (matchName) setFullName(matchName[1].strip ? matchName[1].strip() : matchName[1].trim())

            const matchEmail = raw.match(/- Parent email:\s*(.+)/i)
            if (matchEmail) setParentEmail(matchEmail[1].trim())

            const matchAge = raw.match(/- Age:\s*(\d+)/i)
            if (matchAge) setAge(parseInt(matchAge[1]))

            const matchYear = raw.match(/- School year:\s*(.+)/i)
            if (matchYear) setSchoolYear(matchYear[1].trim())

            const matchType = raw.match(/- (?:Dyslexia type|Type):\s*(.+)/i)
            if (matchType) {
              let t = matchType[1].trim().toLowerCase()
              if (t === 'visual/spatial' || t === 'visual_spatial') t = 'visual'
              if (t === 'double_deficit' || t === 'double deficit') t = 'double'
              if (t === 'not_sure' || t === 'not sure yet') t = 'unknown'
              setDyslexiaType(t)
            }

            const matchCo = raw.match(/- (?:Conditions|Co-occurring):\s*(.+)/i)
            if (matchCo) {
              const list = matchCo[1]
                .split(',')
                .map((s: string) => s.trim().toLowerCase())
                .filter((s: string) => Boolean(s) && s !== 'none')
              setCoOccurring(list)
            }

            const matchInput = raw.match(/- Input mode:\s*(.+)/i)
            if (matchInput) setInputMode(matchInput[1].trim().toLowerCase())

            const matchDisplay = raw.match(/- Display mode:\s*(.+)/i)
            if (matchDisplay) setDisplayMode(matchDisplay[1].trim().toLowerCase())

            const matchOverlay = raw.match(/- Colour overlay:\s*(.+)/i)
            if (matchOverlay) setColourOverlay(matchOverlay[1].trim().toLowerCase())

            const matchLevel = raw.match(/- Reading (?:level|stage):\s*(\d+)/i)
            if (matchLevel) setReadingLevel(parseInt(matchLevel[1]))

            const matchCandy = raw.match(/- Candy goal:\s*(\d+)/i)
            if (matchCandy) setCandyGoal(parseInt(matchCandy[1]))

            const matchSession = raw.match(/- Session length:\s*(\d+)/i)
            if (matchSession) setSessionLength(parseInt(matchSession[1]))

            const matchBreak = raw.match(/- Break after:\s*(\d+)/i)
            if (matchBreak) setBreakAfter(parseInt(matchBreak[1]))
          }
        })
        .catch(() => {})
    }
  }, [childParam, isNew, cKey])

  // Ensure teacher administration screen maintains clean dark styling
  useEffect(() => {
    document.body.className = ''
    return () => {
      document.body.className = ''
    }
  }, [])

  const toggleCoOccurring = (condition: string) => {
    setCoOccurring(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    )
  }

  const handleSelectDyslexiaType = (typeId: string) => {
    setDyslexiaType(typeId)

    // Auto-select input mode ONLY for new child and ONLY if teacher has not manually picked one
    if (isNew && !inputModeTouched) {
      const rec = DYSLEXIA_INPUT_DEFAULTS[typeId]
      if (rec) {
        setInputMode(rec)
      }
    }

    if (typeId === 'non_dyslexic') {
      setDisplayMode('standard')
      setColourOverlay('none')
      if (isNew && !inputModeTouched) {
        setInputMode('type')
      }
      if (!hasADHD) {
        setSessionLength(10)
        setBreakAfter(10)
      }
    }
  }

  const handleSave = async () => {
    if (isNew) {
      if (!fullName.trim()) {
        alert("Please enter the child's full name.")
        return
      }
      if (!dyslexiaType) {
        alert('Please select a Bloom profile (or "Not sure yet").')
        return
      }
      if (readingLevel === null) {
        alert('Please select a reading level stage.')
        return
      }
      if (!inputMode) {
        alert('Please select how the child will answer (input mode).')
        return
      }
      if (!displayMode) {
        alert('Please select a display mode.')
        return
      }
      if (!colourOverlay) {
        alert('Please select a colour overlay (or "None").')
        return
      }
    }

    setSaving(true)
    const activeId = isNew
      ? (fullName.split(' ')[0] || 'child').toLowerCase().replace(/[^a-z0-9]/g, '')
      : childParam.toLowerCase()

    const approach = inputMode === 'voice' ? 'audio_first' : (dyslexiaType === 'non_dyslexic' ? 'standard' : 'phonics')
    const encouragementStyle = (hasADHD || hasAutism) ? 'specific' : 'warm'

    // Construct SKILL.md format
    const skillContent = `---
name: ${activeId}
description: ${fullName || activeId}'s learning profile and dyslexia settings
---

# ${fullName || activeId} — Learning Profile

## Identity
- Full name: ${fullName || 'Child'}
- Parent email: ${parentEmail || 'not_provided'}
- Age: ${age}
- School year: ${schoolYear}

## Dyslexia Profile
- Type: ${dyslexiaType}
- Co-occurring: ${coOccurring.join(', ') || 'none'}

## Access Settings
- Input mode: ${inputMode}
- Display mode: ${displayMode}
- Colour overlay: ${colourOverlay}
- Show timer: never
- Score display: stars only

## Session Settings
- Session length: ${hasADHD ? 5 : sessionLength}
- Candy goal: ${hasADHD ? 5 : candyGoal}
- Break after: ${hasADHD ? 5 : breakAfter}
- Approach: ${approach}
- Encouragement style: ${encouragementStyle}

## Current Progress
- Reading level: ${readingLevel ?? 1}
- Mastered words: cat, dog, run, play, help
- Struggling with: through, knight, enough
- Pattern difficulty: silent letters
`

    try {
      await saveProfile(activeId, skillContent)
      const profileData = {
        id: activeId,
        fullName,
        parentEmail,
        age,
        schoolYear,
        dyslexiaType,
        coOccurring,
        readingLevel: readingLevel ?? 1,
        inputMode,
        displayMode,
        colourOverlay,
        candyGoal: hasADHD ? 5 : candyGoal,
        sessionLength: hasADHD ? 5 : sessionLength,
        breakAfter: hasADHD ? 5 : breakAfter,
      }
      localStorage.setItem(`wb_profile_${activeId}`, JSON.stringify(profileData))
      if (activeId === 'sofia' || activeId === 'sony') {
        localStorage.setItem('wb_profile_sofia', JSON.stringify({ ...profileData, id: 'sofia' }))
        localStorage.setItem('wb_profile_sony', JSON.stringify({ ...profileData, id: 'sony' }))
      }
      try {
        const rawIds = localStorage.getItem('wb_custom_children_ids')
        const idList: string[] = rawIds ? JSON.parse(rawIds) : []
        if (!idList.includes(activeId)) {
          idList.push(activeId)
          localStorage.setItem('wb_custom_children_ids', JSON.stringify(idList))
        }
      } catch (e) {}

      if (document.cookie.includes('wb_teacher_session')) {
        router.push('/teacher/dashboard')
      } else {
        router.push('/')
      }
    } catch (err) {
      console.error(err)
      alert('Could not save profile to backend server. Make sure main.py is running.')
      setSaving(false)
    }
  }

  return (
    <main
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#06080F',
        overflow: 'hidden',
        color: '#F9FAFB',
      }}
    >
      <TeacherBackground />
      <div
        suppressHydrationWarning
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '2.5rem 1.5rem 4rem',
          minHeight: '100vh',
          maxWidth: 1040,
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', gap: 12 }}>
          <button
            onClick={() => {
              if (document.cookie.includes('wb_teacher_session')) {
                router.push('/teacher/dashboard')
              } else {
                router.push('/')
              }
            }}
            aria-label="Back to dashboard or home"
            title="Back"
            style={{
              background: '#111827',
              border: '1.5px solid #1F2937',
              color: '#F9FAFB',
              padding: '10px 20px',
              borderRadius: 30,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            <span>←</span>
            <span>Back</span>
          </button>

          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#F9FAFB', margin: 0, letterSpacing: '-0.01em' }}>
              {isNew ? 'New Child Profile' : `Edit ${fullName.split(' ')[0] || 'Child'}'s Profile`}
            </h1>
            <p style={{ fontSize: 15, color: '#9CA3AF', marginTop: 4, margin: 0 }}>
              WordBloom Adaptive Learning Settings
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !fullName.trim()}
            style={{
              background: 'linear-gradient(135deg, #10B981, #059669)',
              border: 'none',
              color: '#FFFFFF',
              padding: '10px 24px',
              borderRadius: 30,
              fontSize: 15,
              fontWeight: 800,
              cursor: saving ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
              opacity: saving || !fullName.trim() ? 0.6 : 1,
            }}
          >
            <span>💾</span>
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

          {/* Section 1: Identity */}
          <section style={{ background: '#111827', padding: '1.75rem', borderRadius: 20, border: '1.5px solid #1F2937', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: 13.5, textTransform: 'uppercase', letterSpacing: 1.8, color: '#10B981', fontWeight: 800, marginBottom: '1.25rem' }}>
              SECTION 1: IDENTITY
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 15, fontWeight: 700, color: '#F9FAFB', marginBottom: 8 }}>Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Emma Clarke"
                    style={{
                      width: '100%', padding: '13px 16px', background: '#0F172A',
                      border: '1.5px solid #1F2937', borderRadius: 12,
                      color: '#F9FAFB', fontSize: 16, outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 15, fontWeight: 700, color: '#F9FAFB', marginBottom: 8 }}>Parent's Email Address (For Progress Reports)</label>
                  <input
                    type="email"
                    value={parentEmail}
                    onChange={e => setParentEmail(e.target.value)}
                    placeholder="e.g. parent@example.com"
                    style={{
                      width: '100%', padding: '13px 16px', background: '#0F172A',
                      border: '1.5px solid #1F2937', borderRadius: 12,
                      color: '#F9FAFB', fontSize: 16, outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 15, fontWeight: 700, color: '#F9FAFB', marginBottom: 8 }}>Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    placeholder="e.g. 9"
                    style={{
                      width: '100%', padding: '13px 16px', background: '#0F172A',
                      border: '1.5px solid #1F2937', borderRadius: 12,
                      color: '#F9FAFB', fontSize: 16, outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 15, fontWeight: 700, color: '#F9FAFB', marginBottom: 8 }}>School Year</label>
                  <input
                    type="text"
                    value={schoolYear}
                    onChange={e => setSchoolYear(e.target.value)}
                    placeholder="e.g. Year 4"
                    style={{
                      width: '100%', padding: '13px 16px', background: '#0F172A',
                      border: '1.5px solid #1F2937', borderRadius: 12,
                      color: '#F9FAFB', fontSize: 16, outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Bloom Profile */}
          <section style={{ background: '#111827', padding: '1.75rem', borderRadius: 20, border: '1.5px solid #1F2937', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 13.5, textTransform: 'uppercase', letterSpacing: 1.8, color: '#10B981', fontWeight: 800 }}>
                SECTION 2: BLOOM PROFILE 🌸
              </div>
              <span style={{ fontSize: 13, color: '#10B981', fontWeight: 800, background: 'rgba(16, 185, 129, 0.15)', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                Pick One
              </span>
            </div>
            <p style={{ fontSize: 14.5, color: '#9CA3AF', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Every child blooms in their own way — select their primary reading and learning profile:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {[
                { id: 'non_dyslexic', name: 'Non-dyslexic (General)', desc: 'Standard reader — normal font, pacing & display without accommodations' },
                { id: 'phonological', name: 'Phonological', desc: 'Difficulty connecting letters to sounds' },
                { id: 'surface',      name: 'Surface',      desc: 'Difficulty recognising whole words' },
                { id: 'visual',       name: 'Visual/spatial', desc: 'Letters appear to move or flip' },
                { id: 'double',       name: 'Double deficit', desc: 'Speed and sound processing both affected' },
                { id: 'attentional',  name: 'Attentional', desc: 'Letters swap between words' },
                { id: 'unknown',      name: 'Not sure yet', desc: 'Agent will assess during session' },
              ].map(type => {
                const isSelected = dyslexiaType === type.id
                return (
                  <div
                    key={type.id}
                    onClick={() => handleSelectDyslexiaType(type.id)}
                    style={{
                      padding: '16px 18px', borderRadius: 14, cursor: 'pointer',
                      border: isSelected ? '2px solid #10B981' : '1.5px solid #1F2937',
                      background: isSelected ? 'rgba(16, 185, 129, 0.1)' : '#0F172A',
                      transition: 'all 0.2s ease',
                      gridColumn: type.id === 'non_dyslexic' ? '1 / -1' : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 16.5, fontWeight: 800, color: isSelected ? '#34D399' : '#F9FAFB' }}>
                        {type.id === 'non_dyslexic' ? '🌱 ' + type.name : type.name}
                      </div>
                      {isSelected && (
                        <span style={{ color: '#10B981', fontWeight: 900, fontSize: 18 }}>✓</span>
                      )}
                    </div>
                    <div style={{ fontSize: 14, color: '#9CA3AF', marginTop: 6, lineHeight: 1.45 }}>
                      {type.desc}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Non-dyslexic Banner */}
            {dyslexiaType === 'non_dyslexic' && (
              <div style={{
                marginTop: 16,
                background: 'rgba(16,185,129,0.12)', border: '1.5px solid rgba(16,185,129,0.4)',
                borderRadius: 14, padding: '14px 18px', fontSize: 13.5, color: '#34D399',
                lineHeight: 1.5, fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <span style={{ fontSize: 24 }}>🌱</span>
                <div>
                  <strong style={{ color: '#FFFFFF', fontSize: 14.5 }}>Standard / Non-dyslexic Reading Mode Active</strong>
                  <div style={{ color: '#A7F3D0', marginTop: 3 }}>
                    WordBloom operates in standard mode: crisp typography, exact spelling assessment, natural pacing, and no colour overlays.
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Section 3: Co-occurring conditions (pick multiple) */}
          <section style={{ background: '#111827', padding: '1.75rem', borderRadius: 20, border: '1.5px solid #1F2937', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: 13.5, textTransform: 'uppercase', letterSpacing: 1.8, color: '#10B981', fontWeight: 800, marginBottom: '1.25rem' }}>
              SECTION 3: CO-OCCURRING CONDITIONS (PICK MULTIPLE)
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {['adhd', 'dyspraxia', 'autism'].map(cond => {
                const active = coOccurring.includes(cond)
                return (
                  <button
                    key={cond}
                    onClick={() => toggleCoOccurring(cond)}
                    style={{
                      padding: '11px 24px', borderRadius: 30, fontSize: 15, fontWeight: 700,
                      border: active ? '2px solid #10B981' : '1.5px solid #1F2937',
                      background: active ? 'rgba(16, 185, 129, 0.12)' : '#0F172A',
                      color: active ? '#34D399' : '#F9FAFB', cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {cond.toUpperCase()} {active ? '✓' : '+'}
                  </button>
                )
              })}
            </div>

            {/* Conditional Alerts */}
            {hasADHD && (
              <div style={{
                background: 'rgba(245,158,11,0.12)', border: '1.5px solid rgba(245,158,11,0.4)',
                borderRadius: 14, padding: '15px 20px', fontSize: 14.5, color: '#FBBF24',
                lineHeight: 1.55, fontWeight: 600, marginBottom: hasAutism ? 12 : 0
              }}>
                ⚠️ <strong>ADHD detected</strong> — session auto-set to 5 min, break every 5 words, encouragement style set to specific (factual not vague)
              </div>
            )}

            {hasAutism && (
              <div style={{
                background: 'rgba(129,140,248,0.12)', border: '1.5px solid rgba(129,140,248,0.4)',
                borderRadius: 14, padding: '15px 20px', fontSize: 14.5, color: '#C7D2FE',
                lineHeight: 1.55, fontWeight: 600
              }}>
                💡 <strong>Autism flag</strong> — encouragement will use specific facts only. No sudden difficulty changes.
              </div>
            )}
          </section>

          {/* Section 4: Reading level (pick one) */}
          <section style={{ background: '#111827', padding: '1.75rem', borderRadius: 20, border: '1.5px solid #1F2937', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: 13.5, textTransform: 'uppercase', letterSpacing: 1.8, color: '#10B981', fontWeight: 800, marginBottom: '1.25rem' }}>
              SECTION 4: READING LEVEL (PICK ONE)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {[
                { lvl: 1, name: 'Stage 1', desc: 'Simple CVC words' },
                { lvl: 2, name: 'Stage 2', desc: 'Digraphs & blends' },
                { lvl: 3, name: 'Stage 3', desc: 'Silent letters' },
                { lvl: 4, name: 'Stage 4', desc: 'Multisyllabic' },
              ].map(item => {
                const isSelected = readingLevel === item.lvl
                return (
                  <button
                    key={item.lvl}
                    onClick={() => setReadingLevel(item.lvl)}
                    style={{
                      padding: '16px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                      border: isSelected ? '2px solid #10B981' : '1.5px solid #1F2937',
                      background: isSelected ? 'rgba(16, 185, 129, 0.1)' : '#0F172A',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontSize: 16.5, fontWeight: 800, color: isSelected ? '#34D399' : '#F9FAFB' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 13.5, color: '#9CA3AF', marginTop: 5, lineHeight: 1.35 }}>
                      {item.desc}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Section 5: How they answer (pick one) */}
          <section style={{ background: '#111827', padding: '1.75rem', borderRadius: 20, border: '1.5px solid #1F2937', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontSize: 13.5, textTransform: 'uppercase', letterSpacing: 1.8, color: '#10B981', fontWeight: 800 }}>
                SECTION 5: HOW THEY ANSWER (PICK ONE)
              </div>
              {isNew && recommendation.recommendedMode && (
                <span style={{ fontSize: 13, color: '#10B981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.12)', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  Smart suggestion based on profile
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              {[
                { id: 'type',  icon: '⌨️', name: 'Type it', desc: 'Keyboard input' },
                { id: 'voice', icon: '🎤', name: 'Say it', desc: 'Voice / speech input' },
                { id: 'tap',   icon: '🔲', name: 'Tap letters', desc: 'Letter tile selection' },
              ].map(mode => {
                const isSelected = inputMode === mode.id
                const isRecommended = isNew && recommendation.recommendedMode === mode.id

                const labelParts = [mode.name]
                if (isRecommended) labelParts.push('recommended')
                if (isSelected) labelParts.push('selected')
                const accessibilityLabel = labelParts.join(', ')

                return (
                  <div
                    key={mode.id}
                    role="button"
                    tabIndex={0}
                    aria-label={accessibilityLabel}
                    aria-selected={isSelected}
                    onClick={() => {
                      setInputModeTouched(true)
                      setInputMode(mode.id)
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setInputModeTouched(true)
                        setInputMode(mode.id)
                      }
                    }}
                    style={{
                      position: 'relative',
                      padding: '20px 18px', borderRadius: 16, cursor: 'pointer', textAlign: 'center',
                      border: isSelected ? '2px solid #10B981' : (isRecommended ? '1.5px solid rgba(16, 185, 129, 0.5)' : '1.5px solid #1F2937'),
                      background: isSelected ? 'rgba(16, 185, 129, 0.12)' : '#0F172A',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      minHeight: 180,
                    }}
                  >
                    {isRecommended && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -10,
                          background: 'linear-gradient(135deg, #10B981, #059669)',
                          color: '#FFFFFF',
                          fontSize: 11.5,
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: 20,
                          textTransform: 'uppercase',
                          letterSpacing: 0.6,
                          boxShadow: '0 2px 8px rgba(16,185,129,0.35)',
                        }}
                      >
                        ★ Recommended
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 34, marginBottom: 8, marginTop: isRecommended ? 6 : 0 }}>{mode.icon}</div>
                      <div style={{ fontSize: 16.5, fontWeight: 800, color: isSelected ? '#34D399' : '#F9FAFB' }}>
                        {mode.name}
                      </div>
                      <div style={{ fontSize: 14, color: '#9CA3AF', marginTop: 5 }}>{mode.desc}</div>
                    </div>

                    {isRecommended && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: '8px 10px',
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          borderRadius: 10,
                          fontSize: 12.5,
                          color: '#A7F3D0',
                          lineHeight: 1.4,
                          fontWeight: 500,
                        }}
                      >
                        {recommendation.reason}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Under Section 5 note */}
            <div
              style={{
                marginTop: '1.25rem',
                fontSize: 14,
                color: '#9CA3AF',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid rgba(31, 41, 55, 0.8)',
              }}
            >
              <span style={{ fontSize: 16 }}>🌱</span>
              <span>
                WordBloom will adjust as it learns how {fullName.trim() ? fullName.split(' ')[0] : 'the child'} answers.
              </span>
            </div>
          </section>

          {/* Section 6: Display mode (pick one) */}
          <section style={{ background: '#111827', padding: '1.75rem', borderRadius: 20, border: '1.5px solid #1F2937', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: 13.5, textTransform: 'uppercase', letterSpacing: 1.8, color: '#10B981', fontWeight: 800, marginBottom: '1.25rem' }}>
              SECTION 6: DISPLAY MODE (PICK ONE)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              {[
                { id: 'standard',     name: 'Standard', desc: 'Default font and spacing' },
                { id: 'opendyslexic', name: 'OpenDyslexic', desc: 'Weighted letters reduce flipping' },
                { id: 'spotlight',    name: 'Spotlight', desc: 'One word at a time, rest masked' },
              ].map(disp => {
                const isSelected = displayMode === disp.id
                return (
                  <div
                    key={disp.id}
                    onClick={() => setDisplayMode(disp.id)}
                    style={{
                      padding: '18px 20px', borderRadius: 16, cursor: 'pointer',
                      border: isSelected ? '2px solid #10B981' : '1.5px solid #1F2937',
                      background: isSelected ? 'rgba(16, 185, 129, 0.1)' : '#0F172A',
                      transition: 'all 0.2s ease',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 16.5, fontWeight: 800, color: isSelected ? '#34D399' : '#F9FAFB' }}>
                          {disp.name}
                        </div>
                        {isSelected && <span style={{ color: '#10B981', fontWeight: 900, fontSize: 18 }}>✓</span>}
                      </div>
                      <div style={{ fontSize: 14, color: '#9CA3AF', marginTop: 5, lineHeight: 1.45 }}>{disp.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Section 7: Colour overlay (pick one) */}
          <section style={{ background: '#111827', padding: '1.75rem', borderRadius: 20, border: '1.5px solid #1F2937', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: 13.5, textTransform: 'uppercase', letterSpacing: 1.8, color: '#10B981', fontWeight: 800, marginBottom: 6 }}>
              SECTION 7: COLOUR OVERLAY
            </div>
            <div style={{ fontSize: 14.5, color: '#9CA3AF', marginBottom: '1.25rem' }}>
              Child picks what feels right — reduces visual stress and glare
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {[
                { id: 'none',   label: 'None',   color: '#0F172A', border: '#1F2937' },
                { id: 'yellow', label: 'Yellow', color: '#FEF3C7', border: '#FBBF24' },
                { id: 'blue',   label: 'Blue',   color: '#DBEAFE', border: '#60A5FA' },
                { id: 'green',  label: 'Green',  color: '#D1FAE5', border: '#34D399' },
                { id: 'pink',   label: 'Pink',   color: '#FCE7F3', border: '#F472B6' },
              ].map(item => {
                const isSelected = colourOverlay === item.id
                return (
                  <div
                    key={item.id}
                    onClick={() => setColourOverlay(item.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer',
                      padding: '12px 18px', borderRadius: 16,
                      background: isSelected ? 'rgba(16, 185, 129, 0.1)' : '#0F172A',
                      border: isSelected ? '2px solid #10B981' : '1.5px solid #1F2937',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 46, height: 46, borderRadius: '50%',
                        background: item.color,
                        border: `2.5px solid ${isSelected ? '#10B981' : item.border}`,
                        boxShadow: isSelected ? '0 0 14px rgba(16,185,129,0.5)' : '0 2px 6px rgba(0,0,0,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18,
                        color: item.id === 'none' ? '#F9FAFB' : '#0F172A',
                        fontWeight: 'bold',
                        transition: 'transform 0.15s ease',
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                      }}
                    >
                      {isSelected ? '✓' : ''}
                    </div>
                    <span style={{
                      fontSize: 14.5,
                      color: isSelected ? '#34D399' : '#F9FAFB',
                      fontWeight: isSelected ? 800 : 600
                    }}>
                      {item.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Live Overlay Preview Swatch */}
            <div
              style={{
                borderRadius: 14,
                padding: '16px 20px',
                background: colourOverlay === 'yellow' ? '#FEF3C7' :
                            colourOverlay === 'blue' ? '#DBEAFE' :
                            colourOverlay === 'green' ? '#D1FAE5' :
                            colourOverlay === 'pink' ? '#FCE7F3' : '#0F172A',
                border: '1.5px solid #1F2937',
                color: colourOverlay === 'none' ? '#9CA3AF' : '#0F172A',
                fontSize: 15,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ fontSize: 22 }}>🎨</span>
              <div>
                <strong>Overlay Preview ({colourOverlay.toUpperCase()}):</strong>
                <span style={{ marginLeft: 6 }}>
                  {colourOverlay === 'none'
                    ? 'Default crisp contrast canvas without background tint.'
                    : 'Words and reading sentences appear against this gentle tint to minimize visual discomfort.'}
                </span>
              </div>
            </div>
          </section>

          {/* Section 8: Session settings */}
          <section style={{ background: '#111827', padding: '1.75rem', borderRadius: 20, border: '1.5px solid #1F2937', boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: 13.5, textTransform: 'uppercase', letterSpacing: 1.8, color: '#10B981', fontWeight: 800, marginBottom: '1.25rem' }}>
              SECTION 8: SESSION SETTINGS
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {/* Bloom Goal */}
              <div style={{ background: '#0F172A', padding: '18px', borderRadius: 14, border: '1px solid #1F2937' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#F9FAFB', marginBottom: 8 }}>
                  <span>🎯 Goal: {candyGoal} blooms 🌸</span>
                  {hasADHD && <span style={{ color: '#FBBF24', fontSize: 13 }}>(ADHD auto-set to 5)</span>}
                </div>
                <input
                  type="range" min={3} max={15} value={candyGoal}
                  disabled={hasADHD}
                  onChange={e => setCandyGoal(parseInt(e.target.value))}
                  style={{ width: '100%', opacity: hasADHD ? 0.5 : 1, accentColor: '#10B981' }}
                />
                <div style={{ fontSize: 13.5, color: '#9CA3AF', marginTop: 8, lineHeight: 1.45 }}>
                  Session concludes once the child blooms {candyGoal} flowers — zero timer pressure!
                </div>
              </div>

              {/* Break Frequency */}
              <div style={{ background: '#0F172A', padding: '18px', borderRadius: 14, border: '1px solid #1F2937' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#F9FAFB', marginBottom: 8 }}>
                  <span>⏸️ Break after: {breakAfter} words</span>
                  {hasADHD && <span style={{ color: '#FBBF24', fontSize: 13 }}>(ADHD auto-set)</span>}
                </div>
                <input
                  type="range" min={3} max={15} value={breakAfter}
                  disabled={hasADHD}
                  onChange={e => setBreakAfter(parseInt(e.target.value))}
                  style={{ width: '100%', opacity: hasADHD ? 0.5 : 1, accentColor: '#10B981' }}
                />
                <div style={{ fontSize: 13.5, color: '#9CA3AF', marginTop: 8, lineHeight: 1.45 }}>
                  Offers a gentle 30-second eye rest break after every {breakAfter} words.
                </div>
              </div>

              {/* Safety Duration Ceiling */}
              <div style={{ background: '#0F172A', padding: '18px', borderRadius: 14, border: '1px solid #1F2937' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#F9FAFB', marginBottom: 8 }}>
                  <span>⏱️ Safety duration ceiling: {sessionLength} min</span>
                  {hasADHD && <span style={{ color: '#FBBF24', fontSize: 13 }}>(ADHD auto-set to 5 min)</span>}
                </div>
                <input
                  type="range" min={3} max={20} value={sessionLength}
                  disabled={hasADHD}
                  onChange={e => setSessionLength(parseInt(e.target.value))}
                  style={{ width: '100%', opacity: hasADHD ? 0.5 : 1, accentColor: '#10B981' }}
                />
                <div style={{ fontSize: 13.5, color: '#9CA3AF', marginTop: 8, lineHeight: 1.45 }}>
                  Safety ceiling so session closes gracefully if left unattended.
                </div>
              </div>
            </div>

            <div style={{ background: '#0F172A', padding: '14px 18px', borderRadius: 12, fontSize: 14.5, color: '#9CA3AF', border: '1px solid #1F2937' }}>
              ℹ️ <strong style={{ color: '#F9FAFB' }}>No Timer Pressure:</strong> Countdown clocks are never shown to the child. Sessions end pleasantly when they reach their flower bloom goal!
            </div>
          </section>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || !fullName.trim()}
            style={{
              width: '100%', minHeight: 56, padding: '16px 0',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              color: '#FFFFFF', fontSize: 18, fontWeight: 800,
              borderRadius: 50, border: 'none', cursor: saving ? 'wait' : 'pointer',
              boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
              opacity: saving || !fullName.trim() ? 0.6 : 1,
              marginBottom: '3rem',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
          >
            {saving ? 'Saving profile...' : `Save ${fullName.split(' ')[0] || 'Child'}'s Profile`}
          </button>

        </div>
      </div>
    </main>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#06080F' }} />}>
      <ProfileForm />
    </Suspense>
  )
}
