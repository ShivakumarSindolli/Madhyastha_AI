# NyayaAI — Complete Build Specification
> AI-Powered Dispute Resolution Platform | India  
> Legal Anchors: **Mediation Act 2023** + **Arbitration & Conciliation Act 1996** + **CPC 1908**

---

## 1. PROJECT OVERVIEW

NyayaAI is a **tiered dispute resolution platform** that intercepts civil disputes before they reach Indian courts. It combines **proactive dispute detection** with a multi-stage resolution pipeline:

```
Prevention (LightGBM) → AI Mediation → Human Mediation → Arbitration → Court Filing
```

**Core problem:** 5 crore+ pending Indian court cases. The Mediation Act 2023 mandates pre-litigation mediation. No accessible, affordable digital platform exists to make this real.

**One-liner:**  
*"NyayaAI gives every Indian citizen three chances to resolve their dispute before a courtroom — AI mediation, human mediation, and binding arbitration."*

---

## 2. WHAT'S IMPLEMENTED

| Feature | Status |
|---------|--------|
| Prevention Engine — LightGBM risk scorer | ✅ Trained (ROC-AUC: 1.0) |
| Civic event ingestion (RERA/CPGrams/CERSAI) | ✅ API + Seed data |
| WhatsApp nudge (mock endpoint) | ✅ Logs instead of sending |
| AI Mediation (5 LLM agents) | ✅ Groq llama3-70b |
| Human Mediation escalation | ✅ NALSA brief generation |
| Arbitration (binding awards) | ✅ Full flow |
| Court Filing (petition PDF) | ✅ Evidence bundle |
| 4-stage escalation chain | ✅ AI → Human → Arbitration → Court |
| Admin dashboard + risk scorer UI | ✅ Prevention Engine panel |
| Text-to-Speech (TTS) — gTTS | ✅ Backend `/tts` endpoint, toggle in Caucus + Joint Session |
| Speech-to-Text (STT) — Google Speech Recognition | ✅ Backend `/stt` endpoint via SpeechRecognition lib + pydub |
| Multilingual voice I/O (10 Indian languages) | ✅ en, hi, kn, ta, te, mr, bn, gu, pa, ml |

Everything from the original spec is retained and enhanced.

---

## 3. SYSTEM ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────────────┐
│               PREVENTION + RESOLUTION PIPELINE                       │
│                                                                      │
│  [LightGBM Risk Scorer] ──→ [WhatsApp Nudge] ──→ [Pre-empt]         │
│                                                                      │
│  [Registration] → [Caucus A] → [Caucus B] → [AI Synthesis]          │
│       → [Joint Session] ──────────────────────→ [Agreement] ✅       │
│                          └── FAIL ──→ [Human Mediator] 🧑‍⚖️         │
│                                           └── FAIL ──→ [Arbitration] ⚖️
│                                                            └──→ [Court] 🏛️
└──────────────────────────────────────────────────────────────────────┘
```

### Escalation Chain (4 Stages)

| Stage | Handler | Binding | Legal Basis |
|-------|---------|---------|-------------|
| **Prevention** | LightGBM risk scorer + WhatsApp nudge | No — proactive alert | — |
| **AI Mediation** | NyayaAI 5 LLM agents | Only if both agree | Mediation Act 2023 |
| **Human Mediation** | NALSA-certified human mediator (AI brief prepared) | Only if both agree | Mediation Act 2023 |
| **Arbitration** | Registered arbitrator | **Yes — legally binding award** | Arbitration & Conciliation Act 1996 |
| **Court Filing** | eCourts system | Yes | CPC 1908 |

> If AI mediation fails, the dispute is escalated to a NALSA-certified **human mediator** with an AI-prepared brief. If human mediation also fails, the matter goes to binding arbitration.

---

## 4. DISPUTE STATUS FLOW

```
registered
    ↓
awaiting_party_b
    ↓
caucus_a          ← Party A submits private statement
    ↓
caucus_b          ← Party B submits private statement
    ↓
synthesis         ← AI analyzes both, finds common ground
    ↓
joint_session     ← Both parties chat with AI mediator
    ↓
  [success]                    [failure]
agreement_pending          escalated_human      ← NALSA human mediator
    ↓                               ↓
  resolved                  [human success] → agreement_pending
                            [human failure] → escalated_arbitration
                                                    ↓
                                            arbitration_hearing
                                                    ↓
                                              award_issued
                                                    ↓
                                        [complied] → closed
                                        [not complied] → court_filing
```

---

## 5. TECH STACK

### Backend
```
Runtime:        Python 3.11+
Framework:      FastAPI + Uvicorn (ASGI)
Database:       SQLite (dev) → PostgreSQL (prod)
Auth:           JWT tokens — per-party session isolation
Realtime:       WebSocket (FastAPI native)
PDF:            ReportLab
Notifications:  SMTP Email (Gmail) — branded HTML templates
LLM:            Groq API — llama3-70b-8192
```

### Frontend
```
Framework:      React 18 + Vite
Styling:        Vanilla CSS (premium light theme)
Realtime:       Native WebSocket client
Signatures:     react-signature-canvas
State:          React Context + useState
Charts:         recharts (stats dashboard)
Speech-to-Text: MediaRecorder → Backend Google Speech Recognition API
Text-to-Speech: Backend gTTS → Browser Audio playback
```

### AI / ML Pipeline
```
RAG:            LangChain + FAISS + sentence-transformers
RAG Data:       Indian Kanoon Kaggle dataset (MIT license) + 21 curated mock cases
Embeddings:     paraphrase-multilingual-MiniLM-L12-v2
Translation:    Bhashini API (Indian govt — free)
Vector Store:   FAISS (local)
Risk Scorer:    LightGBM (binary classifier, 9 features, ROC-AUC: 1.0)
Training Data:  5,000 synthetic civic event sequences (RERA/CPGrams/CERSAI)
TTS Engine:     gTTS (Google Text-to-Speech) — backend streaming MP3
STT Engine:     SpeechRecognition lib (Google Speech Recognition API) + pydub + ffmpeg
```

### External APIs / Data Sources

```
# ── CORE ─────────────────────────────────────────────────────────────────────

