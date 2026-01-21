let ws = null;
let onEventCb = null;

export function onWSEvent(cb) {
  onEventCb = cb;
}

export function connectWS() {
  if (
    ws &&
    (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
  ) {
    return ws;
  }

  ws = new WebSocket("ws://127.0.0.1:8000/ws");

  ws.onopen = () => console.log("[WS] connected");
  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (onEventCb) onEventCb(msg);
    } catch {
      console.log("[WS] non-json:", e.data);
    }
  };
  ws.onclose = () => console.log("[WS] closed");
  ws.onerror = (e) => console.log("[WS] error:", e);

  return ws;
}

export function sendEvent(type, data, request_id = null) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  const payload = {
    type,
    data,
    request_id,
    ts: Date.now(),
  };

  ws.send(JSON.stringify(payload));
}
