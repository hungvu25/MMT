import { getState, subscribe, setCurrentConversation, addConversation } from '../state.js';
import { updateChatHeader } from './ChatPanel.js';
import { sendEvent, onWSEvent } from '../ws.js'; // ← SỬA: Thêm onWSEvent

export function createSidebar() {
    const sidebar = document.createElement('aside');
    sidebar.className = 'w-80 flex-shrink-0 bg-slate-900 flex flex-col border-r border-slate-800 text-slate-300 hidden md:flex h-full';

    sidebar.innerHTML = `
    <!-- Header -->
    <div class="h-16 flex items-center px-4 border-b border-slate-800 shrink-0">
      <h1 class="font-bold text-white text-lg tracking-tight">HacMieu Chat</h1>
      <button class="ml-auto w-9 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center cursor-pointer transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40" id="new-chat-btn" title="Start new chat">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>

    <!-- Search -->
    <div class="p-3 shrink-0">
      <div class="relative" id="search-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-2.5 text-slate-500"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input id="search-input" type="text" placeholder="Tìm kiếm hoặc kết bạn..." class="w-full bg-slate-800/50 text-sm text-slate-200 placeholder-slate-500 rounded-lg pl-10 pr-3 py-2 border border-slate-700/50 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:bg-slate-800 transition-all" />
      </div>
    </div>
    
    <!-- Tabs -->
    <div class="flex border-b border-slate-800 px-2 shrink-0">
      <button class="tab-btn flex-1 py-2.5 text-sm font-medium text-indigo-400 border-b-2 border-indigo-500 transition-colors" data-tab="chats">
        Chats
      </button>
      <button class="tab-btn flex-1 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-300 border-b-2 border-transparent transition-colors" data-tab="friends">
        Bạn bè
      </button>
    </div>

    <!-- Content Container -->
    <div class="flex-1 overflow-y-auto">
      <!-- Chats Tab Content -->
      <div id="chats-content" class="tab-content px-2 space-y-4 py-2">
        <!-- Direct Messages (Friends) -->
        <div>
          <h2 class="px-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Direct Messages</h2>
          <div id="friends-conversations-list" class="space-y-0.5">
            <div class="text-center text-slate-500 text-sm py-4">
              Loading conversations...
            </div>
          </div>
        </div>
        
        <!-- Stranger Messages -->
        <div id="strangers-section" class="hidden">
          <h2 class="px-2 text-xs font-semibold uppercase tracking-wider text-amber-500 mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Message Requests
          </h2>
          <div id="strangers-conversations-list" class="space-y-0.5">
          </div>
        </div>
      </div>
      
      <!-- Friends Tab Content -->
      <div id="friends-content" class="tab-content hidden px-2 space-y-4 py-2">
        <!-- Friend Requests Received -->
        <div id="friend-requests-section">
          <div class="flex items-center justify-between px-2 mb-2">
            <h2 class="text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
              Lời mời kết bạn
            </h2>
            <span id="request-count" class="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full hidden">0</span>
          </div>
          <div id="friend-requests-list" class="space-y-0.5">
            <div class="text-center text-slate-500 text-sm py-8">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-2 text-slate-600"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Không có lời mời nào
            </div>
          </div>
        </div>
        
        <!-- Friends List -->
        <div>
          <div class="flex items-center justify-between px-2 mb-2">
            <h2 class="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Bạn bè
            </h2>
            <span id="friends-count" class="text-xs text-slate-500">0</span>
          </div>
          <div id="friends-list" class="space-y-0.5">
            <div class="text-center text-slate-500 text-sm py-8">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-2 text-slate-600"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              Chưa có bạn bè nào<br>
              <span class="text-xs">Tìm kiếm và kết bạn ngay!</span>
            </div>
          </div>
        </div>
        
        <!-- Sent Requests -->
        <div id="sent-requests-section" class="hidden">
          <h2 class="px-2 text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Đã gửi lời mời
          </h2>
          <div id="sent-requests-list" class="space-y-0.5"></div>
        </div>
      </div>
    </div>

    <!-- User Profile Footer -->
    <div class="h-14 bg-slate-950/50 flex items-center px-3 border-t border-slate-800 shrink-0">
      <div id="user-avatar" class="w-8 h-8 rounded bg-indigo-500 flex items-center justify-center text-white font-medium mr-3">
        ?
      </div>
      <div class="flex-1 min-w-0">
        <div id="user-name" class="text-sm font-medium text-white truncate">Loading...</div>
        <div class="text-xs text-slate-500 truncate">Online</div>
      </div>
      <div class="flex space-x-1">
        <button class="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      </div>
    </div>
  `;

    // Subscribe to state changes
    subscribe((state) => {
        updateSidebar(sidebar, state);
    });

    // Initial render
    const state = getState();
    updateSidebar(sidebar, state);

    // Xử lý nút "New Chat"
    const newChatBtn = sidebar.querySelector('#new-chat-btn');
    if (newChatBtn) {
      newChatBtn.addEventListener('click', () => {
        showNewChatModal();
      });
    }
    
    // Xử lý tìm kiếm
    const searchInput = sidebar.querySelector('#search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            // Debounce search
            clearTimeout(searchTimeout);
            if (query.length < 2) {
                hideSearchResults();
                return;
            }
            
            searchTimeout = setTimeout(() => {
                console.log("[Sidebar] Searching for:", query);
                sendEvent('search_users', { query }, 'r_search_' + Date.now());
            }, 300);
        });
    }
    
    // Lắng nghe kết quả tìm kiếm từ main.js
    document.addEventListener('searchResults', (e) => {
        console.log("[Sidebar] Search results received:", e.detail.users);
        showSearchResults(sidebar, e.detail.users);
    });
    
    // Xử lý tabs
    const tabButtons = sidebar.querySelectorAll('.tab-btn');
    const chatsContent = sidebar.querySelector('#chats-content');
    const friendsContent = sidebar.querySelector('#friends-content');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            // Update active tab styling
            tabButtons.forEach(b => {
                b.classList.remove('text-indigo-400', 'border-indigo-500');
                b.classList.add('text-slate-500', 'border-transparent');
            });
            btn.classList.remove('text-slate-500', 'border-transparent');
            btn.classList.add('text-indigo-400', 'border-indigo-500');
            
            // Show/hide content
            if (tab === 'chats') {
                chatsContent.classList.remove('hidden');
                friendsContent.classList.add('hidden');
            } else if (tab === 'friends') {
                chatsContent.classList.add('hidden');
                friendsContent.classList.remove('hidden');
                
                // Load friends data
                loadFriendsData(sidebar);
            }
        });
    });

    return sidebar;
}

