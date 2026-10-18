'use client'

import React from 'react'

export default function DecorativeBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {/* Background Gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 40%, #f093fb 100%)',
          backgroundAttachment: 'fixed',
        }}
      />

      {/* Floating decorative blobs (blurred circles, opacity: 0.25, slow float animation) */}
      <div
        className="floating-blob blob-1"
        style={{
          position: 'absolute',
          top: '-10%',
          left: '10%',
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #f093fb 0%, rgba(118, 75, 162, 0.5) 70%, transparent 100%)',
          filter: 'blur(70px)',
          opacity: 0.35,
          animation: 'floatBlob1 18s ease-in-out infinite alternate',
        }}
      />

      <div
        className="floating-blob blob-2"
        style={{
          position: 'absolute',
          bottom: '-12%',
          right: '5%',
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #7c3aed 0%, #38bdf8 80%, transparent 100%)',
          filter: 'blur(80px)',
          opacity: 0.3,
          animation: 'floatBlob2 22s ease-in-out infinite alternate',
        }}
      />

      <div
        className="floating-blob blob-3"
        style={{
          position: 'absolute',
          top: '40%',
          right: '25%',
          width: 380,
          height: 380,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #fef08a 0%, #f472b6 70%, transparent 100%)',
          filter: 'blur(60px)',
          opacity: 0.22,
          animation: 'floatBlob3 15s ease-in-out infinite alternate',
        }}
      />

      {/* Twinkling star dots scattered across background */}
      <div className="star-dot" style={{ top: '12%', left: '18%', animationDelay: '0s' }} />
      <div className="star-dot" style={{ top: '25%', left: '82%', animationDelay: '1.2s' }} />
      <div className="star-dot" style={{ top: '45%', left: '8%', animationDelay: '2.4s' }} />
      <div className="star-dot" style={{ top: '68%', left: '78%', animationDelay: '0.7s' }} />
      <div className="star-dot" style={{ top: '85%', left: '22%', animationDelay: '1.9s' }} />
      <div className="star-dot" style={{ top: '18%', left: '55%', animationDelay: '3.1s' }} />
      <div className="star-dot" style={{ top: '75%', left: '48%', animationDelay: '2.1s' }} />
      <div className="star-dot" style={{ top: '38%', left: '92%', animationDelay: '1.5s' }} />
      <div className="star-dot" style={{ top: '90%', left: '88%', animationDelay: '0.4s' }} />
      <div className="star-dot" style={{ top: '5%', left: '38%', animationDelay: '2.8s' }} />
    </div>
  )
}