Groq API              LLM inference — llama3-70b-8192
                      Used by all 5 AI agents

Indian Kanoon Dataset Kaggle dataset (MIT) — processed into FAISS RAG index
                      https://kaggle.com/datasets/regressingaddict/indian-kanoon-cases
                      + 21 hand-curated mock cases for demo reliability

SMTP (Gmail)          Transactional email — dispute links, agreement PDFs
                      Uses Gmail App Password — no external API dependency

Bhashini ULCA API     Multilingual: hi, kn, ta, te, mr, bn, gu, pa, ml, en
                      Free Indian govt API — register at bhashini.gov.in/ulca

# ── PHASE 2 (mention in pitch, do not build now) ──────────────────────────────

Gupshup / Meta Cloud  WhatsApp Business API for rural intake
                      Mock with a preview screen for demo

DigiLocker API        Store signed agreements + arbitration awards
                      Complex govt OAuth — store PDFs locally for now

Aadhaar e-Sign        Legally binding signatures
                      Requires MeitY empanelment — use react-signature-canvas now
```

---

## 6. DATABASE SCHEMA

```python
class Dispute(Base):
    __tablename__ = "disputes"
    id: str                      # UUID
    title: str
    dispute_type: str            # property_boundary | property_ownership |
                                 # rent_tenancy | money_loan | contract_breach |
                                 # employment | consumer | family_inheritance |
                                 # neighbourhood | other_civil
    status: str                  # registered | awaiting_party_b | caucus_a |
                                 # caucus_b | synthesis | joint_session |
                                 # agreement_pending | resolved |
                                 # escalated_human | escalated_arbitration |
                                 # arbitration_hearing | award_issued |
                                 # court_filing | closed
    risk_score: float            # 0-100 from LightGBM risk scorer (nullable)
    common_ground: JSON          # output of AI Synthesis Agent
    settlement_options: JSON     # 2–3 options from Synthesis Agent
    final_terms: JSON            # agreed terms from joint session
    escalation_reason: str       # why AI mediation failed
    round_count: int             # joint session rounds
    arbitration_consent: bool    # both parties agreed to arbitration at registration
    created_at: datetime
    updated_at: datetime


class Party(Base):
    __tablename__ = "parties"
    id: str
    dispute_id: str              # FK → disputes
    role: str                    # party_a | party_b
    name: str
    phone: str
    email: str
    language: str                # hi | kn | ta | te | en ...
    session_token: str           # JWT — private, unique per party
    has_submitted_statement: bool
    has_signed_agreement: bool
    arbitration_consent: bool    # individual consent for arbitration
    created_at: datetime


class Statement(Base):
    __tablename__ = "statements"
    id: str
    dispute_id: str              # FK → disputes
    party_id: str                # FK → parties
    raw_text: str                # full caucus conversation output
    position: str                # what they want
    interest: str                # why they want it
    min_acceptable: str          # minimum outcome they'll accept
    emotional_need: str          # extracted by Caucus Interviewer
    locked: bool                 # cannot change after submission
    submitted_at: datetime


class MediationSession(Base):
    __tablename__ = "mediation_sessions"
    id: str
    dispute_id: str              # FK → disputes
    session_type: str            # ai_mediation | human | arbitration
    status: str                  # active | agreement_reached | escalated | failed
    messages: JSON               # [{role, content, party_id, timestamp}]
    ai_brief: str                # full brief for human mediator or arbitrator
    started_at: datetime
    ended_at: datetime


class Agreement(Base):
    __tablename__ = "agreements"
    id: str
    dispute_id: str              # FK → disputes
    agreement_type: str          # mediation_settlement | arbitration_award
    terms: JSON                  # structured clauses
    pdf_path: str
    party_a_signed: bool
    party_b_signed: bool
    party_a_signed_at: datetime
    party_b_signed_at: datetime
    finalized_at: datetime
    created_at: datetime


class ArbitrationCase(Base):
    __tablename__ = "arbitration_cases"
    id: str
    dispute_id: str              # FK → disputes
    arbitrator_id: str           # FK → arbitrators table
    status: str                  # pending_consent | assigned | hearing_scheduled |
                                 # award_issued | declined
    consent_a: bool
    consent_b: bool
    ai_brief: str                # complete AI-generated brief (JSON)
    ai_brief_pdf_path: str       # PDF path
    hearing_datetime: datetime
    hearing_link: str            # video call link
    award: JSON                  # award details
    award_pdf_path: str
    issued_at: datetime
    created_at: datetime


