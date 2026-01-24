# models.py
from db import db
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from auth import get_password_hash, verify_password

# Collection references
users_collection = db['users']
conversations_collection = db['conversations']
# friends_collection OLD - DEPRECATED (Now embedded in users)
# messages_collection OLD - DEPRECATED (Now embedded in conversations)

class UserModel:
    @staticmethod
    def create_user(user_id, username, email, password, avatar=None):
        """Tạo user mới với password"""
        # Check exists
        if users_collection.find_one({"_id": user_id}):
            return None
            
        user = {
            "_id": user_id,  # Using email as ID
            "username": username,
            "email": email,
            "password_hash": get_password_hash(password),
            "avatar": avatar,
            "created_at": datetime.now(),
            "friends": [],         # List of friend user_ids
            "friend_requests": [], # List of { from_user: id, created_at: date }
            "sent_requests": []    # List of { to_user: id, created_at: date }
        }
        users_collection.insert_one(user)
        return user
    
    @staticmethod
    def get_user(user_id):
        """Lấy thông tin user (loại bỏ sensitive info)"""
        user = users_collection.find_one({"_id": user_id})
        if user:
            user.pop('password_hash', None)
        return user
    
    @staticmethod
    def get_user_by_username(username):
        """Lấy user theo username"""
        user = users_collection.find_one({"username": username})
        if user:
            user.pop('password_hash', None)
        return user
    
    @staticmethod
    def authenticate(user_id, password):
        """Xác thực user - user_id có thể là email hoặc username"""
        # Try to find by email first (_id)
        user = users_collection.find_one({"_id": user_id})
        
        # If not found, try by username
        if not user:
            user = users_collection.find_one({"username": user_id})
        
        if not user:
            return False
        if not verify_password(password, user.get('password_hash', '')):
            return False
        return user
    
    @staticmethod
    def search_users(query, limit=10):
        if not query:
            return []
        users = users_collection.find({
            "$or": [
                {"_id": {"$regex": query, "$options": "i"}},
                {"username": {"$regex": query, "$options": "i"}}
            ]
        }).limit(limit)
        
        result = []
        for user in users:
            result.append({
                "user_id": user['_id'],
                "username": user.get('username', user['_id']),
                "avatar": user.get('avatar')
            })
        return result

