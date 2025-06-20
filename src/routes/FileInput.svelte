<script lang="ts">
  import { parse } from "$lib/input";
  import type { Instructor } from "$lib/mike";
  import { assert } from "$lib/util";
  import * as exceljs from "exceljs";

  let {
    id,
    filename,
    onLoad,
    onError,
    onReset,
  }: {
    id: string;
    filename: string | undefined;
    onLoad: (filename: string, is: Instructor[]) => void;
    onError: () => void;
    onReset: () => void;
  } = $props();

  let inputElement = $state<HTMLInputElement | undefined>();

  $effect(() => {
    if (inputElement === undefined) {
      return;
    }
    if (filename === undefined) {
      inputElement.value = "";
    }
  });

  async function handleChange(e: HTMLInputElement) {
    assert(e.files !== null);
    if (e.files.length !== 1) {
      return;
    }
    const file = e.files[0];

    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await file.arrayBuffer();
    } catch {
      onError();
      // TODO
      return;
    }

    const workbook = new exceljs.Workbook();
    try {
      await workbook.xlsx.load(arrayBuffer);
    } catch {
      onError();
      // TODO
      return;
    }

    const instructors = parse(workbook);
    if (instructors === undefined) {
      onError();
      // TODO
      return;
    }

    onLoad(file.name, instructors);
  }

  function handleReset() {
    if (
      window.confirm(
        "ファイルを変更もしくは再読み込みすると、入力したデータが全てリセットされます。本当にファイルを変更しますか？",
      )
    ) {
      onReset();
    }
  }
</script>

{#if filename === undefined}
  <label for={id}>任用計画書ファイルを選択:</label>
  <input
    bind:this={inputElement}
    {id}
    type="file"
    onchange={(e) => handleChange(e.currentTarget)}
  />
{:else}
  <span>現在読み込まれているファイル:</span>
  <span>{filename}</span>
  <button onclick={handleReset}>ファイルを変更・再読み込み</button>
{/if}