class Arbitrator(Base):
    __tablename__ = "arbitrators"
    id: str
    name: str
    email: str
    phone: str
    bar_registration: str        # Arbitration Act 1996 registration number
    specializations: JSON        # ["property", "commercial", "family"]
    languages: JSON              # ["en", "hi", "kn"]
    available: bool
    cases_assigned: int
    created_at: datetime


class CivicEvent(Base):          # NEW — Prevention Engine
    __tablename__ = "civic_events"
    id: str
    event_type: str              # rera_complaint | land_mutation_rejection |
                                 # cpgrams_escalation | cersai_flag
    party_identifier: str        # property ID or party ID
    source: str                  # rera | cpgrams | land_registry | cersai
    event_date: datetime
    district: str
    state: str
    event_metadata: JSON         # source-specific details
    created_at: datetime


class RiskScore(Base):           # NEW — Prevention Engine
    __tablename__ = "risk_scores"
    id: str
    party_identifier: str
    score: float                 # 0-100 from LightGBM
    dispute_type_predicted: str
    nudge_sent: bool
    nudge_language: str          # en | hi | kn | ta
    nudge_message: str           # stored mock WhatsApp message
    computed_at: datetime
```

---

## 7. API ENDPOINTS

### Dispute Management
```
POST  /dispute/register             Register dispute + generate party tokens
GET   /dispute/{id}/status          Current stage, status, round count
GET   /dispute/all                  Admin: list all disputes
GET   /dispute/stats/summary        Resolution counts + rates by type
```

### Caucus — Private Sessions (isolated by JWT)
```
POST  /caucus/verify-token          Validate party session link
POST  /caucus/chat                  Send message to Caucus Interviewer AI
POST  /caucus/submit-statement      Lock in statement (position/interest/min)
```

### Joint Mediation Session
```
GET   /session/{id}                 Get session + AI opening message
POST  /session/{id}/message         REST fallback for chat
WS    /ws/session/{id}?token=...    WebSocket — real-time joint session
```

### Agreement
```
POST  /agreement/{id}/generate      Trigger AI agreement drafting + PDF
GET   /agreement/{id}               View agreement details
POST  /agreement/{id}/sign          Submit digital signature
GET   /agreement/{id}/download      Download signed PDF
```

### Escalation — Human Mediation + Arbitration
```
POST  /escalate/{id}/human                  Escalate to NALSA human mediator (AI brief)
POST  /escalate/{id}/arbitration             Trigger arbitration flow
POST  /escalate/{id}/arbitration/consent     Party confirms consent
GET   /escalate/arbitration/all              Arbitrator dashboard
GET   /arbitration/{id}                      Get arbitration case details
POST  /arbitration/{id}/schedule             Arbitrator schedules hearing
POST  /arbitration/{id}/award                Arbitrator submits award
GET   /arbitration/{id}/award/download       Download award PDF
GET   /arbitration/{id}/brief/download       Download AI-prepared brief PDF
```

### Court Filing
```
GET   /court/{id}/petition          Generate pre-filled petition PDF
GET   /court/{id}/evidence-bundle   Download complete evidence trail ZIP
GET   /court/{id}/ecourts-link      Redirect link to eCourts filing portal
```

### Prevention Engine — Risk Scoring + Civic Events
```
POST  /civic/ingest                          Ingest civic event from RERA/CPGrams/CERSAI
GET   /civic/events/{party_id}               Get civic event trail for party/property
POST  /risk/score                            Compute risk score using LightGBM model
POST  /risk/nudge/{party_id}?language=en     Send mock WhatsApp nudge (logs, not live)
GET   /risk/history/{party_id}               Get risk score history
GET   /risk/model-info                       Get LightGBM model metadata
```

### Voice I/O — Text-to-Speech & Speech-to-Text
```
POST  /tts                                   Generate TTS audio (edge TTS) — returns MP3 stream
                                              Body: { text: str, language: str }
POST  /stt                                   Transcribe audio (Google Speech Recognition)
                                              Body: multipart/form-data { audio: File, language: str }
                                              Returns: { transcript, language, success, error? }
```

---

## 8. AI AGENT SYSTEM — 5 Agents (All on Groq llama3-70b)

### Agent 1 — Caucus Interviewer

```
Role:     Private one-on-one with each party
Goal:     Extract position, interest, min_acceptable, emotional_need
Rules:
  - Ask one question at a time
  - Never judge or take sides
  - Acknowledge emotions without amplifying them
  - Use open-ended questions: "Help me understand...", "What matters most to you about..."
  - After 5–8 exchanges, once all 4 are clear, output:

  STATEMENT_COMPLETE: {
    "position": "...",
    "interest": "...",
    "min_acceptable": "...",
    "emotional_need": "..."
  }

Inputs:   dispute_context, party_language
Output:   Conversation + final JSON prefixed with STATEMENT_COMPLETE:
```

### Agent 2 — Synthesis Analyst

```
Role:     Analyzes BOTH private statements — never reveals one to the other
Goal:     Find conflict zones, overlap zones, generate 2–3 settlement options
          Each option must have: specific terms, timeline, enforcement mechanism
          Each option must cite at least one RAG precedent from Indian Kanoon

