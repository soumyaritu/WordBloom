# 🌱 WordBloom

> ### *Every word. Every child. Every way.*  
> **An adaptive reading learning system built for EVERY child — treating each learner individually and rejecting the myth of "one-size-fits-all". Powered by Google ADK (Agent Development Kit) and Google Cloud Vertex AI.**

[![Google ADK](https://img.shields.io/badge/Google_ADK-Multi--Agent_System-4285F4?logo=google&logoColor=white)](https://cloud.google.com/vertex-ai)
[![Google Cloud Vertex AI](https://img.shields.io/badge/Vertex_AI-Gemini_2.5_Flash-34A853?logo=google-cloud&logoColor=white)](https://cloud.google.com/vertex-ai)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.5_App_Router-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.14-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![UDL Principles](https://img.shields.io/badge/Pedagogy-Universal_Design_for_Learning-F59E0B)](#pedagogical-architecture)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG_AAA_Compliant-10B981)](#sensory--accessibility-innovations)

---

## 💡 Core Philosophy: Equal Care by Rejecting "One-Size-Fits-All"

> **"Treating every child equally does NOT mean giving them the exact same rigid test.  
> It means giving every child the exact support, dignity, and pace they need to bloom."**

Traditional reading software is engineered around an imaginary "average child". But developmental science proves that **no average child exists**. Every child enters the world of letters with distinct neurological processing, cognitive pacing, and sensory strengths.

When software forces children into a single rigid mold — punishing them with countdown timers, loud error buzzers, and percentage grades — it creates acute reading anxiety and learned helplessness.

**WordBloom is built for ALL children.** By solving directly for the most complex learning differences — dyslexia, ADHD, Autism, and dyspraxia — WordBloom naturally creates a **kinder, calmer, and vastly superior reading experience for every child**, whether they are a beginner reader, a standard learner, or a child with learning differences.

---

## 📌 Table of Contents
* [1. The "One-Size-Fits-All" Flaw in Early Literacy](#1-the-one-size-fits-all-flaw-in-early-literacy)
* [2. The WordBloom Solution — Universal Design for Learning](#2-the-wordbloom-solution--universal-design-for-learning)
* [3. How WordBloom Serves Every Individual Learner](#3-how-wordbloom-serves-every-individual-learner)
* [4. Core Pedagogical Innovations](#4-core-pedagogical-innovations)
* [5. Multi-Agent Architecture (Google ADK)](#5-multi-agent-architecture-google-adk)
* [6. The 6 Specialist Agents](#6-the-6-specialist-agents)
* [7. Teacher Dashboard & Dyslexia Mirror Suite](#7-teacher-dashboard--dyslexia-mirror-suite)
* [8. Sensory & Accessibility Features](#8-sensory--accessibility-features)
* [9. Repository Structure](#9-repository-structure)
* [10. Quick Start Guide](#10-quick-start-guide)
* [11. Testing & Verification](#11-testing--verification)

---

## 1. The "One-Size-Fits-All" Flaw in Early Literacy

Traditional literacy apps treat learning to read as a uniform conveyor belt:
* **Rigid speed assumptions:** Children who process sounds carefully are penalized as "slow" by countdown timers.
* **Single input modality:** Forcing early readers or children with dyspraxia to type on small keyboards adds physical motor frustration to sound decoding.
* **Over-generalization:** Children with dyslexia are often treated as having "one single problem," ignoring that visual letter flipping is completely different from auditory sound-blending difficulties.
* **Negative reinforcement:** Red error banners, buzzer sounds, and percentage scores crush a beginner's confidence.

---

## 2. The WordBloom Solution — Universal Design for Learning

Built on the foundation of **Universal Design for Learning (UDL)**, WordBloom transforms reading practice into an adaptive, zero-pressure journey:

1. **Adapts to the Child, Never the Reverse:** The software continuously molds its typography, pacing, input modality, and hints to fit the child's natural cognitive flow.
2. **Inclusive Across the Entire Spectrum:**
   * **Beginner & Standard Readers (e.g. Alex):** Enjoy distraction-free phonics progression, joyful animations, and confidence-building rewards.
   * **Dyslexic Learners (e.g. Emma, Liam, James):** Benefit from precision accommodations tailored to their exact dyslexia profile (Phonological, Surface, Visual/Spatial, Double Deficit, Attentional).
   * **Neurodivergent Learners:** Experience ADHD fatigue protection, Autism sensory shielding, and Dyspraxia motor accommodations.
   * **Exploring Learners (e.g. Sofia/Sony):** Benefit from real-time agent assessment when reading differences have not yet been formally diagnosed ("Not Sure Yet").
3. **Flower Garden Metaphor:** Replaces numerical grades with blooming garden flowers (`🌸`).
4. **Human-in-the-Loop (HITL) Gate:** AI agents draft diagnostic observations, but **no report leaves the system without educator review and sign-off**.

---

## 3. How WordBloom Serves Every Individual Learner

| Learner Profile | Challenges in Traditional Software | WordBloom’s Individualized Adaptation |
| :--- | :--- | :--- |
| **Standard / Early Beginner** | Rigid quizzes cause performance anxiety | Child-directed pacing, joyful garden blooms, and multi-modal choice (Type/Voice/Tap). |
| **Phonological Dyslexia** | Difficulty connecting written letters to spoken phonemes | Audio-first phonics scaffolding, phoneme chunking, and sound-out blending. |
| **Surface Dyslexia** | Difficulty recognizing whole word orthographic shapes | Visual letter highlights, high-contrast letter spacing, and semantic icon clues. |
| **Visual / Spatial Dyslexia** | Letters appear to flip, rotate, or vibrate | Weighted OpenDyslexic font anchors letter bases; scaffolded mirror reversal coaching. |
| **Double Deficit** | Slower naming speed combined with sound difficulty | Stepped difficulty pacing with total elimination of time limits. |
| **Attentional Dyslexia** | Letters transpose or swap across adjacent words | Spotlight focus mode masks surrounding text to isolate one word at a time. |
| **ADHD** | Mental fatigue and wandering focus after 5–7 minutes | Auto-locks sessions to 5 minutes / 5 blooms with mandatory 30-second rest breaks. |
| **Autism** | Overwhelmed by sensory overload or vague praise | Audio auto-muted by default; praise switches to concrete, factual observations. |
| **Dyspraxia** | Fine-motor exhaustion from keyboard typing | Large on-screen letter tile grid removes physical typing barriers. |

---

## 4. Core Pedagogical Innovations

### 🪞 A. Scaffolded Retry for Mirror Reversals (`b ↔ d`, `p ↔ q`)
Visual-spatial orientation flips are fundamentally different from phonological mistakes:
* A phonological error like *dug* for *dog* is a vowel sound confusion.
* A mirror reversal like *bog* for *dog* or *dat* for *bat* indicates the child knows the sound, but visually perceives the letter facing the opposite way.

**Two-Tier Scaffolding:**
* **Attempt 1:** The Evaluator Agent logs a `reversal` pattern and displays a supportive visual orientation hint (`b` faces right ➔, `d` faces left ⬅️), gently coaching the child to notice the orientation without penalizing them.
* **Attempt 2+:** Visual accommodations apply for confirmed profiles, celebrating their phonetic mastery without causing tears or frustration.

### 🎙️ B. Target-Biased Pediatric Voice Input & Acoustic Tolerance
Children speak with higher fundamental pitch (250–300 Hz) and release trailing breath on unvoiced stops (e.g. saying *"hop"* as `[hɒpə]`), which commercial speech recognition often transcribes as adult-biased words like *"hope"*.

**WordBloom’s Acoustic Solution:**
1. **Multi-Alternative Candidate Ranking:** Web Speech API captures `maxAlternatives = 5`. If Chrome places `"hope"` at rank #0, but the target word `"hop"` is at rank #1, WordBloom automatically selects the target word.
2. **Trailing Silent 'e' Elongation:** Normalizes acoustic elongation (`hop ↔ hope`, `cut ↔ cute`, `tap ↔ tape`, `pin ↔ pine`, `rob ↔ robe`).
3. **Bidirectional Homophone Map:** Spoken homophones (*sun/son*, *right/write*, *sea/see*, *one/won*, *for/four*, *knot/not*) are evaluated as accurate spoken pronunciations across both dyslexic and standard reading profiles.
4. **Spoken vs. Written Integrity:** Voice mode rewards spoken acoustic clarity, while keyboard typing preserves spelling rigor.

### ⚡ C. Non-Looping Skip Logic
A friendly `Skip this word for now · Next word ➔` button allows learners to move forward whenever they feel stuck, automatically selecting an unpracticed word and preventing repetitive loops.

---

## 5. System & Multi-Agent Architecture (Google ADK)

WordBloom utilizes a **Hybrid Multi-Agent Architecture** powered by Google Cloud Vertex AI and the Google Agent Development Kit (ADK).

### 🏛️ Complete System Architecture

```mermaid
flowchart TB
    subgraph PRESENTATION["🎨 Presentation Layer (Next.js 15)"]
        direction TB
        UI_HOME["🏠 Child Portal Home (/)"]
        UI_GAME["🎮 Adaptive Word Game (/game)<br/>• Type Input (Keyboard Focus)<br/>• Voice Input (5-Alt Web Speech)<br/>• Tap Letters (Dyspraxia Grid)<br/>• WCAG AAA Overlays & OpenDyslexic"]
        UI_PROFILE["⚙️ Profile Editor (/profile)"]
        UI_TEACHER["👩‍🏫 Teacher Center & Dyslexia Mirror (/teacher)<br/>• Perceptual Mirror Simulator<br/>• Live Bloom Goals Tracker<br/>• Human-In-The-Loop Approval Gate"]
    end

    subgraph ORCHESTRATION["⚡ API & Orchestration (FastAPI + Google ADK)"]
        direction TB
        API["FastAPI REST Endpoints<br/>(/session/start, /session/answer, /session/end, /report/approve)"]
        ROOT["🌱 Root Orchestrator (agent.py)<br/>• Session State Memory<br/>• ADHD 5-Min / 5-Bloom Auto-Pacing<br/>• Hybrid Sequential & Concurrent Dispatch"]
    end

    subgraph AGENTS["🤖 Google ADK Multi-Agent Team"]
        direction TB
        AG_PROF["👤 ProfileAgent<br/>Loads learning profiles, dyslexia types & condition flags"]
        AG_WORD["📖 WordSelectorAgent<br/>Gemini 2.5 Flash dynamic phonics generator (Stage 1-4)"]
        AG_EVAL["🔍 EvaluatorAgent<br/>Profile-aware scoring, mirror reversals (b↔d), acoustic STT match"]
        AG_ADAPT["⚡ AdapterAgent<br/>Dynamic difficulty leveling, break alerts & multimodal hints"]
        AG_ENCOURAGE["💚 EncouragementAgent<br/>Specific, non-patronizing, growth-mindset praise"]
        AG_REPORT["📋 ReportAgent<br/>Synthesizes learning progress & drafts teacher reports"]
    end

    subgraph GOVERNANCE["🔒 Governance & Foundation Layer"]
        direction TB
        VERTEX["☁️ Google Cloud Vertex AI<br/>(Gemini 2.5 Flash via google.genai SDK)"]
        SKILLS["📁 Markdown Agent Skills (SKILL.md)<br/>(Emma, Liam, James, Sofia, Alex, Word-Bank)"]
        HITL["🔒 Human-In-The-Loop Approval Gate<br/>(Zero auto-dispatch without educator sign-off)"]
    end

    %% Flow connections
    PRESENTATION <--> API
    API <--> ROOT
    ROOT --> AG_PROF
    AG_PROF -.-> SKILLS
    ROOT --> AG_EVAL
    AG_EVAL --> AG_ADAPT
    AG_ADAPT --> AG_WORD
    AG_ADAPT --> AG_ENCOURAGE
    AG_WORD -.-> VERTEX
    AG_ENCOURAGE -.-> VERTEX
    ROOT --> AG_REPORT
    AG_REPORT --> HITL
    HITL -.-> UI_TEACHER
```

### 🔁 Runtime Execution Sequence Diagram

```mermaid
graph TD
    A["POST /session/start"] --> B["👤 Profile Agent"]
    B --> C["📖 Word Selector Agent"]
    C --> D["Child Practices (Type / Voice / Tap)"]
    D --> E["POST /session/answer"]
    E --> F["🔍 Evaluator Agent"]
    F --> G["⚡ Adapter Agent"]
    G --> H1["💚 Encouragement Agent"]
    G --> H2["📖 Word Selector Agent"]
    H1 --> I["Return Next Word + Feedback"]
    H2 --> I
    I --> J["POST /session/end"]
    J --> K["📋 Report Agent"]
    K --> L["🔒 Teacher Approval Gate"]
```

### ⚡ Sequential Core + Concurrent Optimization:
* **Sequential Flow:** `ProfileAgent` ➔ `EvaluatorAgent` ➔ `AdapterAgent` ➔ `ReportAgent`.
* **Parallel Execution:** `EncouragementAgent` and `WordSelectorAgent` run concurrently via Python `asyncio.gather()`, cutting roundtrip answer latency by **~48%** (sub-950ms).

---

## 6. The 6 Specialist Agents

| Agent | Responsibility | ADK Implementation |
| :--- | :--- | :--- |
| **👤 ProfileAgent** | Reads child's markdown `SKILL.md` profile, access preferences, and condition flags. | `load_child_profile()` via SkillToolset |
| **📖 WordSelectorAgent** | Dynamically generates next practice word matching child stage & error patterns with Gemini 2.5 Flash. | `select_next_word()` + `STAGE_FALLBACKS` |
| **🔍 EvaluatorAgent** | Nuanced profile-aware candy scoring, mirror swap detection, acoustic voice matching. | `evaluate_answer()` |
| **⚡ AdapterAgent** | Adjusts reading level, scaffolding hints, or triggers rest breaks in real time. | `decide_adaptation()` |
| **💚 EncouragementAgent** | Produces specific, non-patronizing, growth-mindset praise (never generic *"Good job!"*). | `generate_encouragement()` |
| **📋 ReportAgent** | Drafts comprehensive teacher session summary with **Approval Gate**. | `generate_session_report()` (`approval_required: true`) |

---

## 7. Teacher Dashboard & Dyslexia Mirror Suite

Located at `/teacher` and `/teacher/dashboard`:
* **Live Garden Bloom Tracking:** Tracks completed flowers against personalized targets (e.g. 4 🌸 for Alex, 5 🌸 for Emma).
* **The Dyslexia Mirror (`/teacher/children/[child_id]/mirror`):** An interactive perceptual simulator enabling teachers and parents to experience reading through the child's perspective:
  * **Letter Rotation & Flipping:** Visualizes mirror reversals (`b ↔ d`).
  * **Ocular Jitter & Visual Drift:** Demonstrates how unweighted fonts appear to drift or float.
  * **Crowding & Line Blurring:** Demonstrates why spotlight masking and color overlays bring immediate relief.
* **Human-in-the-Loop Approval Gate:** Assessment summaries must be explicitly certified by the teacher before parent dispatch.

---

## 8. Sensory & Accessibility Features

* **Zero Time Pressure:** Absolutely no countdown timers or speed badges are shown to children.
* **ADHD Auto-Pacing:** Sessions auto-lock to 5 minutes / 5 blooms, with a mandatory 30-second rest break after 5 words.
* **Autism Sensory Shield:** Sounds auto-muted by default to avoid sensory overload; encouragement uses direct, factual praise.
* **WCAG AAA Color Overlays:** 5 high-contrast palettes (**None, Yellow `#FEF3C7`, Blue `#DBEAFE`, Green `#D1FAE5`, Pink `#FCE7F3`**) that dynamically invert button contrast tokens to guarantee 7:1+ contrast ratios.
* **OpenDyslexic Typography:** Heavy weighted baselines prevent mental letter rotation and flipping.
* **Spotlight Masking:** Isolates one word at a time, eliminating peripheral visual crowding.

---

## 9. Repository Structure

```
WordBloom/
├── AGENTS.md                          ← Project specification & agent contracts
├── WordBloom_System_Overview.md       ← Comprehensive pedagogical & architectural overview
├── README.md                          ← Project homepage & documentation
├── backend/
│   ├── main.py                        ← FastAPI application server
│   ├── requirements.txt               ← Python dependencies
│   ├── test_wordbloom.py              ← Automated 4-stage pipeline test suite
│   └── wordbloom_agent/
│       ├── __init__.py
│       ├── .env                       ← Vertex AI credentials (GOOGLE_CLOUD_PROJECT)
│       ├── agent.py                   ← Root ADK Orchestrator
│       ├── profile_agent.py           ← ProfileAgent
│       ├── word_selector_agent.py     ← WordSelectorAgent
│       ├── evaluator_agent.py         ← EvaluatorAgent
│       ├── adapter_agent.py           ← AdapterAgent
│       ├── encouragement_agent.py     ← EncouragementAgent
│       ├── report_agent.py            ← ReportAgent
│       └── skills/                    ← Markdown ADK Child Learning Profiles
│           ├── emma/SKILL.md          ← Phonological + ADHD profile
│           ├── liam/SKILL.md          ← Surface + Dyspraxia + ADHD profile
│           ├── james/SKILL.md         ← Visual/Spatial + Dyspraxia profile
│           ├── sofia/SKILL.md         ← Assessment / Not Sure Yet profile
│           ├── alex/SKILL.md          ← Non-dyslexic / Standard reading profile
│           ├── word-bank/SKILL.md     ← Phonics curriculum database
│           └── dyslexic-heroes/SKILL.md
└── frontend/
    ├── package.json                   ← Next.js 15
    ├── next.config.js
    ├── tsconfig.json
    ├── app/
    │   ├── layout.tsx                 ← Root layout & font tokens
    │   ├── globals.css                ← WCAG AAA design system & overlay tokens
    │   ├── page.tsx                   ← Home portal & child selector
    │   ├── game/page.tsx              ← Adaptive word game & voice pipeline
    │   ├── profile/page.tsx           ← Profile setup & customization screen
    │   └── teacher/                   ← Teacher dashboard, reports & Dyslexia Mirror
    ├── components/                    ← Reusable UI components
    └── lib/
        └── api.ts                     ← Typed backend client
```

---

## 10. Quick Start Guide

### Prerequisites
* **Python 3.10+** (Python 3.14 tested)
* **Node.js 18+** (Node.js 20+ recommended)
* **Google Cloud Account** with Vertex AI enabled.

### 1. Backend Setup
```bash
cd WordBloom/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure Google Cloud Vertex AI credentials in backend/wordbloom_agent/.env:
# GOOGLE_CLOUD_PROJECT=your-gcp-project-id
# GOOGLE_CLOUD_LOCATION=us-central1
# GEMINI_MODEL=gemini-2.5-flash

# Start FastAPI backend server (http://localhost:8000)
python main.py
```

### 2. Frontend Setup
```bash
cd WordBloom/frontend

# Install dependencies
npm install

# Start Next.js development server (http://localhost:3000)
npm run dev
```

Visit **`http://localhost:3000`** in Google Chrome or Microsoft Edge (for full Web Speech API voice support).

---

## 11. Testing & Verification

### Run Automated Multi-Agent Pipeline Test:
```bash
cd WordBloom/backend
./venv/bin/python test_wordbloom.py
```
**Expected Output:**
```
🌱 WordBloom — Running full pipeline test
📍 Test 1: Start session -> ✅ PASS (Emma Clarke, Stage 1 CVC: 'sun')
📍 Test 2: Answer 'sun' correctly -> ✅ PASS (Correct: True, Action: continue)
📍 Test 3: Submit wrong answer -> ✅ PASS (Scaffolded hint: True)
📍 Test 4: End session and generate report -> ✅ PASS (Approval required: True)
==================================================
✅ All tests passed! WordBloom is ready.
```

### Run Frontend Production Build:
```bash
cd WordBloom/frontend
npm run build
```
**Expected Output:**
```
▲ Next.js 15.5.27
✓ Compiled successfully in 1270ms
✓ Linting and checking validity of types
✓ Generating static pages (12/12)
✓ Finalizing page optimization
All 19 routes generated with 0 errors!
```

---

### 📄 License
WordBloom is released under the MIT License. Developed with Google Cloud Vertex AI & Google Agent Development Kit (ADK).
