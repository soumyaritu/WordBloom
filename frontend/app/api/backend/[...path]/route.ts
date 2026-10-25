import { NextRequest, NextResponse } from 'next/server'

// Agent Runtime passthrough base URL for WordBloom
const AGENT_RUNTIME_BASE = process.env.ADK_BACKEND_ORIGIN ||
  "https://us-central1-aiplatform.googleapis.com/reasoningEngines/v1/projects/820113329049/locations/us-central1/reasoningEngines/1398722001920589824/api"

const LOCAL_BACKEND_BASE = process.env.LOCAL_BACKEND_URL || "http://127.0.0.1:8000"

async function getGoogleAuthToken(): Promise<string | null> {
  // 1. Check if token is explicitly injected in env
  if (process.env.GOOGLE_AUTH_TOKEN) {
    return process.env.GOOGLE_AUTH_TOKEN
  }

  // 2. In Google Cloud Run, get token from Compute Metadata server
  try {
    const metaRes = await fetch(
      "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
      {
        headers: { "Metadata-Flavor": "Google" },
        signal: AbortSignal.timeout(1500),
      }
    )
    if (metaRes.ok) {
      const data = await metaRes.json()
      return data.access_token || null
    }
  } catch {
    // Local environment or metadata server not reachable
  }

  return null
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
