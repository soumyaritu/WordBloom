export interface SessionWordAttempt {
  target: string
  child_answer: string
  is_correct: boolean
  error_pattern?: string | null
  sentence?: string
}

export interface StudentSessionReport {
  child_id: string
  child_name: string
  session_date: string
  session_date_display: string
  duration_minutes: number
  words_attempted: number
  words_correct: number
  accuracy_percent: number
  new_words_mastered: string[]
  words_to_revisit: string[]
  error_patterns_seen: string[]
  adapter_actions: string[]
  breaks_taken: number
  report_text: string
  recommended_profile: string | null
  recommendation_reason: string | null
  is_assessment: boolean
  approval_required: boolean
  approved: boolean
  words?: SessionWordAttempt[]
}

export interface StudentSessionSummary {
  childId: string
  childName: string
  words: SessionWordAttempt[]
  bloomsCount: number
  wordsAttempted: number
  accuracyPercent: number
  masteredWords: string[]
  revisitWords: string[]
  report: StudentSessionReport
}

const SYNC_VERSION_KEY = 'wb_session_sync_v5'

export const DEFAULT_STUDENT_NAMES: Record<string, string> = {
  emma: 'Emma Clarke',
  liam: "Liam O'Connor",
  james: 'James Bond',
  sofia: 'Sony Mathew',
  sony: 'Sony Mathew',
  alex: 'Alex',
}

export const DEFAULT_STUDENT_DYSLEXIA: Record<string, string> = {
  emma: 'phonological',
  liam: 'surface',
  james: 'visual_spatial',
  sofia: 'unknown',
  sony: 'unknown',
  alex: 'non_dyslexic',
}

