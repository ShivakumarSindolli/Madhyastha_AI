/**
 * Madhyastha — TTS (Text-to-Speech) Utility
 * Calls the backend edge-tts endpoint and plays audio.
 * Features: stop support, speaking state tracking, auto-cleanup.
 */

let currentAudio = null;
let _isSpeaking = false;
let _onStateChange = null; // Callback for speaking state changes

/**
 * Register a callback for TTS speaking state changes.
 * @param {function} cb - callback(isSpeaking: boolean)
 */
export const onTTSStateChange = (cb) => {
  _onStateChange = cb;
};

const setSpeaking = (val) => {
  _isSpeaking = val;
  if (_onStateChange) _onStateChange(val);
};

/**
 * Stop any currently playing TTS audio immediately.
 */
export const stopTTS = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    if (currentAudio._objectUrl) {
      URL.revokeObjectURL(currentAudio._objectUrl);
    }
    currentAudio = null;
  }
  setSpeaking(false);
};

/**
 * Play TTS audio for the given text.
 * Stops any currently playing audio before starting new playback.
 * @returns {Promise<HTMLAudioElement|null>}
 */
export const playTTS = async (text, language, API_URL) => {
  if (!text || !text.trim()) return null;

  // Stop any currently playing audio first
  stopTTS();

  // Don't TTS system/error messages
  if (text.startsWith('Connection error') || text.startsWith('Error')) return null;

  try {
    setSpeaking(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const res = await fetch(`${API_URL}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      setSpeaking(false);
      throw new Error(`TTS server error: ${res.status}`);
    }

    const blob = await res.blob();
    if (blob.size < 100) {
      setSpeaking(false);
      return null;
    }

    const url = URL.createObjectURL(blob);

    return new Promise((resolve) => {
      const audio = new Audio(url);
      audio._objectUrl = url;
      audio.volume = 1.0;

      currentAudio = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (currentAudio === audio) {
          currentAudio = null;
          setSpeaking(false);
        }
        resolve(audio);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        if (currentAudio === audio) {
          currentAudio = null;
          setSpeaking(false);
        }
        resolve(null);
      };

      audio.play().catch((err) => {
        console.warn('TTS playback blocked:', err.message);
        URL.revokeObjectURL(url);
        if (currentAudio === audio) {
          currentAudio = null;
          setSpeaking(false);
        }
        resolve(null);
      });
    });
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('TTS Error:', error);
    }
    setSpeaking(false);
    return null;
  }
};

/**
 * Check if TTS is currently playing/loading.
 */
export const isTTSPlaying = () => _isSpeaking;
