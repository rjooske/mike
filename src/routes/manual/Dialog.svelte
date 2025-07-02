<script lang="ts">
  import "$lib/m-plus-rounded-1c.scss";
  import type { Snippet } from "svelte";

  let {
    imageSrc,
    name,
    children,
  }: { imageSrc: string; name: string; children: Snippet } = $props();
</script>

<div class="root">
  <div class="speaker">
    <img src={imageSrc} alt={name} />
    <span>{name}</span>
  </div>
  <div class="content">
    {@render children()}
  </div>
</div>

<style lang="scss">
  .root {
    margin: 0.5em 0;
    padding: 0.5em;
    display: grid;
    grid-template-columns: 7em auto;
    background-color: hsl(0, 0%, 98%);
    border: 1px solid hsl(0, 0%, 95%);
    border-radius: 1em;
    font-family: "M PLUS Rounded 1c", sans-serif;
  }

  .speaker {
    text-align: center;

    & > img {
      width: 4em;
      border: 1px solid hsl(0, 0%, 90%);
      border-radius: 100%;
    }

    & > span {
      margin-top: -4px;
      display: block;
      font-size: 0.8em;
    }
  }

  .content {
    padding: 1em;
    align-self: center;
  }
</style>
