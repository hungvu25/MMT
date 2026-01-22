# models.py
from db import db
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId

# Collection references
messages_collection = db['messages']
users_collection = db['users']
conversations_collection = db['conversations']
friends_collection = db['friends']

class MessageModel:
    @staticmethod
    def insert_message(conversation_id, sender_id, text, msg_type="text"):
        """Lưu tin nhắn vào database"""
        message = {
            "conversation_id": conversation_id,
            "sender_id": sender_id,
            "text": text,
            "msg_type": msg_type,
            "created_at": datetime.now(),
            "status": "sent",
            "receipts": {}
        }
        result = messages_collection.insert_one(message)
        message['_id'] = str(result.inserted_id)
        message['created_at'] = int(message['created_at'].timestamp() * 1000)
        return message
    
    @staticmethod
    def get_messages(conversation_id, limit=50):
        """Lấy tin nhắn từ database"""
        messages = messages_collection.find(
            {"conversation_id": conversation_id}
        ).sort("created_at", -1).limit(limit)
        
        result = []
        for msg in messages:
            msg['_id'] = str(msg['_id'])
            msg['created_at'] = int(msg['created_at'].timestamp() * 1000)
            result.append(msg)
        
        return list(reversed(result))
    
    @staticmethod
    def update_receipt(message_id, user_id, status):
        """Cập nhật trạng thái đã đọc"""
        messages_collection.update_one(
            {"_id": ObjectId(message_id)},
            {"$set": {f"receipts.{user_id}": {
                "status": status,
                "updated_at": datetime.now()
            }}}
        )

class ConversationModel:
    @staticmethod
    def create_or_get_direct_conversation(user_id_1, user_id_2, initiator_id=None):
        """Tạo hoặc lấy conversation giữa 2 người"""
        # Tìm conversation đã tồn tại
        existing = conversations_collection.find_one({
            "type": "direct",
            "participants": {"$all": [user_id_1, user_id_2]}
        })
        
        if existing:
            existing['_id'] = str(existing['_id'])
            if existing.get('created_at'):
                existing['created_at'] = int(existing['created_at'].timestamp() * 1000)
            if existing.get('last_message') and existing['last_message'].get('created_at'):
                existing['last_message']['created_at'] = int(existing['last_message']['created_at'].timestamp() * 1000)
            return existing
        
        # Kiểm tra có phải bạn bè không
        are_friends = FriendModel.are_friends(user_id_1, user_id_2)
        
        # Tạo mới nếu chưa có
        now = datetime.now()
        conv = {
            "type": "direct",
            "participants": sorted([user_id_1, user_id_2]),
            "created_at": now,
            "last_message": None,
            "status": "accepted" if are_friends else "pending",
            "initiator": initiator_id  # Người khởi tạo cuộc trò chuyện
        }
        result = conversations_collection.insert_one(conv)
        conv['_id'] = str(result.inserted_id)
        conv['created_at'] = int(now.timestamp() * 1000)
        return conv
    
    @staticmethod
    def get_user_conversations(user_id):
        """Lấy tất cả conversations của 1 user"""
        convs = conversations_collection.find({
            "participants": user_id
        }).sort("last_message.created_at", -1)
        
        result = []
        for c in convs:
            c['_id'] = str(c['_id'])
            if c.get('created_at'):
                c['created_at'] = int(c['created_at'].timestamp() * 1000)
            if c.get('last_message') and c['last_message'].get('created_at'):
                c['last_message']['created_at'] = int(c['last_message']['created_at'].timestamp() * 1000)
            
            # Thêm status nếu chưa có (cho các conversation cũ)
            if 'status' not in c:
                c['status'] = 'accepted'
            
            result.append(c)
        return result
    
    @staticmethod
    def accept_conversation(conversation_id):
        """Chấp nhận cuộc trò chuyện từ người lạ"""
        try:
            conv_obj_id = ObjectId(conversation_id)
        except (InvalidId, TypeError):
            conversations_collection.update_one(
                {"_id": conversation_id},
                {"$set": {"status": "accepted"}}
            )
            return
        
        conversations_collection.update_one(
            {"_id": conv_obj_id},
            {"$set": {"status": "accepted"}}
        )
    
    @staticmethod
    def update_last_message(conversation_id, message):
        """Cập nhật tin nhắn cuối"""
        # ← SỬA: Validate ObjectId trước
        try:
            conv_obj_id = ObjectId(conversation_id)
        except (InvalidId, TypeError):
            # Nếu không phải ObjectId hợp lệ, tìm bằng string
            conversations_collection.update_one(
                {"_id": conversation_id},  # Tìm bằng string
                {"$set": {
                    "last_message": {
                        "text": message['text'],
                        "sender_id": message['sender_id'],
                        "created_at": datetime.fromtimestamp(message['created_at'] / 1000)
                    }
                }}
            )
            return
        
        # Nếu là ObjectId hợp lệ
        conversations_collection.update_one(
            {"_id": conv_obj_id},
            {"$set": {
                "last_message": {
                    "text": message['text'],
                    "sender_id": message['sender_id'],
                    "created_at": datetime.fromtimestamp(message['created_at'] / 1000)
                }
            }}
        )

