'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TeacherBackground from '../../../../../components/TeacherBackground'

interface WrongWord {
  target: string
  child_answer: string
  is_correct: boolean
  sentence?: string
}

interface ChildProfile {
  id: string
  child_id: string
  name: string
  child_name: string
  dyslexia_type: string
  font: string
  display_mode: string
  colour_overlay: string
  input_mode: string
  reading_level: number
  age: number
  school_year: string
}

type DyslexiaType = 'visual_spatial' | 'phonological' | 'surface' | 'attentional' | 'double_deficit'

const DYSLEXIA_TYPES: { id: DyslexiaType; label: string; desc: string }[] = [
  { id: 'visual_spatial', label: 'Visual / Spatial', desc: 'Letters appear to flip (b↔d) or rotate' },
  { id: 'phonological',   label: 'Phonological',     desc: 'Sound-to-letter mapping vibration' },
  { id: 'surface',        label: 'Surface',          desc: 'Whole-word visual blur & shape unrecognition' },
  { id: 'attentional',    label: 'Attentional',      desc: 'Letters drift between word boundaries' },
  { id: 'double_deficit', label: 'Double Deficit',   desc: 'Letters flip and shake simultaneously' },
]

const KNOWN_CHUNKS: Record<string, string[]> = {
  dog: ['d', 'og'],
  bog: ['b', 'og'],
  knight: ['kn', 'igh', 't'],
  nite: ['n', 'i', 'te'],
  wrote: ['wr', 'o', 'te'],
  rote: ['r', 'o', 'te'],
  through: ['thr', 'ough'],
  gnome: ['gn', 'ome'],
  light: ['l', 'igh', 't'],
  bright: ['br', 'igh', 't'],
  cat: ['c', 'at'],
  ship: ['sh', 'ip'],
  phone: ['ph', 'o', 'ne'],
  chair: ['ch', 'air'],
  clock: ['cl', 'ock'],
  beach: ['b', 'ea', 'ch'],
  train: ['tr', 'ain'],
  spoon: ['sp', 'oon'],
  house: ['h', 'ou', 'se'],
}

const CONTEXT_SENTENCES: Record<string, string> = {
  dog: 'The dog ran happily across the green lawn.',
  knight: 'The brave knight raised a shining silver shield.',
  wrote: 'She wrote a secret message in her journal.',
  through: 'The winding path led through the silent pine forest.',
  gnome: 'A cheerful gnome stood near the garden path.',
  cat: 'The friendly cat purred softly in the morning sun.',
  ship: 'A wooden ship sailed across the calm blue bay.',
  light: 'A golden light guided their way home.',
  phone: 'The phone chimed with an exciting notification.',
  chair: 'He sat in the comfortable armchair to read.',
}

function getPhonicsChunks(word: string): string[] {
  const lower = word.toLowerCase().trim()
  if (KNOWN_CHUNKS[lower]) return KNOWN_CHUNKS[lower]

  const digraphs = ['igh', 'ough', 'thr', 'sh', 'ch', 'th', 'ph', 'gh', 'ck', 'ng', 'ai', 'ea', 'oo', 'ou', 'kn', 'wr']
  const result: string[] = []
  let i = 0
  while (i < word.length) {
    let matched = false
    for (const dg of digraphs) {
      if (word.slice(i).toLowerCase().startsWith(dg)) {
        result.push(word.slice(i, i + dg.length))
        i += dg.length
        matched = true
        break
      }
    }
    if (!matched) {
      result.push(word[i])
      i++
    }
  }

  if (result.length > 3 && word.length <= 6) {
    const mid = Math.ceil(result.length / 2)
    return [result.slice(0, mid).join(''), result.slice(mid).join('')]
  }
  return result
}

function normalizeDyslexiaType(raw: string): DyslexiaType {
  const s = (raw || '').toLowerCase().trim().replace(/[- /]/g, '_')
  if (s.includes('visual') || s.includes('spatial')) return 'visual_spatial'
  if (s.includes('phono')) return 'phonological'
  if (s.includes('surface')) return 'surface'
  if (s.includes('attent')) return 'attentional'
  if (s.includes('double')) return 'double_deficit'
  return 'phonological'
}

