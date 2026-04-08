import threading
import time
import webview
import uvicorn

# Import your FastAPI app
from main import app


# -----------------------------
# START FASTAPI SERVER
# -----------------------------
def start_server():
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")


# Run server in background thread
server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()


# -----------------------------
# WAIT FOR SERVER TO START
# -----------------------------
time.sleep(2)


# -----------------------------
# OPEN APP WINDOW (NO BROWSER)
# -----------------------------
webview.create_window(
    title="Smart Study App",
    url="http://127.0.0.1:8000",
    width=1024,
    height=600,
    resizable=True
)

webview.start()