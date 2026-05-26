# 🎮 Testing NPC Proximity & Voice System

## ✅ What's Been Added

### 1. **Proximity Detection**
- When you walk within **3 units** of Raja Raja Cholan, a tooltip appears
- Tooltip shows: "இராஜராஜ சோழன்" and "Press E to listen"

### 2. **E Key Interaction**
- Press **E** key when near the NPC to trigger voice playback
- Audio plays from backend (`raja_raja_cholan_intro.mp3`)
- Tooltip disappears after first playback

### 3. **Visual Feedback**
- Tooltip pulses with golden glow animation
- Shows NPC name in Tamil
- Clear "Press E" prompt with keyboard icon

---

## 🚀 How to Test

### Step 1: Start the Backend

```bash
cd c:\kproject\storyworld\backend
uvicorn main:app --reload
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### Step 2: Open the Game

Open in browser:
```
c:\kproject\storyworld\index.html
```

Or use Live Server in VS Code.

### Step 3: Start Playing

1. Click "இயற்கை" (Nature) button
2. Click anywhere to start the game
3. Use **WASD** to move your character

### Step 4: Find Raja Raja Cholan

- The NPC is positioned at **(5, 0, 0)** in the world
- Move your character toward him
- He's near the spawn point (you start at 0, 0, 0)

### Step 5: Trigger the Interaction

1. **Walk close** to Raja Raja Cholan (within 3 units)
2. **Tooltip appears** with "Press E to listen"
3. **Press E** key
4. **Audio plays** - Tamil introduction speech
5. **Dialogue overlay** appears during playback

---

## 🎯 Expected Behavior

### When Far from NPC (> 3 units)
- ❌ No tooltip visible
- ❌ E key does nothing

### When Near NPC (< 3 units)
- ✅ Tooltip appears (pulsing gold animation)
- ✅ Shows "இராஜராஜ சோழன்"
- ✅ Shows "Press E to listen"

### When Pressing E Near NPC
- ✅ Tooltip disappears immediately
- ✅ Backend called: `POST http://localhost:8000/npc/intro`
- ✅ Audio plays: `raja_raja_cholan_intro.mp3`
- ✅ Dialogue overlay shows during playback
- ✅ Won't play again (intro plays only once)

---

## 🔧 Troubleshooting

### Tooltip Not Showing

**Check:**
1. Is the NPC model loaded? (Check browser console)
2. Are you close enough? (< 3 units)
3. Is `#npcTooltip` element present in HTML?

**Debug:**
```javascript
// Open browser console (F12) and check:
console.log('Player position:', playerEntity._position);
console.log('NPC position:', rajaModel.position);
console.log('Distance:', playerEntity._position.distanceTo(rajaModel.position));
```

### E Key Not Working

**Check:**
1. Is tooltip visible? (E only works when tooltip shows)
2. Has intro already been played? (Only plays once)
3. Check browser console for errors

**Debug:**
```javascript
// In browser console:
console.log('Can interact?', canInteract);
console.log('Has played intro?', rajaModel.userData.hasPlayedIntro);
```

### Audio Not Playing

**Check:**
1. ✅ Backend running? (`uvicorn main:app --reload`)
2. ✅ Audio file exists? (`backend/npc/audio/raja_raja_cholan_intro.mp3`)
3. ✅ Sound enabled in game menu?
4. ✅ Browser console shows errors?

**Test Backend Directly:**
```bash
curl -X POST http://localhost:8000/npc/intro --output test.mp3
# If successful, test.mp3 file will be downloaded
```

### Backend Not Responding

**Check:**
```bash
# Test if backend is running:
curl http://localhost:8000/
# Should return: {"message":"Backend running"}

# Test NPC endpoint:
curl -X POST http://localhost:8000/npc/intro -I
# Should return: HTTP/1.1 200 OK
```

**Common Issues:**
- Port 8000 already in use → Kill process or use different port
- Audio file missing → Check `backend/npc/audio/raja_raja_cholan_intro.mp3`
- CORS error → Backend already has CORS enabled, check browser console

---

## 📊 How the System Works

### Flow Diagram

