"""
Speech-to-Text service using OpenAI Whisper (base model).

Optimized for real-time Tamil/English speech recognition in gameplay.
Uses base model for balanced speed + accuracy.
"""

import os
import sys
import logging
import shutil
import subprocess
from pathlib import Path
from typing import Optional

# ===== CRITICAL: Set up FFmpeg BEFORE importing whisper =====
# This must happen at module import time, before whisper tries to use ffmpeg
try:
    import imageio_ffmpeg
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    ffmpeg_dir = Path(ffmpeg_exe).parent
    
    # Add to PATH permanently for this process
    ffmpeg_dir_str = str(ffmpeg_dir)
    if ffmpeg_dir_str not in os.environ.get("PATH", ""):
        os.environ["PATH"] = ffmpeg_dir_str + os.pathsep + os.environ.get("PATH", "")
        print(f"✅ Added FFmpeg to PATH: {ffmpeg_dir_str}")
    
    # Set environment variable for subprocess calls
    os.environ["FFMPEG_PATH"] = str(ffmpeg_exe)
    
    # Test that ffmpeg works
    try:
        result = subprocess.run([str(ffmpeg_exe), "-version"], 
                              capture_output=True, timeout=5, check=True)
        print(f"✅ FFmpeg test successful: {ffmpeg_exe}")
    except Exception as e:
        print(f"⚠️ FFmpeg test failed: {e}")
        
except ImportError:
    print("⚠️  imageio-ffmpeg not installed - install with: pip install imageio-ffmpeg")

logger = logging.getLogger(__name__)

# Global model instance (loaded once at startup)
_whisper_model = None
_model_loaded = False


def get_whisper_model():
    """
    Load Whisper model (singleton pattern).
    Uses tiny model by default for fastest gameplay performance.
    """
    global _whisper_model, _model_loaded
    
    if _model_loaded:
        return _whisper_model
    
    try:
        import whisper
        
        # Verify FFmpeg is accessible
        import shutil
        ffmpeg_cmd = shutil.which("ffmpeg")
        if not ffmpeg_cmd:
            # Try to get bundled version
            try:
                import imageio_ffmpeg
                ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
                logger.warning(f"FFmpeg not in PATH, but found bundled: {ffmpeg_exe}")
            except:
                raise RuntimeError(
                    "FFmpeg not found! Install via pip:\n"
                    "  pip install imageio-ffmpeg\n"
                    "This includes FFmpeg binaries (no external install needed!)"
                )
        else:
            logger.info(f"✅ FFmpeg found in PATH: {ffmpeg_cmd}")
        
        # Load model from environment variable
        # Options: tiny (fastest), base, small, medium, large
        # tiny = ~39MB, ~0.5-1s, good for gameplay
        # base = ~74MB, ~1-2s, better accuracy
        model_name = os.getenv("OPENAI_WHISPER_MODEL", "tiny")
        
        logger.info(f"Loading Whisper model: {model_name}")
        _whisper_model = whisper.load_model(model_name)
        _model_loaded = True
        
        logger.info(f"✅ Whisper model '{model_name}' loaded successfully")
        return _whisper_model
        
    except ImportError:
        logger.error("❌ openai-whisper not installed. Run: pip install openai-whisper")
        raise RuntimeError(
            "Whisper not installed. Install with: pip install openai-whisper"
        )
    except Exception as e:
        logger.error(f"❌ Failed to load Whisper model: {e}")
        raise


