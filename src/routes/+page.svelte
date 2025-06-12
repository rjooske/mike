<script lang="ts">
  import { parse, type Instructor } from "$lib/input";
  import * as exceljs from "exceljs";

  const { Workbook } = exceljs;

  function assert(b: boolean): asserts b {
    if (!b) {
      throw new Error("assertion failed");
    }
  }

  function unreachable(_: never): never {
    throw new Error("should be unreachable");
  }

  const TSUKUBA_STATION_ID = "ChIJNy1V02IMImARvSkyNbzdhzQ";
  const DAISAN_AREA_MAE_ID = "ChIJ-3Acq_8LImARmQg8O3hNzsM";

  type Destination = "tsukuba-station" | "daisan-area-mae";

  type Route = {
    from: string;
    to: Destination | undefined;
  };

  type EntryUrls = {
    toTsukubaStation: string;
    toDaisanAreaMae: string;
  };

  type Entry = {
    instructor: Instructor;
    fromHome: EntryUrls;
    fromOffice: EntryUrls;
    route: Route | undefined;
  };

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

  function instructorsToRows(instructors: Instructor[]): Entry[] {
    return instructors.map((instructor) => ({
      instructor,
      fromHome: {
        toTsukubaStation: createGoogleMapsUrl(
          instructor.homeAddress,
          "tsukuba-station",
        ),
        toDaisanAreaMae: createGoogleMapsUrl(
          instructor.homeAddress,
          "daisan-area-mae",
        ),
      },
      fromOffice: {
        toTsukubaStation: createGoogleMapsUrl(
          instructor.officeAddress,
          "tsukuba-station",
        ),
        toDaisanAreaMae: createGoogleMapsUrl(
          instructor.officeAddress,
          "daisan-area-mae",
        ),
      },
      route: undefined,
    }));
  }

  let fileInput = $state<HTMLInputElement | undefined>();

  let entries = $state<Entry[] | undefined>();

  async function handleLoad() {
    if (fileInput === undefined) {
      return;
    }
    assert(fileInput.files !== null);
    const file = fileInput.files[0];
    if (file === undefined) {
      return;
    }

    const w = new Workbook();
    await w.xlsx.load(await file.arrayBuffer());
    const instructors = parse(w);

    entries = instructorsToRows(instructors);
  }

  function handleAreaSelectChange(entry: Entry, value: string) {
    switch (value) {
      case "":
      case "far":
        entry.route = undefined;
        break;
      case "near":
        entry.route = { from: "", to: undefined };
        break;
      default:
        throw new Error(`unknown area: ${value}`);
    }
  }

  function handleDestinationSelectChange(route: Route, value: string) {
    switch (value) {
      case "":
        route.to = undefined;
        break;
      case "tsukuba-station":
      case "daisan-area-mae":
        route.to = value;
        break;
      default:
        throw new Error(`unknown destination: "${value}"`);
    }
  }

  $inspect(entries);
</script>

<input type="file" bind:this={fileInput} />
<button class="load" onclick={handleLoad}>ファイルを読み込む</button>

{#if entries !== undefined}
  <table>
    <thead>
      <tr>
        <th>講師</th>
        <th>経路</th>
        <th>入力</th>
      </tr>
    </thead>
    <tbody>
      {#each entries as entry, i}
        <tr>
          <td>
            <table class="instructor">
              <tbody>
                <tr>
                  <th>氏名</th>
                  <td>
                    <ruby>
                      {entry.instructor.name}
                      <rt>{entry.instructor.namePronunciation}</rt>
                    </ruby>
                  </td>
                </tr>
                <tr>
                  <th>自宅住所</th>
                  <td>{entry.instructor.homeAddress}</td>
                </tr>
                <tr>
                  <th>勤務先住所</th>
                  <td>{entry.instructor.officeAddress}</td>
                </tr>
              </tbody>
            </table>
          </td>
          <td>
            <a href={entry.fromHome.toTsukubaStation} target="_blank">
              自宅→つくば駅
            </a>
            <br />
            <a href={entry.fromHome.toDaisanAreaMae} target="_blank">
              自宅→第三エリア前
            </a>
            <br />
            <a href={entry.fromOffice.toTsukubaStation} target="_blank">
              勤務先→つくば駅
            </a>
            <br />
            <a href={entry.fromOffice.toDaisanAreaMae} target="_blank">
              勤務先→第三エリア前
            </a>
          </td>
          <td>
            <table
              class="input"
              class:near-selected={entry.route !== undefined}
            >
              <tbody>
                <tr>
                  <th><label for={`area-${i}`}>地域</label></th>
                  <td>
                    <select
                      id={`area-${i}`}
                      onchange={(e) =>
                        handleAreaSelectChange(entry, e.currentTarget.value)}
                    >
                      <option value="">（未選択）</option>
                      <option value="near">近郊</option>
                      <option value="far">その他</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <th><label for={`nearest-station-${i}`}>最寄り駅</label></th>
                  <td>
                    <input
                      id={`nearest-station-${i}`}
                      type="text"
                      onchange={(e) => {
                        if (entry.route !== undefined) {
                          entry.route.from = e.currentTarget.value;
                        }
                      }}
                    />
                  </td>
                </tr>
                <tr>
                  <th><label for={`destination-${i}`}>目的地</label></th>
                  <td>
                    <select
                      id={`destination-${i}`}
                      onchange={(e) => {
                        assert(entry.route !== undefined);
                        handleDestinationSelectChange(
                          entry.route,
                          e.currentTarget.value,
                        );
                      }}
                    >
                      <option value="">（未選択）</option>
                      <option value="tsukuba-station">つくば駅</option>
                      <option value="daisan-area-mae">第三エリア前</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<style lang="scss">
  table,
  th,
  td {
    border: 1px solid black;
    border-collapse: collapse;
  }

  th {
    padding: 0.2em 0.4em;
  }

  td {
    padding: 0.5em 0.8em;
  }

  table.instructor,
  table.input {
    &,
    & th,
    & td {
      border: initial;
      border-collapse: initial;
    }

    & th,
    & td {
      padding: initial;
    }

    & th {
      text-align: right;
      padding-right: 1em;
    }
  }

  table.input:not(.near-selected) tr:not(:first-child) {
    visibility: hidden;
  }
</style>
