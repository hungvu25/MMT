import { sendEvent } from '../ws.js';

/**
 * Tạo modal để tạo nhóm chat mới
 */
export function showCreateGroupModal() {
    // Remove existing modal if any
    const existing = document.getElementById('create-group-modal');
    if (existing) {
        if (typeof existing.cleanupFriendsListener === 'function') {
            existing.cleanupFriendsListener();
        }
        existing.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'create-group-modal';
    modal.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in';

    modal.innerHTML = `
        <div class="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md mx-4 animate-slide-up">
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-slate-700">
                <h2 class="text-xl font-bold text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 text-indigo-400"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    Tạo nhóm mới
                </h2>
                <button class="close-btn text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>

            <!-- Body -->
            <div class="p-6 space-y-4">
                <!-- Group Name -->
                <div>
                    <label class="block text-sm font-medium text-slate-300 mb-2">Tên nhóm</label>
                    <input 
                        type="text" 
                        id="group-name-input" 
                        placeholder="Nhập tên nhóm..." 
                        class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>

                <!-- Members Selection -->
                <div>
                    <label class="block text-sm font-medium text-slate-300 mb-2">Chọn thành viên</label>
                    <div id="friends-list-modal" class="space-y-2 max-h-64 overflow-y-auto bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                        <div class="text-center text-slate-500 py-4">Đang tải danh sách bạn bè...</div>
                    </div>
                </div>

                <div id="selected-members" class="hidden">
                    <div class="text-xs text-slate-400 mb-2">Đã chọn: <span id="selected-count">0</span> người</div>
                    <div id="selected-members-list" class="flex flex-wrap gap-2"></div>
                </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
                <button class="cancel-btn px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                    Hủy
                </button>
                <button id="create-group-btn" class="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                    Tạo nhóm
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Selected members state
    const selectedMembers = new Set();

    // Load friends list
    let cleanupFriendsListener = null;
    cleanupFriendsListener = loadFriendsList(modal, selectedMembers);
    modal.cleanupFriendsListener = cleanupFriendsListener;

    // Event listeners
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const createBtn = modal.querySelector('#create-group-btn');
    const groupNameInput = modal.querySelector('#group-name-input');

    const closeModal = () => {
        if (cleanupFriendsListener) {
            cleanupFriendsListener();
            cleanupFriendsListener = null;
        }
        modal.classList.add('animate-fade-out');
        setTimeout(() => modal.remove(), 200);
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    createBtn.addEventListener('click', () => {
        const groupName = groupNameInput.value.trim();
        const memberIds = Array.from(selectedMembers);

        if (memberIds.length < 1) {
            alert('Vui lòng chọn ít nhất 1 thành viên!');
            return;
        }

        // Send create group event
        console.log('[CreateGroup] Creating group:', groupName, memberIds);
        sendEvent('create_group', {
            name: groupName || `Nhóm ${memberIds.length + 1} người`,
            member_ids: memberIds
        });

        closeModal();
    });
}

function loadFriendsList(modal, selectedMembers) {
    const friendsListContainer = modal.querySelector('#friends-list-modal');
    const selectedCountSpan = modal.querySelector('#selected-count');
    const selectedMembersSection = modal.querySelector('#selected-members');
    const selectedMembersList = modal.querySelector('#selected-members-list');
    const friendDisplayMap = new Map();

    const updateSelectedUI = () => {
        selectedCountSpan.textContent = selectedMembers.size;
        if (selectedMembers.size > 0) {
            selectedMembersSection.classList.remove('hidden');
        } else {
            selectedMembersSection.classList.add('hidden');
        }
    };

    const updateSelectedMembersList = () => {
        selectedMembersList.innerHTML = '';
        selectedMembers.forEach(memberId => {
            const displayName = friendDisplayMap.get(memberId) || memberId;
            const tag = document.createElement('span');
            tag.className = 'inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-sm rounded-full';
            tag.innerHTML = `
                ${displayName}
                <button class="remove-member hover:bg-indigo-700 rounded-full p-0.5" data-member="${memberId}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            `;
            
            tag.querySelector('.remove-member').addEventListener('click', () => {
                selectedMembers.delete(memberId);
                const checkbox = friendsListContainer.querySelector(`[data-friend-id="${memberId}"] .friend-checkbox`);
                if (checkbox) checkbox.checked = false;
                updateSelectedUI();
                updateSelectedMembersList();
            });
            
            selectedMembersList.appendChild(tag);
        });
    };

    const renderFriendsList = (friends) => {
        const list = Array.isArray(friends) ? friends : [];
        friendDisplayMap.clear();

        if (list.length === 0) {
            friendsListContainer.innerHTML = `
                <div class="text-center text-slate-500 py-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                    Chưa có bạn bè
                </div>
            `;
            return;
        }

        friendsListContainer.innerHTML = '';
        const friendIds = new Set();
        list.forEach((friend) => {
            const friendId = friend?.user_id || friend;
            if (!friendId) return;
            const friendName = friend?.username || friendId;
            const avatar = friend?.avatar;

            friendIds.add(friendId);
            friendDisplayMap.set(friendId, friendName);

            const item = document.createElement('div');
            item.className = 'flex items-center justify-between p-2 hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer';
            item.dataset.friendId = friendId;

            item.innerHTML = `
                <div class="flex items-center flex-1">
                    ${avatar 
                        ? `<img src="${avatar}" alt="${friendName}" class="w-10 h-10 rounded-full mr-3 object-cover" />`
                        : `<div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold mr-3">
                            ${friendName[0].toUpperCase()}
                        </div>`
                    }
                    <span class="text-slate-200">${friendName}</span>
                </div>
                <input type="checkbox" class="friend-checkbox w-5 h-5 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-800" />
            `;

            const checkbox = item.querySelector('.friend-checkbox');
            checkbox.checked = selectedMembers.has(friendId);
            
            const updateSelection = () => {
                if (checkbox.checked) {
                    selectedMembers.add(friendId);
                } else {
                    selectedMembers.delete(friendId);
                }
                
                updateSelectedUI();
                updateSelectedMembersList();
            };

            checkbox.addEventListener('change', updateSelection);
            item.addEventListener('click', (e) => {
                if (e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                    updateSelection();
                }
            });

            friendsListContainer.appendChild(item);
        });

        // Remove any selections that are no longer in the list
        selectedMembers.forEach((memberId) => {
            if (!friendIds.has(memberId)) {
                selectedMembers.delete(memberId);
            }
        });

        updateSelectedUI();
        updateSelectedMembersList();
    };

    // Listen for friends response from main.js
    const handleFriendsList = (e) => {
        renderFriendsList(e.detail?.friends || []);
    };

    document.addEventListener('friendsList', handleFriendsList);

    // Request friends list
    sendEvent('get_friends', {}, 'r_modal_friends_' + Date.now());

    return () => {
        document.removeEventListener('friendsList', handleFriendsList);
    };
}