export const DEFAULT_SESSION_WORDS: Record<string, SessionWordAttempt[]> = {
  emma: [
    { target: 'through', child_answer: 'thru',  is_correct: false, error_pattern: 'silent letter omission', sentence: 'The rabbit ran through the garden fence.' },
    { target: 'knight',  child_answer: 'nite',  is_correct: false, error_pattern: 'silent letter omission', sentence: 'The brave knight rode to the castle.' },
    { target: 'wrist',   child_answer: 'wrist', is_correct: true,  sentence: 'Wear a watch on your wrist.' },
    { target: 'thumb',   child_answer: 'thumb', is_correct: true,  sentence: 'Give a big thumbs up.' },
    { target: 'light',   child_answer: 'light', is_correct: true,  sentence: 'Turn on the reading light.' },
    { target: 'train',   child_answer: 'train', is_correct: true,  sentence: 'The train arrived at the station.' },
    { target: 'beach',   child_answer: 'beach', is_correct: true,  sentence: 'We built sandcastles on the sunny beach.' },
  ],
  liam: [
    { target: 'wrote', child_answer: 'rote', is_correct: false, error_pattern: 'silent letter omission', sentence: 'She wrote a letter to her friend.' },
    { target: 'ship',  child_answer: 'snip', is_correct: false, error_pattern: 'digraph substitution',   sentence: 'The big ship sailed across the ocean.' },
    { target: 'frog',  child_answer: 'frog', is_correct: true,  sentence: 'The green frog jumped in the pond.' },
    { target: 'clap',  child_answer: 'clap', is_correct: true,  sentence: 'Clap your hands to the music.' },
    { target: 'drum',  child_answer: 'drum', is_correct: true,  sentence: 'Beat the rhythm on the drum.' },
    { target: 'star',  child_answer: 'star', is_correct: true,  sentence: 'Look up at the bright twinkling star.' },
  ],
  james: [
    { target: 'dog',   child_answer: 'bog',   is_correct: false, error_pattern: 'b/d letter reversal', sentence: 'The dog ran across the grass.' },
    { target: 'beach', child_answer: 'deach', is_correct: false, error_pattern: 'b/d letter reversal', sentence: 'We built a sandcastle on the sunny beach.' },
    { target: 'star',  child_answer: 'star',  is_correct: true,  sentence: 'Look up at the bright twinkling star.' },
    { target: 'jump',  child_answer: 'jump',  is_correct: true,  sentence: 'Jump high into the air.' },
    { target: 'fish',  child_answer: 'fish',  is_correct: true,  sentence: 'A colourful fish swam past.' },
    { target: 'frog',  child_answer: 'frog',  is_correct: true,  sentence: 'The green frog jumped in the pond.' },
    { target: 'clap',  child_answer: 'clap',  is_correct: true,  sentence: 'Clap your hands to the music.' },
  ],
  sofia: [
    { target: 'through', child_answer: 'thru', is_correct: false, error_pattern: 'phonetic spelling', sentence: 'They walked through the bright forest.' },
    { target: 'sun',     child_answer: 'sun',  is_correct: true,  sentence: 'The warm sun is shining bright.' },
    { target: 'hop',     child_answer: 'hop',  is_correct: true,  sentence: 'Watch the little bunny hop.' },
    { target: 'cup',     child_answer: 'cup',  is_correct: true,  sentence: 'Drink water from the blue cup.' },
    { target: 'pin',     child_answer: 'pin',  is_correct: true,  sentence: 'Fasten the paper with a pin.' },
    { target: 'net',     child_answer: 'net',  is_correct: true,  sentence: 'The butterfly landed on the net.' },
  ],
  sony: [
    { target: 'through', child_answer: 'thru', is_correct: false, error_pattern: 'phonetic spelling', sentence: 'They walked through the bright forest.' },
    { target: 'sun',     child_answer: 'sun',  is_correct: true,  sentence: 'The warm sun is shining bright.' },
    { target: 'hop',     child_answer: 'hop',  is_correct: true,  sentence: 'Watch the little bunny hop.' },
    { target: 'cup',     child_answer: 'cup',  is_correct: true,  sentence: 'Drink water from the blue cup.' },
    { target: 'pin',     child_answer: 'pin',  is_correct: true,  sentence: 'Fasten the paper with a pin.' },
    { target: 'net',     child_answer: 'net',  is_correct: true,  sentence: 'The butterfly landed on the net.' },
  ],
  alex: [
    { target: 'sunshine',  child_answer: 'sunshine',  is_correct: true, sentence: 'Warm sunshine filled the room.' },
    { target: 'adventure', child_answer: 'adventure', is_correct: true, sentence: 'Every book is a great adventure.' },
    { target: 'wonderful', child_answer: 'wonderful', is_correct: true, sentence: 'You did a wonderful job today.' },
    { target: 'rainbow',   child_answer: 'rainbow',   is_correct: true, sentence: 'A double rainbow arched across the sky.' },
  ],
}

