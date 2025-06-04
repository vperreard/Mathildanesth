module.exports = class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 1; // OPEN
    this.onopen = null;
    this.onclose = null;
    this.onmessage = null;
    this.onerror = null;
  }

  send(data) {
    // Mock send implementation
    console.log(`Mock WebSocket send: ${data}`);
  }

  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) {
      this.onclose({ code: 1000, reason: 'Mock close' });
    }
  }

  addEventListener(type, listener) {
    this[`on${type}`] = listener;
  }

  removeEventListener(type, listener) {
    this[`on${type}`] = null;
  }
};