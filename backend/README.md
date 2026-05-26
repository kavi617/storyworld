# Tamil NPC Voice Chat - Backend

Simple voice chat system for historical Tamil NPCs in your 3D game.

## Architecture

**Super Simple Pipeline:**
```
Player speaks → Whisper STT → GPT-4 (with personality) → Edge TTS → Audio plays
```

**No ChromaDB, No RAG, No Multi-Agent - Just clean AI voice chat!**

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Set up Environment Variables
Create a `.env` file (or use `.env.example` as template):
```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_CHAT_MODEL=gpt-4o-mini
WHISPER_MODEL=tiny
```

### 3. Run the Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📁 Directory Structure

```
backend/
├── main.py                      # FastAPI server (2 endpoints only)
├── .env                         # Your API keys (create this)
├── requirements.txt             # Python dependencies
├── README.md                    # This file
│
├── npc_personalities/           # NPC personality files
│   └── raja_raja_cholan.md     # Raja Raja Cholan personality
│
├── services/                    # Core services
│   ├── npc_voice_pipeline.py   # STT → GPT → TTS pipeline
│   ├── stt_whisper.py          # Whisper STT
│   └── config.py               # Configuration
│
└── npc/audio/responses/         # Audio responses (auto-created)
```

## 🎯 API Endpoints

### `POST /npc/voice-chat`
**Request:** Audio file  
**Response:**
```json
{
  "player_text": "What player said",
  "npc_text": "NPC Tamil response",
  "audio_url": "/audio-responses/xxx.wav"
}
```

### `POST /tts`
**Request:** `{"text": "வணக்கம்"}`  
**Response:** WAV audio bytes

## 🧑‍🎤 NPC Personalities

Add NPCs by creating `.md` files in `npc_personalities/`:
- Define personality, tone, historical facts
- System auto-loads based on character name

## 💰 Cost

- **Whisper**: FREE (local)
- **Edge TTS**: FREE (unlimited)
- **GPT-4o-mini**: ~$0.00015/request
- **Total**: Essentially FREE!

## 🔧 Tech Stack

- FastAPI + OpenAI GPT-4o-mini
- Whisper (tiny) + Edge TTS (Tamil)
- imageio-ffmpeg for audio