function updateSidebar(sidebar, state) {
    console.log("[Sidebar] updateSidebar called with:", state.conversations?.length, "conversations");
    
    // Update user info
    if (state.currentUser) {
        const userAvatar = sidebar.querySelector('#user-avatar');
        const userName = sidebar.querySelector('#user-name');
        
        if (userAvatar && userName) {
            const firstLetter = (state.currentUser.username || state.currentUser.user_id)[0].toUpperCase();
            userAvatar.textContent = firstLetter;
            userName.textContent = state.currentUser.username || state.currentUser.user_id;
        }
    }

    // Get conversation lists
    const friendsList = sidebar.querySelector('#friends-conversations-list');
    const strangersList = sidebar.querySelector('#strangers-conversations-list');
    const strangersSection = sidebar.querySelector('#strangers-section');
    
    if (!friendsList || !strangersList || !strangersSection) {
        console.error("[Sidebar] Required elements not found!");
        return;
    }

    console.log("[Sidebar] Updating conversations:", state.conversations);

    if (!state.conversations || state.conversations.length === 0) {
        friendsList.innerHTML = `
            <div class="text-center text-slate-500 text-sm py-4">
                No conversations yet.<br>
                <span class="text-xs">Click + to start a new chat</span>
            </div>
        `;
        strangersSection.classList.add('hidden');
        return;
    }

    // Separate friends and strangers
    const acceptedConvs = state.conversations.filter(c => c.status === 'accepted' || !c.status);
    const pendingConvs = state.conversations.filter(c => 
        c.status === 'pending' && c.last_message !== null && c.last_message !== undefined
    );
    
    console.log("[Sidebar] Accepted:", acceptedConvs.length, "Pending:", pendingConvs.length);

    // Render friends
    if (acceptedConvs.length === 0) {
        friendsList.innerHTML = `
            <div class="text-center text-slate-500 text-sm py-4">
                No conversations yet.<br>
                <span class="text-xs">Click + to start a new chat</span>
            </div>
        `;
    } else {
        friendsList.innerHTML = '';
        acceptedConvs.forEach(conv => {
            friendsList.appendChild(createConversationItem(conv, state, false));
        });
    }

    // Render strangers
    if (pendingConvs.length === 0) {
        strangersSection.classList.add('hidden');
    } else {
        strangersSection.classList.remove('hidden');
        strangersList.innerHTML = '';
        pendingConvs.forEach(conv => {
            strangersList.appendChild(createConversationItem(conv, state, true));
        });
    }
    
    console.log("[Sidebar] Rendered", acceptedConvs.length, "friends,", pendingConvs.length, "strangers");
}

