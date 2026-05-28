═══════════════════════════════════════════════════════════════════════════
🏛️ TEMPLE WORLD - TROUBLESHOOTING GUIDE
═══════════════════════════════════════════════════════════════════════════

⚠️ ISSUE: You see the OLD procedurally-generated temple (pillars, vimana, etc.)
✅ SOLUTION: HARD REFRESH your browser to clear JavaScript cache

═══════════════════════════════════════════════════════════════════════════
🔧 HOW TO HARD REFRESH (CACHE CLEAR)
═══════════════════════════════════════════════════════════════════════════

Windows/Linux - Chrome/Edge/Firefox:
    Press: Ctrl + Shift + F5
    OR:    Ctrl + F5
    OR:    Ctrl + Shift + R

Mac - Chrome/Safari/Firefox:
    Press: Cmd + Shift + R

Alternative Method (Chrome DevTools):
    1. Open DevTools (F12)
    2. Right-click the refresh button
    3. Click "Empty Cache and Hard Reload"

═══════════════════════════════════════════════════════════════════════════
✅ WHAT YOU SHOULD SEE AFTER HARD REFRESH
═══════════════════════════════════════════════════════════════════════════

Console logs:
    🏛️ TEMPLE WORLD v2.0 - Loading FBX Model
    📦 Starting FBX load: Theme/Temple Theme/temple.fbx
    📥 Loading temple FBX: 0% ... 100%
    ✅ TEMPLE FBX MODEL LOADED!

Screen:
    - Sky blue background (no fog)
    - Invisible ground (no tan/beige color)
    - Your actual temple.fbx model loading at origin
    - Remy character ready to explore

═══════════════════════════════════════════════════════════════════════════
📋 FILE CHANGES MADE
═══════════════════════════════════════════════════════════════════════════

1. architecture_world.js - v2.0
   ✓ Loads ONLY your FBX model (Theme/Temple Theme/temple.fbx)
   ✓ No procedural geometry (no vimana, pillars, gopurams)
   ✓ Invisible ground plane
   ✓ Clear lighting (no fog)
   ✓ Enhanced console logging

2. main.js
   ✓ Fog disabled for architecture world
   ✓ Fog enabled only for nature world
   ✓ rajaMixer scope fixed (no errors)
   ✓ Hard refresh reminder in console

═══════════════════════════════════════════════════════════════════════════
❓ STILL SEEING OLD TEMPLE?
═══════════════════════════════════════════════════════════════════════════

Try these steps in order:

1. Hard refresh (Ctrl+Shift+F5)
2. Clear browser cache:
   - Chrome: Settings > Privacy > Clear browsing data > Cached images
3. Restart browser completely
4. Check console - if you see "line 324" or "line 519", cache is still old
5. Open in private/incognito window (forces fresh load)

═══════════════════════════════════════════════════════════════════════════
🎮 CONTROLS & GAMEPLAY
═══════════════════════════════════════════════════════════════════════════

Movement:
    W/A/S/D - Walk
    Mouse   - Look around
    ESC     - Release mouse

Temple World:
    - Click Architecture button (கட்டிடக்கலை)
    - Spawns at temple entrance
    - Explore the actual temple FBX model
    - No Raja in temple world (nature world only)
    - Remy character for exploration

═══════════════════════════════════════════════════════════════════════════
