[README.md](https://github.com/user-attachments/files/24853510/README.md)
# Group Chat Application

Ứng dụng chat nhóm thời gian thực được xây dựng với FastAPI (Backend) và Vanilla JavaScript (Frontend). Ứng dụng hỗ trợ nhắn tin 1-1, nhóm chat, gửi file, quản lý bạn bè và thông báo real-time.

## Tính năng

### Xác thực & Người dùng
- ✅ Đăng ký/đăng nhập người dùng
- ✅ JWT Authentication (Access Token & Refresh Token)
- ✅ Tự động refresh token
- ✅ Tìm kiếm người dùng
- ✅ Quản lý thông tin cá nhân

### Quản lý bạn bè
- ✅ Gửi lời mời kết bạn
- ✅ Chấp nhận/từ chối lời mời
- ✅ Thông báo real-time khi có lời mời kết bạn
- ✅ Danh sách bạn bè

### Chat & Tin nhắn
- ✅ Chat 1-1
- ✅ Tạo nhóm chat
- ✅ Gửi tin nhắn văn bản
- ✅ Gửi file/hình ảnh
- ✅ WebSocket real-time messaging
- ✅ Hiển thị trạng thái online/offline
- ✅ Lịch sử tin nhắn

## Công nghệ sử dụng

### Backend
- **FastAPI** - Web framework hiện đại cho Python
- **MongoDB** - NoSQL database
- **WebSocket** - Real-time communication
- **JWT** - JSON Web Tokens cho authentication
- **Bcrypt** - Password hashing
- **Python-Jose** - JWT encoding/decoding

### Frontend
- **Vanilla JavaScript** - Không framework
- **Vite** - Build tool & dev server
- **TailwindCSS** - Utility-first CSS framework
- **WebSocket API** - Real-time communication

## 📁 Cấu trúc dự án

```
MMT/
├── Backend/
│   ├── main.py              # API endpoints & WebSocket
│   ├── models.py            # Database models (User, Message, Conversation, Friend)
│   ├── db.py                # MongoDB connection
│   ├── auth.py              # Authentication helpers (JWT, password hashing)
│   ├── requirements.txt     # Python dependencies
│   └── uploads/             # Uploaded files storage
│
└── Frontend/
    ├── index.html           # HTML entry point
    ├── package.json         # NPM dependencies
    ├── vite.config.js       # Vite configuration
    └── src/
        ├── main.js          # App entry point & routing
        ├── state.js         # Global state management
        ├── ws.js            # WebSocket client
        ├── refreshToken.js  # Token refresh logic
        └── components/      # UI components
            ├── Sidebar.js
            ├── ChatPanel.js
            ├── RightPanel.js
            ├── Message.js
            ├── CreateGroupModal.js
            ├── FriendRequestNotification.js
            ├── pages/
            │   ├── Login.js
            │   └── Register.js
            └── ui/
                ├── Button.js
                ├── Input.js
                └── Modal.js
```

## 🚀 Cài đặt và Chạy

### Yêu cầu hệ thống
- Python 3.8+
- Node.js 16+
- MongoDB (local hoặc cloud)

### Backend Setup

1. **Di chuyển vào thư mục Backend:**
```bash
cd Backend
```

2. **Cài đặt dependencies:**
```bash
pip install -r requirements.txt
```

3. **Chạy server:**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend sẽ chạy tại: `http://localhost:8000`

### Frontend Setup

1. **Di chuyển vào thư mục Frontend:**
```bash
cd Frontend
```

2. **Cài đặt dependencies:**
```bash
npm install
```

3. **Chạy development server:**
```bash
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

## 📡 API Endpoints

### Authentication
- `POST /api/register` - Đăng ký người dùng mới
- `POST /api/login` - Đăng nhập
- `POST /api/refresh` - Refresh access token

### User
- `GET /api/me` - Lấy thông tin user hiện tại
- `GET /api/users/search?q={query}` - Tìm kiếm người dùng

### Friends
- `POST /api/friends/request` - Gửi lời mời kết bạn
- `POST /api/friends/accept` - Chấp nhận lời mời
- `POST /api/friends/reject` - Từ chối lời mời
- `GET /api/friends` - Lấy danh sách bạn bè

### Conversations
- `GET /api/conversations` - Lấy danh sách cuộc hội thoại
- `POST /api/conversations` - Tạo cuộc hội thoại mới
- `GET /api/conversations/{id}/messages` - Lấy tin nhắn

### Upload
- `POST /api/upload` - Upload file

### WebSocket
- `WS /ws` - WebSocket endpoint cho real-time messaging

## 🔌 WebSocket Events

### Client → Server
```javascript
{
  "type": "auth",
  "data": { "token": "access_token" }
}

{
  "type": "message",
  "data": {
    "conversation_id": "conv_id",
    "text": "message text"
  }
}
```

### Server → Client
```javascript
{
  "type": "new_message",
  "data": { /* message object */ }
}

{
  "type": "friend_request",
  "data": {
    "from_user_id": "user_id",
    "from_username": "username"
  }
}

{
  "type": "user_status",
  "data": {
    "user_id": "user_id",
    "status": "online" | "offline"
  }
}
```

## 💾 Database Schema

### Users Collection
```javascript
{
  "_id": "email",
  "username": "string",
  "email": "string",
  "password_hash": "string",
  "avatar": "string | null",
  "created_at": "datetime",
  "friends": ["user_id"],
  "friend_requests": [{ "from_user": "user_id", "created_at": "datetime" }],
  "sent_requests": [{ "to_user": "user_id", "created_at": "datetime" }]
}
```

### Conversations Collection
```javascript
{
  "_id": "ObjectId",
  "name": "string | null",
  "type": "direct" | "group",
  "members": ["user_id"],
  "created_by": "user_id",
  "created_at": "datetime",
  "last_message_at": "datetime",
  "messages": [
    {
      "_id": "ObjectId",
      "sender_id": "user_id",
      "text": "string | null",
      "file_url": "string | null",
      "file_name": "string | null",
      "created_at": "datetime"
    }
  ]
}
```

## 🔐 Authentication Flow

1. User đăng ký/đăng nhập → nhận `access_token` & `refresh_token`
2. `access_token` được lưu trong localStorage
3. Mỗi request API đính kèm header: `Authorization: Bearer {access_token}`
4. WebSocket authentication: gửi event `auth` với token
5. Khi `access_token` hết hạn → tự động dùng `refresh_token` để lấy token mới
6. Background refresh mỗi 13 phút

## 🎨 UI Components

- **Sidebar**: Danh sách conversations, tạo nhóm, tìm kiếm
- **ChatPanel**: Khu vực chat chính, hiển thị tin nhắn, input
- **RightPanel**: Chi tiết conversation, danh sách thành viên
- **Modal**: Tạo nhóm, hiển thị thông báo
- **FriendRequestNotification**: Toast notification cho lời mời kết bạn

## 📝 Ghi chú

- Backend chạy trên port **8000**
- Frontend chạy trên port **5173** (hoặc 3000)
- File upload được lưu tại `Backend/uploads/`
- CORS đã được cấu hình cho localhost
- JWT access token hết hạn sau 15 phút
- JWT refresh token hết hạn sau 7 ngày

