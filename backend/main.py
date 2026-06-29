"""
Tamil History NPC Voice Chat - FastAPI Backend

Simple architecture:
  - Whisper STT for voice recognition
  - GPT-4 with NPC personality files  
  - Edge TTS for Tamil voice output
  
No ChromaDB, no RAG, no multi-agent - just clean STT → AI → TTS

Run: uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import uuid
import os
from dotenv import load_dotenv

from pydantic import BaseModel
from services.npc_voice_pipeline import process_voice_chat, text_to_speech_tamil, clean_text_for_tts

# Map character IDs to intro audio filenames
NPC_INTRO_MAP = {
    "senguttuvan_cheran": "senguttuvan_chera.mp3",
    "aditya_chola": "aditya_chola_i.mp3",
    "nedunjeliyan_1": "nedunjeliyan_i.mp3",
    "raja_raja_cholan": "rajaraja_chola_i.mp3",
    "kulasekara_pandya": "kulasekara_pandya_i.mp3",
    "cheraman_perumal": "cheraman_perumal.mp3",
    "karikala_cholan": "karikala_chozhan.mp3",
    "uthiyan_cheralathan": "uthiyan_cheralathan.mp3",
    "ariyan_nedunjeliyan_2": "ariyan_nedunjeliyan_ii.mp3",
}

# Load environment variables from .env file
load_dotenv()

# Verify API key is loaded
if not os.getenv("OPENAI_API_KEY"):
    print("⚠️ WARNING: OPENAI_API_KEY not found in environment variables!")
    print("   Make sure you have a .env file with OPENAI_API_KEY set.")
else:
    print(f"✅ OpenAI API Key loaded (starts with: {os.getenv('OPENAI_API_KEY')[:20]}...)")

# FastAPI app
app = FastAPI(
    title="Tamil NPC Voice Chat",
    description="Simple voice chat with historical NPCs",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories for audio responses
AUDIO_RESPONSES_DIR = Path("npc/audio/responses")
AUDIO_RESPONSES_DIR.mkdir(parents=True, exist_ok=True)

# NPC intro audio directory
NPC_AUDIO_DIR = Path("npc/audio")

# Mount static files for audio responses
app.mount("/audio-responses", StaticFiles(directory=str(AUDIO_RESPONSES_DIR)), name="audio-responses")
# Mount NPC intro audio files
app.mount("/npc-audio", StaticFiles(directory=str(NPC_AUDIO_DIR)), name="npc-audio")


@app.get("/")
async def root():
    return {
        "message": "Tamil NPC Voice Chat Backend - Running ✅",
        "architecture": "STT → GPT-4 (personality) → TTS",
        "endpoints": {
            "/npc/intro": "Get NPC intro audio",
            "/npc/voice-chat": "Complete voice chat pipeline (audio → audio)",
            "/chat": "Text chat with NPC (text → text)",
            "/tts": "Text to speech only (text → audio)"
        }
    }


# ==================== NPC INTRO ====================

class IntroRequest(BaseModel):
    npc_name: str = "raja_raja_cholan"

@app.post("/npc/intro")
async def npc_intro(request: IntroRequest):
    """
    Serve NPC introduction audio (MP3) based on npc_name.
    
    Returns pre-recorded Tamil intro audio as MP3 file.
    """
    intro_file = NPC_INTRO_MAP.get(request.npc_name)
    if not intro_file:
        raise HTTPException(
            status_code=404,
            detail=f"No intro mapping for NPC: {request.npc_name}"
        )
    
    audio_file = NPC_AUDIO_DIR / intro_file
    
    if not audio_file.exists():
        raise HTTPException(
            status_code=404,
            detail=f"NPC intro audio not found for {request.npc_name} at {audio_file}"
        )
    
    return FileResponse(
        path=str(audio_file),
        media_type="audio/mpeg",
        filename=intro_file
    )


# ==================== NPC VOICE CHAT ====================

@app.post("/npc/voice-chat")
async def npc_voice_chat(audio: UploadFile = File(...)):
    """
    Complete voice chat with NPC.
    
    Pipeline: Audio → Whisper STT → GPT-4 (with personality) → Edge TTS → Audio
    
    Input: Voice recording (wav, mp3, webm, m4a, ogg)
    Output: JSON with transcribed text, NPC response, and audio URL
    
    Returns:
        {
            "player_text": "What player said",
            "npc_text": "NPC's Tamil response", 
            "audio_url": "/audio-responses/npc_response_xxx.mp3"
        }
    """
    try:
        # Validate file type
        if not audio.content_type or not audio.content_type.startswith("audio/"):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Expected audio, got: {audio.content_type}"
            )
        
        # Read audio data
        audio_data = await audio.read()
        
        if not audio_data:
            raise HTTPException(
                status_code=400,
                detail="Empty audio file"
            )
        
        print(f"[Voice Chat] Processing {len(audio_data)} bytes of audio...")
        
        # Process: STT → GPT-4 → TTS
        result = await process_voice_chat(
            audio_data=audio_data,
            filename=audio.filename or "recording.webm",
            character_name="Raja Raja Cholan"
        )
        
        # Save audio response
        audio_filename = f"npc_response_{uuid.uuid4().hex[:8]}.wav"
        audio_path = AUDIO_RESPONSES_DIR / audio_filename
        
        with open(audio_path, "wb") as f:
            f.write(result["audio_bytes"])
        
        print(f"✅ Voice chat complete!")
        print(f"   Player: {result['player_text'][:80]}")
        print(f"   NPC: {result['npc_text'][:80]}")
        print(f"   Audio: {audio_filename} ({len(result['audio_bytes'])} bytes)")
        
        return {
            "player_text": result["player_text"],
            "npc_text": result["npc_text"],
            "audio_url": f"/audio-responses/{audio_filename}"
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=f"Service unavailable: {str(e)}")
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== TEXT CHAT (for Web Speech API) ====================

class ChatRequest(BaseModel):
    message: str
    response_language: str = "ta"
    npc_name: str = "raja_raja_cholan"

@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Text-only chat with NPC (no voice processing).
    
    Used by Web Speech API frontend:
    - Frontend does STT (Web Speech API)
    - This endpoint returns AI text response
    - Frontend does TTS via /tts endpoint
    
    Input: {"message": "player text", "response_language": "ta", "npc_name": "raja_raja_cholan"}
    Output: {"response": "NPC Tamil response"}
    """
    try:
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        print(f"[Chat] Player: {request.message[:100]}")
        
        # Map npc_name to display name for personality lookup
        NPC_DISPLAY_MAP = {
            "senguttuvan_cheran": "Senguttuvan Chera",
            "aditya_chola": "Aditya Chola I",
            "nedunjeliyan_1": "Nedunjeliyan I",
            "raja_raja_cholan": "Raja Raja Cholan",
            "kulasekara_pandya": "Kulasekara Pandya I",
            "cheraman_perumal": "Cheraman Perumal",
            "karikala_cholan": "Karikala Cholan",
            "uthiyan_cheralathan": "Uthiyan Cheralathan",
            "ariyan_nedunjeliyan_2": "Ariyan Nedunjeliyan II",
        }
        character_name = NPC_DISPLAY_MAP.get(request.npc_name, "Raja Raja Cholan")
        
        # Import NPC response function
        from services.npc_voice_pipeline import get_npc_response
        
        # Get AI response using NPC personality
        npc_response = await get_npc_response(
            player_text=request.message,
            character_name=character_name
        )
        
        print(f"[Chat] NPC ({character_name}): {npc_response[:100]}")
        
        return {"response": npc_response}
    
    except Exception as e:
        print(f"❌ Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== TEXT-TO-SPEECH ====================

class TTSRequest(BaseModel):
    text: str

@app.post("/tts")
async def text_to_speech_endpoint(request: TTSRequest):
    """
    Convert text to Tamil speech using Edge TTS.
    
    Used by Web Speech API frontend for TTS fallback.
    
    Input: {"text": "வணக்கம்"}
    Output: WAV audio bytes
    Voice: ta-IN-ValluvarNeural (Tamil male)
    """
    try:
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Clean text (remove markdown, links, English)
        cleaned_text = clean_text_for_tts(request.text)
        
        if not cleaned_text:
            raise HTTPException(status_code=400, detail="No valid text after cleaning")
        
        print(f"🔊 TTS: {cleaned_text[:100]}...")
        
        # Generate audio
        audio_bytes = await text_to_speech_tamil(cleaned_text)
        
        print(f"✅ TTS: {len(audio_bytes)} bytes")
        
        return Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={
                "Content-Disposition": "inline",
                "Cache-Control": "no-cache"
            }
        )
    
    except Exception as e:
        print(f"❌ TTS error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
