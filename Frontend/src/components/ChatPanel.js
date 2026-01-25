import { createMessage } from './Message.js';
import { getState } from '../state.js';
import { sendEvent } from '../ws.js';

export function createChatPanel() {
    const panel = document.createElement('main');
    panel.className = 'flex-1 flex flex-col min-w-0 bg-white relative';

    panel.innerHTML = `
    <!-- Chat Header -->
    <header id="chat-header" class="h-16 flex items-center px-6 border-b border-gray-100 shrink-0 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div class="mr-4 md:hidden">
        <button id="menu-btn" class="p-2 -ml-2 rounded-md hover:bg-gray-100 text-gray-600">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
      
      <div class="flex items-center min-w-0 flex-1">
        <div class="mr-3 relative">
           <div class="w-10 h-10 rounded-lg bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-lg">?</div>
        </div>
        <div>
          <h2 class="font-bold text-slate-800 text-lg leading-tight truncate flex items-center gap-2">
            Select a conversation
          </h2>
          <p class="text-xs text-slate-500 truncate">Choose a chat from the sidebar to start messaging</p>
        </div>
      </div>

      <div class="flex items-center space-x-1 ml-4 border-l pl-4 border-gray-200 h-8">
        <button class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors relative" title="Pinned Messages">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>
        </button>
        <button id="info-btn" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors hidden xl:block" title="Details">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        </button>
      </div>
    </header>

    <!-- Messages Area -->
    <div id="messages-container" class="flex-1 overflow-y-auto px-6 py-6 scroll-smooth space-y-6">
       <div class="flex items-center justify-center h-full text-gray-400">
         <div class="text-center">
           <svg class="w-16 h-16 mx-auto mb-4 opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
           </svg>
           <p class="text-sm">Select a conversation to start chatting</p>
         </div>
       </div>
    </div>

    <!-- Input Area -->
    <div class="px-6 pb-6 pt-2 bg-white shrink-0">
      <div class="bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
        <!-- Hidden File Input -->
        <input type="file" id="file-input" class="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.txt" multiple />
        
        <div class="flex items-center px-4 py-2 border-b border-gray-100 gap-2 overflow-x-auto no-scrollbar">
           <button id="file-upload-btn" class="p-1.5 text-gray-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition" title="Upload file"><svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg></button>
           <button id="image-upload-btn" class="p-1.5 text-gray-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition" title="Upload image"><svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></button>
           <div class="h-4 w-px bg-gray-300 mx-1"></div>
           <button class="p-1.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-200 transition"><svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg></button>
        </div>
        
        <!-- File Preview Area -->
        <div id="file-preview-container" class="hidden px-4 py-2 border-b border-gray-100">
          <div id="file-previews" class="flex gap-2 overflow-x-auto"></div>
        </div>
        
        <div class="p-3">
          <textarea 
            id="message-input"
            placeholder="Type a message..." 
            class="w-full bg-transparent border-0 focus:ring-0 p-0 text-slate-800 placeholder-slate-400 resize-none h-[48px] max-h-[200px]"
          ></textarea>
        </div>

        <div class="px-3 pb-3 flex justify-between items-center">
           <div class="text-[10px] text-gray-400 font-medium">
             Enter to send, Shift + Enter for new line
           </div>
           <button id="send-btn"
            class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-1.5 text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
             <span>Send</span>
             <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
           </button>
        </div>
      </div>
    </div>
  `;

    return panel;
}

export function appendMessageToUI(msg) {
  const container = document.getElementById('messages-container');
  if (!container) return;

  const state = getState();
  const conversationId = state.activeConversationId;

  const onPin = msg.id || msg._id ? (mid) => {
    if (!conversationId) return;
    sendEvent('pin_message', {
      conversation_id: conversationId,
      message_id: mid
    });
  } : null;

  const el = createMessage(msg, { onPin });
  if (msg.id) el.dataset.messageId = msg.id;
  else if (msg._id) el.dataset.messageId = msg._id;

  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}

export function clearMessages() {
  const container = document.getElementById('messages-container');
  if (!container) return;
  container.innerHTML = '';
}

// File upload state
let selectedFiles = [];

export function initFileUpload() {
  const fileInput = document.getElementById('file-input');
  const fileUploadBtn = document.getElementById('file-upload-btn');
  const imageUploadBtn = document.getElementById('image-upload-btn');
  const previewContainer = document.getElementById('file-preview-container');
  const previewsDiv = document.getElementById('file-previews');

  // Handle file button click
  fileUploadBtn?.addEventListener('click', () => {
    fileInput.accept = '*/*';
    fileInput.click();
  });

  // Handle image button click
  imageUploadBtn?.addEventListener('click', () => {
    fileInput.accept = 'image/*';
    fileInput.click();
  });

  // Handle file selection
  fileInput?.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    selectedFiles = files;
    displayFilePreviews(files, previewContainer, previewsDiv);
  });
}

