@echo off
cd /d "%~dp0frontend"
echo Starting StoryForge Frontend on port 3000 ...
echo Page: http://localhost:3000
echo.
npm run dev
pause
