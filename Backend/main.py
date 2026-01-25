# main.py
import json, time, os, shutil
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Body, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from models import MessageModel, ConversationModel, UserModel, FriendModel
from bson import ObjectId
from db import db
from auth import create_access_token, create_refresh_token, verify_token, verify_password, verify_refresh_token

# Import collections
conversations_collection = db['conversations']

app = FastAPI()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Mount static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models for Auth ---
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    username: str  # Can be username or email
    password: str

# --- REST API Endpoints ---
@app.post("/api/register")
def register(req: RegisterRequest):
    # Use email as user ID
    uid = req.email.lower().strip()
    
    # Check if email already exists
    if UserModel.get_user(uid):
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Check if username already exists
    if UserModel.get_user_by_username(req.username):
        raise HTTPException(status_code=400, detail="Username already exists")
        
    user = UserModel.create_user(uid, req.username, req.email, req.password)
    return {"status": "ok", "user_id": uid, "message": "User registered successfully"}

@app.post("/api/login")
def login(req: LoginRequest):
    user = UserModel.authenticate(req.username, req.password)
    
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
        
    # Generate Tokens
    access_token = create_access_token(data={"sub": user["_id"]})
    refresh_token = create_refresh_token(data={"sub": user["_id"]})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_id": user["_id"],
        "username": user["username"]
    }

class RefreshRequest(BaseModel):
    refresh_token: str

