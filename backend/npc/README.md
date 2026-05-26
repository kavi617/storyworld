# NPC System

This folder contains NPC-related files for the Chola World game.

## Structure

```
npc/
├── audio/                          # NPC introduction audio files
│   └── raja_raja_cholan_intro.mp3  # Raja Raja Cholan introduction (Tamil)
└── README.md                       # This file
```

## Audio Files

Place pre-recorded NPC introduction MP3 files in the `audio/` folder:

- **raja_raja_cholan_intro.mp3** - Raja Raja Cholan's introduction speech in Tamil
  - Speaker: Vijay (Sarvam AI)
  - Duration: ~30-60 seconds
  - Used when player first clicks the NPC

## Usage

The `/npc/intro` endpoint serves these static audio files.
No AI processing, no TTS generation - just direct file serving for fast playback.

## Adding New NPCs

1. Record/generate the NPC intro audio
2. Save as `{npc_name}_intro.mp3` in `audio/` folder
3. The endpoint will automatically serve it