function createConversationItem(conversation, state, isStranger = false) {
    const currentUserId = state.currentUser?.user_id;
    const isActive = state.currentConversation?._id === conversation._id;
    
    // Get other user ID for direct chat
    let displayName = 'Unknown';
    if (conversation.type === 'direct') {
        const otherUserId = conversation.participants.find(p => p !== currentUserId);
        displayName = otherUserId || 'Unknown User';
    } else {
        displayName = conversation.name || 'Group Chat';
    }

    const lastMsg = conversation.last_message;
    const lastMsgText = lastMsg ? lastMsg.text : 'No messages yet';
    const lastMsgTime = lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    const item = document.createElement('button');
    
    // Improved styling cho stranger vs friend
    if (isStranger) {
        item.className = `w-full flex items-center px-3 py-2.5 rounded-lg ${isActive ? 'bg-gradient-to-r from-amber-600 to-orange-600 shadow-lg shadow-amber-500/20' : 'bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50'} transition-all duration-200 group`;
    } else {
        item.className = `w-full flex items-center px-3 py-2.5 rounded-lg ${isActive ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20' : 'hover:bg-slate-800 hover:shadow-md'} transition-all duration-200 group`;
    }
    
    // Badge cho người lạ
    const badge = isStranger ? `
        <div class="flex items-center space-x-1 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-400"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12.01" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/></svg>
            <span class="text-[10px] font-medium text-amber-400">Người lạ</span>
        </div>
    ` : '';
    
    item.innerHTML = `
        <div class="relative flex-shrink-0">
            <div class="w-11 h-11 rounded-full bg-gradient-to-br ${isStranger ? 'from-amber-500 to-orange-600' : 'from-indigo-500 to-purple-600'} flex items-center justify-center text-white text-base font-bold mr-3">
                ${displayName[0].toUpperCase()}
            </div>
            ${!isStranger ? '<div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>' : ''}
        </div>
        <div class="flex-1 min-w-0 text-left ml-3">
            <div class="flex items-center justify-between mb-0.5">
                <span class="truncate text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-200'}">${displayName}</span>
                ${lastMsgTime ? `<span class="text-xs ${isActive ? 'text-slate-200' : 'text-slate-500'} ml-2">${lastMsgTime}</span>` : ''}
            </div>
            ${badge}
            <p class="text-xs ${isActive ? (isStranger ? 'text-amber-200/80' : 'text-slate-200') : (isStranger ? 'text-amber-400/70' : 'text-slate-500')} truncate mt-0.5">${lastMsgText}</p>
        </div>
    `;

    item.addEventListener('click', () => {
        // Dispatch event to main.js
        document.dispatchEvent(new CustomEvent('selectConversation', {
            detail: { conversation }
        }));
        
        // Update header
        updateChatHeader(conversation);
    });

    return item;
}

// Function để tạo chat mới
function startDirectChat(otherUserId) {
  const state = getState();
  
  if (!otherUserId || otherUserId.trim() === '') {
    showNotification("Vui lòng nhập User ID hợp lệ!", "error");
    return;
  }
  
  if (otherUserId === state.currentUser?.user_id) {
    showNotification("Bạn không thể nhắn tin với chính mình!", "error");
    return;
  }
  
  console.log("[Sidebar] Creating chat with:", otherUserId);
  sendEvent('get_direct_conversation', { other_user_id: otherUserId });
}

