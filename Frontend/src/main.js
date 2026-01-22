// import './style.css'; // Commented out for CDN preview
import { createSidebar } from './components/Sidebar.js';
import { createChatPanel } from './components/ChatPanel.js';
import { createRightPanel } from './components/RightPanel.js';
import { createLoginPage } from './components/pages/Login.js';
import { createRegisterPage } from './components/pages/Register.js';
import { showFriendRequestNotification } from './components/FriendRequestNotification.js';
import { connectWS, sendEvent, onWSEvent } from "./ws.js";
import { appendMessageToUI, clearMessages, loadConversationMessages, updateChatHeader } from './components/ChatPanel.js';
import { getState, setCurrentUser, setConversations, setCurrentConversation, addMessage, setMessages, addConversation } from './state.js';

const app = document.querySelector('#app');

// State
let currentState = 'login'; // login, register, chat

// Router
function render() {
    app.innerHTML = '';

    if (currentState === 'login') {
        app.className = 'w-full h-full bg-gray-50';
        app.appendChild(createLoginPage(handleLogin));
    }
    else if (currentState === 'register') {
        app.className = 'w-full h-full bg-gray-50';
        app.appendChild(createRegisterPage(navigateTo));
    }
    else if (currentState === 'chat') {
        app.className = 'w-full h-full flex overflow-hidden';

        // Components
        const sidebar = createSidebar();
        const chatPanel = createChatPanel();
        const rightPanel = createRightPanel();

        app.appendChild(sidebar);
        app.appendChild(chatPanel);
        app.appendChild(rightPanel);

        // Setup Chat Logic
        setupChatLogic(sidebar, rightPanel);
    }
}

// Handle Login
async function handleLogin(userId, username) {
    console.log("[App] Login attempt:", userId);
    
    // Import functions
    const { resetState } = await import('./state.js');
    const { clearWSEventHandlers, disconnectWS } = await import('./ws.js');
    
    // Ngắt kết nối cũ và clear handlers
    disconnectWS();
    clearWSEventHandlers();
    
    // Reset state trước khi login
    resetState();
    console.log("[App] State reset");
    
    // Wait a bit before reconnecting
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Connect WebSocket
    connectWS();
    
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Send auth
    sendEvent('auth', { user_id: userId });
    
    // Setup WebSocket handlers TRƯỚC KHI auth
    setupWebSocketHandlersGlobal();
    
    // Wait for auth_ok
    return new Promise((resolve) => {
        onWSEvent('auth_ok', (data) => {
            console.log("[App] ✅ Authenticated:", data);
            setCurrentUser({ user_id: userId, username: username || userId });
            
            // Load conversations
            sendEvent('get_conversations', {});
            
            navigateTo('chat');
            resolve();
        });
        
        onWSEvent('error', (data) => {
            console.error("[App] ❌ Auth error:", data);
            alert("Login failed: " + data.message);
        });
    });
}