function displayFilePreviews(files, container, previewsDiv) {
  if (!files || files.length === 0) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  previewsDiv.innerHTML = '';

  files.forEach((file, index) => {
    const preview = document.createElement('div');
    preview.className = 'relative group flex-shrink-0';
    
    const isImage = file.type.startsWith('image/');
    
    if (isImage) {
      // Image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.innerHTML = `
          <div class="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-indigo-200">
            <img src="${e.target.result}" class="w-full h-full object-cover" />
            <button class="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onclick="window.removeFilePreview(${index})">
              <svg class="w-3 h-3 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="text-xs text-center mt-1 text-gray-600 truncate w-20">${file.name}</div>
        `;
      };
      reader.readAsDataURL(file);
    } else {
      // File preview
      const fileSize = (file.size / 1024).toFixed(1) + ' KB';
      preview.innerHTML = `
        <div class="relative w-20 h-20 rounded-lg border-2 border-gray-200 bg-gray-50 flex flex-col items-center justify-center p-2">
          <svg class="w-8 h-8 text-gray-400 mb-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span class="text-[10px] text-gray-500">${fileSize}</span>
          <button class="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onclick="window.removeFilePreview(${index})">
            <svg class="w-3 h-3 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="text-xs text-center mt-1 text-gray-600 truncate w-20" title="${file.name}">${file.name}</div>
      `;
    }
    
    previewsDiv.appendChild(preview);
  });
}

// Global function to remove file preview
window.removeFilePreview = (index) => {
  selectedFiles.splice(index, 1);
  const previewContainer = document.getElementById('file-preview-container');
  const previewsDiv = document.getElementById('file-previews');
  const fileInput = document.getElementById('file-input');
  
  if (selectedFiles.length === 0) {
    previewContainer.classList.add('hidden');
    previewsDiv.innerHTML = '';
    fileInput.value = '';
  } else {
    displayFilePreviews(selectedFiles, previewContainer, previewsDiv);
  }
};

export function getSelectedFiles() {
  return selectedFiles;
}

export function clearSelectedFiles() {
  selectedFiles = [];
  const fileInput = document.getElementById('file-input');
  const previewContainer = document.getElementById('file-preview-container');
  const previewsDiv = document.getElementById('file-previews');
  
  if (fileInput) fileInput.value = '';
  if (previewContainer) previewContainer.classList.add('hidden');
  if (previewsDiv) previewsDiv.innerHTML = '';
}

export function updateChatHeader(conversation) {
  const header = document.getElementById('chat-header');
  if (!header) return;

  const state = getState();
  const currentUserId = state.currentUser?.user_id;
  
  // Lấy tên người chat (với direct chat)
  let chatName = 'Unknown';
  let chatType = conversation.type || 'direct';
  
  if (chatType === 'direct') {
    const otherUserId = conversation.participants.find(p => p !== currentUserId);
    chatName = otherUserId || 'Unknown User';
  } else {
    chatName = conversation.name || 'Group Chat';
  }

  const pinned = conversation.pinned_message;
  const pinnedText = pinned
    ? (pinned.text || pinned.file_name || (pinned.msg_type === 'image' ? '[Image]' : 'Pinned message'))
    : '';
  const pinnedMeta = pinned ? `Pinned by ${pinned.pinned_by || ''}` : '';
  const pinnedTime = pinned?.created_at
    ? new Date(pinned.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  header.innerHTML = `
    <div class="mr-4 md:hidden">
      <button id="menu-btn" class="p-2 -ml-2 rounded-md hover:bg-gray-100 text-gray-600">
         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
    </div>
    
    <div class="flex items-center min-w-0 flex-1">
      <div class="mr-3 relative">
         <div class="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">${chatName[0].toUpperCase()}</div>
      </div>
      <div>
        <h2 class="font-bold text-slate-800 text-lg leading-tight truncate flex items-center gap-2">
          ${chatName}
          <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-normal border border-slate-200">${chatType === 'direct' ? 'Direct' : 'Group'}</span>
        </h2>
        <p class="text-xs text-slate-500 truncate">${chatType === 'direct' ? 'Direct message' : conversation.participants?.length + ' members'}</p>
      </div>
    </div>

    <div class="flex items-center space-x-1 ml-4 border-l pl-4 border-gray-200 h-8">
      <button id="info-btn" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors hidden xl:block" title="Details">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      </button>
    </div>
    ${pinned ? `<div class="mt-2 w-full bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs px-3 py-2 rounded-lg flex items-center justify-between gap-2">
        <div class="flex-1 min-w-0">
          <div class="font-semibold truncate">${pinnedText}</div>
          <div class="text-[11px] text-indigo-500 truncate">${pinnedMeta} ${pinnedTime ? '• ' + pinnedTime : ''}</div>
        </div>
        <div class="flex items-center gap-2">
          <a href="#pin-${pinned.message_id}" class="text-[11px] text-indigo-600 hover:underline">Jump</a>
          <button id="unpin-btn" class="p-2 rounded-full hover:bg-indigo-100 text-indigo-600" title="Unpin">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>` : ''}
  `;

  if (pinned) {
    const unpinBtn = document.getElementById('unpin-btn');
    if (unpinBtn) {
      unpinBtn.addEventListener('click', () => {
        sendEvent('unpin_message', { conversation_id: conversation._id });
      });
    }
  }
}

export function loadConversationMessages(conversationId) {
  const state = getState();
  const messages = state.messages[conversationId] || [];
  const currentUserId = state.currentUser?.user_id;
  
  clearMessages();
  
  // Add date divider
  const container = document.getElementById('messages-container');
  const dateDiv = document.createElement('div');
  dateDiv.className = 'flex items-center justify-center my-6';
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  dateDiv.innerHTML = `<span class="bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full border border-gray-200">Today, ${today}</span>`;
  container.appendChild(dateDiv);
  
  // Add messages
  messages.forEach(msg => {
    const messageData = {
      id: msg._id,
      type: msg.msg_type || "text",
      user: msg.sender_id === currentUserId ? "Me" : msg.sender_id,
      text: msg.text,
      time: new Date(msg.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isMe: msg.sender_id === currentUserId,
      // status kept for internal logic only; UI no longer displays
      status: msg.status || "sent",
    };
    
    // Add file metadata if present
    if (msg.file_url) {
      messageData.fileUrl = msg.file_url;
      messageData.fileName = msg.file_name;
      messageData.fileSize = msg.file_size;
    }
    
    appendMessageToUI(messageData);
  });
}

