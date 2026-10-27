import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ child_id: string }> }
) {
  const { child_id } = await params
  const cleanId = (child_id || 'emma').toLowerCase().trim()

  // Try proxying to FastAPI backend first (use 127.0.0.1 to prevent IPv6 localhost hang)
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000'
    const res = await fetch(`${backendUrl}/api/children/${cleanId}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2000),
    })
    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }
  } catch (e) {
    // Backend offline fallback: read SKILL.md directly from filesystem
  }

  try {
    const skillPath = path.join(process.cwd(), '..', 'backend', 'wordbloom_agent', 'skills', cleanId, 'SKILL.md')
    if (fs.existsSync(skillPath)) {
      const raw = fs.readFileSync(skillPath, 'utf-8')
      const extract = (pattern: RegExp, def: string) => {
        const match = raw.match(pattern)
        return match ? match[1].trim() : def
      }

      return NextResponse.json({
        id: cleanId,
        child_id: cleanId,
        name: extract(/- Full name:\s*(.+)/i, cleanId.charAt(0).toUpperCase() + cleanId.slice(1)),
        child_name: extract(/- Full name:\s*(.+)/i, cleanId.charAt(0).toUpperCase() + cleanId.slice(1)),
        dyslexia_type: extract(/- (?:Dyslexia type|Type):\s*(.+)/i, 'phonological'),
        font: extract(/- Display mode:\s*(.+)/i, 'opendyslexic'),
        display_mode: extract(/- Display mode:\s*(.+)/i, 'opendyslexic'),
        colour_overlay: extract(/- Colour overlay:\s*(.+)/i, 'none'),
        input_mode: extract(/- Input mode:\s*(.+)/i, 'type'),
        reading_level: parseInt(extract(/- Reading (?:level|stage):\s*(\d+)/i, '2'), 10),
        age: parseInt(extract(/- Age:\s*(\d+)/i, '9'), 10),
        school_year: extract(/- School year:\s*(.+)/i, 'Year 4'),
      })
    }
  } catch (err) {
    console.error('Error reading skill file fallback:', err)
  }

  return NextResponse.json({
    id: cleanId,
    child_id: cleanId,
    name: cleanId.charAt(0).toUpperCase() + cleanId.slice(1),
    child_name: cleanId.charAt(0).toUpperCase() + cleanId.slice(1),
    dyslexia_type: cleanId === 'liam' ? 'surface' : cleanId === 'james' ? 'visual_spatial' : (cleanId === 'sofia' || cleanId === 'sony') ? 'unknown' : 'phonological',
    font: (cleanId === 'sofia' || cleanId === 'sony') ? 'standard' : 'opendyslexic',
    display_mode: (cleanId === 'sofia' || cleanId === 'sony') ? 'standard' : 'opendyslexic',
    colour_overlay: cleanId === 'emma' ? 'yellow' : cleanId === 'james' ? 'yellow' : 'none',
    input_mode: cleanId === 'emma' ? 'voice' : (cleanId === 'sofia' || cleanId === 'sony') ? 'type' : 'tap',
    reading_level: cleanId === 'emma' ? 3 : cleanId === 'liam' ? 2 : 1,
    age: 9,
    school_year: 'Year 4',
  })
}
