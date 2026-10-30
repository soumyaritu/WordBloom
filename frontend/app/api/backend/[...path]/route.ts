import { NextRequest, NextResponse } from 'next/server'

// Agent Runtime passthrough base URL for WordBloom
const AGENT_RUNTIME_BASE = process.env.ADK_BACKEND_ORIGIN ||
  "https://us-central1-aiplatform.googleapis.com/reasoningEngines/v1/projects/820113329049/locations/us-central1/reasoningEngines/1398722001920589824/api"

const LOCAL_BACKEND_BASE = process.env.LOCAL_BACKEND_URL || "http://127.0.0.1:8000"

let cachedToken: string | null = null
let hasCheckedMetadata = false

async function getGoogleAuthToken(): Promise<string | null> {
  // 1. Check if token is explicitly injected in env
  if (process.env.GOOGLE_AUTH_TOKEN) {
    return process.env.GOOGLE_AUTH_TOKEN
  }
  if (hasCheckedMetadata) {
    return cachedToken
  }

  // If running locally (not in GCP Cloud Run/VM), skip metadata server immediately
  if (!process.env.K_SERVICE && !process.env.GAE_SERVICE && process.env.NODE_ENV !== 'production') {
    hasCheckedMetadata = true
    return null
  }

  // 2. In Google Cloud Run, get token from Compute Metadata server
  try {
    const metaRes = await fetch(
      "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
      {
        headers: { "Metadata-Flavor": "Google" },
        signal: AbortSignal.timeout(500),
      }
    )
    if (metaRes.ok) {
      const data = await metaRes.json()
      cachedToken = data.access_token || null
      hasCheckedMetadata = true
      return cachedToken
    }
  } catch {
    // Local environment or metadata server not reachable
  }

  hasCheckedMetadata = true
  return null
}

