@echo off
echo ==============================================
echo    OPENING SAFESIGHT IN VS CODE TERMINALS
echo ==============================================

:: Open the first terminal for AI Engine
code --terminal "cd ai-engine && python src/detection.py"

:: Open the second terminal for Docker
code --terminal "docker-compose up --build"

exit