Inputs:   statement_a, statement_b, dispute_type, rag_precedents (top 5 from FAISS)
Output:   JSON {
            "conflict_zones": [...],
            "overlap_zones": [...],
            "settlement_options": [
              {
                "option_id": "A",
                "title": "...",
                "terms": "...",
                "timeline": "...",
                "favors": "neutral | party_a | party_b",
                "precedent_ref": "case name / citation"
              }
            ],
            "recommended_opening": "opening message for joint session"
          }
```

### Agent 3 — Joint Mediator

```
Role:     Neutral facilitator in joint chat room (both parties can see messages)
Rules:
  - NEVER reveal private caucus content
  - Anchor every proposal in RAG precedents
  - Stay strictly neutral — never validate one party's position over another
  - Monitor for escalation signals: personal attacks, absolute refusals, legal threats
  - If 3+ escalation signals detected → output: ESCALATE_TO_HUMAN
  - If both parties agree on an option → output: AGREEMENT_REACHED:{option_id}

Inputs:   dispute_type, synthesis output, rag_precedents, session_history
Signals:  AGREEMENT_REACHED:{option_id} | ESCALATE_TO_HUMAN
```

### Agent 4 — Agreement Drafter

```
Role:     Legal document generator under Mediation Act 2023, Section 22
Sections:
  1. Parties (full names, contact)
  2. Dispute description (neutral, factual)
  3. Agreed terms (specific, measurable, time-bound)
  4. Payment schedule (if applicable)
  5. Default clause (consequence of non-compliance)
  6. Signatures block (Party A, Party B, AI System, date)
  7. Mandatory citation: "Section 22, Mediation Act, 2023"

Inputs:   agreed_option, party_details, dispute_context
Output:   Validated JSON → ReportLab renders to PDF
```

### Agent 5 — Arbitration Brief Generator

```
Role:     Prepares comprehensive brief for the assigned arbitrator
Sections:
  1. Case Summary (type, parties, amount in dispute)
  2. Timeline of events leading to dispute
  3. Party A Position (claim, evidence submitted, minimum offer)
  4. Party B Position (claim, evidence submitted, maximum concession)
  5. Mediation History (what was tried, where it broke down, final gap)
  6. Evidence Index (all documents, photos, screenshots)
  7. Relevant Precedents (top 3 from Indian Kanoon via RAG)
  8. Suggested Award Options (3 options, each with legal basis under
     Arbitration & Conciliation Act 1996 + enforcement mechanism)
  9. Arbitration Consent Status (confirmed by both parties)

Inputs:   mediation_history, all_statements, evidence_list, rag_precedents
Output:   Structured JSON → ReportLab PDF → sent to arbitrator
```

---

## 9. RAG PIPELINE — Legal Precedent Retrieval

```
Type:       RAG — LangChain + FAISS + Sentence Transformers
Purpose:    Retrieve top-5 relevant settled Indian cases for any dispute
            Injected into Agent 2 (Synthesis) + Agent 3 (Joint Mediator)
            + Agent 5 (Arbitration Brief)

Pipeline:
  1. Load dispute description (combined party statements)
  2. Embed with paraphrase-multilingual-MiniLM-L12-v2
     (handles Hindi + English mixed text natively)
  3. MMR retrieval from FAISS — diverse, non-redundant results
  4. Return top 5 cases with metadata
  5. Inject into agent prompts as {rag_precedents}

Data Sources:
  Indian Kanoon API    10,000+ property/contract judgments
  NALSA outcomes       Published mediation settlement summaries
  RERA orders          Real estate dispute settlements
  Lok Adalat awards    Award data
  Consumer forum       Consumer dispute settlements

Metadata per chunk:
  {
    case_id: str,
    dispute_type: str,
    settlement_amount_range: str,
    resolution_time_days: int,
    state: str,
    year: int,
    winning_arguments: [str],
    court_level: str
  }

Index file:     data/kanoon_faiss.index
Chunks file:    data/kanoon_chunks.json
Build script:   scripts/build_rag_index.py

Hackathon shortcut:
  If Indian Kanoon API key not ready in time →
  create 50 manually written mock cases in JSON →
  run build_rag_index.py on mock data →
  FAISS index still works, demo still credible
```

---

## 10. ARBITRATION FLOW — DETAILED

```
Step 1   AI mediation fails
         Trigger: 3 failed rounds OR ESCALATE_TO_ARBITRATION signal
             ↓
Step 2   System checks: arbitration_consent = True for both parties
         (Captured as checkbox at dispute registration)
             ↓ YES
Step 3   Both parties receive notification:
         "AI mediation was unable to reach agreement.
          You both consented to binding arbitration at registration.
          A registered arbitrator will now be assigned to your case."
             ↓
Step 4   ArbitrationCase record created → status = pending_consent
             ↓
Step 5   Both parties confirm via /escalate/{id}/arbitration/consent
             ↓
Step 6   Arbitrator auto-assigned from pool:
         - Match by dispute type specialization
         - Match by party languages
         - Lowest current case load
         → status = assigned
             ↓
Step 7   Agent 5 (Arbitration Brief Generator) runs:
         - Pulls all statements, mediation history
         - Retrieves top 3 RAG precedents
         - Generates structured brief JSON
         - PDF created via ReportLab
         - Sent to arbitrator via Email + visible on arbitrator dashboard
             ↓
Step 8   Arbitrator logs in → reviews brief → schedules hearing
         POST /arbitration/{id}/schedule → {hearing_datetime, hearing_link}
         Both parties notified via Email
             ↓
