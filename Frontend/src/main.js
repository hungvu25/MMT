// import './style.css'; // Commented out for CDN preview
import { createSidebar } from './components/Sidebar.js';
import { createChatPanel } from './components/ChatPanel.js';
import { createRightPanel } from './components/RightPanel.js';
import { createLoginPage } from './components/pages/Login.js';
import { createRegisterPage } from './components/pages/Register.js';
import { showFriendRequestNotification } from './components/FriendRequestNotification.js';
import { connectWS, sendEvent, onWSEvent } from "./ws.js";
import { appendMessageToUI, clearMessages, loadConversationMessages, updateChatHeader, initFileUpload, getSelectedFiles, clearSelectedFiles } from './components/ChatPanel.js';
import { getState, setCurrentUser, setConversations, setCurrentConversation, addMessage, setMessages, addConversation } from './state.js';
import { startTokenRefresh, stopTokenRefresh, refreshAccessToken } from './refreshToken.js';

const app = document.querySelector('#app');

// State
let currentState = 'login'; // login, register, chat

// Logout function
export function logout() {
    console.log("[App] Logging out...");
    
    // Stop token refresh
    stopTokenRefresh();
    
    // Clear token from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Disconnect WebSocket
    import('./ws.js').then(({ disconnectWS, clearWSEventHandlers }) => {
        disconnectWS();
        clearWSEventHandlers();
    });
    
    // Clear state
    import('./state.js').then(({ getState }) => {
        const state = getState();
        state.currentUser = null;
        state.conversations = [];
        state.currentConversation = null;
        state.messages = {};
    });
    
    // Redirect to login
    navigateTo('login');
}

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

    // Cleanup if leaving chat? (Not implemented for now)
}

// Handle Login
async function handleLogin(userId, username, token) {
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

    // Send auth with TOKEN
    if (token) {
        sendEvent('auth', { token: token });
    } else {
        // Fallback or error
        console.error("No token provided for auth");
        return;
    }

    // Setup WebSocket handlers TRƯỚC KHI auth
    setupWebSocketHandlersGlobal();

    // Wait for auth_ok
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error("Auth timeout"));
        }, 5000);

        onWSEvent('auth_ok', (data) => {
            clearTimeout(timer);
            console.log("[App] ✅ Authenticated:", data);
            setCurrentUser({ user_id: userId, username: username || userId });

            // Start token refresh
            startTokenRefresh();

            // Load conversations
            sendEvent('get_conversations', {});

            // Save state if not already (Login.js does it, but auto-login might need it)
            // But we trust Login.js or Auto-login logic to have set localStorage

            navigateTo('chat');
            resolve();
        });

        onWSEvent('error', (data) => {
            if (data.code === 'UNAUTH' || data.code === 'NO_USER') {
                clearTimeout(timer);
                console.error("[App] ❌ Auth error:", data);
                localStorage.removeItem('access_token'); // Clear invalid token
                alert("Session expired or invalid login: " + data.message);
                navigateTo('login');
                reject(new Error(data.message));
            }
        });
    });
}

// Global Event Listeners for Navigation
document.addEventListener('navigate', (e) => {
    navigateTo(e.detail);
});

// Token expired listener
window.addEventListener('tokenExpired', () => {
    console.log("[App] ❌ Token expired, logging out...");
    logout();
});

function isTokenExpired(token, skewSeconds = 30) {
    if (!token) return true;
    try {
        const payloadPart = token.split('.')[1];
        if (!payloadPart) return true;
        const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        if (!payload.exp) return true;
        return Date.now() / 1000 >= (payload.exp - skewSeconds);
    } catch (e) {
        return true;
    }
}

