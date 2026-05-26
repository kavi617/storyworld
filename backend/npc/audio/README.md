# ⚠️ ADD NPC INTRO AUDIO HERE

## Required File

Place your pre-recorded Raja Raja Cholan introduction audio here:

**Filename:** `raja_raja_cholan_intro.mp3`

## Audio Specifications

- **Format:** MP3
- **Language:** Tamil
- **Speaker:** Vijay (or your preferred voice)
- **Duration:** 30-60 seconds
- **Content:** Raja Raja Cholan's introduction speech

## Sample Text (Tamil)

```
வணக்கம், நான் இராஜராஜ சோழன்.

நான் கி.பி. 985 முதல் 1014 வரை சோழ பேரரசை ஆண்டேன். 
என் காலத்தில் தமிழகம் மட்டுமல்ல, இலங்கை, மாலத்தீவு, 
இந்தியாவின் பல பகுதிகள் எங்கள் பேரரசின் கீழ் இருந்தன.

என் பெயரில் தஞ்சாவூரில் பெரிய கோவிலை, பிரகதீஸ்வரர் கோவிலை கட்டினேன். 
இது உலகின் மிகப்பெரிய கற்றளி கோவில்களில் ஒன்று.

இந்த சோழ நாட்டின் மண் எங்கள் பெருமை. 
அதை காக்கும் பொறுப்பு நமக்கு உள்ளது.
```

## How to Generate

### Option 1: Use Sarvam AI (Already in project)
```bash
cd c:\kproject\storyworld
python test_api.py
# This will generate output.mp3
# Rename it to raja_raja_cholan_intro.mp3 and move here
```

### Option 2: Manual Recording
1. Record the Tamil text above
2. Save as MP3
3. Place in this folder

### Option 3: Online TTS
1. Use any Tamil TTS service
2. Generate MP3
3. Place in this folder

## Testing

After adding the file:

1. Start backend:
```bash
cd backend
uvicorn main:app --reload
```

2. Open game in browser
3. Click on Raja Raja Cholan model
4. Audio should play automatically!

## File Location
```
backend/
└── npc/
    └── audio/
        └── raja_raja_cholan_intro.mp3  ← PUT FILE HERE
```