// Beautiful modal for new chat
function showNewChatModal() {
    // Remove existing modal if any
    const existingModal = document.getElementById('new-chat-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'new-chat-modal';
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in';
    
    modal.innerHTML = `
        <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 p-6 max-w-md w-full mx-4 animate-scale-in">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-bold text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"mr-2 text-indigo-400\"><path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\"/></svg>
                    Bắt đầu chat mới
                </h3>
                <button class=\"modal-close text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700 rounded-lg\">
                    <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/></svg>
                </button>
            </div>
            
            <p class=\"text-sm text-slate-400 mb-4\">Nhập User ID của người bạn muốn kết nối</p>
            
            <div class=\"mb-5\">
                <label class=\"block text-sm font-medium text-slate-300 mb-2\">User ID</label>
                <input type=\"text\" id=\"modal-user-id\" placeholder=\"vd: hungdeptrai, user_123\" class=\"w-full bg-slate-900/50 text-white placeholder-slate-500 rounded-lg px-4 py-3 border border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all\" autofocus />
            </div>
            
            <div class=\"grid grid-cols-2 gap-3\">
                <button class=\"modal-friend-btn bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50\">
                    <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"inline mr-1\"><path d=\"M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2\"/><circle cx=\"8.5\" cy=\"7\" r=\"4\"/><line x1=\"20\" y1=\"8\" x2=\"20\" y2=\"14\"/><line x1=\"23\" y1=\"11\" x2=\"17\" y2=\"11\"/></svg>
                    Kết bạn
                </button>
                <button class=\"modal-submit bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50\">
                    <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"inline mr-1\"><path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\"/></svg>
                    Nhắn tin
                </button>
            </div>
            <button class=\"modal-cancel w-full mt-2 bg-slate-700/30 hover:bg-slate-700/50 text-slate-400 hover:text-white font-medium py-2 px-4 rounded-lg transition-all text-sm\">
                Hủy
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const input = modal.querySelector('#modal-user-id');
    const submitBtn = modal.querySelector('.modal-submit');
    const friendBtn = modal.querySelector('.modal-friend-btn');
    const cancelBtn = modal.querySelector('.modal-cancel');
    const closeBtn = modal.querySelector('.modal-close');
    
    // Auto focus
    setTimeout(() => input.focus(), 100);
    
    // Submit on Enter
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitBtn.click();
        }
    });
    
    // Friend request handler
    friendBtn.addEventListener('click', () => {
        const userId = input.value.trim();
        if (userId) {
            console.log("[Modal] Sending friend request to:", userId);
            sendEvent('send_friend_request', { to_user_id: userId });
            modal.remove();
        } else {
            showNotification('Vui lòng nhập User ID!', 'error');
        }
    });
    
    // Chat handler
    submitBtn.addEventListener('click', () => {
        const userId = input.value.trim();
        if (userId) {
            startDirectChat(userId);
            modal.remove();
        }
    });
    
    // Cancel handlers
    cancelBtn.addEventListener('click', () => modal.remove());
    closeBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Beautiful notification
export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 z-[200] animate-slide-in-right';
    
    const colors = {
        error: 'from-red-600 to-red-700 border-red-500/50',
        success: 'from-green-600 to-green-700 border-green-500/50',
        info: 'from-blue-600 to-blue-700 border-blue-500/50'
    };
    
    const icons = {
        error: '<path d=\"M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z\"/>',
        success: '<path d=\"M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z\"/>',
        info: '<path d=\"M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z\"/>'
    };
    
    notification.innerHTML = `
        <div class=\"bg-gradient-to-r ${colors[type]} border rounded-lg shadow-2xl px-4 py-3 flex items-center space-x-3 max-w-sm\">
            <svg xmlns=\"http://www.w3.org/2000/svg\" class=\"h-5 w-5 text-white\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">
                ${icons[type]}
            </svg>
            <span class=\"text-white font-medium text-sm\">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('animate-fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showSearchResults(sidebar, users) {
    // Xóa kết quả cũ nếu có
    let resultsPanel = sidebar.querySelector('#search-results-panel');
    if (resultsPanel) {
        resultsPanel.remove();
    }
    
    if (users.length === 0) {
        return;
    }
    
    // Tạo panel kết quả tìm kiếm với UI hiện đại
    resultsPanel = document.createElement('div');
    resultsPanel.id = 'search-results-panel';
    resultsPanel.className = 'absolute left-0 right-0 top-[70px] mx-3 bg-slate-800 rounded-xl border border-slate-700/50 shadow-2xl shadow-black/50 backdrop-blur-sm z-50 max-h-80 overflow-y-auto';
    
    resultsPanel.innerHTML = `
        <div class="px-3 py-2.5 border-b border-slate-700/50 bg-slate-750">
            <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                Kết quả tìm kiếm (${users.length})
            </div>
        </div>
        <div class="p-2" id="search-results-list"></div>
    `;
    
    const resultsList = resultsPanel.querySelector('#search-results-list');
    
    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'group flex items-center px-3 py-2.5 rounded-lg hover:bg-slate-700/50 transition-all duration-200';
        
        userItem.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-sm font-bold mr-3 group-hover:from-indigo-600 group-hover:to-purple-600 transition-all">
                ${user.username[0].toUpperCase()}
            </div>
            <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">${user.username}</div>
                <div class="text-xs text-slate-500">@${user.user_id}</div>
            </div>
            <div class="flex space-x-2">
                <button class="add-friend-btn p-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-lg text-white transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center space-x-1" title="Kết bạn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                    <span class="text-xs font-medium hidden sm:inline">Kết bạn</span>
                </button>
                <button class="chat-btn p-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white transition-all" title="Nhắn tin">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </button>
            </div>
        `;
        
        const addFriendBtn = userItem.querySelector('.add-friend-btn');
        const chatBtn = userItem.querySelector('.chat-btn');
        
        addFriendBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log("[Sidebar] Sending friend request to:", user.user_id);
            sendEvent('send_friend_request', { to_user_id: user.user_id });
            
            // Show success feedback
            addFriendBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            `;
            addFriendBtn.classList.add('bg-green-600', 'hover:bg-green-700', 'shadow-green-500/20');
            addFriendBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700', 'shadow-indigo-500/20');
            addFriendBtn.disabled = true;
        });
        
        chatBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            startDirectChat(user.user_id);
            hideSearchResults();
            const searchInput = sidebar.querySelector('#search-input');
            if (searchInput) searchInput.value = '';
        });
        
        resultsList.appendChild(userItem);
    });
    
    sidebar.style.position = 'relative';
    sidebar.appendChild(resultsPanel);
    
    // Đóng khi click bên ngoài
    setTimeout(() => {
        document.addEventListener('click', function closeResults(e) {
            if (!resultsPanel.contains(e.target) && !sidebar.querySelector('#search-input').contains(e.target)) {
                hideSearchResults();
                document.removeEventListener('click', closeResults);
            }
        });
    }, 100);
}