class FriendModel:
    @staticmethod
    def send_friend_request(from_user_id, to_user_id):
        """Gửi lời mời kết bạn (update arrays trong user docs)"""
        if from_user_id == to_user_id:
            return {"status": "error", "message": "Không thể kết bạn với chính mình"}
        
        to_user = users_collection.find_one({"_id": to_user_id})
        if not to_user:
            return {"status": "error", "message": "User không tồn tại"}
            
        # Check if already friends or requested
        if to_user_id in users_collection.find_one({"_id": from_user_id}).get('friends', []):
            return {"status": "error", "message": "Đã là bạn bè"}
        
        # Check pending requests
        existing_req = users_collection.find_one({
            "_id": to_user_id, 
            "friend_requests.from_user": from_user_id
        })
        if existing_req:
            return {"status": "error", "message": "Đã gửi lời mời trước đó"}

        now = datetime.now()
        
        # Add to 'friend_requests' of recipient
        users_collection.update_one(
            {"_id": to_user_id},
            {"$push": {"friend_requests": {
                "from_user": from_user_id,
                "created_at": now
            }}}
        )
        
        # Add to 'sent_requests' of sender
        users_collection.update_one(
            {"_id": from_user_id},
            {"$push": {"sent_requests": {
                "to_user": to_user_id, 
                "created_at": now
            }}}
        )
        
        return {"status": "sent", "to_user_id": to_user_id, "timestamp": int(now.timestamp() * 1000)}

    @staticmethod
    def accept_friend_request(user_id, requester_id):
        """Chấp nhận lời mời (Move from requests -> friends)"""
        now = datetime.now()
        
        # 1. Remove request from recipient
        res1 = users_collection.update_one(
            {"_id": user_id},
            {"$pull": {"friend_requests": {"from_user": requester_id}}}
        )
        
        # 2. Remove sent_request from sender
        users_collection.update_one(
            {"_id": requester_id},
            {"$pull": {"sent_requests": {"to_user": user_id}}}
        )
        
        if res1.modified_count > 0:
            # 3. Add to friends list (both sides)
            users_collection.update_one(
                {"_id": user_id},
                {"$addToSet": {"friends": requester_id}}
            )
            users_collection.update_one(
                {"_id": requester_id},
                {"$addToSet": {"friends": user_id}}
            )
            
            # 4. Update any pending conversations between these two users to 'accepted'
            conversations_collection.update_many(
                {
                    "type": "direct",
                    "participants": {"$all": [user_id, requester_id]},
                    "status": "pending"
                },
                {"$set": {"status": "accepted"}}
            )
            
            return True
        return False

    @staticmethod
    def get_friends(user_id, online_users=None):
        """Get friends list with full user information and online status"""
        print(f"[FriendModel] Getting friends for user_id: {user_id}")
        doc = users_collection.find_one({"_id": user_id}, {"friends": 1})
        print(f"[FriendModel] User doc: {doc}")
        friend_ids = doc.get('friends', []) if doc else []
        print(f"[FriendModel] Friend IDs: {friend_ids}")
        
        if not friend_ids:
            return []
        
        # Get full user info for each friend
        friends_data = []
        for fid in friend_ids:
            friend_user = users_collection.find_one({"_id": fid}, {"password_hash": 0})
            if friend_user:
                friend_info = {
                    "user_id": friend_user["_id"],
                    "username": friend_user.get("username", friend_user["_id"]),
                    "avatar": friend_user.get("avatar"),
                    "online": online_users.get(fid, False) if online_users else False  # Check if online
                }
                friends_data.append(friend_info)
                print(f"[FriendModel] Added friend: {friend_info}")
        
        print(f"[FriendModel] Returning {len(friends_data)} friends")
        return friends_data

    @staticmethod
    def get_pending_requests(user_id):
        """Lấy danh sách lời mời nhận được"""
        doc = users_collection.find_one({"_id": user_id}, {"friend_requests": 1})
        if not doc: return {"received": [], "sent": []}
        
        received = []
        for req in doc.get('friend_requests', []):
            received.append({
                "from_user": req['from_user'],
                "created_at": int(req['created_at'].timestamp() * 1000)
            })
            
        # Get sent
        doc_sent = users_collection.find_one({"_id": user_id}, {"sent_requests": 1})
        sent = []
        for req in doc_sent.get('sent_requests', []) if doc_sent else []:
            sent.append({
                "to_user": req['to_user'],
                "created_at": int(req['created_at'].timestamp() * 1000)
            })
            
        return {"received": received, "sent": sent}

    @staticmethod
    def are_friends(user1, user2):
        doc = users_collection.find_one({
            "_id": user1,
            "friends": user2
        })
        return doc is not None

    @staticmethod
    def reject_friend_request(user_id, requester_id):
        """Từ Chối lời mời kết bạn"""
        try:
            print(f"[Model] Rejecting: user={user_id}, requester={requester_id}")
            
            # 1. Remove request from recipient
            res1 = users_collection.update_one(
                {"_id": user_id},
                {"$pull": {"friend_requests": {"from_user": requester_id}}}
            )
            print(f"[Model] Removed from recipient: modified={res1.modified_count}")
            
            # 2. Remove sent_request from sender
            res2 = users_collection.update_one(
                {"_id": requester_id},
                {"$pull": {"sent_requests": {"to_user": user_id}}}
            )
            print(f"[Model] Removed from sender: modified={res2.modified_count}")
            
            return res1.modified_count > 0
        except Exception as e:
            print(f"[Model] Error in reject_friend_request: {e}")
            import traceback
            traceback.print_exc()
            raise

