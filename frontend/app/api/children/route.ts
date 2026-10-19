import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export interface ChildProfileData {
  id: string
  name: string
  avatar: string
  dyslexia_type: string
  reading_stage: number
  input_mode: string
  conditions: string[]
  last_session: string
  candy_count: number
  font?: string
  colour_overlay?: string
}

const DEFAULT_CHILDREN: ChildProfileData[] = [
  {
    id: 'emma',
    name: 'Emma Clarke',
    avatar: '👧',
    dyslexia_type: 'Phonological',
    reading_stage: 3,
    input_mode: 'voice',
    conditions: ['ADHD'],
    last_session: 'Today',
    candy_count: 5,
    font: 'opendyslexic',
    colour_overlay: 'yellow',
  },
  {
    id: 'liam',
    name: "Liam O'Connor",
    avatar: '👦',
    dyslexia_type: 'Surface',
    reading_stage: 2,
    input_mode: 'tap',
    conditions: ['Dyspraxia', 'ADHD'],
    last_session: 'Yesterday',
    candy_count: 4,
    font: 'standard',
    colour_overlay: 'none',
  },
  {
    id: 'james',
    name: 'James Patel',
    avatar: '🚀',
    dyslexia_type: 'Visual / Spatial',
    reading_stage: 2,
    input_mode: 'tap',
    conditions: ['Dyspraxia'],
    last_session: 'Oct 16',
    candy_count: 3,
    font: 'standard',
    colour_overlay: 'yellow',
  },
  {
    id: 'sofia',
    name: 'Sony Mathew',
    avatar: '🌟',
    dyslexia_type: 'Phonological',
    reading_stage: 2,
    input_mode: 'voice',
    conditions: [],
    last_session: 'Oct 15',
    candy_count: 5,
    font: 'opendyslexic',
    colour_overlay: 'none',
  },
  {
    id: 'alex',
    name: 'Alex',
    avatar: '🦊',
    dyslexia_type: 'Non-dyslexic',
    reading_stage: 4,
    input_mode: 'type',
    conditions: [],
    last_session: 'Oct 17',
    candy_count: 5,
    font: 'standard',
    colour_overlay: 'none',
  },
]

const AVATAR_MAP: Record<string, string> = {
  emma: '👧',
  liam: '👦',
  james: '🚀',
  sofia: '🌟',
  alex: '🦊',
}

export async function GET() {
  try {
    const skillsDir = path.join(process.cwd(), '..', 'backend', 'wordbloom_agent', 'skills')
    if (fs.existsSync(skillsDir)) {
      const entries = fs.readdirSync(skillsDir, { withFileTypes: true })
      const children: ChildProfileData[] = []

      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        if (entry.name === 'word-bank' || entry.name === 'dyslexic-heroes') continue

        const childId = entry.name.toLowerCase()
        const skillPath = path.join(skillsDir, entry.name, 'SKILL.md')

        if (fs.existsSync(skillPath)) {
          const raw = fs.readFileSync(skillPath, 'utf-8')
          const extract = (pattern: RegExp, def: string) => {
            const match = raw.match(pattern)
            return match ? match[1].trim() : def
          }

          const rawType = extract(/- (?:Dyslexia profile|Dyslexia type|Type):\s*(.+)/i, 'phonological').toLowerCase()
          let dyslexiaType = 'Phonological'
          if (rawType.includes('non')) dyslexiaType = 'Non-dyslexic'
          else if (rawType.includes('surface')) dyslexiaType = 'Surface'
          else if (rawType.includes('visual')) dyslexiaType = 'Visual / Spatial'
          else if (rawType.includes('attentional')) dyslexiaType = 'Attentional'
          else if (rawType.includes('double')) dyslexiaType = 'Double Deficit'

          const rawCo = extract(/- Co-occurring:\s*(.+)/i, 'none')
          const conditions: string[] = []
          if (rawCo && rawCo.toLowerCase() !== 'none') {
            rawCo.split(/[,&]/).forEach(c => {
              const clean = c.trim()
              if (clean) conditions.push(clean.toUpperCase())
            })
          }

          const fallback = DEFAULT_CHILDREN.find(d => d.id === childId)

          children.push({
            id: childId,
            name: extract(/- Full name:\s*(.+)/i, fallback?.name || (childId.charAt(0).toUpperCase() + childId.slice(1))),
            avatar: AVATAR_MAP[childId] || '🎨',
            dyslexia_type: dyslexiaType,
            reading_stage: parseInt(extract(/- Reading (?:level|stage):\s*(\d+)/i, String(fallback?.reading_stage || 2)), 10),
            input_mode: extract(/- Input mode:\s*(.+)/i, fallback?.input_mode || 'voice'),
            conditions: conditions.length > 0 ? conditions : (fallback?.conditions || []),
            last_session: fallback?.last_session || 'Today',
            candy_count: fallback?.candy_count ?? 5,
            font: extract(/- Display mode:\s*(.+)/i, fallback?.font || 'standard'),
            colour_overlay: extract(/- Colour overlay:\s*(.+)/i, fallback?.colour_overlay || 'none'),
          })
        }
      }

      if (children.length > 0) {
        return NextResponse.json({
          children,
          success: true
        })
      }
    }
  } catch (err) {
    console.error('Error loading child profiles from skills:', err)
  }

  return NextResponse.json({
    children: DEFAULT_CHILDREN,
    success: true
  })
}
