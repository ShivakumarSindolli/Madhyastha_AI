"""
Madhyastha — Speech-to-Text (STT) Route
Uses Google Speech Recognition via the SpeechRecognition library.
Accepts audio blobs from the frontend and returns transcriptions.
"""
import io
import logging
import tempfile
import os
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import speech_recognition as sr

logger = logging.getLogger("madhyastha.api.stt")
router = APIRouter(prefix="/stt", tags=["STT"])


# Map our internal language codes to Google Speech Recognition BCP-47 tags
GOOGLE_LANG_MAP = {
    "en": "en-IN",
    "hi": "hi-IN",
    "kn": "kn-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "mr": "mr-IN",
    "bn": "bn-IN",
    "gu": "gu-IN",
    "pa": "pa-IN",
    "ml": "ml-IN",
}


class STTResponse(BaseModel):
    transcript: str
    language: str
    success: bool
    error: str | None = None


@router.post("", response_model=STTResponse)
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: str = Form("en"),
):
    """
    Transcribe audio using Google Speech Recognition.
    Accepts audio files (webm, wav, ogg, mp3) from frontend MediaRecorder.
    """
    if not audio:
        raise HTTPException(status_code=400, detail="No audio file provided")

    lang_code = GOOGLE_LANG_MAP.get(language, "en-IN")

    try:
        # Read the uploaded audio bytes
        audio_bytes = await audio.read()
        if len(audio_bytes) < 100:
            return STTResponse(
                transcript="", language=language, success=False,
                error="Audio too short"
            )

        # Convert to WAV using pydub for compatibility
        from pydub import AudioSegment

        # Determine input format from content type
        content_type = audio.content_type or ""
        if "webm" in content_type:
            fmt = "webm"
        elif "ogg" in content_type:
            fmt = "ogg"
        elif "mp3" in content_type or "mpeg" in content_type:
            fmt = "mp3"
        elif "wav" in content_type:
            fmt = "wav"
        else:
            # Try to detect from filename
            filename = audio.filename or ""
            if filename.endswith(".webm"):
                fmt = "webm"
            elif filename.endswith(".ogg"):
                fmt = "ogg"
            elif filename.endswith(".mp3"):
                fmt = "mp3"
            else:
                fmt = "webm"  # Default for MediaRecorder

        # Write to temp file for pydub
        with tempfile.NamedTemporaryFile(suffix=f".{fmt}", delete=False) as tmp_input:
            tmp_input.write(audio_bytes)
            tmp_input_path = tmp_input.name

        try:
            # Convert to WAV
            audio_segment = AudioSegment.from_file(tmp_input_path, format=fmt)
            # Ensure mono, 16kHz for best recognition
            audio_segment = audio_segment.set_channels(1).set_frame_rate(16000)

            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_wav:
                audio_segment.export(tmp_wav.name, format="wav")
                tmp_wav_path = tmp_wav.name

            # Recognize with Google Speech Recognition
            recognizer = sr.Recognizer()
            with sr.AudioFile(tmp_wav_path) as source:
                audio_data = recognizer.record(source)

            transcript = recognizer.recognize_google(
                audio_data,
                language=lang_code,
                show_all=False
            )

            logger.info(f"STT [{language}]: '{transcript[:80]}...'")

            return STTResponse(
                transcript=transcript,
                language=language,
                success=True
            )

        finally:
            # Cleanup temp files
            for f in [tmp_input_path, locals().get("tmp_wav_path", "")]:
                try:
                    if f and os.path.exists(f):
                        os.unlink(f)
                except OSError:
                    pass

    except sr.UnknownValueError:
        logger.warning(f"STT: Could not understand audio [{language}]")
        return STTResponse(
            transcript="", language=language, success=False,
            error="Could not understand audio. Please speak clearly."
        )
    except sr.RequestError as e:
        logger.error(f"STT API error: {e}")
        return STTResponse(
            transcript="", language=language, success=False,
            error="Speech recognition service unavailable. Please try again."
        )
    except Exception as e:
        logger.error(f"STT processing error: {e}")
        return STTResponse(
            transcript="", language=language, success=False,
            error="Failed to process audio. Please try again."
        )