// Auto Login Check
(async function init() {
    let token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const userId = localStorage.getItem('user_id');
    const username = localStorage.getItem('username');

    if (refreshToken && isTokenExpired(token)) {
        await refreshAccessToken();
        token = localStorage.getItem('access_token');
    }

    if (token && userId) {
        console.log("Found existing token, auto-logging in...");
        try {
            await handleLogin(userId, username, token);
        } catch (e) {
            console.error("Auto login failed:", e);
            navigateTo('login');
        }
    } else {
        render(); // Render login page
    }
})();

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
        
        // Check if conversation exists in list, if not, fetch it
        const conversationExists = state.conversations.find(c => c._id === data.conversation_id);
        
        if (!conversationExists) {
            // Fetch conversation details and add to list
            console.log("[App] 📥 Conversation not in list, fetching...");
            sendEvent('get_conversations', {}, 'r_refresh_convs_' + Date.now());
        } else {
            // Update last_message in conversation
            const updatedConversations = state.conversations.map(c =>
                c._id === data.conversation_id
                    ? { 
                        ...c, 
                        last_message: {
                            text: msg.text || msg.file_name || "File",
                            sender_id: msg.sender_id,
                            created_at: msg.created_at
                        }
                    }
                    : c
            );
            setConversations(updatedConversations);
        }

        // ← SỬA: Chỉ hiển thị nếu KHÔNG phải tin nhắn của mình
        if (state.currentConversation?._id === data.conversation_id) {
            // Kiểm tra xem có phải tin nhắn của mình không
            const isMyMessage = msg.sender_id === state.currentUser?.user_id;

            // Chỉ hiển thị nếu là tin nhắn của người khác
            if (!isMyMessage) {
                const messageData = {
                    id: msg._id,
                    type: msg.msg_type || "text",
                    user: msg.sender_id,
                    text: msg.text || '',
                    time: new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    isMe: false,
                    status: "sent",
                };
                
                // Add file metadata if present
                if (msg.file_url) {
                    messageData.fileUrl = msg.file_url;
                    messageData.fileName = msg.file_name;
                // file size/text already set; status not shown in UI
                }
                
                appendMessageToUI(messageData);
            }
        }
    });

    // Presence updates
    onWSEvent('presence_update', (data) => {
        document.dispatchEvent(new CustomEvent('presenceUpdate', { detail: data }));
    });

    // Pinned message updates
    onWSEvent('pinned_message_updated', (data) => {
        console.log("[App] 📌 Pinned message updated:", data);
        const state = getState();
        const { conversation_id, pinned_message } = data;

        const updatedConvs = (state.conversations || []).map(c =>
            c._id === conversation_id ? { ...c, pinned_message } : c
        );
        setConversations(updatedConvs);

        if (state.currentConversation?._id === conversation_id) {
            const updatedCurrent = { ...state.currentConversation, pinned_message };
            setCurrentConversation(updatedCurrent);
            updateChatHeader(updatedCurrent);
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
        // Replace temp client id with server id in state
        const { conversation_id, client_msg_id, server_msg_id } = data;
        if (!conversation_id || !client_msg_id || !server_msg_id) return;
        const state = getState();
        const msgs = state.messages[conversation_id] || [];
        const updated = msgs.map(m => {
            if (m._id === client_msg_id) {
                return { ...m, _id: server_msg_id };
            }
            return m;
        });
        setMessages(conversation_id, updated);
        if (state.activeConversationId === conversation_id) {
            loadConversationMessages(conversation_id);
        }
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
        console.log("[App] ✅ Friend request sent:", data);
        import('./components/Sidebar.js').then(({ showNotification }) => {
            const targetUser = data.to_user_id || 'người dùng';
            showNotification(`Đã gửi lời mời kết bạn đến ${targetUser}`, 'success');
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

    // Group created
    onWSEvent('group_created', (data) => {
        console.log("[App] ✅ Group created:", data.conversation);
        const conversation = data.conversation;
        addConversation(conversation);
        setCurrentConversation(conversation._id);
        
        // Show notification
        import('./components/Sidebar.js').then(({ showNotification }) => {
            showNotification(`Đã tạo nhóm "${conversation.name || 'Nhóm mới'}"`, 'success');
        });
    });

    // New conversation (for groups user is added to)
    onWSEvent('new_conversation', (data) => {
        console.log("[App] 📬 New conversation:", data.conversation);
        addConversation(data.conversation);
    });

    // Member added
    onWSEvent('member_added', (data) => {
        console.log("[App] ➕ Member added:", data);
        const state = getState();
        const current = state.currentConversation;

        // If we’re looking at this convo, optimistically merge the new member so the right panel updates instantly
        if (current?._id === data.conversation_id) {
            const mergedMembers = Array.from(new Set([...(current.participants || []), data.member_id]));
            const updatedConv = { ...current, participants: mergedMembers };

            setCurrentConversation(updatedConv);
            const updatedConvs = (state.conversations || []).map(c =>
                c._id === updatedConv._id ? { ...c, participants: mergedMembers } : c
            );
            setConversations(updatedConvs);
            updateChatHeader(updatedConv);
        }

        // Still fetch the authoritative list to stay in sync
        sendEvent('get_conversations');
    });

    // Member removed
    onWSEvent('member_removed', (data) => {
        console.log("[App] ➖ Member removed:", data);
        // Always refresh conversations to update participant list immediately
        sendEvent('get_conversations');
    });

    // Conversation updated (after member changes)
    onWSEvent('conversation_updated', (data) => {
        const conv = data.conversation;
        if (!conv || !conv._id) return;
        const state = getState();
        const updatedConvs = (state.conversations || []).map(c =>
            c._id === conv._id ? conv : c
        );
        setConversations(updatedConvs);

        if (state.currentConversation?._id === conv._id) {
            setCurrentConversation(conv);
            updateChatHeader(conv);
        }
    });

    // Removed from group
    onWSEvent('removed_from_group', (data) => {
        console.log("[App] ⚠️ Removed from group:", data.conversation_id);
        import('./components/Sidebar.js').then(({ showNotification }) => {
            showNotification('Bạn đã bị xóa khỏi nhóm', 'warning');
        });
        
        // If currently viewing this conversation, clear it
        const state = getState();
        if (state.currentConversation?._id === data.conversation_id) {
            setCurrentConversation(null);
            setMessages([]);
            
            // Clear chat panel
            const chatPanel = document.getElementById('chat-panel');
            if (chatPanel) {
                chatPanel.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400">Chọn một đoạn chat để bắt đầu nhắn tin</div>';
            }
            
            // Clear right panel
            const rightPanel = document.getElementById('right-panel');
            if (rightPanel) {
                rightPanel.innerHTML = '';
            }
        }
        
        // Reload conversations to remove this group from list
        sendEvent('get_conversations');
    });

    // Group info updated
    onWSEvent('group_info_updated', (data) => {
        console.log("[App] 📝 Group info updated:", data);
        const state = getState();
        
        // Update conversations list
        const updatedConvs = state.conversations.map(c => {
            if (c._id === data.conversation_id) {
                return {
                    ...c,
                    name: data.name || c.name,
                    avatar: data.avatar || c.avatar
                };
            }
            return c;
        });
        setConversations(updatedConvs);
        
        // Update current conversation if it's the one being updated
        if (state.currentConversation?._id === data.conversation_id) {
            const updatedCurrentConv = {
                ...state.currentConversation,
                name: data.name || state.currentConversation.name,
                avatar: data.avatar || state.currentConversation.avatar
            };
            setCurrentConversation(updatedCurrentConv);
            updateChatHeader(updatedCurrentConv);
        }
    });
    
    // Conversation deleted
    onWSEvent('conversation_deleted', (data) => {
        console.log("[App] 🗑️ Conversation deleted:", data.conversation_id);
        const state = getState();
        
        // Remove from conversations list
        const updatedConvs = state.conversations.filter(c => c._id !== data.conversation_id);
        setConversations(updatedConvs);
        
        // If currently viewing this conversation, clear it
        if (state.currentConversation?._id === data.conversation_id) {
            setCurrentConversation(null);
            clearMessages();
            updateChatHeader(null);
        }
        
        import('./components/Sidebar.js').then(({ showNotification }) => {
            showNotification('Đoạn chat đã bị xóa', 'info');
        });
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
    
    // Initialize file upload functionality
    initFileUpload();

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
        sendBtn.addEventListener('click', async () => {
            const text = msgInput.value.trim();
            const files = getSelectedFiles();
            
            if (!text && files.length === 0) return;

            const currentConv = state.currentConversation;
            if (!currentConv) {
                alert("Please select a conversation first!");
                return;
            }

            // If there are files, upload them first
            if (files.length > 0) {
                for (const file of files) {
                    const isImage = file.type.startsWith('image/');
                    const fileSize = (file.size / 1024).toFixed(1) + ' KB';
                    
                    // Create FormData for file upload
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('conversation_id', currentConv._id);
                    if (text) formData.append('text', text);
                    
                    // Show uploading message
                    appendMessageToUI({
                        type: isImage ? "image" : "file",
                        user: "Me",
                        text: text || '',
                        fileName: file.name,
                        fileSize: fileSize,
                        time: new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                        isMe: true,
                        status: "sending",
                    });
                    
                    try {
                        // Upload file to backend
                        const token = localStorage.getItem('access_token');
                        const response = await fetch('http://localhost:8000/api/upload', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                            body: formData
                        });
                        
                        if (!response.ok) {
                            throw new Error('Upload failed');
                        }
                        
                        const result = await response.json();
                        console.log('[App] File uploaded:', result);
                        
                        // Send message via WebSocket with file info
                        const clientMsgId = "c_" + Date.now();
                        sendEvent("send_message", {
                            conversation_id: currentConv._id,
                            client_msg_id: clientMsgId,
                            msg_type: isImage ? "image" : "file",
                            text: text || '',
                            file_url: result.file_url,
                            file_name: file.name,
                            file_size: fileSize
                        }, "r_" + clientMsgId);
                        
                    } catch (error) {
                        console.error('[App] Upload error:', error);
                        alert('Failed to upload file');
                    }
                }
                
                // Clear files and text after sending
                clearSelectedFiles();
                msgInput.value = "";
            } else {
                // Text only message
                const clientMsgId = "c_" + Date.now();
                const message = {
                    _id: clientMsgId,
                    msg_type: "text",
                    sender_id: state.currentUser.user_id,
                    text,
                    created_at: Date.now(),
                    status: "sent",
                };

                // Update UI immediately
                appendMessageToUI({
                    id: message._id,
                    type: "text",
                    user: "Me",
                    text,
                    time: new Date(message.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                    isMe: true,
                    status: "sent",
                });

                // Update state cache
                addMessage(currentConv._id, message);

                // Send to server
                sendEvent("send_message", {
                    conversation_id: currentConv._id,
                    client_msg_id: clientMsgId,
                    msg_type: "text",
                    text,
                }, "r_" + clientMsgId);

                msgInput.value = "";
            }
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
    console.log("[App] Selected conversation:", conversation);

    const state = getState();
    const isSameConversation = state.activeConversationId === conversation._id;
    setCurrentConversation(conversation);

    // Render cached messages immediately if available to avoid blank UI
    if (state.messages?.[conversation._id]?.length) {
        loadConversationMessages(conversation._id);
    } else if (!isSameConversation) {
        // Clear only when switching to a different conversation without cache
        clearMessages();
    }

    // Update header
    updateChatHeader(conversation);

    // Join room
    sendEvent("join", { conversation_id: conversation._id }, "r_join_" + Date.now());

    // Load messages
    sendEvent("load_messages", { conversation_id: conversation._id }, "r_load_" + Date.now());
});

// Initial Render removed - controlled by init()