class FriendModel:
    @staticmethod
    def send_friend_request(from_user_id, to_user_id):
        """Gửi lời mời kết bạn"""
        # Kiểm tra user có tồn tại không
        to_user = UserModel.get_user(to_user_id)
        if not to_user:
            return {"status": "error", "message": "User không tồn tại"}
        
        # Kiểm tra không thể gửi cho chính mình
        if from_user_id == to_user_id:
            return {"status": "error", "message": "Không thể kết bạn với chính mình"}
        
        # Kiểm tra đã gửi chưa
        existing = friends_collection.find_one({
            "$or": [
                {"from_user": from_user_id, "to_user": to_user_id},
                {"from_user": to_user_id, "to_user": from_user_id}
            ]
        })
        
        if existing:
            if existing['status'] == 'accepted':
                return {"status": "error", "message": "Đã là bạn bè"}
            elif existing['status'] == 'pending':
                return {"status": "error", "message": "Lời mời đang chờ xử lý"}
        
        # Tạo friend request
        request = {
            "from_user": from_user_id,
            "to_user": to_user_id,
            "status": "pending",
            "created_at": datetime.now()
        }
        result = friends_collection.insert_one(request)
        request['_id'] = str(result.inserted_id)
        request['created_at'] = int(request['created_at'].timestamp() * 1000)
        return {"status": "sent", "friendship": request}
    
    @staticmethod
    def accept_friend_request(from_user_id, to_user_id):
        """Chấp nhận lời mời kết bạn"""
        result = friends_collection.update_one(
            {"from_user": from_user_id, "to_user": to_user_id, "status": "pending"},
            {"$set": {"status": "accepted", "accepted_at": datetime.now()}}
        )
        return result.modified_count > 0
    
    @staticmethod
    def are_friends(user_id_1, user_id_2):
        """Kiểm tra 2 người có phải bạn bè không"""
        friendship = friends_collection.find_one({
            "$or": [
                {"from_user": user_id_1, "to_user": user_id_2, "status": "accepted"},
                {"from_user": user_id_2, "to_user": user_id_1, "status": "accepted"}
            ]
        })
        return friendship is not None
    
    @staticmethod
    def get_friends(user_id):
        """Lấy danh sách bạn bè"""
        friendships = friends_collection.find({
            "$or": [
                {"from_user": user_id, "status": "accepted"},
                {"to_user": user_id, "status": "accepted"}
            ]
        })
        
        friends = []
        for f in friendships:
            friend_id = f['to_user'] if f['from_user'] == user_id else f['from_user']
            friends.append(friend_id)
        return friends
    
    @staticmethod
    def get_pending_requests_sent(user_id):
        """Lấy danh sách lời mời đã gửi (chưa được chấp nhận)"""
        requests = friends_collection.find({
            "from_user": user_id,
            "status": "pending"
        })
        
        result = []
        for r in requests:
            result.append({
                "to_user": r['to_user'],
                "created_at": int(r['created_at'].timestamp() * 1000) if isinstance(r['created_at'], datetime) else r['created_at']
            })
        return result
    
    @staticmethod
    def get_pending_requests_received(user_id):
        """Lấy danh sách lời mời nhận được"""
        requests = friends_collection.find({
            "to_user": user_id,
            "status": "pending"
        })
        
        result = []
        for r in requests:
            result.append({
                "from_user": r['from_user'],
                "created_at": int(r['created_at'].timestamp() * 1000) if isinstance(r['created_at'], datetime) else r['created_at']
            })
        return result

class UserModel:
    @staticmethod
    def create_user(user_id, username, avatar=None):
        """Tạo user mới"""
        user = {
            "_id": user_id,
            "username": username,
            "avatar": avatar,
            "created_at": datetime.now()
        }
        users_collection.insert_one(user)
        return user
    
    @staticmethod
    def get_user(user_id):
        """Lấy thông tin user"""
        return users_collection.find_one({"_id": user_id})
    
    @staticmethod
    def search_users(query, limit=10):
        """Tìm kiếm user theo username hoặc user_id"""
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