Step 9   Hearing conducted (video link embedded in platform)
             ↓
Step 10  Arbitrator submits award:
         POST /arbitration/{id}/award
         {
           award_type: "full_payment | partial_payment | asset_transfer | dismissal",
           amount: float,
           currency: "INR",
           payment_timeline_days: int,
           installments: int,
           enforcement_clause: str,
           reasoning: str
         }
             ↓
Step 11  Award PDF generated + signed by arbitrator
         Stored locally (DigiLocker in Phase 2)
         Emailed to both parties
         → status = award_issued
             ↓
Step 12  Award is legally binding under Section 36,
         Arbitration & Conciliation Act 1996
         Enforceable like a court decree
             ↓
         [Party complies]     → status = closed
         [Party non-compliant] → court_filing mode activated
                                  Generate petition + evidence bundle
                                  Link to eCourts portal for enforcement
```

---

## 11. DIRECTORY STRUCTURE

```
nyayaai/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   ├── middleware.py
│   │   │   ├── dependencies.py
│   │   │   └── websocket_manager.py
│   │   ├── db/
│   │   │   └── database.py
│   │   ├── models/
│   │   │   └── models.py
│   │   ├── schemas/
│   │   │   └── schemas.py
│   │   ├── api/routes/
│   │   │   ├── dispute.py
│   │   │   ├── caucus.py
│   │   │   ├── session.py
│   │   │   ├── agreement.py
│   │   │   ├── escalation.py       ← human + arbitration
│   │   │   ├── arbitration.py      ← full arbitration management
│   │   │   ├── court.py            ← court filing mode
│   │   │   ├── risk.py             ← prevention engine API
│   │   │   ├── tts.py              ← gTTS text-to-speech endpoint
│   │   │   ├── stt.py              ← Google Speech Recognition endpoint
│   │   │   └── websocket.py
│   │   ├── agents/
│   │   │   ├── caucus_interviewer.py
│   │   │   ├── synthesis_analyst.py
│   │   │   ├── joint_mediator.py
│   │   │   ├── agreement_drafter.py
│   │   │   └── arbitration_brief.py
│   │   ├── rag/
│   │   │   ├── retriever.py
│   │   │   ├── embedder.py
│   │   │   └── build_index.py
│   │   ├── services/
│   │   │   ├── groq_service.py
│   │   │   ├── pdf_service.py
│   │   │   ├── notification_service.py
│   │   │   └── bhashini.py
│   │   └── prompts/
│   │       └── mediator_prompts.py
│   ├── data/
│   │   ├── kanoon_faiss.index
│   │   ├── kanoon_chunks.json
│   │   └── raw/
│   ├── ml/                          ← Prevention Engine ML
│   │   ├── risk_scorer/
│   │   │   ├── generate_training_data.py
│   │   │   ├── features.py
│   │   │   ├── train.py
│   │   │   └── predict.py
│   │   ├── models/
│   │   │   └── risk_scorer.pkl      ← trained LightGBM (98.4 KB)
│   │   └── data/
│   │       └── training_data.csv    ← 5,000 samples
│   ├── tests/
│   │   └── test_backend.py
│   ├── seed.pyth
│   ├── requirements.txt
│   ├── .env.example
│   ├── run.sh
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Register.jsx        ← Dispute registration
│   │   │   ├── Caucus.jsx          ← Private caucus chat
│   │   │   ├── JointSession.jsx    ← Real-time joint mediation
│   │   │   ├── Agreement.jsx       ← Agreement viewer + signature
│   │   │   ├── Arbitration.jsx     ← Arbitration consent + status + award
│   │   │   ├── CourtFiling.jsx     ← Petition + evidence bundle download
│   │   │   ├── Admin.jsx           ← Stats + Prevention Engine panel
│   │   │   └── Landing.jsx         ← Public landing page
│   │   ├── components/
│   │   │   ├── ChatBubble.jsx
│   │   │   ├── SignaturePad.jsx
│   │   │   ├── EscalationTracker.jsx
│   │   │   └── VoiceInput.jsx      ← MediaRecorder → backend STT
│   │   ├── utils/
│   │   │   └── tts.js               ← playTTS / stopTTS → backend gTTS
│   │   ├── hooks/
│   │   │   └── useWebSocket.js
│   │   └── App.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
└── scripts/
    ├── build_rag_index.py
    └── seed_arbitrators.py
```

---

## 12. ENVIRONMENT VARIABLES

```bash
# .env

# ── Database ────────────────────────────────────────────────────────────────
DATABASE_URL=sqlite:///./nyayaai.db
# Production: DATABASE_URL=postgresql://user:pass@localhost:5432/nyayaai

# ── LLM ────────────────────────────────────────────────────────────────────
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama3-70b-8192

# ── Auth ────────────────────────────────────────────────────────────────────
JWT_SECRET_KEY=your_secret_key_min_32_chars
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=72

# ── Email (SMTP — Gmail) ────────────────────────────────────────────────────
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_NAME=Madhyastha AI

# ── AI APIs ─────────────────────────────────────────────────────────────────
BHASHINI_USER_ID=your_user_id
BHASHINI_API_KEY=your_key

# ── ML Paths ────────────────────────────────────────────────────────────────
FAISS_INDEX_PATH=data/kanoon_faiss.index
RISK_MODEL_PATH=ml/models/risk_scorer.pkl
NUDGE_THRESHOLD=72

