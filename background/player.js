const audioPlayer = new Audio();

export let playerState = {
  playing: false,
  trackId: null,
  shuffle: false,
  loop: "loop",
  volume: 1,
  mutedOnce: false,
};

//___AudioPlayerEvents

audioPlayer.onended = () => {
  nextTrack();
};

//___PlayerEvent___

async function handlePlayerEvent(event) {
  switch (event.action.toLowerCase()) {
    case "toggle-play":
      playerState.playing ? await pause() : await play();
      break;
    case "pause":
      pause();
      break;
    case "shuffle":
      updatePlayerState("shuffle", !playerState.shuffle);
      if (playerState.shuffle) updatePlayerState("loop", "loop");
      break;
    case "loop":
      updatePlayerState("shuffle", false);
      if (playerState.loop === "loop")
        updatePlayerState("loop", "loop-current");
      else if (playerState.loop === "loop-current")
        updatePlayerState("loop", "no-loop");
      else if (playerState.loop === "no-loop")
        updatePlayerState("loop", "loop");
      break;
    case "next":
      nextTrack();
      break;
    case "prev":
      prevTrack();
      break;
    case "select-track":
      selectTrack(event.data.trackId);
      break;
    case "volume":
      setVolume(event.data.volume);
      break;
    case "mute-once":
      setVolume(0);
      updatePlayerState("mutedOnce", true);
      break;
  }
}

export async function play() {
  if (!playerState.playing && audioPlayer?.src) {
    audioPlayer.play();
  }
  audioPlayer.onplay = () => {
    updatePlayerState("playing", true);
  };
}

export async function pause() {
  if (playerState.playing) audioPlayer.pause();
  audioPlayer.onpause = () => {
    updatePlayerState("playing", false);
  };
}

export function setVolume(volume) {
  audioPlayer.volume = volume;
  updatePlayerState("volume", volume);
  updatePlayerState("mutedOnce", false);
}

function reset() {
  audioPlayer.currentTime = 0;
}

function nextTrack() {
  chrome.storage.local.get("playlist", (items) => {
    let playlist = items.playlist;

    let currentTrackIndex = playlist.findIndex(
      (track) => track.id === playerState.trackId
    );

    if (playerState.shuffle) {
      loadTrack(Math.round(Math.random() * (playlist.length - 1)));
      return;
    }

    if (playerState.loop === "loop-current") {
      loadTrack(currentTrackIndex);
    } else if (playerState.loop === "no-loop") {
      if (currentTrackIndex + 1 >= playlist.length) {
        reset();
        pause();
      } else loadTrack(currentTrackIndex + 1);
    } else if (playerState.loop === "loop") {
      if (currentTrackIndex + 1 >= playlist.length) loadTrack(0);
      else loadTrack(currentTrackIndex + 1);
    }
  });
}

function prevTrack() {
  chrome.storage.local.get("playlist", (items) => {
    let playlist = items.playlist;

    let currentTrackIndex = playlist.findIndex(
      (track) => track.id === playerState.trackId
    );

    if (audioPlayer.currentTime >= 1) {
      reset();
    } else {
      if (playerState.loop === "loop-current") {
        loadTrack(currentTrackIndex);
      } else if (playerState.loop === "no-loop") {
        if (currentTrackIndex - 1 < 0) {
          pause();
          reset();
        } else loadTrack(currentTrackIndex - 1);
      } else if (playerState.loop === "loop") {
        if (currentTrackIndex - 1 < 0) loadTrack(playlist.length - 1);
        else loadTrack(currentTrackIndex - 1);
      }
    }
  });
}

function selectTrack(trackId) {
  chrome.storage.local.get("playlist", (items) => {
    let playlist = items.playlist;

    let trackIndex = playlist.findIndex((track) => track.id === trackId);

    loadTrack(trackIndex);
  });
}

function loadTrack(index) {
  chrome.storage.local.get("playlist", (items) => {
    const trackId = items.playlist[index].id;
    if (trackId) {
      chrome.storage.local.get(trackId, async (items) => {
        playerState.playing = false;
        audioPlayer.src = items[trackId];
        await play();
        updatePlayerState("trackId", trackId);
      });
    }
  });
}

export function setTrack(Id) {
  chrome.storage.local.get("playlist", (items) => {
    const trackId = Id;
    if (trackId) {
      chrome.storage.local.get(trackId, async (items) => {
        audioPlayer.src = items[trackId];
        updatePlayerState("trackId", trackId);
      });
    }
  });
}

export function updatePlayerState(key, value) {
  if (key !== undefined && value !== undefined) {
    playerState[key] = value;
  }
  chrome.storage.local.set({ playerState: playerState });
}

//___PlayListEvents___

function handlePlaylistEvent(event) {
  switch (event.action.toLowerCase()) {
    case "new":
      addNewTrack(event.data?.name, event.data?.blob);
      break;
    case "reorder":
      reorderPlaylist(event.data?.order);
      break;
    case "delete":
      deleteTrack(event.data?.id);
      break;
    case "icon":
      setIcon(event.data?.id, event.data?.blob);
      break;
  }
}

function setIcon(trackId, blob) {
  chrome.storage.local.get("playlist", (items) => {
    let playlist = items.playlist;
    playlist.map((track) => {
      if (track.id === trackId) track.blobIcon = blob;
      return track;
    });
    chrome.storage.local.set({
      playlist,
    });
  });
}

function reorderPlaylist(order) {
  chrome.storage.local.get("playlist", (items) => {
    const playlist = items.playlist;
    if (playlist.length !== order.length) return;
    let newPlaylist = [];
    for (let i = 0; i < playlist.length; i++) {
      newPlaylist.push(
        playlist[playlist.findIndex((track) => track.id === order[i])]
      );
    }

    chrome.storage.local.set({ playlist: newPlaylist });
  });
}

function addNewTrack(name, blob) {
  if (!blob) return;
  const trackId = generateId();
  chrome.storage.local.set({ [trackId]: blob }, () => {
    if (chrome.runtime.lastError) {
      console.log(chrome.runtime.lastError.message);
    } else {
      chrome.storage.local.get("playlist", (items) => {
        chrome.storage.local.set(
          {
            playlist: [...items.playlist, { name: name, id: trackId }],
          },
          () => {
            loadTrack(items.playlist.length);
          }
        );
      });
    }
  });
}

function deleteTrack(trackId) {
  chrome.storage.local.get("playlist", (items) => {
    let playlist = items.playlist;

    let removedTrack = playlist.splice(
      playlist.findIndex((track) => track.id === trackId),
      1
    )[0];

    if (playlist.length === 0) {
      updatePlayerState("playing", false);
      playerState.trackId === null;
      audioPlayer.src = "";
    } else if (playerState.trackId === trackId) {
      loadTrack(0);
    }

    chrome.storage.local.set({ playlist });
    chrome.storage.local.remove(removedTrack.id);
  });
}

function generateId() {
  return (
    "blob-storage" + new Date().getTime() + Math.floor(Math.random() * 100)
  );
}

//___Listener___

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.playerEvent) handlePlayerEvent(request.playerEvent);
  if (request?.playlistEvent) handlePlaylistEvent(request.playlistEvent);
});
