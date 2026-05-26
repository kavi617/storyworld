@echo off
echo ========================================================
echo Installing NPC Voice System (Whisper STT)
echo ========================================================
echo.
echo This will install:
echo - OpenAI Whisper (speech recognition)
echo - PyTorch (model inference)
echo - FFmpeg (audio processing)
echo.
echo Size: ~500MB total
echo Time: ~3-5 minutes
echo.
pause
echo.
echo ========================================================
echo Step 1: Installing dependencies...
echo ========================================================
echo.

cd backend
pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo ========================================================
    echo ERROR: Installation failed!
    echo ========================================================
    echo.
    echo Common fixes:
    echo 1. Make sure Python is installed (python --version)
    echo 2. Update pip: python -m pip install --upgrade pip
    echo 3. Install Visual C++ Build Tools if on Windows
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo Step 2: Verifying Whisper installation...
echo ========================================================
echo.

python -c "import whisper; print('✅ Whisper installed successfully')"

if errorlevel 1 (
    echo.
    echo ❌ Whisper verification failed!
    echo Please check the error above.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo Step 3: Testing backend health...
echo ========================================================
echo.

start /B uvicorn main:app --reload
timeout /t 5 /nobreak >nul

curl -s http://localhost:8000/health >nul 2>&1

if errorlevel 1 (
    echo ⚠️  Backend not responding yet (this is OK)
    echo You can start it manually with: uvicorn main:app --reload
) else (
    echo ✅ Backend is running!
)

echo.
echo ========================================================
echo ✅ Installation Complete!
echo ========================================================
echo.
echo What's installed:
echo ✅ OpenAI Whisper (speech-to-text)
echo ✅ PyTorch (AI model)
echo ✅ FFmpeg (audio processing)
echo ✅ FastAPI dependencies
echo.
echo ========================================================
echo Next Steps:
echo ========================================================
echo.
echo 1. Start backend:
echo    cd backend
echo    uvicorn main:app --reload
echo.
echo 2. Test STT endpoint:
echo    python test_stt.py test_audio.wav
echo.
echo 3. Open game and press V key to talk to NPC!
echo.
echo ========================================================
echo Documentation:
echo ========================================================
echo.
echo - STT_IMPLEMENTATION_SUMMARY.md   (Quick overview)
echo - VOICE_SYSTEM_SETUP.md           (Setup guide)
echo - backend/STT_INTEGRATION_GUIDE.md (Full docs)
echo.
pause
