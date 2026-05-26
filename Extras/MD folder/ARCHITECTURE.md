# 🏗️ NPC Voice Chat System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         PLAYER (Frontend)                       │
│                                                                 │
│  ┌──────────────┐                                              │
│  │   3D Game    │                                              │
│  │  (Three.js)  │                                              │
│  │              │                                              │
│  │  - Walk near │                                              │
│  │    NPC       │                                              │
│  │  - Hold V    │──────┐                                       │
│  │  - Record    │      │                                       │
│  │    audio     │      │                                       │
│  └──────────────┘      │                                       │
└────────────────────────┼───────────────────────────────────────┘
                         │
                         │ Audio Blob (webm)
                         │ MediaRecorder API
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                            │
│                                                                 │
│  POST /npc/voice-chat                                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                   UNIFIED PIPELINE                        │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  STEP 1: Speech-to-Text (Whisper)                  │ │ │
│  │  │  ────────────────────────────────────────────────   │ │ │
│  │  │  • Model: base (~74MB)                             │ │ │
│  │  │  • Auto-detect: Tamil / English                    │ │ │
│  │  │  • Time: 1-2 seconds                               │ │ │
│  │  │  • Output: "வணக்கம் இராஜராஜ சோழன்"                │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                         │                                 │ │
│  │                         ▼                                 │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  STEP 2: AI Response Pipeline                      │ │ │
│  │  │  ────────────────────────────────────────────────   │ │ │
│  │  │  ┌──────────────────────────────────────────────┐  │ │ │
│  │  │  │  Root Agent (Orchestration)                  │  │ │ │
│  │  │  └──────────────────────────────────────────────┘  │ │ │
│  │  │                    │                                │ │ │
│  │  │  ┌─────────────────┴─────────────────┐             │ │ │
│  │  │  │                                   │             │ │ │
│  │  │  ▼                                   ▼             │ │ │
│  │  │  ┌──────────────────┐  ┌──────────────────────┐   │ │ │
│  │  │  │  RAG Retrieval   │  │  Intent Classifier   │   │ │ │
│  │  │  │  (ChromaDB)      │  │  (fact/char/story)   │   │ │ │
│  │  │  └──────────────────┘  └──────────────────────┘   │ │ │
│  │  │                    │                                │ │ │
│  │  │  ┌─────────────────┴─────────────────┐             │ │ │
│  │  │  │                                   │             │ │ │
│  │  │  ▼                                   ▼             │ │ │
│  │  │  ┌──────────────────┐  ┌──────────────────────┐   │ │ │
│  │  │  │ Historian Agent  │  │  Character Agent     │   │ │ │
│  │  │  │ (Facts/Context)  │  │  (Raja personality)  │   │ │ │
│  │  │  └──────────────────┘  └──────────────────────┘   │ │ │
│  │  │                    │                                │ │ │
│  │  │                    ▼                                │ │ │
│  │  │  ┌──────────────────────────────────────────────┐  │ │ │
│  │  │  │  Validation Agent (Quality check)           │  │ │ │
│  │  │  └──────────────────────────────────────────────┘  │ │ │
│  │  │                    │                                │ │ │
│  │  │                    ▼                                │ │ │
│  │  │  ┌──────────────────────────────────────────────┐  │ │ │
│  │  │  │  Response Composer (Merge outputs)          │  │ │ │
│  │  │  └──────────────────────────────────────────────┘  │ │ │
│  │  │                                                     │ │ │
│  │  │  • Time: 0.5-1 second                              │ │ │
│  │  │  • Language: Tamil (ta)                            │ │ │
│  │  │  • Output: "வணக்கம்! நான் ராஜ ராஜ சோழன்..."       │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                         │                                 │ │
│  │                         ▼                                 │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  STEP 3: Text-to-Speech (Sarvam AI Bulbul v3)     │ │ │
│  │  │  ────────────────────────────────────────────────   │ │ │
│  │  │  • Speaker: vijay (Tamil male)                     │ │ │
│  │  │  • Model: Bulbul v3                                │ │ │
│  │  │  • Language: ta-IN                                 │ │ │
│  │  │  • Codec: MP3                                      │ │ │
│  │  │  • Time: 0.5-1 second (streaming)                  │ │ │
│  │  │  • Output: MP3 audio bytes                         │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────┘ │
│                         │                                       │
│  Total Time: < 3 seconds                                       │
└─────────────────────────┼───────────────────────────────────────┘
                         │
                         │ MP3 Audio
                         │ Content-Type: audio/mpeg
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                         PLAYER (Frontend)                       │
│                                                                 │
│  ┌──────────────┐                                              │
│  │  Audio API   │                                              │
│  │              │                                              │
│  │  - Receive   │                                              │
│  │    MP3       │                                              │
│  │  - Play      │◄─────┘                                       │
│  │    audio     │                                              │
│  │  - NPC       │                                              │
│  │    speaks!   │                                              │
│  └──────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
┌─────────┐     audio/webm      ┌─────────┐
│ Player  │ ───────────────────► │ Backend │
│         │                      │         │
│ (V key) │                      │  /npc/  │
│         │                      │  voice- │
│         │                      │  chat   │
│         │                      │         │
│         │     audio/mpeg       │         │
│         │ ◄─────────────────── │         │
│ (Auto   │                      │         │
│  play)  │                      │         │
└─────────┘                      └─────────┘
```

---

## File Dependencies

```
┌────────────────────────────────────────────────────┐
│              Frontend                              │
│  ┌──────────────────────────────────────────────┐  │
│  │  npc_voice_conversation.js                   │  │
│  │                                              │  │
│  │  - initVoiceSystem()                         │  │
│  │  - startVoiceRecording()                     │  │
│  │  - stopVoiceRecording()                      │  │
│  │  - processVoiceRecording()                   │  │
│  │  - sendToNPCVoiceChat()         ◄────────────┼──┐
│  │  - playNPCAudioResponse()                    │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
                                                     │
                                                     │
