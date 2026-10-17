@echo off
setlocal
echo ========================================================
echo   Auto-Launching Google Chrome with CDP Remote Debugging
echo ========================================================
echo.

set CHROME_EXE=""

if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set CHROME_EXE="C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set CHROME_EXE="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set CHROME_EXE="%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
) else (
    set CHROME_EXE=chrome.exe
)

echo Located Chrome at: %CHROME_EXE%
echo Launching with Remote Debugging Port 9222...

if not exist "%TEMP%\agent-chrome-debug" mkdir "%TEMP%\agent-chrome-debug"

start "" %CHROME_EXE% --remote-debugging-port=9222 --user-data-dir="%TEMP%\agent-chrome-debug" --no-first-run --no-default-browser-check "https://www.youtube.com"

echo.
echo [SUCCESS] Chrome launched on port 9222!
echo You can now run computer-use agent tasks, and tabs will open live in this window.
echo.
pause
