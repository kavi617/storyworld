# 🎤 NPC Voice Conversation System - Complete Setup

## 🎯 What You're Building

A complete voice-based NPC interaction system where:

1. **Player speaks** → Holds V key near NPC
2. **Speech-to-Text** → Whisper converts Tamil/English to text
3. **AI thinks** → Chat pipeline generates response
4. **Text-to-Speech** → Sarvam TTS creates audio
5. **NPC speaks** → Audio plays in game

---

## ✅ What's Been Added (Backend)

### New Files

| File | Purpose |
|------|---------|
| `services/stt_whisper.py` | Whisper integration for speech recognition |
| `backend/test_stt.py` | Test script for STT endpoint |
| `backend/STT_INTEGRATION_GUIDE.md` | Comprehensive documentation |

### Modified Files

| File | Changes |
|------|---------|
| `main.py` | ➕ Added `POST /stt` endpoint |
| `requirements.txt` | ➕ Added `openai-whisper` |

### New Endpoint

```
POST /stt
- Accepts: audio file (wav, mp3, webm)
- Returns: {"text": "transcribed speech"}
```

---

## 🚀 Installation (Step-by-Step)

### Step 1: Install Whisper Dependencies

```bash
cd c:\kproject\storyworld\backend
pip install -r requirements.txt
```

**What gets installed:**
- `openai-whisper` - Speech recognition model (~74MB)
- `ffmpeg` - Audio processing (auto-installed)
- PyTorch - Model inference

**Time:** ~3-5 minutes on first install

**Expected output:**
```
✅ Successfully installed openai-whisper-...
✅ Successfully installed torch-...
```

### Step 2: Verify Whisper Installation

```bash
python -c "import whisper; print('✅ Whisper ready')"
```

**Expected:**
```
✅ Whisper ready
```

**If error:**
```bash
# Windows: Install Visual C++ Build Tools
# Download from: https://visualstudio.microsoft.com/downloads/
# Select "Desktop development with C++"

# Or use conda:
conda install -c conda-forge openai-whisper
```

### Step 3: Start Backend

```bash
cd backend
uvicorn main:app --reload
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### Step 4: Test STT Endpoint

#### Option A: Quick Health Check

```bash
curl http://localhost:8000/health
```

**Expected:**
```json
{
  "status": "healthy",
  ...
}
```

#### Option B: Test with Audio File

1. Create a test audio file:
   - Record yourself saying "வணக்கம்" (or any word)
   - Save as `test_audio.wav`
   - Place in `backend/` folder

2. Run test script:
```bash
python test_stt.py test_audio.wav
```

**Expected output:**
```
✅ Backend is running
📤 Sending audio to /stt endpoint...
   File: test_audio.wav
   Size: 45.2 KB

✅ Transcription successful!

📝 Transcribed text:
   வணக்கம்

✅ Character count: 8
✅ Word count: 1
```

---

## 🎮 Frontend Integration

### Step 1: Add Voice Recording UI

Add to your `index.html` (inside `<body>`, after gameUI):

```html
<!-- Voice Recording Indicators -->
<div id="voiceRecordingIndicator" style="
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 0, 0, 0.9);
    color: white;
    padding: 15px 30px;
    border-radius: 10px;
    font-weight: bold;
    display: none;
    z-index: 10000;
    box-shadow: 0 0 30px rgba(255, 0, 0, 0.8);
    animation: pulse 1s infinite;
">
    🎤 Recording... (Release V to send)
</div>

<div id="voiceProcessingIndicator" style="
    position: fixed;
    top: 70px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 215, 0, 0.9);
    color: #000;
    padding: 15px 30px;
    border-radius: 10px;
    font-weight: bold;
    display: none;
    z-index: 10000;
">
    Processing...
</div>

<div id="conversationLog" style="
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 400px;
    max-height: 300px;
    overflow-y: auto;
    background: rgba(0, 0, 0, 0.9);
    border: 3px solid #FFD700;
    border-radius: 10px;
    padding: 20px;
    color: #FFD700;
    font-family: 'Noto Sans Tamil', Arial;
    display: none;
    z-index: 9999;
