# 🌸 WordBloom

> ### *Every word. Every child. Every way.*  
> **An adaptive reading learning system built for EVERY child — treating each learner individually and rejecting the myth of "one-size-fits-all". Powered by Google ADK (Agent Development Kit) and Google Cloud Vertex AI.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Google_Cloud_Run-10B981?style=for-the-badge&logo=google-cloud&logoColor=white)](https://wordbloom-frontend-820113329049.us-central1.run.app)
[![Agent Runtime](https://img.shields.io/badge/Agent_Runtime-Vertex_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://console.cloud.google.com/vertex-ai/agents/agent-engines/locations/us-central1/agent-engines/1398722001920589824?project=soumyaaidevcamppro)

[![Model Armor](https://img.shields.io/badge/Google_Cloud-Model_Armor_Protected-10B981?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/security)
[![AI Governance](https://img.shields.io/badge/Governance-Dual--Layer_Safety-4285F4?style=for-the-badge)](#6-enterprise-ai-governance--child-safeguarding-google-cloud-model-armor)

[![Google ADK](https://img.shields.io/badge/Google_ADK-Multi--Agent_System-4285F4?logo=google&logoColor=white)](https://cloud.google.com/vertex-ai)
[![Google Cloud Vertex AI](https://img.shields.io/badge/Vertex_AI-Gemini_2.5_Flash-34A853?logo=google-cloud&logoColor=white)](https://cloud.google.com/vertex-ai)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.5_App_Router-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.14-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![UDL Principles](https://img.shields.io/badge/Pedagogy-Universal_Design_for_Learning-F59E0B)](https://www.cast.org/what-we-do/universal-design-for-learning/)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG_AAA_Compliant-10B981)](#8-sensory--accessibility-features)

---

### 🌐 Live Cloud Deployment

WordBloom is fully deployed and accessible on Google Cloud:

* 🚀 **Live Web Application (Google Cloud Run)**:  
  👉 **[https://wordbloom-frontend-820113329049.us-central1.run.app](https://wordbloom-frontend-820113329049.us-central1.run.app)**  
  *(Open in Google Chrome or Microsoft Edge for full Web Speech API voice support)*

* ⚡ **Live Backend API (Google Cloud Run)**:  
  👉 **[https://wordbloom-backend-820113329049.us-central1.run.app](https://wordbloom-backend-820113329049.us-central1.run.app)**  
  *(FastAPI multi-agent service with Google Cloud Model Armor child safeguarding)*

* 🤖 **Multi-Agent Backend (Google Cloud Vertex AI Agent Runtime)**:  
  * **Service Name**: `wordbloom-agent`
  * **Reasoning Engine ID**: `projects/820113329049/locations/us-central1/reasoningEngines/1398722001920589824`
  * **Region**: `us-central1` (Project: `soumyaaidevcamppro`)
  * **Console Dashboard**: [Vertex AI Agent Engine](https://console.cloud.google.com/vertex-ai/agents/agent-engines/locations/us-central1/agent-engines/1398722001920589824?project=soumyaaidevcamppro)

---

## 💡 Core Philosophy: Equal Care by Rejecting "One-Size-Fits-All"

> **"Treating every child equally does NOT mean giving them the exact same rigid test.  
> It means giving every child the exact support, dignity, and pace they need to bloom."**

---

## 1. What is WordBloom?
WordBloom is an agentic reading companion built on the Google Agent Development Kit (ADK) and powered by Gemini 2.5 Flash on Google Cloud Vertex AI.

Instead of a static question bank, WordBloom uses a team of 6 specialized AI agents that observe how the child responds in real time and dynamically reshape the cognitive load of every single word.

### 🌟 The Big Picture
Learning to read is one of the biggest milestones in a child's life. But for millions of children, traditional reading apps are terrifying:
* **Countdown timers** create panic and rushing.
* **Loud red buzzers** make kids feel like failures when they make a mistake.
* **Rigid tests** assume every child sees, hears, and speaks the exact same way.

The truth is simple: **no two children learn to read the same way**. 
* Some children understand sounds easily, but visual letters appear to flip or swim on the screen (*dyslexia*).
* Some children lose focus or feel exhausted after just a few minutes (*ADHD*).
* Some children know the answer in their mind, but struggle with the motor skills to type on a keyboard (*dyspraxia*).
* And some children get overwhelmed by loud noises or sudden changes (*sensory sensitivities / Autism*).

When traditional apps treat these children as "slow" or "wrong," it crushes their confidence and makes them hate reading.

---

### 🌸 How WordBloom Helps Every Child
**WordBloom is an intelligent, compassionate reading tutor that adapts to how each child naturally learns.**

Instead of forcing a child to fit the software, WordBloom molds itself around the child:

1. **Zero Anxiety, Zero Pressure**: 
   * **No countdown timers** — children read at their own natural pace.
   * **No red error marks or letter grades** — children earn blooming garden flowers (`🌸`) as they practice, celebrating progress instead of scores.
2. **Three Ways to Answer**: 
   Every child can answer the way that feels easiest for them:
   * ⌨️ **Type it** on the keyboard.
   * 🎙️ **Say it out loud** into the microphone.
   * 🔲 **Tap letter tiles** on the screen if typing is too difficult.
3. **Gentle Coaching, Not Punishment**: 
   If a child mixes up mirror letters like `b` and `d`, WordBloom doesn't punish them. It gently points out which direction the letter faces (`b` faces right ➔, `d` faces left ⬅️), coaching them with kindness and patience.
4. **Automatic Rest Breaks**: 
   For children who tire quickly, WordBloom automatically limits sessions to 5 minutes and offers fun 30-second eye-rest and stretch breaks.
5. **Calming Colors & Steady Letters**: 
   Children can pick gentle color tints (soft yellow, blue, green, or pink) and special weighted letters that stop words from flipping or dancing on the screen.
6. **Teachers Stay in Full Control**: 
   Smart AI helpers draft helpful, plain-English progress summaries for the teacher. **No report is ever sent to parents without the teacher reviewing and approving it first.**

---

## 📌 Table of Contents
* [1. What is WordBloom?](#1-what-is-wordbloom)
* [2. How WordBloom Serves Every Individual Learner](#2-how-wordbloom-serves-every-individual-learner)
* [3. Core Pedagogical Innovations](#3-core-pedagogical-innovations)
* [4. Multi-Agent Architecture (Google ADK)](#4-multi-agent-architecture-google-adk)
* [5. The 6-Agent Architecture (The Technical Core)](#5-the-6-agent-architecture-the-technical-core)
* [6. Enterprise AI Governance & Child Safeguarding (Google Cloud Model Armor)](#6-enterprise-ai-governance--child-safeguarding-google-cloud-model-armor)
* [7. Teacher Dashboard & Dyslexia Mirror Suite](#7-teacher-dashboard--dyslexia-mirror-suite)
* [8. Sensory & Accessibility Features](#8-sensory--accessibility-features)
* [9. Repository Structure](#9-repository-structure)
* [10. Quick Start Guide](#10-quick-start-guide)
* [11. Testing & Verification](#11-testing--verification)

---

## 2. How WordBloom Serves Every Individual Learner

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

## 3. Core Pedagogical Innovations

WordBloom is designed in alignment with [CAST's Universal Design for Learning (UDL)](https://www.cast.org/what-we-do/universal-design-for-learning/) guidelines — providing multiple means of representation, action/expression, and engagement so every child can learn without barriers.

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

## 4. System & Multi-Agent Architecture (Google ADK)

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
        ROOT["🌸 Root Orchestrator (agent.py)<br/>• Session State Memory<br/>• ADHD 5-Min / 5-Bloom Auto-Pacing<br/>• Hybrid Sequential & Concurrent Dispatch"]
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
    H1 --> MA["🛡️ Google Cloud Model Armor (SanitizeModelResponse)"]
    MA -->|"Verified Child-Safe"| I["Return Next Word + Verified Feedback"]
    MA -->|"Flagged Harsh/Negative"| HEAL["Auto-Heal: Pre-vetted Uplifting Praise"]
    HEAL --> I
    H2 --> I
    I --> J["POST /session/end"]
    J --> K["📋 Report Agent"]
    K --> L["🔒 Human-in-the-Loop Teacher Approval Gate"]
```

### ⚡ Sequential Core + Concurrent Optimization:
* **Sequential Flow:** `ProfileAgent` ➔ `EvaluatorAgent` ➔ `AdapterAgent` ➔ `ReportAgent`.
* **Parallel Execution:** `EncouragementAgent` and `WordSelectorAgent` run concurrently via Python `asyncio.gather()`, cutting roundtrip answer latency by **~48%** (sub-950ms).

---

## 5. The 6-Agent Architecture (The Technical Core)

WordBloom is built with the **Google Agent Development Kit (ADK)** and orchestrated via **Gemini 2.5 Flash on Google Cloud Vertex AI**. Rather than relying on a single monolithic prompt, WordBloom breaks cognitive reading assistance into **6 specialized, cooperating agents**:

```
                       ┌─────────────────────────┐
                       │    Root Orchestrator    │
                       │   (agent.py / FastAPI)  │
                       └────────────┬────────────┘
                                    │
       ┌──────────────┬─────────────┼─────────────┬──────────────┬──────────────┐
       │              │             │             │              │              │
       ▼              ▼             ▼             ▼              ▼              ▼
 ┌───────────┐  ┌───────────┐ ┌───────────┐ ┌───────────┐  ┌───────────┐  ┌───────────┐
 │  Profile  │  │   Word    │ │ Evaluator │ │  Adapter  │  │Encourage- │  │  Report   │
 │   Agent   │  │ Selector  │ │   Agent   │ │   Agent   │  │ment Agent │  │   Agent   │
 └─────┬─────┘  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
       │              │             │             │              │              │
       ▼              ▼             ▼             ▼              ▼              ▼
  SKILL.md       Gemini 2.5    Phonemic      Scaffolding    Growth         Human-in-
  Child Profile  Phonics Gen   Diagnosis     & Pacing       Praise         the-Loop Gate
```

### 1. 👤 ProfileAgent (`profile_agent.py`)
* **Role**: Dynamic personalization grounding and profile setup adaptation.
* **How it works**: Uses Google ADK `SkillToolset` to dynamically ingest markdown child learning profiles (`SKILL.md`) and powers the `/profile` setup engine.
* **Capabilities**:
  * Reads 6 dyslexia types, co-occurring condition flags (ADHD, Autism, Dyspraxia), reading stage (1–4), preferred input mode, font preference, and color overlays.
  * **Intelligent Input Mode Auto-Recommendation**:
    * **Phonological Dyslexia** ➔ Recommends **Voice Input** (*connects speech sounds directly to phonemes without orthographic stress*).
    * **Dyspraxia / Visual-Spatial Dyslexia** ➔ Recommends **Tap Letters** (*removes fine-motor typing friction and keyboard fatigue*).
    * **Surface Dyslexia** ➔ Recommends **Keyboard Typing** (*anchors whole-word orthographic shapes*).
    * Preserves explicit teacher overrides whenever manually changed.
  * **Condition Guardrails**: Automatically caps sessions to 5 minutes / 5 blooms for ADHD and configures auditory sensory limits for Autism.
  * Injects exact child constraints into the session context before any word generation begins, preventing mismatched cognitive difficulty.

### 2. 📖 WordSelectorAgent (`word_selector_agent.py`)
* **Role**: Adaptive curriculum selection and phonics generation.
* **How it works**: Uses **Gemini 2.5 Flash on Google Cloud Vertex AI** to dynamically generate words aligned with the child's exact reading stage, error history, and dyslexia profile.
* **Capabilities**:
  * **Stage 1**: Simple CVC words (consonant-vowel-consonant, e.g., *cat*, *sun*, *pig*).
  * **Stage 2**: Digraphs and consonant blends (*ship*, *frog*, *clap*).
  * **Stage 3**: Silent letters and vowel teams (*knight*, *boat*, *rain*).
  * **Stage 4**: Multisyllabic and morphological patterns (*butterfly*, *garden*, *window*).
  * **Intelligent Deduplication**: Strictly prevents repetitive loops by tracking session history and practicing unmastered phonemes.

### 3. 🔍 EvaluatorAgent (`evaluator_agent.py`)
* **Role**: Profile-aware cognitive diagnosis (not just binary right/wrong).
* **How it works**: Compares learner input against target word using phonemic distance and diagnostic error pattern rules.
* **Capabilities**:
  * **Mirror Reversals (`b ↔ d`, `p ↔ q`)**: Recognizes visual-spatial flips (*"bog"* for *"dog"* or *"dat"* for *"bat"* is diagnosed as a visual orientation mistake, not a spelling failure).
  * **Acoustic Tolerance for Voice Input**: Multi-alternative candidate ranking (`maxAlternatives = 5`), elongation tolerance (`hop ↔ hope`, `cut ↔ cute`), and spoken homophone mapping (*sun/son*, *sea/see*, *right/write*).
  * **Phonological Error Clustering**: Pinpoints whether difficulty stems from initial blends, medial vowel teams, or silent letter patterns.

### 4. ⚡ AdapterAgent (`adapter_agent.py`)
* **Role**: Dynamic real-time micro-scaffolding and cognitive pacing.
* **How it works**: Intercepts the evaluation and decides the immediate next pedagogical accommodation.
* **Capabilities**:
  * **Scaffold Generation**: Delivers UK synthetic phonics audio hints, visual letter chunking (`sh-i-p`), or orientation cues (`b` faces right ➔, `d` faces left ⬅️).
  * **ADHD Pacing Enforcement**: Enforces a 5-minute maximum session and triggers 30-second restorative eye/stretch breaks every 5 words.
  * **Dynamic Leveling**: Steps up reading stage after sustained mastery or steps down to protect child confidence after repeated struggles.

### 5. 💚 EncouragementAgent (`encouragement_agent.py`)
* **Role**: Evidence-based, neurodiversity-informed emotional reinforcement.
* **How it works**: Generates warm, factual, growth-mindset praise using Gemini 2.5 Flash, strictly filtered through **Google Cloud Model Armor**.
* **Capabilities**:
  * **Zero Vague Fluff**: Never uses patronizing or hollow phrases like *"Good job!"* or *"You're so smart!"*.
  * **Specific Mastery Praise**: Emphasizes the exact phonetic accomplishment (*"You heard the 'sh' blend right away!"* or *"You spotted the silent 'k' in knight!"*).
  * **Autism & Sensory Tuning**: Strictly factual, calm observations with zero exclamation overload when sensory flags are active.
  * **🛡️ Google Cloud Model Armor Child Safeguarding (`governance.py`)**: Every candidate praise string is routed in real time through the `wordbloom-child-guard` regional template.
  * **Auto-Healing Fallback**: If Model Armor detects an RAI flag (toxicity, sarcasm, negative sentiment), it is intercepted in real time and auto-healed with pre-vetted uplifting positive reinforcement.

### 6. 📋 ReportAgent (`report_agent.py`) & The Approval Gate
* **Role**: Pedagogical synthesis, clinical reporting, and human governance.
* **How it works**: Analyzes full session metrics (accuracy, error patterns, response latency, self-corrections) and drafts an educator summary.
* **Capabilities**:
  * Highlights specific phonetic strengths and exact challenge areas in plain English.
  * Flags emerging patterns (e.g., *"Visual fatigue noted after word 4; consider switching to yellow overlay"*).
  * **Session Governance Audit**: Binds the Google Cloud Model Armor verification audit certification (`🛡️ Verified Child-Safe by Google Cloud Model Armor`) to every drafted report.
  * **Clean Educator View**: Summaries are structured for teachers and parents without exposed agent jargon or distraction.
  * **Human-in-the-Loop Safety Gate**: The report is generated with `approval_required: true`. **Zero data or summaries are sent to parents or external records without the educator manually reviewing and clicking "Approve Report" in the Teacher Dashboard.**

---

## 6. Enterprise AI Governance & Child Safeguarding (Google Cloud Model Armor)

Assistive AI for neurodivergent children cannot afford hallucinations, harshness, or sarcasm. A single demoralizing comment (*"Oh, you finally figured it out..."*) can destroy a dyslexic child's confidence.

WordBloom implements **Defense-in-Depth Governance** by pairing Google Cloud's newly released **Model Armor** with a strict **Human-in-the-Loop Approval Gate**:

```
[ Evaluator / Adapter ]
           │
           ▼
[ EncouragementAgent ]
           │ (generates personalized praise)
           ▼
[ 🛡️ Google Cloud Model Armor ]  <─── Regional Endpoint: modelarmor.us-central1.rep.googleapis.com
  • Template: wordbloom-child-guard
  • RAI Filters: Hate Speech, Harassment, Toxicity, Dangerous Tone
  • Confidence Level: MEDIUM_AND_ABOVE
           │
     ┌─────┴─────────────────────────┐
     ▼                               ▼
[ NO_MATCH_FOUND: Clean ]      [ MATCH_FOUND: Intercepted ]
Praise delivered directly       Auto-healed with pre-vetted positive reinforcement
     │                               │
     └───────────────┬───────────────┘
                     ▼
        [ Child Game Screen ]
```

### Core Governance Pillars:

1. **Semantic Tone & Safety Shielding (`SanitizeModelResponse`)**:
   * Evaluates encouragement output against Google Cloud Model Armor filters.
   * Goes beyond naive word-blocklists by using Google's semantic classifiers to catch subtle sarcasm, condescension, and negative bias.
   * **Automated Healing (`governance.py`)**: If Model Armor detects a policy violation, the response is instantly intercepted and replaced with safe, encouraging growth-mindset praise without stalling the session.

2. **Immutable Audit Trails for School Districts**:
   * Every scan operation is logged directly to **Google Cloud Logging** and **Security Command Center**.
   * Provides educational authorities with verifiable proof of **COPPA, FERPA, and GDPR-K** compliance.

3. **Human-in-the-Loop Approval Gate**:
   * Diagnostic progress reports drafted by the system are held in quarantine.
   * **Zero reports are sent to parents or permanent records** until the educator reviews, edits, and certifies them in the Teacher Dashboard.

---

## 7. Teacher Dashboard, Profile Engine & Dyslexia Mirror Suite

### 👩‍🏫 Teacher Dashboard (`/teacher`)
* **Live Garden Bloom Tracking:** Tracks completed flowers against personalized targets (e.g. 4 🌸 for Alex, 5 🌸 for Emma).
* **Session Governance Audit:** Directly displays verified child-safety certification from Google Cloud Model Armor on every session report (`🛡️ Verified Child-Safe by Google Cloud Model Armor`).
* **Human-in-the-Loop Approval Gate:** Assessment summaries must be explicitly certified by the educator before parent dispatch.

### ⚙️ Child Profile Setup & Customization Engine (`/profile`)
* **Individualized Setup:** Configure identity, school year, reading stage (1–4), dyslexia typology, and co-occurring conditions.
* **Intelligent Input Mode Recommendations:** Automatically highlights the optimal modality with clear pedagogical rationales:
  * Recommends **Voice Input** for Phonological Dyslexia to connect phonemes to speech.
  * Recommends **Tap Letters** for Dyspraxia or Visual-Spatial challenges to bypass keyboard friction.
  * Recommends **Keyboard Typing** for Surface Dyslexia to practice orthographic shape memory.
* **Automatic Safeguards:** Selecting ADHD locks the session to 5 minutes with mandatory breaks; selecting Autism activates calm, factual praise and mutes sudden audio cues.
* **Full Educator Freedom:** Teachers can manually override any setting at any time.

### 🪞 The Dyslexia Mirror (`/teacher/children/[child_id]/mirror`)
An interactive perceptual simulator enabling teachers and parents to experience reading through the child's perspective:
* **Letter Rotation & Flipping:** Visualizes mirror reversals (`b ↔ d`, `p ↔ q`).
* **Ocular Jitter & Visual Drift:** Demonstrates how unweighted fonts appear to drift or float.
* **Crowding & Line Blurring:** Demonstrates why spotlight masking and color overlays bring immediate relief.

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
│   ├── requirements.txt               ← Python dependencies (FastAPI, ADK, Model Armor)
│   ├── test_wordbloom.py              ← Automated 4-stage pipeline test suite
│   └── wordbloom_agent/
│       ├── __init__.py
│       ├── .env                       ← Vertex AI credentials (GOOGLE_CLOUD_PROJECT)
│       ├── agent.py                   ← Root ADK Orchestrator
│       ├── governance.py              ← 🛡️ Child Safeguarding via Google Cloud Model Armor
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
│           ├── sony/SKILL.md          ← Phonological + ADHD profile
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

### 🌐 Hosted Cloud Version (Zero Installation)
Visit: **[https://wordbloom-frontend-820113329049.us-central1.run.app](https://wordbloom-frontend-820113329049.us-central1.run.app)**

---

### 💻 Local Development Setup (Optional)

If you prefer to run and develop WordBloom locally on your computer:

#### Prerequisites
* **Python 3.10+** (Python 3.14 tested)
* **Node.js 18+** (Node.js 20+ recommended)
* **Google Cloud Account** with Vertex AI and Model Armor enabled.

#### 1. Backend Setup
```bash
cd WordBloom/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure Google Cloud credentials in backend/wordbloom_agent/.env:
# GOOGLE_CLOUD_PROJECT=your-gcp-project-id
# GOOGLE_CLOUD_LOCATION=us-central1
# GEMINI_MODEL=gemini-2.5-flash
# MODEL_ARMOR_TEMPLATE_ID=wordbloom-child-guard

# Start FastAPI backend server (http://localhost:8000)
python main.py
```

#### 2. Frontend Setup
```bash
cd WordBloom/frontend

# Install dependencies
npm install

# Start Next.js development server (http://localhost:3000)
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 11. Testing & Verification

### Run Automated Multi-Agent Pipeline Test:
```bash
cd WordBloom/backend
./venv/bin/python test_wordbloom.py
```
**Expected Output:**
```
🌸 WordBloom — Running full pipeline test
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
