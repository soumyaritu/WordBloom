'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { submitAnswer, endSession } from '../../lib/api'

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

export default function GamePage() {
  const router  = useRouter()
  const [session,       setSession]       = useState<any>(null)
  const [activeWord,    setActiveWord]    = useState<any>(null)
  const [pendingWord,   setPendingWord]   = useState<any>(null)
  const [answer,        setAnswer]        = useState('')
  const [tappedLetters, setTappedLetters] = useState<string[]>([])
  const [loading,       setLoading]       = useState(false)
  const [feedback,      setFeedback]      = useState<any>(null)
  const [showBreak,     setShowBreak]     = useState(false)
  const [inputMode,     setInputMode]     = useState('type')
  const [readingTimeLeft, setReadingTimeLeft] = useState<number | null>(null)
  const startTime = useRef(Date.now())
  const transitionTimerRef = useRef<any>(null)
  const countdownIntervalRef = useRef<any>(null)

  useEffect(() => {
    const raw = localStorage.getItem('wb_session')
    if (!raw) { router.push('/'); return }
    const s = JSON.parse(raw)
    setSession(s)
    setActiveWord(s.current_word)
    setInputMode(s.profile?.input_mode || 'type')
    setFeedback(null)
    setPendingWord(null)

    return () => {
      document.body.className = ''
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [])

  const currentWord = activeWord?.word || session?.current_word?.word || ''
  const profile     = session?.profile || {}
  const stats       = session?.stats   || {}

  // Advances session to the next word cleanly
  const advanceToNextWord = (nextWordObj: any, nextStats: any) => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    setReadingTimeLeft(null)

    if (!nextWordObj) return
    const updated = {
      ...session,
      current_word: nextWordObj,
      stats:        nextStats || session.stats,
    }
    localStorage.setItem('wb_session', JSON.stringify(updated))
    setSession(updated)
    setActiveWord(nextWordObj)
    setPendingWord(null)
    setFeedback(null)
    setAnswer('')
    setTappedLetters([])
  }

  const handleSubmit = async (overrideAnswer?: string) => {
    const userAnswer = overrideAnswer !== undefined
      ? overrideAnswer
      : (inputMode === 'tap' ? tappedLetters.join('') : answer)
    if (!userAnswer.trim()) return

    setLoading(true)
    const elapsed = (Date.now() - startTime.current) / 1000
    startTime.current = Date.now()

    try {
      const result = await submitAnswer(
        session.session_id,
        userAnswer,
        elapsed,
        inputMode,
      )

      setFeedback(result)
      setAnswer('')
      setTappedLetters([])

      // End session if over
      if (result.adaptation?.session_over) {
        const endResult = await endSession(session.session_id)
        localStorage.setItem('wb_report', JSON.stringify(endResult.report))
        router.push('/teacher')
        return
      }

      // Show break if needed
      if (result.adaptation?.action === 'take_break') {
        setShowBreak(true)
        setTimeout(() => setShowBreak(false), 30000)
      }

      // Store pending next word & schedule smooth transition after reading time
      if (result.next_word) {
        setPendingWord(result)

        // Dedicated reading time of 12 seconds
        const readTimeSec = 12
        setReadingTimeLeft(readTimeSec)

        if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current)
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)

        let secs = readTimeSec
        countdownIntervalRef.current = setInterval(() => {
          secs -= 1
          setReadingTimeLeft(secs)
          if (secs <= 0) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
          }
        }, 1000)

        transitionTimerRef.current = setTimeout(() => {
          advanceToNextWord(result.next_word, result.session_stats)
        }, readTimeSec * 1000)
      }

    } catch (e) {
      console.error(e)
    }

    setLoading(false)
  }

  const handleEndSession = async () => {
    try {
      const result = await endSession(session.session_id)
      localStorage.setItem('wb_report', JSON.stringify(result.report))
      router.push('/teacher')
    } catch (e) {
      router.push('/teacher')
    }
  }

  if (!session) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--grey)' }}>
      Loading session...
    </div>
  )

  // Candy rewards display (playful & encouraging for children, dyscalculia-friendly)
  const totalWords = profile.session_length === 5 ? 5 : 10
  const correctCount = stats.words_correct || 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1.5rem', minHeight: '100vh' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 460, marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'var(--bloom)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 700, color: '#fff',
          }}>
            {profile.child_name?.charAt(0) || 'E'}
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--white)' }}>
            {profile.child_name?.split(' ')[0] || 'Emma'}
          </span>
        </div>

        {/* Candies Reward Counter */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(244,114,182,0.15)', border: '1.5px solid rgba(244,114,182,0.45)',
            padding: '6px 14px', borderRadius: 24,
            boxShadow: '0 4px 14px rgba(244,114,182,0.2)',
          }}
          aria-label={`${correctCount} out of ${totalWords} candies earned`}
        >
          {Array.from({ length: totalWords }, (_, i) => (
            <span
              key={i}
              style={{
                fontSize: 20,
                opacity: i < correctCount ? 1 : 0.25,
                filter: i < correctCount ? 'drop-shadow(0 2px 6px rgba(244,114,182,0.6))' : 'grayscale(1)',
                transform: i < correctCount ? 'scale(1.15)' : 'scale(0.85)',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              🍬
            </span>
          ))}
        </div>

        <button
          onClick={handleEndSession}
          aria-label="End learning session"
          style={{
            background: 'rgba(239,68,68,0.15)', color: '#FCA5A5',
            fontSize: 14, minHeight: 44, padding: '8px 20px',
            border: '1.5px solid rgba(239,68,68,0.5)', borderRadius: 24,
            fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 14px rgba(239,68,68,0.25)',
            transition: 'all 0.2s ease',
          }}
        >
          <span>🛑</span>
          <span>End Session</span>
        </button>
      </div>

      {/* Break banner (Non-blocking) */}
      {showBreak && (
        <div style={{
          width: '100%', maxWidth: 460, padding: '1.25rem 1.5rem',
          background: 'rgba(251,191,36,0.12)', border: '1.5px solid rgba(251,191,36,0.4)',
          borderRadius: 16, textAlign: 'center', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#FBBF24', marginBottom: 2 }}>☕ Time for a 30s break!</div>
            <div style={{ fontSize: 13, color: '#CBD5E1' }}>Stretch your arms & rest your eyes.</div>
          </div>
          <button
            onClick={() => setShowBreak(false)}
            style={{
              background: 'var(--warn)', color: '#0F172A',
              minHeight: 40, padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 700,
              border: 'none', cursor: 'pointer', flexShrink: 0,
            }}
          >
            Skip Break 🚀
          </button>
        </div>
      )}

      {/* Word display card */}
      <>
          <div style={{
            width: '100%', maxWidth: 460,
            background: pendingWord ? (pendingWord.evaluation?.is_correct ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)') : 'var(--panel)',
            border: `2px solid ${pendingWord ? (pendingWord.evaluation?.is_correct ? 'var(--bloom)' : '#F59E0B') : 'var(--border2)'}`,
            borderRadius: 18, padding: '2rem 1.5rem', textAlign: 'center', marginBottom: '1.25rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)', transition: 'all 0.3s ease',
          }}>
            {/* Agent Highlight Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
              background: 'rgba(129,140,248,0.15)', border: '1.5px solid rgba(129,140,248,0.45)',
              borderRadius: 24, padding: '6px 14px', marginBottom: '1.25rem',
              boxShadow: '0 4px 12px rgba(129,140,248,0.2)',
            }}>
              <span style={{
                background: '#818CF8', color: '#0F172A',
                fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 12,
                letterSpacing: 0.5, textTransform: 'uppercase',
                boxShadow: '0 2px 6px rgba(129,140,248,0.4)',
              }}>
                📖 Word Selector Agent
              </span>
              <span style={{ fontSize: 13, color: '#F3F4F6', fontWeight: 600 }}>
                {activeWord?.why_chosen || 'Selected for your reading level'}
              </span>
            </div>

            {/* Audio hint button */}
            {(profile.approach === 'audio_first' || profile.input_mode === 'voice') && (
              <button
                onClick={() => {
                  const rawHint = activeWord?.audio_hint || ''
                  let textToSpeak = currentWord
                  if (rawHint && !/^[a-z]-[a-z]-[a-z]$/i.test(rawHint)) {
                    textToSpeak = rawHint
                      .replace(/ī/g, 'eye')
                      .replace(/\bn-i-t\b/gi, 'night')
                      .replace(/ā/g, 'ay')
                      .replace(/ē/g, 'ee')
                      .replace(/ō/g, 'oh')
                      .replace(/ū/g, 'oo')
                      .replace(/[^\w\s-]/g, '')
                  }
                  const utterance = new SpeechSynthesisUtterance(textToSpeak)
                  utterance.lang = 'en-GB'
                  utterance.rate = 0.7
                  speechSynthesis.speak(utterance)
                }}
                aria-label="Listen to word sounds"
                style={{
                  background: 'var(--accent-bg)', border: '1.5px solid var(--accent)',
                  borderRadius: 24, minHeight: 48, padding: '10px 20px', fontSize: 14,
                  color: 'var(--accent-light)', marginBottom: '1.5rem', fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}
              >
                🔊 Hear the word first
              </button>
            )}

            {/* High-Contrast Coloured letters */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', margin: '0.5rem 0 1rem' }}>
              {currentWord.split('').map((letter: string, i: number) => (
                <span
                  key={i}
                  style={{
                    fontSize: 48, fontWeight: 600,
                    color: LETTER_COLOURS[i % LETTER_COLOURS.length],
                    fontFamily: profile.display_mode === 'opendyslexic' ? 'Arial' : 'monospace',
                    letterSpacing: 4, textShadow: '0 2px 10px rgba(0,0,0,0.4)',
                  }}
                >
                  {letter}
                </span>
              ))}
            </div>

            {/* Visual hint */}
            {activeWord?.visual_hint && (
              <div style={{ fontSize: 15, color: '#CBD5E1', marginTop: '0.75rem', fontWeight: 500, letterSpacing: 2 }}>
                {activeWord.visual_hint}
              </div>
            )}
          </div>

          {/* Encouragement message banner */}
          {feedback?.encouragement?.message && (
            <div
              role="status"
              aria-live="polite"
              style={{
                width: '100%', maxWidth: 460,
                background: feedback.evaluation?.is_correct ? 'var(--bloom-bg)' : 'var(--warn-bg)',
                border: `1.5px solid ${feedback.evaluation?.is_correct ? 'rgba(16,185,129,0.4)' : 'rgba(251,191,36,0.4)'}`,
                borderRadius: 'var(--radius)', padding: '14px 18px',
                fontSize: 15, lineHeight: 1.6, fontWeight: 500,
                color: feedback.evaluation?.is_correct ? '#34D399' : '#FBBF24',
                marginBottom: '1.25rem',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{
                    background: feedback.evaluation?.is_correct ? '#10B981' : '#F59E0B',
                    color: '#0F172A', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10,
                    textTransform: 'uppercase', letterSpacing: 0.5
                  }}>
                    💚 Encouragement Agent
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>
                    {feedback.evaluation?.is_correct ? '✅ Correct!' : '💡 Keep trying!'}
                  </span>
                </div>
                <div>{feedback.encouragement.message}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginTop: 2 }}>
                <button
                  onClick={() => {
                    const utterance = new SpeechSynthesisUtterance(feedback.encouragement.message)
                    utterance.lang = 'en-GB'
                    utterance.rate = 0.8
                    speechSynthesis.speak(utterance)
                  }}
                  title="Listen to encouragement"
                  aria-label="Listen to message"
                  style={{
                    background: 'rgba(255,255,255,0.12)', border: 'none',
                    borderRadius: '50%', width: 34, height: 34,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: 15,
                  }}
                >
                  🔊
                </button>
              </div>
            </div>
          )}

          {/* Next Word Action Banner (Appears when answer completed) */}
          {pendingWord?.next_word && (
            <div style={{ width: '100%', maxWidth: 460, marginBottom: '1.25rem' }}>
              {readingTimeLeft !== null && readingTimeLeft > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontSize: 13, color: '#CBD5E1', marginBottom: 8, padding: '0 4px', fontWeight: 500
                }}>
                  <span>📖 Reading time: <strong>{readingTimeLeft}s</strong> to read feedback</span>
                  <span style={{ fontSize: 12, color: 'var(--grey)' }}>Auto-advancing...</span>
                </div>
              )}
              <button
                onClick={() => advanceToNextWord(pendingWord.next_word, pendingWord.session_stats)}
                aria-label="Advance to next word"
                style={{
                  width: '100%', minHeight: 52,
                  background: pendingWord?.evaluation?.is_correct ? 'var(--bloom)' : '#F59E0B',
                  color: pendingWord?.evaluation?.is_correct ? '#fff' : '#0F172A',
                  borderRadius: 50, fontSize: 16, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: pendingWord?.evaluation?.is_correct ? '0 6px 20px rgba(16,185,129,0.4)' : '0 6px 20px rgba(245,158,11,0.4)',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                }}
              >
                <span>{pendingWord?.evaluation?.is_correct ? 'Next Word' : 'Try Next Word'}: <strong>"{pendingWord.next_word.word}"</strong></span>
                <span style={{ fontSize: 20 }}>➔</span>
              </button>
            </div>
          )}

          {/* Input mode selector */}
          <div style={{ width: '100%', maxWidth: 460, marginBottom: '1rem' }}>
            <div style={{ fontSize: 13, color: 'var(--grey)', marginBottom: 10, fontWeight: 500 }}>
              How would you like to answer?
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {['type', 'voice', 'tap'].map(mode => (
                <button
                  key={mode}
                  onClick={() => { setInputMode(mode); setAnswer(''); setTappedLetters([]) }}
                  aria-pressed={inputMode === mode}
                  style={{
                    flex: 1, minHeight: 54, padding: '10px 8px',
                    border: `${inputMode === mode ? '2px' : '1px'} solid ${inputMode === mode ? 'var(--bloom)' : 'var(--border)'}`,
                    background: inputMode === mode ? 'var(--bloom-bg)' : 'var(--panel)',
                    color: inputMode === mode ? '#34D399' : 'var(--white)',
                    borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}
                >
                  <span style={{ fontSize: 22 }}>
                    {mode === 'type' ? '⌨️' : mode === 'voice' ? '🎤' : '🔲'}
                  </span>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)} it
                </button>
              ))}
            </div>
          </div>

          {/* Type input */}
          {inputMode === 'type' && (
            <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 460, marginBottom: '1.25rem' }}>
              <input
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
                placeholder="Type the word here..."
                aria-label="Type word answer"
                autoFocus
                style={{
                  flex: 1, padding: '14px 18px', fontSize: 22,
                  background: 'var(--panel)', border: '1.5px solid var(--border2)',
                  borderRadius: 'var(--radius)', color: 'var(--white)',
                  letterSpacing: 3, fontFamily: 'monospace',
                }}
              />
              <button
                onClick={() => handleSubmit()}
                disabled={loading || !answer.trim()}
                aria-label="Check typed answer"
                style={{
                  padding: '14px 24px', background: 'var(--bloom)',
                  color: '#fff', borderRadius: 'var(--radius)',
                  fontSize: 15, fontWeight: 700, minHeight: 52,
                  opacity: loading || !answer.trim() ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                {loading ? '✨ Checking...' : 'Check'}
              </button>
            </div>
          )}

          {/* Voice input */}
          {inputMode === 'voice' && (
            <div style={{ width: '100%', maxWidth: 460, marginBottom: '1.25rem', textAlign: 'center' }}>
              <button
                disabled={loading}
                onClick={() => {
                  if (!('webkitSpeechRecognition' in window)) {
                    alert('Voice input requires Chrome browser')
                    return
                  }
                  const recognition = new (window as any).webkitSpeechRecognition()
                  recognition.lang = 'en-GB'
                  recognition.onresult = (e: any) => {
                    const spoken = e.results[0][0].transcript
                    setAnswer(spoken)
                    handleSubmit(spoken)
                  }
                  recognition.start()
                }}
                aria-label="Activate microphone to speak word"
                style={{
                  width: 88, height: 88, borderRadius: '50%',
                  background: loading ? 'var(--warn)' : 'var(--bloom)', border: 'none',
                  fontSize: 36, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: loading ? '0 0 25px rgba(251,191,36,0.6)' : '0 0 20px rgba(16,185,129,0.4)',
                  transition: 'all 0.3s ease',
                  cursor: loading ? 'wait' : 'pointer',
                }}
              >
                {loading ? '✨' : '🎤'}
              </button>
              <p style={{ marginTop: 14, fontSize: 14, color: 'var(--white)', fontWeight: 500 }}>
                {loading ? 'Evaluating spoken word...' : 'Press and say the word'}
              </p>
              {answer && (
                <p style={{ marginTop: 8, fontSize: 17, color: 'var(--white)', fontWeight: 600 }}>
                  Heard: "{answer}"
                </p>
              )}
            </div>
          )}

          {/* Tap letters input */}
          {inputMode === 'tap' && (
            <div style={{ width: '100%', maxWidth: 460, marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14, justifyContent: 'center' }}>
                {'abcdefghiklmnoprstuw'.split('').map(l => (
                  <button
                    key={l}
                    onClick={() => setTappedLetters(prev => [...prev, l])}
                    aria-label={`Letter ${l}`}
                    style={{
                      width: 48, height: 48, borderRadius: 10,
                      background: 'var(--panel)', border: '1.5px solid var(--border2)',
                      color: 'var(--white)', fontSize: 18, fontWeight: 600,
                    }}
                  >
                    {l}
                  </button>
                ))}
                <button
                  onClick={() => setTappedLetters(prev => prev.slice(0, -1))}
                  aria-label="Delete last letter"
                  style={{
                    width: 48, height: 48, borderRadius: 10,
                    background: 'rgba(239,68,68,0.15)', border: '1.5px solid rgba(239,68,68,0.4)',
                    color: '#FCA5A5', fontSize: 18, fontWeight: 700,
                  }}
                >
                  ⌫
                </button>
              </div>
              <div style={{ fontSize: 26, letterSpacing: 4, fontFamily: 'monospace', minHeight: 40, color: 'var(--white)', marginBottom: 14, textAlign: 'center' }}>
                {tappedLetters.join('') || <span style={{ color: 'var(--grey)', fontSize: 15 }}>Tap letters to build the word</span>}
              </div>
              <button
                onClick={() => handleSubmit()}
                disabled={loading || tappedLetters.length === 0}
                aria-label="Check tapped word answer"
                style={{
                  width: '100%', minHeight: 52, padding: '14px 32px', background: 'var(--bloom)',
                  color: '#fff', borderRadius: 50,
                  fontSize: 16, fontWeight: 700,
                  opacity: loading || tappedLetters.length === 0 ? 0.6 : 1,
                }}
              >
                {loading ? '✨ Checking word...' : 'Check word'}
              </button>
            </div>
          )}

          {/* Live Agent status */}
          <div
            role="status"
            aria-live="polite"
            style={{
              fontSize: 12, color: 'var(--white)', fontWeight: 500,
              display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
              background: 'var(--surface)', padding: '10px 18px', borderRadius: 24,
              border: '1.5px solid var(--border)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <span style={{ color: loading ? 'var(--warn)' : 'var(--bloom)', fontSize: 14 }}>●</span>
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ background: '#38BDF8', color: '#0F172A', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10, letterSpacing: 0.5 }}>
                  🔍 Evaluator Agent
                </span>
                <span>&amp;</span>
                <span style={{ background: '#818CF8', color: '#0F172A', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10, letterSpacing: 0.5 }}>
                  📖 Word Selector Agent
                </span>
                <span style={{ color: 'var(--grey)' }}>evaluating in parallel...</span>
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.4)', color: '#38BDF8', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                  🔍 Evaluator Agent
                </span>
                <span style={{ color: 'var(--grey)' }}>watching</span>
                <span style={{ color: 'var(--border2)' }}>·</span>
                <span style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)', color: '#FCD34D', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                  ⚡ Adapter Agent
                </span>
                <span style={{ color: 'var(--grey)' }}>on standby</span>
                <span style={{ color: 'var(--border2)' }}>·</span>
                <span style={{ color: 'var(--grey)' }}>No timer running</span>
              </span>
            )}
          </div>
        </>
    </div>
  )
}