┌────────────────────────────────────────────────────┼──┐
│              Backend                               │  │
│  ┌──────────────────────────────────────────────┐ │  │
│  │  main.py                                     │ │  │
│  │                                              │ │  │
│  │  POST /npc/voice-chat  ◄──────────────────────┘  │
│  │     │                                            │
│  │     └──► process_voice_chat()                    │
│  └──────────────────────────────────────────────┘   │
│                        │                             │
│                        ▼                             │
│  ┌──────────────────────────────────────────────┐   │
│  │  services/npc_voice_pipeline.py              │   │
│  │                                              │   │
│  │  - process_voice_chat()                      │   │
│  │  - full_voice_pipeline()                     │   │
│  │     │                                        │   │
│  │     ├──► transcribe_audio()                  │   │
│  │     │       └──► stt_whisper.py              │   │
│  │     │                                        │   │
│  │     ├──► get_ai_response()                   │   │
│  │     │       └──► pipeline.py                 │   │
│  │     │              └──► agents/*.py           │   │
│  │     │                                        │   │
│  │     └──► text_to_speech()                    │   │
│  │              └──► SarvamAI client            │   │
│  └──────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

---

## Performance Breakdown

```
┌──────────────────────────────────────────────────┐
│  Total Response Time: < 3 seconds (target)       │
└──────────────────────────────────────────────────┘
        │
        ├─► Network Upload (audio)
        │   └─ ~100-500ms (depends on audio size)
        │
        ├─► Whisper STT
        │   └─ 1-2 seconds (base model)
        │       ├─ tiny: 0.5s (faster, less accurate)
        │       ├─ base: 1-2s (balanced) ✅
        │       └─ small: 2-4s (slower, more accurate)
        │
        ├─► AI Pipeline
        │   └─ 0.5-1 second (with cached context)
        │       ├─ Root agent: ~50ms
        │       ├─ RAG retrieval: ~100-200ms
        │       ├─ Character agent: ~200-300ms
        │       └─ Validation: ~100ms
        │
        ├─► Sarvam TTS
        │   └─ 0.5-1 second (streaming)
        │
        └─► Network Download (MP3)
            └─ ~100-300ms (depends on response length)
```

---

## Error Handling Flow

```
┌─────────────┐
│   Audio     │
│   Input     │
└──────┬──────┘
       │
       ▼
  ┌─────────┐
  │ Valid?  │─────No────► 400 Bad Request
  └─────┬───┘            "Invalid audio file"
        │
       Yes
        │
        ▼
  ┌──────────┐
  │ Whisper  │
  │   STT    │
  └─────┬────┘
        │
    ┌───┴────┐
   Fail    Success
    │         │
    ▼         ▼
  503       ┌──────────┐
  Service   │   AI     │
  Unavail.  │ Pipeline │
            └─────┬────┘
                  │
              ┌───┴────┐
             Fail    Success
              │         │
              ▼         ▼
            500      ┌──────┐
            Error    │ TTS  │
                     └──┬───┘
                        │
                    ┌───┴────┐
                   Fail    Success
                    │         │
                    ▼         ▼
                  503       200
                  Service   MP3
                  Unavail.  Audio
```

---

## Singleton Pattern (Performance Optimization)

```
┌────────────────────────────────────────────────┐
│        First Request                           │
│  ┌──────────────────────────────────────────┐  │
│  │  1. Load Whisper model (~74MB)           │  │
│  │  2. Initialize Sarvam client             │  │
│  │  3. Cache in memory                      │  │
│  └──────────────────────────────────────────┘  │
│  Time: ~2-3 seconds                            │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│        Subsequent Requests                     │
│  ┌──────────────────────────────────────────┐  │
│  │  1. Reuse cached Whisper model ✅        │  │
│  │  2. Reuse Sarvam client ✅               │  │
│  │  3. No initialization overhead           │  │
│  └──────────────────────────────────────────┘  │
│  Time: < 3 seconds                             │
└────────────────────────────────────────────────┘
```

---

## State Management

```
Frontend State:
  - isRecording: boolean
  - audioChunks: Blob[]
  - micStream: MediaStream
  - mediaRecorder: MediaRecorder

Backend State (Singleton):
  - _whisper_model: WhisperModel (cached)
  - _sarvam_client: SarvamAI (cached)

No Session State:
  ✅ Each request is independent
  ✅ Stateless architecture
  ✅ Scalable design
```

---

## Integration Points

```
┌────────────────────────────────────────────────┐
│  Existing Systems (Not Modified)               │
│                                                │
│  ✅ POST /chat          (text → text)          │
│  ✅ POST /stt           (audio → text)         │
│  ✅ POST /npc/intro     (static MP3)           │
│  ✅ AI Pipeline         (multi-agent)          │
│  ✅ RAG System          (ChromaDB)             │
│  ✅ Character Agents    (Raja Raja Cholan)     │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│  New System (Added)                            │
│                                                │
│  ✅ POST /npc/voice-chat  (audio → audio) NEW  │
│  ✅ npc_voice_pipeline.py (unified) NEW        │
│  ✅ Sarvam TTS integration NEW                 │
└────────────────────────────────────────────────┘
```

---

## Security Considerations

```
✅ CORS enabled (allow_origins="*")
✅ File type validation (audio/* only)
✅ File size limit (implicit via FastAPI)
✅ Timeout protection (30s max)
✅ Temp file cleanup (always)
✅ Error message sanitization

⚠️  TODO for Production:
    - Move Sarvam API key to .env
    - Add rate limiting
    - Add authentication
    - Restrict CORS origins
    - Add audio file size limit
    - Add logging/monitoring
```

---

## Scalability

```
Current Setup (Single Server):
  - Handles 1 request at a time efficiently
  - Whisper on CPU: ~1-2s
  - AI pipeline: ~0.5-1s
  - TTS: ~0.5-1s
  - Total: < 3s per request

Optimization Options:
  1. GPU Acceleration
     - Whisper on GPU: ~0.2-0.5s (4-10x faster)
     - Setup: pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
  
  2. Faster Whisper
     - Alternative: pip install faster-whisper
     - Speed: 2-4x faster than standard Whisper
  
  3. Caching
     - Cache common questions/responses
     - Redis for distributed cache
  
  4. Load Balancing
     - Multiple backend instances
     - Round-robin requests
  
  5. Async Processing
     - WebSocket for streaming
     - Partial results (STT complete, AI processing, etc.)
```

---

**Complete system architecture documented!** 🎉
