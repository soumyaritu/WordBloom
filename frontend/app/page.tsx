'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import DecorativeBackground from '../components/DecorativeBackground'

export default function LandingPage() {
  useEffect(() => {
    // Eager background warmup ping for the backend API
    fetch('/api/backend/', { method: 'GET' }).catch(() => {})
  }, [])
  return (
    <main
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        overflow: 'hidden',
      }}
    >
      <DecorativeBackground />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 960,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Bouncing 🌸 logo animation on landing */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div
            className="bouncing-logo"
            style={{
              fontSize: '4.5rem',
              filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.2))',
              userSelect: 'none',
            }}
          >
            🌸
          </div>
        </div>

        {/* WordBloom Brand Title & Tagline */}
        <h1
          style={{
            fontSize: '3.25rem',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            color: '#FFFFFF',
            textShadow: '0 4px 16px rgba(76, 29, 149, 0.4)',
            marginBottom: '0.5rem',
          }}
        >
          WordBloom
        </h1>

        <p
          style={{
            fontSize: '1.15rem',
            fontWeight: 800,
            color: '#FDF4FF',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textShadow: '0 2px 8px rgba(0,0,0,0.25)',
            marginBottom: '1rem',
          }}
        >
          Every word. Every child. Every way.
        </p>

        <p
          style={{
            fontSize: '1.05rem',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.92)',
            maxWidth: 580,
            lineHeight: 1.6,
            marginBottom: '3rem',
            textShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
        >
          An adaptive early word learning companion helping every child bloom at their own pace.
          <br />
          Select your portal to begin!
        </p>

        {/* Two large cards side by side */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            width: '100%',
            maxWidth: 820,
          }}
        >
          {/* Card 1: 🪴 I'm a Student */}
          <Link
            href="/child/select"
            className="wb-card wb-btn"
            style={{
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              background: 'rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '2px solid rgba(255, 255, 255, 0.45)',
              borderRadius: 24,
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.18)',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                background: 'rgba(255, 220, 100, 0.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                marginBottom: '1.5rem',
                border: '2px solid rgba(255, 220, 100, 0.6)',
                boxShadow: '0 8px 24px rgba(251, 191, 36, 0.25)',
              }}
            >
              🪴
            </div>

            <h2
              style={{
                fontSize: '1.85rem',
                fontWeight: 900,
                color: '#FFFFFF',
                marginBottom: '0.65rem',
                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
              }}
            >
              I’m a Student
            </h2>

            <p
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#FDF4FF',
                lineHeight: 1.5,
                marginBottom: '1.75rem',
              }}
            >
              Play fun reading quests, sound out words, and help your garden bloom!
            </p>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 28px',
                borderRadius: 50,
                background: 'linear-gradient(135deg, #10b981, #34d399)',
                color: '#064e3b',
                fontSize: '1.05rem',
                fontWeight: 800,
                boxShadow: '0 6px 18px rgba(16, 185, 129, 0.4)',
              }}
            >
              Let’s Read & Bloom! 🌸 →
            </span>
          </Link>

          {/* Card 2: ☀️ I'm a Teacher */}
          <Link
            href="/teacher/login"
            className="wb-card wb-btn"
            style={{
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              background: 'rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '2px solid rgba(255, 255, 255, 0.45)',
              borderRadius: 24,
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.18)',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                background: 'rgba(124, 58, 237, 0.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                marginBottom: '1.5rem',
                border: '2px solid rgba(167, 139, 250, 0.6)',
                boxShadow: '0 8px 24px rgba(124, 58, 237, 0.3)',
              }}
            >
              ☀️
            </div>

            <h2
              style={{
                fontSize: '1.85rem',
                fontWeight: 900,
                color: '#FFFFFF',
                marginBottom: '0.65rem',
                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
              }}
            >
              I’m a Teacher
            </h2>

            <p
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#FDF4FF',
                lineHeight: 1.5,
                marginBottom: '1.75rem',
              }}
            >
              Manage student profiles, approve agent session reports, and inspect dyslexia mirrors.
            </p>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 28px',
                borderRadius: 50,
                background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                color: '#FFFFFF',
                fontSize: '1.05rem',
                fontWeight: 800,
                boxShadow: '0 6px 18px rgba(124, 58, 237, 0.45)',
              }}
            >
              Teacher Sign In →
            </span>
          </Link>
        </div>
      </div>
    </main>
  )
}
