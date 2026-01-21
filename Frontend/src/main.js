// import './style.css'; // Commented out for CDN preview
import { createSidebar } from './components/Sidebar.js';
import { createChatPanel } from './components/ChatPanel.js';
import { createRightPanel } from './components/RightPanel.js';
import { createLoginPage } from './components/pages/Login.js';
import { createRegisterPage } from './components/pages/Register.js';
import { connectWS, sendEvent, onWSEvent } from "./ws";
import { appendMessageToUI } from './components/ChatPanel.js'; 


const app = document.querySelector('#app');

// State
let currentState = 'login'; // login, register, chat

// Router
function render() {
    app.innerHTML = '';

    if (currentState === 'login') {
        app.className = 'w-full h-full bg-gray-50'; // Reset layout for auth
        app.appendChild(createLoginPage(navigateTo));
    }
    else if (currentState === 'register') {
        app.className = 'w-full h-full bg-gray-50';
        app.appendChild(createRegisterPage(navigateTo));
    }
    else if (currentState === 'chat') {
        app.className = 'w-full h-full flex overflow-hidden'; // Restore chat layout

        // Components
        const sidebar = createSidebar();
        const chatPanel = createChatPanel();
        const rightPanel = createRightPanel();

        app.appendChild(sidebar);
        app.appendChild(chatPanel);
        app.appendChild(rightPanel);

        //Connect WebSocket
        connectWS();

        onWSEvent((data) => {
          // server đang echo: "echo: ..."
          appendMessageToUI({
            type: "text",
            user: "Server",
            text: data,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isMe: false,
            status: "delivered",
          });
        });


        // Setup Chat Logic
        setupChatLogic(sidebar, rightPanel);
        
    }
}

function navigateTo(state) {
    // Simple transition effect
    app.classList.add('opacity-50');
    setTimeout(() => {
        currentState = state;
        render();
        app.classList.remove('opacity-50');
    }, 150);
}

function setupChatLogic(sidebar, rightPanel) {
    // Logic
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

    // Right Panel Toggle (Info button)
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

    const sendBtn = document.getElementById('send-btn');
        const msgInput = document.getElementById('message-input');
        if (sendBtn && msgInput) {
            sendBtn.addEventListener('click', () => {
              const text = msgInput.value.trim();
              if (!text) return;

              // 1) hiện lên UI trước
              appendMessageToUI({
                type: "text",
                user: "Me",
                text,
                time: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                isMe: true,
                status: "sent",
              });

              const clientMsgId = "c_" + Date.now();

              sendEvent(
                "send_message",
                {
                  conversation_id: "group:design-team", // tạm hardcode
                  client_msg_id: clientMsgId,
                  msg_type: "text",
                  text,
                },
                "r_" + clientMsgId,
                );
                
                // 2) gửi lên server

              msgInput.value = "";
            });

        // Enter to send, Shift+Enter for newline
            msgInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) { 
                e.preventDefault(); 
                sendBtn.click();}
            });
        }
}
let myUserId = "U1"; // tạm hardcode, sau này lấy từ login
let currentConversationId = "group:design-team"; // mặc định vào group
function dmId(a, b) {
  const [x, y] = [a, b].sort();
  return `dm:${x}:${y}`;
}

document.addEventListener("selectConversation", (e) => {
  currentConversationId = e.detail.conversation_id;
  sendEvent(
    "join",
    { conversation_id: currentConversationId },
    "r_join_" + Date.now(),
  );
});

// Initial Render
render();
