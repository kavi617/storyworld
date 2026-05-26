# 🎤 Voice Chat System - Complete Setup Guide

## ✅ What's Been Implemented

### Backend Changes

1. **Updated Voice Pipeline** (`backend/services/npc_voice_pipeline.py`)
   - Now returns structured data: `{player_text, npc_text, audio_bytes}`
   - Keeps conversation text for frontend display

2. **Updated API Endpoint** (`backend/main.py`)
   - `/npc/voice-chat` now returns JSON with:
     - `player_text`: What you said (from Whisper STT)
     - `npc_text`: Raja Raja Cholan's response
     - `audio_url`: URL to play the MP3 response
   - Audio files saved to `backend/npc/audio/responses/`
   - Static file serving at `/audio-responses/`

3. **Dependencies Added**
   - `uuid` for unique audio filenames
   - `StaticFiles` for serving audio responses

### Frontend Changes

1. **Updated HTML** (`index.html`)
   - ✅ Voice chat tooltip (green, shows after intro)
   - ✅ Recording indicator (red pulse when holding V)
   - ✅ Processing indicator (orange, while AI thinks)
   - ✅ Conversation log (right side, shows chat history)
   - ✅ Loaded `npc_voice_conversation.js` script

2. **Updated Game Logic** (`main.js`)
   - ✅ After intro finishes, enables `voiceChatEnabled` flag
   - ✅ Shows voice chat tooltip after intro
   - ✅ Hides "Press E" tooltip permanently after intro
   - ✅ Helper functions for tooltip management
   - ✅ Calls `initNPCVoiceSystem()` after intro

3. **Updated Voice System** (`npc_voice_conversation.js`)
   - ✅ Uses new `/npc/voice-chat` endpoint
   - ✅ Displays conversation messages in log
   - ✅ Plays audio from URL
   - ✅ V key only works when near NPC and after intro
   - ✅ Shows/hides tooltips during recording

---

## 🚀 Installation Steps

### Step 1: Install Backend Dependencies

```bash
cd backend

# Install Sarvam AI SDK
pip install sarvamai

# Verify all dependencies
pip install -r requirements.txt
```

### Step 2: Verify Sarvam AI API Key

The API key is already configured in `backend/services/npc_voice_pipeline.py`:
```python
SARVAM_API_KEY = "sk_o9wczeqi_xnyKyN5iaYnZ1quumefeGv03"
```

If you need to update it, edit line 20 in `npc_voice_pipeline.py`.

### Step 3: Start Backend

```bash
cd backend
uvicorn main:app --reload
```

You should see:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Step 4: Test Backend (Optional)

Open another terminal and test the health check:

```bash
curl http://localhost:8000/health
```

Expected: `{"status":"healthy"}`

### Step 5: Open Game

Simply open `index.html` in your browser (Chrome recommended for best microphone support).

---

## 🎮 How to Use

### First Time Experience

1. **Start Game**
   - Select "இயற்கை வனம்" (Nature Forest)
   - Enter game

2. **Find NPC**
   - Walk forward using WASD
   - Look for Raja Raja Cholan (standing at 5,0,0)
   - Look around with mouse

3. **Listen to Intro**
   - When you see: **"Press E to listen"**
   - Press **E** key
   - Listen to the Tamil introduction

4. **Start Voice Chat**
   - After intro finishes, tooltip changes to:
     **"Hold V to speak with Raja Raja Cholan"** (green)
   - Walk near NPC (< 3 units distance)

5. **Talk to NPC**
   - **Hold V key** → speak in Tamil or English
   - **Release V** → processing starts
   - Red indicator shows while recording
   - Orange indicator shows while processing
   - NPC responds with voice!
   - Conversation appears on right side

### Voice Chat Flow

```
1. Walk near NPC → Green tooltip appears
2. Hold V key → Red "Recording..." indicator
3. Speak clearly → "வணக்கம் இராஜராஜ சோழன்"
4. Release V → Orange "Processing..." indicator
5. Wait 2-3 seconds → AI thinks
6. NPC speaks! → Audio plays + text shows in log
7. Continue conversation → Hold V again!
```

---

## 🧪 Testing Checklist

### Backend Tests

- [ ] Backend starts without errors
- [ ] `/health` endpoint returns 200
- [ ] `backend/npc/audio/responses/` directory created
- [ ] Audio responses directory accessible at `/audio-responses/`

### Frontend Tests

- [ ] Game loads without console errors
- [ ] NPC model appears at (5, 0, 0)
- [ ] "Press E" tooltip shows when near NPC
- [ ] E key plays intro audio
- [ ] Green "Hold V" tooltip shows after intro
- [ ] V key recording works (red indicator)
- [ ] Conversation log appears on right side
- [ ] Audio plays when NPC responds
- [ ] Messages appear in conversation log

### Voice System Tests

- [ ] Microphone permission granted
- [ ] Recording indicator pulses when holding V
- [ ] Processing indicator shows after release
- [ ] Player message appears in log
- [ ] NPC message appears in log
- [ ] Audio plays automatically
- [ ] Can have multiple back-and-forth conversations

---

## 🔧 Configuration

### Change TTS Voice

Edit `backend/services/npc_voice_pipeline.py`:

```python
SARVAM_SPEAKER = "vijay"  # Options: vijay, meera, arjun
SARVAM_LANGUAGE = "ta-IN"  # Tamil (India)
```

### Change Whisper Model

Edit `backend/services/stt_whisper.py`:

