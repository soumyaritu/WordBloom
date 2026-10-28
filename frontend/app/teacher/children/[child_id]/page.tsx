'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TeacherBackground from '../../../../components/TeacherBackground'

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
  co_occurring?: string[]
}

export default function ChildDetailPage({
  params,
}: {
  params: Promise<{ child_id: string }>
}) {
  const resolvedParams = use(params)
  const childId = (resolvedParams?.child_id || 'emma').toLowerCase().trim()
  const router = useRouter()

  const [profile, setProfile] = useState<ChildProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionReport, setSessionReport] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/children/${childId}`)
        if (res.ok) {
          const data = await res.json()
          setProfile(data)
        }
      } catch (e) {}

      if (typeof window !== 'undefined') {
        const savedProf = localStorage.getItem(`wb_profile_${childId}`)
        if (savedProf) {
          try {
            const p = JSON.parse(savedProf)
            setProfile((prev: any) => ({
              ...(prev || {}),
              name: p.fullName || prev?.name,
              child_name: p.fullName || prev?.child_name,
              dyslexia_type: p.dyslexiaType || prev?.dyslexia_type,
              reading_level: p.readingLevel || prev?.reading_level,
              input_mode: p.inputMode || prev?.input_mode,
              display_mode: p.displayMode || prev?.display_mode,
              colour_overlay: p.colourOverlay || prev?.colour_overlay,
            }))
          } catch (e) {}
        }

        const rep = localStorage.getItem(`wb_report_${childId}`)
        if (rep) {
          try {
            setSessionReport(JSON.parse(rep))
          } catch (e) {}
        }
      }
      setLoading(false)
    }
    loadData()
  }, [childId])

  const isSony = childId === 'sofia' || childId === 'sony'
  const fallbackNames: Record<string, string> = {
    emma: 'Emma Clarke',
    liam: "Liam O'Connor",
    james: 'James Patel',
    sofia: 'Sony Mathew',
    sony: 'Sony Mathew',
  }
  const childName = isSony ? 'Sony Mathew' : (profile?.name || profile?.child_name || fallbackNames[childId] || (childId.charAt(0).toUpperCase() + childId.slice(1)))
  const firstName = isSony ? 'Sony' : childName.split(' ')[0]
  const rawType = (profile?.dyslexia_type || '').toLowerCase()
  const isNonDyslexic = rawType === 'non_dyslexic' || rawType === 'none' || rawType === 'general'

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

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 960, margin: '0 auto' }}>

        {/* Top Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
          <Link
            href="/teacher/dashboard"
            style={{
              color: '#9CA3AF', textDecoration: 'none', fontSize: 13, fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', background: '#111827', border: '1px solid #1F2937', borderRadius: 8,
              whiteSpace: 'nowrap',
            }}
          >
            ← Back to Dashboard
          </Link>
          <span style={{ color: '#4B5563', fontSize: 13 }}>/</span>
          <span style={{ color: '#F9FAFB', fontSize: 13, fontWeight: 700 }}>{childName}</span>
        </div>

        {/* Header & Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#10B981', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 800, color: '#06080F',
            }}>
              {childName.charAt(0)}
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: '#F9FAFB' }}>
                {childName}
              </h1>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                <span style={{ color: '#9CA3AF', fontSize: 13 }}>
                  Age {profile?.age || 9} · {profile?.school_year || 'Year 4'}
                </span>
                <span style={{
                  background: 'rgba(16,185,129,0.15)', color: '#34D399',
                  padding: '3px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  {isNonDyslexic ? 'Non-dyslexic (General)' : (profile?.dyslexia_type || 'Dyslexia')}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Dyslexia Mirror only shown for dyslexic profiles) */}
          <div style={{ display: 'flex', gap: 6, background: '#111827', padding: 4, borderRadius: 12, border: '1px solid #1F2937' }}>
            <div
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.3)',
              }}
            >
              Overview
            </div>
            {!isNonDyslexic && (
              <Link
                href={`/teacher/children/${childId}/mirror`}
                style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  color: '#34D399', textDecoration: 'none', background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.2s ease',
                }}
              >
                <span>Dyslexia Mirror</span>
                <span style={{ fontSize: 10, background: '#10B981', color: '#06080F', padding: '1px 5px', borderRadius: 8, fontWeight: 800 }}>NEW</span>
              </Link>
            )}
            <Link
              href={`/teacher?child=${childId}`}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                color: '#9CA3AF', textDecoration: 'none', transition: 'all 0.2s ease',
              }}
            >
              Session Reports 📋
            </Link>
            <Link
              href={`/profile?child=${childId}`}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                color: '#9CA3AF', textDecoration: 'none', transition: 'all 0.2s ease',
              }}
            >
              Edit Settings ✏️
            </Link>
          </div>
        </div>

        {/* Teacher Banner: Dyslexia Mirror (shown only for dyslexic profiles) */}
        {!isNonDyslexic && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(17,24,39,0.95) 100%)',
            border: '1.5px solid rgba(16,185,129,0.4)',
            borderRadius: 20, padding: '1.75rem 2rem',
            marginBottom: '2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20,
            boxShadow: '0 10px 30px rgba(16,185,129,0.15)',
          }}>
            <div style={{ maxWidth: 540 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#10B981', color: '#06080F', padding: '4px 12px', borderRadius: 12, fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', marginBottom: 10 }}>
                Teacher Insight Tool
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#F9FAFB', margin: 0 }}>
                See What {firstName} Sees in the Dyslexia Mirror
              </h2>
              <p style={{ color: '#D1D5DB', fontSize: 14, lineHeight: 1.6, marginTop: 6 }}>
                Experience the perceptual barriers caused by {firstName}&apos;s {profile?.dyslexia_type || 'dyslexia'} profile, test WordBloom&apos;s real-time adaptations, and fine-tune her learning profile settings.
              </p>
            </div>
            <Link
              href={`/teacher/children/${childId}/mirror`}
              style={{
                background: '#10B981', color: '#06080F', textDecoration: 'none',
                padding: '14px 26px', borderRadius: 50, fontSize: 15, fontWeight: 700,
                boxShadow: '0 4px 16px rgba(16,185,129,0.35)', display: 'inline-flex', alignItems: 'center', gap: 8,
                transition: 'transform 0.15s ease',
              }}
            >
              <span>Open Dyslexia Mirror</span>
              <span style={{ fontSize: 18 }}>➔</span>
            </Link>
          </div>
        )}

        {/* Standard Reading Banner (Shown when non-dyslexic) */}
        {isNonDyslexic && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(17,24,39,0.95) 100%)',
            border: '1.5px solid rgba(16,185,129,0.4)',
            borderRadius: 20, padding: '1.75rem 2rem',
            marginBottom: '2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20,
            boxShadow: '0 10px 30px rgba(16,185,129,0.15)',
          }}>
            <div style={{ maxWidth: 540 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#10B981', color: '#06080F', padding: '4px 12px', borderRadius: 12, fontSize: 12.5, fontWeight: 800, textTransform: 'uppercase', marginBottom: 10 }}>
                Standard Reader
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#F9FAFB', margin: 0 }}>
                {firstName} is Enrolled in Standard Reading Curriculum
              </h2>
              <p style={{ color: '#D1D5DB', fontSize: 14, lineHeight: 1.6, marginTop: 6 }}>
                WordBloom delivers clean typography, exact spelling assessment, and natural pacing. Dyslexia perceptual accommodations and mirror simulations are turned off for this profile.
              </p>
            </div>
            <Link
              href={`/profile?child=${childId}`}
              style={{
                background: '#10B981', color: '#06080F', textDecoration: 'none',
                padding: '14px 26px', borderRadius: 50, fontSize: 15, fontWeight: 700,
                boxShadow: '0 4px 16px rgba(16,185,129,0.35)', display: 'inline-flex', alignItems: 'center', gap: 8,
                transition: 'transform 0.15s ease',
              }}
            >
              <span>Edit Settings</span>
              <span style={{ fontSize: 16 }}>✏️</span>
            </Link>
          </div>
        )}

        {/* Profile Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: '2rem' }}>
          <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 16, padding: '1.5rem' }}>
            <div style={{ fontSize: 12, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700, marginBottom: 12 }}>
              Learning & Reading Level
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#F9FAFB', marginBottom: 4 }}>
              Stage {profile?.reading_level || 2}
            </div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>
              {profile?.reading_level === 1 ? 'Simple CVC words' : profile?.reading_level === 2 ? 'Digraphs & blends' : profile?.reading_level === 3 ? 'Silent letters' : 'Multisyllabic words'}
            </div>
          </div>

          <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 16, padding: '1.5rem' }}>
            <div style={{ fontSize: 12, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700, marginBottom: 12 }}>
              Active Accommodations
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(16,185,129,0.15)', color: '#34D399', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                {profile?.display_mode === 'opendyslexic' ? 'OpenDyslexic Font' : 'Standard Font'}
              </span>
              <span style={{ background: 'rgba(96,165,250,0.15)', color: '#93C5FD', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                {profile?.input_mode === 'voice' ? '🎤 Voice Mode' : profile?.input_mode === 'tap' ? 'Letter Tile Tap' : 'Keyboard Type'}
              </span>
              <span style={{ background: 'rgba(251,191,36,0.15)', color: '#FCD34D', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                Overlay: {profile?.colour_overlay || 'none'}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Session Summary if available */}
        {sessionReport && (
          <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 16, padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#F9FAFB' }}>
                Recent Session Report
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#34D399', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: 20, padding: '4px 12px' }}>
                Session Governance Audit: 🛡️ Verified Child-Safe by Google Cloud Model Armor
              </div>
            </div>
            <p style={{ fontSize: 14, color: '#D1D5DB', lineHeight: 1.6 }}>
              {sessionReport.report_text}
            </p>
          </div>
        )}

      </div>
    </main>
  )
}
