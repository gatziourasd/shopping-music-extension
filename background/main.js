import * as Player from "./player.js";

//__DEVELOPMENT

// chrome.storage.local.get(null, (items) => {
//   console.log(items);
// });

//___Init___

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get("playlist", (items) => {
    chrome.storage.local.set({ playlist: items.playlist });
  });

  chrome.storage.local.get("playerState", (items) => {
    Player.playerState = items.playerState;

    Player.playerState.playing = false;
    if (Player.playerState.mutedOnce) {
      Player.playerState.volume = 1;
      Player.playerState.mutedOnce = false;
    }
    Player.setVolume(Player.playerState.volume);
    Player.updatePlayerState();

    if (Player.playerState.trackId) {
      Player.setTrack(Player.playerState.trackId);
    }
  });
});

const lastWidowId = -1;

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (chrome.windows.WINDOW_ID_NONE === windowId) {
    // Player.pause();
    return;
  } else if (lastWidowId !== windowId) {
    lastWidowId === windowId;
    const tabId = await getActiveTab();
    const url = await getUrl(tabId);
    const isSaved = await checkIsUrlSaved(url);
    isSaved && Player.play();
    chrome.tabs.sendMessage(tabId, { isShop: { isShop: isSaved } });
  }
});

//___INSTALL___

chrome.runtime.onInstalled.addListener(() => {
  // chrome.storage.local.clear();
  // const savedUrls = ["developer.chrome.com", "www.google.com", "www.amazon.de"];
  // chrome.storage.local.set({ savedUrls: savedUrls });
  // chrome.storage.local.set({ playerState: Player.playerState });
  // chrome.storage.local.set({ playlist: [] });
});

//___EventListener___

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  handleActiveTab(await getActiveTab());
});

chrome.tabs.onUpdated.addListener(async (tabId, _, tab) => {
  if (tab.active) handleActiveTab(tabId);
});

async function handleActiveTab(tabId) {
  const url = await getUrl(tabId);
  const isSaved = await checkIsUrlSaved(url);
  isSaved ? Player.play() : Player.pause();
  chrome.tabs.sendMessage(tabId, { isShop: { isShop: isSaved } });
}

async function checkIsUrlSaved(url) {
  return new Promise((resolve) => {
    chrome.storage.local.get("savedUrls", (items) => {
      const savedUrls = items.savedUrls;
      const host = url.replace(/https?:\/\//, "").split("/")[0];
      resolve(savedUrls.includes(host));
    });
  });
}

async function getUrl(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.get(tabId, (tab) => {
      resolve(tab.url);
    });
  });
}

async function checkOtherAudioPlaying() {
  return new Promise((resolve) => {
    chrome.tabs.query({ audible: true }, (tabs) => {
      return resolve(tabs);
    });
  });
}

async function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      return resolve(tabs[0].id);
    });
  });
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message === "getIsSaved") {
    const tabId = await getActiveTab();
    const url = await getUrl(tabId);

    const isSaved = await checkIsUrlSaved(url);

    if (url.match(/https?:\/\//) === null) {
      chrome.runtime.sendMessage({ getIsSaved: { isSaved: "not-save-able" } });
    } else {
      chrome.runtime.sendMessage({ getIsSaved: { isSaved: isSaved } });
    }
  } else if (message === "setIsSaved") {
    const tabId = await getActiveTab();
    const url = await getUrl(tabId);
    const isSaved = await checkIsUrlSaved(url);

    if (url.match(/https?:\/\//) === null) {
      chrome.runtime.sendMessage({ getIsSaved: { isSaved: "not-save-able" } });
    } else if (isSaved) {
      chrome.storage.local.get("savedUrls", (items) => {
        chrome.storage.local.set(
          {
            savedUrls: items.savedUrls.filter(
              (savedUrl) =>
                url.replace(/https?:\/\//, "").split("/")[0] !== savedUrl
            ),
          },
          () => {
            Player.pause();
            chrome.runtime.sendMessage({ getIsSaved: { isSaved: false } });
          }
        );
      });
    } else {
      chrome.storage.local.get("savedUrls", (items) => {
        chrome.storage.local.set(
          {
            savedUrls: [
              ...items.savedUrls,
              url.replace(/https?:\/\//, "").split("/")[0],
            ],
          },
          () => {
            Player.play();
            chrome.runtime.sendMessage({ getIsSaved: { isSaved: true } });
          }
        );
      });
    }
  }
});

setInterval(async () => {
  const tabs = await checkOtherAudioPlaying();
  if (tabs.length > 0) {
    Player.pause();
  }
}, 500);