// Setup WebSocket handlers globally (gọi lại khi re-login)
function setupWebSocketHandlersGlobal() {
    console.log("[App] Setting up WebSocket handlers...");
    
    // Nhận danh sách conversations
    onWSEvent('conversations_list', (data) => {
        console.log("[App] 📋 Conversations loaded:", data.conversations);
        console.log("[App] 📋 Is array?", Array.isArray(data.conversations));
        console.log("[App] 📋 Length:", data.conversations?.length);
        
        // Validate data
        if (data.conversations && Array.isArray(data.conversations)) {
            setConversations(data.conversations);
        } else {
            console.error("[App] ❌ Invalid conversations data:", data);
            setConversations([]);
        }
    });

    // Nhận tin nhắn đã load
    onWSEvent('messages_loaded', (data) => {
        console.log("[App] 💬 Messages loaded:", data.messages.length);
        setMessages(data.conversation_id, data.messages);
        loadConversationMessages(data.conversation_id);
    });

    // Nhận tin nhắn mới
    onWSEvent('new_message', (data) => {
        console.log("[App] 📨 New message:", data);
        const msg = data.message;
        const state = getState();
        
        // Add to state
        addMessage(data.conversation_id, msg);
        
        // ← SỬA: Chỉ hiển thị nếu KHÔNG phải tin nhắn của mình
        if (state.currentConversation?._id === data.conversation_id) {
            // Kiểm tra xem có phải tin nhắn của mình không
            const isMyMessage = msg.sender_id === state.currentUser?.user_id;
            
            // Chỉ hiển thị nếu là tin nhắn của người khác
            if (!isMyMessage) {
                appendMessageToUI({
                    type: "text",
                    user: msg.sender_id,
                    text: msg.text,
                    time: new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    isMe: false,
                    status: "sent",
                });
            }
        }
    });
    
    // Nhận thông báo tin nhắn mới từ người lạ (khi chưa join room)
    onWSEvent('new_message_notification', (data) => {
        console.log("[App] 🔔 New message notification from stranger:", data);
        
        // Thêm hoặc cập nhật conversation trong danh sách
        const state = getState();
        const existingConv = state.conversations.find(c => c._id === data.conversation_id);
        
        if (!existingConv) {
            // Thêm conversation mới vào danh sách
            addConversation(data.conversation);
        } else {
            // Cập nhật last_message
            const updatedConversations = state.conversations.map(c => 
                c._id === data.conversation_id 
                    ? { ...c, last_message: data.conversation.last_message }
                    : c
            );
            setConversations(updatedConversations);
        }
    });

    // Xác nhận đã gửi
    onWSEvent('send_ack', (data) => {
        console.log("[App] ✅ Message sent:", data);
    });
    
    // Nhận conversation mới được tạo
    onWSEvent('direct_conversation', (data) => {
        console.log("[App] 💬 Direct conversation:", data.conversation);
        const conv = data.conversation;
        
        // Thêm vào danh sách (nếu chưa có)
        const state = getState();
        const exists = state.conversations.find(c => c._id === conv._id);
        if (!exists) {
            addConversation(conv);
        }
        
        // Tự động mở conversation này
        setCurrentConversation(conv);
        clearMessages();
        updateChatHeader(conv);
        
        // Join room
        sendEvent("join", { conversation_id: conv._id }, "r_join_" + Date.now());
        
        // Load messages
        sendEvent("load_messages", { conversation_id: conv._id }, "r_load_" + Date.now());
    });
    
    // Nhận conversation mới từ người lạ
    onWSEvent('new_conversation', (data) => {
        console.log("[App] 🆕 New conversation from stranger:", data.conversation);
        addConversation(data.conversation);
        
        // Hiển thị notification cho tin nhắn lạ
        const conv = data.conversation;
        const currentUserId = getState().currentUser?.user_id;
        const otherUserId = conv.participants?.find(p => p !== currentUserId);
        
        if (otherUserId && conv.status === 'pending') {
            import('./components/FriendRequestNotification.js').then(({ showStrangerMessageNotification }) => {
                showStrangerMessageNotification(otherUserId);
            });
        }
    });
    
    // Nhận lời mời kết bạn
    onWSEvent('friend_request_received', (data) => {
        console.log("[App] 👥 Friend request from:", data.from_user_id);
        showFriendRequestNotification(data.from_user_id);
    });
    
    // Kết bạn thành công
    onWSEvent('friend_request_sent', (data) => {
        console.log("[App] ✅ Friend request sent to:", data.to_user_id);
        import('./components/Sidebar.js').then(({ showNotification }) => {
            showNotification(`Đã gửi lời mời kết bạn đến ${data.to_user_id}`, 'success');
        });
    });
    
    // Được chấp nhận kết bạn
    onWSEvent('friend_accepted', (data) => {
        console.log("[App] ✅ Friend request accepted by:", data.user_id);
        import('./components/Sidebar.js').then(({ showNotification }) => {
            showNotification(`${data.user_id} đã chấp nhận lời mời kết bạn!`, 'success');
        });
    });
    
    // Xử lý lỗi
    onWSEvent('error', (data) => {
        console.error("[App] ❌ Error:", data);
        
        import('./components/Sidebar.js').then(({ showNotification }) => {
            if (data.code === 'FRIEND_REQUEST_ERROR') {
                showNotification(data.message || 'Lỗi khi gửi lời mời kết bạn', 'error');
            } else if (data.code === 'USER_NOT_FOUND') {
                showNotification(data.message || 'Không tìm thấy user!', 'error');
            } else if (data.code === 'SELF_CHAT') {
                showNotification(data.message || 'Bạn không thể nhắn tin với chính mình!', 'error');
            } else if (data.message) {
                showNotification(data.message, 'error');
            }
        });
    });
    
    // Xử lý kết quả tìm kiếm (để Sidebar có thể dùng)
    onWSEvent('search_results', (data) => {
        console.log("[App] 🔍 Search results:", data.users);
        // Sidebar sẽ tự handle thông qua event này
        document.dispatchEvent(new CustomEvent('searchResults', {
            detail: { users: data.users }
        }));
    });
    
    // Friends list
    onWSEvent('friends_list', (data) => {
        console.log("[App] 👥 Friends:", data.friends);
        document.dispatchEvent(new CustomEvent('friendsList', {
            detail: { friends: data.friends }
        }));
    });
    
    // Friend requests
    onWSEvent('friend_requests', (data) => {
        console.log("[App] 📋 Friend requests:", data);
        document.dispatchEvent(new CustomEvent('friendRequests', {
            detail: { received: data.received, sent: data.sent }
        }));
    });
}

