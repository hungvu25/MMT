import { createMessage } from './Message.js';

export function createChatPanel() {
    const panel = document.createElement('main');
    panel.className = 'flex-1 flex flex-col min-w-0 bg-white relative';

    panel.innerHTML = `
    <!-- Chat Header -->
    <header class="h-16 flex items-center px-6 border-b border-gray-100 shrink-0 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div class="mr-4 md:hidden">
        <button id="menu-btn" class="p-2 -ml-2 rounded-md hover:bg-gray-100 text-gray-600">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
      
      <div class="flex items-center min-w-0 flex-1">
        <div class="mr-3 relative">
           <div class="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">#</div>
        </div>
        <div>
          <h2 class="font-bold text-slate-800 text-lg leading-tight truncate flex items-center gap-2">
            Design Team
            <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-normal border border-slate-200">Group</span>
          </h2>
          <p class="text-xs text-slate-500 truncate">Discussing the new design system and UI components • 24 members</p>
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

    <!-- Pinned Message Strip (Conditional) -->
    <div class="bg-indigo-50 px-6 py-2 flex items-center text-sm border-b border-indigo-100 text-indigo-900">
      <svg class="w-4 h-4 mr-2 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
      <span class="font-medium mr-2">Pinned:</span>
      <span class="truncate flex-1">Welcome to the new Design Team channel! Please read the guidelines.</span>
      <button class="text-indigo-400 hover:text-indigo-700 ml-2"><svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>

    <!-- Messages Area -->
    <div id="messages-container" class="flex-1 overflow-y-auto px-6 py-6 scroll-smooth space-y-6">
       <!-- Dynamic Content -->
    </div>

    <!-- Input Area -->
    <div class="px-6 pb-6 pt-2 bg-white shrink-0">
      <div class="bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
        <!-- Input Toolbar -->
        <div class="flex items-center px-4 py-2 border-b border-gray-100 gap-2 overflow-x-auto no-scrollbar">
           <button class="p-1.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-200 transition"><svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg></button>
           <button class="p-1.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-200 transition"><svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></button>
           <div class="h-4 w-px bg-gray-300 mx-1"></div>
           <button class="p-1.5 text-gray-400 hover:text-gray-700 rounded hover:bg-gray-200 transition"><svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg></button>
        </div>
        
        <div class="p-3">
          <textarea 
            placeholder="Message #Design Team..." 
            class="w-full bg-transparent border-0 focus:ring-0 p-0 text-slate-800 placeholder-slate-400 resize-none h-[48px] max-h-[200px]"
          ></textarea>
        </div>

        <div class="px-3 pb-3 flex justify-between items-center">
           <div class="text-[10px] text-gray-400 font-medium">
             Enter to send, Shift + Enter for new line
           </div>
           <button class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-1.5 text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
             <span>Send</span>
             <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
           </button>
        </div>
      </div>
    </div>
  `;

    // Inject messages
    const container = panel.querySelector('#messages-container');

    // Date divider
    const dateDiv = document.createElement('div');
    dateDiv.className = 'flex items-center justify-center my-6';
    dateDiv.innerHTML = `<span class="bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full border border-gray-200">Today, January 21</span>`;
    container.appendChild(dateDiv);

    // Sample Messages
    const messages = [
        { type: 'text', user: 'Sarah Wilson', text: 'Hey everyone! Just uploaded the new design system assets.', time: '09:30 AM', avatar: 'S', isMe: false, status: 'seen' },
        { type: 'text', user: 'Sarah Wilson', text: 'Let me know what you think about the new color palette.', time: '09:31 AM', avatar: 'S', isMe: false, status: 'seen' },
        { type: 'me', user: 'Me', text: 'Looks great Sarah! I love the new indigo shades.', time: '09:35 AM', isMe: true, status: 'seen' },
        { type: 'file', user: 'James Rodriquez', text: 'Here are the updated icons to match.', time: '09:40 AM', fileName: 'icons-set-v2.zip', fileSize: '2.5 MB', avatar: 'J', isMe: false, status: 'seen' },
        { type: 'text', user: 'Alex Chen', text: 'I will start integrating these into the dashboard today.', time: '10:05 AM', avatar: 'A', isMe: false, status: 'delivered' },
    ];

    messages.forEach(msg => {
        container.appendChild(createMessage(msg));
    });

    return panel;
}
