# 🎤 Voice System Quick Reference

## ⚡ Super Quick Start

```bash
# 1. Install (one time)
.\install_voice_system.bat

# 2. Start backend
cd backend
uvicorn main:app --reload

# 3. Open game in browser
# 4. Hold V key near NPC to talk
```

---

## 📡 API Endpoints

### POST /stt (NEW! ✅)
**Convert speech to text**

```bash
curl -X POST http://localhost:8000/stt \
  -F "audio=@recording.wav"
```

Response:
```json
{"text": "வணக்கம் இராஜராஜ சோழன்"}
```

### POST /chat (Existing ✅)
**Get AI response**

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "வணக்கம்", "response_language": "ta"}'
```

### POST /npc/intro (Existing ✅)
**Get NPC intro audio**

```bash
curl -X POST http://localhost:8000/npc/intro \
  -o intro.mp3
```

---

## 🎮 Player Controls

| Key | Action | When |
|-----|--------|------|
| **E** | Play intro | Near NPC (once) |
| **V** | Talk (hold) | Near NPC (anytime) |
| **WASD** | Move | Always |
| **Shift** | Run | While moving |
| **Mouse** | Look around | Always |

---

## 🔄 Voice Conversation Flow

```
1. Player holds V key
   ↓
2. Mic records audio
   ↓
3. Release V → sends to /stt
   ↓
4. Whisper transcribes (1-2s)
   ↓
5. Text sent to /chat
   ↓
6. AI generates response
   ↓
7. Response → TTS (next step)
   ↓
8. Audio plays
```

---

## 🧪 Testing Commands

```bash
# Health check
curl http://localhost:8000/health

# Test STT
python backend/test_stt.py test_audio.wav

# Test with curl
curl -X POST http://localhost:8000/stt \
  -F "audio=@test.wav" \
  | jq '.text'
```

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| Mic not working | Check browser permissions |
| "No speech detected" | Speak louder, reduce noise |
| Slow transcription | Use `tiny` model or GPU |
| CORS error | Backend already configured ✅ |
| 503 error | Reinstall: `pip install openai-whisper` |

---

## 📁 Files Added

```
✅ backend/services/stt_whisper.py
✅ backend/test_stt.py
✅ backend/requirements.txt (updated)
✅ npc_voice_conversation.js
✅ STT_IMPLEMENTATION_SUMMARY.md
✅ VOICE_SYSTEM_SETUP.md
✅ backend/STT_INTEGRATION_GUIDE.md
```

---

## ⚙️ Configuration

### Change Model Speed

Edit `backend/services/stt_whisper.py`:
```python
model_name = "tiny"   # Fastest (0.5s)
model_name = "base"   # Balanced (1-2s) ✅ DEFAULT
model_name = "small"  # Better quality (2-4s)
```

### Change Language

```python
# Auto-detect (default) ✅
transcribe_audio(file, language=None)

# Force Tamil
transcribe_audio(file, language='ta')

# Force English
transcribe_audio(file, language='en')
```

---

## 📊 Performance

| Model | Size | Speed (CPU) | Tamil |
|-------|------|-------------|-------|
| tiny  | 39MB | 0.5-1s | ⚠️ Limited |
| base  | 74MB | 1-2s | ✅ Good |
| small | 244MB | 2-4s | ✅ Better |

**Recommended:** `base` (default)

---

## ✅ What Works Now

- ✅ Voice recording (V key)
- ✅ Speech-to-text (Whisper)
- ✅ Tamil + English detection
- ✅ AI chat responses
- ✅ NPC intro audio (E key)
- ⏳ TTS response (next step)

---

## 🎯 Next: TTS Integration

**What's needed:**
1. Create `/tts` endpoint
2. Use Sarvam AI (test_api.py)
3. Return MP3 to frontend
4. Play NPC voice response

**Code exists:** `test_api.py` has working Sarvam TTS

---

## 📞 Help

- **Full setup:** `VOICE_SYSTEM_SETUP.md`
- **API docs:** `backend/STT_INTEGRATION_GUIDE.md`
- **Summary:** `STT_IMPLEMENTATION_SUMMARY.md`
- **Test:** `python backend/test_stt.py`

---

## 🚀 Ready!

```bash
uvicorn main:app --reload
```

Then hold **V** near NPC and speak! 🎤
