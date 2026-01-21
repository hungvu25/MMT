export function createRightPanel() {
    const panel = document.createElement('aside');
    panel.className = 'w-72 bg-white border-l border-gray-200 flex-col hidden xl:flex overflow-y-auto shrink-0';

    panel.innerHTML = `
    <div class="p-6 text-center border-b border-gray-100">
      <div class="w-20 h-20 mx-auto bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-indigo-600 mb-3 shadow-inner">
        #
      </div>
      <h2 class="font-bold text-slate-900 text-lg">Design Team</h2>
      <p class="text-sm text-slate-500 mt-1">General discussion for design system updates and UI reviews.</p>
    </div>

    <!-- Actions -->
    <div class="flex justify-center gap-4 py-4 border-b border-gray-100">
       <button class="flex flex-col items-center gap-1 group">
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
       <button class="flex flex-col items-center gap-1 group">
         <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
            <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
         </div>
         <span class="text-xs font-medium text-slate-500 group-hover:text-indigo-600">Links</span>
       </button>
    </div>

    <!-- Members -->
    <div class="flex-1 p-4">
      <div class="flex items-center justify-between mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
         <span>Members</span>
         <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">24</span>
      </div>
      
      <div class="space-y-1">
         ${createMemberItem('Sarah Wilson', 'Admin', true)}
         ${createMemberItem('Me', '', true)}
         ${createMemberItem('James Rodriquez', '', false)}
         ${createMemberItem('Alex Chen', '', true)}
         ${createMemberItem('Martha Hall', '', false)}
         ${createMemberItem('Robert Fox', '', false)}
      </div>
    </div>
  `;

    return panel;
}

function createMemberItem(name, role, isOnline) {
    return `
    <div class="flex items-center py-2 px-2 hover:bg-slate-50 rounded-lg group cursor-pointer transition-colors">
      <div class="relative w-8 h-8 mr-3">
         <div class="w-full h-full rounded bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">${name[0]}</div>
         ${isOnline ? '<div class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>' : ''}
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-slate-700 truncate">${name}</div>
        ${role ? `<div class="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 rounded w-fit font-semibold mt-0.5">${role}</div>` : ''}
      </div>
      
      <div class="opacity-0 group-hover:opacity-100 transition-opacity">
         <button class="text-slate-400 hover:text-slate-600"><svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button>
      </div>
    </div>
  `;
}
