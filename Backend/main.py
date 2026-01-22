import json, time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from models import MessageModel, ConversationModel, UserModel, FriendModel
from bson import ObjectId
from db import db

conversations_collection = db['conversations']

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
    try:
        await ws.send_text(json.dumps({
            "type": type_,
            "data": data,
            "request_id": request_id,
            "ts": now_ms()
        }))
    except:
        pass  # ← SỬA: Bỏ qua nếu WebSocket đã đóng

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

                # Auto-create user nếu chưa tồn tại
                existing_user = UserModel.get_user(user_id)
                if not existing_user:
                    UserModel.create_user(user_id=user_id, username=user_id)

                ws_user[ws] = user_id
                user_ws[user_id] = ws

                await ws_send(ws, "auth_ok", {"user_id": user_id}, request_id)
                
                # ← SỬA: Chỉ broadcast đến WebSocket ĐANG MỞ
                for other_ws in list(ws_user.keys()):
                    if other_ws.client_state.name == "CONNECTED":  # Kiểm tra trạng thái
                        try:
                            await ws_send(other_ws, "presence_update", {"user_id": user_id, "online": True, "last_seen": None})
                        except:
                            pass
                continue

            # require auth for below
            if ws not in ws_user:
                await ws_send(ws, "error", {"code": "UNAUTH", "message": "Please auth first"}, request_id)
                continue

            sender_id = ws_user[ws]

            # --- GET OR CREATE DIRECT CONVERSATION ---
            if type_ == "get_direct_conversation":
                other_user_id = data.get("other_user_id")
                if not other_user_id:
                    await ws_send(ws, "error", {"code": "NO_USER", "message": "other_user_id required"}, request_id)
                    continue
                
                # Kiểm tra user có tồn tại không
                other_user = db.users.find_one({"_id": other_user_id})
                if not other_user:
                    await ws_send(ws, "error", {
                        "code": "USER_NOT_FOUND", 
                        "message": f"User '{other_user_id}' không tồn tại!"
                    }, request_id)
                    continue
                
                # Kiểm tra không nhắn tin với chính mình
                if other_user_id == sender_id:
                    await ws_send(ws, "error", {
                        "code": "SELF_CHAT",
                        "message": "Bạn không thể nhắn tin với chính mình!"
                    }, request_id)
                    continue
                
                conv = ConversationModel.create_or_get_direct_conversation(sender_id, other_user_id, initiator_id=sender_id)
                
                # Nếu tạo mới conversation với người lạ, thông báo cho người nhận
                if conv.get('status') == 'pending' and conv.get('initiator') == sender_id:
                    # Gửi thông báo cho người nhận về conversation mới
                    recipient_ws = user_ws.get(other_user_id)
                    if recipient_ws:
                        await ws_send(recipient_ws, "new_conversation", {"conversation": conv})
                
                await ws_send(ws, "direct_conversation", {
                    "conversation": conv
                }, request_id)
                continue
            
            # --- GET USER CONVERSATIONS ---
            if type_ == "get_conversations":
                convs = ConversationModel.get_user_conversations(sender_id)
                await ws_send(ws, "conversations_list", {
                    "conversations": convs
                }, request_id)
                continue

            # --- JOIN ROOM ---
            if type_ == "join":
                conv_id = data.get("conversation_id")
                if not conv_id:
                    await ws_send(ws, "error", {"code": "NO_CONV", "message": "conversation_id required"}, request_id)
                    continue
                rooms.setdefault(conv_id, set()).add(ws)
                await ws_send(ws, "join_ok", {"conversation_id": conv_id}, request_id)
                continue
            
            # --- LOAD MESSAGES ---
            if type_ == "load_messages":
                conv_id = data.get("conversation_id")
                if not conv_id:
                    await ws_send(ws, "error", {"code": "NO_CONV", "message": "conversation_id required"}, request_id)
                    continue
                
                messages = MessageModel.get_messages(conv_id)
                await ws_send(ws, "messages_loaded", {
                    "conversation_id": conv_id,
                    "messages": messages
                }, request_id)
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

                # LƯU VÀO DATABASE
                saved_msg = MessageModel.insert_message(conv_id, sender_id, text, msg_type)
                server_msg_id = saved_msg['_id']
                
                # Cập nhật last_message
                ConversationModel.update_last_message(conv_id, saved_msg)
                
                # Lấy thông tin conversation để kiểm tra participants
                conv = conversations_collection.find_one({"_id": conv_id}) if len(conv_id) != 24 else conversations_collection.find_one({"_id": ObjectId(conv_id)})
                
                message = {
                    "id": server_msg_id,
                    "sender_id": sender_id,
                    "msg_type": msg_type,
                    "text": text,
                    "created_at": saved_msg['created_at']
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
                
                # Nếu người nhận chưa join room (chưa mở conversation), thông báo riêng
                if conv and conv.get('type') == 'direct':
                    participants = conv.get('participants', [])
                    recipient_id = next((p for p in participants if p != sender_id), None)
                    
                    if recipient_id:
                        recipient_ws = user_ws.get(recipient_id)
                        # Kiểm tra nếu người nhận online nhưng chưa join room này
                        if recipient_ws and recipient_ws not in rooms.get(conv_id, set()):
                            # Gửi thông báo conversation mới nếu chưa có
                            await ws_send(recipient_ws, "new_message_notification", {
                                "conversation_id": conv_id,
                                "message": message,
                                "conversation": {
                                    "_id": str(conv['_id']),
                                    "type": conv['type'],
                                    "participants": conv['participants'],
                                    "status": conv.get('status', 'pending'),
                                    "last_message": {
                                        "text": text,
                                        "sender_id": sender_id,
                                        "created_at": saved_msg['created_at']
                                    }
                                }
                            })
                
                continue

            # --- RECEIPT ---
            if type_ == "receipt":
                conv_id = data.get("conversation_id")
                message_id = data.get("message_id")
                status = data.get("status")
                if conv_id and message_id and status:
                    MessageModel.update_receipt(message_id, sender_id, status)
                    await broadcast(conv_id, "receipt_update", {
                        "conversation_id": conv_id,
                        "message_id": message_id,
                        "user_id": sender_id,
                        "status": status,
                        "updated_at": now_ms()
                    })
                continue
            
            # --- SEARCH USERS ---
            if type_ == "search_users":
                query = data.get("query", "")
                users = UserModel.search_users(query)
                await ws_send(ws, "search_results", {
                    "query": query,
                    "users": users
                }, request_id)
                continue
            
            # --- SEND FRIEND REQUEST ---
            if type_ == "send_friend_request":
                to_user_id = data.get("to_user_id")
                if not to_user_id:
                    await ws_send(ws, "error", {"code": "NO_USER", "message": "to_user_id required"}, request_id)
                    continue
                
                result = FriendModel.send_friend_request(sender_id, to_user_id)
                
                # Kiểm tra nếu có lỗi
                if result.get("status") == "error":
                    await ws_send(ws, "error", {"code": "FRIEND_REQUEST_ERROR", "message": result["message"]}, request_id)
                    continue
                
                await ws_send(ws, "friend_request_sent", result, request_id)
                
                # Thông báo cho người nhận (nếu online)
                recipient_ws = user_ws.get(to_user_id)
                if recipient_ws:
                    await ws_send(recipient_ws, "friend_request_received", {
                        "from_user_id": sender_id
                    })
                continue
            
            # --- ACCEPT FRIEND REQUEST ---
            if type_ == "accept_friend_request":
                from_user_id = data.get("from_user_id")
                if not from_user_id:
                    await ws_send(ws, "error", {"code": "NO_USER", "message": "from_user_id required"}, request_id)
                    continue
                
                success = FriendModel.accept_friend_request(from_user_id, sender_id)
                await ws_send(ws, "friend_request_accepted", {
                    "success": success,
                    "friend_id": from_user_id
                }, request_id)
                
                # Thông báo cho người gửi
                sender_ws = user_ws.get(from_user_id)
                if sender_ws:
                    await ws_send(sender_ws, "friend_accepted", {
                        "user_id": sender_id
                    })
                continue
            
            # --- ACCEPT CONVERSATION (chấp nhận tin nhắn từ người lạ) ---
            if type_ == "accept_conversation":
                conv_id = data.get("conversation_id")
                if not conv_id:
                    await ws_send(ws, "error", {"code": "NO_CONV", "message": "conversation_id required"}, request_id)
                    continue
                
                ConversationModel.accept_conversation(conv_id)
                await ws_send(ws, "conversation_accepted", {
                    "conversation_id": conv_id
                }, request_id)
                continue
            
            # --- GET FRIENDS LIST ---
            if type_ == "get_friends":
                friends = FriendModel.get_friends(sender_id)
                await ws_send(ws, "friends_list", {
                    "friends": friends
                }, request_id)
                continue
            
            # --- GET FRIEND REQUESTS ---
            if type_ == "get_friend_requests":
                sent = FriendModel.get_pending_requests_sent(sender_id)
                received = FriendModel.get_pending_requests_received(sender_id)
                
                await ws_send(ws, "friend_requests", {
                    "sent": sent,
                    "received": received
                }, request_id)
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

            # presence offline
            for other_ws in list(ws_user.keys()):
                if other_ws.client_state.name == "CONNECTED":
                    try:
                        await ws_send(other_ws, "presence_update", {"user_id": user_id, "online": False, "last_seen": now_ms()})
                    except:
                        pass