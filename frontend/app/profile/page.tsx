'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { saveProfile, getProfile } from '../../lib/api'

function ProfileForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const childParam = searchParams.get('child') || 'emma'
  const isNew = childParam === 'new'

  // Form State
  const [childId, setChildId] = useState(isNew ? 'child_new' : childParam)
  const [fullName, setFullName] = useState(isNew ? '' : (childParam.charAt(0).toUpperCase() + childParam.slice(1) + ' Clarke'))
  const [parentEmail, setParentEmail] = useState<string>(isNew ? '' : 'parent@example.com')
  const [age, setAge] = useState<string | number>(isNew ? '' : 9)
  const [schoolYear, setSchoolYear] = useState<string>(isNew ? '' : 'Year 4')

  // Dyslexia Type
  const [dyslexiaType, setDyslexiaType] = useState('phonological')

  // Co-occurring conditions
  const [coOccurring, setCoOccurring] = useState<string[]>(isNew ? [] : ['adhd'])

  // Reading Level
  const [readingLevel, setReadingLevel] = useState<number>(3)

  // Input Mode
  const [inputMode, setInputMode] = useState('voice')

  // Display Mode
  const [displayMode, setDisplayMode] = useState('opendyslexic')

  // Colour Overlay
  const [colourOverlay, setColourOverlay] = useState('yellow')

  // Session Settings
  const [sessionLength, setSessionLength] = useState<number>(5)
  const [candyGoal, setCandyGoal] = useState<number>(5)
  const [breakAfter, setBreakAfter] = useState<number>(5)

  const [saving, setSaving] = useState(false)

  const hasADHD = coOccurring.includes('adhd')
  const hasAutism = coOccurring.includes('autism')

  // Sync ADHD locks
  useEffect(() => {
    if (hasADHD) {
      setSessionLength(5)
      setCandyGoal(5)
      setBreakAfter(5)
    }
  }, [hasADHD])

  // Try loading existing profile on mount
  useEffect(() => {
    if (!isNew && childParam) {
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

            const matchType = raw.match(/- Type:\s*(.+)/i)
            if (matchType) setDyslexiaType(matchType[1].trim().toLowerCase())

            const matchCo = raw.match(/- Co-occurring:\s*(.+)/i)
            if (matchCo) {
              const list = matchCo[1].split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean)
              setCoOccurring(list)
            }

            const matchInput = raw.match(/- Input mode:\s*(.+)/i)
            if (matchInput) setInputMode(matchInput[1].trim().toLowerCase())

            const matchDisplay = raw.match(/- Display mode:\s*(.+)/i)
            if (matchDisplay) setDisplayMode(matchDisplay[1].trim().toLowerCase())

            const matchOverlay = raw.match(/- Colour overlay:\s*(.+)/i)
            if (matchOverlay) setColourOverlay(matchOverlay[1].trim().toLowerCase())

            const matchLevel = raw.match(/- Reading level:\s*(\d+)/i)
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
  }, [childParam, isNew])

  // Live preview of font & overlay choices on profile screen
  useEffect(() => {
    const classes: string[] = []
    if (displayMode === 'opendyslexic') classes.push('opendyslexic')
    if (colourOverlay && colourOverlay !== 'none') classes.push(`overlay-${colourOverlay}`)
    document.body.className = classes.join(' ')

    return () => {
      document.body.className = ''
    }
  }, [displayMode, colourOverlay])

  const toggleCoOccurring = (condition: string) => {
    setCoOccurring(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    )
  }

  const handleSelectDyslexiaType = (typeId: string) => {
    setDyslexiaType(typeId)
    if (typeId === 'non_dyslexic') {
      setDisplayMode('standard')
      setColourOverlay('none')
      setInputMode('type')
      if (!hasADHD) {
        setSessionLength(10)
        setBreakAfter(10)
      }
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const activeId = isNew
      ? (fullName.split(' ')[0] || 'child').toLowerCase().replace(/[^a-z0-9]/g, '')
      : childParam.toLowerCase()

    const approach = dyslexiaType === 'non_dyslexic' ? 'standard' : (inputMode === 'voice' ? 'audio_first' : 'phonics')
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
- Reading level: ${readingLevel}
- Mastered words: cat, dog, run, play, help
- Struggling with: through, knight, enough
- Pattern difficulty: silent letters
`

    try {
      await saveProfile(activeId, skillContent)
      localStorage.setItem(`wb_profile_${activeId}`, JSON.stringify({
        id: activeId,
        fullName,
        parentEmail,
        age,
        schoolYear,
        dyslexiaType,
        coOccurring,
        readingLevel,
        inputMode,
        displayMode,
        colourOverlay,
        candyGoal: hasADHD ? 5 : candyGoal,
        sessionLength: hasADHD ? 5 : sessionLength,
        breakAfter: hasADHD ? 5 : breakAfter,
      }))
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
    <div suppressHydrationWarning style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem 1.5rem', minHeight: '100vh', maxWidth: 640, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <button
          onClick={() => {
            if (document.cookie.includes('wb_teacher_session')) {
              router.push('/teacher/dashboard')
            } else {
              router.push('/')
            }
          }}
          aria-label="Back to dashboard or home"
          style={{
            background: 'var(--panel)', border: '1px solid var(--border)',
            color: 'var(--white)', padding: '8px 16px', borderRadius: 20,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--white)' }}>
          {isNew ? 'New Child Profile' : `Edit ${fullName.split(' ')[0] || 'Profile'}`}
        </h1>
        <div style={{ width: 70 }} />
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Section 1: Identity */}
        <section style={{ background: 'var(--panel)', padding: '1.5rem', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--grey)', fontWeight: 700, marginBottom: '1rem' }}>
            SECTION 1: IDENTITY
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 6 }}>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Emma Clarke"
                style={{
                  width: '100%', padding: '12px 14px', background: 'var(--surface)',
                  border: '1px solid var(--border2)', borderRadius: 10,
                  color: 'var(--white)', fontSize: 15,
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 6 }}>Parent's Email Address (For Progress Reports)</label>
              <input
                type="email"
                value={parentEmail}
                onChange={e => setParentEmail(e.target.value)}
                placeholder="e.g. parent@example.com"
                style={{
                  width: '100%', padding: '12px 14px', background: 'var(--surface)',
                  border: '1px solid var(--border2)', borderRadius: 10,
                  color: 'var(--white)', fontSize: 15,
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 6 }}>Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  placeholder="e.g. 9"
                  style={{
                    width: '100%', padding: '12px 14px', background: 'var(--surface)',
                    border: '1px solid var(--border2)', borderRadius: 10,
                    color: 'var(--white)', fontSize: 15,
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 6 }}>School Year</label>
                <input
                  type="text"
                  value={schoolYear}
                  onChange={e => setSchoolYear(e.target.value)}
                  placeholder="e.g. Year 4"
                  style={{
                    width: '100%', padding: '12px 14px', background: 'var(--surface)',
                    border: '1px solid var(--border2)', borderRadius: 10,
                    color: 'var(--white)', fontSize: 15,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Dyslexia type (pick one) */}
        <section style={{ background: 'var(--panel)', padding: '1.5rem', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--grey)', fontWeight: 700, marginBottom: '1rem' }}>
            SECTION 2: DYSLEXIA TYPE (PICK ONE)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { id: 'non_dyslexic', name: 'Non-dyslexic (General)', desc: 'Standard reader — normal font, pacing & display without accommodations' },
              { id: 'phonological', name: 'Phonological', desc: 'Difficulty connecting letters to sounds' },
              { id: 'surface',      name: 'Surface',      desc: 'Difficulty recognising whole words' },
              { id: 'visual',       name: 'Visual/spatial', desc: 'Letters appear to move or flip' },
              { id: 'double',       name: 'Double deficit', desc: 'Speed and sound processing both affected' },
              { id: 'attentional',  name: 'Attentional', desc: 'Letters swap between words' },
              { id: 'unknown',      name: 'Not sure yet', desc: 'Agent will assess during session' },
            ].map(type => (
              <div
                key={type.id}
                onClick={() => handleSelectDyslexiaType(type.id)}
                style={{
                  padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                  border: `${dyslexiaType === type.id ? '2px' : '1px'} solid ${dyslexiaType === type.id ? 'var(--bloom)' : 'var(--border)'}`,
                  background: dyslexiaType === type.id ? 'var(--bloom-bg)' : 'var(--surface)',
                  transition: 'all 0.2s ease',
                  gridColumn: type.id === 'non_dyslexic' ? '1 / -1' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: dyslexiaType === type.id ? 'var(--bloom-text)' : 'var(--white)' }}>
                    {type.id === 'non_dyslexic' ? '🌱 ' + type.name : type.name}
                  </div>
                  {dyslexiaType === type.id && (
                    <span style={{ color: 'var(--bloom-text)', fontWeight: 800 }}>✓</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--grey)', marginTop: 4, lineHeight: 1.3 }}>
                  {type.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Non-dyslexic Banner */}
          {dyslexiaType === 'non_dyslexic' && (
            <div style={{
              marginTop: 14,
              background: 'rgba(16,185,129,0.12)', border: '1.5px solid rgba(16,185,129,0.4)',
              borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#34D399',
              lineHeight: 1.5, fontWeight: 500, display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <span style={{ fontSize: 20 }}>🌱</span>
              <div>
                <strong style={{ color: '#fff', fontSize: 14 }}>Standard / Non-dyslexic Reading Mode Active</strong>
                <div style={{ color: '#A7F3D0', marginTop: 3 }}>
                  WordBloom operates in standard mode: crisp typography, exact spelling assessment, natural pacing, and no colour overlays.
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Section 3: Co-occurring conditions (pick multiple) */}
        <section style={{ background: 'var(--panel)', padding: '1.5rem', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--grey)', fontWeight: 700, marginBottom: '1rem' }}>
            SECTION 3: CO-OCCURRING CONDITIONS (PICK MULTIPLE)
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: '1rem' }}>
            {['adhd', 'dyspraxia', 'autism', 'dyscalculia'].map(cond => {
              const active = coOccurring.includes(cond)
              return (
                <button
                  key={cond}
                  onClick={() => toggleCoOccurring(cond)}
                  style={{
                    padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                    border: `${active ? '2px' : '1px'} solid ${active ? 'var(--bloom)' : 'var(--border2)'}`,
                    background: active ? 'var(--bloom-bg)' : 'var(--surface)',
                    color: active ? 'var(--bloom-text)' : 'var(--white)', cursor: 'pointer',
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
              borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#FBBF24',
              lineHeight: 1.4, fontWeight: 500, marginBottom: hasAutism ? 10 : 0
            }}>
              ⚠️ ADHD detected — session auto-set to 5 min, break every 5 words, encouragement style set to specific (factual not vague)
            </div>
          )}

          {hasAutism && (
            <div style={{
              background: 'rgba(129,140,248,0.12)', border: '1.5px solid rgba(129,140,248,0.4)',
              borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#C7D2FE',
              lineHeight: 1.4, fontWeight: 500
            }}>
              💡 Autism flag — encouragement will use specific facts only. No sudden difficulty changes.
            </div>
          )}
        </section>

        {/* Section 4: Reading level (pick one) */}
        <section style={{ background: 'var(--panel)', padding: '1.5rem', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--grey)', fontWeight: 700, marginBottom: '1rem' }}>
            SECTION 4: READING LEVEL (PICK ONE)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { lvl: 1, name: 'Stage 1', desc: 'Simple CVC words' },
              { lvl: 2, name: 'Stage 2', desc: 'Digraphs & blends' },
              { lvl: 3, name: 'Stage 3', desc: 'Silent letters' },
              { lvl: 4, name: 'Stage 4', desc: 'Multisyllabic' },
            ].map(item => (
              <button
                key={item.lvl}
                onClick={() => setReadingLevel(item.lvl)}
                style={{
                  padding: '10px 6px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                  border: `${readingLevel === item.lvl ? '2px' : '1px'} solid ${readingLevel === item.lvl ? 'var(--bloom)' : 'var(--border)'}`,
                  background: readingLevel === item.lvl ? 'var(--bloom-bg)' : 'var(--surface)',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: readingLevel === item.lvl ? 'var(--bloom-text)' : 'var(--white)' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--grey)', marginTop: 4, lineHeight: 1.2 }}>
                  {item.desc}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Section 5: How they answer (pick one) */}
        <section style={{ background: 'var(--panel)', padding: '1.5rem', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--grey)', fontWeight: 700, marginBottom: '1rem' }}>
            SECTION 5: HOW THEY ANSWER (PICK ONE)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { id: 'type',  icon: '⌨️', name: 'Type it', desc: 'Keyboard input' },
              { id: 'voice', icon: '🎤', name: 'Say it', desc: 'Voice / speech input' },
              { id: 'tap',   icon: '🔲', name: 'Tap letters', desc: 'Letter tile selection' },
            ].map(mode => (
              <div
                key={mode.id}
                onClick={() => setInputMode(mode.id)}
                style={{
                  padding: '14px 10px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                  border: `${inputMode === mode.id ? '2px' : '1px'} solid ${inputMode === mode.id ? 'var(--bloom)' : 'var(--border)'}`,
                  background: inputMode === mode.id ? 'var(--bloom-bg)' : 'var(--surface)',
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>{mode.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: inputMode === mode.id ? 'var(--bloom-text)' : 'var(--white)' }}>
                  {mode.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--grey)', marginTop: 2 }}>{mode.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6: Display mode (pick one) */}
        <section style={{ background: 'var(--panel)', padding: '1.5rem', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--grey)', fontWeight: 700, marginBottom: '1rem' }}>
            SECTION 6: DISPLAY MODE (PICK ONE)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { id: 'standard',     name: 'Standard', desc: 'Default font and spacing' },
              { id: 'opendyslexic', name: 'OpenDyslexic', desc: 'Weighted letters reduce flipping' },
              { id: 'spotlight',    name: 'Spotlight', desc: 'One word at a time, rest masked' },
            ].map(disp => (
              <div
                key={disp.id}
                onClick={() => setDisplayMode(disp.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                  border: `${displayMode === disp.id ? '2px' : '1px'} solid ${displayMode === disp.id ? 'var(--bloom)' : 'var(--border)'}`,
                  background: displayMode === disp.id ? 'var(--bloom-bg)' : 'var(--surface)',
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: displayMode === disp.id ? 'var(--bloom-text)' : 'var(--white)' }}>
                    {disp.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--grey)', marginTop: 2 }}>{disp.desc}</div>
                </div>
                {displayMode === disp.id && <span style={{ color: 'var(--bloom-text)', fontWeight: 'bold' }}>✓</span>}
              </div>
            ))}
          </div>
        </section>

        {/* Section 7: Colour overlay (pick one) */}
        <section style={{ background: 'var(--panel)', padding: '1.5rem', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--grey)', fontWeight: 700, marginBottom: 6 }}>
            SECTION 7: COLOUR OVERLAY
          </div>
          <div style={{ fontSize: 12, color: 'var(--grey)', marginBottom: '1rem' }}>Child picks what feels right</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {[
              { id: 'none',   label: 'None',   color: 'var(--surface)', border: 'var(--border2)' },
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
                    padding: '8px 12px', borderRadius: 14,
                    background: isSelected ? 'var(--surface)' : 'transparent',
                    border: isSelected ? '1.5px solid var(--bloom)' : '1.5px solid transparent',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: 42, height: 42, borderRadius: '50%',
                      background: item.color,
                      border: `2.5px solid ${isSelected ? 'var(--bloom)' : item.border}`,
                      boxShadow: isSelected ? '0 0 12px rgba(16,185,129,0.5)' : '0 2px 6px rgba(0,0,0,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                      color: item.id === 'none' ? 'var(--white)' : '#0F172A',
                      fontWeight: 'bold',
                      transition: 'transform 0.15s ease',
                      transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    {isSelected ? '✓' : ''}
                  </div>
                  <span style={{
                    fontSize: 12,
                    color: isSelected ? 'var(--bloom-text)' : 'var(--white)',
                    fontWeight: isSelected ? 700 : 500
                  }}>
                    {item.label}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Section 8: Session settings */}
        <section style={{ background: 'var(--panel)', padding: '1.5rem', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--grey)', fontWeight: 700, marginBottom: '1rem' }}>
            SECTION 8: SESSION SETTINGS
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Candy Goal */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 6 }}>
                <span>🎯 Goal: {candyGoal} candies 🍬</span>
                {hasADHD && <span style={{ color: '#FBBF24' }}>(ADHD auto-set to 5)</span>}
              </div>
              <input
                type="range" min={3} max={15} value={candyGoal}
                disabled={hasADHD}
                onChange={e => setCandyGoal(parseInt(e.target.value))}
                style={{ width: '100%', opacity: hasADHD ? 0.5 : 1 }}
              />
              <div style={{ fontSize: 11, color: 'var(--grey)', marginTop: 4 }}>
                Session concludes with celebration once the child earns {candyGoal} candies — zero timer pressure!
              </div>
            </div>

            {/* Break Frequency */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 6 }}>
                <span>⏸️ Break after: {breakAfter} words</span>
                {hasADHD && <span style={{ color: '#FBBF24' }}>(ADHD auto-set)</span>}
              </div>
              <input
                type="range" min={3} max={15} value={breakAfter}
                disabled={hasADHD}
                onChange={e => setBreakAfter(parseInt(e.target.value))}
                style={{ width: '100%', opacity: hasADHD ? 0.5 : 1 }}
              />
              <div style={{ fontSize: 11, color: 'var(--grey)', marginTop: 4 }}>
                Offers a gentle 30-second stretch & eye rest break after every {breakAfter} words.
              </div>
            </div>

            {/* Safety Duration Ceiling */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 6 }}>
                <span>⏱️ Safety duration ceiling: {sessionLength} min</span>
                {hasADHD && <span style={{ color: '#FBBF24' }}>(ADHD auto-set to 5 min)</span>}
              </div>
              <input
                type="range" min={3} max={20} value={sessionLength}
                disabled={hasADHD}
                onChange={e => setSessionLength(parseInt(e.target.value))}
                style={{ width: '100%', opacity: hasADHD ? 0.5 : 1 }}
              />
              <div style={{ fontSize: 11, color: 'var(--grey)', marginTop: 4 }}>
                Safety ceiling so session closes gracefully if left unattended.
              </div>
            </div>

            <div style={{ background: 'var(--surface)', padding: '10px 14px', borderRadius: 10, fontSize: 12, color: 'var(--grey)', border: '1px solid var(--border)' }}>
              ℹ️ <strong style={{ color: 'var(--white)' }}>No Timer Pressure:</strong> Countdown clocks are never shown to the child. Sessions end pleasantly when they earn their candy goal!
            </div>
          </div>
        </section>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || !fullName.trim()}
          style={{
            width: '100%', minHeight: 54, padding: '14px 0',
            background: 'var(--bloom)', color: '#fff', fontSize: 17, fontWeight: 700,
            borderRadius: 50, border: 'none', cursor: saving ? 'wait' : 'pointer',
            boxShadow: '0 8px 20px rgba(16,185,129,0.3)',
            opacity: saving || !fullName.trim() ? 0.6 : 1,
            marginBottom: '3rem',
          }}
        >
          {saving ? 'Saving profile...' : `Save ${fullName.split(' ')[0] || 'Child'}'s Profile`}
        </button>

      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div style={{ color: 'var(--grey)', textAlign: 'center', padding: '4rem' }}>Loading profile editor...</div>}>
      <ProfileForm />
    </Suspense>
  )
}
