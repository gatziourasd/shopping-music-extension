<script>
  import Divider from "../elements/Divider.svelte";

  let isSaved = true;

  chrome.runtime.sendMessage("getIsSaved");
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message?.getIsSaved) return;
    isSaved = message.getIsSaved.isSaved;
  });
</script>

{#if isSaved !== "not-save-able"}
  <Divider />
  <button
    on:click={() => {
      chrome.runtime.sendMessage("setIsSaved");
    }}
  >
    <div class="icon {isSaved ? 'minus' : 'plus'}">
      <div class="bar" />
      <div class="bar" />
    </div>
    <span style="margin: -10px;">
      {isSaved ? "Remove" : "Add"} this Website
    </span>
  </button>
{/if}

<style>
  button {
    width: 100%;
  }

  .icon {
    position: relative;
    background-color: yellow;
    width: 10px;
    margin-left: 18px;
  }
  .plus > .bar:nth-child(1) {
    top: -1px;
    position: absolute;
    left: 50%;
    transition: 1s;
  }

  .plus > .bar:nth-child(2) {
    position: absolute;
    top: -1px;
    left: 50%;
    transform: rotate(450deg);
  }

  .minus > .bar:nth-child(1) {
    top: -1px;
    position: absolute;
    left: 50%;
    transform: rotate(90deg);
    transition: 1s;
    background-color: #ff9500;
  }

  .minus > .bar:nth-child(2) {
    position: absolute;
    top: -1px;
    left: 50%;
    transform: rotate(90deg);
    transition: 1s;
    background-color: #ff9500;
  }

  .bar {
    width: 5px;
    height: 18px;
    background-color: var(--accent-color, blue);
  }
</style>
