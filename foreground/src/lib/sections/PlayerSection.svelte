<script>
  let playerState;

  chrome.storage.local.get("playerState", (items) => {
    if (items?.playerState) playerState = items.playerState;
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes?.playerState?.newValue) return;
    playerState = changes.playerState.newValue;
  });

  function handlePlayerEvent(event = {}) {
    event.action = event?.action ?? "";
    event.data = event?.data ?? "";
    chrome.runtime.sendMessage({ playerEvent: event });
  }
</script>

<div class="container">
  <div class="player-container">
    <img
      height="25px"
      src="assets/icons/{playerState?.shuffle ? 'random' : 'order'}.svg"
      alt=""
      class="shuffle-button"
      on:click={() => handlePlayerEvent({ action: "shuffle" })}
    />
    <div
      class="control-button"
      style="margin-left: 25px;
        margin-right: 18px;"
      on:click={() => handlePlayerEvent({ action: "prev" })}
    >
      <img
        src="assets/icons/arrow.svg"
        alt=""
        style="transform: rotateY(180deg);"
      />
    </div>
    <div
      class="play-button"
      on:click={() => handlePlayerEvent({ action: "toggle-play" })}
    >
      <img
        width="25px"
        src="assets/icons/{playerState?.playing ? 'pause' : 'play'}.svg"
        alt=""
      />
    </div>
    <div
      class="control-button"
      on:click={() => handlePlayerEvent({ action: "next" })}
    >
      <img src="assets/icons/arrow.svg" alt="" />
    </div>
    <img
      src="assets/icons/{playerState?.loop}.svg"
      alt=""
      class="shuffle-button"
      style="margin-top: 7px"
      on:click={() => handlePlayerEvent({ action: "loop" })}
    />
  </div>
</div>

<style>
  .container {
    display: flex;
    justify-content: center;
  }
  .player-container {
    display: flex;
    justify-items: center;
    align-items: center;

    margin-bottom: 20px;
    width: fit-content;
  }

  .play-button:hover,
  .control-button:hover {
    background: linear-gradient(180deg, #fafafa 0%, #f0f0f0 100%, #f1f1f1 100%);
  }

  .play-button:active,
  .control-button:active {
    box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.05);

    background: linear-gradient(180deg, #f7f7f7 0%, #f0f0f0 100%, #b6b6b6 100%);
  }

  .control-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;

    background: linear-gradient(180deg, #f6f6f6 0%, #f0f0f0 100%, #ededed 100%);
    border: 1px solid #ededed;
    box-sizing: border-box;
    box-shadow: 0px 4px 1px rgba(218, 218, 218, 0.81);

    display: flex;
    justify-content: center;
    align-items: center;

    margin-left: 18px;
    margin-right: 25px;
  }

  .play-button {
    width: 80px;
    height: 80px;

    background: linear-gradient(180deg, #f6f6f6 0%, #f0f0f0 100%, #ededed 100%);
    border: 1px solid #e7e7e7;
    box-sizing: border-box;
    box-shadow: 0px 2px 7px rgba(0, 0, 0, 0.05);
    border-radius: 70px;

    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
