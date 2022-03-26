<script>
  let songItem;
  let isOpen = false;
  let position = {
    x: 0,
    y: 0,
  };

  const maxFileSize = 25000000;
  const maxIconFileSize = 5000000;

  export function open(item, pos) {
    isOpen = true;
    songItem = item;
    position = pos;
  }
  function close() {
    isOpen = false;
    songItem = null;
    position = null;
  }

  function setIcon() {
    const fileSelectorElement = document.createElement("input");
    fileSelectorElement.setAttribute("type", "file");
    fileSelectorElement.setAttribute("accept", "image/,.png,.jpeg,.jpg,.svg");
    fileSelectorElement.click();

    const item = songItem;

    fileSelectorElement.onchange = () => {
      const reader = new FileReader();
      reader.onload = () => {
        chrome.runtime.sendMessage({
          playlistEvent: {
            action: "icon",
            data: {
              id: item.id,
              blob: reader.result,
            },
          },
        });
      };
      if (
        fileSelectorElement.files[0] &&
        fileSelectorElement.files[0].size <= maxIconFileSize
      ) {
        reader.readAsDataURL(fileSelectorElement.files[0]);
      }
    };
    close();
  }

  function renameTrack() {}

  function deleteTrack() {
    chrome.runtime.sendMessage({
      playlistEvent: { action: "delete", data: { id: songItem.id } },
    });
  }

  function addNewTrack() {
    const fileSelectorElement = document.createElement("input");
    fileSelectorElement.setAttribute("type", "file");
    fileSelectorElement.setAttribute("accept", "audio/,.wav,.ogg,.mp3");
    fileSelectorElement.click();

    fileSelectorElement.onchange = () => {
      const reader = new FileReader();
      reader.onload = () => {
        chrome.runtime.sendMessage({
          playlistEvent: {
            action: "new",
            data: {
              blob: reader.result,
              name: fileSelectorElement.files[0].name.split(".")[0],
            },
          },
        });
      };

      if (
        fileSelectorElement.files[0] &&
        fileSelectorElement.files[0].size <= maxFileSize
      ) {
        reader.readAsDataURL(fileSelectorElement.files[0]);
      }
    };
  }
</script>

{#if isOpen}
  <div class="container" on:click={close} on:contextmenu|preventDefault>
    <ul class="menu" style="top: {position.y}px; left: {position.x}px; ">
      {#if songItem}
        <!-- <li on:click={() => renameTrack()}>Edit name</li> -->
        <li on:click|stopPropagation={() => setIcon()}>Edit Icon</li>
        <li on:click={() => deleteTrack()}>Delete</li>
        <div class="divider" />
      {/if}
      <li on:click={() => addNewTrack()}>Add new track</li>
    </ul>
  </div>
{/if}

<style>
  .container {
    position: fixed;
    width: 100vw;
    height: 100vh;

    top: 0;
    left: 0;

    z-index: 101;
  }

  .menu {
    position: fixed;
    padding: 6px;

    background: linear-gradient(180deg, #f6f6f6 0%, #f0f0f0 100%, #ededed 100%);
    border: 1px solid #e7e7e7;
    box-shadow: 0px 4px 25px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .divider {
    height: 2px;

    background: #e5e5e5;
    box-shadow: 0px 4px 6px rgba(255, 255, 255, 0.7);
    border-radius: 6px;
  }

  li {
    padding: 4px 6px;
  }

  li:hover {
    background-color: #e5e5e5;
    border-radius: 5px;
  }
</style>
