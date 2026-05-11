import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAppContext } from '../App'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, Lock, AlertCircle, CheckCircle, Bot, User, Sparkles, ShieldCheck, Users, Volume2, VolumeX, Loader2 } from 'lucide-react'
import EscalationTracker from '../components/EscalationTracker'
import VoiceInput from '../components/VoiceInput'
import { playTTS, stopTTS, onTTSStateChange } from '../utils/tts'

export default function Caucus() {
  const { API_URL, setToken } = useAppContext()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [partyInfo, setPartyInfo] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState('')
  const [statementComplete, setStatementComplete] = useState(false)
  const [extractedStatement, setExtractedStatement] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [waitingForOther, setWaitingForOther] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const ttsEnabledRef = useRef(false)
  const chatEndRef = useRef(null)

  // Keep ref in sync with state for use in async callbacks
  useEffect(() => { ttsEnabledRef.current = ttsEnabled }, [ttsEnabled])

  // Track TTS speaking state for UI feedback
  useEffect(() => {
    onTTSStateChange((speaking) => setIsSpeaking(speaking));
    return () => onTTSStateChange(null);
  }, [])

  // Initial token verification
  useEffect(() => { if (token) verifyToken() }, [token])

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Poll for joint session after statement submitted (runs only when submitted=true)
  useEffect(() => {
    if (!submitted || !token) return
    setWaitingForOther(true)

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/caucus/verify-token`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const data = await res.json()
        if (data.valid) {
          setPartyInfo(data)
          if (data.status === 'joint_session' || data.status === 'synthesis') {
            clearInterval(interval)
            setWaitingForOther(false)
            // Both parties submitted — navigate to the shared joint session
            navigate(`/session/${data.dispute_id}?token=${token}`)
          }
        }
      } catch {}
    }, 3000)

    return () => clearInterval(interval)
  }, [submitted, token])

  const verifyToken = async () => {
    try {
      const res = await fetch(`${API_URL}/caucus/verify-token`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (data.valid) {
        setPartyInfo(data); setVerified(true); setToken(token)
        // If already in joint session, go directly
        if (data.status === 'joint_session') navigate(`/session/${data.dispute_id}?token=${token}`)
      } else { setError('Invalid or expired session token.') }
    } catch { setError('Failed to verify token.') }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const msg = input.trim(); setInput(''); setLoading(true)
    setMessages(p => [...p, { role: 'user', content: msg }])
    try {
      const res = await fetch(`${API_URL}/caucus/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: msg }),
      })
      const data = await res.json()
      setMessages(p => [...p, { role: 'ai', content: data.ai_response }])
      if (ttsEnabledRef.current) {
        playTTS(data.ai_response, partyInfo?.language || 'en', API_URL);
      }
      
      if (data.statement_complete) { setStatementComplete(true); setExtractedStatement(data.extracted_statement) }
    } catch { setMessages(p => [...p, { role: 'ai', content: 'Connection error. Please try again.' }]) }
    finally { setLoading(false) }
  }

  const submitStatement = async () => {
    if (!extractedStatement) return;
    stopTTS(); // Stop any playing TTS immediately
    setTtsEnabled(false);
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/caucus/submit-statement`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(extractedStatement),
      })
      if (res.ok) setSubmitted(true)
    } catch { setError('Failed to submit.') }
    finally { setLoading(false) }
  }

  // ─── No Token ───────────────────────────────────────
  if (!token) return (
    <div style={{ maxWidth: 460, margin: '0 auto', padding: '100px 24px', textAlign: 'center' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <AlertCircle size={52} style={{ color: '#ed8936', marginBottom: 16 }} />
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.4rem', marginBottom: 8 }}>No Session Token</h2>
        <p style={{ color: '#64748b' }}>Use the session link provided during dispute registration.</p>
      </motion.div>
    </div>
  )

  // ─── Error ──────────────────────────────────────────
  if (error) return (
    <div style={{ maxWidth: 460, margin: '0 auto', padding: '100px 24px', textAlign: 'center' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <AlertCircle size={52} style={{ color: '#fc5c65', marginBottom: 16 }} />
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.4rem' }}>{error}</h2>
      </motion.div>
    </div>
  )

  // ─── Statement Submitted — Waiting for Other Party ──
  if (submitted) return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(72,187,120,0.1)',
                   border: '2px solid rgba(72,187,120,0.3)', display: 'flex', alignItems: 'center',
                   justifyContent: 'center', margin: '0 auto 20px' }}>
          <ShieldCheck size={40} style={{ color: '#48bb78' }} />
        </motion.div>
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.6rem', marginBottom: 8 }}>Statement Locked!</h2>
        <p style={{ color: '#64748b', marginBottom: 20, lineHeight: 1.7 }}>
          Your private statement has been securely recorded. Once the other party completes their session, you will both be redirected to the <strong>Joint Mediation Session</strong> automatically.
        </p>

        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, 
                   padding: '14px 24px', borderRadius: 14, background: 'rgba(102,126,234,0.08)',
                   border: '1px solid rgba(102,126,234,0.2)', marginBottom: 24 }}>
          <Users size={18} style={{ color: '#667eea' }} />
          <span style={{ fontSize: '0.9rem', color: '#667eea', fontWeight: 600 }}>
            Waiting for other party to complete their caucus...
          </span>
        </motion.div>

        <EscalationTracker currentStage={partyInfo?.status || 'caucus'} />

        {partyInfo?.status === 'joint_session' && (
          <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/session/${partyInfo.dispute_id}?token=${token}`)}
            className="btn-primary" style={{ marginTop: 24, padding: '14px 32px', fontSize: '1rem' }}>
            Join Session
          </motion.button>
        )}
      </motion.div>
    </div>
  )

  // ─── Loading ────────────────────────────────────────
  if (!verified) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 0' }}>
      <div className="spinner" />
    </div>
  )

  // ─── Main Caucus Chat ──────────────────────────────
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-static" style={{ padding: '16px 24px', marginBottom: 12, borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem' }}>
            Private Caucus — {partyInfo?.party_name}
          </h2>
          <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
            {partyInfo?.dispute_title} &bull; {partyInfo?.role === 'party_a' ? 'Complainant' : 'Respondent'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            onClick={() => {
              if (ttsEnabled) stopTTS();
              setTtsEnabled(!ttsEnabled);
            }}
            title={ttsEnabled ? 'Disable Voice' : 'Enable Voice'}
            style={{ 
              background: isSpeaking ? 'rgba(102,126,234,0.15)' : ttsEnabled ? 'rgba(72,187,120,0.1)' : 'rgba(0,0,0,0.05)',
              border: `1px solid ${isSpeaking ? 'rgba(102,126,234,0.4)' : ttsEnabled ? 'rgba(72,187,120,0.3)' : 'transparent'}`,
              color: isSpeaking ? '#667eea' : ttsEnabled ? '#48bb78' : '#64748b',
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
              borderRadius: 20, cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.8rem', fontWeight: 600
            }}
          >
            {isSpeaking ? (
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            {isSpeaking ? 'Speaking...' : ttsEnabled ? 'Voice ON' : 'Voice OFF'}
          </button>
          <div className="badge badge-active">
            <Lock size={10} /> Private
          </div>
        </div>
      </motion.div>

      <EscalationTracker currentStage="caucus" />

      {/* Chat */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-static" style={{ marginTop: 12, borderRadius: 20, display: 'flex', flexDirection: 'column', height: '60vh', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 12px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#334155' }}>
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                <Bot size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              </motion.div>
              <p style={{ fontSize: '0.92rem' }}>Start by describing your side of the dispute.</p>
              <p style={{ fontSize: '0.78rem', marginTop: 4, color: '#1e293b' }}>The AI interviewer will guide you through 6 structured questions.</p>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
                style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, maxWidth: '78%',
                              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', background: msg.role === 'user' ? 'rgba(102,126,234,0.15)' : 'rgba(118,75,162,0.15)',
                                marginBottom: 2 }}>
                    {msg.role === 'user' ? <User size={14} style={{ color: '#7c8cf0' }} /> : <Bot size={14} style={{ color: '#a78bfa' }} />}
                  </div>
                  <div className={msg.role === 'user' ? 'chat-bubble chat-bubble-user' : 'chat-bubble chat-bubble-ai'}>
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(118,75,162,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={14} style={{ color: '#a78bfa' }} />
              </div>
              <div className="chat-bubble chat-bubble-ai" style={{ padding: '14px 20px' }}>
                <div className="typing-indicator"><span /><span /><span /></div>
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Statement Preview */}
        <AnimatePresence>
          {statementComplete && extractedStatement && !submitted && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', padding: '0 20px' }}>
              <div style={{ padding: 16, borderRadius: 14, background: 'rgba(72,187,120,0.06)',
                            border: '1px solid rgba(72,187,120,0.2)', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Sparkles size={14} style={{ color: '#48bb78' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#68d391' }}>Statement Ready</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[['Position', extractedStatement.position], ['Interest', extractedStatement.interest],
                    ['Min Acceptable', extractedStatement.min_acceptable], ['Emotional Need', extractedStatement.emotional_need]].map(([k, v]) => (
                    <div key={k} style={{ fontSize: '0.78rem' }}>
                      <span style={{ color: '#475569' }}>{k}:</span>
                      <span style={{ color: '#1e293b', marginLeft: 4 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={submitStatement}
                  className="btn-primary" disabled={loading} style={{ marginTop: 12, fontSize: '0.85rem', padding: '10px 22px' }}>
                  <Lock size={14} /> Submit & Lock Statement
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <VoiceInput
              language={partyInfo?.language || 'en'}
              onResult={(transcript) => setInput(prev => prev ? prev + ' ' + transcript : transcript)}
              disabled={submitted || statementComplete}
            />
            <input className="input-field" placeholder="Type or speak your message..." value={input}
              onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
              disabled={submitted || statementComplete} style={{ borderRadius: 14 }} />
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={sendMessage} className="btn-primary" disabled={loading || !input.trim() || statementComplete}
              style={{ padding: '12px 18px', borderRadius: 14 }}>
              <Send size={18} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
