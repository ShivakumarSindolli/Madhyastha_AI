import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppContext } from '../App'

const LANG_LABELS = {
  en: 'English', hi: 'Hindi', kn: 'Kannada', ta: 'Tamil',
  te: 'Telugu', mr: 'Marathi', bn: 'Bengali', gu: 'Gujarati',
  pa: 'Punjabi', ml: 'Malayalam',
}

/**
 * VoiceInput — Speech-to-Text microphone button
 * Uses backend Google Speech Recognition API via MediaRecorder.
 *
 * Props:
 *   language  — language code ('en', 'hi', 'kn', etc.)
 *   onResult  — callback(transcript) when speech is recognized
 *   disabled  — disable the button
 */
export default function VoiceInput({ language = 'en', onResult, disabled = false }) {
  const { API_URL } = useAppContext()
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [supported, setSupported] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const timerRef = useRef(null)

  // Check MediaRecorder support
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setSupported(false)
    }
  }, [])

  // Recording timer
  useEffect(() => {
    if (recording) {
      setRecordingTime(0)
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          // Auto-stop after 30 seconds
          if (prev >= 30) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setRecordingTime(0)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [recording])

  const startRecording = useCallback(async () => {
    setErrorMsg('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      })
      streamRef.current = stream
      chunksRef.current = []

      // Determine supported MIME type
      let mimeType = 'audio/webm;codecs=opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm'
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/ogg;codecs=opus'
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = '' // Let browser decide
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        streamRef.current = null

        if (chunksRef.current.length === 0) {
          setErrorMsg('No audio recorded')
          return
        }

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm'
        })
        chunksRef.current = []

        // Send to backend for transcription
        await sendToBackend(blob, recorder.mimeType || 'audio/webm')
      }

      recorder.onerror = (e) => {
        console.error('MediaRecorder error:', e)
        setErrorMsg('Recording error')
        setRecording(false)
      }

      // Collect data every 250ms for responsiveness
      recorder.start(250)
      setRecording(true)
    } catch (err) {
      console.error('Microphone access error:', err)
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Microphone access denied')
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('No microphone found')
      } else {
        setErrorMsg('Failed to access microphone')
      }
    }
  }, [language])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
  }, [])

  const sendToBackend = async (blob, mimeType) => {
    setProcessing(true)
    setErrorMsg('')

    try {
      const formData = new FormData()
      // Determine file extension from mime type
      let ext = 'webm'
      if (mimeType.includes('ogg')) ext = 'ogg'
      else if (mimeType.includes('wav')) ext = 'wav'
      else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) ext = 'mp3'

      formData.append('audio', blob, `recording.${ext}`)
      formData.append('language', language)

      const res = await fetch(`${API_URL}/stt`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }

      const data = await res.json()

      if (data.success && data.transcript) {
        if (onResult) onResult(data.transcript)
      } else if (data.error) {
        setErrorMsg(data.error)
        // Clear error after 3s
        setTimeout(() => setErrorMsg(''), 3000)
      } else {
        setErrorMsg('No speech detected')
        setTimeout(() => setErrorMsg(''), 3000)
      }
    } catch (err) {
      console.error('STT request error:', err)
      setErrorMsg('Connection error. Try again.')
      setTimeout(() => setErrorMsg(''), 3000)
    } finally {
      setProcessing(false)
    }
  }

  const toggleRecording = () => {
    if (recording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  if (!supported) return null

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={toggleRecording}
        disabled={disabled || processing}
        title={
          processing ? 'Transcribing...' :
          recording ? 'Stop recording' :
          `Speak in ${LANG_LABELS[language] || 'English'}`
        }
        style={{
          width: 44, height: 44, borderRadius: 14, border: 'none',
          cursor: (disabled || processing) ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: processing
            ? 'linear-gradient(135deg, #f6ad55, #ed8936)'
            : recording
              ? 'linear-gradient(135deg, #fc5c65, #eb3b5a)'
              : 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          boxShadow: processing
            ? '0 4px 15px rgba(237,137,54,0.4)'
            : recording
              ? '0 4px 15px rgba(252,92,101,0.4)'
              : '0 4px 15px rgba(102,126,234,0.3)',
          opacity: disabled ? 0.4 : 1,
          transition: 'all 0.3s',
          position: 'relative',
        }}
      >
        {processing ? (
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
        ) : recording ? (
          <MicOff size={18} />
        ) : (
          <Mic size={18} />
        )}
      </motion.button>

      {/* Pulsing ring animation when recording */}
      <AnimatePresence>
        {recording && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              position: 'absolute', top: -4, left: -4, right: -4, bottom: -4,
              borderRadius: 18, border: '2px solid rgba(252,92,101,0.4)',
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* Recording timer / Processing indicator tooltip */}
      <AnimatePresence>
        {(recording || processing || errorMsg) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            style={{
              position: 'absolute', bottom: '120%', left: '50%',
              transform: 'translateX(-50%)',
              background: errorMsg
                ? 'rgba(252,92,101,0.95)'
                : 'rgba(15,23,42,0.95)',
              color: 'white', padding: '10px 16px',
              borderRadius: 12, fontSize: '0.82rem', width: 'max-content',
              maxWidth: 280, whiteSpace: 'normal', pointerEvents: 'none',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.1)',
              lineHeight: 1.4, zIndex: 50, textAlign: 'center',
            }}
          >
            {errorMsg ? (
              <span>{errorMsg}</span>
            ) : processing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Transcribing with Google...</span>
              </div>
            ) : recording ? (
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  color: '#fc5c65', fontSize: '0.75rem', fontWeight: 600
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', background: '#fc5c65',
                    animation: 'pulse 1s ease-in-out infinite',
                  }} />
                  Recording — {recordingTime}s
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>
                  Tap mic to stop & transcribe
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyframe animation for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
