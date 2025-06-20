<script lang="ts">
  import { browser } from "$app/environment";
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
  import FileInput from "./FileInput.svelte";
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

  let mikeData = $state<MikeData | undefined>(initialMikeData());
  let mikeText = $state(
    browser
      ? randomElement(["猫の手も借りたいのかにゃ", "手伝ってほしいのかにゃ"])
      : "",
  );

  $effect(() => {
    if (mikeData === undefined) {
      return;
    }
    localStorage.setItem(MIKE_DATA_KEY, serializeMikeData(mikeData));
  });

  function initialMikeData(): MikeData | undefined {
    if (!browser) {
      return undefined;
    }
    const item = localStorage.getItem(MIKE_DATA_KEY);
    if (item === null) {
      return undefined;
    }
    return deserializeMikeData(item);
  }

  async function handleFileLoad(filename: string, is: Instructor[]) {
    mikeData = {
      filename,
      title: "", // TODO
      wage: 0, // TODO
      entries: instructorsToEntries(is),
    };

    mikeText = "";
    setTimeout(() => {
      mikeText = randomElement(["世話の焼ける人間だにゃ"]);
    }, 500);
  }

  function handleFileError() {
    mikeText = "";
    setTimeout(() => {
      mikeText = randomElement(["しっかりするにゃ"]);
    }, 500);
  }

  function handleFileReset() {
    mikeData = undefined;
    mikeText = "";
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

<MikeDialog text={mikeText} />

<div style="margin-bottom: 3em;">
  <FileInput
    id="file-input"
    filename={mikeData?.filename}
    onLoad={handleFileLoad}
    onError={handleFileError}
    onReset={handleFileReset}
  />
</div>

{#if mikeData !== undefined}
  <Editor bind:data={mikeData} onBreakdown={handleBreakdown} />
{/if}