# ── App ─────────────────────────────────────────────────────────────────────
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,https://nyayaai.in
DEBUG=True

# ── Phase 2 (do not integrate now) ──────────────────────────────────────────
# GUPSHUP_API_KEY=your_key
# DIGILOCKER_CLIENT_ID=your_id
# DIGILOCKER_CLIENT_SECRET=your_secret
# AADHAAR_ESIGN_KEY=your_key
```

---

## 13. BUSINESS RULES

```python
ESCALATION_RULES = {
    "ai_to_human": {
        "trigger": (
            "Joint Mediator outputs ESCALATE_TO_HUMAN "
            "OR no agreement after 3 joint session rounds"
        ),
        "action": [
            "Create human MediationSession (session_type='human')",
            "Set dispute status = escalated_human",
            "Generate AI brief for human mediator (case summary, statements, mediation history)",
            "Notify both parties"
        ]
    },
    "human_to_arbitration": {
        "trigger": (
            "Human mediation fails "
            "OR both parties request arbitration"
        ),
        "precondition": "arbitration_consent = True for both parties (set at registration)",
        "action": [
            "Create ArbitrationCase record",
            "Auto-assign arbitrator by specialization + language + load",
            "Run Agent 5 → generate brief PDF",
            "Send brief to arbitrator via SMTP Email",
            "Notify both parties via Email"
        ]
    },
    "arbitration_to_court": {
        "trigger": (
            "arbitration_declined "
            "OR award issued but party non-compliant after deadline"
        ),
        "action": [
            "Generate pre-filled petition PDF",
            "Compile evidence bundle ZIP",
            "Generate eCourts portal redirect link",
            "Set dispute status = court_filing"
        ],
        "note": (
            "Arbitration award enforceable like a court decree under Section 36. "
            "Party takes award to district court for execution — no new case needed."
        )
    },
    "party_b_no_response": {
        "trigger": "Party B has not submitted statement after 7 days",
        "reminders": "SMTP Email at day 3 and day 7",
        "action": [
            "Generate documentation package for Party A",
            "Activate court_filing mode",
            "Set status = court_filing"
        ]
    }
}

DISPUTE_TYPES = [
    "property_boundary", "property_ownership", "rent_tenancy",
    "money_loan", "contract_breach", "employment", "consumer",
    "family_inheritance", "neighbourhood", "other_civil"
]

SUPPORTED_LANGUAGES = {
    "hi": "Hindi",   "kn": "Kannada", "ta": "Tamil",
    "te": "Telugu",  "mr": "Marathi", "bn": "Bengali",
    "gu": "Gujarati","pa": "Punjabi", "ml": "Malayalam",
    "en": "English"
}

MEDIATION_ACT_CITATION    = "Section 22, Mediation Act, 2023"
ARBITRATION_ACT_CITATION  = "Section 36, Arbitration and Conciliation Act, 1996"
NUDGE_THRESHOLD           = 72   # Risk score ≥ 72 triggers WhatsApp nudge
RISK_MODEL_PATH           = "ml/models/risk_scorer.pkl"
```

---

## 14. STEP-BY-STEP BUILD APPROACH

Build in this exact order. Each phase produces something demeable independently.

---

### PHASE 1 — Core AI Mediation (Backend + Frontend)

**Goal: Full caucus → joint session → agreement loop working end to end**

```
Step 1   Setup & Verify
         - pip install -r requirements.txt
         - Copy .env.example → .env, add GROQ_API_KEY
         - python seed.py → verify DB seeded with sample disputes
         - uvicorn app.main:app --reload → verify /docs loads
         - Confirm all routes listed in Swagger UI

Step 2   Strengthen AI Agent Prompts
         - Open app/prompts/mediator_prompts.py
         - Refine CAUCUS_SYSTEM_PROMPT:
           add position/interest/min detection + STATEMENT_COMPLETE: marker
         - Refine SYNTHESIS_PROMPT:
           add {rag_precedents} placeholder + structured JSON output format
         - Refine JOINT_MEDIATOR_SYSTEM_PROMPT:
           add ESCALATE_TO_ARBITRATION signal, AGREEMENT_REACHED:{option_id}
         - Test each prompt manually via Groq playground before wiring up

Step 3   RAG Pipeline (FAISS)
         - pip install langchain faiss-cpu sentence-transformers
         - Create app/rag/embedder.py
           → load paraphrase-multilingual-MiniLM-L12-v2
           → embed(text) → returns vector
         - Create app/rag/retriever.py
           → load FAISS index
           → get_precedents(query, top_k=5) → returns list of case dicts
         - Hackathon shortcut: create 50 mock cases as JSON if Kanoon API not ready
           → run scripts/build_rag_index.py → FAISS built from mock data
         - Inject precedents into groq_service.py synthesis + joint mediator calls

Step 4   WebSocket Joint Session
         - Open app/api/routes/websocket.py
         - Test connection: wscat -c "ws://localhost:8000/ws/session/{id}?token=..."
         - Verify: connect → receive history → send message → get AI response
         - Verify: AGREEMENT_REACHED → status → agreement_pending
         - Verify: ESCALATE_TO_ARBITRATION → status → escalated_arbitration

