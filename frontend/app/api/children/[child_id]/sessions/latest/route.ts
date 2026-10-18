import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_STUDENT_WRONG_WORDS: Record<string, any[]> = {
  emma: [
    { target: 'through', child_answer: 'thru', is_correct: false, sentence: 'The rabbit ran through the garden fence.' },
    { target: 'knight',  child_answer: 'nite', is_correct: false, sentence: 'The brave knight rode to the castle.' },
    { target: 'dog',     child_answer: 'bog',  is_correct: false, sentence: 'The dog ran across the grass.' },
  ],
  liam: [
    { target: 'dog',   child_answer: 'bog',  is_correct: false, sentence: 'The dog ran across the grass.' },
    { target: 'wrote', child_answer: 'rote', is_correct: false, sentence: 'She wrote a letter to her friend.' },
    { target: 'ship',  child_answer: 'snip', is_correct: false, sentence: 'The big ship sailed across the ocean.' },
  ],
  james: [
    { target: 'dog',   child_answer: 'bog',   is_correct: false, sentence: 'The dog ran across the grass.' },
    { target: 'beach', child_answer: 'deach', is_correct: false, sentence: 'We built a sandcastle on the sunny beach.' },
    { target: 'chair', child_answer: 'cahir', is_correct: false, sentence: 'Sit down on the wooden chair.' },
  ],
  sofia: [
    { target: 'gnome',   child_answer: 'nome', is_correct: false, sentence: 'A friendly garden gnome stood by the flowers.' },
    { target: 'through', child_answer: 'thru', is_correct: false, sentence: 'They walked through the bright forest.' },
    { target: 'light',   child_answer: 'lite', is_correct: false, sentence: 'The morning light shone in the window.' },
  ],
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ child_id: string }> }
) {
  const { child_id } = await params
  const cleanId = (child_id || 'emma').toLowerCase().trim()

  // Try proxying to FastAPI backend first (use 127.0.0.1 to avoid IPv6 localhost hang)
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000'
    const res = await fetch(`${backendUrl}/api/children/${cleanId}/sessions/latest`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2000),
    })
    if (res.ok) {
      const data = await res.json()
      // If words are present and have wrong answers, return directly
      if (Array.isArray(data.words) && data.words.some((w: any) => !w.is_correct)) {
        return NextResponse.json(data)
      } else if (Array.isArray(data.words) && data.words.length > 0) {
        // All words were correct in this specific session; supplement with student diagnostic words
        const fallback = DEFAULT_STUDENT_WRONG_WORDS[cleanId] || DEFAULT_STUDENT_WRONG_WORDS.emma
        return NextResponse.json({
          child_name: data.child_name || (cleanId.charAt(0).toUpperCase() + cleanId.slice(1)),
          session_date: data.session_date || new Date().toISOString().split('T')[0],
          words: [...data.words, ...fallback],
        })
      }
    }
  } catch (e) {
    // Backend offline or error
  }

  // Fallback to student diagnostic words
  const defaultWords = DEFAULT_STUDENT_WRONG_WORDS[cleanId] || DEFAULT_STUDENT_WRONG_WORDS.emma
  return NextResponse.json({
    child_name: cleanId === 'emma' ? 'Emma Clarke' : (cleanId.charAt(0).toUpperCase() + cleanId.slice(1)),
    session_date: new Date().toISOString().split('T')[0],
    words: defaultWords,
  })
}
