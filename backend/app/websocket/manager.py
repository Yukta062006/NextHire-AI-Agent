"""
WebSocket Connection Manager for real-time interview events.
"""
import json
from fastapi import WebSocket
from typing import Dict, List


class ConnectionManager:
    """Manages WebSocket connections per interview session."""

    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, interview_id: str):
        await websocket.accept()
        if interview_id not in self.active_connections:
            self.active_connections[interview_id] = []
        self.active_connections[interview_id].append(websocket)

    def disconnect(self, websocket: WebSocket, interview_id: str):
        if interview_id in self.active_connections:
            self.active_connections[interview_id] = [
                conn for conn in self.active_connections[interview_id] if conn != websocket
            ]
            if not self.active_connections[interview_id]:
                del self.active_connections[interview_id]

    async def send_event(self, interview_id: str, event_type: str, data: dict):
        """Send an event to all connected clients for an interview."""
        message = json.dumps({"event": event_type, "data": data})
        if interview_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[interview_id]:
                try:
                    await connection.send_text(message)
                except Exception:
                    disconnected.append(connection)
            for conn in disconnected:
                self.disconnect(conn, interview_id)

    async def broadcast(self, event_type: str, data: dict):
        """Broadcast to all connections across all interviews."""
        message = json.dumps({"event": event_type, "data": data})
        for interview_id in list(self.active_connections.keys()):
            for connection in self.active_connections[interview_id]:
                try:
                    await connection.send_text(message)
                except Exception:
                    pass


# Singleton instance
ws_manager = ConnectionManager()
