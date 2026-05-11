"""
Madhyastha — Text-to-Speech (TTS) Route
Uses edge-tts (Microsoft Neural TTS) for fast, high-quality speech synthesis.
Fallback to gTTS if edge-tts fails.
"""
import io
import logging
import edge_tts
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

logger = logging.getLogger("madhyastha.api.tts")
router = APIRouter(prefix="/tts", tags=["TTS"])


class TTSRequest(BaseModel):
    text: str
    language: str = "en"


# Microsoft Neural voice map — clear, natural-sounding voices for each language
EDGE_VOICE_MAP = {
    "en": "en-IN-NeerjaNeural",
    "hi": "hi-IN-SwaraNeural",
    "kn": "kn-IN-SapnaNeural",
    "ta": "ta-IN-PallaviNeural",
    "te": "te-IN-ShrutiNeural",
    "mr": "mr-IN-AarohiNeural",
    "bn": "bn-IN-TanishaaNeural",
    "gu": "gu-IN-DhwaniNeural",
    "pa": "hi-IN-SwaraNeural",       # Punjabi not available in edge-tts, fallback to Hindi
    "ml": "ml-IN-SobhanaNeural",
}


@router.post("")
async def generate_tts(request: TTSRequest):
    """Generate TTS audio using Microsoft Edge Neural TTS (fast + clear)"""
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # Truncate very long text to keep response fast
    if len(text) > 800:
        text = text[:800] + "..."

    voice = EDGE_VOICE_MAP.get(request.language, "en-IN-NeerjaNeural")

    try:
        # edge-tts is async-native — no blocking, very fast
        communicate = edge_tts.Communicate(text, voice, rate="+10%", pitch="+0Hz")

        mp3_fp = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                mp3_fp.write(chunk["data"])

        if mp3_fp.tell() == 0:
            raise Exception("No audio data generated")

        mp3_fp.seek(0)

        return StreamingResponse(
            mp3_fp,
            media_type="audio/mpeg",
            headers={
                "Cache-Control": "no-cache",
                "Content-Disposition": "inline; filename=tts.mp3",
            }
        )

    except Exception as e:
        logger.warning(f"Edge TTS failed ({e}), falling back to gTTS...")

        # Fallback to gTTS
        try:
            from gtts import gTTS

            GTTS_LANG_MAP = {
                "en": "en", "hi": "hi", "kn": "kn", "ta": "ta", "te": "te",
                "mr": "mr", "bn": "bn", "gu": "gu", "pa": "pa", "ml": "ml",
            }
            lang = GTTS_LANG_MAP.get(request.language, "en")
            tts = gTTS(text=text, lang=lang, slow=False)
            mp3_fp = io.BytesIO()
            tts.write_to_fp(mp3_fp)
            mp3_fp.seek(0)
            return StreamingResponse(mp3_fp, media_type="audio/mpeg")
        except Exception as fallback_err:
            logger.error(f"Both TTS engines failed: {fallback_err}")
            raise HTTPException(status_code=500, detail="Failed to generate TTS audio")
