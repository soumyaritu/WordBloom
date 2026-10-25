'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import DecorativeBackground from '../../../components/DecorativeBackground'

interface ChildProfile {
  id: string
  name: string
  avatar: string
  dyslexia_type: string
  reading_stage: number
  input_mode: string
  conditions?: string[]
}

const FALLBACK_CHILDREN: ChildProfile[] = [
  { id: 'emma',  name: 'Emma Clarke',  avatar: '👧', dyslexia_type: 'Phonological', reading_stage: 3, input_mode: 'voice' },
  { id: 'liam',  name: "Liam O'Connor", avatar: '👦', dyslexia_type: 'Surface',      reading_stage: 2, input_mode: 'tap' },
  { id: 'james', name: 'James Patel',  avatar: '🚀', dyslexia_type: 'Visual/Spatial', reading_stage: 2, input_mode: 'tap' },
  { id: 'sofia', name: 'Sony Mathew',  avatar: '🌟', dyslexia_type: 'Phonological', reading_stage: 2, input_mode: 'voice' },
]

function enrichChildProfiles(baseList: ChildProfile[]): ChildProfile[] {
  if (typeof window === 'undefined') return baseList

  const seenIds = new Set<string>()
  const result: ChildProfile[] = []

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
        if (p.fullName && p.fullName.trim()) child.name = p.fullName.trim()
        if (p.readingLevel !== undefined) child.reading_stage = Number(p.readingLevel)
        if (p.inputMode) child.input_mode = p.inputMode
      }
    } catch (e) {}

    result.push(child)
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
            const p = JSON.parse(raw)
            result.push({
              id,
              name: p.fullName || (id.charAt(0).toUpperCase() + id.slice(1)),
              avatar: id === 'emma' ? '👧' : id === 'liam' ? '👦' : id === 'james' ? '🚀' : id === 'sofia' || id === 'sony' ? '🌟' : '🎨',
              dyslexia_type: p.dyslexiaType || 'Phonological',
              reading_stage: Number(p.readingLevel) || 1,
              input_mode: p.inputMode || 'voice',
            })
          } catch (e) {}
        }
      }
    }
  } catch (e) {}

  return result
}

export default function ChildSelectPage() {
  const router = useRouter()
  const [children, setChildren] = useState<ChildProfile[]>(FALLBACK_CHILDREN)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Immediately enrich fallback children from localStorage
    setChildren(enrichChildProfiles(FALLBACK_CHILDREN))

    // 2. Fetch from /api/children and enrich
    fetch('/api/children')
      .then(res => res.json())
      .then(data => {
        if (data.children && data.children.length > 0) {
          setChildren(enrichChildProfiles(data.children))
        }
      })
      .catch(err => {
        console.error('Failed to load children from /api/children:', err)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSelectChild = (child: ChildProfile) => {
    // Child auth: set currentChild cookie and localStorage on avatar tap
    document.cookie = `currentChild=${encodeURIComponent(child.name)}; path=/; max-age=86400; SameSite=Lax`
    localStorage.setItem('currentChild', JSON.stringify(child))
    localStorage.setItem('wb_selected_child', child.id)

    // Navigate to child welcome screen
    router.push(`/child/session/${child.id}`)
  }

  const getInputIcon = (mode: string) => {
    if (mode === 'voice') return '🎤 Voice'
    if (mode === 'tap') return '🔲 Tap Tiles'
    return '⌨️ Keyboard'
  }

  return (
    <main
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2.5rem 1.5rem',
        overflow: 'hidden',
      }}
    >
      <DecorativeBackground />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 900,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Top Navigation: Back Button */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', marginBottom: '1.5rem' }}>
          <Link
            href="/"
            className="wb-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 50,
              background: 'rgba(255, 255, 255, 0.22)',
              backdropFilter: 'blur(10px)',
              border: '1.5px solid rgba(255, 255, 255, 0.45)',
              color: '#FFFFFF',
              fontSize: '0.95rem',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            ← Back
          </Link>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1
            style={{
              fontSize: '2.75rem',
              fontWeight: 900,
              color: '#FFFFFF',
              textShadow: '0 4px 16px rgba(76, 29, 149, 0.35)',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em',
            }}
          >
            Who’s reading today? 🌸
          </h1>
          <p
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#FEF08A', // Warm yellow
              textShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            Tap your name to start!
          </p>
        </div>

        {/* 2x2 Grid of Child Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.75rem',
            width: '100%',
            maxWidth: 720,
          }}
        >
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => handleSelectChild(child)}
              className="wb-card wb-btn"
              style={{
                background: 'rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '2px solid rgba(255, 255, 255, 0.45)',
                borderRadius: 24,
                padding: '2rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                cursor: 'pointer',
                outline: 'none',
                position: 'relative',
              }}
            >
              {/* Avatar circle with warm yellow child accent */}
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  background: 'rgba(255, 220, 100, 0.32)',
                  border: '3px solid rgba(255, 220, 100, 0.75)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3.25rem',
                  marginBottom: '1rem',
                  boxShadow: '0 8px 20px rgba(251, 191, 36, 0.3)',
                }}
              >
                {child.avatar || '👧'}
              </div>

              {/* Child Name */}
              <h2
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  marginBottom: '0.4rem',
                  textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                {child.name}
              </h2>

              {/* Stage & Input label */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 14px',
                  borderRadius: 20,
                  background: 'rgba(0, 0, 0, 0.22)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  marginTop: '0.5rem',
                }}
              >
                <span>Stage {child.reading_stage}</span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span>{getInputIcon(child.input_mode)}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Friendly instruction footnote */}
        <p
          style={{
            marginTop: '2.5rem',
            fontSize: '0.95rem',
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          No typing or password required. Just tap your picture to begin! 🍬
        </p>
      </div>
    </main>
  )
}
