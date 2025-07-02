<script lang="ts">
  import { browser } from "$app/environment";
  import "$lib/common.scss";
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
  import "$lib/paw-print-trail.scss";
  import { unreachable, assert } from "$lib/util";
  import Editor from "./Editor.svelte";
  import FileInput, { type FileError, type Names } from "./FileInput.svelte";
  import MikeDialog from "./MikeDialog.svelte";

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
  type FormattedError = { chunks: ErrorTextChunk[]; link: string };

  function formatParseWorkbookError(e: ParseWorkbookError): FormattedError {
    switch (e.kind) {
      case "mike-sheet-not-found":
        return {
          chunks: [`ミケが読み取るべきシートが存在しません`],
          link: "manual#error-mike-sheet-not-found",
        };
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
        return { chunks, link: "manual#error-multiple-mike-start" };
      }
      default:
        unreachable(e);
    }
  }

  function formatParseSheetError(e: ParseSheetError): FormattedError {
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
        return {
          chunks: [`mike_endセルが存在しません`],
          link: "manual#error-mike-end-not-found",
        };
      case "mike-end-in-wrong-position":
        return {
          chunks: [
            `mike_startセル（${position(e.mikeStart)}）と`,
            `mike_endセル（${position(e.mikeEnd)}）が異なる列に存在します`,
          ],
          link: "manual#error-mike-end-in-wrong-position",
        };
      case "mike-end-misaligned":
        return {
          chunks: [
            `mike_endセル（${colRow(e.mikeCol, e.mikeEndRow)}）の行が表の最終行と異なる可能性があります`,
          ],
          link: "manual#error-mike-end-misaligned",
        };
      case "bad-name-cell":
        return {
          chunks: [
            [`氏名列`, "manual#name-col"],
            `にデータが`,
            count(3, e.entryCount),
            range(e),
          ],
          link: "manual#error-bad-name-cell",
        };
      case "unmerged-job-name-cell":
        return {
          chunks: [
            [`現職名列`, "manual#job-name-col"],
            `に結合されていないセルが存在します`,
            range(e),
          ],
          link: "manual#error-unmerged-job-name-cell",
        };
      case "bad-course-cell":
        return {
          chunks: [
            [`担当科目列`, "manual#course-col"],
            `にデータが`,
            count(2, e.entryCount),
            range(e),
          ],
          link: "manual#error-bad-course-cell",
        };
      case "unmerged-total-duration-cell":
        return {
          chunks: [
            [`総時間数列`, "manual#total-duration-col"],
            `に結合されていないセルが存在します`,
            range(e),
          ],
          link: "manual#error-unmerged-total-duration-cell",
        };
      case "unparsable-total-duration":
        return {
          chunks: [
            [`総時間数列`, "manual#total-duration-col"],
            `のデータ`,
            [e.text],
            `は数字ではありません`,
            range(e),
          ],
          link: "manual#error-unparsable-total-duration",
        };
      case "unmerged-course-term-cell":
        return {
          chunks: [
            [`実施学期列`, "manual#course-term-col"],
            `に結合されていないセルが存在します`,
            range(e),
          ],
          link: "manual#error-unmerged-course-term-cell",
        };
      default:
        unreachable(e);
    }
  }

  type Display =
    | { kind: "nothing" }
    | { kind: "mike-data"; mikeData: MikeData }
    | { kind: "error"; error: FormattedError }
    | { kind: "sheet-errors"; sheetName: string; errors: FormattedError[] };
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
        display = {
          kind: "error",
          error: {
            chunks: ["入力ファイルを読み込めません"],
            link: "manual#error-cannot-read-file",
          },
        };
        break;
      case "cannot-load-as-xlsx":
        display = {
          kind: "error",
          error: {
            chunks: ["入力ファイルをExcelファイルとして読み込めません"],
            link: "manual#error-cannot-load-as-xlsx",
          },
        };
        break;
      case "workbook-error":
        display = { kind: "error", error: formatParseWorkbookError(e.error) };
        break;
      case "sheet-errors":
        display = {
          kind: "sheet-errors",
          sheetName: e.sheetName,
          errors: e.errors.map((e) => formatParseSheetError(e)),
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

{#snippet errorText(e: FormattedError)}
  {#each e.chunks as chunk}
    {#if typeof chunk === "string"}
      {chunk}
    {:else if chunk.length === 1}
      <code>{chunk[0]}</code>
    {:else if chunk.length === 2}
      <a href={chunk[1]} target="_blank">{chunk[0]}</a>
    {/if}
  {/each}
  <a class="error-detail" href={e.link} target="_blank">詳細</a>
{/snippet}

<nav>
  <a href="manual" target="_blank">説明書</a>
</nav>

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
  nav {
    margin-top: 2em;
  }

  div.error {
    margin-top: 1em;
    padding: 1em 1.5em;
    border-radius: 1em;
    background-color: #fee;
    border: 1px solid #fcc;

    & > span {
      font-weight: bold;
    }

    & a.error-detail {
      font-size: 0.8em;
    }
  }
</style>
