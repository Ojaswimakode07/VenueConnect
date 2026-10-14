@echo off
setlocal
set "ROOT=%~dp0"

echo ================================================
echo   VenueConnect - starting backend + frontend
echo ================================================
echo.
echo Root folder: %ROOT%
echo.

REM ---- Backend (FastAPI) in its own window ----
start "VenueConnect Backend" cmd /k ^
  "cd /d "%ROOT%backend" ^
  && (if not exist venv (python -m venv venv)) ^
  && call venv\Scripts\activate.bat ^
  && pip install -q -r requirements.txt ^
  && (if not exist venueconnect.db (python -m app.seed)) ^
  && echo. ^
  && echo Backend ready at http://localhost:8000/docs ^
  && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM ---- Frontend (Vite) in its own window ----
start "VenueConnect Frontend" cmd /k ^
  "cd /d "%ROOT%frontend" ^
  && (if not exist node_modules (npm install)) ^
  && npm run dev"

REM ---- Give both servers a few seconds, then open the browser ----
timeout /t 8 /nobreak >nul
start "" "http://localhost:5173/login"

echo.
echo Two new windows opened: one for the backend, one for the frontend.
echo This window can stay open or be closed - it isn't running anything itself.
pause