export function dedupeStudentName(name: string): string {
  if (!name) return ''
  let cleaned = name
    .trim()
    .replace(/\bJames Patel\b/gi, 'James Bond')
    .replace(/\s+/g, ' ')
  while (/\b([A-Za-z'.-]+)\s+\1\b/i.test(cleaned)) {
    cleaned = cleaned.replace(/\b([A-Za-z'.-]+)\s+\1\b/gi, '$1')
  }
  return cleaned
}

export function normalizeChildId(rawId?: string): string {
  const id = (rawId || 'emma').toLowerCase().trim()
  if (id === 'sony') return 'sofia'
  return id
}

/**
 * One-time cleanup of legacy/mismatched localStorage keys from older builds
 * so all teacher screens start 100% synchronized.
 */
export function ensureSessionDataSynced(): void {
  if (typeof window === 'undefined') return
  try {
    if (localStorage.getItem(SYNC_VERSION_KEY) === 'true') return
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k) continue
      if (k === 'wb_report' || k.startsWith('wb_report_') || k.startsWith('wb_session_words_')) {
        keysToRemove.push(k)
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
    const jamesProfRaw = localStorage.getItem('wb_profile_james')
    if (jamesProfRaw) {
      try {
        const jp = JSON.parse(jamesProfRaw)
        if (!jp.fullName || String(jp.fullName).toLowerCase().includes('patel')) {
          jp.fullName = 'James Bond'
          localStorage.setItem('wb_profile_james', JSON.stringify(jp))
        }
      } catch (e) {}
    }
    localStorage.setItem(SYNC_VERSION_KEY, 'true')
  } catch (e) {}
}

export function resolveStudentIdentity(
  childId: string,
  overrideName?: string,
  overrideDyslexiaType?: string
): { childId: string; fullName: string; firstName: string; dyslexiaType: string } {
  const cleanId = (childId || 'emma').toLowerCase().trim()
  const lookupId = normalizeChildId(cleanId)

  let fullName = overrideName ? dedupeStudentName(overrideName) : (DEFAULT_STUDENT_NAMES[cleanId] || DEFAULT_STUDENT_NAMES[lookupId] || (cleanId.charAt(0).toUpperCase() + cleanId.slice(1)))
  let dyslexiaType = overrideDyslexiaType || DEFAULT_STUDENT_DYSLEXIA[cleanId] || DEFAULT_STUDENT_DYSLEXIA[lookupId] || 'phonological'

  if (typeof window !== 'undefined') {
    try {
      const savedProfRaw =
        localStorage.getItem(`wb_profile_${cleanId}`) ||
        localStorage.getItem(`wb_profile_${lookupId}`) ||
        (lookupId === 'sofia' ? localStorage.getItem('wb_profile_sony') : null)
      if (savedProfRaw) {
        const parsed = JSON.parse(savedProfRaw)
        if (parsed.fullName && parsed.fullName.trim()) {
          fullName = dedupeStudentName(parsed.fullName.trim())
        }
        if (parsed.dyslexiaType) {
          dyslexiaType = String(parsed.dyslexiaType).toLowerCase().trim()
        }
      }
    } catch (e) {}
  }

  if (cleanId === 'sofia' || cleanId === 'sony') {
    if (!fullName || fullName.toLowerCase().includes('sofia')) {
      fullName = 'Sony Mathew'
    }
  }

  const firstName = fullName.split(' ')[0] || 'Student'
  return { childId: cleanId, fullName, firstName, dyslexiaType }
}

function isLegacyInvalidWords(words: any[]): boolean {
  if (!Array.isArray(words) || words.length === 0) return true
  // Reject old 3-wrong-word fallback artifact
  if (words.length === 3 && words.every((w: any) => !w?.is_correct)) return true
  return false
}

export function getStudentSessionWords(childId: string): SessionWordAttempt[] {
  ensureSessionDataSynced()
  const cleanId = (childId || 'emma').toLowerCase().trim()
  const lookupId = normalizeChildId(cleanId)

  if (typeof window !== 'undefined') {
    try {
      const raw =
        localStorage.getItem(`wb_session_words_${cleanId}`) ||
        localStorage.getItem(`wb_session_words_${lookupId}`) ||
        (lookupId === 'sofia' ? localStorage.getItem('wb_session_words_sony') : null)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && !isLegacyInvalidWords(parsed)) {
          return parsed
        }
      }
    } catch (e) {}
  }

  return DEFAULT_SESSION_WORDS[cleanId] || DEFAULT_SESSION_WORDS[lookupId] || DEFAULT_SESSION_WORDS.emma
}

export function getStudentSessionSummary(
  childId: string,
  overrideName?: string,
  overrideDyslexiaType?: string
): StudentSessionSummary {
  ensureSessionDataSynced()
  const identity = resolveStudentIdentity(childId, overrideName, overrideDyslexiaType)
  const words = getStudentSessionWords(identity.childId)

  const uniqueCorrectSet = new Set<string>()
  const uniqueIncorrectSet = new Set<string>()

  words.forEach((w: any) => {
    const wordText = String(typeof w === 'object' ? (w.target || w.word || '') : (w || '')).trim().toLowerCase()
    if (!wordText) return
    const isC = typeof w === 'object' ? Boolean(w.is_correct) : true
    if (isC) {
      uniqueCorrectSet.add(wordText)
      uniqueIncorrectSet.delete(wordText)
    } else if (!uniqueCorrectSet.has(wordText)) {
      uniqueIncorrectSet.add(wordText)
    }
  })

  const masteredWords = Array.from(uniqueCorrectSet)
  const revisitWords = Array.from(uniqueIncorrectSet)
  const attemptedCount = masteredWords.length + revisitWords.length
  const bloomsCount = masteredWords.length
  const accuracyPercent = attemptedCount > 0 ? Math.round((bloomsCount / attemptedCount) * 100) : 100

  const dtypeLower = (identity.dyslexiaType || '').toLowerCase()
  const isUnknown =
    dtypeLower.includes('unknown') ||
    dtypeLower.includes('not sure') ||
    dtypeLower.includes('undetermined')

  let inferredRec: { recProfile: string; recReason: string } | null = null
  if (isUnknown) {
    let hasReversals = false
    let hasTranspositions = false
    let hasSilentLetters = false
    let hasVowels = false

    for (const item of words) {
      if (item && !item.is_correct) {
        const pat = String(item.error_pattern || '').toLowerCase()
        const tgt = String(item.target || '').toLowerCase()
        const ans = String(item.child_answer || '').toLowerCase()
        if (pat.includes('reversal') || (tgt.includes('d') && ans.includes('b')) || (tgt.includes('b') && ans.includes('d')) || (tgt.includes('p') && ans.includes('q'))) {
          hasReversals = true
        }
        if (pat.includes('transposition') || pat.includes('attentional')) {
          hasTranspositions = true
        }
        if (pat.includes('silent') || ['knight', 'through', 'gnome', 'wrote'].includes(tgt)) {
          hasSilentLetters = true
        }
        if (pat.includes('vowel') || pat.includes('phon')) {
          hasVowels = true
        }
      }
    }

    if (hasReversals) {
      inferredRec = {
        recProfile: 'Visual / Spatial',
        recReason: `${identity.firstName} hesitated on letters that mirror or rotate (e.g., b↔d). OpenDyslexic weighted letter bases reduce spatial flipping.`,
      }
    } else if (hasTranspositions) {
      inferredRec = {
        recProfile: 'Attentional',
        recReason: `${identity.firstName} showed letter sequence drifting between word boundaries. Spotlight focus masking isolates words to prevent visual migration.`,
      }
    } else if (hasSilentLetters) {
      inferredRec = {
        recProfile: 'Surface',
        recReason: `${identity.firstName} struggled recognizing irregular whole-word shapes and silent letters. Visual spotlighting and word silhouettes strengthen orthographic memory.`,
      }
    } else if (accuracyPercent >= 80 && revisitWords.length === 0) {
      inferredRec = {
        recProfile: 'Non-dyslexic (Standard Mode)',
        recReason: `${identity.firstName} displayed natural decoding pace and high accuracy (${accuracyPercent}%) without characteristic dyslexic errors. Standard typography and curriculum are recommended.`,
      }
    } else if (hasVowels) {
      inferredRec = {
        recProfile: 'Phonological',
        recReason: `${identity.firstName} showed difficulty distinguishing vowel sounds and letter-sound correspondence. Targeted phonics chunking provides direct phoneme reinforcement.`,
      }
    } else if (accuracyPercent >= 70 && revisitWords.length <= 1) {
      inferredRec = {
        recProfile: 'Non-dyslexic (Standard Mode)',
        recReason: `${identity.firstName} read comfortably without characteristic perceptual dyslexia patterns. Standard curriculum is recommended.`,
      }
    } else {
      inferredRec = {
        recProfile: 'Phonological',
        recReason: `When typing words, ${identity.firstName} demonstrated phonetic spelling patterns and sound-letter substitutions. Targeted sound-by-sound chunking and word-family practice will strengthen letter-sound mapping.`,
      }
    }
  }

  const reportText = isUnknown
    ? `🌸 WordBloom Assessment: ${identity.firstName} earned ${bloomsCount} blooms 🌸 today (${accuracyPercent}% accuracy across ${attemptedCount} words). Evaluator Agent observed letter sound mapping and visual alignment patterns. WordBloom Recommended Profile: ${inferredRec?.recProfile || 'Phonological'}.`
    : `${identity.firstName} completed a focused WordBloom practice session, earning ${bloomsCount} blooms 🌸 with ${accuracyPercent}% accuracy across ${attemptedCount} words.`

  const report: StudentSessionReport = {
    child_id: identity.childId,
    child_name: identity.fullName,
    session_date: new Date().toISOString().split('T')[0],
    session_date_display: new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    duration_minutes: 5,
    words_attempted: attemptedCount,
    words_correct: bloomsCount,
    accuracy_percent: accuracyPercent,
    new_words_mastered: masteredWords,
    words_to_revisit: revisitWords,
    error_patterns_seen: revisitWords.length > 0 ? ['visual / orthographic pattern'] : [],
    adapter_actions: ['continue'],
    breaks_taken: 0,
    report_text: reportText,
    recommended_profile: isUnknown ? (inferredRec?.recProfile || null) : null,
    recommendation_reason: isUnknown ? (inferredRec?.recReason || null) : null,
    is_assessment: isUnknown,
    approval_required: true,
    approved: false,
    words,
  }

  // Persist synchronized report back to localStorage so all screens see identical data
  if (typeof window !== 'undefined') {
    try {
      const lookupId = normalizeChildId(identity.childId)
      localStorage.setItem(`wb_report_${identity.childId}`, JSON.stringify(report))
      localStorage.setItem(`wb_report_${lookupId}`, JSON.stringify(report))
      if (lookupId === 'sofia') {
        localStorage.setItem('wb_report_sony', JSON.stringify(report))
      }
    } catch (e) {}
  }

  return {
    childId: identity.childId,
    childName: identity.fullName,
    words,
    bloomsCount,
    wordsAttempted: attemptedCount,
    accuracyPercent,
    masteredWords,
    revisitWords,
    report,
  }
}

export function recordStudentWordAttempt(
  childIds: string[],
  sessionId: string,
  attempt: SessionWordAttempt,
  studentFullName?: string,
  dyslexiaType?: string
): void {
  if (typeof window === 'undefined') return
  ensureSessionDataSynced()

  const normalizedIds = Array.from(
    new Set(
      childIds
        .map(id => (id || '').toLowerCase().trim())
        .filter(Boolean)
    )
  )

  normalizedIds.forEach(cid => {
    try {
      const sessionTrackKey = `wb_active_session_id_${cid}`
      const prevSessionId = localStorage.getItem(sessionTrackKey)
      let existingWords: SessionWordAttempt[] = []

      if (sessionId && prevSessionId === sessionId) {
        const raw = localStorage.getItem(`wb_session_words_${cid}`)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) existingWords = parsed
        }
      } else if (sessionId) {
        localStorage.setItem(sessionTrackKey, sessionId)
      }

      existingWords.push(attempt)
      localStorage.setItem(`wb_session_words_${cid}`, JSON.stringify(existingWords))
    } catch (e) {}
  })

  // Immediately synchronize the report for all matching IDs
  if (normalizedIds.length > 0) {
    const summary = getStudentSessionSummary(normalizedIds[0], studentFullName, dyslexiaType)
    try {
      localStorage.setItem('wb_report', JSON.stringify(summary.report))
      normalizedIds.forEach(cid => {
        localStorage.setItem(`wb_report_${cid}`, JSON.stringify(summary.report))
      })
    } catch (e) {}
  }
}

