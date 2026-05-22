@echo off
echo Starting MuAIlim Backend...
echo.
if not exist .env (
  echo ERROR: .env file not found!
  echo Copy .env.example to .env and fill in your keys.
  pause
  exit /b 1
)
call venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8002
