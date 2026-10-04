# WordBloom — AGENTS.md
## Project specification for Antigravity / AI coding agents

---

## What this project is

WordBloom is an adaptive reading learning system for children with dyslexia
and other learning differences. It uses Google ADK multi-agent architecture
to personalise every session to each child's specific needs.

Tagline: Every word. Every child. Every way.

---

## Folder structure

```
WordBloom/
├── AGENTS.md                          ← this file
├── backend/
│   ├── main.py                        ← FastAPI server
│   ├── requirements.txt
│   ├── test_wordbloom.py
│   └── wordbloom_agent/
│       ├── __init__.py
│       ├── .env                       ← GOOGLE_CLOUD_PROJECT + GOOGLE_CLOUD_LOCATION
│       ├── agent.py                   ← Root orchestrator (root_agent must be here)
│       ├── profile_agent.py
│       ├── word_selector_agent.py
│       ├── evaluator_agent.py
│       ├── adapter_agent.py
│       ├── encouragement_agent.py
│       ├── report_agent.py
│       └── skills/
│           ├── emma/
│           │   └── SKILL.md           ← Emma's learning profile
│           ├── james/
│           │   └── SKILL.md
│           ├── sofia/
│           │   └── SKILL.md
│           ├── dyslexic-heroes/
│           │   └── SKILL.md
│           └── word-bank/
│               └── SKILL.md
└── frontend/
    ├── package.json                   ← Next.js 15
    ├── next.config.js
    ├── tsconfig.json
    ├── app/
    │   ├── layout.tsx
    │   ├── globals.css
    │   ├── page.tsx                   ← Home screen
    │   ├── game/
    │   │   └── page.tsx               ← Word game screen
    │   ├── teacher/
    │   │   └── page.tsx               ← Teacher dashboard + approval gate
    │   └── profile/
    │       └── page.tsx               ← Profile setup screen (NEW)
    ├── components/                    ← Reusable components
    └── lib/
        └── api.ts                     ← All fetch calls to backend
```

---

## Google Cloud authentication

NEVER use a Gemini API key. Always use Google Cloud Vertex AI.

```python
import vertexai
from google import genai
from dotenv import load_dotenv

load_dotenv()

vertexai.init(
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
)

client = genai.Client(
    vertexai=True,
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
)
```

The .env file is at backend/wordbloom_agent/.env:
```
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
```

---

## Agent architecture

### Rule: root_agent must be in agent.py

ADK discovers agents by looking for `root_agent` in `agent.py`.
This variable MUST exist in `wordbloom_agent/agent.py`.

### The 6 agents

```
Root Orchestrator (agent.py)
├── ProfileAgent        (profile_agent.py)
├── WordSelectorAgent   (word_selector_agent.py)
├── EvaluatorAgent      (evaluator_agent.py)
├── AdapterAgent        (adapter_agent.py)
├── EncouragementAgent  (encouragement_agent.py)
└── ReportAgent         (report_agent.py)
```

### Agent Skills — how to load them

Use SkillToolset to load child profiles and knowledge files.
The skills/ folder is inside wordbloom_agent/.

```python
import pathlib
from google.adk.skills import load_skill_from_dir
from google.adk.tools.skill_toolset import SkillToolset

SKILLS_DIR = pathlib.Path(__file__).parent / "skills"

skill_toolset = SkillToolset(
    skills=[
        load_skill_from_dir(SKILLS_DIR / "emma"),
        load_skill_from_dir(SKILLS_DIR / "james"),
        load_skill_from_dir(SKILLS_DIR / "sofia"),
        load_skill_from_dir(SKILLS_DIR / "word-bank"),
        load_skill_from_dir(SKILLS_DIR / "dyslexic-heroes"),
    ],
)
```

CRITICAL: The `name:` in each SKILL.md frontmatter must exactly match
the folder name. emma/ → name: emma. word-bank/ → name: word-bank.

### Agent Skills SKILL.md format

Every SKILL.md must have this frontmatter:

```markdown
---
name: emma
description: Emma Clarke's learning profile. Load at the start of every session for this child.
---

# Emma Clarke — Learning Profile
...content...
```

### Sub-agent pattern — use AgentTool

Wrap every sub-agent with AgentTool when adding to root_agent:

