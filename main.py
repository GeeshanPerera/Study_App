from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import json
import os
from pathlib import Path

app = FastAPI()

# -----------------------------
# PATH SETUP (IMPORTANT)
# -----------------------------
BASE_DIR = Path(__file__).resolve().parent
DIST_DIR = BASE_DIR / "dist"
ASSETS_DIR = DIST_DIR / "assets"
DATA_FILE = BASE_DIR / "data.json"

# -----------------------------
# CHECK DIST EXISTS
# -----------------------------
if not DIST_DIR.exists():
    raise RuntimeError("❌ 'dist' folder not found. Run 'npm run build' first.")

# -----------------------------
# SERVE STATIC FILES (VITE)
# -----------------------------
if ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")

# -----------------------------
# CREATE JSON FILE IF NOT EXISTS
# -----------------------------
if not DATA_FILE.exists():
    with open(DATA_FILE, "w") as f:
        json.dump({"tasks": [], "behavior_logs": []}, f, indent=4)

# -----------------------------
# HELPER FUNCTIONS
# -----------------------------
def load_data():
    with open(DATA_FILE, "r") as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)

# -----------------------------
# API ROUTES
# -----------------------------

@app.get("/api/tasks")
def get_tasks():
    return load_data()

@app.post("/api/tasks")
async def add_task(request: Request):
    try:
        data = load_data()
        new_task = await request.json()

        data["tasks"].append(new_task)
        save_data(data)

        return JSONResponse({"status": "task added"})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.put("/api/tasks/{task_id}")
async def update_task(task_id: str, request: Request):
    try:
        data = load_data()
        updates = await request.json()
        tasks = data.get("tasks", [])
        updated = False

        for i, task in enumerate(tasks):
            if task.get("id") == task_id:
                tasks[i] = {**task, **updates, "id": task_id}
                updated = True
                break

        if not updated:
            return JSONResponse({"error": "Task not found"}, status_code=404)

        data["tasks"] = tasks
        save_data(data)
        return JSONResponse({"status": "task updated"})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str):
    try:
        data = load_data()
        tasks = data.get("tasks", [])
        next_tasks = [t for t in tasks if t.get("id") != task_id]

        if len(next_tasks) == len(tasks):
            return JSONResponse({"error": "Task not found"}, status_code=404)

        data["tasks"] = next_tasks
        save_data(data)
        return JSONResponse({"status": "task deleted"})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/behavior")
async def add_behavior(request: Request):
    try:
        data = load_data()
        new_log = await request.json()

        data["behavior_logs"].append(new_log)
        save_data(data)

        return JSONResponse({"status": "behavior logged"})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# -----------------------------
# SERVE FRONTEND (SPA SUPPORT)
# -----------------------------

@app.get("/{full_path:path}")
def serve_react(full_path: str):
    file_path = DIST_DIR / full_path

    # If file exists (JS, CSS, images), serve it
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)

    # Otherwise return index.html (React routing)
    return FileResponse(DIST_DIR / "index.html")