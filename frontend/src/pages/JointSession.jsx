import React, { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useAppContext } from '../App'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Users, AlertTriangle, CheckCircle, Wifi, WifiOff, Bot, User, MessageSquare, Flame, Volume2, VolumeX, Loader2 } from 'lucide-react'
import EscalationTracker from '../components/EscalationTracker'
import VoiceInput from '../components/VoiceInput'
import { playTTS, stopTTS, onTTSStateChange } from '../utils/tts'

export default function JointSession() {
  const { disputeId } = useParams()
  const [searchParams] = useSearchParams()
  const { API_URL, token: savedToken } = useAppContext()
  const navigate = useNavigate()
  const token = searchParams.get('token') || savedToken

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const [signal, setSignal] = useState(null)
  const [escalationScore, setEscalationScore] = useState(0)
  const [partyInfo, setPartyInfo] = useState(null)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const ttsEnabledRef = useRef(false)
  const wsRef = useRef(null)
  const chatEndRef = useRef(null)
  const partyInfoRef = useRef(null) // For websocket closure

  // Keep ref in sync with state for WebSocket closure access
  useEffect(() => { ttsEnabledRef.current = ttsEnabled }, [ttsEnabled])

  // Track TTS speaking state for UI feedback
  useEffect(() => {
    onTTSStateChange((speaking) => setIsSpeaking(speaking));
    return () => onTTSStateChange(null);
  }, [])

  useEffect(() => { 
    loadSession(); 
    connectWebSocket(); 
    if (token) verifyToken();
    return () => { if (wsRef.current) wsRef.current.close() } 
  }, [disputeId])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const verifyToken = async () => {
    try {
      const res = await fetch(`${API_URL}/caucus/verify-token`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (data.valid) {
        setPartyInfo(data)
        partyInfoRef.current = data
      }
    } catch (e) { console.error('Failed to verify token', e) }
  }

  const loadSession = async () => {
    try {
      const res = await fetch(`${API_URL}/session/${disputeId}`)
      if (res.ok) { const data = await res.json(); if (data.messages) setMessages(data.messages) }
    } catch (e) { console.error('Failed to load session', e) }
  }

  const connectWebSocket = () => {
    const ws = new WebSocket(`ws://localhost:8000/ws/session/${disputeId}?token=${token}`)
    wsRef.current = ws
    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'history') setMessages(data.messages || [])
      else if (data.type === 'message') {
        setMessages(p => [...p, data])
        if (data.escalation_score !== undefined) setEscalationScore(data.escalation_score)
        
        if (data.role === 'mediator') {
          // Use ref to read latest ttsEnabled state (avoids stale closure)
          if (ttsEnabledRef.current) {
            const lang = partyInfoRef.current?.language || 'en';
            playTTS(data.content, lang, API_URL);
          }
        }
      }
      else if (data.type === 'system') setMessages(p => [...p, { role: 'system', content: data.content }])
      else if (data.type === 'signal') {
        setSignal(data.signal)
        if (data.escalation_score !== undefined) setEscalationScore(data.escalation_score)
      }
    }
  }

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current) return
    wsRef.current.send(JSON.stringify({ message: input.trim() }))
    setInput('')
  }

  const getRoleStyle = (role) => {
    if (role === 'party_a') return { bg: 'rgba(102,126,234,0.15)', border: 'rgba(102,126,234,0.3)', color: '#7c8cf0', icon: User }
    if (role === 'party_b') return { bg: 'rgba(72,187,120,0.15)', border: 'rgba(72,187,120,0.3)', color: '#68d391', icon: User }
    if (role === 'mediator') return { bg: 'rgba(118,75,162,0.15)', border: 'rgba(118,75,162,0.3)', color: '#a78bfa', icon: Bot }
    if (role === 'arbitrator') return { bg: 'rgba(237,137,54,0.15)', border: 'rgba(237,137,54,0.3)', color: '#ed8936', icon: Users }
    return { bg: 'var(--bg-card)', border: 'var(--border)', color: 'white', icon: User }
  }

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '24px 16px' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-static" style={{ padding: '16px 24px', marginBottom: 16, borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={18} color="white" />
          </div>
          <div>
            <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem' }}>Joint Mediation</h2>
            <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>Real-time session with AI Mediator</p>
          </div>
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
          {/* Escalation Score Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 100,
            background: escalationScore >= 1 ? 'rgba(252,92,101,0.1)' : 'rgba(0,0,0,0.03)',
            border: `1px solid ${escalationScore >= 1 ? 'rgba(252,92,101,0.25)' : 'rgba(0,0,0,0.06)'}` }}>
            <Flame size={12} style={{ color: escalationScore >= 1 ? '#fc5c65' : '#94a3b8' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', transition: 'all 0.5s',
              background: escalationScore >= 1 ? '#fc5c65' : 'rgba(0,0,0,0.08)',
              boxShadow: escalationScore >= 1 ? '0 0 6px rgba(252,92,101,0.4)' : 'none'
            }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 600,
              color: escalationScore >= 1 ? '#fc5c65' : '#94a3b8' }}>
              {escalationScore}/1
            </span>
          </div>
          <div className={`badge ${connected ? 'badge-success' : 'badge-danger'}`} style={{ gap: 6 }}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />} {connected ? 'Live' : 'Disconnected'}
          </div>
        </div>
      </motion.div>

      <EscalationTracker currentStage="joint_session" />

      <AnimatePresence>
        {signal === 'AGREEMENT_REACHED' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            style={{ overflow: 'hidden', marginTop: 16 }}>
            <div style={{ padding: '16px 20px', borderRadius: 16, background: 'rgba(72,187,120,0.08)',
                          border: '1px solid rgba(72,187,120,0.25)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <CheckCircle size={32} style={{ color: '#48bb78' }} />
              </motion.div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#68d391', fontSize: '1.05rem', fontFamily: 'Outfit' }}>Agreement Reached!</div>
                <div style={{ fontSize: '0.88rem', color: '#94a3b8', marginTop: 2 }}>Both parties have agreed. The settlement document is ready.</div>
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/agreement/${disputeId}`)} className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
                View Agreement
              </motion.button>
            </div>
          </motion.div>
        )}

        {signal === 'ESCALATE_TO_ARBITRATION' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            style={{ overflow: 'hidden', marginTop: 16 }}>
            <div style={{ padding: '16px 20px', borderRadius: 16, background: 'rgba(237,137,54,0.08)',
                          border: '1px solid rgba(237,137,54,0.25)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}>
                <AlertTriangle size={32} style={{ color: '#ed8936' }} />
              </motion.div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#f6ad55', fontSize: '1.05rem', fontFamily: 'Outfit' }}>Escalated to Arbitration</div>
                <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: 2 }}>AI mediation was unable to reach agreement. This dispute has been escalated to binding arbitration under the Arbitration & Conciliation Act, 1996.</div>
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/arbitration/${disputeId}`)} className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
                View Arbitration
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-static" style={{ marginTop: 16, borderRadius: 20, display: 'flex', flexDirection: 'column', height: '65vh', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 12px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#334155' }}>
              <MessageSquare size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontSize: '0.92rem' }}>Waiting for messages...</p>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg, i) => {
              if (msg.role === 'system') return (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ textAlign: 'center', margin: '16px 0' }}>
                  <span style={{ background: 'rgba(0,0,0,0.03)', padding: '6px 16px', borderRadius: 100,
                                 fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', border: '1px solid rgba(0,0,0,0.05)' }}>
                    {msg.content}
                  </span>
                </motion.div>
              )

              const style = getRoleStyle(msg.role)
              const isSelf = msg.role === 'party_a' || msg.role === 'party_b' // Simplified alignment logic

              return (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', justifyContent: isSelf ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, maxWidth: '80%', flexDirection: isSelf ? 'row-reverse' : 'row' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: style.bg, border: `1px solid ${style.border}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <style.icon size={16} style={{ color: style.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: style.color, fontWeight: 600, marginBottom: 4, textAlign: isSelf ? 'right' : 'left' }}>
                        {msg.party_name || (msg.role === 'mediator' ? 'AI Mediator' : msg.role)}
                      </div>
                      <div className="chat-bubble" style={{ background: isSelf ? style.bg : 'var(--bg-card)',
                            border: `1px solid ${isSelf ? style.border : 'var(--border)'}`, color: 'var(--text-primary)',
                            borderRadius: 16, borderTopRightRadius: isSelf ? 4 : 16, borderTopLeftRadius: !isSelf ? 4 : 16,
                            padding: '12px 18px', fontSize: '0.92rem' }}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <VoiceInput
              language={partyInfo?.language || 'en'}
              onResult={(transcript) => setInput(prev => prev ? prev + ' ' + transcript : transcript)}
              disabled={!!signal}
            />
            <input className="input-field" placeholder="Type or speak your message..."
              value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
              disabled={!!signal} style={{ borderRadius: 16 }} />
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={sendMessage} className="btn-primary" disabled={!input.trim() || !!signal}
              style={{ padding: '12px 20px', borderRadius: 16 }}>
              <Send size={18} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
