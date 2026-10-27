'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { submitAnswer, endSession, startSession } from '../../lib/api'
import { playCandyRewardSound, playCandyTapSound, playGoalCelebrationSound } from '../../lib/sounds'

// WCAG AAA High-Contrast Pastel Palette for Dark Mode (#080C14 / #1E293B)
const LETTER_COLOURS = [
  '#38BDF8', // Sky Blue
  '#34D399', // Emerald
  '#F472B6', // Pink
  '#FBBF24', // Amber
  '#C084FC', // Purple
  '#F87171', // Coral Red
  '#818CF8', // Indigo
  '#FB923C'  // Orange
]

/**
 * Strips emoji characters, symbols, and pictographs so browser SpeechSynthesis
 * doesn't announce icon names like "party popper" / "party", "star", "rocket", etc.
 */
function cleanSpokenText(text: string): string {
  if (!text) return ''
  return text
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0E\uFE0F\u200D]/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?])/g, '$1')
    .trim()
}

/**
 * Formats word category badges cleanly, preventing duplicate phrasing like "Words Word"
 * e.g. "compound" -> "Compound Words", "Compound Words Word" -> "Compound Words"
 */
function formatCategoryBadge(category?: string, readingLevel?: number): string {
  if (!category) {
    if (readingLevel === 4) return 'Compound Words'
    if (readingLevel === 3) return 'Silent Letters'
    if (readingLevel === 2) return 'Digraphs & Blends'
    return 'CVC Words'
  }
  let cat = category.trim()
  // Clean up any repeated "Words Word" or "Word Word"
  cat = cat.replace(/\b(words|word)\s+(words|word)\b/gi, 'Words')
  const lower = cat.toLowerCase()
  if (lower === 'compound' || lower === 'compound word' || lower === 'compound words' || lower === 'compound words word') {
    return 'Compound Words'
  }
  if (lower === 'multisyllabic' || lower === 'multisyllabic word' || lower === 'multisyllabic words') {
    return 'Multisyllabic Words'
  }
  if (lower === 'cvc' || lower === 'cvc word' || lower === 'cvc words') {
    return 'CVC Words'
  }
  if (lower === 'blend' || lower === 'blends') {
    return 'Letter Blends'
  }
  if (lower.includes('silent')) {
    return 'Silent Letters'
  }
  if (lower.includes('vowel')) {
    return 'Vowel Teams'
  }
  if (lower.includes('digraph')) {
    return lower.endsWith('s') ? cat : `${cat}s`
  }
  if (lower.endsWith('words')) return cat
  if (lower.endsWith('word')) return `${cat.slice(0, -4).trim()} Words`
  return `${cat} Words`
}

function getInitialInstantSession(childParam: string) {
  if (typeof window === 'undefined') return null
  const cId = (childParam || 'emma').toLowerCase().trim()
  try {
    const raw = localStorage.getItem('wb_session')
    if (raw) {
      const s = JSON.parse(raw)
      const targetChildId = cId || s?.profile?.child_id || 'emma'
      const sessionChild = (s?.profile?.child_name || '').toLowerCase()
      const sessionChildId = (s?.profile?.child_id || '').toLowerCase()
      const isMatchingChild = Boolean(
        sessionChildId === targetChildId ||
        sessionChild.includes(targetChildId) ||
        (targetChildId === 'sofia' && sessionChild.includes('sony')) ||
        (targetChildId === 'sony' && sessionChild.includes('sony'))
      )
      if (isMatchingChild && s?.current_word) {
        return s
      }
    }
  } catch (e) {}

  // Instant pre-computed session so the game card renders in 0ms without delay
  const instantProfiles: Record<string, any> = {
    emma: {
      child_id: 'emma',
      child_name: 'Emma Clarke',
      reading_level: 1,
      reading_stage: 1,
      dyslexia_type: 'phonological',
      input_mode: 'voice',
      display_mode: 'opendyslexic',
      colour_overlay: 'yellow',
      session_length: 5,
      candy_goal: 5,
      break_after: 5,
      first_word: { word: 'sun', difficulty: 'easy', category: 'CVC', audio_hint: 'sun', visual_hint: 's·u·n', sentence: 'The warm sun is shining bright.', why_chosen: 'Stage 1 practice' },
    },
    liam: {
      child_id: 'liam',
      child_name: "Liam O'Connor",
      reading_level: 2,
      reading_stage: 2,
      dyslexia_type: 'surface',
      input_mode: 'tap',
      display_mode: 'standard',
      colour_overlay: 'none',
      session_length: 10,
      candy_goal: 10,
      break_after: 10,
      first_word: { word: 'frog', difficulty: 'medium', category: 'blends', audio_hint: 'frog', visual_hint: 'f·r·o·g', sentence: 'The green frog jumped in the pond.', why_chosen: 'Stage 2 practice' },
    },
    james: {
      child_id: 'james',
      child_name: 'James Patel',
      reading_level: 2,
      reading_stage: 2,
      dyslexia_type: 'visual/spatial',
      input_mode: 'tap',
      display_mode: 'opendyslexic',
      colour_overlay: 'blue',
      session_length: 10,
      candy_goal: 10,
      break_after: 10,
      first_word: { word: 'star', difficulty: 'medium', category: 'blends', audio_hint: 'star', visual_hint: 's·t·a·r', sentence: 'Look up at the bright twinkling star.', why_chosen: 'Stage 2 practice' },
    },
    sofia: {
      child_id: 'sofia',
      child_name: 'Sony Mathew',
      reading_level: 2,
      reading_stage: 2,
      dyslexia_type: 'phonological',
      input_mode: 'voice',
      display_mode: 'opendyslexic',
      colour_overlay: 'green',
      session_length: 5,
      candy_goal: 5,
      break_after: 5,
      first_word: { word: 'drum', difficulty: 'medium', category: 'blends', audio_hint: 'drum', visual_hint: 'd·r·u·m', sentence: 'Beat the rhythm on the drum.', why_chosen: 'Stage 2 practice' },
    },
    sony: {
      child_id: 'sony',
      child_name: 'Sony Mathew',
      reading_level: 2,
      reading_stage: 2,
      dyslexia_type: 'phonological',
      input_mode: 'voice',
      display_mode: 'opendyslexic',
      colour_overlay: 'green',
      session_length: 5,
      candy_goal: 5,
      break_after: 5,
      first_word: { word: 'drum', difficulty: 'medium', category: 'blends', audio_hint: 'drum', visual_hint: 'd·r·u·m', sentence: 'Beat the rhythm on the drum.', why_chosen: 'Stage 2 practice' },
    },
  }

  const p = instantProfiles[cId] || instantProfiles.emma
  return {
    session_id: `session_${Date.now()}`,
    profile: p,
    current_word: p.first_word,
    words_done: [],
    words_correct: [],
    start_time: Date.now(),
    stats: { words_done: 0, words_correct: 0, accuracy: 0 },
  }
}

function GameContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const childParam = (searchParams.get('child') || '').toLowerCase().trim()
  const [session,       setSession]       = useState<any>(() => getInitialInstantSession(childParam))
  const [activeWord,    setActiveWord]    = useState<any>(() => getInitialInstantSession(childParam)?.current_word || null)
  const [pendingWord,   setPendingWord]   = useState<any>(null)
  const [answer,        setAnswer]        = useState('')
  const [tappedLetters, setTappedLetters] = useState<string[]>([])
  const [showFullKeyboard, setShowFullKeyboard] = useState<boolean>(false)
  const [loading,       setLoading]       = useState(false)
  const [endingSession, setEndingSession] = useState(false)
  const [restarting,    setRestarting]    = useState(false)
  const [feedback,      setFeedback]      = useState<any>(null)
  const [showBreak,     setShowBreak]     = useState(false)
  const [goalAchieved,  setGoalAchieved]  = useState(false)
  const [inputMode,     setInputMode]     = useState<string>(() => getInitialInstantSession(childParam)?.profile?.input_mode || 'voice')
  const [visualHintB64,   setVisualHintB64]   = useState<string | null>(null)
  const [audioScaffoldB64, setAudioScaffoldB64] = useState<string | null>(null)
  const [phonicsChunks,   setPhonicsChunks]   = useState<string | null>(null)
  const [phonicsSpoken,   setPhonicsSpoken]   = useState<string | null>(null)
  const [meaningIcon,     setMeaningIcon]     = useState<string | null>(null)
  const [meaningDesc,     setMeaningDesc]     = useState<string | null>(null)
  const [candiesWon,      setCandiesWon]      = useState<number>(() => getInitialInstantSession(childParam)?.stats?.words_correct || 0)
  const [isListening,     setIsListening]     = useState<boolean>(false)
  const [interimSpoken,   setInterimSpoken]   = useState<string>('')
  const [micStatusMsg,    setMicStatusMsg]    = useState<string>('')
  const [soundEnabled,    setSoundEnabled]    = useState<boolean>(true)
  const [justEarnedIndex, setJustEarnedIndex] = useState<number | null>(null)
  const typeInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<any>(null)
  const isSubmittingRef = useRef<boolean>(false)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const startTime = useRef(Date.now())

  const playSpeechFallback = (chunksOrText: string, targetWord?: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const word = targetWord || activeWord?.word || ''
    let spokenText = chunksOrText || ''
    // If it only has the chunks (e.g. "c ... u ... p"), ensure it blends together!
    if (!spokenText.toLowerCase().includes('together') && word) {
      spokenText = `Sound it out: ${chunksOrText}. Together: ${word}!`
    }
    const cleanText = cleanSpokenText(spokenText).replace(/\.\.\./g, ', ')
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = 'en-GB'
    utterance.rate = 0.75
    utterance.pitch = 1.0
    window.speechSynthesis.speak(utterance)
  }

  const playAudioScaffold = (b64Audio: string, fallbackText?: string | null) => {
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
      const audio = new Audio(`data:audio/mp3;base64,${b64Audio}`)
      currentAudioRef.current = audio
      audio.onended = () => {
        if (currentAudioRef.current === audio) currentAudioRef.current = null
      }
      audio.play().catch(err => {
        console.warn('Audio auto-play prevented by browser policy, attempting speech synthesis fallback:', err)
        playSpeechFallback(fallbackText || phonicsSpoken || phonicsChunks || activeWord?.word || '', activeWord?.word)
      })
    } catch (e) {
      console.error('Audio scaffold playback error:', e)
      playSpeechFallback(fallbackText || phonicsSpoken || phonicsChunks || activeWord?.word || '', activeWord?.word)
    }
  }

  const startVoiceCapture = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice input requires Google Chrome, Microsoft Edge, or Safari.')
      return
    }

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {}
      setIsListening(false)
      setMicStatusMsg('')
      return
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    try {
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      recognition.lang = 'en-GB'
      recognition.continuous = false
      recognition.interimResults = true
      recognition.maxAlternatives = 5

      recognition.onstart = () => {
        setIsListening(true)
        setInterimSpoken('')
        setMicStatusMsg('Listening... speak now!')
      }

      recognition.onresult = (e: any) => {
        let interim = ''
        let final = ''

        const targetClean = (activeWord?.word || currentWord || '').toLowerCase().trim().replace(/[.,!?:;'"]/g, '')

        // Helper: evaluate all speech alternatives to find target match or acoustic sound-alike match
        const pickBestTranscript = (item: any): string => {
          if (!item || item.length === 0) return ''
          
          // 1. Exact match among alternatives (e.g. alt[0] is "hope", alt[1] is "hop" -> picks "hop")
          for (let j = 0; j < item.length; j++) {
            const tr = (item[j]?.transcript || '').trim().toLowerCase().replace(/[.,!?:;'"]/g, '')
            if (tr === targetClean) {
              return targetClean
            }
          }

          // 2. Trailing silent 'e' elongation (e.g. child says "hop" -> STT hears "hope")
          for (let j = 0; j < item.length; j++) {
            const tr = (item[j]?.transcript || '').trim().toLowerCase().replace(/[.,!?:;'"]/g, '')
            if (tr.endsWith('e') && tr.slice(0, -1) === targetClean) {
              return targetClean
            }
            if (targetClean.endsWith('e') && targetClean.slice(0, -1) === tr) {
              return targetClean
            }
          }

          // 3. Known acoustic homophones & sound-alikes
          const HOMOPHONE_MAP: Record<string, string[]> = {
            hop: ['hope', 'hot'],
            hope: ['hop'],
            sun: ['son', 'some'],
            son: ['sun'],
            not: ['note', 'knot'],
            knot: ['not', 'note'],
            pop: ['pope'],
            pope: ['pop'],
            rob: ['robe'],
            robe: ['rob'],
            pin: ['pine'],
            pine: ['pin'],
            cut: ['cute'],
            cute: ['cut'],
            tub: ['tube'],
            tube: ['tub'],
            cap: ['cape'],
            cape: ['cap'],
            tap: ['tape'],
            tape: ['tap'],
            rip: ['ripe'],
            ripe: ['rip'],
            dog: ['dock', 'doc'],
            cat: ['kat'],
            right: ['write'],
            write: ['right'],
            see: ['sea'],
            sea: ['see'],
            one: ['won'],
            won: ['one'],
            for: ['four'],
            four: ['for'],
          }
          if (HOMOPHONE_MAP[targetClean]) {
            for (let j = 0; j < item.length; j++) {
              const tr = (item[j]?.transcript || '').trim().toLowerCase().replace(/[.,!?:;'"]/g, '')
              if (HOMOPHONE_MAP[targetClean].includes(tr)) {
                return targetClean
              }
            }
          }

          // Default fallback: top confidence candidate
          return (item[0]?.transcript || '').trim()
        }

        for (let i = e.resultIndex; i < e.results.length; ++i) {
          const item = e.results[i]
          const best = pickBestTranscript(item)
          if (item.isFinal) {
            final = best
          } else {
            interim += best
          }
        }

        const candidate = (final || interim).trim()
        if (candidate) {
          setInterimSpoken(candidate)
          setAnswer(candidate)

          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
          }

          if (final) {
            if (!isSubmittingRef.current && !pendingWord && !loading) {
              try { recognition.stop() } catch (err) {}
              setIsListening(false)
              setMicStatusMsg(`Heard: "${final}"`)
              handleSubmit(final)
            }
          } else {
            // Rapid auto-submit if speaker pauses after candidate (eliminates 4s Chrome silence wait)
            silenceTimerRef.current = setTimeout(() => {
              silenceTimerRef.current = null
              if (candidate && !isSubmittingRef.current && !pendingWord && !loading) {
                try { recognition.stop() } catch (err) {}
                setIsListening(false)
                setMicStatusMsg(`Heard: "${candidate}"`)
                handleSubmit(candidate)
              }
            }, 450)
          }
        }
      }

      recognition.onerror = (e: any) => {
        setIsListening(false)
        if (e.error === 'not-allowed') {
          setMicStatusMsg('⚠️ Microphone permission blocked in browser')
        } else if (e.error === 'no-speech') {
          setMicStatusMsg('No speech detected — tap 🎤 and speak near microphone')
        } else {
          setMicStatusMsg(`Mic: ${e.error}`)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err)
      setIsListening(false)
      setMicStatusMsg('Could not start microphone')
    }
  }

  useEffect(() => {
    let isCancelled = false

    const initSession = async () => {
      const raw = localStorage.getItem('wb_session')
      let s = raw ? JSON.parse(raw) : null
      const targetChildId = childParam || s?.profile?.child_id || 'emma'
      const sessionChild = (s?.profile?.child_name || '').toLowerCase()
      const sessionChildId = (s?.profile?.child_id || '').toLowerCase()

      // Check if session in localStorage is already for the requested child and not already finished
      const isCompleted = Boolean(s?.goalAchieved || (s?.stats?.words_correct && s.stats.words_correct >= (s?.profile?.candy_goal || 5)))
      const isMatchingChild = Boolean(
        s && !isCompleted && (
          !childParam ||
          sessionChildId === targetChildId ||
          sessionChild.includes(targetChildId) ||
          (targetChildId === 'sofia' && sessionChild.includes('sony')) ||
          (targetChildId === 'sony'  && sessionChild.includes('sony'))
        )
      )

      // If no session, or URL specifies childParam and stored session is for another child:
      if (!s || !isMatchingChild) {
        try {
          const data = await startSession(targetChildId)
          s = {
            session_id:   data.session_id,
            profile:      { ...data.profile, child_id: targetChildId },
            current_word: data.first_word,
            words_done:   [],
            words_correct: [],
            start_time:   Date.now(),
            stats: { words_done: 0, words_correct: 0, accuracy: 0 },
          }
          localStorage.setItem('wb_session', JSON.stringify(s))
        } catch (err) {
          console.error('Failed to start session for', targetChildId, err)
          if (!s) {
            const fallbackProfile = {
              child_id: targetChildId,
              child_name: targetChildId === 'sofia' ? 'Sony' : targetChildId.charAt(0).toUpperCase() + targetChildId.slice(1),
              reading_level: 1,
              input_mode: 'voice',
              display_mode: 'opendyslexic',
              session_length: 5,
              break_after: 5,
              candy_goal: 5,
            }
            s = {
              session_id: `session_${Date.now()}`,
              profile: fallbackProfile,
              current_word: {
                word: 'sun',
                difficulty: 'easy',
                category: 'CVC',
                phonics_rule: "Short 'u' sound",
                audio_hint: 'sun',
                visual_hint: 's·u·n',
                sentence: 'The big yellow sun shines in the sky!',
              },
              words_done: [],
              words_correct: [],
              start_time: Date.now(),
              stats: { words_done: 0, words_correct: 0, accuracy: 0 },
            }
            localStorage.setItem('wb_session', JSON.stringify(s))
          }
        }
      }

      if (isCancelled) return
      setSession(s)
      setActiveWord(s.current_word)
      setInputMode(s.profile?.input_mode || 'voice')
      setFeedback(null)
      setPendingWord(null)
      setCandiesWon(s.stats?.words_correct || 0)

      // Apply font & overlay preferences from profile
      const prof = s.profile || {}
      const dispMode = (prof.display_mode || prof.displayMode || '').toLowerCase()
      const colOverlay = (prof.colour_overlay || prof.colourOverlay || prof.color_overlay || '').toLowerCase()

      const classes: string[] = []
      if (dispMode === 'opendyslexic') classes.push('opendyslexic')
      if (dispMode === 'spotlight') classes.push('spotlight-mode')
      if (colOverlay && colOverlay !== 'none') classes.push(`overlay-${colOverlay}`)
      document.body.className = classes.join(' ')
    }

    initSession()

    return () => {
      isCancelled = true
      document.body.className = ''
    }
  }, [childParam])

  const currentWord = activeWord?.word || session?.current_word?.word || ''
  const profile     = session?.profile || {}
  const stats       = session?.stats   || {}
  const rawDyslexia = (profile.dyslexia_type || profile.dyslexiaType || '').toLowerCase()
  const isNonDyslexic = rawDyslexia === 'non_dyslexic' || rawDyslexia === 'none' || rawDyslexia === 'general'
  const isSpotlight   = (profile.display_mode || profile.displayMode || '').toLowerCase() === 'spotlight'
  const rawConditions = profile.co_occurring || profile.coOccurring || profile.conditions || []
  const conditionsList: string[] = Array.isArray(rawConditions)
    ? rawConditions.map((c: any) => String(c).toLowerCase().trim())
    : String(rawConditions).toLowerCase().split(',').map(s => s.trim())
  const hasAutism = conditionsList.some((c: string) => c.includes('autism'))

  // Sound preference initialization: defaults to muted for autism profiles to prevent sensory overload
  useEffect(() => {
    const saved = localStorage.getItem('wb_sound_enabled')
    if (saved !== null) {
      setSoundEnabled(saved === 'true')
    } else if (hasAutism) {
      setSoundEnabled(false)
    } else {
      setSoundEnabled(true)
    }
  }, [hasAutism])

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev
      localStorage.setItem('wb_sound_enabled', String(next))
      if (next) {
        playCandyTapSound(0)
      }
      return next
    })
  }
  // Spacious desktop layout — comfortable breathing room, large accessible targets and clear typography
  const cardMaxWidth = 780
  const isCorrectAnswerPending = Boolean(pendingWord?.next_word && pendingWord?.evaluation?.is_correct)

  // Auto-focus & maintain locked keyboard focus on Type Mode input for children with dyspraxia / motor differences
  useEffect(() => {
    if (inputMode === 'type' && !isCorrectAnswerPending && !showBreak && !goalAchieved && !loading) {
      const timer = setTimeout(() => {
        typeInputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [inputMode, activeWord, isCorrectAnswerPending, showBreak, goalAchieved, loading])

  // Global keydown focus recovery: if typing while in Type Mode, keep focus routed to the input box
  useEffect(() => {
    if (inputMode !== 'type' || isCorrectAnswerPending || showBreak || goalAchieved || loading) return

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      // Don't intercept shortcut keys with modifier keys (Cmd, Ctrl, Alt)
      if (e.ctrlKey || e.metaKey || e.altKey) return
      // If typing printable characters or backspace and not already in input, restore focus seamlessly
      if (document.activeElement !== typeInputRef.current && (e.key.length === 1 || e.key === 'Backspace')) {
        typeInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleWindowKeyDown)
    return () => window.removeEventListener('keydown', handleWindowKeyDown)
  }, [inputMode, isCorrectAnswerPending, showBreak, goalAchieved, loading])

  const handleSpeakWord = () => {
    try {
      window.speechSynthesis.cancel()
      const wordToSpeak = (activeWord?.audio_hint || currentWord || '')
        .replace(/[-·]/g, '')
        .trim()
      const textToUse = cleanSpokenText(wordToSpeak || currentWord)
      const utterance = new SpeechSynthesisUtterance(textToUse)
      utterance.lang = 'en-GB'
      utterance.rate = 0.8
      utterance.pitch = 1.0
      window.speechSynthesis.speak(utterance)
    } catch (e) {
      console.error('Speech synthesis error:', e)
    }
  }

  // Advances session to the next word cleanly (child-paced, zero timer pressure)
  const advanceToNextWord = (nextWordObj: any, nextStats: any) => {
    if (!nextWordObj) return
    const currentWordStr = activeWord?.word || session?.current_word?.word
    const prevWordsDone: string[] = session?.words_done || []
    const updatedWordsDone = currentWordStr && !prevWordsDone.includes(currentWordStr)
      ? [...prevWordsDone, currentWordStr]
      : prevWordsDone

    const updated = {
      ...session,
      current_word: nextWordObj,
      words_done:   updatedWordsDone,
      stats:        nextStats || session?.stats,
    }
    localStorage.setItem('wb_session', JSON.stringify(updated))
    setSession(updated)
    setActiveWord(nextWordObj)
    if (nextStats?.words_correct !== undefined) {
      setCandiesWon(nextStats.words_correct)
    }
    isSubmittingRef.current = false
    setPendingWord(null)
    setFeedback(null)
    setVisualHintB64(null)
    setAudioScaffoldB64(null)
    setPhonicsChunks(null)
    setPhonicsSpoken(null)
    setMeaningIcon(null)
    setMeaningDesc(null)
    setAnswer('')
    setTappedLetters([])
  }

  const handleSkipWord = () => {
    const currentWordClean = (activeWord?.word || currentWord || '').toLowerCase().trim()
    let targetNextWord = feedback?.next_word || pendingWord?.next_word

    // If next_word was missing or matches current word, guarantee a fresh new word
    if (!targetNextWord || targetNextWord?.word?.toLowerCase().trim() === currentWordClean) {
      const fallbacks = [
        { word: 'cup', audio_hint: 'cup', visual_hint: 'c·u·p', sentence: 'Drink water from the blue cup.' },
        { word: 'sun', audio_hint: 'sun', visual_hint: 's·u·n', sentence: 'The warm sun is shining bright.' },
        { word: 'pin', audio_hint: 'pin', visual_hint: 'p·i·n', sentence: 'Fasten the paper with a pin.' },
        { word: 'net', audio_hint: 'net', visual_hint: 'n·e·t', sentence: 'The butterfly landed on the net.' },
        { word: 'fox', audio_hint: 'foks', visual_hint: 'f·o·x', sentence: 'The clever red fox dashed away.' },
        { word: 'frog', audio_hint: 'frog', visual_hint: 'f·r·o·g', sentence: 'The green frog jumped in the pond.' },
        { word: 'clap', audio_hint: 'clap', visual_hint: 'c·l·a·p', sentence: 'Clap your hands to the music.' },
        { word: 'drum', audio_hint: 'drum', visual_hint: 'd·r·u·m', sentence: 'Beat the rhythm on the drum.' },
      ]
      const doneList = (session?.words_done || []).map((w: string) => String(w).toLowerCase().trim())
      doneList.push(currentWordClean)
      const fresh = fallbacks.find(f => !doneList.includes(f.word)) || fallbacks[0]
      targetNextWord = { ...fresh, difficulty: 'easy', category: 'practice' }
    }

    advanceToNextWord(targetNextWord, feedback?.session_stats || pendingWord?.session_stats)
  }

  // Keyboard shortcut: Press Enter to advance to next word or restart when goal is reached
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (goalAchieved && e.key === 'Enter') {
        handleRestartSession()
      } else if (pendingWord?.next_word && e.key === 'Enter') {
        advanceToNextWord(pendingWord.next_word, pendingWord.session_stats)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pendingWord, goalAchieved])

  const handleSubmit = async (overrideAnswer?: string) => {
    const userAnswer = overrideAnswer !== undefined
      ? overrideAnswer
      : (inputMode === 'tap' ? tappedLetters.join('') : answer)
    if (!userAnswer.trim()) return

    // Prevent duplicate concurrent submissions (rapid enter, double-click, speech race)
    if (isSubmittingRef.current || loading || pendingWord) return
    isSubmittingRef.current = true
    setLoading(true)
    const elapsed = (Date.now() - startTime.current) / 1000
    startTime.current = Date.now()

    try {
      const childFullName = session?.profile?.child_name || "Emma Clarke"
      const currentWordTarget = activeWord?.word || session?.current_word?.word || ''
      const result = await submitAnswer(
        session.session_id,
        userAnswer,
        elapsed,
        inputMode,
        childFullName,
        currentWordTarget,
      )

      setFeedback(result)
      setAnswer('')
      setTappedLetters([])

      const isCorrect = Boolean(result.evaluation?.is_correct)
      if (isCorrect) {
        setVisualHintB64(null)
        setAudioScaffoldB64(null)
        setPhonicsChunks(null)
        setPhonicsSpoken(null)
        setMeaningIcon(null)
        setMeaningDesc(null)
      } else {
        const vHint = result.visual_hint_b64 || result.adaptation?.visual_hint_b64 || null
        const aScaffold = result.audio_scaffold_b64 || result.adaptation?.audio_scaffold_b64 || null
        const pChunks = result.phonics_chunks || result.adaptation?.phonics_chunks || null
        const pSpoken = result.phonics_spoken || result.adaptation?.phonics_spoken || null
        const mIcon = result.meaning_icon || result.adaptation?.meaning_icon || null
        const mDesc = result.meaning_desc || result.adaptation?.meaning_desc || null

        if (vHint) setVisualHintB64(vHint)
        if (aScaffold) setAudioScaffoldB64(aScaffold)
        if (pChunks) setPhonicsChunks(pChunks)
        if (pSpoken) setPhonicsSpoken(pSpoken)
        if (mIcon) setMeaningIcon(mIcon)
        if (mDesc) setMeaningDesc(mDesc)

        // Automatically play the Google TTS audio scaffold ONLY for voice mode
        if (inputMode === 'voice') {
          if (aScaffold) {
            playAudioScaffold(aScaffold, pSpoken || pChunks)
          } else if (pSpoken || pChunks) {
            playSpeechFallback(pSpoken || pChunks)
          }
        }
      }

      const rawChildParam = (childParam || session?.profile?.child_id || '').toLowerCase()
      const firstWordId = childFullName.toLowerCase().split(' ')[0]
      const childIds = Array.from(new Set([rawChildParam, firstWordId, 'sofia', 'sony'].filter(id => {
        if (!id) return false
        if (rawChildParam === 'sofia' || firstWordId === 'sony' || childFullName.toLowerCase().includes('sony') || childFullName.toLowerCase().includes('sofia')) {
          return id === 'sofia' || id === 'sony'
        }
        return id === rawChildParam || id === firstWordId
      })))

      // Save word attempt for Dyslexia Mirror diagnostic across both ID variants
      try {
        const attemptRecord = {
          target: currentWordTarget,
          child_answer: userAnswer,
          is_correct: isCorrect,
          error_pattern: result.evaluation?.error_pattern || result.evaluation?.pattern || null,
          sentence: activeWord?.sentence || `The ${currentWordTarget} appeared on screen.`,
        }
        childIds.forEach(cid => {
          const existingWordsRaw = localStorage.getItem(`wb_session_words_${cid}`)
          let existingWords = []
          if (existingWordsRaw) {
            try { existingWords = JSON.parse(existingWordsRaw) } catch (e) {}
            if (!Array.isArray(existingWords)) existingWords = []
          }
          existingWords.push(attemptRecord)
          localStorage.setItem(`wb_session_words_${cid}`, JSON.stringify(existingWords))
        })
      } catch (e) {}

      // Update session stats and candies immediately so candy counter lights up in real-time
      let targetCorrect = candiesWon
      if (typeof result.session_stats?.words_correct === 'number') {
        targetCorrect = result.session_stats.words_correct
        setCandiesWon(targetCorrect)
      } else if (isCorrect) {
        targetCorrect = Math.min(candiesWon + 1, totalWords)
        setCandiesWon(targetCorrect)
      }

      // Trigger Candy Pop & Sparkle Micro-Animation on newly earned candy
      if (isCorrect) {
        const newlyEarned = Math.min(totalWords - 1, Math.max(0, targetCorrect - 1))
        setJustEarnedIndex(newlyEarned)
        setTimeout(() => setJustEarnedIndex(null), 1400)
      }

      if (result.session_stats) {
        setSession((prev: any) => ({
          ...prev,
          stats: result.session_stats,
        }))
        const raw = localStorage.getItem('wb_session')
        if (raw) {
          try {
            const s = JSON.parse(raw)
            s.stats = result.session_stats
            localStorage.setItem('wb_session', JSON.stringify(s))
          } catch (e) {}
        }
      }

      // Candy goal is ONLY achieved on a correct answer where the target candy count is reached.
      // An incorrect word must NEVER trigger the goal reached celebration!
      const currentCandies = targetCorrect
      const isGoalReached = isCorrect && (Boolean(result.adaptation?.goal_reached) || currentCandies >= totalWords)

      if (isGoalReached) {
        setGoalAchieved(true)
        if (soundEnabled) {
          playGoalCelebrationSound()
        }
        setLoading(false)
        const childId = childFullName.toLowerCase().split(' ')[0]
        
        // Finalize teacher report silently in the background
        try {
          const endResult = await endSession(session.session_id, childFullName)
          const report = endResult.report || {}
          report.child_name = childFullName
          const firstName = childFullName.split(' ')[0]
          if (report.report_text) {
            report.report_text = report.report_text
              .replace(/\b(Emma Clarke|James Patel|Sofia Mensah|Liam O'Connor)\b/gi, childFullName)
              .replace(/\b(Emma|James|Sofia|Child)\b/gi, firstName)
              .replace(/^[A-Za-z'.-]+(?=\s+(?:worked|demonstrated|showed|checked|completed|navigated|read))/i, firstName)
          }
          try {
            const storedWords = JSON.parse(localStorage.getItem(`wb_session_words_${childId}`) || '[]')
            if (storedWords.length > 0) report.words = storedWords
          } catch (e) {}
          localStorage.setItem('wb_report', JSON.stringify(report))
          localStorage.setItem(`wb_report_${childId}`, JSON.stringify(report))
        } catch (e) {
          console.error('Silent report finalize error:', e)
        }
        // Keep student on celebration screen — do NOT redirect to teacher report!
        return
      }

      // Play delightful soft marimba reward chime for earning a candy
      if (isCorrect && soundEnabled) {
        playCandyRewardSound()
      }

      // Show break if needed
      if (result.adaptation?.action === 'take_break') {
        setShowBreak(true)
        setTimeout(() => setShowBreak(false), 30000)
      }

      // Store pending next word for child-paced progression ONLY on correct answers
      if (isCorrect && result.next_word) {
        setPendingWord(result)
      } else {
        setPendingWord(null)
      }

    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setTimeout(() => {
        isSubmittingRef.current = false
      }, 350)
    }
  }

  const handleRestartSession = async () => {
    setRestarting(true)
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const childParam = urlParams.get('child')
      const childFullName = session?.profile?.child_name || "Emma Clarke"
      const childId = childParam || session?.profile?.child_id || session?.profile?.id || childFullName.toLowerCase().split(' ')[0]

      // Gather all words completed or attempted in the current session so the new session is guaranteed fresh
      const recentWords: string[] = []
      if (session?.words_done && Array.isArray(session.words_done)) {
        recentWords.push(...session.words_done)
      }
      if (activeWord?.word) {
        recentWords.push(activeWord.word)
      }
      if (session?.current_word?.word) {
        recentWords.push(session.current_word.word)
      }
      try {
        const stored = JSON.parse(localStorage.getItem(`wb_session_words_${childId}`) || '[]')
        if (Array.isArray(stored)) {
          stored.forEach((item: any) => {
            const w = item.target || item.word
            if (w) recentWords.push(w)
          })
        }
      } catch (e) {}

      const uniqueExcludeWords = Array.from(new Set(recentWords.map(w => String(w).toLowerCase().trim()))).filter(Boolean)

      const data = await startSession(childId, uniqueExcludeWords)
      
      const newSession = {
        session_id:   data.session_id,
        profile:      { ...data.profile, child_id: childId },
        current_word: data.first_word,
        words_done:   uniqueExcludeWords,
        words_correct: [],
        start_time:   Date.now(),
        stats: { words_done: 0, words_correct: 0, accuracy: 0 },
      }
      localStorage.setItem('wb_session', JSON.stringify(newSession))
      setSession(newSession)
      setActiveWord(data.first_word)
      setFeedback(null)
      setPendingWord(null)
      setVisualHintB64(null)
      setAudioScaffoldB64(null)
      setPhonicsChunks(null)
      setPhonicsSpoken(null)
      setMeaningIcon(null)
      setMeaningDesc(null)
      setAnswer('')
      setTappedLetters([])
      setGoalAchieved(false)
      setShowBreak(false)
      setCandiesWon(0)
    } catch (e) {
      console.error('Failed to restart session:', e)
      window.location.reload()
    } finally {
      setRestarting(false)
      setLoading(false)
    }
  }

  const handleEndSession = async () => {
    if (endingSession) return
    setEndingSession(true)
    const childFullName = session?.profile?.child_name || "Emma Clarke"
    const rawChildParam = (childParam || session?.profile?.child_id || '').toLowerCase()
    const firstWordId = childFullName.toLowerCase().split(' ')[0]
    const childIds = Array.from(new Set([rawChildParam, firstWordId, 'sofia', 'sony'].filter(id => {
      if (!id) return false
      if (rawChildParam === 'sofia' || firstWordId === 'sony' || childFullName.toLowerCase().includes('sony') || childFullName.toLowerCase().includes('sofia')) {
        return id === 'sofia' || id === 'sony'
      }
      return id === rawChildParam || id === firstWordId
    })))

    try {
      const result = await endSession(session.session_id, childFullName)
      const report = result.report || {}
      report.child_name = childFullName
      const firstName = childFullName.split(' ')[0]
      if (report.report_text) {
        report.report_text = report.report_text
          .replace(/\b(Emma Clarke|James Patel|Sofia Mensah|Liam O'Connor)\b/gi, childFullName)
          .replace(/\b(Emma|James|Sofia|Child)\b/gi, firstName)
          .replace(/^[A-Za-z'.-]+(?=\s+(?:worked|demonstrated|showed|checked|completed|navigated|read))/i, firstName)
      }
      localStorage.setItem('wb_report', JSON.stringify(report))
      childIds.forEach(cid => {
        localStorage.setItem(`wb_report_${cid}`, JSON.stringify(report))
      })
    } catch (e) {
      console.error('Silent report finalize error on end session:', e)
    } finally {
      setEndingSession(false)
      // Clean up game session so student starts fresh next time
      localStorage.removeItem('wb_session')
      // Student navigation: go back to student selection / login page (NEVER teacher dashboard)
      router.push('/child/select')
    }
  }

  if (!session) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#10B981', gap: 12, fontSize: 18, fontWeight: 700 }}>
      <span style={{ fontSize: 40, animation: 'pulse 1.5s infinite ease-in-out' }}>🌸</span>
      <span>Getting your garden ready... 🌸</span>
    </div>
  )

  // Candy rewards display (playful & encouraging for children, dyscalculia-friendly)
  const totalWords = profile.candy_goal || stats.candy_goal || (profile.session_length === 5 ? 5 : 10)
  const correctCount = Math.max(candiesWon, stats.words_correct || 0)

  return (
    <div suppressHydrationWarning style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1.5rem', minHeight: '100vh' }}>

      {/* Top bar */}
      <div
        className={`${isSpotlight ? 'spotlight-dimmed-peripheral spotlight-interactive-element' : ''}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: Math.max(cardMaxWidth, 640),
          marginBottom: '1.5rem',
          transition: 'all 0.3s ease',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'var(--bloom)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 17, fontWeight: 800, color: '#fff',
            flexShrink: 0,
          }}>
            {profile.child_name?.charAt(0) || 'E'}
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--white)', whiteSpace: 'nowrap' }}>
            {profile.child_name?.split(' ')[0] || 'Emma'}
          </span>

          {/* Sound Toggle Button with Autism Sensory comfort default */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundEnabled ? "Sound effects on — tap to mute" : "Sound effects muted — tap to enable"}
            title={hasAutism ? (soundEnabled ? "Sound enabled (Autism comfort toggle)" : "Muted for sensory comfort (Autism flag detected) — tap to enable sound") : (soundEnabled ? "Mute sounds" : "Unmute sounds")}
            style={{
              background: soundEnabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.15)',
              border: `1.5px solid ${soundEnabled ? 'rgba(16, 185, 129, 0.4)' : 'rgba(148, 163, 184, 0.35)'}`,
              color: soundEnabled ? 'var(--bloom)' : '#94A3B8',
              borderRadius: 20,
              padding: '6px 12px',
              fontSize: 13.5,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              touchAction: 'manipulation',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <span>{soundEnabled ? '🔊' : '🔇'}</span>
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {hasAutism ? 'Sensory' : (soundEnabled ? 'Sound' : 'Muted')}
            </span>
          </button>
        </div>

        {/* Garden Bloom Reward Counter */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(16, 185, 129, 0.15)', border: '1.5px solid rgba(16, 185, 129, 0.45)',
            padding: '6px 14px', borderRadius: 24,
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.2)',
            flexWrap: 'nowrap',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            justifyContent: 'center',
          }}
          role="status"
          aria-label={`${correctCount} of ${totalWords} flowers bloomed`}
        >
          {Array.from({ length: totalWords }, (_, i) => {
            const isEarned = i < correctCount
            const isPopping = i === justEarnedIndex
            return (
              <span
                key={i}
                onClick={() => {
                  setJustEarnedIndex(i)
                  setTimeout(() => setJustEarnedIndex(null), 1200)
                  if (soundEnabled) playCandyTapSound(i)
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && soundEnabled) {
                    setJustEarnedIndex(i)
                    setTimeout(() => setJustEarnedIndex(null), 1200)
                    playCandyTapSound(i)
                  }
                }}
                aria-label={isEarned ? `Flower ${i + 1} bloomed! Tap to hear soft chime` : `Seed slot ${i + 1}`}
                style={{
                  position: 'relative',
                  fontSize: totalWords > 10 ? 16 : 22,
                  opacity: isEarned ? 1 : 0.55,
                  filter: isEarned ? 'drop-shadow(0 2px 8px rgba(16,185,129,0.8))' : 'grayscale(0.4)',
                  transform: isPopping ? 'scale(1.42) rotate(12deg)' : isEarned ? 'scale(1.15)' : 'scale(0.9)',
                  transition: isPopping ? 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  lineHeight: 1,
                  animation: isPopping ? 'candyPopPulse 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
                }}
              >
                {isEarned ? '🌸' : '🌱'}
                {isPopping && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -16,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: 16,
                      pointerEvents: 'none',
                      animation: 'sparkleFloat 1.2s ease-out forwards',
                    }}
                  >
                    ✨
                  </span>
                )}
              </span>
            )
          })}
          <span style={{ fontSize: 15, fontWeight: 800, color: '#34D399', marginLeft: 6, whiteSpace: 'nowrap' }}>
            {correctCount}/{totalWords}
          </span>
        </div>

        <button
          onClick={handleEndSession}
          disabled={endingSession}
          aria-label="Finish and save learning session"
          style={{
            background: '#1E293B', color: '#FFFFFF',
            fontSize: 15.5, minHeight: 46, padding: '9px 20px',
            border: '1.5px solid rgba(255, 255, 255, 0.35)', borderRadius: 24,
            fontWeight: 800, cursor: endingSession ? 'wait' : 'pointer',
            opacity: endingSession ? 0.7 : 1,
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            transition: 'all 0.2s ease',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: 18 }}>{endingSession ? '⏳' : '🚪'}</span>
          <span style={{ fontWeight: 800, color: '#FFFFFF' }}>{endingSession ? 'Saving...' : 'Finish'}</span>
        </button>
      </div>

      {/* Break banner (Non-blocking) */}
      {showBreak && (
        <div
          className="spotlight-interactive-element"
          style={{
            width: '100%', maxWidth: cardMaxWidth, padding: '1.25rem 1.75rem',
            background: 'var(--warn-bg, rgba(251,191,36,0.14))',
            border: '2px solid rgba(217, 119, 6, 0.45)',
            borderRadius: 20, textAlign: 'center', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--warn-text, #D97706)', marginBottom: 3 }}>
              ☕ Time for a quick break!
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--white)' }}>
              Stretch your arms &amp; rest your eyes.
            </div>
          </div>
          <button
            onClick={() => setShowBreak(false)}
            style={{
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              color: '#FFFFFF',
              minHeight: 40, padding: '9px 20px', borderRadius: 20, fontSize: 13, fontWeight: 800,
              border: '1.5px solid rgba(254, 243, 199, 0.7)', cursor: 'pointer', flexShrink: 0,
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.35)',
            }}
          >
            Skip Break 🚀
          </button>
        </div>
      )}

      {/* Garden Bloom Goal Celebration Modal */}
      {goalAchieved && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(6, 8, 15, 0.95)', backdropFilter: 'blur(16px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '2rem 1.5rem', textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '100%', maxWidth: 640,
              background: '#111827',
              border: '2px solid var(--bloom)',
              borderRadius: 32,
              padding: '3rem 2.5rem',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(16,185,129,0.25)',
            }}
          >
            <div style={{ fontSize: 72, marginBottom: 12 }}>🌸🎉🌻</div>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: '#FFFFFF', marginBottom: 10 }}>
              Your Garden Bloomed!
            </h2>
            <p style={{ fontSize: 18, color: 'var(--bloom)', fontWeight: 700, maxWidth: 500, marginBottom: 24, lineHeight: 1.5 }}>
              Incredible job, {profile.child_name?.split(' ')[0] || 'Super Reader'}! You bloomed all {totalWords} flowers in your garden today!
            </p>
            <div style={{ display: 'flex', gap: 12, fontSize: 36, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 480 }}>
              {Array.from({ length: totalWords }, (_, i) => (
                <span
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={() => { if (soundEnabled) playCandyTapSound(i) }}
                  onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && soundEnabled) playCandyTapSound(i) }}
                  aria-label={`Celebration flower ${i + 1}`}
                  style={{
                    filter: 'drop-shadow(0 2px 8px rgba(16,185,129,0.85))',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                    touchAction: 'manipulation',
                    display: 'inline-block',
                  }}
                >
                  🌸
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 420 }}>
              <button
                onClick={handleRestartSession}
                disabled={restarting}
                style={{
                  width: '100%', minHeight: 56, padding: '14px 28px',
                  background: 'linear-gradient(135deg, #10B981, #059669)', color: '#FFFFFF',
                  borderRadius: 50, border: 'none', fontSize: 18, fontWeight: 800,
                  cursor: restarting ? 'wait' : 'pointer',
                  boxShadow: '0 8px 24px rgba(16,185,129,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {restarting ? '🔄 Loading fresh words...' : '🌟 Try New Words! 🍬'}
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem('wb_session')
                  router.push('/child/select')
                }}
                style={{
                  width: '100%', minHeight: 48, padding: '12px 24px',
                  background: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF',
                  borderRadius: 50, border: '1.5px solid rgba(255, 255, 255, 0.3)',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <span>🎒</span>
                <span style={{ color: '#FFFFFF', fontWeight: 700 }}>Student Home</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Word display card */}
      <>
          <div
            data-dark-card="true"
            className={`${isSpotlight ? 'spotlight-focus-card' : ''}`}
            style={{
              width: '100%', maxWidth: cardMaxWidth, minHeight: 215,
              background: pendingWord ? 'rgba(16,185,129,0.2)' : (feedback && !feedback?.evaluation?.is_correct ? 'rgba(245,158,11,0.15)' : '#1E293B'),
              border: `2px solid ${pendingWord ? 'var(--bloom)' : (feedback && !feedback?.evaluation?.is_correct ? '#F59E0B' : (isSpotlight ? '#FBBF24' : 'var(--border2)'))}`,
              borderRadius: 22, padding: currentWord.length > 7 ? '2.25rem 2rem' : '2.5rem 2.25rem',
              textAlign: 'center', marginBottom: '1.5rem',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: isSpotlight
                ? '0 0 0 3px rgba(251, 191, 36, 0.5), 0 0 60px rgba(251, 191, 36, 0.28), 0 25px 60px rgba(0, 0, 0, 0.75)'
                : (pendingWord ? '0 10px 30px rgba(16,185,129,0.2)' : (feedback && !feedback?.evaluation?.is_correct ? '0 10px 30px rgba(245,158,11,0.15)' : '0 10px 30px rgba(0,0,0,0.3)')),
              transition: 'all 0.3s ease',
            }}
          >
            {/* Spotlight Focus Badge */}
            {isSpotlight && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(251,191,36,0.18)', border: '1.5px solid rgba(251,191,36,0.5)',
                borderRadius: 20, padding: '5px 16px', marginBottom: '1.25rem',
                fontSize: 12.5, fontWeight: 700, color: '#FDE68A',
                boxShadow: '0 2px 10px rgba(251,191,36,0.25)',
              }}>
                <span>🔦</span>
                <span>Spotlight Focus · Isolated Word Target</span>
              </div>
            )}

            {/* Stage & Category Badge + Hear the Word (with words for voice mode) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(129,140,248,0.14)', border: '1.5px solid rgba(129,140,248,0.45)',
                borderRadius: 24, padding: '8px 20px', maxWidth: '100%',
                boxShadow: '0 4px 14px rgba(129,140,248,0.18)',
              }}>
                <span style={{ fontSize: 15, color: '#F3F4F6', fontWeight: 700 }}>
                  🎯 Stage {profile.reading_level || 1} · {formatCategoryBadge(activeWord?.category, profile.reading_level)}
                </span>
              </div>

              {inputMode === 'voice' && (
                <button
                  type="button"
                  onClick={handleSpeakWord}
                  aria-label="Hear the word spoken aloud"
                  style={{
                    background: 'rgba(129,140,248,0.18)',
                    border: '1.5px solid var(--accent)',
                    borderRadius: 24,
                    padding: '8px 20px',
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#EEF2FF',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 2px 10px rgba(129,140,248,0.25)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>🔊</span>
                  <span>Hear the Word</span>
                </button>
              )}
            </div>

            {/* Letter display — unified, single-line word container dynamically aligned together in box */}
            {(() => {
              const wordLen = currentWord.length || 1
              // Prominent, readable letter sizing so kids can view it with ease
              const fontSize = wordLen <= 3 ? 66 : wordLen <= 4 ? 58 : wordLen <= 6 ? 50 : wordLen <= 8 ? 44 : 40
              const letterSpacing = wordLen <= 4 ? '0.12em' : wordLen <= 7 ? '0.09em' : '0.07em'
              const baselineHeight = wordLen <= 6 ? 4 : 3

              return (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: '100%',
                    margin: '0.5rem 0 1rem',
                    padding: '0.25rem 0.5rem',
                  }}
                >
                  {isNonDyslexic ? (
                    /* Non-dyslexic learner: Natural continuous word typography with comfortable breathing room */
                    <span
                      className="reading-letter"
                      style={{
                        fontSize,
                        fontWeight: 800,
                        color: '#F8FAFC',
                        fontFamily: profile.display_mode === 'opendyslexic' ? "'OpenDyslexic', 'Nunito', sans-serif" : 'var(--font)',
                        letterSpacing,
                        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                        lineHeight: 1.15,
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                      }}
                    >
                      {currentWord}
                    </span>
                  ) : (
                    /* Dyslexic learner: Snug letter colors and baseline guides held together with clear letter definition */
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: wordLen <= 4 ? 6 : wordLen <= 7 ? 4 : 3,
                        flexWrap: 'nowrap',
                      }}
                    >
                      {currentWord.split('').map((letter: string, i: number) => {
                        const color = LETTER_COLOURS[i % LETTER_COLOURS.length]
                        return (
                          <div
                            key={i}
                            style={{
                              display: 'inline-flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <span
                              className="reading-letter"
                              style={{
                                fontSize,
                                fontWeight: 800,
                                color,
                                fontFamily: profile.display_mode === 'opendyslexic' ? "'OpenDyslexic', 'Nunito', sans-serif" : 'var(--font)',
                                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                                lineHeight: 1.15,
                                userSelect: 'none',
                                padding: '0 2px',
                              }}
                            >
                              {letter}
                            </span>
                            {/* Visual weighted baseline anchor line — anchors letters to prevent floating/flipping */}
                            <span
                              style={{
                                width: '90%',
                                height: baselineHeight,
                                borderRadius: 2,
                                background: color,
                                opacity: 0.85,
                                marginTop: 5,
                                boxShadow: `0 1px 6px ${color}88`,
                              }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Generated Visual Hint Card (Shown only when child struggles/retries) */}
            {visualHintB64 && (
              <div style={{ marginTop: '1.25rem', width: '100%', maxWidth: 540 }}>
                {/* Generated Audio scaffold button ONLY for voice mode — simple speaker icon to hear it again */}
                {inputMode === 'voice' && audioScaffoldB64 && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                    <button
                      type="button"
                      onClick={() => playAudioScaffold(audioScaffoldB64, phonicsSpoken || phonicsChunks)}
                      aria-label="Hear sounds again"
                      title="Hear sounds again"
                      style={{
                        background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                        color: '#FFFFFF', border: 'none', borderRadius: '50%',
                        width: 40, height: 40, fontSize: 18,
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 3px 12px rgba(59,130,246,0.35)',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      <span>🔊</span>
                    </button>
                  </div>
                )}

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${visualHintB64}`}
                  alt={`Visual hint for ${currentWord}`}
                  style={{
                    width: '100%', height: 'auto', borderRadius: 14,
                    border: '1.5px solid rgba(59,130,246,0.4)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    display: 'block', margin: '0 auto',
                  }}
                />

                {meaningDesc && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: '8px 14px',
                      borderRadius: 10,
                      background: 'rgba(30, 41, 59, 0.85)',
                      border: '1px solid rgba(59, 130, 246, 0.35)',
                      color: '#E2E8F0',
                      fontSize: 13.5,
                      fontWeight: 600,
                      textAlign: 'center',
                      lineHeight: 1.45,
                    }}
                  >
                    💡 <span style={{ color: '#93C5FD', fontWeight: 700 }}>Meaning:</span> &ldquo;{meaningDesc}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Encouragement message banner — clean, encouraging, neurodiverse-friendly */}
          {feedback?.encouragement?.message && (
            <div
              role="status"
              aria-live="polite"
              className="spotlight-interactive-element"
              style={{
                width: '100%', maxWidth: cardMaxWidth,
                background: visualHintB64
                  ? 'rgba(59, 130, 246, 0.12)'
                  : (feedback.evaluation?.candy_earned || feedback.evaluation?.is_correct)
                  ? 'var(--bloom-bg)'
                  : 'var(--warn-bg)',
                border: `1.5px solid ${visualHintB64 ? 'rgba(59, 130, 246, 0.45)' : (feedback.evaluation?.candy_earned || feedback.evaluation?.is_correct) ? 'rgba(16,185,129,0.4)' : 'rgba(251,191,36,0.4)'}`,
                borderRadius: 'var(--radius)', padding: '16px 20px',
                fontSize: 16, lineHeight: 1.6, fontWeight: 500,
                color: visualHintB64 ? 'var(--accent, #3B82F6)' : (feedback.evaluation?.candy_earned || feedback.evaluation?.is_correct) ? 'var(--bloom-text)' : 'var(--warn-text)',
                marginBottom: '1.25rem',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
                boxShadow: visualHintB64 ? '0 4px 16px rgba(59,130,246,0.18)' : (feedback.evaluation?.candy_earned || feedback.evaluation?.is_correct) ? '0 4px 16px rgba(16,185,129,0.15)' : 'none',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{
                    fontWeight: 800, fontSize: 15,
                    color: (feedback.evaluation?.candy_earned || feedback.evaluation?.is_correct) ? 'var(--bloom-text)' : 'var(--warn-text, #B45309)'
                  }}>
                    {(feedback.evaluation?.candy_earned || feedback.evaluation?.is_correct)
                      ? '🌟 You nailed it!'
                      : visualHintB64
                      ? '🔍 Clue ready!'
                      : '🌱 Nice try!'}
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--white)', marginTop: 2 }}>
                  {(feedback.evaluation?.candy_earned || feedback.evaluation?.is_correct)
                    ? feedback.encouragement.message
                    : visualHintB64
                    ? (inputMode === 'voice')
                      ? (phonicsChunks
                          ? `Listen to the sounds "${phonicsChunks}" and see the clue above. Blend the sounds and let's say it together! 🚀`
                          : `Take a look at the sound blocks and letter shapes above to help you sound it out. Give it another try! 🚀`)
                      : (inputMode === 'tap')
                      ? `Take a peek at the letter blocks above. Tap each tile in order to build '${currentWord}'! 🧩`
                      : `Take another look at the letter pattern above. Type each letter to spell '${currentWord}'! ⌨️`
                    : feedback.encouragement.message}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginTop: 4 }}>
                <button
                  onClick={() => {
                    window.speechSynthesis.cancel()
                    const raw = (feedback.evaluation?.candy_earned || feedback.evaluation?.is_correct)
                      ? (feedback.encouragement.spoken_message || feedback.encouragement.message || '')
                      : visualHintB64
                      ? (inputMode === 'voice'
                          ? (phonicsChunks ? `Listen to the sounds ${phonicsChunks.replace(/\.\.\./g, ' ')} and try saying the word again!` : `Take a look at the sound blocks above to help you sound it out. Give it another try!`)
                          : (inputMode === 'tap'
                              ? `Look at the letter tiles above. Tap each letter block in order to build the word.`
                              : `Look at the visual letter pattern above. Type each letter on your keyboard.`))
                      : (feedback.encouragement.spoken_message || feedback.encouragement.message || '')
                    const spoken = cleanSpokenText(raw)
                    if (!spoken) return
                    const utterance = new SpeechSynthesisUtterance(spoken)
                    utterance.lang = 'en-GB'
                    utterance.rate = 0.85
                    window.speechSynthesis.speak(utterance)
                  }}
                  title="Listen to encouragement"
                  aria-label="Listen to message"
                  style={{
                    background: 'rgba(255,255,255,0.12)', border: 'none',
                    borderRadius: '50%', width: 36, height: 36,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: 16,
                  }}
                >
                  🔊
                </button>
              </div>
            </div>
          )}

          {/* Next Word Action Banner (Child-paced progression — shown when answer was correct) */}
          {pendingWord?.next_word && Boolean(pendingWord?.evaluation?.is_correct) && (
            <div className="spotlight-interactive-element" style={{ width: '100%', maxWidth: cardMaxWidth, marginBottom: '1.25rem' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontSize: 13.5, color: 'var(--white)', marginBottom: 8, padding: '0 6px', fontWeight: 700
              }}>
                <span>🌱 Take your time to celebrate</span>
                <span style={{ fontSize: 13, color: 'var(--bloom-text, #059669)', fontWeight: 800 }}>Tap when you&apos;re ready</span>
              </div>
              <button
                onClick={() => advanceToNextWord(pendingWord.next_word, pendingWord.session_stats)}
                aria-label="Advance to next word"
                autoFocus
                style={{
                  width: '100%', minHeight: 52,
                  background: 'var(--bloom)',
                  color: '#fff',
                  borderRadius: 50, fontSize: 16, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 6px 20px rgba(16,185,129,0.4)',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                }}
              >
                <span>Next Word: <strong>&quot;{pendingWord.next_word.word}&quot;</strong></span>
                <span style={{ fontSize: 20 }}>➔</span>
              </button>
            </div>
          )}

          {/* Input controls — shown ONLY when child is actively answering (hidden when answered correctly and Next Word is ready) */}
          {!isCorrectAnswerPending && (
            <>
              {/* Input mode selector */}
          <div className="spotlight-interactive-element" style={{ width: '100%', maxWidth: cardMaxWidth, marginBottom: '1.5rem' }}>
            <div style={{ fontSize: 16.5, color: 'var(--white)', marginBottom: 12, fontWeight: 700 }}>
              How would you like to answer?
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {['type', 'voice', 'tap'].map(mode => {
                const isSelected = inputMode === mode
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => { setInputMode(mode); setAnswer(''); setTappedLetters([]) }}
                    aria-pressed={isSelected}
                    aria-label={`Switch to ${mode} answer mode`}
                    style={{
                      flex: 1, minHeight: 72, padding: '14px 12px',
                      border: `${isSelected ? '2.5px' : '1.5px'} solid ${isSelected ? 'var(--bloom)' : 'var(--border2)'}`,
                      background: isSelected ? 'var(--bloom-bg)' : 'var(--panel)',
                      color: isSelected ? 'var(--bloom-text)' : 'var(--white)',
                      borderRadius: 'var(--radius)', fontSize: 16, fontWeight: 700,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      boxShadow: isSelected ? '0 4px 14px rgba(16,185,129,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 28 }}>
                      {mode === 'type' ? '⌨️' : mode === 'voice' ? '🎤' : '🔲'}
                    </span>
                    <span>{mode.charAt(0).toUpperCase() + mode.slice(1)} it</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Type input */}
          {inputMode === 'type' && (
            <div className="spotlight-interactive-element" style={{ display: 'flex', gap: 12, width: '100%', maxWidth: cardMaxWidth, marginBottom: '1.5rem' }}>
              <input
                ref={typeInputRef}
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (!loading && !isSubmittingRef.current && !pendingWord && answer.trim()) {
                      handleSubmit()
                    }
                  }
                }}
                onBlur={e => {
                  // If focus moved away due to an accidental click outside (e.g. card padding, empty space),
                  // keep focus locked unless clicking a button or navigation link
                  const related = e.relatedTarget as HTMLElement | null
                  if (!related || (!related.closest('button') && !related.closest('a') && !related.closest('input'))) {
                    requestAnimationFrame(() => {
                      if (inputMode === 'type' && !isCorrectAnswerPending && !showBreak && !goalAchieved && !loading) {
                        typeInputRef.current?.focus()
                      }
                    })
                  }
                }}
                placeholder="Type the word here..."
                aria-label="Type word answer"
                autoFocus
                style={{
                  flex: 1, padding: '16px 20px', fontSize: 26, minHeight: 60,
                  background: 'var(--panel)', border: '1.5px solid var(--border2)',
                  borderRadius: 'var(--radius)', color: 'var(--white)',
                  letterSpacing: 3, fontFamily: 'monospace',
                }}
              />
              <button
                onClick={() => { if (!loading && !isSubmittingRef.current && !pendingWord && answer.trim()) handleSubmit() }}
                disabled={loading || isSubmittingRef.current || Boolean(pendingWord) || !answer.trim()}
                aria-label="Check typed answer"
                style={{
                  padding: '16px 28px', background: 'var(--bloom)',
                  color: '#fff', borderRadius: 'var(--radius)',
                  fontSize: 17.5, fontWeight: 700, minHeight: 60,
                  opacity: loading || !answer.trim() ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                {loading ? '🌸 Blooming your flower...' : 'Check'}
              </button>
            </div>
          )}

          {/* Voice input */}
          {inputMode === 'voice' && (
            <div className="spotlight-interactive-element" style={{ width: '100%', maxWidth: cardMaxWidth, marginBottom: '1.25rem', textAlign: 'center' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {isListening && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -10, left: -10, right: -10, bottom: -10,
                      borderRadius: '50%',
                      border: '3px solid #EF4444',
                      boxShadow: '0 0 20px rgba(239, 68, 68, 0.6)',
                      pointerEvents: 'none',
                    }}
                  />
                )}
                <button
                  type="button"
                  disabled={loading}
                  onClick={startVoiceCapture}
                  aria-label={isListening ? 'Microphone listening, click to stop' : 'Activate microphone to speak word'}
                  style={{
                    width: 88, height: 88, borderRadius: '50%',
                    background: loading
                      ? 'var(--warn)'
                      : isListening
                      ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                      : 'var(--bloom)',
                    border: 'none',
                    fontSize: 36, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto',
                    opacity: loading ? 0.7 : 1,
                    boxShadow: loading
                      ? '0 0 25px rgba(251,191,36,0.6)'
                      : isListening
                      ? '0 0 35px rgba(239,68,68,0.8)'
                      : '0 0 20px rgba(16,185,129,0.4)',
                    transition: 'all 0.25s ease',
                    cursor: loading ? 'wait' : 'pointer',
                  }}
                >
                  {loading ? '✨' : isListening ? '🔴' : '🎤'}
                </button>
              </div>



              <p style={{ marginTop: 12, fontSize: 15, color: isListening ? '#F87171' : 'var(--white)', fontWeight: 700 }}>
                {loading
                  ? '🌸 Blooming your flower...'
                  : isListening
                  ? '🔴 Listening... speak now!'
                  : visualHintB64
                  ? `Now tap 🎤 and say it together: "${currentWord}"!`
                  : 'Press 🎤 and say the word'}
              </p>

              {(interimSpoken || answer) && (
                <div style={{
                  marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)',
                  borderRadius: 16, padding: '4px 14px', color: '#93C5FD', fontSize: 14, fontWeight: 600,
                }}>
                  {isListening && <span style={{ color: '#EF4444' }}>●</span>}
                  <span>{isListening ? `Hearing: "${interimSpoken}"` : `Heard: "${answer}"`}</span>
                </div>
              )}

              {micStatusMsg && !interimSpoken && (
                <p style={{ marginTop: 6, fontSize: 13, color: 'var(--grey)', fontWeight: 600 }}>
                  {micStatusMsg}
                </p>
              )}

              {/* Accessible spoken simulation input / keyboard alternative */}
              <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                <input
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (!loading && !isSubmittingRef.current && !pendingWord && answer.trim()) {
                        handleSubmit(answer)
                      }
                    }
                  }}
                  placeholder="Or type spoken word..."
                  aria-label="Spoken word keyboard alternative"
                  style={{
                    padding: '8px 14px', fontSize: 14,
                    background: 'var(--panel)', border: '1.5px solid var(--border2)',
                    borderRadius: 20, color: 'var(--white)', maxWidth: 220, textAlign: 'center',
                  }}
                />
                <button
                  type="button"
                  onClick={() => { if (!loading && !isSubmittingRef.current && !pendingWord && answer.trim()) handleSubmit(answer) }}
                  disabled={loading || isSubmittingRef.current || Boolean(pendingWord) || !answer.trim()}
                  style={{
                    padding: '8px 16px', background: 'var(--bloom)', color: '#fff',
                    borderRadius: 20, border: 'none', fontSize: 13, fontWeight: 700,
                    cursor: loading || !answer.trim() ? 'default' : 'pointer',
                    opacity: loading || !answer.trim() ? 0.6 : 1,
                  }}
                >
                  Say It 🗣️
                </button>
              </div>
            </div>
          )}

          {/* Tap letters input */}
          {inputMode === 'tap' && (() => {
            const cleanTarget = (currentWord || '').toLowerCase().replace(/[^a-z]/g, '')
            const targetChars = cleanTarget.split('')
            const distractors = ['a', 'e', 'i', 'o', 'u', 's', 't', 'b', 'p', 'm', 'd', 'n', 'c', 'h', 'r', 'l']
            // Build unique tile pool with target letters + 3-4 distractors
            const poolSet = new Set<string>(targetChars)
            for (const d of distractors) {
              if (poolSet.size >= Math.max(targetChars.length + 3, 6)) break
              poolSet.add(d)
            }
            const curatedLetters: string[] = Array.from(poolSet).sort()

            const QWERTY_ROWS = [
              ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
              ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
              ['z', 'x', 'c', 'v', 'b', 'n', 'm']
            ]

            const slotCount = targetChars.length || 1
            const slotWidth = slotCount <= 4 ? 60 : slotCount <= 6 ? 52 : slotCount <= 8 ? 44 : 38
            const slotHeight = slotCount <= 4 ? 68 : slotCount <= 6 ? 60 : slotCount <= 8 ? 52 : 46
            const slotFontSize = slotCount <= 4 ? 30 : slotCount <= 6 ? 26 : slotCount <= 8 ? 22 : 18
            const slotGap = slotCount <= 5 ? 12 : slotCount <= 7 ? 8 : 6

            return (
              <div className="spotlight-interactive-element" style={{ width: '100%', maxWidth: cardMaxWidth, marginBottom: '1.25rem' }}>
                {/* Visual Letter Slots: clearly shows word length and fills as child taps */}
                <div style={{ display: 'flex', gap: slotGap, justifyContent: 'center', alignItems: 'center', marginBottom: 18, flexWrap: 'nowrap', width: '100%', overflowX: 'auto', padding: '6px 2px' }}>
                  {targetChars.map((_, idx) => {
                    const char = tappedLetters[idx] || ''
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (char) {
                            setTappedLetters(prev => prev.filter((_, i) => i !== idx))
                          }
                        }}
                        aria-label={char ? `Slot ${idx + 1}: ${char}, tap to remove` : `Slot ${idx + 1} empty`}
                        style={{
                          width: slotWidth, height: slotHeight, borderRadius: 14, flexShrink: 0,
                          border: `2.5px ${char ? 'solid var(--bloom)' : 'dashed var(--border2)'}`,
                          background: char ? 'rgba(16, 185, 129, 0.18)' : 'rgba(15, 23, 42, 0.45)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: slotFontSize, fontWeight: 800, color: char ? 'var(--bloom-text)' : 'var(--grey)',
                          boxShadow: char ? '0 2px 10px rgba(16,185,129,0.35)' : 'none',
                          cursor: char ? 'pointer' : 'default',
                          touchAction: 'manipulation',
                          transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                      >
                        {char || ''}
                      </button>
                    )
                  })}
                </div>

                {/* Letter Tiles Bank (Curated Scramble or Full Keyboard) */}
                {!showFullKeyboard ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16, justifyContent: 'center' }}>
                    {curatedLetters.map(l => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => {
                          if (tappedLetters.length < targetChars.length) {
                            setTappedLetters(prev => [...prev, l])
                          }
                        }}
                        aria-label={`Letter tile ${l}`}
                        style={{
                          width: 64, height: 64, minWidth: 64, borderRadius: 16,
                          background: 'var(--panel)', border: '2.5px solid var(--border2)',
                          color: 'var(--white)', fontSize: 28, fontWeight: 900,
                          cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                          transition: 'all 0.15s ease', touchAction: 'manipulation',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {l}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setTappedLetters(prev => prev.slice(0, -1))}
                      aria-label="Delete last letter"
                      style={{
                        width: 64, height: 64, minWidth: 64, borderRadius: 16,
                        background: 'rgba(239,68,68,0.18)', border: '2.5px solid rgba(239,68,68,0.45)',
                        color: '#FCA5A5', fontSize: 24, fontWeight: 800,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        touchAction: 'manipulation', boxShadow: '0 4px 12px rgba(239,68,68,0.15)',
                      }}
                    >
                      ⌫
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, alignItems: 'center' }}>
                    {QWERTY_ROWS.map((row, rIdx) => (
                      <div key={rIdx} style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        {row.map(l => (
                          <button
                            key={l}
                            type="button"
                            onClick={() => {
                              if (tappedLetters.length < targetChars.length) {
                                setTappedLetters(prev => [...prev, l])
                              }
                            }}
                            aria-label={`Key ${l}`}
                            style={{
                              minWidth: 42, width: 44, height: 52, borderRadius: 10,
                              background: 'var(--panel)', border: '1.5px solid var(--border2)',
                              color: 'var(--white)', fontSize: 20, fontWeight: 700,
                              cursor: 'pointer', touchAction: 'manipulation',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            {l}
                          </button>
                        ))}
                        {rIdx === 2 && (
                          <button
                            type="button"
                            onClick={() => setTappedLetters(prev => prev.slice(0, -1))}
                            aria-label="Backspace"
                            style={{
                              minWidth: 50, height: 52, borderRadius: 10,
                              background: 'rgba(239,68,68,0.2)', border: '1.5px solid rgba(239,68,68,0.4)',
                              color: '#FCA5A5', fontSize: 20, fontWeight: 800,
                              cursor: 'pointer', touchAction: 'manipulation',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            ⌫
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Keyboard mode toggle & Clear button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '0 4px' }}>
                  <button
                    type="button"
                    onClick={() => setShowFullKeyboard(prev => !prev)}
                    style={{
                      background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', color: 'var(--accent)',
                      fontSize: 14.5, fontWeight: 700, cursor: 'pointer', borderRadius: 8, padding: '8px 16px',
                      display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 40, touchAction: 'manipulation',
                    }}
                  >
                    <span>{showFullKeyboard ? '🔲 Focus on letter bank' : '⌨️ Full A–Z keyboard'}</span>
                  </button>

                  {tappedLetters.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTappedLetters([])}
                      style={{
                        background: 'rgba(148, 163, 184, 0.15)', border: '1.5px solid rgba(148, 163, 184, 0.35)', color: 'var(--white)',
                        fontSize: 14.5, fontWeight: 700, cursor: 'pointer', borderRadius: 8, padding: '8px 16px', minHeight: 40,
                        touchAction: 'manipulation',
                      }}
                    >
                      Clear all ✕
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => { if (!loading && !isSubmittingRef.current && !pendingWord && tappedLetters.length > 0) handleSubmit() }}
                  disabled={loading || isSubmittingRef.current || Boolean(pendingWord) || tappedLetters.length === 0}
                  aria-label="Check tapped word answer"
                  style={{
                    width: '100%', minHeight: 56, padding: '16px 32px', background: 'var(--bloom)',
                    color: '#fff', borderRadius: 50,
                    fontSize: 18, fontWeight: 800,
                    cursor: loading || tappedLetters.length === 0 ? 'default' : 'pointer',
                    opacity: loading || tappedLetters.length === 0 ? 0.6 : 1,
                    boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
                    transition: 'all 0.2s ease', touchAction: 'manipulation',
                  }}
                >
                  {loading ? '🌸 Blooming your flower...' : 'Check Word'}
                </button>
              </div>
            )
          })()}
            </>
          )}

          {/* Skip option if child wants to move to the next word instead of retrying */}
          {feedback && !feedback?.evaluation?.is_correct && !pendingWord && (
            <div className="spotlight-interactive-element" style={{ width: '100%', maxWidth: cardMaxWidth, textAlign: 'center', margin: '0.75rem 0 1.25rem' }}>
              <button
                type="button"
                onClick={handleSkipWord}
                className="btn-skip-word"
                style={{
                  fontSize: 16,
                  cursor: 'pointer',
                  borderRadius: 30,
                  padding: '12px 28px',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  letterSpacing: '0.02em',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>Skip this word for now · Next word</span>
                <span style={{ fontSize: 18, color: '#FCD34D' }}>➔</span>
              </button>
            </div>
          )}

          {/* Calming status pill */}
          <div
            role="status"
            aria-live="polite"
            data-dark-card="true"
            style={{
              fontSize: 14.5, color: '#F8FAFC', fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
              background: '#0F172A', padding: '9px 22px', borderRadius: 24,
              border: '1.5px solid rgba(255,255,255,0.15)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <span style={{ color: loading ? 'var(--bloom)' : 'var(--bloom)', fontSize: 15 }}>●</span>
            <span>{loading ? '🌸 Blooming your flower...' : '✨ Learn at your own pace · No time pressure'}</span>
          </div>
        </>
    </div>
  )
}

export default function GamePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', background: '#06080F', fontSize: 18, fontWeight: 700 }}>
        🌱 Loading WordBloom...
      </div>
    }>
      <GameContent />
    </Suspense>
  )
}
