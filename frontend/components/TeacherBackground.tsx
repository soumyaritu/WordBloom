'use client'

import React from 'react'

/**
 * Dedicated, executive dark background for Teacher, SENCO, and Clinical screens:
 * - Follows AGENTS.md specification: Canvas background #06080F (near black)
 * - Subtle ambient WordBloom emerald (#10B981) vignette for depth
 * - Zero motion or high-chroma distraction for optimal readability and accessibility
 */
export default function TeacherBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        backgroundColor: '#06080F',
      }}
      aria-hidden="true"
    >
      {/* Subtle top ambient glow with WordBloom brand emerald */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '900px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.07) 0%, rgba(6, 8, 15, 0) 70%)',
          filter: 'blur(70px)',
        }}
      />

      {/* Very faint deep indigo accent in the lower right for dimensional depth */}
      <div
        style={{
          position: 'absolute',
          bottom: '-12%',
          right: '-6%',
          width: '700px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.04) 0%, rgba(6, 8, 15, 0) 75%)',
          filter: 'blur(90px)',
        }}
      />

      {/* Subtle micro-dot matrix texture for professional dashboard polish */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.35,
        }}
      />
    </div>
  )
}