```python
from google.adk.tools.agent_tool import AgentTool

root_agent = Agent(
    name="wordbloom",
    model="gemini-2.0-flash",
    description="Adaptive reading tutor for every child",
    instruction="...",
    tools=[
        AgentTool(agent=word_selector_agent),
        AgentTool(agent=evaluator_agent),
        AgentTool(agent=encouragement_agent),
        AgentTool(agent=adapter_agent),
        AgentTool(agent=reporter_agent),
        skill_toolset,
    ],
)
```

---

## Pipeline flow

```
POST /session/start
  → ProfileAgent loads child SKILL.md
  → WordSelectorAgent picks first word
  → Returns: { session_id, profile, first_word }

POST /session/answer
  → EvaluatorAgent scores the answer
  → AdapterAgent decides next action
  → EncouragementAgent generates message
  → WordSelectorAgent picks next word
  → Returns: { evaluation, adaptation, encouragement, next_word, session_stats }

POST /session/end
  → ReportAgent generates teacher summary
  → Returns: { report } with approval_required: true

POST /report/approve
  → Teacher approves before anything sends
  → This is the approval gate — nothing publishes without human approval

POST /profile/save
  → Saves updated SKILL.md for a child
  → Called from profile setup screen

GET /profile/{child_id}
  → Returns current SKILL.md content for editing

GET /children
  → Lists all children with profiles in skills/

GET /
  → Health check
```

---

## Profile setup screen — what to build

File: `frontend/app/profile/page.tsx`

This screen lets teachers set up or edit a child's profile before
a session. It should have these sections in order:

### Section 1: Identity
- Full name (text input, default: child name from URL param)
- Age (number input)
- School year (text input, e.g. "Year 4")

### Section 2: Dyslexia type (pick one)
Show as a 2-column grid of selectable cards:
- Phonological — "Difficulty connecting letters to sounds"
- Surface — "Difficulty recognising whole words"
- Visual/spatial — "Letters appear to move or flip"
- Double deficit — "Speed and sound processing both affected"
- Attentional — "Letters swap between words"
- Not sure yet — "Agent will assess during session"

### Section 3: Co-occurring conditions (pick multiple)
Show as toggleable pills:
- ADHD
- Dyspraxia
- Autism
- Dyscalculia

When ADHD is selected: show amber warning alert:
"ADHD detected — session auto-set to 5 min, break every 5 words,
encouragement style set to specific (factual not vague)"

When Autism is selected: show accent alert:
"Autism flag — encouragement will use specific facts only.
No sudden difficulty changes."

### Section 4: Reading level (pick one)
Four buttons in a row: Stage 1 / Stage 2 / Stage 3 / Stage 4
Below each show small description text:
Stage 1: Simple CVC words
Stage 2: Digraphs and blends
Stage 3: Silent letters
Stage 4: Multisyllabic

### Section 5: How they answer (pick one)
Three cards side by side:
- Type it (keyboard icon) — "Keyboard input"
- Say it (microphone icon) — "Voice / speech input"  [pre-selected for voice mode]
- Tap letters (grid icon) — "Letter tile selection"

### Section 6: Display mode (pick one)
Three stacked selectable rows:
- Standard — "Default font and spacing"
- OpenDyslexic — "Weighted letters reduce flipping" [pre-selected]
- Spotlight — "One word at a time, rest masked"

