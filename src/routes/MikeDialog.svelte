<script lang="ts">
  let { text }: { text: string } = $props();
</script>

<div class="root">
  <img src="./mike.png" alt="ミケ" class="mike" />
  <div class="text">
    <span class="description">ちょっと偉そうな猫</span>
    <span class="name">ミケ</span>
  </div>
  <div class="speech-bubble" class:hidden={text === ""}>
    <img src="./speech_bubble.svg" alt="" />
    <div>{text}</div>
  </div>
</div>

<style>
  .root {
    position: relative;
    height: 400px;
    margin-bottom: 2em;
  }

  .mike {
    position: absolute;
    left: 0;
    top: 0;
  }

  .text {
    width: fit-content;
    position: absolute;
    top: 325px;
    left: 260px;
    background-color: white;
    padding: 10px;
    border: 1px solid #bbb;
    border-radius: 10px;
    transform: translateX(-50%);

    & > span {
      display: block;
      text-align: center;
    }
  }

  .description {
    font-size: 0.8em;
    line-height: 0.9em;
  }

  .name {
    font-size: 1.5em;
  }

  .speech-bubble {
    position: absolute;
    left: 350px;
    top: 110px;

    &.hidden {
      visibility: hidden;
    }

    & > div {
      margin: 0;
      position: absolute;
      top: 21px;
      left: 60px;
      width: 258px;
      height: 120px;
      display: grid;
      place-content: center;
    }
  }
</style>
