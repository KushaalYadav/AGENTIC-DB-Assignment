@echo off
setlocal enabledelayedexpansion

echo Checking prerequisites...

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH.
    echo Please download and install Node.js 18+ from https://nodejs.org/
    exit /b 1
)

:: Check Ollama is reachable
curl -s http://localhost:11434 >nul
if %errorlevel% neq 0 (
    echo [ERROR] Ollama is not running or not reachable at http://localhost:11434.
    echo Please make sure Ollama is installed and running.
    echo Download link: https://ollama.com/download
    exit /b 1
)

:: Check if qwen2.5:1.5b is pulled
echo Checking local model qwen2.5:1.5b...
ollama list | findstr "qwen2.5:1.5b" >nul
if %errorlevel% neq 0 (
    echo Model qwen2.5:1.5b not found locally. Pulling now...
    ollama pull qwen2.5:1.5b
)

:: Check if node_modules exists, if not run install-all
if not exist "node_modules\" (
    echo node_modules not found. Installing dependencies...
    call npm install
    call npm run install-all
)

echo Starting application...
call npm run dev