### Section 7: Colour overlay (pick one)
Row of colour circles + None option:
- None
- Yellow circle (#FEF3C7)
- Blue circle (#DBEAFE)
- Green circle (#D1FAE5)
- Pink circle (#FCE7F3)
Label: "Child picks what feels right"

### Section 8: Session settings
- Session length slider (3–15 min). If ADHD: locked to 5, show "(ADHD auto-set)"
- Break after N words slider (3–15). If ADHD: locked to 5, show "(ADHD auto-set)"
- Static info box: "Timer: never shown — removes time pressure for all dyslexia types"

### Save button
Green button full width: "Save [name]'s profile"

On save:
1. Call POST /profile/save with the SKILL.md content
2. Save to localStorage as wb_profile_{child_id}
3. Navigate back to home page /

### Route
Page is at /profile?child=emma
`child` URL param determines which child to edit.
Default to 'emma' if not provided.

---

## Home screen updates needed

File: `frontend/app/page.tsx`

Add to each child card:
- Edit button (pencil icon) that appears on hover and when selected
- Clicking Edit navigates to /profile?child={child_id}
- Load saved profiles from localStorage on mount
- "+ Add a child" button below the child list that goes to /profile?child=new

---

## Design rules for frontend

### Colours
- Background: #06080F (near black)
- Cards/panels: #111827
- Borders: #1F2937
- Primary green (WordBloom brand): #10B981
- Green background tint: rgba(16,185,129,0.08)
- Green border: rgba(16,185,129,0.3)
- Amber warning: #F59E0B
- Text primary: #F9FAFB
- Text secondary: #9CA3AF
- Text muted: #6B7280

### Component patterns
- Selected state: 2px green border + green background tint
- Unselected state: 1px #1F2937 border + #111827 background
- Buttons: border-radius 50px for primary actions, 10px for cards
- Section labels: 11px uppercase letter-spacing font-weight 500 color muted
- All inputs: padding 10-14px, #111827 background, #1F2937 border, 10px radius

### Never
- Never show a timer to the child
- Never show numerical scores (stars only)
- Never use red for errors about child performance
- Never use vague praise like "Good job!" — always specific

---

## SKILL.md format for each child

```markdown
---
name: emma
description: Emma Clarke's learning profile. Load at the start of every session for this child.
---

# Emma Clarke — Learning Profile

## Identity
- Full name: Emma Clarke
- Age: 9
- School year: Year 4

## Dyslexia Profile
- Type: phonological
- Co-occurring: adhd

## Access Settings
- Input mode: voice
- Display mode: opendyslexic
- Colour overlay: yellow
- Show timer: never
- Score display: stars only

## Session Settings
- Session length: 5
- Break after: 5
- Approach: audio_first
- Encouragement style: specific

## Current Progress
- Reading level: 3
- Mastered words: cat, dog, run, play, help
- Struggling with: through, knight, enough
- Pattern difficulty: silent letters
```

---

## Backend endpoints to implement

### POST /profile/save
```python
@app.post("/profile/save")
async def save_profile(body: dict):
    child_id = body.get("child_id", "emma")
    skill_content = body.get("skill_content", "")
    skill_dir = SKILLS_DIR / child_id
    skill_dir.mkdir(parents=True, exist_ok=True)
    (skill_dir / "SKILL.md").write_text(skill_content)
    return {"saved": True, "child_id": child_id}
```

### GET /profile/{child_id}
```python
@app.get("/profile/{child_id}")
async def get_profile(child_id: str):
    skill_file = SKILLS_DIR / child_id / "SKILL.md"
    if not skill_file.exists():
        return {"found": False}
    return {"found": True, "content": skill_file.read_text()}
```

### GET /children
```python
@app.get("/children")
async def list_children():
    skills_dir = Path(__file__).parent / "wordbloom_agent" / "skills"
    children = []
    for f in skills_dir.iterdir():
        if f.is_dir() and (f / "SKILL.md").exists():
            children.append({"id": f.name, "name": f.name.capitalize()})
    return {"children": children}
```

---

## How to run

### Backend
```bash
cd WordBloom/backend
pip install -r requirements.txt
python main.py
# Runs on http://localhost:8000
```

### Frontend
```bash
cd WordBloom/frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### Test all agents
```bash
cd WordBloom/backend
python test_wordbloom.py
```

---

## What a complete session looks like

1. Teacher opens http://localhost:3000
2. Selects Emma from home screen
3. Clicks ✏️ Edit to review/update her profile
4. Profile screen shows — teacher confirms dyslexia type, reading level, input mode
5. Teacher saves — SKILL.md updates
6. Teacher clicks Start Session
7. Frontend calls POST /session/start → ProfileAgent loads Emma's SKILL.md
8. Word game screen opens — first word shown with colour coding
9. Emma answers (type/voice/tap)
10. EvaluatorAgent scores → AdapterAgent adjusts → EncouragementAgent responds
11. Next word appears
12. After 5 words: break reminder (ADHD)
13. Session ends: ReportAgent drafts summary
14. Teacher dashboard shows report
15. Teacher reviews and clicks Approve
16. Report sends to parents — NOTHING sent before approval

---

## Pitch line

"Every dyslexia app treats it as one thing. It isn't.
WordBloom is the first multi-agent system that adapts to
6 dyslexia types, 3 co-occurring conditions, and 3 input modes —
with every agent decision observable, evaluable and
explainable to teachers in plain English."

