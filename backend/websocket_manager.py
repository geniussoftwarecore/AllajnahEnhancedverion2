from fastapi import WebSocket
from typing import Dict, List, Set
import json


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
        self.role_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int, user_role: str):
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        
        if user_role not in self.role_connections:
            self.role_connections[user_role] = []
        self.role_connections[user_role].append(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: int, user_role: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        if user_role in self.role_connections:
            if websocket in self.role_connections[user_role]:
                self.role_connections[user_role].remove(websocket)
            if not self.role_connections[user_role]:
                del self.role_connections[user_role]
    
    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    pass
    
    async def send_to_role(self, message: dict, role: str):
        if role in self.role_connections:
            for connection in self.role_connections[role]:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    pass
    
    async def broadcast(self, message: dict):
        for connections in self.active_connections.values():
            for connection in connections:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    pass


manager = ConnectionManager()
