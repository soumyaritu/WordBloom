'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import DecorativeBackground from '../../../../components/DecorativeBackground'
import { startSession } from '../../../../lib/api'

const AVATAR_MAP: Record<string, string> = {
  emma: '👧',
  liam: '👦',
  james: '🚀',
  sofia: '🌟',
  alex: '🦊',
}

const NAME_MAP: Record<string, string> = {
  emma: 'Emma',
  liam: 'Liam',
  james: 'James',
  sofia: 'Sony',
  alex: 'Alex',
}

export default function ChildWelcomePage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const router = useRouter()
  const resolvedParams = use(params)
  const childId = (resolvedParams.name || 'emma').toLowerCase().trim()

  const [displayName, setDisplayName] = useState(NAME_MAP[childId] || (childId.charAt(0).toUpperCase() + childId.slice(1)))
  const [avatar, setAvatar] = useState(AVATAR_MAP[childId] || '👧')
  const [isBlooming, setIsBlooming] = useState(false)

  useEffect(() => {
    // Check if child profile was stored in localStorage
    const saved = localStorage.getItem('currentChild')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.id === childId || parsed.name.toLowerCase().includes(childId)) {
          setDisplayName(parsed.name.split(' ')[0])
          if (parsed.avatar) setAvatar(parsed.avatar)
        }
      } catch (e) {}
    }

    // Set currentChild cookie for child session
    document.cookie = `currentChild=${encodeURIComponent(displayName)}; path=/; max-age=86400; SameSite=Lax`

    // Always initialize a fresh new session with 0 blooms when starting
    const shouldPrepare = true

    if (shouldPrepare) {
      const defaultStage = childId === 'emma' ? 3 : childId === 'alex' ? 4 : (childId === 'sofia' || childId === 'sony') ? 1 : 2
      let savedProf: any = null
      try {
        const rawProf = localStorage.getItem(`wb_profile_${childId}`) ||
                        (childId === 'sofia' ? localStorage.getItem('wb_profile_sony') : null) ||
                        (childId === 'sony' ? localStorage.getItem('wb_profile_sofia') : null)
        if (rawProf) savedProf = JSON.parse(rawProf)
      } catch (e) {}

      const stage = Number(savedProf?.readingLevel || savedProf?.reading_level || defaultStage)
      const stageFirstWord = stage === 4
        ? { word: 'sunshine', difficulty: 'hard', category: 'compound', audio_hint: 'sun-shine', visual_hint: 'sun·shine', sentence: 'Warm sunshine filled the room.', why_chosen: 'Stage 4 practice' }
        : stage === 3
        ? { word: 'wrist', difficulty: 'medium', category: 'silent letter', audio_hint: 'rist', visual_hint: 'w·r·i·s·t', sentence: 'Wear a watch on your wrist.', why_chosen: 'Stage 3 silent letters practice' }
        : stage === 2
        ? (childId === 'james'
            ? { word: 'star', difficulty: 'medium', category: 'blends', audio_hint: 'star', visual_hint: 's·t·a·r', sentence: 'Look up at the bright twinkling star.', why_chosen: 'Stage 2 practice' }
            : { word: 'frog', difficulty: 'medium', category: 'blends', audio_hint: 'frog', visual_hint: 'f·r·o·g', sentence: 'The green frog jumped in the pond.', why_chosen: 'Stage 2 practice' })
        : { word: 'sun', difficulty: 'easy', category: 'CVC', audio_hint: 'sun', visual_hint: 's·u·n', sentence: 'The warm sun is shining bright.', why_chosen: 'Stage 1 practice' }

      const instantSession = {
        session_id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        profile: {
          child_id: childId,
          child_name: savedProf?.fullName || displayName,
          reading_level: stage,
          reading_stage: stage,
          dyslexia_type: savedProf?.dyslexiaType || (childId === 'alex' ? 'non_dyslexic' : childId === 'liam' ? 'surface' : childId === 'james' ? 'visual/spatial' : (childId === 'sofia' || childId === 'sony') ? 'unknown' : 'phonological'),
          input_mode: savedProf?.inputMode || (childId === 'emma' ? 'voice' : (childId === 'liam' || childId === 'james') ? 'tap' : 'type'),
          display_mode: savedProf?.displayMode || ((childId === 'liam' || childId === 'alex' || childId === 'sofia' || childId === 'sony') ? 'standard' : 'opendyslexic'),
          colour_overlay: savedProf?.colourOverlay || (childId === 'emma' ? 'yellow' : childId === 'james' ? 'yellow' : (childId === 'sofia' || childId === 'sony') ? 'blue' : 'none'),
          session_length: Number(savedProf?.sessionLength || ((childId === 'emma' || childId === 'sofia' || childId === 'sony' || childId === 'liam') ? 5 : 10)),
          candy_goal: Number(savedProf?.candyGoal || (childId === 'alex' ? 4 : (childId === 'emma' || childId === 'sofia' || childId === 'sony' || childId === 'liam') ? 5 : 8)),
          break_after: Number(savedProf?.breakAfter || ((childId === 'emma' || childId === 'sofia' || childId === 'sony' || childId === 'liam') ? 5 : 10)),
        },
        current_word: stageFirstWord,
        words_done: [],
        words_correct: [],
        start_time: Date.now(),
        stats: { words_done: 0, words_correct: 0, accuracy: 0 },
      }
      localStorage.setItem('wb_session', JSON.stringify(instantSession))
    }

    // Prefetch official backend session asynchronously in background
    startSession(childId).then(data => {
      if (data?.session_id) {
        let savedProf: any = null
        try {
          const rawProf = localStorage.getItem(`wb_profile_${childId}`)
          if (rawProf) savedProf = JSON.parse(rawProf)
        } catch (e) {}
        const localStage = savedProf?.readingLevel ? Number(savedProf.readingLevel) : null
        const backendStage = Number(data.profile?.reading_level || data.profile?.reading_stage || 1)
        const resolvedStage = localStage || backendStage
        const stageMatchedWord = (localStage && localStage !== backendStage)
          ? (localStage === 4
              ? { word: 'sunshine', difficulty: 'hard', category: 'compound', audio_hint: 'sun-shine', visual_hint: 'sun·shine', sentence: 'Warm sunshine filled the room.', why_chosen: 'Stage 4 practice' }
              : localStage === 3
              ? { word: 'wrist', difficulty: 'medium', category: 'silent letter', audio_hint: 'rist', visual_hint: 'w·r·i·s·t', sentence: 'Wear a watch on your wrist.', why_chosen: 'Stage 3 silent letters practice' }
              : localStage === 2
              ? { word: 'frog', difficulty: 'medium', category: 'blends', audio_hint: 'frog', visual_hint: 'f·r·o·g', sentence: 'The green frog jumped in the pond.', why_chosen: 'Stage 2 practice' }
              : { word: 'sun', difficulty: 'easy', category: 'CVC', audio_hint: 'sun', visual_hint: 's·u·n', sentence: 'The warm sun is shining bright.', why_chosen: 'Stage 1 practice' })
          : data.first_word

        localStorage.setItem('wb_session', JSON.stringify({
          session_id:   data.session_id,
          profile:      {
            ...data.profile,
            child_id: childId,
            reading_level: resolvedStage,
            reading_stage: resolvedStage,
            ...(savedProf?.inputMode ? { input_mode: savedProf.inputMode } : {}),
            ...(savedProf?.displayMode ? { display_mode: savedProf.displayMode } : {}),
            ...(savedProf?.colourOverlay ? { colour_overlay: savedProf.colourOverlay } : {}),
            ...(savedProf?.dyslexiaType ? { dyslexia_type: savedProf.dyslexiaType } : {}),
          },
          current_word: stageMatchedWord,
          words_done:   [],
          words_correct: [],
          start_time:   Date.now(),
          stats: { words_done: 0, words_correct: 0, accuracy: 0 },
        }))
      }
    }).catch(() => {})
  }, [childId, displayName])

  const handleStartGame = () => {
    // Joyful 1.2s blooming transition
    setIsBlooming(true)
    setTimeout(() => {
      router.push(`/game?child=${childId}`)
    }, 1200)
  }

  return (
    <main
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        overflow: 'hidden',
      }}
    >
      <DecorativeBackground />

      {/* Playful Garden Blooming Transition Overlay */}
      {isBlooming && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.28) 0%, rgba(6, 8, 15, 0.98) 75%)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '2rem',
            animation: 'fadeIn 0.25s ease-out forwards',
          }}
        >
          {/* Animated Blooming Flower Icon */}
          <div
            style={{
              fontSize: '5.5rem',
              marginBottom: '1.5rem',
              animation: 'bloomPulse 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) infinite',
              filter: 'drop-shadow(0 0 30px rgba(236, 72, 153, 0.55))',
            }}
          >
            🌸
          </div>

          <h2
            style={{
              fontSize: '2.25rem',
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              marginBottom: '0.75rem',
              textShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
            }}
          >
            Getting your garden ready... 🌸
          </h2>

          <p
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#A7F3D0',
              marginBottom: '2rem',
            }}
          >
            Blooming words for {displayName}! ✨
          </p>

          {/* Dancing Garden Flowers Row */}
          <div
            style={{
              display: 'flex',
              gap: '1.25rem',
              fontSize: '2.1rem',
              padding: '12px 28px',
              borderRadius: 40,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
            }}
          >
            <span style={{ animation: 'bounce 0.8s infinite alternate ease-in-out', animationDelay: '0s' }}>🌸</span>
            <span style={{ animation: 'bounce 0.8s infinite alternate ease-in-out', animationDelay: '0.15s' }}>🌼</span>
            <span style={{ animation: 'bounce 0.8s infinite alternate ease-in-out', animationDelay: '0.3s' }}>🌻</span>
            <span style={{ animation: 'bounce 0.8s infinite alternate ease-in-out', animationDelay: '0.45s' }}>🌷</span>
            <span style={{ animation: 'bounce 0.8s infinite alternate ease-in-out', animationDelay: '0.6s' }}>🌸</span>
          </div>

          <style jsx>{`
            @keyframes bloomPulse {
              0% { transform: scale(0.85) rotate(-6deg); }
              50% { transform: scale(1.18) rotate(6deg); }
              100% { transform: scale(1) rotate(0deg); }
            }
            @keyframes bounce {
              0% { transform: translateY(0); }
              100% { transform: translateY(-8px); }
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
        </div>
      )}

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 860,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Top Switcher Button Row */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%', marginBottom: '1.25rem' }}>
          <Link
            href="/child/select"
            className="wb-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 24px',
              borderRadius: 30,
              background: 'rgba(255, 255, 255, 0.22)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1.5px solid rgba(255, 255, 255, 0.4)',
              color: '#FFFFFF',
              fontSize: '1.05rem',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            }}
          >
            ← Change Reader
          </Link>
        </div>

        {/* Welcome Card */}
        <div
          className="wb-card"
          style={{
            background: 'rgba(255, 255, 255, 0.22)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '2.5px solid rgba(255, 255, 255, 0.45)',
            borderRadius: 32,
            padding: '3.5rem 2.5rem',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.2)',
          }}
        >
          {/* Big Avatar Emoji */}
          <div
            style={{
              width: 130,
              height: 130,
              borderRadius: '50%',
              background: 'rgba(255, 220, 100, 0.35)',
              border: '4px solid rgba(255, 220, 100, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '4.5rem',
              marginBottom: '1.75rem',
              boxShadow: '0 12px 32px rgba(251, 191, 36, 0.35)',
            }}
          >
            {avatar}
          </div>

          {/* Heading: Hi, [Name]! 👋 */}
          <h1
            style={{
              fontSize: '3rem',
              fontWeight: 900,
              color: '#FFFFFF',
              textShadow: '0 4px 16px rgba(76, 29, 149, 0.4)',
              marginBottom: '0.75rem',
              letterSpacing: '-0.02em',
            }}
          >
            Hi, {displayName}! 👋
          </h1>

          {/* Prompt: Ready to help your garden bloom today? */}
          <p
            style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              color: '#FEF08A', // Warm yellow
              textShadow: '0 2px 8px rgba(0,0,0,0.25)',
              maxWidth: 440,
              lineHeight: 1.5,
              marginBottom: '2.5rem',
            }}
          >
            Ready to help your garden bloom today? 🌸
          </p>

          {/* Large floral green-to-pink gradient “🌸 Start Blooming!” button */}
          <button
            onClick={handleStartGame}
            className="wb-btn"
            style={{
              padding: '1.1rem 3.25rem',
              fontSize: '1.45rem',
              fontWeight: 900,
              borderRadius: 60,
              border: '2px solid rgba(255, 255, 255, 0.6)',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 45%, #ec4899 100%)',
              color: '#FFFFFF',
              boxShadow: '0 12px 30px rgba(16, 185, 129, 0.45)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: '2.5rem',
            }}
          >
            🌸 Start Blooming!
          </button>

          {/* Row of 5 blooming flower emojis at the bottom */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              padding: '12px 24px',
              borderRadius: 30,
              background: 'rgba(0, 0, 0, 0.18)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              fontSize: '1.85rem',
              userSelect: 'none',
            }}
          >
            <span role="img" aria-label="flower">🌸</span>
            <span role="img" aria-label="flower">🌼</span>
            <span role="img" aria-label="flower">🌻</span>
            <span role="img" aria-label="flower">🌷</span>
            <span role="img" aria-label="flower">🌸</span>
          </div>
        </div>

        {/* Child-friendly reassuring note */}
        <p
          style={{
            marginTop: '2rem',
            fontSize: '1.15rem',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: 700,
          }}
        >
          No rush, no timer. Read at your own pace! ✨
        </p>
      </div>
    </main>
  )
}
