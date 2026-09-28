# Client Data Intelligence Agent

This project is an AI-powered Data Visualization Agent. It takes natural language queries (e.g., "show me the first 8 clients' revenue"), strictly queries a local SQLite database, passes the deterministic data to a local Small Language Model (Qwen 2.5:1.5b), and dynamically generates beautiful charts on the frontend. 

It is designed to be 100% private, running entirely on your local machine using Ollama.

## Prerequisites

1. **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
2. **Ollama**: Download from [ollama.com](https://ollama.com/download)

Ollama must be running in the background before starting the app.

## Quick Start (One Command)

The quickest way to get started on a fresh machine:

**On Windows:**
Double click `start.bat` or run:
```cmd
start.bat
```

**On Mac/Linux:**
```bash
chmod +x start.sh
./start.sh
```

These scripts will automatically check your prerequisites, download the `qwen2.5:1.5b` model if you don't have it, install all dependencies, and launch both servers.

## Manual Steps

If you prefer to run things manually:

1. **Install root dependencies (concurrently):**
   ```bash
   npm install
   ```
2. **Install frontend and backend dependencies:**
   ```bash
   npm run install-all
   ```
3. **Pull the AI Model:**
   ```bash
   ollama pull qwen2.5:1.5b
   ```
4. **Initialize the Database:**
   ```bash
   npm run init-db
   ```
5. **Start the app (Frontend + Backend):**
   ```bash
   npm run dev
   ```

## Ports Used

Ensure these ports are free on your machine:
- **5000** - Express Backend API
- **5173** - Vite Frontend (React)
- **11434** - Ollama AI Server

## Database Schema (SQLite)

The database (`backend/clients.db`) contains a single `clients` table:
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `name`: TEXT NOT NULL
- `email`: TEXT NOT NULL UNIQUE
- `company`: TEXT
- `industry`: TEXT
- `revenue`: REAL
- `region`: TEXT
- `status`: TEXT (Active / Pending / Churned)
- `joined_date`: TEXT NOT NULL

### Resetting the Database
If you ever need to reset the data back to its original 30 seed rows, run:
```bash
npm run init-db
```
This will safely overwrite `clients.db` with a fresh copy.

## Troubleshooting

### "Ollama is not running or not reachable"
- Make sure you have installed Ollama and that the Ollama app is currently open and running in your system tray/menu bar.
- Test it by opening your browser to `http://localhost:11434/`. It should say "Ollama is running".

### "Model request failed" or "Model qwen2.5:1.5b not found"
- Open a terminal and run `ollama pull qwen2.5:1.5b`. The model is about 1GB, so it may take a minute depending on your internet connection.

### "EADDRINUSE: address already in use :::5000" (Port Conflict)
- Another application is using port 5000. 
- You can create a file named `.env` in the `backend/` folder and change the port: `PORT=5001`.

### `better-sqlite3` Install Failures / Build Errors
- The SQLite library uses native C bindings. On Windows, if `npm install` fails on `better-sqlite3`, you may need the visual studio build tools: `npm install -g windows-build-tools`. (Note: Prebuilt binaries are usually available for most modern Node versions, so this is rare).
