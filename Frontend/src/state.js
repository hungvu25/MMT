// Simple state management
const state = {
  currentUser: null, // {user_id, username}
  conversations: [], // Danh sách conversations
  currentConversation: null, // Conversation đang mở
  activeConversationId: null, // ID of active conversation
  messages: {}, // {conversation_id: [messages]}
};

const listeners = [];

export function getState() {
  return state;
}

export function setState(updates) {
  Object.assign(state, updates);
  notifyListeners();
}

export function updateState(path, value) {
  const keys = path.split('.');
  let obj = state;
  for (let i = 0; i < keys.length - 1; i++) {
    obj = obj[keys[i]];
  }
  obj[keys[keys.length - 1]] = value;
  notifyListeners();
}

export function subscribe(listener) {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) listeners.splice(index, 1);
  };
}

function notifyListeners() {
  listeners.forEach(fn => fn(state));
}

// Helpers
export function setCurrentUser(user) {
  setState({ currentUser: user });
}

export function setConversations(conversations) {
  // Đảm bảo luôn là array
  const convArray = Array.isArray(conversations) ? conversations : [];
  setState({ conversations: convArray });
}

export function resetState() {
  state.currentUser = null;
  state.conversations = [];
  state.currentConversation = null;
  state.activeConversationId = null;
  state.messages = {};
  notifyListeners();
}

export function addConversation(conversation) {
  setState({ conversations: [...state.conversations, conversation] });
}

export function setCurrentConversation(conversation) {
  setState({ 
    currentConversation: conversation,
    activeConversationId: conversation?._id || null
  });
}

export function setMessages(conversationId, messages) {
  setState({ 
    messages: { 
      ...state.messages, 
      [conversationId]: messages 
    } 
  });
}

export function addMessage(conversationId, message) {
  const existing = state.messages[conversationId] || [];
  setState({ 
    messages: { 
      ...state.messages, 
      [conversationId]: [...existing, message] 
    } 
  });
}