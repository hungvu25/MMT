export function createSidebar() {
    const sidebar = document.createElement('aside');
    sidebar.className = 'w-80 flex-shrink-0 bg-slate-900 flex flex-col border-r border-slate-800 text-slate-300 hidden md:flex h-full';

    sidebar.innerHTML = `
    <!-- Header -->
    <div class="h-16 flex items-center px-4 border-b border-slate-800 shrink-0">
      <h1 class="font-bold text-white text-lg tracking-tight">ViteChat</h1>
      <div class="ml-auto w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-600 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </div>
    </div>

    <!-- Search -->
    <div class="p-3 shrink-0">
      <div class="relative">
        <input type="text" placeholder="Jump to..." class="w-full bg-slate-950 text-sm text-slate-200 placeholder-slate-500 rounded px-3 py-1.5 border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
        <span class="absolute right-2 top-1.5 text-xs text-slate-600 border border-slate-800 rounded px-1 hidden lg:block">Ctrl K</span>
      </div>
    </div>

    <!-- Navigation / Channels -->
    <div class="flex-1 overflow-y-auto px-2 space-y-6 py-2">
      <!-- Unread Section -->
      <div>
        <h2 class="px-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Unread</h2>
        <div class="space-y-0.5">
          ${createChannelItem('Design Team', true, 3, true)}
          ${createChannelItem('Project Alpha', false, 0, true)}
        </div>
      </div>

      <!-- Channels Section -->
      <div>
        <h2 class="px-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Channels</h2>
        <div class="space-y-0.5">
          ${createChannelItem('general', false)}
          ${createChannelItem('random', false)}
          ${createChannelItem('announcements', false)}
        </div>
      </div>

      <!-- Direct Messages -->
      <div>
        <h2 class="px-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Direct Messages</h2>
        <div class="space-y-0.5">
          ${createDMItem('Sarah Wilson', 'online')}
          ${createDMItem('James Rodriquez', 'offline')}
          ${createDMItem('Alex Chen', 'idle')}
        </div>
      </div>
    </div>

    <!-- User Profile Footer -->
    <div class="h-14 bg-slate-950/50 flex items-center px-3 border-t border-slate-800 shrink-0">
      <div class="w-8 h-8 rounded bg-indigo-500 flex items-center justify-center text-white font-medium mr-3">
        ME
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-white truncate">My Account</div>
        <div class="text-xs text-slate-500 truncate">Online</div>
      </div>
      <div class="flex space-x-1">
        <button class="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 11a7 7 0 0 1-7 7m0 0a7 7 0 0 1-7-7m7 7v4m0 0H8m4 0h4"/></svg>
        </button>
        <button class="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      </div>
    </div>
  `;

    return sidebar;
}

function createChannelItem(name, active, unread = 0, bold = false) {
    const bgClass = active ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100';
    const textClass = bold || unread > 0 ? 'font-medium text-slate-200' : '';
    const icon = `<svg class="w-4 h-4 mr-2 opacity-70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>`;

    return `
    <button class="w-full flex items-center px-2 py-1.5 rounded-md ${bgClass} transition-colors group">
      ${icon}
      <span class="truncate text-sm ${textClass}">${name}</span>
      ${unread > 0 ? `<span class="ml-auto bg-indigo-500 text-white text-[10px] font-bold px-1.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">${unread}</span>` : ''}
    </button>
  `;
}

function createDMItem(name, status) {
    const statusColor = status === 'online' ? 'bg-green-500' : status === 'idle' ? 'bg-yellow-500' : 'bg-slate-500 border-2 border-slate-900';

    return `
    <button class="w-full flex items-center px-2 py-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors group">
      <div class="relative w-4 h-4 mr-2">
         <div class="w-full h-full rounded bg-slate-600 flex items-center justify-center text-[8px] text-white font-bold">${name[0]}</div>
         <div class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${statusColor} rounded-full border-2 border-slate-900"></div>
      </div>
      <span class="truncate text-sm opacity-90">${name}</span>
    </button>
  `;
}
