@echo off
cd /d "%~dp0"

echo ========================================
echo   StoryForge - AI Short Story Generator
echo ========================================
echo.
echo Starting Backend on port 8000 ...
start "StoryForgeBackend" cmd /k "cd /d %~dp0backend && uvicorn app.main:app --reload --port 8000 --host 0.0.0.0"

echo Starting Frontend on port 3000 ...
start "StoryForgeFrontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Backend API Docs : http://localhost:8000/docs
echo Frontend Page   : http://localhost:3000
echo.
echo Both services launched. Close this window when done.
pause
