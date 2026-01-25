let ws = null;
let eventHandlers = {}; // Lưu nhiều handlers theo type

export function onWSEvent(type, callback) {
  if (!eventHandlers[type]) {
    eventHandlers[type] = [];
  }
  eventHandlers[type].push(callback);
}

export function clearWSEventHandlers() {
  console.log("[WS] Clearing all event handlers");
  eventHandlers = {};
}

export function disconnectWS() {
  console.log("[WS] Disconnecting...");
  if (ws) {
    ws.onclose = null; // Prevent auto-reconnect
    ws.close();
    ws = null;
  }
}

export function connectWS() {
  if (
    ws &&
    (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
  ) {
    return ws;
  }

  ws = new WebSocket("ws://127.0.0.1:8000/ws");

  ws.onopen = () => {
    console.log("[WS]  Connected");
  };

  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      console.log("[WS]  Received:", msg);

      // Gọi handlers theo type
      const type = msg.type;
      if (eventHandlers[type]) {
        eventHandlers[type].forEach((cb) => cb(msg.data, msg));
      }

      // Gọi handler chung nếu có
      if (eventHandlers["*"]) {
        eventHandlers["*"].forEach((cb) => cb(msg.data, msg));
      }
    } catch (err) {
      console.log("[WS]  Parse error:", err);
    }
  };

  ws.onclose = (e) => {
    console.log("[WS]  Connection closed", e.code);
    // Auto reconnect sau 3s (chỉ khi không phải close thủ công)
    if (e.code !== 1000) {
      setTimeout(() => {
        console.log("[WS] 🔄 Reconnecting...");
        connectWS();
      }, 3000);
    }
  };

  ws.onerror = (e) => {
    console.log("[WS]  Error:", e);
  };

  return ws;
}

export function sendEvent(type, data, request_id = null) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn("[WS] Not connected, cannot send:", type);
    return;
  }

  const payload = {
    type,
    data,
    request_id,
    ts: Date.now(),
  };

  console.log("[WS] 📤 Sending:", type, data);
  ws.send(JSON.stringify(payload));
}

// Helper: Gửi và đợi response
export function sendEventWithResponse(type, data, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const requestId = `req_${Date.now()}_${Math.random()}`;

    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for ${type}`));
    }, timeout);

    // Lắng nghe response 1 lần
    const handler = (responseData, fullMsg) => {
      if (fullMsg.request_id === requestId) {
        clearTimeout(timer);
        // Remove handler sau khi nhận
        const index = eventHandlers[type]?.indexOf(handler);
        if (index > -1) eventHandlers[type].splice(index, 1);
        resolve(responseData);
      }
    };

    onWSEvent(type, handler);
    sendEvent(type, data, requestId);
  });
}

// Get current WebSocket state
export function getWSState() {
  if (!ws) return "NOT_CREATED";
  switch (ws.readyState) {
    case WebSocket.CONNECTING:
      return "CONNECTING";
    case WebSocket.OPEN:
      return "OPEN";
    case WebSocket.CLOSING:
      return "CLOSING";
    case WebSocket.CLOSED:
      return "CLOSED";
    default:
      return "UNKNOWN";
  }
}