class MessageModel:
    @staticmethod
    def insert_message(conversation_id, sender_id, text, msg_type="text", file_url=None, file_name=None, file_size=None):
        """Embed message into Conversation document with optional file metadata"""
        msg_id = ObjectId()
        now = datetime.now()
        
        message = {
            "_id": msg_id,
            "sender_id": sender_id,
            "text": text,
            "msg_type": msg_type,
            "created_at": now,
            "receipts": {} # Can simplify if needed, keeping for read status
        }
        
        # Add file metadata if present
        if file_url:
            message["file_url"] = file_url
        if file_name:
            message["file_name"] = file_name
        if file_size:
            message["file_size"] = file_size
        
        try:
            conv_oid = ObjectId(conversation_id)
        except:
             # Fallback if string id
            return None

        # Push to messages array
        conversations_collection.update_one(
            {"_id": conv_oid},
            {
                "$push": {"messages": message},
                "$set": {
                    "last_message": {
                         "text": text if text else (file_name if file_name else "File"),
                         "sender_id": sender_id,
                         "created_at": now
                    }
                }
            }
        )
        
        # Helpers for returning data
        message['_id'] = str(msg_id)
        message['created_at'] = int(now.timestamp() * 1000)
        return message
    
    @staticmethod
    def get_messages(conversation_id, limit=50):
        """Lấy messages từ mảng embedded"""
        try:
            conv_oid = ObjectId(conversation_id)
        except:
            return []
            
        # Projection w/ slice to limit (MongoDB $slice: -limit means last N)
        conv = conversations_collection.find_one(
            {"_id": conv_oid},
            {"messages": {"$slice": -limit}} 
        )
        
        if not conv or 'messages' not in conv:
            return []
            
        result = []
        for msg in conv['messages']:
            msg['_id'] = str(msg['_id'])
            if isinstance(msg['created_at'], datetime):
                msg['created_at'] = int(msg['created_at'].timestamp() * 1000)
            result.append(msg)
            
        return result # Already in order if pushed in order

    @staticmethod
    def update_receipt(conversation_id, message_id, user_id, status):
        """Update embedded message receipt status"""
        # Complex update in array: messages.$[elem].receipts.user_id
        try:
            conv_oid = ObjectId(conversation_id)
            msg_oid = ObjectId(message_id)
        except:
            return

        conversations_collection.update_one(
            {"_id": conv_oid, "messages._id": msg_oid},
            {"$set": {
                "messages.$.receipts." + user_id: {
                    "status": status, 
                    "updated_at": datetime.now()
                }
            }}
        )