">
    <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">
        Conversation
    </div>
    <!-- Messages appear here -->
</div>

<style>
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

.user-message {
    background: rgba(100, 150, 255, 0.2);
    padding: 10px;
    margin: 5px 0;
    border-radius: 5px;
    border-left: 3px solid #6496FF;
}

.npc-message {
    background: rgba(255, 215, 0, 0.2);
    padding: 10px;
    margin: 5px 0;
    border-radius: 5px;
    border-left: 3px solid #FFD700;
}
</style>
```

### Step 2: Load Voice System Script

Add to `index.html` before `</body>`:

```html
<script src="npc_voice_conversation.js"></script>
```

### Step 3: Initialize Voice System

Add to your `main.js` (after game initializes):

```javascript
// Initialize NPC voice conversation system
async function initGame() {
    // ... existing game initialization ...
    
    // Initialize voice system
    await initNPCVoiceSystem();
    
    console.log('✅ Game ready with voice interaction!');
}

initGame();
```

### Step 4: Update NPC Tooltip

The tooltip will automatically update to show:
```
இராஜராஜ சோழன்
Press E to hear intro
Hold V to talk
```

---

## 🎯 How to Use (Player Experience)

### Step 1: Start Game
1. Run backend: `uvicorn main:app --reload`
2. Open `index.html` in browser
3. Click "இயற்கை" to start
4. Allow microphone when prompted ✅

### Step 2: Approach NPC
- Walk toward Raja Raja Cholan (WASD keys)
- Tooltip appears when close

### Step 3: Intro (E Key)
- Press **E** to hear pre-recorded intro
- NPC plays introduction speech (one time)

### Step 4: Talk (V Key)
1. **Hold V key** - Recording starts 🎤
2. **Speak clearly** - Say your question in Tamil or English
3. **Release V** - Recording stops and processing begins

### Step 5: NPC Responds
1. "Converting speech to text..." - Whisper processes
2. "NPC is thinking..." - AI generates response
3. "Generating voice..." - TTS creates audio
4. 🔊 **NPC speaks the answer**

### Step 6: Continue Conversation
- Hold V again to ask another question
- Conversation log shows history
- Responses accumulate

---

## 🧪 Testing Flow

### Test 1: Backend Only (No Frontend)

```bash
# Terminal 1: Start backend
cd backend
uvicorn main:app --reload