function hideSearchResults() {
    const resultsPanel = document.querySelector('#search-results-panel');
    if (resultsPanel) {
        resultsPanel.remove();
    }
}

function loadFriendsData(sidebar) {
    console.log("[Sidebar] Loading friends data...");
    
    // Request friends and friend requests from server
    sendEvent('get_friends', {}, 'r_get_friends_' + Date.now());
    sendEvent('get_friend_requests', {}, 'r_get_friend_requests_' + Date.now());
}

// Setup global event listeners (chỉ 1 lần)
document.addEventListener('friendsList', (e) => {
    const sidebar = document.querySelector('aside');
    if (sidebar) {
        console.log("[Sidebar] Friends received:", e.detail.friends);
        renderFriendsList(sidebar, e.detail.friends);
    }
});

document.addEventListener('friendRequests', (e) => {
    const sidebar = document.querySelector('aside');
    if (sidebar) {
        console.log("[Sidebar] Friend requests received:", e.detail);
        renderFriendRequests(sidebar, e.detail.received, e.detail.sent);
    }
});

function renderFriendsList(sidebar, friends) {
    const friendsList = sidebar.querySelector('#friends-list');
    const friendsCount = sidebar.querySelector('#friends-count');
    
    if (!friendsList) return;
    
    if (friendsCount) {
        friendsCount.textContent = friends.length;
    }
    
    if (friends.length === 0) {
        friendsList.innerHTML = `
            <div class="text-center text-slate-500 text-sm py-8">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-2 text-slate-600"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                Chưa có bạn bè nào<br>
                <span class="text-xs">Tìm kiếm và kết bạn ngay!</span>
            </div>
        `;
        return;
    }
    
    friendsList.innerHTML = '';
    friends.forEach(friendId => {
        const item = document.createElement('div');
        item.className = 'group flex items-center px-2 py-2.5 rounded-lg hover:bg-slate-800/50 transition-all cursor-pointer';
        
        item.innerHTML = `
            <div class="relative">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold mr-3">
                    ${friendId[0].toUpperCase()}
                </div>
                <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
            </div>
            <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-slate-200">${friendId}</div>
                <div class="text-xs text-green-400 flex items-center">
                    <div class="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
                    Online
                </div>
            </div>
            <button class="message-btn opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-indigo-600 rounded-lg text-slate-400 hover:text-white" data-user-id="${friendId}" title="Nhắn tin">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </button>
        `;
        
        // Click to start chat
        const messageBtn = item.querySelector('.message-btn');
        messageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            startDirectChat(friendId);
            // Switch back to chats tab
            const chatsTab = sidebar.querySelector('[data-tab="chats"]');
            if (chatsTab) chatsTab.click();
        });
        
        friendsList.appendChild(item);
    });
}

