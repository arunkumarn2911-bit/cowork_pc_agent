@echo off
setlocal
echo ========================================================
echo   Starting Cowork PC Agent + Debug Chrome (Windows)
echo ========================================================
echo.

echo 1. Launching Chrome on Port 9222...
call launch_chrome_debug.bat

echo 2. Starting Node / Python Agent Services...
npm run dev
