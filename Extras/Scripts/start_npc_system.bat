@echo off
echo ================================================
echo Starting NPC Voice System - Chola World
echo ================================================
echo.
echo Starting FastAPI backend on http://localhost:8000
echo.
echo Once backend starts:
echo 1. Open index.html in your browser
echo 2. Click "இயற்கை" (Nature) to start game
echo 3. Walk near Raja Raja Cholan (he's at position 5, 0, 0)
echo 4. Tooltip will show "Press E to listen"
echo 5. Press E to hear his Tamil introduction
echo.
echo Press Ctrl+C to stop the backend server
echo ================================================
echo.

cd backend
uvicorn main:app --reload

pause
