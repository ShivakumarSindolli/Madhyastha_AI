import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../App'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, User, Phone, Mail, Globe, AlertTriangle, Check, Copy,
         ExternalLink, ChevronRight, ChevronLeft, Sparkles, Shield } from 'lucide-react'

const TYPES = [
  { value: 'property_boundary', label: 'Property Boundary', emoji: '🏗️' },
  { value: 'property_ownership', label: 'Property Ownership', emoji: '🏠' },
  { value: 'rent_tenancy', label: 'Rent / Tenancy', emoji: '🔑' },
  { value: 'money_loan', label: 'Money / Loan', emoji: '💰' },
  { value: 'contract_breach', label: 'Contract Breach', emoji: '📋' },
  { value: 'employment', label: 'Employment', emoji: '💼' },
  { value: 'consumer', label: 'Consumer', emoji: '🛒' },
  { value: 'family_inheritance', label: 'Family / Inheritance', emoji: '👨‍👩‍👧‍👦' },
  { value: 'neighbourhood', label: 'Neighbourhood', emoji: '🏘️' },
  { value: 'other_civil', label: 'Other Civil', emoji: '⚖️' },
]

const LANGS = [
  { value: 'en', label: 'English' }, { value: 'hi', label: 'Hindi' },
  { value: 'kn', label: 'Kannada' }, { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' }, { value: 'mr', label: 'Marathi' },
  { value: 'bn', label: 'Bengali' }, { value: 'gu', label: 'Gujarati' },
  { value: 'pa', label: 'Punjabi' }, { value: 'ml', label: 'Malayalam' },
]

const slideVariants = {
  enter: (d) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
}

export default function Register() {
  const { API_URL } = useAppContext()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  const [form, setForm] = useState({
    title: '', description: '', dispute_type: 'money_loan',
    party_a: { name: '', phone: '', email: '', language: 'en' },
    party_b: { name: '', phone: '', email: '', language: 'en' },
    arbitration_consent: true,
  })

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const updateParty = (party, f, v) => setForm(p => ({ ...p, [party]: { ...p[party], [f]: v } }))

  const next = () => { setDirection(1); setStep(s => Math.min(s + 1, 3)) }
  const prev = () => { setDirection(-1); setStep(s => Math.max(s - 1, 0)) }

  const canNext = () => {
    if (step === 0) return form.title.length >= 5 && form.dispute_type
    if (step === 1) return form.party_a.name.length >= 2
    if (step === 2) return form.party_b.name.length >= 2
    return true
  }

  const handleSubmit = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_URL}/dispute/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Failed') }
      setResult(await res.json())
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const copyText = (text, label) => { navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(''), 2000) }

  // ── Success Screen ──
  if (result) return (
    <div style={{ maxWidth: 580, margin: '0 auto', padding: '60px 24px' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}
        className="glass-static" style={{ padding: '48px 36px', textAlign: 'center', borderRadius: 24 }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
          style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(72,187,120,0.1)',
                   border: '2px solid rgba(72,187,120,0.3)', display: 'flex', alignItems: 'center',
                   justifyContent: 'center', margin: '0 auto 20px' }}>
          <Check size={36} style={{ color: '#48bb78' }} />
        </motion.div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Outfit', marginBottom: 8 }}>Dispute Registered!</h2>
        <p style={{ color: '#64748b', marginBottom: 28, fontSize: '0.92rem' }}>Each party can start their private caucus session below.</p>

        {[{ label: `Party A — ${form.party_a.name}`, role: 'Complainant', link: result.party_a_link, token: result.party_a_token, key: 'a', color: '#667eea', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
          { label: `Party B — ${form.party_b.name}`, role: 'Respondent', link: result.party_b_link, token: result.party_b_token, key: 'b', color: '#48bb78', gradient: 'linear-gradient(135deg, #48bb78, #38a169)' }].map((p) => (
          <motion.div key={p.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: p.key === 'a' ? 0.3 : 0.4 }}
            style={{ padding: 20, borderRadius: 16, background: `${p.color}08`, border: `1px solid ${p.color}20`, marginBottom: 14, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>{p.label}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{p.role}</div>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => copyText(p.link, p.key)}
                title="Copy session link"
                style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid var(--border)', borderRadius: 10,
                         padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                         fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                {copied === p.key ? <><Check size={12} style={{ color: '#48bb78' }} /> Copied!</> : <><Copy size={12} /> Copy Link</>}
              </motion.button>
            </div>
            <motion.a
              href={`/caucus?token=${p.token}`}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02, boxShadow: `0 8px 24px ${p.color}30` }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                width: '100%', padding: '14px 20px', borderRadius: 12,
                background: p.gradient, color: 'white',
                fontWeight: 700, fontSize: '0.92rem', fontFamily: 'Outfit',
                textDecoration: 'none', cursor: 'pointer', border: 'none',
                boxShadow: `0 4px 15px ${p.color}25`, transition: 'all 0.3s',
              }}
            >
              <ExternalLink size={16} />
              Start Caucus Session →
            </motion.a>
          </motion.div>
        ))}

        <div style={{ marginTop: 20 }}>
          <button className="btn-secondary" onClick={() => { setResult(null); setStep(0) }}
            style={{ fontSize: '0.9rem', padding: '10px 24px' }}>
            Register Another Dispute
          </button>
        </div>
      </motion.div>
    </div>
  )

  // ── Form ──
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Outfit', marginBottom: 8 }}>
          Register a <span className="gradient-text">Dispute</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>AI-powered resolution in 4 simple steps.</p>
      </motion.div>

      {/* Progress Bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {['Dispute', 'Party A', 'Party B', 'Confirm'].map((label, i) => (
          <div key={i} style={{ flex: 1 }}>
            <motion.div animate={{ background: i <= step ? 'linear-gradient(90deg, #667eea, #764ba2)' : 'rgba(102,126,234,0.08)' }}
              style={{ height: 4, borderRadius: 4, marginBottom: 6 }} />
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: i <= step ? '#a78bfa' : '#334155',
                          textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
          </div>
        ))}
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '12px 18px', borderRadius: 12, background: 'rgba(252,92,101,0.08)',
                   border: '1px solid rgba(252,92,101,0.2)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <AlertTriangle size={16} style={{ color: '#fc5c65' }} />
          <span style={{ color: '#fc8181', fontSize: '0.88rem' }}>{error}</span>
        </motion.div>
      )}

      <AnimatePresence mode="wait" custom={direction}>
        {/* Step 0: Dispute Details */}
        {step === 0 && (
          <motion.div key="step0" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }} className="glass-static" style={{ padding: 32, borderRadius: 20 }}>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={20} style={{ color: '#667eea' }} /> Dispute Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label className="form-label">Title *</label>
                <input className="input-field" placeholder="e.g. Loan Repayment Dispute — Rs 5 Lakhs"
                  value={form.title} onChange={e => update('title', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea className="input-field" rows={3} placeholder="Brief description..."
                  value={form.description} onChange={e => update('description', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Dispute Type *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {TYPES.map(t => (
                    <motion.div key={t.value} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => update('dispute_type', t.value)}
                      style={{ padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                               background: form.dispute_type === t.value ? 'rgba(102,126,234,0.1)' : 'var(--bg-base)',
                               border: `1px solid ${form.dispute_type === t.value ? 'rgba(102,126,234,0.3)' : 'var(--border)'}`,
                               color: form.dispute_type === t.value ? '#a78bfa' : '#94a3b8', transition: 'all 0.3s' }}>
                      {t.label}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 1: Party A */}
        {step === 1 && (
          <motion.div key="step1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }} className="glass-static" style={{ padding: 32, borderRadius: 20 }}>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <User size={20} style={{ color: '#667eea' }} /> Party A — Complainant
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Full Name *</label>
                <input className="input-field" placeholder="Full legal name" value={form.party_a.name}
                  onChange={e => updateParty('party_a', 'name', e.target.value)} />
              </div>
              <div>
                <label className="form-label"><Phone size={12} style={{ display: 'inline' }} /> Phone</label>
                <input className="input-field" placeholder="+91 XXXXX XXXXX" value={form.party_a.phone}
                  onChange={e => updateParty('party_a', 'phone', e.target.value)} />
              </div>
              <div>
                <label className="form-label"><Mail size={12} style={{ display: 'inline' }} /> Email</label>
                <input className="input-field" type="email" placeholder="email@example.com" value={form.party_a.email}
                  onChange={e => updateParty('party_a', 'email', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label"><Globe size={12} style={{ display: 'inline' }} /> Language</label>
                <select className="input-field" value={form.party_a.language}
                  onChange={e => updateParty('party_a', 'language', e.target.value)}>
                  {LANGS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Party B */}
        {step === 2 && (
          <motion.div key="step2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }} className="glass-static" style={{ padding: 32, borderRadius: 20 }}>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <User size={20} style={{ color: '#48bb78' }} /> Party B — Respondent
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Full Name *</label>
                <input className="input-field" placeholder="Full legal name" value={form.party_b.name}
                  onChange={e => updateParty('party_b', 'name', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input className="input-field" placeholder="+91 XXXXX XXXXX" value={form.party_b.phone}
                  onChange={e => updateParty('party_b', 'phone', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input className="input-field" type="email" placeholder="email@example.com" value={form.party_b.email}
                  onChange={e => updateParty('party_b', 'email', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Language</label>
                <select className="input-field" value={form.party_b.language}
                  onChange={e => updateParty('party_b', 'language', e.target.value)}>
                  {LANGS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <motion.div key="step3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }} className="glass-static" style={{ padding: 32, borderRadius: 20 }}>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={20} style={{ color: '#f093fb' }} /> Review & Confirm
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div className="glass" style={{ padding: 16, borderRadius: 12 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Dispute</div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{form.title}</div>
                <div style={{ color: '#667eea', fontSize: '0.82rem', marginTop: 4 }}>{form.dispute_type.replace(/_/g, ' ')}</div>
              </div>
              <div className="glass" style={{ padding: 16, borderRadius: 12 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Parties</div>
                <div style={{ fontSize: '0.88rem' }}><span style={{ color: '#667eea' }}>A:</span> {form.party_a.name}</div>
                <div style={{ fontSize: '0.88rem', marginTop: 2 }}><span style={{ color: '#48bb78' }}>B:</span> {form.party_b.name}</div>
              </div>
            </div>

            <motion.label whileHover={{ scale: 1.01 }} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
                          padding: 18, borderRadius: 14, background: 'rgba(102,126,234,0.05)', border: '1px solid rgba(102,126,234,0.1)' }}>
              <input type="checkbox" checked={form.arbitration_consent} onChange={e => update('arbitration_consent', e.target.checked)}
                style={{ marginTop: 3, accentColor: '#667eea', width: 18, height: 18 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Shield size={14} style={{ color: '#667eea' }} /> Consent to Binding Arbitration
                </div>
                <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 4, lineHeight: 1.6 }}>
                  If AI mediation fails, the dispute will be referred to a registered arbitrator for a legally binding award
                  under Section 36, Arbitration & Conciliation Act, 1996.
                </div>
              </div>
            </motion.label>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.97 }}
          onClick={prev} className="btn-ghost" style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>
          <ChevronLeft size={16} /> Back
        </motion.button>

        {step < 3 ? (
          <motion.button whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}
            onClick={next} className="btn-primary" disabled={!canNext()}
            style={{ opacity: canNext() ? 1 : 0.4 }}>
            Next <ChevronRight size={16} />
          </motion.button>
        ) : (
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={handleSubmit} className="btn-primary" disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Registering...</>
              : <><Sparkles size={16} /> Register Dispute</>}
          </motion.button>
        )}
      </div>
    </div>
  )
}
