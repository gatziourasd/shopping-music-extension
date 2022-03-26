<script>
  import SongItem from "../elements/SongItem.svelte";
  import ContextMenu from "../elements/ContextMenu.svelte";
  let contextMenu;

  let selectedItemId;
  let playing;
  let playlist = [];

  function handlePlayerEvent(event = {}) {
    event.action = event?.action ?? "";
    event.data = event?.data ?? "";
    chrome.runtime.sendMessage({ playerEvent: event });
  }

  function handlePlaylistEvent(event = {}) {
    event.action = event?.action ?? "";
    event.data = event?.data ?? "";
    chrome.runtime.sendMessage({ playlistEvent: event });
  }

  //___Storage___

  chrome.storage.local.get("playlist", (items) => {
    playlist = [...items.playlist];
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes?.playlist?.newValue) return;
    playlist = [...changes.playlist.newValue];
  });

  chrome.storage.local.get("playerState", (items) => {
    selectedItemId = items.playerState.trackId;
    playing = items.playerState.playing;
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes?.playerState?.newValue) return;
    selectedItemId = changes.playerState.newValue.trackId;
    playing = changes.playerState.newValue.playing;
  });

  //___Drag___

  let listElement;
  let itemDragStartIndex = null;
  let itemDragOverIndex = null;

  let dragStats = {};

  $: {
    if (
      itemDragOverIndex !== null &&
      itemDragStartIndex !== null &&
      itemDragOverIndex !== itemDragStartIndex
    ) {
      [playlist[itemDragStartIndex], playlist[itemDragOverIndex]] = [
        playlist[itemDragOverIndex],
        playlist[itemDragStartIndex],
      ];
      itemDragStartIndex = itemDragOverIndex;
    }
  }
</script>

<ContextMenu bind:this={contextMenu} />

{#if itemDragStartIndex !== null}
  <div
    style="position: absolute; left: {dragStats.left}px; top: {dragStats.top}px; width: {dragStats.width}px; pointer-events: none;"
  >
    <SongItem
      item={playlist[itemDragStartIndex]}
      selected={playlist[itemDragStartIndex].id === selectedItemId}
      {playing}
    />
  </div>
{/if}

<ul
  bind:this={listElement}
  on:contextmenu={(event) => {
    event.preventDefault();
    contextMenu.open(null, { x: event.clientX, y: event.clientY });
  }}
>
  {#each playlist as item, index}
    <div class="wrapper" class:hide={itemDragStartIndex === index}>
      <SongItem
        {item}
        selected={item.id === selectedItemId}
        playing={playing && item.id === selectedItemId}
        on:contextmenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          contextMenu.open(item, { x: event.clientX, y: event.clientY });
        }}
        on:click={() => {
          handlePlayerEvent({
            action: "select-track",
            data: { trackId: item.id },
          });
        }}
        on:dragstart={(event) => {
          itemDragStartIndex = index;
          dragStats.left = event.target.getBoundingClientRect().left;
          dragStats.width = event.target.getBoundingClientRect().width;
        }}
        on:drag={(event) => {
          if (event.clientY > listElement.getBoundingClientRect().bottom - 21) {
            dragStats.top = listElement.getBoundingClientRect().bottom - 50;
            listElement.scroll({ top: listElement.scrollTop + 10 });
          } else if (
            event.clientY <
            listElement.getBoundingClientRect().top + 39
          ) {
            dragStats.top = listElement.getBoundingClientRect().top + 18;
            listElement.scroll({ top: listElement.scrollTop - 10 });
          } else {
            dragStats.top = event.clientY - 21;
          }
        }}
        on:dragend={() => {
          itemDragOverIndex = null;
          itemDragStartIndex = null;
          dragStats = {};
          handlePlaylistEvent({
            action: "reorder",
            data: {
              order: playlist.map((track) => {
                return track?.id;
              }),
            },
          });
        }}
        on:dragover={() => {
          itemDragOverIndex = index;
        }}
      />
    </div>
  {/each}
</ul>

<style>
  ul {
    height: 200px;

    padding: 15px;

    display: flex;
    flex-direction: column;
    gap: 10px;

    background: linear-gradient(180deg, #eaeaea 0%, #f0f0f0 100%, #f3f3f3 100%);
    border: 1px solid #e7e7e7;
    box-shadow: inset 0px 3px 16px rgba(0, 0, 0, 0.03);
    border-radius: 8px;

    overflow-y: auto;
  }

  .hide {
    opacity: 0;
  }

  ul::-webkit-scrollbar {
    width: 10px;
  }

  ul::-webkit-scrollbar-track {
    background-color: rgba(206, 206, 206, 0);
    border-radius: 4px;
  }

  ul::-webkit-scrollbar-thumb {
    background: #f2f2f2;
    border: 1px solid #e2e2e2;
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.05);
    border-radius: 5px;
  }
</style>
