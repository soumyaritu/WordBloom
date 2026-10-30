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
    const backendUrl = process.env.BACKEND_URL || process.env.LOCAL_BACKEND_URL || process.env.ADK_BACKEND_ORIGIN || 'http://127.0.0.1:8000'
    const res = await fetch(`${backendUrl}/api/children/${cleanId}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2000),
    })
    if (res.ok) {
      const data = await res.json()
      if (cleanId === 'james') {
        if (!data.name || data.name.toLowerCase().includes('patel')) data.name = 'James Bond'
        if (!data.child_name || data.child_name.toLowerCase().includes('patel')) data.child_name = 'James Bond'
      }
      return NextResponse.json(data)
    }
  } catch (e) {
    // Backend offline fallback: read SKILL.md directly from filesystem
  }

  const fallbackNames: Record<string, string> = {
    emma: 'Emma Clarke',
    liam: "Liam O'Connor",
    james: 'James Bond',
    sofia: 'Sony Mathew',
    sony: 'Sony Mathew',
    alex: 'Alex',
  }
  const isSony = cleanId === 'sofia' || cleanId === 'sony'
  const isAlex = cleanId === 'alex'
  const defaultDisplayName = fallbackNames[cleanId] || (cleanId.charAt(0).toUpperCase() + cleanId.slice(1))

  try {
    const targetFolder = (cleanId === 'sony' && !fs.existsSync(path.join(process.cwd(), '..', 'backend', 'wordbloom_agent', 'skills', 'sony', 'SKILL.md'))) ? 'sofia' : cleanId
    const skillPath = path.join(process.cwd(), '..', 'backend', 'wordbloom_agent', 'skills', targetFolder, 'SKILL.md')
    if (fs.existsSync(skillPath)) {
      const raw = fs.readFileSync(skillPath, 'utf-8')
      const extract = (pattern: RegExp, def: string) => {
        const match = raw.match(pattern)
        return match ? match[1].trim() : def
      }

      const resolvedName = isSony ? 'Sony Mathew' : extract(/- Full name:\s*(.+)/i, defaultDisplayName)

      return NextResponse.json({
        id: cleanId,
        child_id: cleanId,
        name: resolvedName,
        child_name: resolvedName,
        dyslexia_type: extract(/- (?:Dyslexia type|Type):\s*(.+)/i, isAlex ? 'non_dyslexic' : isSony ? 'unknown' : 'phonological'),
        font: extract(/- Display mode:\s*(.+)/i, (isSony || isAlex) ? 'standard' : 'opendyslexic'),
        display_mode: extract(/- Display mode:\s*(.+)/i, (isSony || isAlex) ? 'standard' : 'opendyslexic'),
        colour_overlay: extract(/- Colour overlay:\s*(.+)/i, 'none'),
        input_mode: extract(/- Input mode:\s*(.+)/i, (isSony || isAlex) ? 'type' : 'tap'),
        reading_level: parseInt(extract(/- Reading (?:level|stage):\s*(\d+)/i, isAlex ? '4' : isSony ? '1' : cleanId === 'emma' ? '3' : '2'), 10),
        age: parseInt(extract(/- Age:\s*(\d+)/i, isAlex ? '13' : isSony ? '7' : '9'), 10),
        school_year: extract(/- School year:\s*(.+)/i, isAlex ? 'Year 9' : isSony ? 'Year 3' : 'Year 4'),
      })
    }
  } catch (err) {
    console.error('Error reading skill file fallback:', err)
  }

  return NextResponse.json({
    id: cleanId,
    child_id: cleanId,
    name: defaultDisplayName,
    child_name: defaultDisplayName,
    dyslexia_type: isAlex ? 'non_dyslexic' : cleanId === 'liam' ? 'surface' : cleanId === 'james' ? 'visual_spatial' : isSony ? 'unknown' : 'phonological',
    font: (isSony || isAlex) ? 'standard' : 'opendyslexic',
    display_mode: (isSony || isAlex) ? 'standard' : 'opendyslexic',
    colour_overlay: cleanId === 'emma' ? 'yellow' : cleanId === 'james' ? 'yellow' : 'none',
    input_mode: cleanId === 'emma' ? 'voice' : (isSony || isAlex) ? 'type' : 'tap',
    reading_level: isAlex ? 4 : cleanId === 'emma' ? 3 : (cleanId === 'liam' || cleanId === 'james') ? 2 : 1,
    age: isAlex ? 13 : isSony ? 7 : 9,
    school_year: isAlex ? 'Year 9' : isSony ? 'Year 3' : 'Year 4',
  })
}
