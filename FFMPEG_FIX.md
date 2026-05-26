# 🔧 FFmpeg Missing - Quick Fix

## ⚠️ Error You're Seeing

```
POST http://localhost:8000/npc/voice-chat 503 (Service Unavailable)
"Transcription failed: [WinError 2] The system cannot find the file specified"
```

**Cause:** FFmpeg is not installed. Whisper needs it to process audio files.

---

## ✅ Quick Fix (Choose ONE Method)

### METHOD 1: Fastest (Recommended) ⚡

**Run this command:**

```bash
winget install Gyan.FFmpeg
```

**OR double-click:**
```
install_ffmpeg_quick.bat
```

Then **restart Command Prompt** and start backend again.

---

### METHOD 2: Manual Install 📥

1. **Download FFmpeg:**
   - Go to: https://github.com/BtbN/FFmpeg-Builds/releases
   - Download: `ffmpeg-master-latest-win64-gpl.zip`

2. **Extract:**
   - Extract to: `C:\ffmpeg`

3. **Add to PATH:**
   - Open System Environment Variables
   - Edit PATH
   - Add: `C:\ffmpeg\bin`
   - Click OK

4. **Restart Command Prompt**

---

### METHOD 3: Chocolatey 🍫

```bash
choco install ffmpeg -y
```

---

## 🧪 Verify Installation

After installing, **restart Command Prompt** and run:

```bash
ffmpeg -version
```

You should see:
```
ffmpeg version ...
```

If it works, you're ready!

---

## 🎮 Updated Configuration

I've also updated your Whisper model to **"tiny"** for fastest performance:

**File: `backend/.env`**
```env
OPENAI_WHISPER_MODEL=tiny
```

### Whisper Model Options:

| Model | Size | Speed | Quality | Use For |
|-------|------|-------|---------|---------|
| **tiny** | 39MB | 0.5-1s | Good | 🎮 **Gameplay** (recommended) |
| base | 74MB | 1-2s | Better | Balanced |
| small | 244MB | 2-4s | Best | Accuracy needed |

**For real-time gameplay, use `tiny`!**

---

## 🚀 Complete Setup Steps

1. **Install FFmpeg** (choose method above)

2. **Restart Command Prompt** (IMPORTANT!)

3. **Verify FFmpeg:**
   ```bash
   ffmpeg -version
   ```

4. **Start Backend:**
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

5. **Test Voice Chat:**
   - Open game in browser
   - Walk to NPC
   - Press E for intro
   - Hold V to speak!

---

## 🐛 Still Not Working?

### Check FFmpeg is in PATH:

```bash
where ffmpeg
```

Should show: `C:\...\ffmpeg.exe`

If not found:
- Restart Command Prompt (or PC)
- Check PATH environment variable
- Try manual install method

### Check Backend Logs:

Look for:
```
✅ Whisper model 'tiny' loaded successfully
```

If you see error about ffmpeg, it's not properly installed.

---

## 📞 Quick Commands

```bash
# Install FFmpeg (fastest)
winget install Gyan.FFmpeg

# Verify FFmpeg
ffmpeg -version

# Start backend
cd backend
uvicorn main:app --reload

# Test voice system
python test_voice_chat.py
```

---

## ✅ Success Criteria

You'll know it works when:

1. ✅ `ffmpeg -version` works
2. ✅ Backend starts without errors
3. ✅ Console shows: "Whisper model 'tiny' loaded"
4. ✅ V key recording works
5. ✅ NPC responds with voice!

---

**Current Status:**
- ✅ Code updated to use "tiny" model
- ✅ Better error messages added
- ⏳ Need to install FFmpeg
- ⏳ Then restart backend

**Next step:** Install FFmpeg using one of the methods above! 🚀