class ConversationModel:
    @staticmethod
    def create_or_get_direct_conversation(user_id_1, user_id_2, initiator_id=None):
        # ... logic similar to before but 'messages' array init ...
        existing = conversations_collection.find_one({
            "type": "direct",
            "participants": {"$all": [user_id_1, user_id_2]}
        })
        
        if existing:
            existing['_id'] = str(existing['_id'])
            if 'messages' in existing:
                del existing['messages'] # Don't return all messages in summary
            if existing.get('last_message') and isinstance(existing['last_message'].get('created_at'), datetime):
                existing['last_message']['created_at'] = int(existing['last_message']['created_at'].timestamp() * 1000)
            return existing
        
        are_friends = FriendModel.are_friends(user_id_1, user_id_2)
        
        now = datetime.now()
        conv = {
            "type": "direct",
            "participants": sorted([user_id_1, user_id_2]),
            "created_at": now,
            "last_message": None,
            "status": "accepted" if are_friends else "pending",
            "initiator": initiator_id,
            "messages": [] # Embed messages here
        }
        result = conversations_collection.insert_one(conv)
        conv['_id'] = str(result.inserted_id)
        conv['created_at'] = int(now.timestamp() * 1000)
        return conv
    
    @staticmethod
    def get_user_conversations(user_id):
        convs = conversations_collection.find(
            {"participants": user_id},
            {"messages": 0} # Exclude messages list for summary
        ).sort("last_message.created_at", -1)
        
        result = []
        for c in convs:
            c['_id'] = str(c['_id'])
            if c.get('created_at'):
                c['created_at'] = int(c['created_at'].timestamp() * 1000)
            if c.get('last_message') and c['last_message'].get('created_at'):
                c['last_message']['created_at'] = int(c['last_message']['created_at'].timestamp() * 1000)
            result.append(c)
        return result

    @staticmethod
    def accept_conversation(conversation_id):
        # ... same logic ...
        try:
            oid = ObjectId(conversation_id)
            conversations_collection.update_one({"_id": oid}, {"$set": {"status": "accepted"}})
        except:
            pass
    
    @staticmethod
    def update_last_message(conversation_id, message):
        # This is now handled inside MessageModel.insert_message mostly
        # But keeping for compatibility if utilized elsewhere
        pass

    @staticmethod
    def create_group_conversation(creator_id, name, member_ids):
        """Tạo nhóm chat mới"""
        try:
            # Validate members
            if not member_ids or len(member_ids) < 2:
                return {"status": "error", "message": "Nhóm phải có ít nhất 2 thành viên"}
            
            # Add creator to members if not already
            all_members = list(set([creator_id] + member_ids))
            
            now = datetime.now()
            group = {
                "type": "group",
                "name": name or f"Group {len(all_members)} members",
                "participants": all_members,
                "created_at": now,
                "created_by": creator_id,
                "admins": [creator_id],  # Creator is admin
                "last_message": None,
                "status": "accepted",
                "messages": []
            }
            
            result = conversations_collection.insert_one(group)
            group['_id'] = str(result.inserted_id)
            group['created_at'] = int(now.timestamp() * 1000)
            del group['messages']  # Don't return messages array
            
            return {"status": "success", "conversation": group}
        except Exception as e:
            print(f"[Model] Error creating group: {e}")
            return {"status": "error", "message": str(e)}

    @staticmethod
    def add_group_member(conversation_id, user_id, new_member_id):
        """Thêm thành viên vào nhóm (chỉ admin)"""
        try:
            conv_oid = ObjectId(conversation_id)
            conv = conversations_collection.find_one({"_id": conv_oid})
            
            if not conv or conv.get('type') != 'group':
                return {"status": "error", "message": "Nhóm không tồn tại"}
            
            # Check if user is admin
            if user_id not in conv.get('admins', []):
                return {"status": "error", "message": "Chỉ admin mới có thể thêm thành viên"}
            
            # Add member
            result = conversations_collection.update_one(
                {"_id": conv_oid},
                {"$addToSet": {"participants": new_member_id}}
            )
            
            return {"status": "success", "modified": result.modified_count > 0}
        except Exception as e:
            print(f"[Model] Error adding member: {e}")
            return {"status": "error", "message": str(e)}

    @staticmethod
    def remove_group_member(conversation_id, user_id, member_to_remove):
        """Xóa thành viên khỏi nhóm (admin hoặc tự rời)"""
        try:
            conv_oid = ObjectId(conversation_id)
            conv = conversations_collection.find_one({"_id": conv_oid})
            
            if not conv or conv.get('type') != 'group':
                return {"status": "error", "message": "Nhóm không tồn tại"}
            
            # Check permission: admin or removing self
            is_admin = user_id in conv.get('admins', [])
            is_self = user_id == member_to_remove
            
            if not is_admin and not is_self:
                return {"status": "error", "message": "Không có quyền xóa thành viên"}
            
            # Cannot remove creator
            if member_to_remove == conv.get('created_by'):
                return {"status": "error", "message": "Không thể xóa người tạo nhóm"}
            
            # Remove member
            result = conversations_collection.update_one(
                {"_id": conv_oid},
                {"$pull": {"participants": member_to_remove, "admins": member_to_remove}}
            )
            
            return {"status": "success", "modified": result.modified_count > 0}
        except Exception as e:
            print(f"[Model] Error removing member: {e}")
            return {"status": "error", "message": str(e)}

    @staticmethod
    def update_group_info(conversation_id, user_id, name=None, avatar=None):
        """Cập nhật thông tin nhóm (chỉ admin)"""
        try:
            conv_oid = ObjectId(conversation_id)
            conv = conversations_collection.find_one({"_id": conv_oid})
            
            if not conv or conv.get('type') != 'group':
                return {"status": "error", "message": "Nhóm không tồn tại"}
            
            # Check if user is admin
            if user_id not in conv.get('admins', []):
                return {"status": "error", "message": "Chỉ admin mới có thể chỉnh sửa"}
            
            update_fields = {}
            if name:
                update_fields["name"] = name
            if avatar:
                update_fields["avatar"] = avatar
            
            if not update_fields:
                return {"status": "error", "message": "Không có gì để cập nhật"}
            
            conversations_collection.update_one(
                {"_id": conv_oid},
                {"$set": update_fields}
            )
            
            return {"status": "success"}
        except Exception as e:
            print(f"[Model] Error updating group: {e}")
            return {"status": "error", "message": str(e)}
    
    @staticmethod
    def delete_conversation(conversation_id, user_id):
        """Xóa conversation (chỉ admin/creator)"""
        try:
            conv_oid = ObjectId(conversation_id)
            conv = conversations_collection.find_one({"_id": conv_oid})
            
            if not conv:
                return {"status": "error", "message": "Conversation không tồn tại"}
            
            # For group: only admin/creator can delete
            if conv.get('type') == 'group':
                if user_id not in conv.get('admins', []) and user_id != conv.get('created_by'):
                    return {"status": "error", "message": "Chỉ admin mới có thể xóa nhóm"}
            # For direct: any participant can delete (for themselves)
            elif conv.get('type') == 'direct':
                if user_id not in conv.get('participants', []):
                    return {"status": "error", "message": "Không có quyền xóa"}
            
            # Delete conversation
            conversations_collection.delete_one({"_id": conv_oid})
            
            return {"status": "success", "conversation_id": conversation_id, "participants": conv.get('participants', [])}
        except Exception as e:
            print(f"[Model] Error deleting conversation: {e}")
            return {"status": "error", "message": str(e)}