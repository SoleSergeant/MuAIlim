@echo off
title MuAIlim Launcher
color 0A
echo.
echo  ███╗   ███╗██╗   ██╗ █████╗ ██╗██╗     ██╗███╗   ███╗
echo  ████╗ ████║██║   ██║██╔══██╗██║██║     ██║████╗ ████║
echo  ██╔████╔██║██║   ██║███████║██║██║     ██║██╔████╔██║
echo  ██║╚██╔╝██║██║   ██║██╔══██║██║██║     ██║██║╚██╔╝██║
echo  ██║ ╚═╝ ██║╚██████╔╝██║  ██║██║███████╗██║██║ ╚═╝ ██║
echo  ╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝╚══════╝╚═╝╚═╝     ╚═╝
echo.
echo  AI-powered exam prep for Uzbekistan
echo  ─────────────────────────────────────────────────────
echo.

echo  [1/2] Starting backend on port 8002...
start "MuAIlim Backend" /min cmd /k "cd /d %~dp0backend && call venv\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8002"

timeout /t 4 /nobreak >nul

echo  [2/2] Starting Expo on port 8090...
start "MuAIlim Expo" cmd /k "cd /d %~dp0app && npx expo start --port 8090 --lan"

echo.
echo  ─────────────────────────────────────────────────────
echo  Backend  ^>  http://192.168.51.64:8002
echo  Expo     ^>  exp://192.168.51.64:8090
echo  ─────────────────────────────────────────────────────
echo  Scan exp://192.168.51.64:8090 in Expo Go
echo.
echo  Both servers are running in separate windows.
echo  Close those windows to stop the servers.
echo.
pause
