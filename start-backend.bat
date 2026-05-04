@echo off
cd /d "%~dp0backend"
echo Starting StoryForge Backend on port 8000 ...
echo API Docs: http://localhost:8000/docs
echo.
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
pause
