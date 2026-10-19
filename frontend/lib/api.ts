// WordBloom API — connects to FastAPI backend
// Change this to your backend URL if needed

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

export async function startSession(childName: string, excludeWords: string[] = []) {
  const res = await fetch(`${API_URL}/session/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      child_name: childName,
      exclude_words: excludeWords,
    }),
  })
  if (!res.ok) throw new Error("Failed to start session")
  return res.json()
}

export async function submitAnswer(
  sessionId: string,
  childAnswer: string,
  responseTimeSecs: number,
  inputMode: string,
  childName?: string,
  currentWord?: string,
) {
  const res = await fetch(`${API_URL}/session/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id:            sessionId,
      child_answer:          childAnswer,
      response_time_seconds: responseTimeSecs,
      input_mode:            inputMode,
      child_name:            childName,
      current_word:          currentWord,
    }),
  })
  if (!res.ok) throw new Error("Failed to submit answer")
  return res.json()
}

export async function endSession(sessionId: string, childName?: string) {
  const res = await fetch(`${API_URL}/session/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      child_name: childName,
    }),
  })
  if (!res.ok) throw new Error("Failed to end session")
  return res.json()
}

export async function approveReport(
  sessionId: string,
  approved: boolean,
  teacherNotes: string = "",
) {
  const res = await fetch(`${API_URL}/report/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id:   sessionId,
      approved,
      teacher_notes: teacherNotes,
    }),
  })
  if (!res.ok) throw new Error("Failed to approve report")
  return res.json()
}

export async function getChildren() {
  const res = await fetch(`${API_URL}/children`)
  if (!res.ok) throw new Error("Failed to load children")
  return res.json()
}

export async function saveProfile(childId: string, skillContent: string) {
  const res = await fetch(`${API_URL}/profile/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ child_id: childId, skill_content: skillContent }),
  })
  if (!res.ok) throw new Error("Failed to save profile")
  return res.json()
}

export async function getProfile(childId: string) {
  const res = await fetch(`${API_URL}/profile/${childId}`)
  if (!res.ok) throw new Error("Failed to get profile")
  return res.json()
}
