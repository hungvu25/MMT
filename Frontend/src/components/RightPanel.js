import { getState, subscribe } from '../state.js';
import { sendEvent } from '../ws.js';

export function createRightPanel() {
    const panel = document.createElement('aside');
    panel.className = 'w-72 bg-white border-l border-gray-200 flex-col hidden xl:flex overflow-y-auto shrink-0';

    // Subscribe to state changes
    subscribe((state) => {
        updateRightPanel(panel, state);
    });

    // Initial render
    const state = getState();
    updateRightPanel(panel, state);

    return panel;
}

function updateRightPanel(panel, state) {
    const conv = state.currentConversation;
    const currentUser = state.currentUser;

    if (!conv) {
        // No conversation selected
        panel.innerHTML = `
            <div class="flex items-center justify-center h-full text-slate-400 text-center p-6">
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-3 opacity-50"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <p class="text-sm">Select a conversation to<br>view details</p>
                </div>
            </div>
        `;
        return;
    }

    // Get conversation info
    const isGroup = conv.type === 'group';
    const convName = isGroup ? (conv.name || 'Unnamed Group') : getDirectChatName(conv, currentUser?.user_id);
    const avatar = conv.avatar || (isGroup ? '#' : convName[0]?.toUpperCase());
    const members = conv.participants || [];
    const memberCount = members.length;

    // For direct chat, show user info
    if (!isGroup) {
        const otherUserId = members.find(id => id !== currentUser?.user_id);
        panel.innerHTML = `
            <div class="p-6 text-center border-b border-gray-100">
                <div class="w-20 h-20 mx-auto bg-indigo-100 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600 mb-3 shadow-inner">
                    ${avatar}
                </div>
                <h2 class="font-bold text-slate-900 text-lg">${convName}</h2>
                <p class="text-sm text-slate-500 mt-1">Direct Message</p>
            </div>

            <!-- Actions -->
            <div class="flex justify-center gap-4 py-4 border-b border-gray-100">
                <button class="flex flex-col items-center gap-1 group">
                    <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </div>
                    <span class="text-xs font-medium text-slate-500 group-hover:text-indigo-600">Files</span>
                </button>
                <button class="flex flex-col items-center gap-1 group">
                    <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                    </div>
                    <span class="text-xs font-medium text-slate-500 group-hover:text-indigo-600">Links</span>
                </button>
            </div>

            <div class="flex-1 p-4">
                <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">About</div>
                <div class="text-sm text-slate-600">User ID: ${otherUserId}</div>
            </div>
        `;
        return;
    }

    // For group chat
    const isAdmin = currentUser?.user_id === conv.created_by;
    
    panel.innerHTML = `
        <div class="p-6 text-center border-b border-gray-100">
            <div class="w-20 h-20 mx-auto bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-indigo-600 mb-3 shadow-inner">
                ${avatar}
            </div>
            <h2 class="font-bold text-slate-900 text-lg flex items-center justify-center gap-2">
                ${convName}
                ${isAdmin ? `
                    <button class="edit-group-name-btn p-1 hover:bg-slate-100 rounded transition-colors" title="Đổi tên nhóm">
                        <svg class="w-4 h-4 text-slate-400 hover:text-indigo-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                ` : ''}
            </h2>
            <p class="text-sm text-slate-500 mt-1">Group Chat • ${memberCount} members</p>
        </div>

        <!-- Actions -->
        <div class="flex justify-center gap-4 py-4 border-b border-gray-100">
            <button class="add-member-btn flex flex-col items-center gap-1 group">
                <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                </div>
                <span class="text-xs font-medium text-slate-500 group-hover:text-indigo-600">Add</span>
            </button>
            <button class="flex flex-col items-center gap-1 group">
                <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </div>
                <span class="text-xs font-medium text-slate-500 group-hover:text-indigo-600">Files</span>
            </button>
            ${isAdmin ? `
                <button class="delete-conversation-btn flex flex-col items-center gap-1 group">
                    <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                        <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </div>
                    <span class="text-xs font-medium text-slate-500 group-hover:text-red-600">Delete</span>
                </button>
            ` : ''}
        </div>

        <!-- Members -->
        <div class="flex-1 p-4">
            <div class="flex items-center justify-between mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Members</span>
                <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">${memberCount}</span>
            </div>
            
            <div class="space-y-1" id="members-list">
                ${members.map(memberId => createMemberItem(memberId, currentUser?.user_id, conv.created_by, conv._id)).join('')}
            </div>
        </div>
    `;

    // Add event listeners for kick buttons
    const kickButtons = panel.querySelectorAll('.kick-member-btn');
    kickButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const memberId = btn.dataset.memberId;
            const conversationId = btn.dataset.conversationId;
            if (confirm(`Bạn có chắc muốn kick ${memberId} ra khỏi nhóm?`)) {
                sendEvent('remove_group_member', {
                    conversation_id: conversationId,
                    member_id: memberId
                });
            }
        });
    });
    
    // Add member button
    const addMemberBtn = panel.querySelector('.add-member-btn');
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', () => {
            showAddMemberModal(conv._id, members);
        });
    }
    
    // Edit group name button
    const editNameBtn = panel.querySelector('.edit-group-name-btn');
    if (editNameBtn) {
        editNameBtn.addEventListener('click', () => {
            showEditGroupNameModal(conv._id, convName);
        });
    }
    
    // Delete conversation button
    const deleteBtn = panel.querySelector('.delete-conversation-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Bạn có chắc muốn xóa nhóm "${convName}"? Hành động này không thể hoàn tác!`)) {
                sendEvent('delete_conversation', {
                    conversation_id: conv._id
                });
            }
        });
    }
}