# Terminal 2: Test STT
python test_stt.py test_audio.wav
```

**Expected:** Transcribed text printed

### Test 2: Full Voice Loop (Browser)

1. Open browser console (F12)
2. Navigate to NPC
3. Hold V key
4. Speak: "வணக்கம் இராஜராஜ சோழன்"
5. Release V

**Console logs:**
```
🎤 Recording started...
🎤 Recording stopped
📦 Audio blob: 25.3 KB
✅ You said: வணக்கம் இராஜராஜ சோழன்
🤖 NPC responds: வணக்கம்! நான் இராஜராஜ சோழன். எப்படி உதவ முடியும்?
🔊 Playing NPC voice response
```

### Test 3: Conversation Quality

**Good test questions:**

Tamil:
- "உங்கள் பெயர் என்ன?" (What's your name?)
- "பிரகதீஸ்வரர் கோவில் பற்றி சொல்லுங்கள்" (Tell me about Brihadeeswara temple)
- "நீங்கள் எப்போது ஆட்சி செய்தீர்கள்?" (When did you rule?)

English:
- "Who are you?"
- "Tell me about your empire"
- "What did you build?"

---

## 🐛 Troubleshooting

### Issue: Microphone Not Working

**Symptoms:** No recording indicator appears

**Solutions:**
1. **Check browser permissions:**
   - Chrome: Settings → Privacy → Site Settings → Microphone
   - Edge: Settings → Site permissions → Microphone
   - Allow access for your site

2. **Test microphone:**
   ```javascript
   // Browser console:
   navigator.mediaDevices.getUserMedia({ audio: true })
     .then(() => console.log('✅ Mic works'))
     .catch(e => console.error('❌', e));
   ```

3. **Use HTTPS or localhost:**
   - Microphone only works on secure origins
   - localhost is OK for development
   - Use Live Server extension in VS Code

### Issue: "No Speech Detected"

**Symptoms:** Recording sends but returns empty

**Solutions:**
1. **Speak louder** - Whisper needs clear audio
2. **Check mic volume:**
   - Windows: Settings → Sound → Input → Test microphone
   - Adjust input volume to 70-100%

3. **Reduce background noise**
4. **Speak for at least 1 second**

### Issue: Slow Transcription (>5 seconds)

**Symptoms:** Long wait after releasing V

**Solutions:**

1. **Use smaller model:**
   ```python
   # Edit services/stt_whisper.py
   model_name = "tiny"  # Faster, less accurate
   ```

2. **Enable GPU (if available):**
   ```bash
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
   ```

3. **Shorter recordings** - Keep under 10 seconds

### Issue: Backend Returns 503

**Symptoms:** "Speech recognition unavailable"

**Solutions:**
1. **Reinstall Whisper:**
   ```bash
   pip uninstall openai-whisper
   pip install openai-whisper
   ```

2. **Check Whisper import:**
   ```bash
   python -c "import whisper"
   ```

3. **Install ffmpeg:**
   - Windows: Download from ffmpeg.org, add to PATH
   - macOS: `brew install ffmpeg`
   - Linux: `sudo apt install ffmpeg`

### Issue: CORS Error

**Symptoms:** "Access blocked by CORS policy"

**Solutions:**
1. **Backend already configured** - Check main.py has CORS middleware
2. **Use same origin:**
   - Backend: http://localhost:8000
   - Frontend: http://localhost:5500 (or same port)
3. **Restart backend after code changes**

---

## 📊 Performance Optimization

### Current Setup
- Model: `base` (74MB)
- CPU transcription: ~1-2 seconds
- Good Tamil support ✅

### For Faster Performance

**Option 1: Smaller Model**
```python
# services/stt_whisper.py
model_name = "tiny"  # 39MB, 0.5-1s, limited Tamil
```

**Option 2: GPU Acceleration**
```bash
# Install CUDA PyTorch
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Edit stt_whisper.py
fp16=True  # Enable GPU mode
```

**Option 3: Faster-Whisper**
```bash
pip uninstall openai-whisper
pip install faster-whisper

# Update imports in stt_whisper.py
```

---

## ✅ Complete System Checklist

### Backend
- [x] Whisper service created
- [x] /stt endpoint implemented
- [x] Dependencies in requirements.txt
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] Backend running (`uvicorn main:app --reload`)
- [ ] /stt endpoint tested

### Frontend
- [ ] Voice UI added to index.html
- [ ] npc_voice_conversation.js loaded
- [ ] Voice system initialized
- [ ] Microphone permission granted
- [ ] V key recording works
- [ ] Conversation log displays

### Integration
- [ ] Voice → STT → Text ✅
- [ ] Text → Chat → Response ✅
- [ ] Response → TTS → Audio (TODO: Sarvam TTS)
- [ ] Full conversation loop works

---

## 🎯 Next Steps

1. **Install:** `pip install -r requirements.txt`
2. **Test:** `python test_stt.py test_audio.wav`
3. **Run:** `uvicorn main:app --reload`
4. **Play:** Open game, press V near NPC
5. **Speak:** Ask questions in Tamil or English
6. **Listen:** Hear NPC respond

---

## 📦 File Overview

```
storyworld/
├── index.html                          # ✅ Add voice UI here
├── npc_voice_conversation.js           # ✅ NEW - Voice system
└── backend/
    ├── main.py                         # ✅ /stt endpoint added
    ├── requirements.txt                # ✅ Whisper dependency
    ├── test_stt.py                     # ✅ Test script
    ├── STT_INTEGRATION_GUIDE.md        # ✅ Full documentation
    └── services/
        └── stt_whisper.py              # ✅ Whisper service
```

---

## 🎉 You're Ready!

Your NPC can now:
- ✅ Listen to player's voice (Whisper STT)
- ✅ Understand Tamil + English
- ✅ Generate AI responses (existing pipeline)
- ⏳ Speak back (TTS integration next)

Run the backend and start talking to Raja Raja Cholan! 🎤👑