function navigateTo(state) {
    app.classList.add('opacity-50');
    setTimeout(() => {
        currentState = state;
        render();
        app.classList.remove('opacity-50');
    }, 150);
}

function setupChatLogic(sidebar, rightPanel) {
    const state = getState();
    
    // WebSocket handlers đã được setup trong handleLogin, không cần setup lại ở đây
    
    // Mobile Sidebar Toggle
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
        const drawerOverlay = document.createElement('div');
        drawerOverlay.className = 'fixed inset-0 bg-black/50 z-40 hidden opacity-0 transition-opacity duration-300 md:hidden';

        const mobileDrawer = sidebar.cloneNode(true);
        mobileDrawer.classList.remove('hidden', 'md:flex');
        mobileDrawer.classList.add('fixed', 'inset-y-0', 'left-0', 'z-50', 'translate-x-[-100%]', 'transition-transform', 'duration-300', 'shadow-xl');

        document.body.appendChild(drawerOverlay);
        document.body.appendChild(mobileDrawer);

        menuBtn.addEventListener('click', () => {
            drawerOverlay.classList.remove('hidden');
            requestAnimationFrame(() => {
                drawerOverlay.classList.remove('opacity-0');
                mobileDrawer.classList.remove('translate-x-[-100%]');
            });
        });

        const closeDrawer = () => {
            drawerOverlay.classList.add('opacity-0');
            mobileDrawer.classList.add('translate-x-[-100%]');
            setTimeout(() => {
                drawerOverlay.classList.add('hidden');
            }, 300);
        };

        drawerOverlay.addEventListener('click', closeDrawer);
    }

    // Right Panel Toggle
    const infoBtn = document.getElementById('info-btn');
    if (infoBtn) {
        infoBtn.addEventListener('click', () => {
            if (rightPanel.classList.contains('hidden')) {
                rightPanel.classList.remove('hidden');
                rightPanel.classList.add('flex');
            } else {
                rightPanel.classList.add('hidden');
                rightPanel.classList.remove('flex');
            }
        });
    }

    // Send Message
    const sendBtn = document.getElementById('send-btn');
    const msgInput = document.getElementById('message-input');
    if (sendBtn && msgInput) {
        sendBtn.addEventListener('click', () => {
            const text = msgInput.value.trim();
            if (!text) return;

            const currentConv = state.currentConversation;
            if (!currentConv) {
                alert("Please select a conversation first!");
                return;
            }

            // Hiển thị lên UI ngay
            appendMessageToUI({
                type: "text",
                user: "Me",
                text,
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
                isMe: true,
                status: "sending",
            });

            const clientMsgId = "c_" + Date.now();

            sendEvent("send_message", {
                conversation_id: currentConv._id,
                client_msg_id: clientMsgId,
                msg_type: "text",
                text,
            }, "r_" + clientMsgId);

            msgInput.value = "";
        });

        // Enter to send
        msgInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendBtn.click();
            }
        });
    }
}

// Xóa function setupWebSocketHandlers cũ (đã move lên setupWebSocketHandlersGlobal)

// Listen to conversation selection
document.addEventListener("selectConversation", (e) => {
    const conversation = e.detail.conversation;
    console.log("[App] 👆 Selected conversation:", conversation);
    
    setCurrentConversation(conversation);
    
    // Clear old messages
    clearMessages();
    
    // Update header
    updateChatHeader(conversation);
    
    // Join room
    sendEvent("join", { conversation_id: conversation._id }, "r_join_" + Date.now());
    
    // Load messages
    sendEvent("load_messages", { conversation_id: conversation._id }, "r_load_" + Date.now());
});

// Initial Render
render();
