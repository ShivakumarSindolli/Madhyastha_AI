# ⚖️ Madhyastha AI

**Madhyastha** is a government-authorized, AI-powered dispute resolution platform built to operate under the **Mediation Act 2023** and **Arbitration & Conciliation Act 1996** of India. It facilitates secure, neutral, and multilingual civil dispute resolution between private citizens using an autonomous multi-agent AI framework.

## 🌟 Key Features

- **Multi-Agent Architecture**: Uses an orchestrated sequence of specialized AI agents:
  - 🗣️ **Caucus Interviewer**: Conducts private 1-on-1 sessions to extract positions, interests, and emotional needs.
  - 🧠 **Synthesis Analyst**: Merges private statements and RAG legal precedents to find settlement options without breaking confidentiality.
  - 🤝 **Joint Mediator**: Facilitates a live, real-time negotiation session between both parties.
  - 📜 **Agreement Drafter**: Automatically drafts a legally binding PDF settlement agreement (under Section 22).
  - ⚖️ **Arbitration Brief**: Generates an evidence brief if the mediation fails and escalates.
- **Multilingual Voice I/O**: Backend-powered **Speech-to-Text** (Google Speech Recognition via `SpeechRecognition` library) and **Text-to-Speech** (gTTS) for 10 regional Indian languages (Hindi, Kannada, Tamil, Telugu, Marathi, Bengali, Gujarati, Punjabi, Malayalam, English). The AI responds in native scripts and reads aloud AI mediator responses.
- **Real-Time Escalation Engine**: Actively monitors the joint session for hostile keywords (threats, absolute refusals). If the hostility threshold is reached, it automatically halts the mediation and escalates the case to a human Arbitrator.
- **Async Notification Pipeline**: Anti-spam compliant SMTP integration utilizing FastAPI `BackgroundTasks` to reliably deliver private session links and signed PDF agreements.

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python 3)
- **Database**: SQLite + SQLAlchemy ORM
- **AI / LLM**: Groq API (`llama-3.1-8b-instant` for ultra-low latency)
- **Legal RAG**: FAISS + JSON-based legal precedents and case law
- **PDF Generation**: ReportLab
- **TTS Engine**: gTTS (Google Text-to-Speech) — streams MP3 audio
- **STT Engine**: SpeechRecognition + pydub + ffmpeg (Google Speech Recognition API)
- **Real-time Comm**: WebSockets

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Vanilla CSS (Glassmorphism & Modern UI)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Speech-to-Text**: MediaRecorder → Backend Google Speech Recognition API
- **Text-to-Speech**: Backend gTTS → Browser Audio playback

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- [FFmpeg](https://ffmpeg.org/download.html) (required for audio conversion in STT)
- A [Groq](https://console.groq.com/) API Key
- An SMTP account (e.g., Gmail with an App Password)

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend` directory:
   ```ini
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=llama-3.1-8b-instant
   
   JWT_SECRET_KEY=your_secure_jwt_secret
   JWT_ALGORITHM=HS256
   JWT_EXPIRE_HOURS=72

   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   SMTP_FROM_NAME="Madhyastha AI"
   ```

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### 3. Running the Application

You can start both the frontend and backend simultaneously using the provided root runner script:

```bash
# From the root directory (NyayaAI)
python run.py
```
*The frontend will be available at `http://localhost:5173` and the backend API docs at `http://localhost:8000/docs`.*

## 🛡️ Security & Compliance
- **Data Privacy**: Private caucus data is isolated. The Joint Mediator operates solely on the distilled output of the Synthesis Analyst.
- **Legal Validity**: Final agreements are structured to meet the enforceability requirements of the Indian Mediation Act 2023.

---
*Built to bring swift, accessible, and unbiased justice to the masses.*
