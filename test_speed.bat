@echo off
REM =======================================================
REM  Model Speed & Latency Benchmark (Windows Command Prompt)
REM =======================================================
setlocal enabledelayedexpansion

set MODEL=qwen2.5:3b
if not "%~1"=="" set MODEL=%~1

echo =======================================================
echo   Benchmarking Local Model: %MODEL%
echo   Endpoint: http://127.0.0.1:11434
echo =======================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [Running Python Benchmark Engine...]
    python test_model_speed.py %MODEL%
    goto end
)

echo [Running Native cURL Benchmark...]
echo Sending prompt to Ollama...
echo.

curl -s -w "\n\nTotal Time Taken: %%{time_total} seconds\nHTTP Status: %%{http_code}\n" -X POST http://127.0.0.1:11434/api/generate -H "Content-Type: application/json" -d "{\"model\": \"%MODEL%\", \"prompt\": \"Hello, describe your capabilities in 1 sentence.\", \"stream\": false}"

:end
echo.
pause
