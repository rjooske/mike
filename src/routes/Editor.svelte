<script lang="ts">
  import { type MikeData } from "$lib/mike";
  import { parseNumber } from "$lib/util";

  let {
    data = $bindable(),
    onBreakdown,
  }: { data: MikeData; onBreakdown: () => void } = $props();
</script>

<label for="input-title">内訳表タイトル:</label>
<input
  id="input-title"
  type="text"
  bind:value={data.title}
  style="width: 30em;"
/>
<br />

<label for="input-wage">日当額:</label>
<input
  id="input-wage"
  type="number"
  value={data.wage}
  onchange={(e) => {
    const wage = parseNumber(e.currentTarget.value);
    if (wage !== undefined) {
      data.wage = wage;
    }
  }}
/>
<br />

<button onclick={onBreakdown}>内訳表を作成</button>
<br />

<table class="outermost">
  <thead>
    <tr>
      <th>講師</th>
      <th>経路</th>
      <th>データ入力</th>
    </tr>
  </thead>
  <tbody>
    {#each data.entries as entry, i}
      {@const paidId = `paid-${i}`}
      {@const paidAmountId = `paid-amount-${i}`}
      {@const areaId = `area-${i}`}
      {@const nearestStationId = `nearest-station-${i}`}
      {@const destinationId = `destination-${i}`}
      {@const countId = `count-${i}`}
      {@const dayCountId = `day-count-${i}`}
      {@const accomodationFeeId = `accomodation-charge-${i}`}
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
                <th>現職名</th>
                <td>{entry.instructor.jobName}</td>
              </tr>
              <tr>
                <th>勤務先住所</th>
                <td>{entry.instructor.officeAddress}</td>
              </tr>
              <tr>
                <th>担当授業</th>
                <td>
                  {entry.instructor.courseId}
                  {entry.instructor.courseName}
                </td>
              </tr>
              <tr>
                <th>実施学期</th>
                <td>{entry.instructor.courseTerm}</td>
              </tr>
              <tr>
                <th>総時間数</th>
                <td>{entry.instructor.totalDuration}時間</td>
              </tr>
            </tbody>
          </table>
        </td>
        <td class="links">
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
        <td class="input-container">
          <table class="input">
            <tbody>
              <tr>
                <th><label for={paidId}>支払い状態</label></th>
                <td>
                  <select id={paidId} bind:value={entry.externalInfo.paid}>
                    <option value={false}>未支払い</option>
                    <option value={true}>支払い済み</option>
                  </select>
                </td>
              </tr>
              {#if entry.externalInfo.paid}
                <tr>
                  <th><label for={paidAmountId}>執行額</label></th>
                  <td>
                    <input
                      id={paidAmountId}
                      type="number"
                      value={entry.externalInfo.paidAmount}
                      onchange={(e) => {
                        const x = parseNumber(e.currentTarget.value);
                        if (x !== undefined) {
                          entry.externalInfo.paidAmount = x;
                        }
                      }}
                      style="width: 8em;"
                    />
                    円
                  </td>
                </tr>
              {:else}
                <tr>
                  <th><label for={areaId}>地域</label></th>
                  <td>
                    <select id={areaId} bind:value={entry.externalInfo.near}>
                      <option value={true}>近郊</option>
                      <option value={false}>その他</option>
                    </select>
                  </td>
                </tr>
                {#if entry.externalInfo.near}
                  <tr>
                    <th><label for={nearestStationId}>最寄り駅</label></th>
                    <td>
                      <input
                        id={nearestStationId}
                        type="text"
                        bind:value={entry.externalInfo.nearestStation}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th><label for={destinationId}>目的地</label></th>
                    <td>
                      <select
                        id={destinationId}
                        bind:value={entry.externalInfo.destination}
                      >
                        <option value="tsukuba-station">つくば駅</option>
                        <option value="daisan-area-mae">第三エリア前</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <th><label for={countId}>回数</label></th>
                    <td>
                      <input
                        id={countId}
                        type="number"
                        value={entry.externalInfo.count}
                        onchange={(e) => {
                          const x = parseNumber(e.currentTarget.value);
                          if (x && entry.externalInfo !== undefined) {
                            entry.externalInfo.count = x;
                          }
                        }}
                        style="width: 5em;"
                      />
                      回
                    </td>
                  </tr>
                  <tr>
                    <th><label for={dayCountId}>日数等</label></th>
                    <td>
                      <input
                        id={dayCountId}
                        type="number"
                        value={entry.externalInfo.dayCount}
                        onchange={(e) => {
                          const x = parseNumber(e.currentTarget.value);
                          if (x && entry.externalInfo !== undefined) {
                            entry.externalInfo.dayCount = x;
                          }
                        }}
                        style="width: 5em;"
                      />
                      日
                    </td>
                  </tr>
                  <tr>
                    <th><label for={accomodationFeeId}>宿泊料</label></th>
                    <td>
                      <input
                        id={accomodationFeeId}
                        type="number"
                        value={entry.externalInfo.accomodationFee}
                        onchange={(e) => {
                          const x = parseNumber(e.currentTarget.value);
                          if (x && entry.externalInfo !== undefined) {
                            entry.externalInfo.accomodationFee = x;
                          }
                        }}
                        style="width: 8em;"
                      />
                      円
                    </td>
                  </tr>
                {/if}
              {/if}
            </tbody>
          </table>
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style lang="scss">
  table.outermost {
    margin-top: 2em;
    width: 100%;
    border-collapse: collapse;

    &,
    & > thead > tr > th,
    & > tbody > tr > td {
      border: 1px solid black;
    }

    & > thead > tr > th {
      padding: 0.2em 0.4em;
    }

    & > tbody > tr > td {
      padding: 0.5em 0.8em;
    }

    & td.links > a {
      text-wrap: nowrap;
      line-height: 2em;
    }
  }

  table.instructor,
  table.input {
    & > tbody > tr > th {
      padding-right: 1em;
      text-align: right;
      vertical-align: top;
      text-wrap: nowrap;
    }
  }

  table.input > tbody > tr {
    & > th,
    & > td {
      text-wrap: nowrap;
    }
  }

  .input-container {
    vertical-align: top;
  }
</style>
