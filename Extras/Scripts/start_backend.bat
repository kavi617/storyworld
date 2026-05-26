@echo off
echo ========================================
echo தமிழி AI - Backend Server
echo ========================================
echo.
echo Starting FastAPI backend on port 8000...
echo.
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