const DEFAULT_START_PROFILES: Record<string, any> = {
  emma: {
    child_id: "emma",
    child_name: "Emma Clarke",
    parent_email: "parent@example.com",
    age: 9,
    school_year: "Year 4",
    dyslexia_type: "phonological",
    severity: "moderate",
    conditions: ["adhd"],
    co_occurring: ["adhd"],
    input_mode: "voice",
    display_mode: "opendyslexic",
    colour_overlay: "yellow",
    show_timer: false,
    score_display: "stars",
    session_length: 5,
    candy_goal: 5,
    break_after: 5,
    approach: "audio_first",
    encouragement_style: "specific",
    reading_stage: 3,
    reading_level: 3,
    mastered_words: ["wrist", "thumb", "light", "train", "beach"],
    struggling_words: ["through", "knight", "enough"],
    pattern_difficulty: "silent letters",
    first_word: {
      word: "wrist",
      difficulty: "medium",
      category: "silent letter",
      phonics_rule: "Silent 'w' in 'wr'",
      audio_hint: "rist",
      visual_hint: "w·r·i·s·t",
      sentence: "Wear a watch on your wrist.",
      why_chosen: "Selected for Stage 3 silent letters practice matching Emma's profile."
    }
  },
  liam: {
    child_id: "liam",
    child_name: "Liam O'Connor",
    parent_email: "parent@example.com",
    age: 8,
    school_year: "Year 3",
    dyslexia_type: "surface",
    severity: "mild",
    conditions: [],
    co_occurring: [],
    input_mode: "tap",
    display_mode: "standard",
    colour_overlay: "none",
    show_timer: false,
    score_display: "stars",
    session_length: 10,
    candy_goal: 10,
    break_after: 10,
    approach: "phonics",
    encouragement_style: "warm",
    reading_stage: 2,
    reading_level: 2,
    mastered_words: ["big", "red", "cup"],
    struggling_words: ["said", "yacht"],
    pattern_difficulty: "irregular spelling",
    first_word: {
      word: "frog",
      difficulty: "medium",
      category: "blends",
      phonics_rule: "Initial blend 'fr'",
      audio_hint: "frog",
      visual_hint: "f·r·o·g",
      sentence: "The green frog jumped in the pond.",
      why_chosen: "Selected for Stage 2 blends practice matching child's profile."
    }
  },
  james: {
    child_id: "james",
    child_name: "James Bond",
    parent_email: "parent@example.com",
    age: 10,
    school_year: "Year 5",
    dyslexia_type: "visual/spatial",
    severity: "moderate",
    conditions: ["dyspraxia"],
    co_occurring: ["dyspraxia"],
    input_mode: "tap",
    display_mode: "opendyslexic",
    colour_overlay: "blue",
    show_timer: false,
    score_display: "stars",
    session_length: 10,
    candy_goal: 10,
    break_after: 10,
    approach: "phonics",
    encouragement_style: "warm",
    reading_stage: 2,
    reading_level: 2,
    mastered_words: ["stop", "jump"],
    struggling_words: ["dog", "beach"],
    pattern_difficulty: "b/d reversal",
    first_word: {
      word: "star",
      difficulty: "medium",
      category: "blends",
      phonics_rule: "Initial blend 'st'",
      audio_hint: "star",
      visual_hint: "s·t·a·r",
      sentence: "Look up at the bright twinkling star.",
      why_chosen: "Selected for Stage 2 practice avoiding mirror letter confusion."
    }
  },
  sofia: {
    child_id: "sofia",
    child_name: "Sony Mathew",
    parent_email: "parent@example.com",
    age: 7,
    school_year: "Year 3",
    dyslexia_type: "unknown",
    severity: "assessing",
    conditions: [],
    co_occurring: [],
    input_mode: "type",
    display_mode: "standard",
    colour_overlay: "blue",
    show_timer: false,
    score_display: "stars",
    session_length: 5,
    candy_goal: 10,
    break_after: 5,
    approach: "phonics",
    encouragement_style: "warm",
    reading_stage: 1,
    reading_level: 1,
    mastered_words: ["cat", "dog", "run", "play", "help"],
    struggling_words: ["through", "knight", "enough"],
    pattern_difficulty: "silent letters",
    first_word: {
      word: "cat",
      difficulty: "easy",
      category: "cvc",
      phonics_rule: "Short vowel 'a'",
      audio_hint: "cat",
      visual_hint: "c·a·t",
      sentence: "The cat sat on the mat.",
      why_chosen: "Selected for Stage 1 baseline assessment."
    }
  },
  sony: {
    child_id: "sony",
    child_name: "Sony Mathew",
    parent_email: "parent@example.com",
    age: 7,
    school_year: "Year 3",
    dyslexia_type: "unknown",
    severity: "assessing",
    conditions: [],
    co_occurring: [],
    input_mode: "type",
    display_mode: "standard",
    colour_overlay: "blue",
    show_timer: false,
    score_display: "stars",
    session_length: 5,
    candy_goal: 10,
    break_after: 5,
    approach: "phonics",
    encouragement_style: "warm",
    reading_stage: 1,
    reading_level: 1,
    mastered_words: ["cat", "dog", "run", "play", "help"],
    struggling_words: ["through", "knight", "enough"],
    pattern_difficulty: "silent letters",
    first_word: {
      word: "cat",
      difficulty: "easy",
      category: "cvc",
      phonics_rule: "Short vowel 'a'",
      audio_hint: "cat",
      visual_hint: "c·a·t",
      sentence: "The cat sat on the mat.",
      why_chosen: "Selected for Stage 1 baseline assessment."
    }
  },
  alex: {
    child_id: "alex",
    child_name: "Alex",
    parent_email: "parent@example.com",
    age: 13,
    school_year: "Year 9",
    dyslexia_type: "non_dyslexic",
    severity: "none",
    conditions: [],
    co_occurring: [],
    input_mode: "type",
    display_mode: "standard",
    colour_overlay: "none",
    show_timer: false,
    score_display: "stars",
    session_length: 10,
    candy_goal: 4,
    break_after: 10,
    approach: "standard",
    encouragement_style: "warm",
    reading_stage: 4,
    reading_level: 4,
    mastered_words: ["sunshine", "adventure", "wonderful", "rainbow"],
    struggling_words: [],
    pattern_difficulty: "none",
    first_word: {
      word: "sunshine",
      difficulty: "hard",
      category: "compound",
      phonics_rule: "Compound word 'sun + shine'",
      audio_hint: "sun-shine",
      visual_hint: "sun·shine",
      sentence: "Warm sunshine filled the room.",
      why_chosen: "Selected for Stage 4 compound word practice matching Alex's profile."
    }
  }
}

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const targetPath = (path || []).join('/')
  const searchParams = req.nextUrl.search

  const token = await getGoogleAuthToken()
  const useAgentRuntime = Boolean(token || process.env.USE_AGENT_RUNTIME === 'true')
  
  const baseUrl = useAgentRuntime ? AGENT_RUNTIME_BASE : LOCAL_BACKEND_BASE
  const targetUrl = `${baseUrl}/${targetPath}${searchParams}`

  const headers: Record<string, string> = {
    'Content-Type': req.headers.get('content-type') || 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const method = req.method
  const body = method !== 'GET' && method !== 'HEAD' ? await req.text() : undefined

  // Ultra-fast path for session/start: never block the user beyond 350ms
  if (targetPath === 'session/start' && method === 'POST') {
    let childId = 'emma'
    try {
      const parsed = body ? JSON.parse(body) : {}
      childId = (parsed.child_name || parsed.child_id || 'emma').toLowerCase().trim()
      if (childId.includes(' ')) childId = childId.split(' ')[0]
    } catch (e) {}

    const profileData = DEFAULT_START_PROFILES[childId] || DEFAULT_START_PROFILES.emma
    const fastResponse = {
      session_id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      profile: profileData,
      first_word: profileData.first_word,
      success: true,
    }

    try {
      const upstreamRes = await fetch(targetUrl, {
        method,
        headers,
        body,
        signal: AbortSignal.timeout(350),
      })
      if (upstreamRes.ok) {
        const data = await upstreamRes.text()
        return new NextResponse(data, {
          status: upstreamRes.status,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    } catch {
      // Upstream took >350ms or is unreachable; return fastResponse immediately
    }

    return NextResponse.json(fastResponse)
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      method,
      headers,
      body,
    })

    const data = await upstreamRes.text()
    return new NextResponse(data, {
      status: upstreamRes.status,
      headers: {
        'Content-Type': upstreamRes.headers.get('content-type') || 'application/json',
      },
    })
  } catch (err: any) {
    console.error(`Proxy error for ${targetUrl}:`, err)
    return NextResponse.json({ error: 'Failed to contact backend', details: err?.message }, { status: 502 })
  }
}

export const GET = handleProxy
export const POST = handleProxy
export const PUT = handleProxy
export const DELETE = handleProxy