```
Player walks near NPC (< 3 units)
    ↓
checkNPCProximity() detects proximity
    ↓
Tooltip appears: "Press E to listen"
    ↓
Player presses E key
    ↓
playNPCIntro() called
    ↓
POST /npc/intro to backend
    ↓
Backend returns raja_raja_cholan_intro.mp3
    ↓
Frontend plays audio
    ↓
Dialogue overlay shows
    ↓
Audio ends → overlay disappears
```

### Code Components

| Component | File | Purpose |
|-----------|------|---------|
| Tooltip HTML | `index.html` | `<div id="npcTooltip">` |
| Tooltip CSS | `index.html` | Animation & styling |
| Proximity Check | `main.js` | `checkNPCProximity()` |
| E Key Listener | `main.js` | `window.addEventListener('keydown')` |
| Play Function | `main.js` | `playNPCIntro()` |
| Backend Endpoint | `backend/main.py` | `@app.post("/npc/intro")` |
| Audio File | `backend/npc/audio/` | `raja_raja_cholan_intro.mp3` |

---

## 🎮 Testing Checklist

- [ ] Backend starts without errors
- [ ] Game loads in browser
- [ ] Can move character with WASD
- [ ] NPC model visible in scene
- [ ] Tooltip appears when close to NPC
- [ ] Tooltip shows Tamil NPC name
- [ ] "Press E" text visible with key icon
- [ ] Tooltip pulses with animation
- [ ] E key triggers audio playback
- [ ] Audio plays correctly
- [ ] Dialogue overlay appears
- [ ] Tooltip disappears after playback
- [ ] Audio doesn't replay on second E press
- [ ] No console errors

---

## 🔍 Browser Console Logs

**Expected Logs (Success):**
```
NPC proximity system initialized
Player position: Vector3 {x: 2, y: 0, z: 1}
🎮 Fetching NPC introduction from backend...
🔊 Playing Raja Raja Cholan introduction
```

**Error Logs (Backend Down):**
```
Error playing NPC intro: TypeError: Failed to fetch
பின்னணி சேவையை இயக்கவும்
(Please start backend: uvicorn main:app --reload)
```

---

## ⚙️ Configuration

### Adjust Interaction Distance

Edit `main.js`:
```javascript
const INTERACTION_DISTANCE = 3; // Change this value (currently 3 units)
```

### Change Audio Volume

Edit `main.js`:
```javascript
npcAudio.volume = gameConfig.soundEnabled ? 0.8 : 0; // Change 0.8 to desired volume
```

### Customize Tooltip Text

Edit `index.html`:
```html
<div id="npcTooltip">
    <div class="npc-name">Your Custom Name</div>
    <div class="key-prompt">
        Press <span class="key-icon">E</span> to interact
    </div>
</div>
```

---

## 📝 Notes

- **One-Time Playback:** Audio plays only once per game session
- **No AI Processing:** Uses static MP3 file, no cost
- **Performance:** Proximity check runs every frame (optimized)
- **Compatibility:** Works in all modern browsers
- **Sound Toggle:** Respects game sound settings

---

## 🎉 Success Criteria

You know the system works when:

1. ✅ Tooltip shows up when you walk near Raja Raja Cholan
2. ✅ Tooltip disappears when you walk away
3. ✅ Pressing E triggers Tamil audio playback
4. ✅ Dialogue overlay appears during speech
5. ✅ System only plays once per session

---

## 🆘 Need Help?

1. **Check browser console** (F12) for errors
2. **Verify backend is running** on port 8000
3. **Confirm audio file exists** in `backend/npc/audio/`
4. **Test backend directly** with curl/Postman
5. **Check network tab** in browser dev tools

---

## 📦 File Structure Reference

```
storyworld/
├── index.html                              # ✅ Tooltip HTML & CSS
├── main.js                                 # ✅ Proximity detection & E key
└── backend/
    ├── main.py                             # ✅ /npc/intro endpoint
    └── npc/
        └── audio/
            └── raja_raja_cholan_intro.mp3  # ✅ Static audio file
```

All systems are ready! Just start the backend and test 🎮
