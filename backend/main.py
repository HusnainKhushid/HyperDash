import cv2
import asyncio
import threading
import json
import time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from gesture import GestureRecognizer

app = FastAPI()

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error sending to client: {e}")

manager = ConnectionManager()

# Global Gesture State
latest_gesture = None
gesture_lock = threading.Lock()

def gesture_loop():
    """
    Runs the gesture recognition in a background thread.
    Captures frames, processes them, and updates the global state.
    """
    global latest_gesture
    
    cap = cv2.VideoCapture(0)
    recognizer = GestureRecognizer()
    
    last_action_time = 0
    current_action = None
    
    print("Gesture Loop Started...")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to read frame")
            time.sleep(1)
            continue
            
        frame = cv2.flip(frame, 1)
        
        # Process frame
        gesture, debug_info = recognizer.process(frame)
        current_time = time.time()
        
        # Debounce / Cooldown Logic
        if gesture:
            # Only trigger if enough time has passed since ANY last action
            if current_time - last_action_time > 1.0:
                print(f"BACKEND DETECTED: {gesture}")
                
                with gesture_lock:
                    latest_gesture = gesture
                
                current_action = gesture
                last_action_time = current_time
        
        # Optional: Sleep slightly to save CPU if needed, but CV2 is blocking anyway usually
        # time.sleep(0.01) 

# Start Gesture Thread
gesture_thread = threading.Thread(target=gesture_loop, daemon=True)
gesture_thread.start()

@app.websocket("/ws/gestures")
async def websocket_endpoint(websocket: WebSocket):
    global latest_gesture
    await manager.connect(websocket)
    try:
        last_sent_gesture = None
        while True:
            # Check for new gesture to send
            current_gesture = None
            with gesture_lock:
                if latest_gesture:
                    current_gesture = latest_gesture
                    # Reset after reading so we don't send it multiple times
                    # Or we can just send it once and clear it.
                    # Let's clear it here to ensure it's a one-time event
                    latest_gesture = None 
            
            if current_gesture:
                await manager.broadcast({"gesture": current_gesture})
            
            # Small sleep to prevent tight loop
            await asyncio.sleep(0.1)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
def read_root():
    return {"status": "Infotainment Backend Running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