@app.post("/api/refresh")
def refresh(req: RefreshRequest):
    """Refresh access token using refresh token"""
    payload = verify_refresh_token(req.refresh_token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    # Verify user still exists
    user = UserModel.get_user(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Generate new access token
    new_access_token = create_access_token(data={"sub": user_id})
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }

# Dependency to get current user from token
async def get_current_user(authorization: str = None):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return user_id

@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    conversation_id: str = Form(...),
    text: str = Form(None),
    authorization: str = Depends(lambda: None)  # Will be extracted manually
):
    """Upload file endpoint"""
    from fastapi import Request, Header
    from typing import Optional
    
    # Get token from header (manual extraction since Depends doesn't work well with form data)
    async def inner(request: Request, auth_header: Optional[str] = Header(None, alias="Authorization")):
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
        
        token = auth_header.split(" ")[1]
        payload = verify_token(token)
        
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        return user_id
    
    # For now, we'll handle auth in a simpler way
    # In production, you'd want proper dependency injection
    
    try:
        # Create unique filename
        timestamp = int(time.time() * 1000)
        file_extension = Path(file.filename).suffix
        unique_filename = f"{timestamp}_{file.filename}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Generate URL
        file_url = f"http://localhost:8000/uploads/{unique_filename}"
        
        return {
            "status": "ok",
            "file_url": file_url,
            "file_name": file.filename,
            "file_size": file_path.stat().st_size
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")


# --- WebSocket Global State ---
rooms = {} 
ws_user = {} 
user_ws = {} 

def now_ms():
    return int(time.time() * 1000)

async def ws_send(ws: WebSocket, type_: str, data: dict, request_id=None):
    try:
        payload = {
            "type": type_,
            "data": data,
            "request_id": request_id,
            "ts": now_ms()
        }
        try:
            text = json.dumps(payload)
        except TypeError:
            # Fallback for non-JSON-serializable types (e.g., ObjectId, datetime)
            text = json.dumps(payload, default=str)
        await ws.send_text(text)
    except Exception as e:
        print(f"[WS] send error: {e}")

async def broadcast(conversation_id: str, type_: str, data: dict, exclude_sender_id: str = None):
    """Broadcast message to all in room, optionally excluding sender"""
    for ws in list(rooms.get(conversation_id, set())):
        try:
            # Skip sender if exclude_sender_id is provided
            if exclude_sender_id and ws_user.get(ws) == exclude_sender_id:
                continue
            await ws_send(ws, type_, data)
        except:
            pass

async def notify_participants(conversation_id: str, type_: str, data: dict, exclude_user_id: str = None):
    """Send event to all participants whether or not they're in the room"""
    conv = conversations_collection.find_one({"_id": ObjectId(conversation_id)}) if len(conversation_id) == 24 else None
    participants = conv.get("participants", []) if conv else []
    for pid in participants:
        if exclude_user_id and pid == exclude_user_id:
            continue
        ws = user_ws.get(pid)
        if ws:
            await ws_send(ws, type_, data)

async def broadcast_presence(user_id: str, online: bool, last_seen=None):
    """Notify all connected clients about presence change."""
    payload = {"user_id": user_id, "online": online}
    if last_seen:
        payload["last_seen"] = last_seen
    for ws in list(ws_user.keys()):
        try:
            await ws_send(ws, "presence_update", payload)
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

            # --- AUTH (Modified for JWT) ---
            if type_ == "auth":
                token = data.get("token")
                user_id = data.get("user_id") # Fallback or initial handshake?
                
                # Verify Token
                payload = None
                if token:
                    payload = verify_token(token)
                
                if payload:
                    user_id = payload.get("sub")
                else:
                    # If no valid token, fail
                    await ws_send(ws, "error", {"code": "UNAUTH", "message": "Invalid or missing token"}, request_id)
                    continue

                ws_user[ws] = user_id
                user_ws[user_id] = ws

                await ws_send(ws, "auth_ok", {"user_id": user_id}, request_id)
                # Broadcast presence online
                await broadcast_presence(user_id, True)
                
                # Broadcast presence
                for other_ws in list(ws_user.keys()):
                    if getattr(other_ws, "client_state", None) and other_ws.client_state.name == "CONNECTED":
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
                # ... check checks ...
                if not other_user_id: 
                     continue

                # Check if other user exists (by user_id or username)
                target_user_id = None
                if UserModel.get_user(other_user_id):
                    target_user_id = other_user_id
                else:
                    # Try username lookup
                    user_doc = UserModel.get_user_by_username(other_user_id)
                    if user_doc:
                        target_user_id = user_doc.get("_id")
                
                if not target_user_id:
                    await ws_send(ws, "error", {"code": "USER_NOT_FOUND", "message": "User không tồn tại"}, request_id)
                    continue

                conv = ConversationModel.create_or_get_direct_conversation(sender_id, target_user_id, initiator_id=sender_id)
                
                # Notify recipient if new and pending
                if conv.get('status') == 'pending' and conv.get('initiator') == sender_id:
                    recipient_ws = user_ws.get(target_user_id)
                    if recipient_ws:
                        await ws_send(recipient_ws, "new_conversation", {"conversation": conv})
                
                await ws_send(ws, "direct_conversation", {"conversation": conv}, request_id)
                continue
            
            # --- GET USER CONVERSATIONS ---
            if type_ == "get_conversations":
                convs = ConversationModel.get_user_conversations(sender_id)
                await ws_send(ws, "conversations_list", {"conversations": convs}, request_id)
                continue

            # --- JOIN ROOM ---
            if type_ == "join":
                conv_id = data.get("conversation_id")
                if conv_id:
                    rooms.setdefault(conv_id, set()).add(ws)
                    await ws_send(ws, "join_ok", {"conversation_id": conv_id}, request_id)
                continue
            
            # --- LOAD MESSAGES ---
            if type_ == "load_messages":
                conv_id = data.get("conversation_id")
                if conv_id:
                    try:
                        messages = MessageModel.get_messages(conv_id, viewer_id=sender_id)
                        await ws_send(ws, "messages_loaded", {
                            "conversation_id": conv_id,
                            "messages": messages
                        }, request_id)
                    except Exception as e:
                        print(f"[WS] load_messages error: {e}")
                        await ws_send(ws, "error", {
                            "code": "LOAD_MESSAGES_ERROR",
                            "message": str(e)
                        }, request_id)
                continue

            # --- RECEIPT (deprecated/no-op) ---
            if type_ == "receipt":
                # Ignore deprecated receipt messages to avoid client errors
                await ws_send(ws, "info", {"message": "receipts_disabled"}, request_id)
                continue

            # --- PIN MESSAGE ---
            if type_ == "pin_message":
                conv_id = data.get("conversation_id")
                message_id = data.get("message_id")
                result = ConversationModel.pin_message(conv_id, message_id, sender_id)
                if result.get("status") == "success":
                    payload = {
                        "conversation_id": conv_id,
                        "pinned_message": result.get("pinned_message")
                    }
                    await broadcast(conv_id, "pinned_message_updated", payload)
                    await notify_participants(conv_id, "pinned_message_updated", payload)
                else:
                    await ws_send(ws, "error", {"code": "PIN_ERROR", "message": result.get("message")}, request_id)
                continue

            # --- UNPIN MESSAGE ---
            if type_ == "unpin_message":
                conv_id = data.get("conversation_id")
                result = ConversationModel.unpin_message(conv_id)
                if result.get("status") == "success":
                    payload = {
                        "conversation_id": conv_id,
                        "pinned_message": None
                    }
                    await broadcast(conv_id, "pinned_message_updated", payload)
                    await notify_participants(conv_id, "pinned_message_updated", payload)
                else:
                    await ws_send(ws, "error", {"code": "UNPIN_ERROR", "message": result.get("message")}, request_id)
                continue

            # --- SEND MESSAGE ---
            if type_ == "send_message":
                conv_id = data.get("conversation_id")
                client_msg_id = data.get("client_msg_id")
                msg_type = data.get("msg_type", "text")
                text = data.get("text", "")
                file_url = data.get("file_url")
                file_name = data.get("file_name")
                file_size = data.get("file_size")

                if not conv_id or not client_msg_id: continue

                # INSERT using NEW Embedded Model with file metadata
                saved_msg = MessageModel.insert_message(
                    conv_id, sender_id, text, msg_type,
                    file_url=file_url, file_name=file_name, file_size=file_size
                )
                
                if not saved_msg:
                    # Error handling
                    continue

                server_msg_id = saved_msg['_id']
                
                # Add status field for frontend
                saved_msg['status'] = 'sent'
                
                # Ack
                await ws_send(ws, "send_ack", {
                    "conversation_id": conv_id,
                    "client_msg_id": client_msg_id,
                    "server_msg_id": server_msg_id,
                    "status": "sent",
                    "created_at": saved_msg["created_at"]
                }, request_id)

                # Broadcast to room (include sender so UI updates immediately)
                await broadcast(conv_id, "new_message", {
                    "conversation_id": conv_id,
                    "message": saved_msg
                })
                
                # Notify all participants who are NOT in room
                conv = conversations_collection.find_one({"_id": ObjectId(conv_id)}) if len(conv_id) == 24 else None
                if conv:
                    participants = conv.get('participants', [])
                    for participant_id in participants:
                        if participant_id == sender_id:
                            continue  # Don't notify sender
                        
                        recipient_ws = user_ws.get(participant_id)
                        if recipient_ws:
                            # If not in room, send notification
                            if recipient_ws not in rooms.get(conv_id, set()):
                                await ws_send(recipient_ws, "new_message", {
                                    "conversation_id": conv_id,
                                    "message": saved_msg
                                })
                continue

            # --- SEARCH USERS ---
            if type_ == "search_users":
                query = data.get("query", "")
                users = UserModel.search_users(query)
                await ws_send(ws, "search_results", {"query": query, "users": users}, request_id)
                continue
            
            # --- SEND FRIEND REQUEST ---
            if type_ == "send_friend_request":
                to_user_id = data.get("to_user_id")
                if to_user_id:
                    target_user_id = None
                    # Try exact user_id first
                    if UserModel.get_user(to_user_id):
                        target_user_id = to_user_id
                    else:
                        # Fallback to username lookup
                        user_doc = UserModel.get_user_by_username(to_user_id)
                        if user_doc:
                            target_user_id = user_doc.get("_id")

                    if not target_user_id:
                        await ws_send(ws, "error", {"code": "USER_NOT_FOUND", "message": "User không tồn tại"}, request_id)
                        continue

                    result = FriendModel.send_friend_request(sender_id, target_user_id)
                    if result.get("status") == "error":
                        err_msg = result.get("message", "Lỗi khi gửi lời mời kết bạn")
                        err_code = "USER_NOT_FOUND" if "không tồn tại" in err_msg.lower() else "FRIEND_REQUEST_ERROR"
                        await ws_send(ws, "error", {"code": err_code, "message": err_msg}, request_id)
                    else:
                        await ws_send(ws, "friend_request_sent", result, request_id)
                        # Notify
                        recipient_ws = user_ws.get(target_user_id)
                        if recipient_ws:
                            await ws_send(recipient_ws, "friend_request_received", {"from_user_id": sender_id})
                continue
            
            # --- ACCEPT FRIEND REQUEST ---
            if type_ == "accept_friend_request":
                from_user_id = data.get("from_user_id")
                if from_user_id:
                     # FriendModel.accept_friend_request(recipient, sender_of_req)
                     # Here current user (sender_id) is the recipient of the request
                    success = FriendModel.accept_friend_request(sender_id, from_user_id)
                    await ws_send(ws, "friend_request_accepted", {"success": success, "friend_id": from_user_id}, request_id)
                    
                    if success:
                        # Notify the sender
                        sender_ws = user_ws.get(from_user_id)
                        if sender_ws:
                            await ws_send(sender_ws, "friend_accepted", {"user_id": sender_id})
                        
                        # Send updated conversation lists to both users so status changes from pending to accepted
                        convs_acceptor = ConversationModel.get_user_conversations(sender_id)
                        await ws_send(ws, "conversations_list", {"conversations": convs_acceptor}, "r_refresh_after_friend")
                        
                        if sender_ws:
                            convs_sender = ConversationModel.get_user_conversations(from_user_id)
                            await ws_send(sender_ws, "conversations_list", {"conversations": convs_sender}, "r_refresh_after_friend")
                continue
            
            # --- CLOSE/ACCEPT CONVERSATION ---
            if type_ == "accept_conversation":
                conv_id = data.get("conversation_id")
                if conv_id:
                    ConversationModel.accept_conversation(conv_id)
                    await ws_send(ws, "conversation_accepted", {"conversation_id": conv_id}, request_id)
                continue
            
            # --- GET FRIENDS LIST ---
            if type_ == "get_friends":
                print(f"[WS] get_friends request from: {sender_id}")
                # Create online_users dict from user_ws
                online_users = {uid: True for uid in user_ws.keys()}
                friends = FriendModel.get_friends(sender_id, online_users)
                print(f"[WS] Sending {len(friends)} friends to {sender_id}")
                await ws_send(ws, "friends_list", {"friends": friends}, request_id)
                continue
            
            # --- GET FRIEND REQUESTS (Updated) ---
            if type_ == "get_friend_requests":
                # Returns { received: [], sent: [] }
                requests = FriendModel.get_pending_requests(sender_id)
                await ws_send(ws, "friend_requests", requests, request_id)
                continue

            # --- REJECT FRIEND REQUEST ---
            if type_ == "reject_friend_request":
                from_user_id = data.get("from_user_id")
                if from_user_id:
                    try:
                        print(f"[WS] Rejecting friend request: {sender_id} rejecting {from_user_id}")
                        success = FriendModel.reject_friend_request(sender_id, from_user_id)
                        print(f"[WS] Reject result: {success}")
                        await ws_send(ws, "friend_request_rejected", {"success": success, "user_id": from_user_id}, request_id)
                        
                        if success:
                            sender_ws = user_ws.get(from_user_id)
                            if sender_ws:
                                await ws_send(sender_ws, "friend_rejected", {"user_id": sender_id})
                    except Exception as e:
                        print(f"[WS] Error rejecting friend request: {e}")
                        import traceback
                        traceback.print_exc()
                        await ws_send(ws, "error", {"code": "REJECT_ERROR", "message": str(e)}, request_id)
                continue

            # --- CREATE GROUP CONVERSATION ---
            if type_ == "create_group":
                name = data.get("name", "")
                member_ids = data.get("member_ids", [])
                
                result = ConversationModel.create_group_conversation(sender_id, name, member_ids)
                
                if result.get("status") == "success":
                    conversation = result["conversation"]
                    await ws_send(ws, "group_created", {"conversation": conversation}, request_id)
                    
                    # Notify all members
                    for member_id in conversation.get("participants", []):
                        if member_id != sender_id:
                            member_ws = user_ws.get(member_id)
                            if member_ws:
                                await ws_send(member_ws, "new_conversation", {"conversation": conversation})
                else:
                    await ws_send(ws, "error", {"code": "CREATE_GROUP_ERROR", "message": result.get("message")}, request_id)
                continue

            # --- ADD GROUP MEMBER ---
            if type_ == "add_group_member":
                conversation_id = data.get("conversation_id")
                new_member_id = data.get("member_id")
                
                if conversation_id and new_member_id:
                    result = ConversationModel.add_group_member(conversation_id, sender_id, new_member_id)
                    
                    if result.get("status") == "success":
                        await ws_send(ws, "member_added", {"conversation_id": conversation_id, "member_id": new_member_id}, request_id)
                        
                        # Notify the new member
                        member_ws = user_ws.get(new_member_id)
                        if member_ws:
                            # Get updated conversation info
                            conv = conversations_collection.find_one({"_id": ObjectId(conversation_id)}, {"messages": 0})
                            if conv:
                                conv['_id'] = str(conv['_id'])
                                if conv.get('created_at'):
                                    conv['created_at'] = int(conv['created_at'].timestamp() * 1000)
                                await ws_send(member_ws, "new_conversation", {"conversation": conv})
                        
                        # Broadcast to all members in the room
                        await broadcast(conversation_id, "member_added", {"member_id": new_member_id, "added_by": sender_id, "conversation_id": conversation_id})

                        # Broadcast updated conversation metadata to refresh participant list
                        conv = conversations_collection.find_one({"_id": ObjectId(conversation_id)}, {"messages": 0})
                        if conv:
                            conv['_id'] = str(conv['_id'])
                            if conv.get('created_at'):
                                conv['created_at'] = int(conv['created_at'].timestamp() * 1000)
                            if conv.get('last_message') and conv['last_message'].get('created_at'):
                                conv['last_message']['created_at'] = int(conv['last_message']['created_at'].timestamp() * 1000)
                            await broadcast(conversation_id, "conversation_updated", {"conversation": conv})
                            await notify_participants(conversation_id, "conversation_updated", {"conversation": conv})
                    else:
                        await ws_send(ws, "error", {"code": "ADD_MEMBER_ERROR", "message": result.get("message")}, request_id)
                continue

            # --- REMOVE GROUP MEMBER ---
            if type_ == "remove_group_member":
                conversation_id = data.get("conversation_id")
                member_id = data.get("member_id")
                
                if conversation_id and member_id:
                    result = ConversationModel.remove_group_member(conversation_id, sender_id, member_id)
                    
                    if result.get("status") == "success":
                        await ws_send(ws, "member_removed", {"conversation_id": conversation_id, "member_id": member_id}, request_id)
                        
                        # Notify the removed member
                        member_ws = user_ws.get(member_id)
                        if member_ws:
                            await ws_send(member_ws, "removed_from_group", {"conversation_id": conversation_id})
                        
                        # Broadcast to remaining members
                        await broadcast(conversation_id, "member_removed", {"member_id": member_id, "removed_by": sender_id, "conversation_id": conversation_id})

                        # Send updated conversation info (without messages) to remaining members for immediate UI refresh
                        try:
                            conv = conversations_collection.find_one({"_id": ObjectId(conversation_id)}, {"messages": 0})
                            if conv:
                                conv["_id"] = str(conv["_id"])
                                if conv.get("created_at"):
                                    conv["created_at"] = int(conv["created_at"].timestamp() * 1000)
                                if conv.get("last_message") and conv["last_message"].get("created_at"):
                                    conv["last_message"]["created_at"] = int(conv["last_message"]["created_at"].timestamp() * 1000)
                                await broadcast(conversation_id, "conversation_updated", {"conversation": conv})
                        except Exception as e:
                            print(f"[WS] conversation update after remove failed: {e}")
                    else:
                        await ws_send(ws, "error", {"code": "REMOVE_MEMBER_ERROR", "message": result.get("message")}, request_id)
                continue

            # --- UPDATE GROUP INFO ---
            if type_ == "update_group_info":
                conversation_id = data.get("conversation_id")
                name = data.get("name")
                avatar = data.get("avatar")
                
                if conversation_id:
                    result = ConversationModel.update_group_info(conversation_id, sender_id, name, avatar)
                    
                    if result.get("status") == "success":
                        await ws_send(ws, "group_updated", {"conversation_id": conversation_id}, request_id)
                        
                        # Broadcast to all members
                        update_data = {"conversation_id": conversation_id}
                        if name:
                            update_data["name"] = name
                        if avatar:
                            update_data["avatar"] = avatar
                        await broadcast(conversation_id, "group_info_updated", update_data)
                    else:
                        await ws_send(ws, "error", {"code": "UPDATE_GROUP_ERROR", "message": result.get("message")}, request_id)
                continue
            
            # --- DELETE CONVERSATION ---
            if type_ == "delete_conversation":
                conversation_id = data.get("conversation_id")
                
                if conversation_id:
                    result = ConversationModel.delete_conversation(conversation_id, sender_id)
                    
                    if result.get("status") == "success":
                        await ws_send(ws, "conversation_deleted", {"conversation_id": conversation_id}, request_id)
                        
                        # Notify all participants
                        participants = result.get("participants", [])
                        for participant_id in participants:
                            if participant_id != sender_id:
                                participant_ws = user_ws.get(participant_id)
                                if participant_ws:
                                    await ws_send(participant_ws, "conversation_deleted", {"conversation_id": conversation_id})
                    else:
                        await ws_send(ws, "error", {"code": "DELETE_ERROR", "message": result.get("message")}, request_id)
                continue

            await ws_send(ws, "error", {"code": "UNKNOWN_TYPE", "message": f"Unknown type: {type_}"}, request_id)




    except WebSocketDisconnect:
        user_id = ws_user.get(ws)
        if user_id:
            ws_user.pop(ws, None)
            user_ws.pop(user_id, None)
            for conv_id in list(rooms.keys()):
                rooms[conv_id].discard(ws)
            # broadcast offline presence
            await broadcast_presence(user_id, False, now_ms())