function renderFriendRequests(sidebar, received, sent) {
    const requestsList = sidebar.querySelector('#friend-requests-list');
    const requestCount = sidebar.querySelector('#request-count');
    const sentList = sidebar.querySelector('#sent-requests-list');
    const sentSection = sidebar.querySelector('#sent-requests-section');
    
    // Render received requests
    if (!requestsList) return;
    
    if (requestCount) {
        if (received.length > 0) {
            requestCount.textContent = received.length;
            requestCount.classList.remove('hidden');
        } else {
            requestCount.classList.add('hidden');
        }
    }
    
    if (received.length === 0) {
        requestsList.innerHTML = `
            <div class="text-center text-slate-500 text-sm py-8">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-2 text-slate-600"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Không có lời mời nào
            </div>
        `;
    } else {
        requestsList.innerHTML = '';
        received.forEach(req => {
            const item = createFriendRequestItem(req.from_user);
            requestsList.appendChild(item);
        });
    }
    
    // Render sent requests
    if (sent.length === 0) {
        sentSection.classList.add('hidden');
    } else {
        sentSection.classList.remove('hidden');
        sentList.innerHTML = '';
        sent.forEach(req => {
            const item = document.createElement('div');
            item.className = 'flex items-center px-2 py-2 rounded-lg bg-slate-800/30 border border-slate-700/50';
            
            item.innerHTML = `
                <div class="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-bold mr-3">
                    ${req.to_user[0].toUpperCase()}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-slate-300">${req.to_user}</div>
                    <div class="text-xs text-slate-500 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        Đang chờ phản hồi...
                    </div>
                </div>
            `;
            
            sentList.appendChild(item);
        });
    }
}

function createFriendRequestItem(fromUserId) {
    const item = document.createElement('div');
    item.className = 'px-3 py-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 hover:border-amber-500/50 transition-all';
    
    item.innerHTML = `
        <div class="flex items-start space-x-3">
            <div class="relative shrink-0">
                <div class="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-base font-bold">
                    ${fromUserId[0].toUpperCase()}
                </div>
                <div class="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                </div>
            </div>
            <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-slate-100 mb-0.5">${fromUserId}</div>
                <div class="text-xs text-amber-400/80 mb-2.5">muốn kết bạn với bạn</div>
                <div class="flex space-x-2">
                    <button class="accept-btn flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline mr-1"><polyline points="20 6 9 17 4 12"/></svg>
                        Đồng ý
                    </button>
                    <button class="reject-btn flex-1 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium py-2 px-3 rounded-lg transition-all">
                        Từ chối
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const acceptBtn = item.querySelector('.accept-btn');
    const rejectBtn = item.querySelector('.reject-btn');
    
    acceptBtn.addEventListener('click', () => {
        console.log("[Sidebar] Accepting friend request from:", fromUserId);
        sendEvent('accept_friend_request', { from_user_id: fromUserId });
        
        // Show success animation
        item.classList.add('animate-pulse');
        item.innerHTML = `
            <div class="flex items-center justify-center py-2 text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><polyline points="20 6 9 17 4 12"/></svg>
                <span class="text-sm font-medium">Đã chấp nhận!</span>
            </div>
        `;
        
        setTimeout(() => {
            item.remove();
            // Reload friends data
            const sidebar = document.querySelector('aside');
            if (sidebar) loadFriendsData(sidebar);
        }, 1500);
    });
    
    rejectBtn.addEventListener('click', () => {
        console.log("[Sidebar] Rejecting friend request from:", fromUserId);
        // TODO: Implement reject
        item.classList.add('opacity-50');
        setTimeout(() => item.remove(), 300);
    });
    
    return item;
}