function getDirectChatName(conv, currentUserId) {
    const otherUserId = conv.participants?.find(id => id !== currentUserId);
    return otherUserId || 'Unknown';
}

function createMemberItem(memberId, currentUserId, creatorId, conversationId) {
    const isMe = memberId === currentUserId;
    const isCreator = memberId === creatorId;
    const canKick = currentUserId === creatorId && !isMe;
    const displayName = isMe ? 'Me' : memberId;
    
    return `
        <div class="flex items-center py-2 px-2 hover:bg-slate-50 rounded-lg group transition-colors">
            <div class="relative w-8 h-8 mr-3">
                <div class="w-full h-full rounded bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">${displayName[0].toUpperCase()}</div>
            </div>
            <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-slate-700 truncate">${displayName}</div>
                ${isCreator ? '<div class="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 rounded w-fit font-semibold mt-0.5">Admin</div>' : ''}
            </div>
            
            ${canKick ? `
                <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="kick-member-btn text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded" data-member-id="${memberId}" data-conversation-id="${conversationId}" title="Kick member">
                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

// Modal for adding members
function showAddMemberModal(conversationId, currentMembers) {
    const existingModal = document.getElementById('add-member-modal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'add-member-modal';
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in';
    
    modal.innerHTML = `
        <div class="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md mx-4">
            <div class="flex items-center justify-between p-6 border-b border-slate-700">
                <h2 class="text-xl font-bold text-white">Thêm thành viên</h2>
                <button class="close-btn text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>
            <div class="p-6">
                <div id="friends-select-list" class="space-y-2 max-h-96 overflow-y-auto">
                    <div class="text-center text-slate-500 py-4">Đang tải danh sách bạn bè...</div>
                </div>
            </div>
            <div class="flex justify-end gap-3 p-6 border-t border-slate-700">
                <button class="cancel-btn px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">Hủy</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Load friends
    const friendsListDiv = modal.querySelector('#friends-select-list');
    
    const handleFriendsList = (e) => {
        const friends = e.detail?.friends || [];
        const availableFriends = friends.filter(f => !currentMembers.includes(f.user_id));
        
        if (availableFriends.length === 0) {
            friendsListDiv.innerHTML = '<div class="text-center text-slate-500 py-4">Tất cả bạn bè đã ở trong nhóm</div>';
            return;
        }
        
        friendsListDiv.innerHTML = availableFriends.map(friend => `
            <div class="flex items-center justify-between p-3 hover:bg-slate-700/50 rounded-lg transition-colors">
                <div class="flex items-center">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold mr-3">
                        ${(friend.username || friend.user_id)[0].toUpperCase()}
                    </div>
                    <span class="text-slate-200">${friend.username || friend.user_id}</span>
                </div>
                <button class="add-friend-to-group-btn px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm" data-friend-id="${friend.user_id}">
                    Thêm
                </button>
            </div>
        `).join('');
        
        // Add event listeners
        modal.querySelectorAll('.add-friend-to-group-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const friendId = btn.dataset.friendId;
                sendEvent('add_group_member', {
                    conversation_id: conversationId,
                    member_id: friendId
                });
                btn.textContent = 'Đã thêm';
                btn.disabled = true;
                btn.classList.add('opacity-50', 'cursor-not-allowed');
            });
        });
    };
    
    document.addEventListener('friendsList', handleFriendsList);
    sendEvent('get_friends', {}, 'r_add_member_' + Date.now());
    
    // Close handlers
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const closeModal = () => {
        document.removeEventListener('friendsList', handleFriendsList);
        modal.remove();
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

// Modal for editing group name
function showEditGroupNameModal(conversationId, currentName) {
    const existingModal = document.getElementById('edit-name-modal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'edit-name-modal';
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in';
    
    modal.innerHTML = `
        <div class="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md mx-4">
            <div class="flex items-center justify-between p-6 border-b border-slate-700">
                <h2 class="text-xl font-bold text-white">Đổi tên nhóm</h2>
                <button class="close-btn text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>
            <div class="p-6">
                <label class="block text-sm font-medium text-slate-300 mb-2">Tên nhóm mới</label>
                <input 
                    type="text" 
                    id="new-group-name" 
                    value="${currentName}" 
                    class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    autofocus
                />
            </div>
            <div class="flex justify-end gap-3 p-6 border-t border-slate-700">
                <button class="cancel-btn px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">Hủy</button>
                <button class="save-btn px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all">
                    Lưu
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const input = modal.querySelector('#new-group-name');
    const saveBtn = modal.querySelector('.save-btn');
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    
    const closeModal = () => modal.remove();
    
    saveBtn.addEventListener('click', () => {
        const newName = input.value.trim();
        if (newName && newName !== currentName) {
            sendEvent('update_group_info', {
                conversation_id: conversationId,
                name: newName
            });
            closeModal();
        }
    });
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveBtn.click();
    });
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    setTimeout(() => input.select(), 100);
}
