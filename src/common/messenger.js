const routes = new Map();

export function on(route, callback) {
  routes.set(route, callback);
}

export function send(route = "", data = {}) {
  chrome.runtime.sendMessage({ route, data });
}

export function sendLocal(route = "", data = {}) {
  handleMessage(route, data);
}

export function listen() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message.route, message.data);
  });
}

function handleMessage(route, data) {
  const callback = routes.get(route);
  if (callback) {
    callback(data);
  }
}
