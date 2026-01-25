export function createMessage(data, options = {}) {
    const onPin = options.onPin;
    const isMe = data.isMe;
    const msgDiv = document.createElement('div');
    msgDiv.className = `group flex gap-3 ${isMe ? 'flex-row-reverse' : ''} hover:bg-gray-50/50 p-2 -mx-2 rounded-lg transition-colors`;

    const avatar = `
    <div class="w-9 h-9 rounded bg-indigo-100 flex-shrink-0 flex items-center justify-center text-sm font-bold text-indigo-700 select-none">
      ${data.avatar || 'M'}
    </div>
  `;

    // Status UI removed (only sender names/time kept)
    const statusText = '';
    const statusIcon = '';

    let contentHtml = '';
    const isTextMessage = !data.type || data.type === 'text';
    if (data.type === 'image' && data.fileUrl) {
        // Image message
        contentHtml = `
      <div class="rounded-lg overflow-hidden max-w-sm">
        <img src="${data.fileUrl}" alt="${data.fileName || 'Image'}" class="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity" onclick="window.openImageModal('${data.fileUrl}')" />
      </div>
      ${data.text ? `<div class="mt-2 ${isMe ? 'text-white' : 'text-slate-800'} leading-relaxed">${data.text}</div>` : ''}
    `;
    } else if (data.type === 'file' || (data.type === 'image' && !data.fileUrl)) {
        // File message
        contentHtml = `
      <div class="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg group-hover:border-indigo-200 transition-colors w-fit">
        <div class="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
           <svg class="w-5 h-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div class="text-sm">
          <div class="font-medium text-slate-700">${data.fileName || 'Unknown file'}</div>
          <div class="text-xs text-slate-500">${data.fileSize || ''}</div>
        </div>
        ${data.fileUrl ? `
        <a href="${data.fileUrl}" download="${data.fileName}" class="p-2 text-slate-400 hover:text-indigo-600">
           <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </a>` : ''}
      </div>
      ${data.text ? `<div class="mt-2 text-slate-800 leading-relaxed">${data.text}</div>` : ''}
    `;
    } else if (isTextMessage) {
        contentHtml = `<p class="leading-relaxed whitespace-pre-wrap ${isMe ? 'text-white' : 'text-slate-800'}">${data.text}</p>`;
    } else {
        contentHtml = `<p class="text-slate-800 leading-relaxed whitespace-pre-wrap">${data.text || ''}</p>`;
    }

    const pinButton = onPin
        ? `<button class="pin-btn opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-indigo-600 p-1" title="Pin message">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>
           </button>`
        : '';

    msgDiv.innerHTML = `
    ${!isMe ? avatar : ''}
    
    <div class="flex flex-col max-w-[70%] min-w-0 ${isMe ? 'items-end' : 'items-start'}">
      <div class="flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}">
        ${!isMe ? `<span class="text-sm font-bold text-slate-900">${data.user}</span>` : ''}
        <span class="text-[11px] text-gray-400">${data.time}</span>
        ${pinButton}
      </div>
      
      <div class="${isMe ? 'bg-indigo-600 text-white rounded-l-2xl rounded-tr-2xl rounded-br-sm' : 'bg-white border border-gray-100 shadow-sm rounded-r-2xl rounded-tl-2xl rounded-bl-sm'} px-4 py-2.5 w-fit">
         ${contentHtml}
      </div>

      ${isMe ? '' : ''}
    </div>
  `;

    if (onPin && (data.id || data._id)) {
        const btn = msgDiv.querySelector('.pin-btn');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mid = data.id || data._id;
                // Only allow pin when we have a real server id (24 hex)
                if (!mid || mid.length !== 24) {
                    console.warn("[Message] Cannot pin pending message without server id");
                    return;
                }
                onPin(mid);
            });
        }
    }

    return msgDiv;
}

// Image modal viewer
window.openImageModal = (imageUrl) => {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4';
  modal.innerHTML = `
    <button class="absolute top-4 right-4 text-white hover:text-gray-300 p-2" onclick="this.parentElement.remove()">
      <svg class="w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <img src="${imageUrl}" class="max-w-full max-h-full object-contain" />
  `;
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  document.body.appendChild(modal);
};
