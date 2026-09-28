# Client Data Intelligence Agent

Welcome! This project is an AI-powered Data Visualization Agent. It takes natural language queries (e.g., "show me the first 8 clients' revenue"), strictly queries a local SQLite database, passes the deterministic data to a local Small Language Model (Qwen 2.5:1.5b), and dynamically generates beautiful charts on the frontend. 

It is designed to be 100% private, running entirely on your local machine using Ollama.

---

## 🛠️ Step 1: Prerequisites (Do this first)

Before downloading or running any code, you need two pieces of software installed on your computer:

1. **Node.js (Version 18 or higher)**
   - Download from [nodejs.org](https://nodejs.org/).
   - Install it using the default settings.
2. **Ollama (For running the AI model)**
   - Download from [ollama.com/download](https://ollama.com/download).
   - Install it, and **make sure the Ollama app is open and running in the background** (you should see its icon in your system tray on Windows, or menu bar on Mac).

---

## 📥 Step 2: How to Download this Code

1. Scroll to the top of this GitHub repository page.
2. Click the green **"<> Code"** button.
3. Click **"Download ZIP"**.
4. Once downloaded, **extract/unzip** the folder to an easily accessible location on your computer (for example, your Desktop or Documents folder). 
5. You should now have a folder named `AGENTIC-DB-Assignment-main`. Open it, and inside you will see the `client-agent-assignment` project folder.

---

## 🚀 Step 3: Running the Application (The Easy Way)

We have created an automated script that handles the entire setup process for you (installing dependencies, downloading the AI model, and starting the servers).

### **Option A: Using Windows File Explorer (Simplest)**
1. Open the extracted folder in your File Explorer.
2. Find the file named `start.bat`.
3. **Double-click** `start.bat`.
4. A terminal window will open. It will automatically check your prerequisites, download the AI model if needed, install packages, and start the app. 
5. Wait until you see `VITE ready` and `Server running on http://localhost:5000`.
6. Open your web browser and go to: **[http://localhost:5173](http://localhost:5173)**

### **Option B: Using VS Code or a Terminal (Recommended for Developers)**
1. Open **Visual Studio Code** (or any terminal/command prompt).
2. Go to `File` > `Open Folder...` and select the extracted project folder.
3. Open a new terminal inside VS Code (`Terminal` > `New Terminal`).
4. Ensure your terminal path is inside the project root. It should look something like this:
   `C:\Users\YourName\Desktop\AGENTIC-DB-Assignment\client-agent-assignment>`
5. Run the startup script by typing:
   - **On Windows:** `.\start.bat`
   - **On Mac/Linux:** `chmod +x start.sh` then `./start.sh`
6. Once the terminal says the servers are running, click the link to open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## ⚙️ Manual Setup (If the script fails)

If you prefer to run the commands manually, open a terminal in the root folder and run these exactly in order:

1. **Install root dependencies:**
   `npm install`
2. **Install frontend and backend dependencies:**
   `npm run install-all`
3. **Download the AI Model (this is a ~1GB download):**
   `ollama pull qwen2.5:1.5b`
4. **Initialize the SQLite Database:**
   `npm run init-db`
5. **Start the app (Frontend + Backend simultaneously):**
   `npm run dev`

---

## 🔌 Ports Used

Ensure these ports are free on your machine before running:
- **5000** - Express Backend API
- **5173** - Vite Frontend (React UI)
- **11434** - Ollama AI Server

---

## 🗄️ Database Schema

The database (`backend/clients.db`) uses SQLite and contains a single `clients` table with realistic seed data:
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `name`: TEXT NOT NULL
- `email`: TEXT NOT NULL UNIQUE
- `company`: TEXT
- `industry`: TEXT
- `revenue`: REAL
- `region`: TEXT
- `status`: TEXT (Active / Pending / Churned)
- `joined_date`: TEXT NOT NULL

**Resetting the Database:**
If you ever need to reset the data back to its original 30 seed rows, simply open a terminal in the project folder and run:
`npm run init-db`

---

## 🛠️ Troubleshooting

### "Ollama is not running or not reachable"
- Make sure you have installed Ollama and that the Ollama app is currently open and running in your system tray/menu bar.
- Test it by opening your browser to `http://localhost:11434/`. It should say "Ollama is running".

### "Model request failed" or "Model qwen2.5:1.5b not found"
- Open a terminal and run `ollama pull qwen2.5:1.5b`. The model is about 1GB, so it may take a minute depending on your internet connection.

### "EADDRINUSE: address already in use :::5000" (Port Conflict)
- Another application on your computer is already using port 5000. 
- You can create a file named `.env` in the `backend/` folder and change the port: `PORT=5001`.

### `better-sqlite3` Install Failures / Build Errors
- The SQLite library uses native C bindings. On Windows, if `npm install` fails on `better-sqlite3`, you may need the visual studio build tools: `npm install -g windows-build-tools`. (Note: Prebuilt binaries are usually available for most modern Node versions, so this is rare).
