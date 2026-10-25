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
  const [starting, setStarting] = useState(false)

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
  }, [childId, displayName])

  const handleStartGame = async () => {
    setStarting(true)
    try {
      const data = await startSession(childId)
      // Save session in localStorage for existing game engine
      localStorage.setItem('wb_session', JSON.stringify({
        session_id:   data.session_id,
        profile:      { ...data.profile, child_id: childId },
        current_word: data.first_word,
        words_done:   [],
        words_correct: [],
        start_time:   Date.now(),
        stats: { words_done: 0, words_correct: 0, accuracy: 0 },
      }))

      router.push(`/game?child=${childId}`)
    } catch (err) {
      console.error('Error starting reading session:', err)
      // Fallback: still navigate to game page with child query
      router.push(`/game?child=${childId}`)
    }
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
            disabled={starting}
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
              cursor: starting ? 'not-allowed' : 'pointer',
              opacity: starting ? 0.75 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: '2.5rem',
            }}
          >
            {starting ? 'Getting your garden ready... 🌸' : '🌸 Start Blooming!'}
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
