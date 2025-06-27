<script lang="ts" module>
  export type Names = {
    filename: string;
    sheetName: string;
  };

  export type FileError =
    | { kind: "cannot-read-file" }
    | { kind: "cannot-load-as-xlsx" }
    | { kind: "workbook-error"; error: ParseWorkbookError }
    | { kind: "sheet-errors"; sheetName: string; errors: ParseSheetError[] };
</script>

<script lang="ts">
  import {
    parse,
    type ParseSheetError,
    type ParseWorkbookError,
  } from "$lib/input";
  import type { Instructor } from "$lib/mike";
  import { assert, unreachable } from "$lib/util";
  import * as exceljs from "exceljs";

  let {
    id,
    names,
    onLoad,
    onError,
    onReset,
  }: {
    id: string;
    names: Names | undefined;
    onLoad: (names: Names, instructors: Instructor[]) => void;
    onError: (e: FileError) => void;
    onReset: () => void;
  } = $props();

  let inputElement = $state<HTMLInputElement | undefined>();

  $effect(() => {
    if (inputElement === undefined) {
      return;
    }
    if (names === undefined) {
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
      onError({ kind: "cannot-read-file" });
      return;
    }

    const workbook = new exceljs.Workbook();
    try {
      await workbook.xlsx.load(arrayBuffer);
    } catch {
      onError({ kind: "cannot-load-as-xlsx" });
      return;
    }

    const result = parse(workbook);
    switch (result.kind) {
      case "ok":
        names = { filename: file.name, sheetName: result.sheetName };
        onLoad(names, result.instructors);
        break;
      case "workbook-error":
        onError({ kind: "workbook-error", error: result.error });
        break;
      case "sheet-errors":
        onError({
          kind: "sheet-errors",
          sheetName: result.sheetName,
          errors: result.errors,
        });
        break;
      default:
        unreachable(result);
    }
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

<fieldset>
  <legend>入力ファイル</legend>
  {#if names === undefined}
    <label for={id}>任用計画書ファイルを選択</label>
    <input
      bind:this={inputElement}
      {id}
      type="file"
      onchange={(e) => handleChange(e.currentTarget)}
    />
  {:else}
    <table>
      <tbody>
        <tr>
          <th>読み込まれているファイル</th>
          <td>
            {names.filename}
            <button onclick={handleReset} style="margin-left: 2em;">
              ファイルを変更・再読み込み
            </button>
          </td>
        </tr>
        <tr>
          <th>シート名</th>
          <td>
            {names.sheetName}
          </td>
        </tr>
      </tbody>
    </table>
  {/if}
</fieldset>

<style lang="scss">
  fieldset {
    border-radius: 1em;
    padding: 0.5em 1.5em 1em 1.5em;
  }

  label {
    padding-right: 1em;
    font-weight: bold;
  }

  th {
    padding-right: 1em;
    text-align: right;
    vertical-align: top;
    text-wrap: nowrap;
  }
</style>
