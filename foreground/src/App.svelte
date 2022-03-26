<script>
  import MainPage from "./lib/pages/MainPage.svelte";
  const pages = {
    main: MainPage,
  };

  let activePage = pages.main;
</script>

<main>
  <svelte:component this={activePage} />
</main>

<style>
  main {
    width: 400px;

    padding: 20px;

    background: #eeeeee;
    border: 1px solid #d5d5d5;
    box-shadow: 0px 0px 59px rgba(0, 0, 0, 0.25),
      inset 0px 0px 16px rgba(0, 0, 0, 0.1);
    /* border-radius: 8px; */
  }
</style>
