"""
NPC Voice Pipeline — Simple STT → ChatGPT → TTS
======================================
Pipeline: Audio → Whisper STT → GPT-4 (with personality) → Edge TTS (Tamil) → Audio

Simple architecture:
  ✅ Whisper STT for Tamil voice recognition
  ✅ GPT-4 with NPC personality file
  ✅ Edge TTS for Tamil voice output (ta-IN-ValluvarNeural)
  ✅ NO ChromaDB, NO multi-agent, NO complexity

Install:
    pip install edge-tts openai-whisper openai
"""

import asyncio
import os
import tempfile
import edge_tts
from pathlib import Path
from openai import AsyncOpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ── Config ────────────────────────────────────────────────────────────────────

OPENAI_API_KEY  = os.getenv("OPENAI_API_KEY")
CHAT_MODEL      = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")

# Tamil male voice — "Valluvar" (named after the Tamil poet-saint Thiruvalluvar)
TAMIL_VOICE     = "ta-IN-ValluvarNeural"

# Rate and pitch for a regal, slow, deep tone
VOICE_RATE      = "-20%"   # Slower = more regal
VOICE_PITCH     = "-15Hz"  # Lower pitch = deeper voice

# NPC Personalities directory
NPC_PERSONALITIES_DIR = Path(__file__).parent.parent / "npc_personalities"

# ── Load NPC Personality ──────────────────────────────────────────────────────

def load_npc_personality(character_name: str) -> str:
    """Load NPC personality from markdown file."""
    # Convert name to filename (e.g., "Raja Raja Cholan" -> "raja_raja_cholan.md")
    filename = character_name.lower().replace(" ", "_") + ".md"
    personality_file = NPC_PERSONALITIES_DIR / filename
    
    if not personality_file.exists():
        # Fallback personality
        return f"""You are {character_name}.
Speak ONLY in Tamil. NO English words.
Be helpful and answer questions about Tamil history.
Keep responses SHORT (2-4 sentences max)."""
    
    # Read the personality file
    with open(personality_file, 'r', encoding='utf-8') as f:
        return f.read()

# ── Whisper STT ───────────────────────────────────────────────────────────────

def transcribe_audio(audio_data: bytes, filename: str) -> str:
    """Convert audio bytes → text using Whisper."""
    import whisper

    # Write to temp file
    ext = Path(filename).suffix or ".webm"
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(audio_data)
        tmp_path = tmp.name

    try:
        model = _get_whisper_model()
        result = model.transcribe(
            tmp_path,
            language=None,       # auto-detect Tamil/English
            task="transcribe",
            fp16=False,
        )
        return result["text"].strip()
    finally:
        Path(tmp_path).unlink(missing_ok=True)


# Singleton Whisper model — load once, reuse
_whisper_model = None

def _get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        import whisper
        model_name = os.getenv("WHISPER_MODEL", "base")
        print(f"[STT] Loading Whisper '{model_name}' model...")
        _whisper_model = whisper.load_model(model_name)
        print(f"[STT] Whisper loaded ✅")
    return _whisper_model


# ── GPT-4 response ────────────────────────────────────────────────────────────

async def get_npc_response(player_text: str, character_name: str = "Raja Raja Cholan") -> str:
    """Send player text to GPT-4, get NPC's Tamil reply with personality."""
    
    # Verify API key is set
    if not OPENAI_API_KEY:
        raise RuntimeError(
            "OPENAI_API_KEY not found! "
            "Please create a .env file with your OpenAI API key: "
            "OPENAI_API_KEY=sk-..."
        )
    
    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    
    # Load character personality from file
    system_prompt = load_npc_personality(character_name)
    
    print(f"[AI] Using personality: {character_name}")

    response = await client.chat.completions.create(
        model=CHAT_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": player_text},
        ],
        max_tokens=200,  # Detailed responses (3-5 sentences)
        temperature=0.8,  # Natural and creative
    )
    return response.choices[0].message.content.strip()


