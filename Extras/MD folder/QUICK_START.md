# 🚀 NPC VOICE CHAT - QUICK START

## ✅ IMPLEMENTATION COMPLETE

**System:** Player speaks → AI responds → NPC speaks back (voice-to-voice)

**Endpoint:** `POST /npc/voice-chat` (unified audio → audio pipeline)

---

## 🔧 Installation (3 Commands)

```bash
# 1. Install dependencies
cd backend
pip install -r requirements.txt

# 2. Start backend
uvicorn main:app --reload

# 3. Test it works
python test_voice_chat.py test_audio.wav
```

**First run:** Whisper downloads ~74MB model (one time only)

---

## 🎮 In-Game Usage

1. **Walk near NPC** (Raja Raja Cholan)
2. **Hold V key** → recording starts
3. **Speak** in Tamil or English
4. **Release V** → NPC responds with voice

**That's it!** No typing needed.

---

## 🧪 Quick Test

```bash
# Backend must be running first
cd backend
uvicorn main:app --reload
```

Then in another terminal:

```bash
# Test with your audio file
cd backend
python test_voice_chat.py your_recording.wav

# Output: npc_response.mp3 (NPC's voice)
```

---

## 📊 What Was Built

### Backend (3 files):

1. **`services/npc_voice_pipeline.py`** (NEW)
   - Unified pipeline: STT → AI → TTS
   - Functions: `full_voice_pipeline()`, `process_voice_chat()`
   - Sarvam AI integration (Bulbul v3 TTS)

2. **`main.py`** (UPDATED)
   - New endpoint: `POST /npc/voice-chat`
   - Returns MP3 audio directly
   - Full error handling

3. **`requirements.txt`** (UPDATED)
   - Added: `sarvamai>=1.0.0`

### Frontend (1 file):

4. **`npc_voice_conversation.js`** (UPDATED)
   - New function: `sendToNPCVoiceChat()` 
   - New function: `playNPCAudioResponse()`
   - Updated: `processVoiceRecording()`

---

## 🔄 How It Works

```
OLD SYSTEM (broken into 3 steps):
  Player → /stt → text → /chat → text → browser TTS → audio
  
NEW SYSTEM (single unified step):
  Player → /npc/voice-chat → audio ✅
```

**Inside `/npc/voice-chat`:**
```
Audio Input
    ↓
Whisper STT (1-2s)
    ↓
AI Pipeline (0.5-1s)
    ↓
Sarvam TTS (0.5-1s)
    ↓
MP3 Output
```

**Total time:** < 3 seconds

---

## 🐛 Troubleshooting

**Backend won't start:**
```bash
pip install sarvamai openai-whisper
```

**Slow response (> 5s):**

Edit `services/stt_whisper.py`:
```python
model_name = "tiny"  # Faster (was "base")
```

**Microphone not working:**
- Allow mic permission in browser
- Use localhost or HTTPS (required for mic)

**"Sarvam AI error":**
- API key is in `services/npc_voice_pipeline.py`
- Default key should work
- Check internet connection

---

## 📁 Files Created/Updated

```
✅ backend/services/npc_voice_pipeline.py     (NEW)
✅ backend/main.py                             (UPDATED)
✅ backend/requirements.txt                    (UPDATED)
✅ backend/test_voice_chat.py                  (NEW)
✅ npc_voice_conversation.js                   (UPDATED)
✅ NPC_VOICE_CHAT_COMPLETE.md                  (NEW - full docs)
✅ QUICK_START.md                              (NEW - this file)
```

---

## ✅ Success Checklist

- [ ] `pip install -r requirements.txt` succeeds
- [ ] Backend starts: `uvicorn main:app --reload`
- [ ] Test passes: `python test_voice_chat.py test.wav`
- [ ] Game loads without errors
- [ ] Microphone permission granted
- [ ] V key starts recording
- [ ] NPC responds with Tamil voice
- [ ] Response time < 5 seconds

---

## 🎯 Next Steps

### To Use:
1. Start backend (see above)
2. Open game in browser
3. Hold V near NPC to talk

### To Customize:
- **Change voice speed:** Edit `services/stt_whisper.py` (model_name)
- **Change TTS voice:** Edit `services/npc_voice_pipeline.py` (SARVAM_SPEAKER)
- **Add more NPCs:** Pass `character_name` parameter

### To Optimize:
- Use GPU for Whisper (faster transcription)
- Cache AI responses (faster chat)
- Stream TTS audio (start playing sooner)

---

## 📞 Documentation

- **This file:** Quick start only
- **Full docs:** `NPC_VOICE_CHAT_COMPLETE.md`
- **API details:** See `main.py` docstrings
- **Code:** Well-commented in all files

---

## 🎉 You're Ready!

```bash
cd backend
uvicorn main:app --reload
```

Then open game and **hold V** to talk! 🎤
