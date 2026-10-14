@echo off
setlocal
set "ROOT=%~dp0"

echo ================================================
echo   VenueConnect - RESET (fresh DB + fresh cache)
echo ================================================
echo This deletes the old database and Vite cache so
echo the new 80-venue catalog and new pages load clean.
echo.

if exist "%ROOT%backend\venueconnect.db" (
  del /f /q "%ROOT%backend\venueconnect.db"
  echo Deleted old database.
) else (
  echo No existing database found - nothing to delete.
)

if exist "%ROOT%frontend\node_modules\.vite" (
  rmdir /s /q "%ROOT%frontend\node_modules\.vite"
  echo Cleared Vite cache.
)

echo.
call "%ROOT%RUN_ME.bat"
