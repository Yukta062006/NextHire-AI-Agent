from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket.manager import ws_manager

router = APIRouter(prefix="/api/ws", tags=["Realtime"])

@router.websocket("/interview/{interview_id}")
async def websocket_endpoint(websocket: WebSocket, interview_id: str):
    """Handle live WebSocket connection for an interview session."""
    await ws_manager.connect(websocket, interview_id)
    try:
        while True:
            # We keep the connection alive.
            # In a real-world app, the client might send messages like heartbeat
            # or live audio/video. We just receive and print/ignore, or handle ping.
            data = await websocket.receive_text()
            # Simple heartbeat / echo response
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, interview_id)
    except Exception:
        ws_manager.disconnect(websocket, interview_id)