Step 5   Frontend: Caucus Chat UI (pages/Caucus.jsx)
         - On load: POST /caucus/verify-token → show party name + role
         - Chat interface: user message → POST /caucus/chat → AI response
         - "Submit Statement" button → POST /caucus/submit-statement
           → confirmation screen
         - Party A and Party B on separate browser tabs with their tokens
         - Chat bubbles: party message right, AI message left

Step 6   Frontend: Joint Session (pages/JointSession.jsx)
         - Connect to WS: ws://localhost:8000/ws/session/{id}?token=...
         - Message rendering:
           party_a    → blue bubble, right aligned
           party_b    → green bubble, left aligned
           mediator   → centered grey card (slightly wider)
           system     → small centered grey text
         - Input box at bottom, send on Enter or button click
         - Agreement modal → redirect to Agreement page
         - Escalation banner → redirect to Arbitration page

Step 7   Frontend: Agreement (pages/Agreement.jsx)
         - GET /agreement/{id} → show terms in readable card layout
         - react-signature-canvas for digital signature
         - POST /agreement/{id}/sign → signed confirmation screen
         - Download button → GET /agreement/{id}/download
```

---

### PHASE 2 — Arbitration Flow

**Goal: Full arbitration loop working from AI failure to award**

```
Step 8   Arbitration Backend Routes (app/api/routes/arbitration.py)
         - POST /escalate/{id}/arbitration
           → create ArbitrationCase
           → assign arbitrator from pool
           → run Agent 5 → generate brief PDF
           → email brief to arbitrator via Email
           → notify both parties via Email
         - POST /escalate/{id}/arbitration/consent
           → record per-party consent
           → if both consented → status = assigned
         - GET /arbitration/{id} → full case details
         - POST /arbitration/{id}/schedule
           → set hearing_datetime + hearing_link → notify parties
         - POST /arbitration/{id}/award
           → validate award JSON
           → generate award PDF via pdf_service
           → status = award_issued → email both parties
         - GET /arbitration/{id}/award/download
         - GET /arbitration/{id}/brief/download
         - GET /escalate/arbitration/all → arbitrator dashboard

Step 9   Agent 5 — Arbitration Brief (app/agents/arbitration_brief.py)
         - Pull all statements + mediation session messages + evidence
         - Retrieve top 3 RAG precedents by dispute type
         - Generate all 9 brief sections as structured JSON
         - Render to PDF via ReportLab → save to ai_brief_pdf_path
         - Test: trigger escalation → verify PDF created and path saved in DB

Step 10  Seed Arbitrators
         - python scripts/seed_arbitrators.py
         - Creates 5–10 sample arbitrators:
           name, bar_registration, specializations, languages, available=True
         - Verify assignment logic picks arbitrator by type + language match

Step 11  Frontend: Arbitration (pages/Arbitration.jsx)
         - State machine based on ArbitrationCase.status:
           pending_consent  → "Arbitration Required" + consent checkbox + confirm
           assigned         → arbitrator name + specialization + "Brief sent" badge
           hearing_scheduled → date/time + "Join Hearing" video link button
           award_issued     → award terms card + download PDF button
         - EscalationTracker component:
           Visual stepper: [AI Mediation ✓] → [Arbitration →] → [Court]
           Highlight active stage, check completed stages

Step 12  Court Filing Mode
         - app/api/routes/court.py
           GET /court/{id}/petition → pre-filled petition PDF (ReportLab)
           GET /court/{id}/evidence-bundle → ZIP of all PDFs + statements
           GET /court/{id}/ecourts-link → ecourts.gov.in redirect
         - pages/CourtFiling.jsx
           → show dispute summary
           → download petition PDF button
           → download evidence bundle button
           → "File on eCourts" external link button
```

---

### PHASE 3 — Language Support + Polish

**Goal: Multilingual + pitch-ready**

```
Step 13  Bhashini Integration (app/services/bhashini.py)
         - translate(text, source_lang, target_lang) → str
         - Wrap Caucus Interviewer responses in translation when language ≠ en
         - Wrap SMS/email notifications in translated templates
         - Test: full Hindi caucus session end to end

         Voice I/O — TTS & STT (✅ COMPLETED)
         - TTS: gTTS backend endpoint (/tts) generates MP3 audio streams
           → Frontend plays via Audio API with toggle in Caucus + Joint Session
           → stopTTS() for instant audio stop, text truncation for long responses
         - STT: SpeechRecognition lib (/stt) with Google Speech Recognition API
           → Frontend records via MediaRecorder (webm/opus)
           → Backend converts to WAV via pydub + ffmpeg → transcribes
           → Returns JSON { transcript, success, error }
         - VoiceInput component: recording timer, auto-stop at 30s, processing spinner
         - Supports all 10 languages: en, hi, kn, ta, te, mr, bn, gu, pa, ml

Step 14  Frontend: Admin Dashboard (pages/Admin.jsx)
         - GET /dispute/stats/summary → show:
           Total disputes | Resolved | Escalated to Arbitration | Active
           Resolution rate % (colour coded)
           Disputes by type (recharts bar chart — no map)
           Pending arbitration cases table with status badges
         - No Leaflet, no GeoJSON, no heatmap

Step 15  Frontend Polish
         - Language selector on registration form
         - EscalationTracker on every relevant page
         - Mobile responsive layout for all pages
         - Loading spinners for all API calls
         - Error boundaries + user-friendly error messages
         - Empty states for no-data scenarios

