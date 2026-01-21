import json, time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware




app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

# rooms: conversation_id -> set of websockets
rooms = {}
# ws -> user_id
ws_user = {}
# user_id -> ws
user_ws = {}

def now_ms():
    return int(time.time() * 1000)

async def ws_send(ws: WebSocket, type_: str, data: dict, request_id=None):
    await ws.send_text(json.dumps({
        "type": type_,
        "data": data,
        "request_id": request_id,
        "ts": now_ms()
    }))

async def broadcast(conversation_id: str, type_: str, data: dict):
    for ws in list(rooms.get(conversation_id, set())):
        try:
            await ws_send(ws, type_, data)
        except:
            pass

@app.get("/health")
def health():
    return {"status": "ok"}

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()

    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except:
                await ws_send(ws, "error", {"code": "BAD_JSON", "message": "Invalid JSON"})
                continue

            type_ = msg.get("type")
            data = msg.get("data", {}) or {}
            request_id = msg.get("request_id")

            # --- AUTH ---
            if type_ == "auth":
                user_id = data.get("user_id")
                if not user_id:
                    await ws_send(ws, "error", {"code": "NO_USER", "message": "user_id required"}, request_id)
                    continue

                ws_user[ws] = user_id
                user_ws[user_id] = ws

                await ws_send(ws, "auth_ok", {"user_id": user_id}, request_id)
                # presence broadcast (demo: broadcast to all connected users)
                for other_ws in list(ws_user.keys()):
                    await ws_send(other_ws, "presence_update", {"user_id": user_id, "online": True, "last_seen": None})
                continue

            # require auth for below
            if ws not in ws_user:
                await ws_send(ws, "error", {"code": "UNAUTH", "message": "Please auth first"}, request_id)
                continue

            sender_id = ws_user[ws]

            # --- JOIN ROOM ---
            if type_ == "join":
                conv_id = data.get("conversation_id")
                if not conv_id:
                    await ws_send(ws, "error", {"code": "NO_CONV", "message": "conversation_id required"}, request_id)
                    continue
                rooms.setdefault(conv_id, set()).add(ws)
                await ws_send(ws, "join_ok", {"conversation_id": conv_id}, request_id)
                continue

            # --- SEND MESSAGE ---
            if type_ == "send_message":
                conv_id = data.get("conversation_id")
                client_msg_id = data.get("client_msg_id")
                msg_type = data.get("msg_type", "text")
                text = data.get("text", "")

                if not conv_id or not client_msg_id:
                    await ws_send(ws, "error", {"code": "BAD_REQ", "message": "conversation_id + client_msg_id required"}, request_id)
                    continue

                # demo server_msg_id
                server_msg_id = f"m_{now_ms()}"

                message = {
                    "id": server_msg_id,
                    "sender_id": sender_id,
                    "msg_type": msg_type,
                    "text": text,
                    "created_at": now_ms()
                }

                # ack to sender
                await ws_send(ws, "send_ack", {
                    "conversation_id": conv_id,
                    "client_msg_id": client_msg_id,
                    "server_msg_id": server_msg_id,
                    "status": "sent",
                    "created_at": message["created_at"]
                }, request_id)

                # broadcast new_message to room
                await broadcast(conv_id, "new_message", {
                    "conversation_id": conv_id,
                    "message": message
                })
                continue

            # --- RECEIPT ---
            if type_ == "receipt":
                # demo broadcast, DB later
                conv_id = data.get("conversation_id")
                message_id = data.get("message_id")
                status = data.get("status")  # received/seen
                if conv_id and message_id and status:
                    await broadcast(conv_id, "receipt_update", {
                        "conversation_id": conv_id,
                        "message_id": message_id,
                        "user_id": sender_id,
                        "status": status,
                        "updated_at": now_ms()
                    })
                continue

            await ws_send(ws, "error", {"code": "UNKNOWN_TYPE", "message": f"Unknown type: {type_}"}, request_id)

    except WebSocketDisconnect:
        user_id = ws_user.get(ws)
        if user_id:
            ws_user.pop(ws, None)
            user_ws.pop(user_id, None)
            # remove from rooms
            for conv_id in list(rooms.keys()):
                rooms[conv_id].discard(ws)

            # presence offline (demo broadcast)
            for other_ws in list(ws_user.keys()):
                await ws_send(other_ws, "presence_update", {"user_id": user_id, "online": False, "last_seen": now_ms()})
