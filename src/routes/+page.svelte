<script lang="ts">
  import { browser } from "$app/environment";
  import type {
    ParseSheetError,
    ParseWorkbookError,
    Position,
    Range,
  } from "$lib/input";
  import {
    defaultExternalInfo,
    deserializeMikeData,
    MIKE_DATA_KEY,
    serializeMikeData,
    type Destination,
    type Entry,
    type Instructor,
    type MikeData,
  } from "$lib/mike";
  import { unreachable, assert } from "$lib/util";
  import Editor from "./Editor.svelte";
  import FileInput, { type FileError, type Names } from "./FileInput.svelte";
  import MikeDialog from "./MikeDialog.svelte";
  import "./global.scss";

  const TSUKUBA_STATION_ID = "ChIJNy1V02IMImARvSkyNbzdhzQ";
  const DAISAN_AREA_MAE_ID = "ChIJ-3Acq_8LImARmQg8O3hNzsM";

  function createGoogleMapsUrl(
    origin: string,
    destination: Destination,
  ): string {
    let destinationName: string;
    let destinationId: string;
    switch (destination) {
      case "tsukuba-station":
        destinationName = "つくば駅";
        destinationId = TSUKUBA_STATION_ID;
        break;
      case "daisan-area-mae":
        destinationName = "第三エリア前";
        destinationId = DAISAN_AREA_MAE_ID;
        break;
      default:
        unreachable(destination);
    }

    return (
      "https://www.google.com/maps/dir/?api=1&travelmode=transit" +
      `&origin=${encodeURIComponent(origin)}` +
      `&destination=${encodeURIComponent(destinationName)}` +
      `&destination_place_id=${destinationId}`
    );
  }

  function instructorsToEntries(is: Instructor[]): Entry[] {
    return is.map((i) => ({
      instructor: i,
      fromHome: {
        toTsukubaStation: createGoogleMapsUrl(i.homeAddress, "tsukuba-station"),
        toDaisanAreaMae: createGoogleMapsUrl(i.homeAddress, "daisan-area-mae"),
      },
      fromOffice: {
        toTsukubaStation: createGoogleMapsUrl(
          i.officeAddress,
          "tsukuba-station",
        ),
        toDaisanAreaMae: createGoogleMapsUrl(
          i.officeAddress,
          "daisan-area-mae",
        ),
      },
      externalInfo: defaultExternalInfo(),
    }));
  }

  function randomElement<T>(ts: T[]): T {
    assert(ts.length !== 0);
    return ts[Math.floor(ts.length * Math.random())];
  }

  type ErrorTextChunk = string | [string] | [string, string];

  function parseWorkbookErrorToChunks(e: ParseWorkbookError): ErrorTextChunk[] {
    switch (e.kind) {
      case "mike-sheet-not-found":
        return [`ミケが読み取るべきシートが存在しません`];
      case "multiple-mike-start": {
        const chunks: ErrorTextChunk[] = [
          `ミケが読み取るべきシートが複数存在します（`,
        ];
        for (let i = 0; i < e.sheetNames.length; i++) {
          if (i > 0) {
            chunks.push(", ");
          }
          chunks.push([e.sheetNames[i]]);
        }
        chunks.push("）");
        return chunks;
      }
      default:
        unreachable(e);
    }
  }

  function parseSheetErrorToChunks(e: ParseSheetError): ErrorTextChunk[] {
    function count(want: number, got: number): string {
      if (got === 0) {
        return "ありません";
      }
      if (got < want) {
        return `${got}個しかありません`;
      } else {
        return `${got}個あります`;
      }
    }

    function colToString(col: number): string {
      assert(Number.isInteger(col));
      assert(col >= 1);

      col--;
      let length = 0;
      for (let i = 1; ; i++) {
        if (col < 26 ** i) {
          length = i;
          break;
        }
        col -= 26 ** i;
      }

      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let result = "";
      for (let i = length - 1; i >= 0; i--) {
        result += chars[Math.floor(col / 26 ** i) % 26];
      }
      return result;
    }

    function colRow(col: number, row: number): string {
      return colToString(col) + row.toString();
    }

    function position({ col, row }: Position): string {
      return colRow(col, row);
    }

    function range(r: Range): string {
      return (
        "（セル" +
        colRow(r.col, r.fromRow) +
        "から" +
        colRow(r.col, r.toRow) +
        "）"
      );
    }

    switch (e.kind) {
      case "mike-end-not-found":
        return [[`mike_end`], `セルが存在しません`];
      case "mike-end-in-wrong-position":
        return [
          [`mike_start`],
          `セル（${position(e.mikeStart)}）と`,
          [`mike_end`],
          `セル（${position(e.mikeEnd)}）が異なる列に存在します`,
        ];
      case "mike-end-misaligned":
        return [
          [`mike_end`],
          `セル（${colRow(e.mikeCol, e.mikeEndRow)}）の行が表の最終行と異なる可能性があります`,
        ];
      case "bad-name-cell":
        return [
          [`氏名列`, "example.com"], // TODO
          `にデータが`,
          count(3, e.entryCount),
          range(e),
        ];
      case "unmerged-job-name-cell":
        return [
          [`現職名列`, "example.com"], // TODO
          `にマージされていないセルが存在します`,
          range(e),
        ];
      case "bad-course-cell":
        return [
          [`担当科目列`, "example.com"], // TODO
          `にデータが`,
          count(2, e.entryCount),
          range(e),
        ];
      case "unmerged-total-duration-cell":
        return [
          [`総時間数列`, "example.com"], // TODO
          `にマージされていないセルが存在します`,
          range(e),
        ];
      case "unparsable-total-duration":
        return [
          [`総時間数列`, "example.com"], // TODO
          `のデータ`,
          [e.text],
          `は数字ではありません`,
          range(e),
        ];
      case "unmerged-course-term-cell":
        return [
          [`実施学期列`, "example.com"], // TODO
          `にマージされていないセルが存在します`,
          range(e),
        ];
      default:
        unreachable(e);
    }
  }

  type Display =
    | { kind: "nothing" }
    | { kind: "mike-data"; mikeData: MikeData }
    | { kind: "error"; error: ErrorTextChunk[] }
    | { kind: "sheet-errors"; sheetName: string; errors: ErrorTextChunk[][] };
  const DISPLAY_NOTHING = { kind: "nothing" } as const satisfies Display;

  let display = $state<Display>(initialDisplay());
  let mikeText = $state(initialMikeText());

  $effect(() => {
    if (!(display !== undefined && display.kind === "mike-data")) {
      return;
    }
    localStorage.setItem(MIKE_DATA_KEY, serializeMikeData(display.mikeData));
  });

  function initialMikeText(): string {
    if (!browser) {
      return "";
    }
    const texts = ["猫の手も借りたいのかにゃ", "手伝ってほしいのかにゃ"];
    if (localStorage.getItem(MIKE_DATA_KEY) !== null) {
      texts.push("世話の焼ける人間だにゃ");
    }
    return randomElement(texts);
  }

  function initialDisplay(): Display {
    if (!browser) {
      return DISPLAY_NOTHING;
    }
    const item = localStorage.getItem(MIKE_DATA_KEY);
    if (item === null) {
      return DISPLAY_NOTHING;
    }
    const mikeData = deserializeMikeData(item);
    if (mikeData === undefined) {
      return DISPLAY_NOTHING;
    }
    return { kind: "mike-data", mikeData };
  }

  async function handleFileLoad(names: Names, instructors: Instructor[]) {
    display = {
      kind: "mike-data",
      mikeData: {
        filename: names.filename,
        sheetName: names.sheetName,
        title: "",
        wage: 0,
        entries: instructorsToEntries(instructors),
      },
    };

    mikeText = "";
    setTimeout(() => {
      mikeText = randomElement(["世話の焼ける人間だにゃ"]);
    }, 500);
  }

  function handleFileError(e: FileError) {
    switch (e.kind) {
      case "cannot-read-file":
        display = { kind: "error", error: ["入力ファイルを読み込めません"] };
        break;
      case "cannot-load-as-xlsx":
        display = {
          kind: "error",
          error: ["入力ファイルをExcelファイルとして読み込めません"],
        };
        break;
      case "workbook-error":
        display = { kind: "error", error: parseWorkbookErrorToChunks(e.error) };
        break;
      case "sheet-errors":
        display = {
          kind: "sheet-errors",
          sheetName: e.sheetName,
          errors: e.errors.map((e) => parseSheetErrorToChunks(e)),
        };
        break;
      default:
        unreachable(e);
    }

    mikeText = "";
    setTimeout(() => {
      mikeText = randomElement(["しっかりするにゃ", "ファイルが変だにゃ"]);
    }, 500);
  }

  function handleFileReset() {
    display = DISPLAY_NOTHING;
    mikeText = "";
    localStorage.removeItem(MIKE_DATA_KEY);
    setTimeout(() => {
      mikeText = "ファイルを変えるのかにゃ";
    }, 500);
  }

  function handleBreakdown() {
    const a = document.createElement("a");
    a.href = "./breakdown";
    a.target = "_blank";
    a.click();
    a.remove();
  }