Step 16  Demo Preparation
         - python seed.py → fresh DB with 4 sample disputes
         - Prepare two browser tabs: Party A token, Party B token
         - Rehearse demo script (see Section 15)
         - Push clean code to GitHub
         - Write README with setup instructions
         - Prepare pitch deck:
           Slide 1: Problem — 5 crore pending cases
           Slide 2: Solution — Prevention + 4-stage pipeline diagram
           Slide 3: Live demo screenshots
           Slide 4: Tech stack + legal anchors
           Slide 5: Impact + Phase 2 roadmap
```

---

## 15. DEMO SCRIPT

### Demo Moment 1 — Full Resolution Pipeline

```
1. Open TWO browser tabs — Party A session, Party B session

2. Party A caucus (tab 1):
   "I lent ₹5 lakhs to my business partner.
    He refuses to return it. The business has failed."

3. Party B caucus (tab 2):
   "The business failed due to market conditions.
    I can repay ₹2 lakhs maximum, in installments."

4. Both parties submit statements
   → AI Synthesis runs automatically
   → Show 3 settlement options with Indian Kanoon precedents:
     Option A: Full ₹5L over 24 months
     Option B: ₹3.5L lump sum final settlement
     Option C: ₹2L now + business asset transfer

5. Joint session opens in both tabs
   AI presents options, mediates, facilitates negotiation

6. Both parties click AGREE on Option B (₹3.5L settlement)

7. PDF agreement generates (Mediation Act 2023, Section 22)
   → Both parties sign digitally on screen

Say to judges:
"How long does this take in court? 7 to 10 years.
 On NyayaAI, this dispute was resolved in minutes.
 The agreement is legally binding under Section 22
 of the Mediation Act 2023."
```

### Demo Moment 2 — Prevention Engine (LightGBM)

```
1. Open Admin dashboard → Prevention Engine panel
2. Select PROP-BLR-2024-78901 (Bengaluru high-risk property)
3. Click "Score Risk" → shows 93.7/100 HIGH RISK
4. Click "View Trail" → shows 5 civic events:
   RERA complaint → Land mutation rejected → CPGrams escalation
   → Another RERA complaint → CERSAI flag
5. Click "Send Nudge" → mock WhatsApp message generated in Kannada

Say to judges:
"Before a dispute even reaches our platform, NyayaAI monitors
 civic data streams — RERA, CPGrams, land records, CERSAI.
 Our LightGBM model scores risk at 93.7% for this Bengaluru property.
 A WhatsApp nudge in Kannada warns the parties to seek mediation
 before it becomes a legal battle."
```

### Demo Moment 3 — Arbitration Escalation

```
1. Show a pre-seeded dispute that failed AI mediation
2. Show "Escalated to Human Mediator" status with AI brief
3. Show human mediation also failed → "Escalated to Arbitration"
4. Show the AI-generated arbitration brief PDF — 9 sections, case precedents
5. Show arbitrator assigned, hearing scheduled
6. Show award PDF with Section 36 Arbitration Act citation

Say to judges:
"If AI mediation fails, NyayaAI doesn't give up.
 First, a NALSA-certified human mediator gets an AI-prepared brief.
 If that also fails, the matter goes to binding arbitration.
 The arbitrator issues a binding award — no court visit needed."
```

---

## 16. WHAT TO SAY WHEN JUDGES ASK

**"How is this different from eCourts?"**
> "eCourts is a filing portal — you go there after the damage is done.
> NyayaAI resolves disputes before they're ever filed.
> eCourts is the last resort. We're the alternative."

**"How do you ensure the AI mediator is neutral?"**
> "The caucus model is the key. Each party talks to the AI privately first.
> The AI never reveals private caucus content in the joint session.
> This mirrors the formal caucus model defined in the Mediation Act 2023."

**"Is the agreement legally binding?"**
> "Yes. The mediation agreement cites Section 22 of the Mediation Act 2023.
> The arbitration award cites Section 36 of the Arbitration & Conciliation Act 1996.
> Both are enforceable in Indian courts."

**"What if one party refuses to join?"**
> "After 7 days and two reminders, we generate a documentation package
> for the willing party and activate court filing mode automatically.
> Pre-filled petition and full evidence bundle — ready to file."

**"How will you scale this?"**
> "The RAG pipeline uses Indian Kanoon's 10-lakh+ judgment database.
> The platform is API-first — state governments and high courts
> can integrate NyayaAI directly into their eCourts workflow."

**"What's the Prevention Engine?"**
> "We monitor civic data streams — RERA complaints, CPGrams escalations,
> land mutation rejections, CERSAI flags. Our LightGBM model scores
> dispute risk from 0-100. Parties above 72 get a WhatsApp nudge
> in their local language, suggesting they use our platform before
> the situation escalates to court."

**"Why not go straight to arbitration?"**
> "Arbitration is binding but adversarial. Mediation preserves relationships.
> Our 4-stage chain gives parties three chances to agree voluntarily
> — AI mediation, human mediation, then binding arbitration.
> Only if all fail does court filing activate."

---

*NyayaAI | Digital India & Public Service Innovation Track | Code Odyssey — KLE Tech Pleiades*  
*Legal Anchors: Mediation Act 2023 + Arbitration & Conciliation Act 1996 + CPC 1908*