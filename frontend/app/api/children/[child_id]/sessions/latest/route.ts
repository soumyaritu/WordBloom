import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_STUDENT_WRONG_WORDS: Record<string, any[]> = {
  emma: [
    { target: 'wrist',   child_answer: 'wrist', is_correct: true,  sentence: 'Wear a watch on your wrist.' },
    { target: 'thumb',   child_answer: 'thumb', is_correct: true,  sentence: 'Give a big thumbs up.' },
    { target: 'light',   child_answer: 'light', is_correct: true,  sentence: 'Turn on the reading light.' },
    { target: 'train',   child_answer: 'train', is_correct: true,  sentence: 'The train arrived at the station.' },
    { target: 'beach',   child_answer: 'beach', is_correct: true,  sentence: 'We built sandcastles on the sunny beach.' },
    { target: 'through', child_answer: 'thru',  is_correct: false, sentence: 'The rabbit ran through the garden fence.' },
    { target: 'knight',  child_answer: 'nite',  is_correct: false, sentence: 'The brave knight rode to the castle.' },
  ],
  liam: [
    { target: 'frog',  child_answer: 'frog',  is_correct: true,  sentence: 'The green frog jumped in the pond.' },
    { target: 'clap',  child_answer: 'clap',  is_correct: true,  sentence: 'Clap your hands to the music.' },
    { target: 'drum',  child_answer: 'drum',  is_correct: true,  sentence: 'Beat the rhythm on the drum.' },
    { target: 'star',  child_answer: 'star',  is_correct: true,  sentence: 'Look up at the bright twinkling star.' },
    { target: 'wrote', child_answer: 'rote',  is_correct: false, sentence: 'She wrote a letter to her friend.' },
    { target: 'ship',  child_answer: 'snip',  is_correct: false, sentence: 'The big ship sailed across the ocean.' },
  ],
  james: [
    { target: 'star',  child_answer: 'star',  is_correct: true,  sentence: 'Look up at the bright twinkling star.' },
    { target: 'jump',  child_answer: 'jump',  is_correct: true,  sentence: 'Jump high into the air.' },
    { target: 'fish',  child_answer: 'fish',  is_correct: true,  sentence: 'A colourful fish swam past.' },
    { target: 'dog',   child_answer: 'bog',   is_correct: false, sentence: 'The dog ran across the grass.' },
    { target: 'beach', child_answer: 'deach', is_correct: false, sentence: 'We built a sandcastle on the sunny beach.' },
  ],
  sofia: [
    { target: 'sun',     child_answer: 'sun',  is_correct: true,  sentence: 'The warm sun is shining bright.' },
    { target: 'hop',     child_answer: 'hop',  is_correct: true,  sentence: 'Watch the little bunny hop.' },
    { target: 'cup',     child_answer: 'cup',  is_correct: true,  sentence: 'Drink water from the blue cup.' },
    { target: 'pin',     child_answer: 'pin',  is_correct: true,  sentence: 'Fasten the paper with a pin.' },
    { target: 'net',     child_answer: 'net',  is_correct: true,  sentence: 'The butterfly landed on the net.' },
    { target: 'through', child_answer: 'thru', is_correct: false, sentence: 'They walked through the bright forest.' },
  ],
  sony: [
    { target: 'sun',     child_answer: 'sun',  is_correct: true,  sentence: 'The warm sun is shining bright.' },
    { target: 'hop',     child_answer: 'hop',  is_correct: true,  sentence: 'Watch the little bunny hop.' },
    { target: 'cup',     child_answer: 'cup',  is_correct: true,  sentence: 'Drink water from the blue cup.' },
    { target: 'pin',     child_answer: 'pin',  is_correct: true,  sentence: 'Fasten the paper with a pin.' },
    { target: 'net',     child_answer: 'net',  is_correct: true,  sentence: 'The butterfly landed on the net.' },
    { target: 'through', child_answer: 'thru', is_correct: false, sentence: 'They walked through the bright forest.' },
  ],
  alex: [
    { target: 'sunshine',  child_answer: 'sunshine',  is_correct: true, sentence: 'Warm sunshine filled the room.' },
    { target: 'adventure', child_answer: 'adventure', is_correct: true, sentence: 'Every book is a great adventure.' },
    { target: 'wonderful', child_answer: 'wonderful', is_correct: true, sentence: 'You did a wonderful job today.' },
    { target: 'rainbow',   child_answer: 'rainbow',   is_correct: true, sentence: 'A double rainbow arched across the sky.' },
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
    const backendUrl = process.env.BACKEND_URL || process.env.LOCAL_BACKEND_URL || process.env.ADK_BACKEND_ORIGIN || 'http://127.0.0.1:8000'
    const res = await fetch(`${backendUrl}/api/children/${cleanId}/sessions/latest`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2000),
    })
    if (res.ok) {
      const data = await res.json()
      // If words are present and have wrong answers, return directly
      if (Array.isArray(data.words) && data.words.length > 0) {
        return NextResponse.json(data)
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
