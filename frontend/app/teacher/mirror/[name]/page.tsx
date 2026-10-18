'use client'

import { useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import TeacherBackground from '../../../../components/TeacherBackground'

export default function TeacherMirrorPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const router = useRouter()
  const resolved = use(params)
  const childId = (resolved.name || 'emma').toLowerCase().trim()

  useEffect(() => {
    router.replace(`/teacher/children/${childId}/mirror`)
    const t = setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = `/teacher/children/${childId}/mirror`
      }
    }, 150)
    return () => clearTimeout(t)
  }, [router, childId])

  return (
    <main
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#06080F',
        overflow: 'hidden',
        color: '#FFFFFF',
        gap: 16,
        padding: 20,
        textAlign: 'center',
      }}
    >
      <TeacherBackground />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: '3.5rem' }}>👁️</div>
        <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>
          Opening Dyslexia Mirror for {childId.toUpperCase()}...
        </div>
        <p style={{ color: '#E2E8F0', fontSize: 14, maxWidth: 360, margin: 0 }}>
          Taking you to the interactive perceptual simulator...
        </p>
        <a
          href={`/teacher/children/${childId}/mirror`}
          style={{
            marginTop: 10,
            background: '#10B981',
            color: '#06080F',
            padding: '10px 24px',
            borderRadius: 50,
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
          }}
        >
          Click here to open Dyslexia Mirror immediately ➔
        </a>
      </div>
    </main>
  )
}