```python
model_name = "base"  # Options: tiny, base, small, medium
```

- `tiny`: Fastest (0.5s), less accurate
- `base`: Balanced (1-2s) ✅ **Default**
- `small`: Better (2-4s)
- `medium`: Best (4-6s)

### Adjust Interaction Distance

Edit `main.js`:

```javascript
const INTERACTION_DISTANCE = 3; // Change to 5 for larger range
```

---

## 🐛 Troubleshooting

### "Microphone access denied"

**Solution:**
- Browser settings → Allow microphone for localhost
- Use HTTPS or localhost (required for mic access)
- Refresh page and allow permissions

### "Backend not responding"

**Solution:**
```bash
cd backend
uvicorn main:app --reload
```

### "No speech detected"

**Solution:**
- Speak louder and clearer
- Hold V for at least 1-2 seconds
- Reduce background noise
- Check microphone is working: `navigator.mediaDevices.getUserMedia({audio: true})`

### "Voice chat tooltip not showing"

**Solution:**
- Make sure intro has finished playing
- Check console for errors: `rajaModel.userData.voiceChatEnabled` should be `true`
- Walk closer to NPC (< 3 units)

### "Audio not playing"

**Solution:**
- Check browser console for errors
- Verify `/audio-responses/` endpoint is accessible
- Check backend logs for TTS errors
- Verify Sarvam AI API key is valid

### "Conversation log not showing"

**Solution:**
- Check browser console: `document.getElementById('conversationLog')`
- Verify `npc_voice_conversation.js` is loaded
- Check CSS: `#conversationLog.visible` should have `display: block`

---

## 📊 Performance Metrics

| Step | Time | What's Happening |
|------|------|-----------------|
| Recording | ~1-2s | Player speaks |
| STT (Whisper) | ~1-2s | Speech → Text |
| AI (Pipeline) | ~0.5-1s | Generate response |
| TTS (Sarvam) | ~0.5-1s | Text → Speech |
| **Total** | **~2.5-5s** | Complete cycle |

### Optimization Tips

1. **Faster STT**: Use `tiny` Whisper model (less accurate)
2. **Reduce AI time**: Shorter prompts
3. **Faster TTS**: Already optimized (streaming)

---

## 🎯 API Endpoint Reference

### POST /npc/voice-chat

**Request:**
```bash
curl -X POST http://localhost:8000/npc/voice-chat \
  -F "audio=@recording.webm"
```

**Response:**
```json
{
  "player_text": "வணக்கம் இராஜராஜ சோழன்",
  "npc_text": "வணக்கம்! நான் இராஜராஜ சோழன். உங்களை சந்தித்து மகிழ்ச்சி.",
  "audio_url": "/audio-responses/npc_response_a1b2c3d4.mp3"
}
```

### GET /audio-responses/{filename}

**Request:**
```bash
curl http://localhost:8000/audio-responses/npc_response_a1b2c3d4.mp3 \
  -o response.mp3
```

**Response:**
Binary MP3 audio data

---

## 📁 File Structure

```
storyworld/
├── index.html                          ✅ Voice UI added
├── main.js                             ✅ Voice chat integration
├── npc_voice_conversation.js           ✅ Voice system
├── backend/
│   ├── main.py                         ✅ /npc/voice-chat endpoint
│   ├── services/
│   │   ├── npc_voice_pipeline.py       ✅ Updated to return text + audio
│   │   ├── stt_whisper.py              ✅ Whisper STT
│   │   └── pipeline.py                 ✅ Existing AI system
│   └── npc/
│       └── audio/
│           ├── raja_raja_cholan_intro.mp3  ✅ Intro audio
│           └── responses/                  ✅ NEW: Voice responses
│               └── npc_response_*.mp3      (Auto-generated)
```

---

## 🎉 Success Indicators

You'll know it works when:

1. ✅ Green "Hold V" tooltip shows after intro
2. ✅ Red recording indicator pulses when holding V
3. ✅ Orange processing indicator shows while waiting
4. ✅ Conversation log appears on right side
5. ✅ Your message appears: "You said: ..."
6. ✅ NPC responds with voice + text
7. ✅ Can have continuous conversation

---

## 🚨 Common Issues

### Issue: "TypeError: Cannot read property 'userData' of null"

**Cause:** NPC model not loaded yet

**Solution:**
- Wait for game to fully load
- Check console: "Raja Raja Cholan model loaded"

### Issue: "CORS error when fetching audio"

**Cause:** CORS not configured for static files

**Solution:**
Already fixed! `StaticFiles` inherits CORS from FastAPI middleware.

### Issue: "Voice chat works but no audio"

**Cause:** Audio file path incorrect

**Solution:**
- Check backend logs for audio file path
- Verify file exists: `ls backend/npc/audio/responses/`
- Check browser network tab for 404 errors

---

## 📞 Next Steps

1. **Install dependencies**: `pip install sarvamai`
2. **Start backend**: `uvicorn main:app --reload`
3. **Open game**: Load `index.html`
4. **Walk to NPC**: Press E for intro
5. **Hold V**: Start talking!

---

## 🎤 Voice Chat Commands

| Key | Action |
|-----|--------|
| **E** | Play intro (one time only) |
| **V** | Hold to record voice |
| **Release V** | Send to AI |
| **WASD** | Move |
| **Mouse** | Look around |

---

**System Status:** ✅ Ready to use!

**Note:** First run will be slower as Whisper model loads (~74MB). Subsequent runs are faster.