</script>

{#snippet errorText(chunks: ErrorTextChunk[])}
  {#each chunks as chunk}
    {#if typeof chunk === "string"}
      {chunk}
    {:else if chunk.length === 1}
      <code>{chunk[0]}</code>
    {:else if chunk.length === 2}
      <a href={chunk[1]} target="_blank">{chunk[0]}</a>
    {/if}
  {/each}
{/snippet}

<MikeDialog text={mikeText} />

<FileInput
  id="file-input"
  names={display.kind === "mike-data"
    ? {
        filename: display.mikeData.filename,
        sheetName: display.mikeData.sheetName,
      }
    : undefined}
  onLoad={handleFileLoad}
  onError={handleFileError}
  onReset={handleFileReset}
/>

{#if display.kind === "error"}
  <div class="error">
    <span>以下のエラーが発生しました：</span>
    <ul>
      <li>{@render errorText(display.error)}</li>
    </ul>
  </div>
{:else if display.kind === "sheet-errors"}
  <div class="error">
    <span>
      シート
      <code>{display.sheetName}</code>
      内で以下のエラーが発生しました：
    </span>
    <ul>
      {#each display.errors as e (e)}
        <li>{@render errorText(e)}</li>
      {/each}
    </ul>
  </div>
{/if}

{#if display.kind === "mike-data"}
  <div style="height: 4em;"></div>
  <Editor bind:data={display.mikeData} onBreakdown={handleBreakdown} />
{/if}

<style lang="scss">
  div.error {
    margin-top: 1em;
    padding: 1em 1.5em;
    border-radius: 1em;
    background-color: #fee;
    border: 1px solid #fcc;

    & > span {
      font-weight: bold;
    }
  }

  code {
    padding: 0.15em 0.3em;
    margin: 0 0.2em;
    background-color: #0001;
    border: 1px solid #0002;
    border-radius: 0.3em;
  }
</style>