def transcribe_audio(audio_file_path: str, language: Optional[str] = None) -> str:
    """
    Transcribe audio file to text using Whisper.
    
    Args:
        audio_file_path: Path to audio file (wav, mp3, webm, etc.)
        language: Optional language code ('ta' for Tamil, 'en' for English)
                 If None, auto-detects language
    
    Returns:
        str: Transcribed text (cleaned, no timestamps or metadata)
    
    Raises:
        FileNotFoundError: If audio file doesn't exist
        RuntimeError: If transcription fails
    """
    if not os.path.exists(audio_file_path):
        raise FileNotFoundError(f"Audio file not found: {audio_file_path}")
    
    # Verify file is not empty
    file_size = os.path.getsize(audio_file_path)
    if file_size == 0:
        raise ValueError(f"Audio file is empty: {audio_file_path}")
    
    logger.info(f"📁 Transcribing file: {audio_file_path} ({file_size} bytes)")
    if language:
        logger.info(f"🌍 Forcing language: {language}")
    else:
        logger.info(f"🌍 Auto-detecting language")
    
    try:
        model = get_whisper_model()
        
        # Transcribe with optimizations
        # Note: whisper.load_audio() is called internally by transcribe()
        # and uses ffmpeg which we've added to PATH at module import time
        
        import time
        start_time = time.time()
        
        result = model.transcribe(
            audio_file_path,
            language=language,  # None = auto-detect, 'ta' = Tamil, 'en' = English
            fp16=False,  # CPU-compatible
            verbose=False,  # Suppress logs
            task="transcribe",  # transcribe (not translate)
            # Performance optimizations
            beam_size=1,  # Faster inference (default is 5)
            best_of=1,  # Faster inference (default is 5)
            temperature=0,  # Greedy decoding (faster, more deterministic)
        )
        
        elapsed = time.time() - start_time
        logger.info(f"⚡ Transcription took {elapsed:.2f} seconds")
        
        # Extract clean text only (no timestamps, no metadata)
        text = result["text"].strip()
        
        detected_lang = result.get("language", "unknown")
        if language and detected_lang != language:
            logger.warning(f"⚠️  Requested {language} but detected {detected_lang}")
        
        logger.info(f"🎤 Transcribed ({detected_lang}): {text[:100]}...")
        
        return text
        
    except Exception as e:
        logger.error(f"❌ Whisper transcription failed: {e}")
        logger.error(f"   File: {audio_file_path}")
        logger.error(f"   Size: {os.path.getsize(audio_file_path) if os.path.exists(audio_file_path) else 'FILE NOT FOUND'}")
        
        # Check if ffmpeg is the issue
        import shutil
        ffmpeg_found = shutil.which("ffmpeg")
        logger.error(f"   FFmpeg in PATH: {ffmpeg_found or 'NOT FOUND'}")
        
        try:
            import imageio_ffmpeg
            bundled_ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
            logger.error(f"   Bundled FFmpeg: {bundled_ffmpeg}")
        except:
            logger.error(f"   Bundled FFmpeg: NOT INSTALLED")
        
        raise RuntimeError(f"Transcription failed: {str(e)}")


def transcribe_audio_fast(audio_file_path: str) -> str:
    """
    Fast transcription optimized for Tamil/English NPC interaction.
    
    Prioritizes Tamil language detection for Raja Raja Cholan conversations.
    Falls back to auto-detect if Tamil transcription is empty.
    
    Optimized for real-time gameplay interaction.
    """
    # Try Tamil first (most likely for Raja Raja Cholan)
    try:
        text_tamil = transcribe_audio(audio_file_path, language='ta')
        if text_tamil and len(text_tamil.strip()) > 0:
            logger.info(f"✅ Tamil transcription successful: {text_tamil[:50]}...")
            return text_tamil
    except Exception as e:
        logger.warning(f"Tamil transcription failed, trying auto-detect: {e}")
    
    # Fallback: auto-detect (may detect English or other languages)
    return transcribe_audio(audio_file_path, language=None)


def cleanup_temp_audio(file_path: str):
    """Delete temporary audio file after processing."""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.debug(f"🗑️ Cleaned up temp audio: {file_path}")
    except Exception as e:
        logger.warning(f"Failed to delete temp audio file: {e}")


# Optional: Preload model at module import (can be disabled)
def preload_model():
    """
    Preload Whisper model to avoid first-request delay.
    Call this during app startup if you want instant first transcription.
    """
    try:
        get_whisper_model()
    except Exception as e:
        logger.warning(f"Whisper model preload failed (will load on first request): {e}")


# Uncomment to preload model at import time
# preload_model()