export default function DyslexiaMirrorPage({
  params,
}: {
  params: Promise<{ child_id: string }>
}) {
  const resolvedParams = use(params)
  const childId = (resolvedParams?.child_id || 'emma').toLowerCase().trim()
  const router = useRouter()

  const DEFAULT_INITIAL_WORDS: Record<string, WrongWord[]> = {
    emma: [
      { target: 'through', child_answer: 'thru', is_correct: false, sentence: 'The rabbit ran through the garden fence.' },
      { target: 'knight',  child_answer: 'nite', is_correct: false, sentence: 'The brave knight rode to the castle.' },
      { target: 'dog',     child_answer: 'bog',  is_correct: false, sentence: 'The dog ran across the grass.' },
    ],
    liam: [
      { target: 'dog',   child_answer: 'bog',  is_correct: false, sentence: 'The dog ran across the grass.' },
      { target: 'wrote', child_answer: 'rote', is_correct: false, sentence: 'She wrote a letter to her friend.' },
      { target: 'ship',  child_answer: 'snip', is_correct: false, sentence: 'The big ship sailed across the ocean.' },
    ],
    james: [
      { target: 'dog',   child_answer: 'bog',   is_correct: false, sentence: 'The dog ran across the grass.' },
      { target: 'beach', child_answer: 'deach', is_correct: false, sentence: 'We built a sandcastle on the sunny beach.' },
      { target: 'chair', child_answer: 'cahir', is_correct: false, sentence: 'Sit down on the wooden chair.' },
    ],
    sofia: [
      { target: 'gnome',   child_answer: 'nome', is_correct: false, sentence: 'A friendly garden gnome stood by the flowers.' },
      { target: 'through', child_answer: 'thru', is_correct: false, sentence: 'They walked through the bright forest.' },
      { target: 'light',   child_answer: 'lite', is_correct: false, sentence: 'The morning light shone in the window.' },
    ],
  }

  const initialWords = DEFAULT_INITIAL_WORDS[childId] || DEFAULT_INITIAL_WORDS.emma

  const [profile, setProfile] = useState<ChildProfile | null>(() => ({
    id: childId,
    child_id: childId,
    name: childId === 'emma' ? 'Emma Clarke' : (childId.charAt(0).toUpperCase() + childId.slice(1)),
    child_name: childId === 'emma' ? 'Emma Clarke' : (childId.charAt(0).toUpperCase() + childId.slice(1)),
    dyslexia_type: childId === 'james' ? 'visual_spatial' : childId === 'liam' || childId === 'sofia' ? 'surface' : 'phonological',
    font: 'opendyslexic',
    display_mode: 'opendyslexic',
    colour_overlay: childId === 'emma' || childId === 'james' ? 'yellow' : 'none',
    input_mode: childId === 'emma' ? 'voice' : 'tap',
    reading_level: childId === 'sofia' ? 4 : childId === 'emma' ? 3 : 2,
    age: 9,
    school_year: 'Year 4',
  }))
  const [selectedType, setSelectedType] = useState<DyslexiaType>(() => {
    if (childId === 'james') return 'visual_spatial'
    if (childId === 'liam' || childId === 'sofia') return 'surface'
    return 'phonological'
  })
  const [animationOn, setAnimationOn]                 = useState<boolean>(true)
  const [wrongWords, setWrongWords]                   = useState<WrongWord[]>(initialWords)
  const [activeWordIndex, setActiveWordIndex]         = useState<number>(0)
  const [loading, setLoading]                         = useState<boolean>(false)
  const [savingProfile, setSavingProfile]             = useState<boolean>(false)
  const [toastMessage, setToastMessage]               = useState<string | null>(null)
  const [previewNonDyslexic, setPreviewNonDyslexic]   = useState<boolean>(false)

  // Load Child Profile & Wrong Answers
  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        setLoading(true)

        // 1. Fetch Child Profile
        let loadedProfile: ChildProfile | null = null
        try {
          const res = await fetch(`/api/children/${childId}`, {
            signal: AbortSignal.timeout(2500),
          })
          if (res.ok) {
            loadedProfile = await res.json()
          }
        } catch (e) {
          console.warn('Could not load profile via API, checking localStorage:', e)
        }

        if (!loadedProfile && typeof window !== 'undefined') {
          const local = localStorage.getItem(`wb_profile_${childId}`)
          if (local) {
            try {
              const p = JSON.parse(local)
              loadedProfile = {
                id: childId,
                child_id: childId,
                name: p.fullName || p.name || childId.toUpperCase(),
                child_name: p.fullName || p.name || childId.toUpperCase(),
                dyslexia_type: p.dyslexiaType || 'phonological',
                font: p.displayMode || 'opendyslexic',
                display_mode: p.displayMode || 'opendyslexic',
                colour_overlay: p.colourOverlay || 'yellow',
                input_mode: p.inputMode || 'voice',
                reading_level: p.readingLevel || 3,
                age: p.age || 9,
                school_year: p.schoolYear || 'Year 4',
              }
            } catch (e) {}
          }
        }

        if (loadedProfile && isMounted) {
          setProfile(loadedProfile)
          setSelectedType(normalizeDyslexiaType(loadedProfile.dyslexia_type))
        }

        // 2. Fetch Latest Session Words
        let sessionWords: WrongWord[] = []
        try {
          const res = await fetch(`/api/children/${childId}/sessions/latest`, {
            signal: AbortSignal.timeout(2500),
          })
          if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data.words)) {
              sessionWords = data.words
            }
          }
        } catch (e) {
          console.warn('Could not load sessions via API, checking localStorage:', e)
        }

        // Check localStorage fallback for recent session words if API returned empty
        if (sessionWords.length === 0 && typeof window !== 'undefined') {
          const savedWordsRaw = localStorage.getItem(`wb_session_words_${childId}`)
          if (savedWordsRaw) {
            try {
              const parsed = JSON.parse(savedWordsRaw)
              if (Array.isArray(parsed)) sessionWords = parsed
            } catch (e) {}
          }

          if (sessionWords.length === 0) {
            const repRaw = localStorage.getItem(`wb_report_${childId}`)
            if (repRaw) {
              try {
                const rep = JSON.parse(repRaw)
                if (Array.isArray(rep.words)) {
                  sessionWords = rep.words
                } else if (Array.isArray(rep.words_to_revisit) && rep.words_to_revisit.length > 0) {
                  const attemptMap: Record<string, string> = {
                    dog: 'bog',
                    knight: 'nite',
                    wrote: 'rote',
                    through: 'thru',
                    gnome: 'nome',
                    light: 'lite',
                  }
                  sessionWords = rep.words_to_revisit.map((w: string) => ({
                    target: w,
                    child_answer: attemptMap[w.toLowerCase()] || `${w.slice(1)}e`,
                    is_correct: false,
                    sentence: CONTEXT_SENTENCES[w.toLowerCase()] || `The word "${w}" was shown in the reading exercise.`,
                  }))
                }
              } catch (e) {}
            }
          }
        }

        // Filter to wrong answers safely
        let filteredWrong = sessionWords.filter(w => w && typeof w === 'object' && w.target && !w.is_correct)
        if (filteredWrong.length === 0) {
          filteredWrong = DEFAULT_INITIAL_WORDS[childId] || DEFAULT_INITIAL_WORDS.emma
        }

        if (isMounted) {
          setWrongWords(filteredWrong)
          setActiveWordIndex(0)
        }
      } catch (err) {
        console.warn('Error loading dyslexia mirror data:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()
    return () => { isMounted = false }
  }, [childId])

  const childName = profile?.name || profile?.child_name || (childId.charAt(0).toUpperCase() + childId.slice(1))
  const firstName = childName.split(' ')[0]
  const activeWord = wrongWords[activeWordIndex] || wrongWords[0] || initialWords[0]
  const rawType = (profile?.dyslexia_type || '').toLowerCase().trim()
  const isNonDyslexic = rawType.includes('non') || rawType === 'none' || rawType === 'general' || rawType === 'standard' || rawType === 'normal'

  // Recommendations per dyslexia type
  const getRecommendations = (type: DyslexiaType) => {
    switch (type) {
      case 'visual_spatial':
        return {
          bullets: [
            '✦ Switch font → OpenDyslexic (weighted letter bases prevent rotation)',
            '✦ Add colour overlay → Yellow (reduces visual glare and ocular jitter)',
            '✦ Consider input mode → Tap letters (removes fine-motor keyboard confusion)',
          ],
          patchData: {
            display_mode: 'opendyslexic',
            colour_overlay: 'yellow',
            input_mode: 'tap',
          },
        }
      case 'phonological':
        return {
          bullets: [
            '✦ Enable phonics chunking (breaks words into phoneme sound units)',
            '✦ Consider input mode → Voice (reinforces spoken phoneme recognition)',
            '✦ Add colour overlay → Blue (soothes contrast and aids auditory-visual pacing)',
          ],
          patchData: {
            approach: 'phonics',
            input_mode: 'voice',
            colour_overlay: 'blue',
            display_mode: 'opendyslexic',
          },
        }
      case 'surface':
        return {
          bullets: [
            '✦ Switch font → OpenDyslexic (strengthens distinct word-shape silhouettes)',
            '✦ Enable spotlight mode (masks surrounding text to isolate the target word)',
            '✦ Add colour overlay → Green (enhances letter tracking clarity)',
          ],
          patchData: {
            display_mode: 'spotlight',
            colour_overlay: 'green',
          },
        }
      case 'attentional':
        return {
          bullets: [
            '✦ Enable spotlight mode (dims peripheral words to prevent letter drifting)',
            '✦ Add colour overlay → Yellow (high focus anchor)',
            '✦ Reduce words shown per screen to 1 (strictly isolated focus)',
          ],
          patchData: {
            display_mode: 'spotlight',
            colour_overlay: 'yellow',
            session_length: 5,
            break_after: 5,
          },
        }
      case 'double_deficit':
        return {
          bullets: [
            '✦ All adaptations enabled (OpenDyslexic + Blue overlay + Phonics chunking)',
            '✦ Slow session pacing (extended response window removes time stress)',
            '✦ Increase break frequency (short 30s rest every 5 words to reset focus)',
          ],
          patchData: {
            display_mode: 'opendyslexic',
            colour_overlay: 'blue',
            session_length: 5,
            break_after: 5,
          },
        }
    }
  }

  const currentRecs = getRecommendations(selectedType)

  // Apply Recommendations to Profile
  const handleApplyRecommendations = async () => {
    setSavingProfile(true)
    try {
      const res = await fetch(`/api/children/${childId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentRecs.patchData),
      })

      if (res.ok) {
        // Update local state and localStorage
        if (profile) {
          const updated = { ...profile, ...currentRecs.patchData }
          setProfile(updated)
          if (typeof window !== 'undefined') {
            localStorage.setItem(`wb_profile_${childId}`, JSON.stringify(updated))
          }
        }
        setToastMessage(`${firstName}'s profile updated!`)
        setTimeout(() => setToastMessage(null), 4000)
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (e) {
      // Offline fallback: save to localStorage directly
      if (profile && typeof window !== 'undefined') {
        const updated = { ...profile, ...currentRecs.patchData }
        setProfile(updated)
        localStorage.setItem(`wb_profile_${childId}`, JSON.stringify(updated))
        setToastMessage(`${firstName}'s profile updated!`)
        setTimeout(() => setToastMessage(null), 4000)
      }
    }
    setSavingProfile(false)
  }

  // Render left panel simulated letters
  const renderSimulatedWord = (word: string) => {
    const safeWord = word || ''
    const letters = safeWord.split('')

    if (selectedType === 'surface') {
      return (
        <span
          style={{
            display: 'inline-block',
            filter: 'blur(0.6px)',
            opacity: 0.72,
            transition: 'all 0.3s ease',
          }}
        >
          {safeWord}
        </span>
      )
    }

    const swapMap: Record<string, string> = {
      b: 'd', d: 'b',
      p: 'q', q: 'p',
      n: 'u', u: 'n',
      m: 'w', w: 'm',
      B: 'D', D: 'B',
      P: 'Q', Q: 'P',
    }

    return (
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        {letters.map((originalChar, i) => {
          let displayChar = originalChar
          let animClass = ''
          let animDelay = '0s'
          let transformStyle: React.CSSProperties = {}

          if (selectedType === 'visual_spatial') {
            displayChar = swapMap[originalChar] || originalChar
            animClass = animationOn ? 'animate-mirror-wobble' : ''
            animDelay = `${(i * 0.22) % 1.5}s`
          } else if (selectedType === 'phonological') {
            animClass = animationOn ? 'animate-mirror-shake' : ''
            animDelay = `${(i * 0.15) % 0.8}s`
          } else if (selectedType === 'attentional') {
            animClass = animationOn ? 'animate-mirror-drift' : ''
            animDelay = `${(i * 0.32) % 1.8}s`
          } else if (selectedType === 'double_deficit') {
            displayChar = swapMap[originalChar] || originalChar
            animClass = animationOn ? 'animate-mirror-double' : ''
            animDelay = `${(i * 0.25) % 1.6}s`
          }

          return (
            <span
              key={`${originalChar}-${i}`}
              className={animClass}
              style={{
                display: 'inline-block',
                animationDelay: animDelay,
                transformOrigin: '50% 50%',
                ...transformStyle,
              }}
            >
              {displayChar}
            </span>
          )
        })}
      </span>
    )
  }

  // Right panel styling tokens
  const getRightPanelOverlayColor = (type: DyslexiaType) => {
    switch (type) {
      case 'visual_spatial': return 'rgba(254, 243, 199, 0.12)' // Yellow
      case 'phonological':   return 'rgba(219, 234, 254, 0.10)' // Blue
      case 'surface':        return 'rgba(209, 250, 229, 0.10)' // Green
      case 'attentional':    return 'rgba(254, 243, 199, 0.12)' // Yellow
      case 'double_deficit': return 'rgba(219, 234, 254, 0.12)' // Blue
    }
  }

  // Right panel chunking
  const targetWord = activeWord?.target || 'through'
  const targetLower = targetWord.toLowerCase().trim()
  const phonicsChunks = targetWord ? getPhonicsChunks(targetWord) : ['thr', 'ough']
  const chunkColors = [
    { bg: 'rgba(167, 139, 250, 0.25)', border: 'rgba(167, 139, 250, 0.5)', text: '#E9D5FF' }, // Purple
    { bg: 'rgba(96, 165, 250, 0.20)',  border: 'rgba(96, 165, 250, 0.45)', text: '#BFDBFE' }, // Blue
    { bg: 'rgba(52, 211, 153, 0.20)',  border: 'rgba(52, 211, 153, 0.45)', text: '#A7F3D0' }, // Green
  ]

  const activeSentence = activeWord?.sentence || CONTEXT_SENTENCES[targetLower] || `The word "${targetWord}" appeared in the reading practice exercise.`

  return (
    <main
      style={{
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: '#06080F',
        padding: '2rem 1.5rem',
        overflow: 'hidden',
        color: '#F9FAFB',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <TeacherBackground />

      <div style={{ position: 'relative', zIndex: 1 }}>
      <style>{`
        @keyframes wobble {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-8deg) scaleX(-1); }
          75% { transform: rotate(5deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          30% { transform: translateX(-2px); }
          70% { transform: translateX(2px); }
        }
        @keyframes drift {
          0%, 100% { transform: translateX(0); }
          40% { transform: translateX(4px); }
          70% { transform: translateX(-3px); }
        }
        @keyframes doubleDeficit {
          0%, 100% { transform: rotate(0deg) translateX(0) scaleX(1); }
          25% { transform: rotate(-8deg) translateX(-2px) scaleX(-1); }
          50% { transform: rotate(2deg) translateX(2px) scaleX(1); }
          75% { transform: rotate(5deg) translateX(-1px) scaleX(-1); }
        }
        .animate-mirror-wobble {
          animation: wobble 2.8s ease-in-out infinite;
        }
        .animate-mirror-shake {
          animation: shake 1.2s ease-in-out infinite;
        }
        .animate-mirror-drift {
          animation: drift 2.4s ease-in-out infinite;
        }
        .animate-mirror-double {
          animation: doubleDeficit 2.6s ease-in-out infinite;
        }
      `}</style>

      {/* Floating Success Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 100,
          background: '#10B981', color: '#06080F',
          padding: '14px 22px', borderRadius: 12,
          fontWeight: 700, fontSize: 15,
          boxShadow: '0 10px 25px rgba(16,185,129,0.4)',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'fadeIn 0.3s ease',
        }}>
          <span>✅</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Breadcrumbs */}
      <div style={{ maxWidth: 1080, margin: '0 auto', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link
              href={`/teacher?child=${childId}`}
              style={{
                color: '#9CA3AF', textDecoration: 'none', fontSize: 13, fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', background: '#111827', border: '1px solid #1F2937', borderRadius: 8,
              }}
            >
              ← Back to Dashboard
            </Link>
            <span style={{ color: '#4B5563', fontSize: 13 }}>/</span>
            <span style={{ color: '#9CA3AF', fontSize: 13 }}>{childName}</span>
            <span style={{ color: '#4B5563', fontSize: 13 }}>/</span>
            <span style={{ color: '#10B981', fontSize: 13, fontWeight: 700 }}>Dyslexia Mirror</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              background: 'rgba(16,185,129,0.15)', color: '#34D399',
              border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20,
              padding: '4px 12px', fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>🔍</span> Teacher Insight Tool
            </span>
          </div>
        </div>

        {/* Title & Student Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#F9FAFB', letterSpacing: -0.5 }}>
              Dyslexia Mirror · {childName}
            </h1>
            <p style={{ color: '#9CA3AF', fontSize: 14, marginTop: 4 }}>
              Compare how {firstName}&apos;s dyslexia perceives words versus WordBloom&apos;s adaptive scaffolding.
            </p>
          </div>

          {/* Child Profile Tabs */}
          <div style={{ display: 'flex', gap: 6, background: '#111827', padding: 4, borderRadius: 12, border: '1px solid #1F2937' }}>
            <Link
              href={`/teacher/children/${childId}`}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                color: '#9CA3AF', textDecoration: 'none', transition: 'all 0.2s ease',
              }}
            >
              Overview
            </Link>
            <div
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.3)',
              }}
            >
              Mirror 🔍
            </div>
            <Link
              href={`/profile?child=${childId}`}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                color: '#9CA3AF', textDecoration: 'none', transition: 'all 0.2s ease',
              }}
            >
              Profile Settings ✏️
            </Link>
          </div>
        </div>

        {/* Non-dyslexic profile state vs Dyslexia Mirror Suite */}
        {isNonDyslexic && !previewNonDyslexic ? (
          <div style={{
            background: '#111827',
            border: '1.5px solid rgba(16,185,129,0.35)',
            borderRadius: 18,
            padding: '3.5rem 2rem',
            textAlign: 'center',
            maxWidth: 680,
            margin: '2rem auto',
            boxShadow: '0 12px 35px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem' }}>🌱</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#F9FAFB', marginBottom: '0.75rem' }}>
              {firstName} is configured in Standard Reading Mode
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: 15, maxWidth: 500, margin: '0 auto 2rem', lineHeight: 1.6 }}>
              The Dyslexia Mirror is a specialized insight tool for perceptual dyslexia differences (letter flipping, sound vibrations, or visual word drift). Because {firstName}&apos;s profile is <strong>Non-dyslexic (Standard Mode)</strong>, standard typography and natural pacing are used without perceptual dyslexia accommodations.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setPreviewNonDyslexic(true)}
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#06080F', padding: '12px 24px', borderRadius: 50,
                  fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
                }}
              >
                👁️ Preview Simulator Anyway
              </button>
              <Link
                href={`/teacher/children/${childId}`}
                style={{
                  background: '#1F2937', color: '#F9FAFB', border: '1px solid #374151', padding: '12px 24px', borderRadius: 50,
                  fontSize: 14, fontWeight: 600, textDecoration: 'none',
                }}
              >
                ← Back to {firstName}&apos;s Profile
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Top Controls Bar (Dyslexia Profile Selector + Animation Toggle) */}
            <div style={{
              background: '#111827', border: '1px solid #1F2937', borderRadius: 16,
              padding: '16px 20px', marginBottom: '1.75rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
            }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#6B7280', fontWeight: 600, marginBottom: 8 }}>
              Simulate Dyslexia Profile:
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DYSLEXIA_TYPES.map(t => {
                const isSelected = selectedType === t.id
                const isChildProfileDefault = profile && normalizeDyslexiaType(profile.dyslexia_type) === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedType(t.id)}
                    style={{
                      background: isSelected ? 'rgba(16,185,129,0.15)' : '#0B0F19',
                      border: `1.5px solid ${isSelected ? '#10B981' : '#1F2937'}`,
                      color: isSelected ? '#34D399' : '#D1D5DB',
                      padding: '8px 14px', borderRadius: 10,
                      fontSize: 13, fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer', transition: 'all 0.15s ease',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <span>{t.label}</span>
                    {isChildProfileDefault && (
                      <span style={{ fontSize: 10, background: '#10B981', color: '#06080F', padding: '1px 6px', borderRadius: 10, fontWeight: 800 }}>
                        Profile
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Animation Toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#6B7280', fontWeight: 600 }}>
              Perceptual Motion:
            </div>
            <button
              onClick={() => setAnimationOn(!animationOn)}
              style={{
                background: animationOn ? 'rgba(16,185,129,0.15)' : '#1F2937',
                border: `1.5px solid ${animationOn ? '#10B981' : '#374151'}`,
                color: animationOn ? '#34D399' : '#9CA3AF',
                padding: '6px 14px', borderRadius: 20,
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: animationOn ? '#10B981' : '#6B7280' }} />
              {animationOn ? 'Animation: ON' : 'Animation: OFF'}
            </button>
            <span style={{ fontSize: 11, color: '#6B7280' }}>
              Turn off animation if it causes discomfort
            </span>
          </div>
        </div>

        {/* Wrong Answer Words Selector */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#6B7280', fontWeight: 600 }}>
              Recent Session Wrong Answers ({wrongWords.length}):
            </div>
            {loading && (
              <span style={{ fontSize: 11, color: '#10B981', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span>🔄</span> Syncing latest session data...
              </span>
            )}
          </div>

          {wrongWords.length === 0 ? (
            /* Empty State: If no session exists yet */
            <div style={{
              background: '#111827', border: '1.5px dashed #374151', borderRadius: 16,
              padding: '2.5rem 2rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🌱</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#F9FAFB', marginBottom: 6 }}>
                No session data yet for {firstName}. Run a session first.
              </div>
              <p style={{ color: '#9CA3AF', fontSize: 14, maxWidth: 440, margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                When {firstName} attempts word exercises in WordBloom, any misidentified words will automatically appear here for interactive perceptual diagnosis.
              </p>
              <button
                onClick={() => router.push(`/teacher?child=${childId}`)}
                style={{
                  background: '#10B981', color: '#06080F', border: 'none',
                  padding: '12px 24px', borderRadius: 50, fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                }}
              >
                Launch Session for {firstName} 🚀
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {wrongWords.map((item, idx) => {
                const isSelected = idx === activeWordIndex
                return (
                  <button
                    key={`${item.target}-${idx}`}
                    onClick={() => setActiveWordIndex(idx)}
                    style={{
                      background: isSelected ? 'rgba(239, 68, 68, 0.12)' : '#111827',
                      border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? '#EF4444' : '#1F2937'}`,
                      padding: '10px 16px', borderRadius: 12,
                      cursor: 'pointer', textAlign: 'left',
                      boxShadow: isSelected ? '0 0 12px rgba(239,68,68,0.25)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>❌</span>
                      <strong style={{ fontSize: 16, color: '#F9FAFB' }}>{item.target}</strong>
                      <span style={{ color: '#9CA3AF', fontSize: 13 }}>→</span>
                      <span style={{ color: '#FCA5A5', fontSize: 13, fontWeight: 600 }}>
                        {firstName} wrote &quot;{item.child_answer}&quot;
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Two Side-by-Side Mirror Panels */}
        {wrongWords.length > 0 && activeWord && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 20,
            marginBottom: '2rem',
          }}>
            {/* LEFT PANEL: Without WordBloom */}
            <div style={{
              background: '#111827',
              border: '1.5px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 18,
              padding: '1.75rem',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <span style={{
                  background: 'rgba(239,68,68,0.15)', color: '#F87171',
                  border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20,
                  padding: '4px 12px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  ❌ Without WordBloom — What {firstName} sees
                </span>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                  {DYSLEXIA_TYPES.find(t => t.id === selectedType)?.label}
                </span>
              </div>

              {/* Large Simulated Word Box */}
              <div style={{
                background: '#0B0F19',
                border: '1px solid #1F2937',
                borderRadius: 14,
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                marginBottom: '1.25rem',
                minHeight: 140,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  fontSize: 54,
                  fontWeight: 700,
                  color: '#F9FAFB',
                  letterSpacing: selectedType === 'attentional' ? '0.12em' : 'normal',
                }}>
                  {renderSimulatedWord(activeWord.target)}
                </div>
              </div>

              {/* Sentence Context Box (Without WordBloom) */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid #1F2937',
                borderRadius: 12,
                padding: '14px 16px',
                marginBottom: '1.25rem',
              }}>
                <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, fontWeight: 600 }}>
                  Sentence Perception in Context:
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.6, color: '#E5E7EB' }}>
                  {activeSentence.split(' ').map((w, idx) => {
                    const isTarget = w.toLowerCase().replace(/[^a-z]/g, '') === activeWord.target.toLowerCase()
                    return (
                      <span key={idx} style={{ marginRight: 6, display: 'inline-block' }}>
                        {isTarget ? (
                          <strong style={{ color: '#F87171' }}>
                            {renderSimulatedWord(w)}
                          </strong>
                        ) : selectedType === 'attentional' && animationOn ? (
                          <span className="animate-mirror-drift" style={{ display: 'inline-block', animationDelay: `${(idx * 0.4) % 2}s` }}>
                            {w}
                          </span>
                        ) : (
                          w
                        )}
                      </span>
                    )
                  })}
                </div>
              </div>

              {/* Perceptual Explanation */}
              <div style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 12,
                padding: '12px 14px',
                fontSize: 13,
                color: '#FECACA',
                lineHeight: 1.5,
              }}>
                <strong>Perceptual Barrier:</strong>{' '}
                {selectedType === 'visual_spatial' && `Visual-spatial symmetry leads to letter flipping along the vertical axis (e.g., "${activeWord.target}" misperceived with flipped consonants).`}
                {selectedType === 'phonological' && `Auditory-visual mapping barrier causes phoneme hesitation; letter symbols vibrate during phonological decoding.`}
                {selectedType === 'surface' && `Whole-word orthographic memory is impaired; the overall word contour is visually indistinct and unrecognisable.`}
                {selectedType === 'attentional' && `Attentional visual crowding causes letters to migrate across whitespace boundaries between adjacent words.`}
                {selectedType === 'double_deficit' && `Combined rapid naming speed deficit and phonological barrier: letters flip, rotate, and vibrate simultaneously.`}
              </div>
            </div>

            {/* RIGHT PANEL: With WordBloom */}
            <div style={{
              background: '#111827',
              border: '1.5px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 18,
              padding: '1.75rem',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(16,185,129,0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <span style={{
                  background: 'rgba(16,185,129,0.15)', color: '#34D399',
                  border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20,
                  padding: '4px 12px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  ✅ With WordBloom — How we help
                </span>
                <span style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>
                  Adaptations Active
                </span>
              </div>

              {/* Large Adapted Word Box */}
              <div style={{
                background: getRightPanelOverlayColor(selectedType),
                border: '1.5px solid rgba(16,185,129,0.3)',
                borderRadius: 14,
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                marginBottom: '1.25rem',
                minHeight: 140,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'OpenDyslexic, sans-serif',
                letterSpacing: selectedType === 'surface' ? '0.08em' : 'normal',
                boxShadow: selectedType === 'attentional' ? '0 0 20px rgba(254,243,199,0.15)' : 'none',
              }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {phonicsChunks.map((chunk, cIdx) => {
                    const colorToken = chunkColors[cIdx % chunkColors.length]
                    return (
                      <span
                        key={cIdx}
                        style={{
                          background: colorToken.bg,
                          border: `1.5px solid ${colorToken.border}`,
                          color: colorToken.text,
                          padding: '4px 10px',
                          borderRadius: 10,
                          fontSize: 48,
                          fontWeight: 700,
                          fontFamily: 'OpenDyslexic, sans-serif',
                          letterSpacing: '0.04em',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                      >
                        {chunk}
                      </span>
                    )
                  })}
                </div>
              </div>

              {/* Sentence Context Box (With WordBloom) */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid #1F2937',
                borderRadius: 12,
                padding: '14px 16px',
                marginBottom: '1.25rem',
                fontFamily: 'OpenDyslexic, sans-serif',
              }}>
                <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, fontWeight: 600, fontFamily: 'system-ui, sans-serif' }}>
                  Scaffolded Sentence Context:
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.8, color: '#E5E7EB' }}>
                  {activeSentence.split(' ').map((w, idx) => {
                    const isTarget = w.toLowerCase().replace(/[^a-z]/g, '') === activeWord.target.toLowerCase()
                    if (isTarget) {
                      return (
                        <span
                          key={idx}
                          style={{
                            background: 'rgba(16,185,129,0.25)',
                            border: '1px solid #10B981',
                            padding: '2px 8px',
                            borderRadius: 6,
                            color: '#34D399',
                            fontWeight: 700,
                            marginRight: 6,
                            display: 'inline-block',
                          }}
                        >
                          {w}
                        </span>
                      )
                    }
                    if (selectedType === 'attentional') {
                      // Spotlight mode: surrounding words masked/dimmed
                      return (
                        <span key={idx} style={{ opacity: 0.35, filter: 'blur(0.3px)', marginRight: 6 }}>
                          {w}
                        </span>
                      )
                    }
                    return <span key={idx} style={{ marginRight: 6 }}>{w}</span>
                  })}
                </div>
              </div>

              {/* Adaptive Scaffolding Highlights */}
              <div style={{
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 12,
                padding: '12px 14px',
                fontSize: 13,
                color: '#A7F3D0',
                lineHeight: 1.5,
              }}>
                <strong>WordBloom Accommodation:</strong>{' '}
                {selectedType === 'visual_spatial' && 'OpenDyslexic weighted gravity font prevents letter flipping + Yellow overlay reduces ocular jitter.'}
                {selectedType === 'phonological' && 'Phonics chunking segments words into clear sound units + Blue overlay stabilizes auditory-visual attention.'}
                {selectedType === 'surface' && 'OpenDyslexic font accentuates unique letter silhouettes + 0.08em letter spacing + Green overlay.'}
                {selectedType === 'attentional' && 'Spotlight focus mode masks distracting peripheral words + Yellow overlay isolates target.'}
                {selectedType === 'double_deficit' && 'Full multi-sensory stack: OpenDyslexic font, Phonics chunking, Blue overlay, and Extended pacing buffer.'}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Recommended Profile Changes Section */}
        <div style={{
          background: '#111827',
          border: '1px solid #1F2937',
          borderRadius: 18,
          padding: '1.75rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#F9FAFB' }}>
                💡 Recommended changes for {firstName}&apos;s profile
              </h2>
              <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>
                Based on diagnosed {DYSLEXIA_TYPES.find(t => t.id === selectedType)?.label} patterns during word analysis.
              </p>
            </div>

            <button
              onClick={handleApplyRecommendations}
              disabled={savingProfile}
              style={{
                background: '#10B981',
                color: '#06080F',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 50,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                opacity: savingProfile ? 0.6 : 1,
                boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
                transition: 'all 0.2s ease',
              }}
            >
              {savingProfile ? 'Updating Profile...' : `Apply to ${firstName}'s profile`}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#0B0F19', padding: '16px 20px', borderRadius: 12, border: '1px solid #1F2937' }}>
            {currentRecs.bullets.map((bullet, bIdx) => (
              <div key={bIdx} style={{ fontSize: 14, color: '#E5E7EB', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#10B981' }}>{bullet}</span>
              </div>
            ))}
          </div>
        </div>
          </>
        )}
      </div>
      </div>
    </main>
  )
}
