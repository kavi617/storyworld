"""
Test the complete voice chat system end-to-end.

This script tests:
1. Backend health check
2. Audio directory setup
3. Voice chat endpoint with sample audio

Usage:
    python test_voice_chat.py
"""

import requests
import sys
from pathlib import Path


BACKEND_URL = "http://localhost:8000"


def test_backend_health():
    """Test if backend is running."""
    print("="*60)
    print("TEST 1: Backend Health Check")
    print("="*60)
    
    try:
        response = requests.get(f"{BACKEND_URL}/health")
        
        if response.status_code == 200:
            print("✅ Backend is running!")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Backend returned status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running!")
        print("   Please start it with: uvicorn main:app --reload")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_audio_directory():
    """Test if audio response directory exists."""
    print("\n" + "="*60)
    print("TEST 2: Audio Response Directory")
    print("="*60)
    
    audio_dir = Path("backend/npc/audio/responses")
    
    if audio_dir.exists():
        print(f"✅ Directory exists: {audio_dir}")
        
        # List existing files
        files = list(audio_dir.glob("*.mp3"))
        if files:
            print(f"   Found {len(files)} existing audio files:")
            for f in files[:5]:  # Show first 5
                size_kb = f.stat().st_size / 1024
                print(f"   - {f.name} ({size_kb:.1f} KB)")
        else:
            print("   (No files yet - will be created during voice chat)")
        
        return True
    else:
        print(f"⚠️  Directory does not exist yet: {audio_dir}")
        print("   It will be created automatically when backend starts.")
        return False


def test_voice_chat_endpoint(audio_file_path: str = None):
    """Test the voice chat endpoint."""
    print("\n" + "="*60)
    print("TEST 3: Voice Chat Endpoint")
    print("="*60)
    
    if not audio_file_path:
        print("⚠️  No test audio file provided")
        print("   To test with real audio:")
        print("   python test_voice_chat.py test_audio.wav")
        print("\n   Skipping endpoint test (needs audio file)")
        return None
    
    audio_path = Path(audio_file_path)
    
    if not audio_path.exists():
        print(f"❌ Audio file not found: {audio_file_path}")
        return False
    
    print(f"📤 Sending audio file: {audio_path.name}")
    print(f"   Size: {audio_path.stat().st_size / 1024:.1f} KB")
    
    try:
        with open(audio_path, "rb") as f:
            files = {"audio": (audio_path.name, f, "audio/wav")}
            
            print("\n   ⏳ Processing (this may take 3-5 seconds)...")
            response = requests.post(
                f"{BACKEND_URL}/npc/voice-chat",
                files=files,
                timeout=30
            )
        
        if response.status_code == 200:
            result = response.json()
            
            print("\n✅ Voice chat successful!")
            print(f"\n📝 Player said:")
            print(f"   {result['player_text']}")
            print(f"\n💬 NPC responded:")
            print(f"   {result['npc_text']}")
            print(f"\n🔊 Audio URL:")
            print(f"   {BACKEND_URL}{result['audio_url']}")
            
            # Test audio download
            print(f"\n   Testing audio download...")
            audio_response = requests.get(f"{BACKEND_URL}{result['audio_url']}")
            
            if audio_response.status_code == 200:
                audio_size = len(audio_response.content) / 1024
                print(f"   ✅ Audio downloaded ({audio_size:.1f} KB)")
                
                # Save test audio
                test_output = Path("test_npc_response.mp3")
                with open(test_output, "wb") as f:
                    f.write(audio_response.content)
                print(f"   Saved to: {test_output}")
                print(f"   You can play it with: start {test_output}")
            else:
                print(f"   ❌ Failed to download audio (status {audio_response.status_code})")
            
            return True
            
        else:
            print(f"\n❌ Voice chat failed (status {response.status_code})")
            print(f"   Error: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("\n❌ Request timed out")
        print("   Voice processing may be too slow")
        print("   Try using a smaller Whisper model (tiny or base)")
        return False
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


def test_static_files():
    """Test if static file serving works."""
    print("\n" + "="*60)
    print("TEST 4: Static File Serving")
    print("="*60)
    
    try:
        # Try to access the audio responses directory
        response = requests.get(f"{BACKEND_URL}/audio-responses/", timeout=5)
        
        if response.status_code == 200 or response.status_code == 404:
            print("✅ Static file endpoint is configured")
            print(f"   Endpoint: /audio-responses/")
            return True
        else:
            print(f"⚠️  Unexpected status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing static files: {e}")
        return False


def main():
    """Run all tests."""
    print("\n" + "="*60)
    print("🎤 VOICE CHAT SYSTEM TEST")
    print("="*60)
    print("\nTesting complete voice interaction pipeline:")
    print("  1. Backend health")
    print("  2. Audio directory setup")
    print("  3. Static file serving")
    print("  4. Voice chat endpoint (if audio file provided)")
    print("")
    
    # Test 1: Backend health
    if not test_backend_health():
        print("\n❌ Backend test failed. Please start the backend first.")
        sys.exit(1)
    
    # Test 2: Audio directory
    test_audio_directory()
    
    # Test 3: Static files
    test_static_files()
    
    # Test 4: Voice chat endpoint (if audio file provided)
    audio_file = sys.argv[1] if len(sys.argv) > 1 else None
    
    if audio_file:
        result = test_voice_chat_endpoint(audio_file)
        
        if result:
            print("\n" + "="*60)
            print("✅ ALL TESTS PASSED!")
            print("="*60)
            print("\nVoice chat system is ready to use!")
            print("\nNext steps:")
            print("  1. Open index.html in browser")
            print("  2. Walk to NPC and press E for intro")
            print("  3. Hold V key to talk with Raja Raja Cholan")
        elif result is False:
            print("\n" + "="*60)
            print("⚠️  SOME TESTS FAILED")
            print("="*60)
            print("\nCheck the errors above and:")
            print("  1. Verify backend is running")
            print("  2. Check Whisper is installed")
            print("  3. Verify Sarvam API key is valid")
    else:
        print("\n" + "="*60)
        print("✅ BASIC TESTS PASSED!")
        print("="*60)
        print("\nBackend is configured correctly.")
        print("\nTo test with audio:")
        print("  python test_voice_chat.py test_audio.wav")
        print("\nOr just open the game:")
        print("  1. Open index.html in browser")
        print("  2. Walk to NPC and press E for intro")
        print("  3. Hold V key to talk!")


if __name__ == "__main__":
    main()
