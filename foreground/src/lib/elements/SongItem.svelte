<script>
  export let item;
  export let selected;
  export let playing;
</script>

<li
  draggable="true"
  on:dragstart
  on:drag
  on:dragend
  on:dragover
  on:click
  on:contextmenu
>
  <img src={item?.blobIcon ?? '/assets/icons/placeholder-track-icon.png'} alt="song icon" />
  <span class="item-text" class:highlight={selected}>{item?.name}</span>
  <div class="item-icon-end" class:hide={!playing}>
    <div class="item-icon-end-bar" />
    <div class="item-icon-end-bar" />
    <div class="item-icon-end-bar" />
  </div>
</li>

<style>
  li {
    width: 100%;
    padding: 12px 15px;

    display: flex;

    background: linear-gradient(180deg, #f6f6f6 0%, #f0f0f0 100%, #ededed 100%);
    box-shadow: 0px 2px 7px rgba(0, 0, 0, 0.05);
    border-radius: 8px;
  }

  li:hover {
    outline: solid 2px var(--accent-color, blue);
  }

  .item-text {
    font-weight: 500;
    font-size: 14px;

    color: #494949;

    margin-left: 10px;
  }

  .item-icon-end {
    display: flex;
    align-items: center;
    justify-content: center;

    gap: 3px;
    margin-left: auto;

    transform: translateY(30%);
  }

  .item-icon-end-bar {
    width: 3px;

    height: 100%;

    background-color: var(--accent-color, blue);
  }

  .item-icon-end-bar:nth-child(1) {
    animation: musicupdown 0.7s infinite alternate -3s;
  }

  .item-icon-end-bar:nth-child(2) {
    animation: musicupdown 0.9s infinite alternate -2.4s;
  }

  .item-icon-end-bar:nth-child(3) {
    animation: musicupdown 0.8s infinite alternate -3.1s;
  }

  @keyframes musicupdown {
    0% {
      transform: scaleY(0.2) translateY(0%);
    }
    100% {
      transform: scaleY(0.8) translateY(-40%);
    }
  }

  li:hover > .item-icon-end {
    display: inherit;
    transform: translateY(0) rotate(90deg);
    gap: 2px;
    /* transition: 500ms; */
  }

  li:hover > .item-icon-end > .item-icon-end-bar {
    animation: none;
    width: 2px;
    background-color: #797979;
  }

  .hide {
    display: none;
  }

  .highlight {
    color: var(--accent-color, blue);
  }

  img{
    height: 18px;
    max-height: 18px;
    max-width: 25px;
  }
</style>
