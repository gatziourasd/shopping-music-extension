<script>
  let sliderValue = 100;

  chrome.storage.local.get("playerState", (items) => {
    sliderValue = Math.floor(items.playerState.volume * 100);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes?.playerState?.newValue) return;
    sliderValue = Math.floor(changes.playerState.newValue.volume * 100);
  });

  function handlePlayerEvent(event = {}) {
    event.action = event?.action ?? "";
    event.data = event?.data ?? "";
    chrome.runtime.sendMessage({ playerEvent: event });
  }
</script>

<div class="container">
  <svg
    on:click={() => {
      sliderValue = 0;
      handlePlayerEvent({
        action: "volume",
        data: { volume: sliderValue / 100 },
      });
    }}
    class="volume-icon"
    width="45"
    height="36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_d_46_56)">
      <path
        d="M15.0677 7.45455H10.9474C10.4242 7.45455 10 7.8787 10 8.40191V13.5981C10 14.1213 10.4242 14.5455 10.9474 14.5455H15.0677C15.3052 14.5455 15.5341 14.6347 15.709 14.7955L19.7798 18.5391C20.3871 19.0975 21.3684 18.6668 21.3684 17.8417V4.15827C21.3684 3.33324 20.3871 2.90247 19.7798 3.46094L15.709 7.20451C15.5341 7.3653 15.3052 7.45455 15.0677 7.45455Z"
        fill="#494949"
      />
      <path
        style="opacity: {sliderValue <= 0 ? '0' : '1'}"
        d="M22.9843 8.025C24.3065 9.78796 24.3065 12.212 22.9843 13.975L24.3843 15.025C26.1732 12.6398 26.1732 9.36019 24.3843 6.975L22.9843 8.025Z"
        fill="#494949"
      />
      <path
        style="opacity: {sliderValue < 33 ? '0' : '1'}"
        d="M25.4343 5.75V5.75C27.9687 8.79122 27.9687 13.2088 25.4343 16.25V16.25"
        stroke="#494949"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        style="opacity: {sliderValue < 66 ? '0' : '1'}"
        d="M27.1843 4V4C30.6912 8.00784 30.6912 13.9922 27.1843 18V18"
        stroke="#494949"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
    <defs>
      <filter
        id="filter0_d_46_56"
        x="0"
        y="0.209045"
        width="40.6895"
        height="35.5819"
        filterUnits="userSpaceOnUse"
        color-interpolation-filters="sRGB"
      >
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="7" />
        <feGaussianBlur stdDeviation="5" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_46_56"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_46_56"
          result="shape"
        />
      </filter>
    </defs>
  </svg>

  <input
    type="range"
    min="0"
    max="100"
    bind:value={sliderValue}
    class="slider"
    on:input={() => {
      handlePlayerEvent({
        action: "volume",
        data: { volume: sliderValue / 100 },
      });
    }}
  />
</div>

<style>
  .container {
    display: flex;
    align-items: center;
  }

  .slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 4px;
    background: #e1e1e1;
    border-radius: 14px;
    outline: none;
    opacity: 0.7;
    transition: 0.2s;
    transition: opacity 0.2s;
  }

  .slider:hover {
    opacity: 1;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none; /* Override default look */
    appearance: none;

    width: 40px;
    height: 21px;

    background: linear-gradient(180deg, #f6f6f6 0%, #f0f0f0 100%, #ededed 100%);
    border: 1px solid #e7e7e7;
    box-shadow: 0px 4px 9px rgba(0, 0, 0, 0.08);
    border-radius: 8px;

    background-image: url("/assets/icons/slider-thumb-icon.svg");
    background-position: center -7px;
  }

  .slider::-moz-range-thumb {
    width: 40px;
    height: 21px;

    background: linear-gradient(180deg, #f6f6f6 0%, #f0f0f0 100%, #ededed 100%);
    border: 1px solid #e7e7e7;
    box-shadow: 0px 4px 9px rgba(0, 0, 0, 0.08);
    border-radius: 8px;

    background-image: url("/assets/icons/slider-thumb-icon.svg");
    background-position: center -7px;
  }

  .volume-icon {
    transform: translateY(7px);
    margin-right: 10px;
    transition: 100ms;
  }

  .volume-icon:hover {
    transform: translateY(8.4px) scale(1.2);
    transition: 100ms;
  }
</style>
