'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TeacherBackground from '../../../components/TeacherBackground'

export default function TeacherLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const emailVal = email || (document.getElementById('teacher-email') as HTMLInputElement)?.value || ''
    const passVal = password || (document.getElementById('teacher-password') as HTMLInputElement)?.value || ''

    try {
      // Validate credentials via POST /api/auth/teacher
      const res = await fetch('/api/auth/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVal, password: passVal }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // Teacher auth success
        localStorage.setItem('wb_teacher', JSON.stringify(data.teacher))
        // Full navigation ensures middleware receives the fresh Set-Cookie header
        window.location.href = '/teacher/dashboard'
      } else {
        setError('❌ Email or password not recognised')
      }
    } catch (err) {
      console.error('Sign in error:', err)
      setError('❌ Email or password not recognised')
    } finally {
      setLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setEmail('teacher@wordbloom.edu')
    setPassword('bloom123')
    const emailEl = document.getElementById('teacher-email') as HTMLInputElement
    const passEl = document.getElementById('teacher-password') as HTMLInputElement
    if (emailEl) emailEl.value = 'teacher@wordbloom.edu'
    if (passEl) passEl.value = 'bloom123'
    setError('')
  }

  return (
    <main
      style={{
        position: 'relative',
        minHeight: '100vh',
        backgroundColor: '#06080F',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1.5rem',
        overflow: 'hidden',
      }}
    >
      <TeacherBackground />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 480,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Back Button */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', marginBottom: '1.25rem' }}>
          <Link
            href="/"
            className="wb-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: 50,
              background: 'rgba(255, 255, 255, 0.22)',
              backdropFilter: 'blur(10px)',
              border: '1.5px solid rgba(255, 255, 255, 0.45)',
              color: '#FFFFFF',
              fontSize: '0.9rem',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            ← Back to Home
          </Link>
        </div>

        {/* White Card with Purple Branding */}
        <div
          className="wb-teacher-card"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 28,
            padding: '3rem 2.25rem',
            width: '100%',
            boxShadow: '0 24px 60px rgba(76, 29, 149, 0.25)',
            border: '2px solid rgba(255, 255, 255, 0.9)',
          }}
        >
          {/* Logo & Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              className="bouncing-logo"
              style={{
                fontSize: '3.25rem',
                marginBottom: '0.5rem',
                filter: 'drop-shadow(0 6px 14px rgba(124, 58, 237, 0.25))',
              }}
            >
              🌸
            </div>
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: '#4c1d95', // Primary purple dark
                marginBottom: '0.35rem',
                letterSpacing: '-0.02em',
              }}
            >
              Teacher Sign In
            </h1>
            <p
              style={{
                fontSize: '0.95rem',
                color: '#6b7280',
                fontWeight: 600,
              }}
            >
              WordBloom Educator &amp; Learning Insights Portal
            </p>
          </div>

          {/* Inline Error Message */}
          {error && (
            <div
              role="alert"
              style={{
                background: '#fef2f2',
                border: '1.5px solid #f87171',
                borderRadius: 12,
                padding: '12px 16px',
                color: '#dc2626',
                fontSize: '0.95rem',
                fontWeight: 700,
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label
                htmlFor="teacher-email"
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  color: '#4c1d95',
                  marginBottom: '0.45rem',
                }}
              >
                Email Address
              </label>
              <input
                id="teacher-email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="teacher@wordbloom.edu"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '2px solid #e9d5ff',
                  background: '#faf5ff',
                  color: '#1e1b4b',
                  fontSize: '1rem',
                  fontWeight: 600,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = '#8b5cf6')}
                onBlur={e => (e.target.style.borderColor = '#e9d5ff')}
              />
            </div>

            <div>
              <label
                htmlFor="teacher-password"
                style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  color: '#4c1d95',
                  marginBottom: '0.45rem',
                }}
              >
                Password
              </label>
              <input
                id="teacher-password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '2px solid #e9d5ff',
                  background: '#faf5ff',
                  color: '#1e1b4b',
                  fontSize: '1rem',
                  fontWeight: 600,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = '#8b5cf6')}
                onBlur={e => (e.target.style.borderColor = '#e9d5ff')}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="wb-btn"
              style={{
                width: '100%',
                marginTop: '0.75rem',
                padding: '14px',
                borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                color: '#FFFFFF',
                fontSize: '1.15rem',
                fontWeight: 900,
                boxShadow: '0 8px 20px rgba(124, 58, 237, 0.35)',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading ? 'Checking... 🌸' : 'Sign In →'}
            </button>
          </form>

          {/* Hint Box Showing Demo Credentials */}
          <div
            style={{
              marginTop: '1.75rem',
              padding: '14px 16px',
              borderRadius: 14,
              background: '#f3e8ff',
              border: '1.5px dashed #c084fc',
              color: '#581c87',
              fontSize: '0.88rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontWeight: 800 }}>💡 Demo Credentials</span>
              <button
                type="button"
                onClick={fillDemoCredentials}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7c3aed',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Auto-fill
              </button>
            </div>
            <div style={{ fontWeight: 600, lineHeight: 1.5 }}>
              Email: <code style={{ fontWeight: 800 }}>teacher@wordbloom.edu</code><br />
              Password: <code style={{ fontWeight: 800 }}>bloom123</code>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
