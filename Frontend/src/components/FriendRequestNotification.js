import { sendEvent } from '../ws.js';

/**
 * Tạo thông báo yêu cầu kết bạn (giống Zalo)
 * Hiển thị dưới profile người gửi với 2 nút: Đồng ý / Từ chối
 */
export function createFriendRequestNotification(fromUserId) {
    const notification = document.createElement('div');
    notification.id = `friend-request-${fromUserId}`;
    notification.className = 'fixed bottom-4 right-4 bg-gradient-to-br from-slate-800 to-slate-900 border border-indigo-500/50 rounded-xl shadow-2xl shadow-indigo-500/20 p-4 max-w-sm z-50 animate-slide-up backdrop-blur-sm';
    
    notification.innerHTML = `
        <div class="flex items-start space-x-3">
            <!-- Avatar -->
            <div class="relative shrink-0">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    ${fromUserId[0].toUpperCase()}
                </div>
                <div class="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                </div>
            </div>
            
            <!-- Content -->
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                    <h3 class="text-sm font-semibold text-white">${fromUserId}</h3>
                    <button class="close-btn text-slate-500 hover:text-white transition-colors p-1 hover:bg-slate-700 rounded">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <p class="text-xs text-indigo-300 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                    đã gửi lời mời kết bạn
                </p>
                
                <!-- Action Buttons -->
                <div class="flex space-x-2">
                    <button class="accept-btn flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline mr-1"><polyline points="20 6 9 17 4 12"/></svg>
                        Đồng ý
                    </button>
                    <button class="reject-btn flex-1 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium py-2 px-3 rounded-lg transition-all">
                        Từ chối
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Event handlers
    const acceptBtn = notification.querySelector('.accept-btn');
    const rejectBtn = notification.querySelector('.reject-btn');
    const closeBtn = notification.querySelector('.close-btn');
    
    acceptBtn.addEventListener('click', () => {
        console.log("[FriendRequest] Accepting from:", fromUserId);
        sendEvent('accept_friend_request', { from_user_id: fromUserId });
        
        // Show success message
        notification.innerHTML = `
            <div class="flex items-center space-x-2 text-green-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span class="text-sm font-medium">Đã chấp nhận lời mời kết bạn</span>
            </div>
        `;
        
        setTimeout(() => {
            removeNotification(notification);
        }, 2000);
    });
    
    rejectBtn.addEventListener('click', () => {
        console.log("[FriendRequest] Rejecting from:", fromUserId);
        // TODO: Implement reject friend request
        removeNotification(notification);
    });
    
    closeBtn.addEventListener('click', () => {
        removeNotification(notification);
    });
    
    // Auto close after 30 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            removeNotification(notification);
        }
    }, 30000);
    
    return notification;
}

function removeNotification(notification) {
    notification.classList.add('animate-slide-down');
    setTimeout(() => {
        notification.remove();
    }, 300);
}

/**
 * Hiển thị thông báo kết bạn
 */
export function showFriendRequestNotification(fromUserId) {
    // Kiểm tra xem đã có thông báo này chưa
    const existing = document.getElementById(`friend-request-${fromUserId}`);
    if (existing) {
        return; // Đã có rồi, không tạo mới
    }
    
    const notification = createFriendRequestNotification(fromUserId);
    document.body.appendChild(notification);
}

/**
 * Tạo thông báo tin nhắn lạ (người lạ nhắn tin)
 */
export function createStrangerMessageNotification(fromUserId) {
    const notification = document.createElement('div');
    notification.id = `stranger-msg-${fromUserId}`;
    notification.className = 'fixed bottom-4 right-4 bg-gradient-to-br from-amber-600 to-orange-700 border border-amber-400/50 rounded-xl shadow-2xl shadow-amber-500/30 p-4 max-w-sm z-50 animate-slide-up backdrop-blur-sm';
    
    notification.innerHTML = `
        <div class="flex items-start space-x-3">
            <!-- Avatar -->
            <div class="relative shrink-0">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    ${fromUserId[0].toUpperCase()}
                </div>
                <div class="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
            </div>
            
            <!-- Content -->
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                    <h3 class="text-sm font-semibold text-white">${fromUserId}</h3>
                    <button class="close-btn text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <p class="text-xs text-white/90 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12.01" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/></svg>
                    Tin nhắn từ người lạ
                </p>
                
                <!-- Action Button -->
                <button class="view-btn w-full bg-white/20 hover:bg-white/30 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-all backdrop-blur-sm shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline mr-1"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    Xem tin nhắn
                </button>
            </div>
        </div>
    `;
    
    const closeBtn = notification.querySelector('.close-btn');
    const viewBtn = notification.querySelector('.view-btn');
    
    viewBtn.addEventListener('click', () => {
        // Switch to Chats tab and show conversation
        const chatsTab = document.querySelector('[data-tab="chats"]');
        if (chatsTab) chatsTab.click();
        
        // Trigger conversation selection
        document.dispatchEvent(new CustomEvent('viewStrangerMessage', {
            detail: { userId: fromUserId }
        }));
        
        removeNotification(notification);
    });
    
    closeBtn.addEventListener('click', () => {
        removeNotification(notification);
    });
    
    // Auto close after 30 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            removeNotification(notification);
        }
    }, 30000);
    
    return notification;
}

/**
 * Hiển thị thông báo tin nhắn lạ
 */
export function showStrangerMessageNotification(fromUserId) {
    const existing = document.getElementById(`stranger-msg-${fromUserId}`);
    if (existing) {
        return;
    }
    
    const notification = createStrangerMessageNotification(fromUserId);
    document.body.appendChild(notification);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slide-up {
        from {
            transform: translateY(100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slide-down {
        from {
            transform: translateY(0);
            opacity: 1;
        }
        to {
            transform: translateY(100%);
            opacity: 0;
        }
    }
    
    .animate-slide-up {
        animation: slide-up 0.3s ease-out;
    }
    
    .animate-slide-down {
        animation: slide-down 0.3s ease-out;
    }
`;
document.head.appendChild(style);