# ── Edge TTS ──────────────────────────────────────────────────────────────────

def clean_text_for_tts(text: str) -> str:
    """Remove markdown formatting, links, and special chars for TTS."""
    import re
    
    # Remove URLs and link references
    text = re.sub(r'https?://\S+', '', text)
    text = re.sub(r'\[.*?\]\(.*?\)', '', text)  # Markdown links
    text = re.sub(r'www\.\S+', '', text)  # www links without http
    
    # Remove markdown formatting
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)  # Bold
    text = re.sub(r'\*(.+?)\*', r'\1', text)      # Italic
    text = re.sub(r'__(.+?)__', r'\1', text)      # Bold alt
    text = re.sub(r'_(.+?)_', r'\1', text)        # Italic alt
    
    # Remove "Learn more:" sections and everything after
    text = re.sub(r'\*\*Learn more:?\*\*.*', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'Learn more:?.*', '', text, flags=re.DOTALL | re.IGNORECASE)
    
    # Remove meta-commentary in Tamil/English
    text = re.sub(r'retrieved context.*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'context-ல்.*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'தகவல்.*இல்லை.*', '', text, flags=re.IGNORECASE)
    
    # Remove any remaining English sentences (heuristic: sequences of Latin characters)
    text = re.sub(r'[A-Za-z]{3,}[A-Za-z\s,:;.!?()-]*[A-Za-z]{2,}', '', text)
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    
    return text


async def text_to_speech_tamil(text: str) -> bytes:
    """Convert Tamil text → WAV audio bytes using Edge TTS."""
    communicate = edge_tts.Communicate(
        text,
        TAMIL_VOICE,
        rate=VOICE_RATE,
        pitch=VOICE_PITCH,
    )

    audio_chunks = []
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_chunks.append(chunk["data"])

    if not audio_chunks:
        raise RuntimeError("Edge TTS returned no audio")

    return b"".join(audio_chunks)


# ── Main pipeline ─────────────────────────────────────────────────────────────

async def process_voice_chat(
    audio_data: bytes,
    filename: str,
    character_name: str = "Raja Raja Cholan",
) -> dict:
    """
    Full pipeline:
        audio bytes → STT → GPT-4 → Edge TTS → audio bytes

    Returns:
        {
            "player_text": "what the player said",
            "npc_text":    "Tamil response from Raja",
            "audio_bytes": b"...mp3/wav bytes...",
        }
    """
    # Step 1: Speech → Text (Whisper)
    print(f"[Pipeline] Step 1: Transcribing audio ({len(audio_data)} bytes)...")
    player_text = transcribe_audio(audio_data, filename)

    if not player_text:
        raise ValueError("No speech detected. Please speak clearly.")

    print(f"[Pipeline] Player said: {player_text}")

    # Step 2: Text → Tamil AI response (GPT-4)
    print(f"[Pipeline] Step 2: Generating {character_name} response...")
    npc_text_raw = await get_npc_response(player_text, character_name)
    print(f"[Pipeline] NPC says: {npc_text_raw[:100]}...")

    # Clean text for display (remove markdown but keep formatting info)
    npc_text_display = npc_text_raw
    
    # Extract clean text for TTS (remove markdown and links)
    npc_text_for_tts = clean_text_for_tts(npc_text_raw)
    print(f"[Pipeline] TTS text (cleaned): {npc_text_for_tts[:100]}...")

    # Step 3: Tamil text → Speech (Edge TTS)
    print(f"[Pipeline] Step 3: Generating Tamil voice...")
    audio_bytes = await text_to_speech_tamil(npc_text_for_tts)
    print(f"[Pipeline] Audio generated: {len(audio_bytes)} bytes ✅")

    return {
        "player_text": player_text,
        "npc_text":    npc_text_display,
        "audio_bytes": audio_bytes,
    }