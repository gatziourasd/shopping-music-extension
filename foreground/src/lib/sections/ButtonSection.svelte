<script>
  let volume = 100;

  chrome.storage.local.get("playerState", (items) => {
    volume = items.playerState.volume;
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes?.playerState?.newValue) return;
    volume = changes.playerState.newValue.volume;
  });

  function handlePlayerEvent(event = {}) {
    event.action = event?.action ?? "";
    event.data = event?.data ?? "";
    chrome.runtime.sendMessage({ playerEvent: event });
  }
</script>

<div class="container">
  <button
    on:click={() => window.open("https://github.com/", "_blank").focus()}
    class="icon-button"
  >
    <img
      style="margin-top: 5px"
      src="/assets/icons/github-icon.png"
      alt="settings-icon"
    />
  </button>

  <button
    on:click={() => {
      chrome.runtime.sendMessage({
        playerEvent: { action: "volume", data: { volume: "0" } },
      });
    }}
  >
    Mute
  </button>
  <button
    on:click={() => {
      chrome.runtime.sendMessage({
        playerEvent: { action: "mute-once" },
      });
    }}
  >
    Mute this Session
  </button>
</div>

<style>
  .container {
    display: flex;
    gap: 10px;
  }

  button {
    display: block;
    width: 100%;
  }

  .icon-button {
    max-width: 42px;
    height: 42px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
