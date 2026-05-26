# 🎮 NPC Proximity System - Quick Reference

## What You'll See

### 1. When Far from NPC
```
[Game View]
- No tooltip visible
- Normal gameplay
```

### 2. When Walking Toward NPC (Getting Closer)
```
[Game View]
- Raja Raja Cholan model visible ahead
- Still no tooltip (distance > 3 units)
```

### 3. When Within 3 Units (Tooltip Appears!)
```
┌─────────────────────────────────────┐
│                                     │
│     [Raja Raja Cholan Model]        │
│                                     │
│                                     │
└─────────────────────────────────────┘
              ↓
    ┌─────────────────────┐
    │  இராஜராஜ சோழன்     │
    │                     │
    │  Press [E] to listen│
    └─────────────────────┘
          ↑ Tooltip (Pulsing Gold)
```

### 4. When E Key Pressed (Audio Playing)
```
[Tooltip disappears]

┌─────────────────────────────────────┐
│                                     │
│  🔊 இராஜராஜ சோழன்                 │
│  கதை ஒலி இயக்கப்படுகிறது...      │
│                                     │
└─────────────────────────────────────┘
      ↑ Dialogue Overlay (Black with Gold Border)
```

---

## Console Messages (Browser F12)

### Success Flow:
```
✅ NPC proximity system initialized
✅ Player position: Vector3 {x: 2.5, y: 0, z: 0.8}
✅ 🎮 Fetching NPC introduction from backend...
✅ 🔊 Playing Raja Raja Cholan introduction
```

### Error (Backend Not Running):
```
❌ Error playing NPC intro: TypeError: Failed to fetch
❌ Alert: பின்னணி சேவையை இயக்கவும்
   (Please start backend: uvicorn main:app --reload)
```

---

## Controls

| Key | Action |
|-----|--------|
| **W** | Move forward (toward NPC) |
| **A** | Move left |
| **S** | Move backward |
| **D** | Move right |
| **E** | Interact with NPC (when tooltip visible) |
| **Shift** | Run (move faster) |
| **Mouse** | Look around |
| **ESC** | Release mouse |

---

## NPC Location

```
World Map (Top View):

         North
           ↑
           |
    West ← + → East (Raja Raja Cholan at 5, 0, 0)
           |
           ↓
         South

Your starting position: (0, 0, 0)
Raja Raja Cholan: (5, 0, 0)
→ Walk East (press D key) to reach him
```

---

## Testing Steps (Visual Guide)

### Step 1: Start Backend
```powershell
C:\kproject\storyworld> .\start_npc_system.bat
```
✅ Terminal shows: "Uvicorn running on http://127.0.0.1:8000"

### Step 2: Open Game
- Open `index.html` in Chrome/Edge/Firefox
- ✅ You see the Tamil menu screen (gold theme)

### Step 3: Start Game
- Click "இயற்கை" (Nature) button
- ✅ Game loads, you see forest environment

### Step 4: Start Playing
- Click anywhere in the game view
- ✅ Instructions disappear, crosshair appears
- ✅ You can move with WASD

### Step 5: Find the NPC
- Press **D** key to move right/east
- ✅ Look for Raja Raja Cholan character model
- ✅ He's positioned at (5, 0, 0) - about 5 units to the right

### Step 6: Get Close
- Keep walking toward him
- ✅ Tooltip appears when distance < 3 units
- ✅ Tooltip shows "இராஜராஜ சோழன்" and "Press E to listen"

### Step 7: Interact
- Press **E** key
- ✅ Tooltip disappears
- ✅ Audio starts playing (Tamil speech)
- ✅ Dialogue overlay appears
- ✅ Console shows: "🔊 Playing Raja Raja Cholan introduction"

### Step 8: After Playback
- Audio finishes (30-60 seconds)
- ✅ Dialogue overlay disappears
- ✅ Tooltip won't appear again (intro plays only once)

---

## Troubleshooting Checklist

### Tooltip Not Appearing?

1. ✅ **Backend running?** Check terminal for "Uvicorn running"
2. ✅ **Close enough?** Distance must be < 3 units
3. ✅ **NPC loaded?** Check console for "Raja Raja Cholan model loaded"
4. ✅ **Already played?** Tooltip only shows before first playback

**Quick Test:**
```javascript
// Paste in browser console (F12):
console.log('Distance:', playerEntity._position.distanceTo(rajaModel.position));
// Should show < 3 when tooltip should appear
```

### E Key Not Working?

1. ✅ **Tooltip visible?** E only works when tooltip shows
2. ✅ **Game focused?** Click on game canvas first
3. ✅ **Already played?** Can only play once per session

**Quick Test:**
```javascript
// Paste in browser console:
console.log('Can interact?', canInteract);
console.log('Has played?', rajaModel.userData.hasPlayedIntro);
```

### No Audio Playing?

1. ✅ **Sound enabled?** Check game menu settings
2. ✅ **Audio file exists?** Check `backend/npc/audio/raja_raja_cholan_intro.mp3`
3. ✅ **Backend responding?** Test: `curl -X POST http://localhost:8000/npc/intro`

---

## Expected Behavior Summary

| Condition | Tooltip | E Key | Audio |
|-----------|---------|-------|-------|
| Distance > 3 units | ❌ Hidden | ❌ No effect | ❌ Won't play |
| Distance < 3 units (before play) | ✅ Visible | ✅ Active | ⏳ Ready |
| E pressed near NPC | ❌ Hidden | ⏳ Playing | ✅ Playing |
| After first playback | ❌ Hidden | ❌ No effect | ❌ Won't replay |

---

## Success Indicators

You know it's working when you see:

1. ✅ Tooltip appears automatically when close
2. ✅ Tooltip has pulsing gold animation
3. ✅ E key triggers audio immediately
4. ✅ Tamil speech plays from speakers
5. ✅ Dialogue overlay shows during playback
6. ✅ Everything disappears after playback

---

## Files Modified

| File | Changes |
|------|---------|
| `index.html` | ➕ Added tooltip HTML & CSS with animations |
| `main.js` | ➕ Added proximity detection, E key listener, checkNPCProximity() |
| `backend/main.py` | ✅ Already has `/npc/intro` endpoint |
| `backend/npc/audio/` | ✅ Already has `raja_raja_cholan_intro.mp3` |

---

## Ready to Test! 🚀

1. Run: `.\start_npc_system.bat`
2. Open: `index.html`
3. Play: Walk to NPC and press E
4. Enjoy: Tamil introduction audio!
