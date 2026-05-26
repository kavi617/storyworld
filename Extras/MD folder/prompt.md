I am building a backend for a game NPC voice system using Sarvam AI Bulbul v3 Text-to-Speech API.
Everything must be handled in the backend (Python). The frontend only sends requests and plays audio.

🎮 NPC SYSTEM: Raja Raja Cholan

The NPC has TWO modes:

📖 MODE 1: Story Mode (Prewritten)
When the player interacts with the NPC, the backend loads a prewritten story file:
C:\kproject\storyworld\story\raja_raja_cholan.md
The backend converts this text into speech using:
Model: bulbul:v3
Speaker: "vijay"
Language: ta-IN
Output is saved or streamed as output.mp3
Frontend plays the returned audio
💬 MODE 2: Q&A Mode (Dynamic AI)
Player can send a text question to the NPC
Backend sends the question to an AI model (LLM)
AI generates a response in the personality of Raja Raja Cholan
That response is converted into speech using:
Bulbul v3 TTS
Speaker: "vijay"
Audio is returned to frontend
🔁 FLOW (Backend Only)

Player Input → Backend API → (Story File OR LLM Response) → Bulbul v3 TTS → Audio Output → Frontend Playback

🧪 TEST SETUP

I already have a test_api.py file and want to expand it into a full backend system.

⚙️ REQUIREMENTS
Use Sarvam AI Bulbul v3 for TTS only
Speaker must always be "vijay" for Raja Raja Cholan
Backend must handle both story mode and Q&A mode
No frontend logic except playing audio
Clean API structure (ready for game integration)
Also create a folder called backend and do all the backend work there. 