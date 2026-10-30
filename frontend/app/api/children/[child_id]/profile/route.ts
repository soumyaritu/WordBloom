import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ child_id: string }> }
) {
  const { child_id } = await params
  const cleanId = (child_id || 'emma').toLowerCase().trim()
  let body: Record<string, any> = {}

  try {
    body = await request.json()
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // 1. Try calling FastAPI backend PATCH (use 127.0.0.1 to avoid IPv6 localhost hang)
  try {
    const backendUrl = process.env.BACKEND_URL || process.env.LOCAL_BACKEND_URL || process.env.ADK_BACKEND_ORIGIN || 'http://127.0.0.1:8000'
    const res = await fetch(`${backendUrl}/api/children/${cleanId}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(2000),
    })
    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }
  } catch (e) {
    // Backend offline fallback: write directly to SKILL.md
  }

  try {
    const skillPath = path.join(process.cwd(), '..', 'backend', 'wordbloom_agent', 'skills', cleanId, 'SKILL.md')
    if (fs.existsSync(skillPath)) {
      let content = fs.readFileSync(skillPath, 'utf-8')
      if (body.dyslexia_type) {
        content = content.replace(/(- (?:Dyslexia type|Type):\s*).+/i, `$1${body.dyslexia_type}`)
      }
      if (body.display_mode || body.font) {
        const val = body.display_mode || body.font
        content = content.replace(/(- Display mode:\s*).+/i, `$1${val}`)
      }
      if (body.colour_overlay) {
        content = content.replace(/(- Colour overlay:\s*).+/i, `$1${body.colour_overlay}`)
      }
      if (body.input_mode) {
        content = content.replace(/(- Input mode:\s*).+/i, `$1${body.input_mode}`)
      }
      if (body.approach) {
        content = content.replace(/(- Approach:\s*).+/i, `$1${body.approach}`)
      }
      if (body.session_length) {
        content = content.replace(/(- Session length:\s*).+/i, `$1${body.session_length}`)
      }
      if (body.candy_goal) {
        if (/(- Candy goal:\s*).+/i.test(content)) {
          content = content.replace(/(- Candy goal:\s*).+/i, `$1${body.candy_goal}`)
        } else {
          content = content.replace(/(- Session length:\s*.+)/i, `$1\n- Candy goal: ${body.candy_goal}`)
        }
      }
      if (body.break_after) {
        content = content.replace(/(- Break after:\s*).+/i, `$1${body.break_after}`)
      }
      fs.writeFileSync(skillPath, content, 'utf-8')
    }
    return NextResponse.json({ success: true, child_id: cleanId, updated: body })
  } catch (err) {
    console.error('Error writing SKILL.md in PATCH fallback:', err)
  }

  return NextResponse.json({ success: true, child_id: cleanId, updated: body })
}
