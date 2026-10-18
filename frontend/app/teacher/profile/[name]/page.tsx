'use client'

import { useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import TeacherBackground from '../../../../components/TeacherBackground'

export default function TeacherProfilePage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const router = useRouter()
  const resolved = use(params)
  const childId = (resolved.name || 'emma').toLowerCase().trim()

  useEffect(() => {
    router.replace(`/profile?child=${childId}`)
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
      }}
    >
      <TeacherBackground />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: '3rem' }}>📋</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
          Loading profile configuration for {childId.toUpperCase()}...
        </div>
      </div>
    </main>
  )
}
