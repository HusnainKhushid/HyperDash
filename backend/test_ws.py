import asyncio
import websockets

async def test_connection():
    uri = "ws://localhost:8000/ws/gestures"
    try:
        async with websockets.connect(uri) as websocket:
            print("Successfully connected to WebSocket!")
            while True:
                message = await websocket.recv()
                print(f"Received: {message}")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
