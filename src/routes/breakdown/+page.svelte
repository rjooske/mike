<script lang="ts">
  import { browser } from "$app/environment";
  import {
    deserializeMikeData,
    displayDestination,
    MIKE_DATA_KEY,
    type MikeData,
  } from "$lib/mike";

  function compareStrings(a: string, b: string): number {
    const aChars = Array.from(a);
    const bChars = Array.from(b);
    for (let i = 0; i < Math.min(aChars.length, bChars.length); i++) {
      const ac = aChars[i].codePointAt(0) ?? 0;
      const bc = bChars[i].codePointAt(0) ?? 0;
      if (ac !== bc) {
        return ac - bc;
      }
    }
    return aChars.length - bChars.length;
  }

  type CommonEntry = {
    instructorName: string;
    instructorNamePronunciation: string;
    courseId: string;
    courseName: string;
    courseTerm: string;
    jobName: string;
    officeAddress: string;
    homeAddress: string;
    totalDuration: number;
  };

  type NearEntry = CommonEntry & {
    count: number;
    dayCount: number;
    departFrom: string;
    arriveAt: string;
    wage: number;
    accomodationFee: number;
  };
  type PaidEntry = CommonEntry & { paidAmount: number };

  function createBreakdown(d: MikeData) {
    const nearEntries: NearEntry[] = [];
    const paidEntries: PaidEntry[] = [];

    for (const e of d.entries) {
      if (e.externalInfo.paid) {
        paidEntries.push({
          instructorName: e.instructor.name,
          instructorNamePronunciation: e.instructor.namePronunciation,
          courseId: e.instructor.courseId,
          courseName: e.instructor.courseName,
          courseTerm: e.instructor.courseTerm,
          jobName: e.instructor.jobName,
          officeAddress: e.instructor.officeAddress,
          homeAddress: e.instructor.homeAddress,
          totalDuration: e.instructor.totalDuration,
          paidAmount: e.externalInfo.paidAmount,
        });
      } else if (e.externalInfo.near) {
        nearEntries.push({
          instructorName: e.instructor.name,
          instructorNamePronunciation: e.instructor.namePronunciation,
          courseId: e.instructor.courseId,
          courseName: e.instructor.courseName,
          courseTerm: e.instructor.courseTerm,
          count: e.externalInfo.count,
          dayCount: e.externalInfo.dayCount,
          departFrom: e.externalInfo.nearestStation,
          arriveAt: displayDestination(e.externalInfo.destination),
          wage: d.wage,
          accomodationFee: e.externalInfo.accomodationFee,
          jobName: e.instructor.jobName,
          officeAddress: e.instructor.officeAddress,
          homeAddress: e.instructor.homeAddress,
          totalDuration: e.instructor.totalDuration,
        });
      }
    }

    paidEntries.sort((a, b) => compareStrings(a.courseTerm, b.courseTerm));
    nearEntries.sort((a, b) => compareStrings(a.courseTerm, b.courseTerm));

    let paidAmountTotal = 0;
    for (const e of paidEntries) {
      paidAmountTotal += e.paidAmount;
    }

    let grandTotal = 0;
    for (const e of nearEntries) {
      grandTotal += e.wage + e.accomodationFee;
    }

    return { nearEntries, paidEntries, paidAmountTotal, grandTotal };
  }

  function loadMikeData(): MikeData | undefined {
    if (!browser) {
      return undefined;
    }
    const item = localStorage.getItem(MIKE_DATA_KEY);
    if (item === null) {
      return undefined;
    }
    return deserializeMikeData(item);
  }

  const mikeData = loadMikeData() ?? {
    filename: "",
    sheetName: "",
    title: "",
    wage: 0,
    entries: [],
  };
  const breakdown = createBreakdown(mikeData);
</script>

<svelte:head>
  <title>{mikeData.title}</title>
</svelte:head>

<h1>{mikeData.title}</h1>
<div class="department">情報科学類</div>

<h2 class="table-title">近郊地域に該当する講師</h2>
{#if breakdown.nearEntries.length > 0}
  <table class="outermost">
    <thead>
      <tr>
        <th colspan="2">講師</th>
        <th>金額</th>
      </tr>
    </thead>
    <tbody>
      {#each breakdown.nearEntries as e}
        <tr class="merge-col-1-2">
          <td>
            <table class="inner">
              <tbody>
                <tr>
                  <th>氏名</th>
                  <td>
                    <ruby>
                      {e.instructorName}
                      <rt>{e.instructorNamePronunciation}</rt>
                    </ruby>
                  </td>
                </tr>
                <tr>
                  <th>自宅住所</th>
                  <td>{e.homeAddress}</td>
                </tr>
                <tr>
                  <th>現職名</th>
                  <td>{e.jobName}</td>
                </tr>
                <tr>
                  <th>勤務先住所</th>
                  <td>{e.officeAddress}</td>
                </tr>
                <tr>
                  <th>担当授業</th>
                  <td>
                    {e.courseId}
                    {e.courseName}
                  </td>
                </tr>
                <tr>
                  <th>実施学期</th>
                  <td>{e.courseTerm}</td>
                </tr>
              </tbody>
            </table>
          </td>
          <td>
            <table class="inner">
              <tbody>
                <tr>
                  <th>回数</th>
                  <td class="nowrap">{e.count}回</td>
                </tr>
                <tr>
                  <th>日数等</th>
                  <td class="nowrap">{e.dayCount}日</td>
                </tr>
                <tr>
                  <th>総時間数</th>
                  <td class="nowrap">{e.totalDuration}時間</td>
                </tr>
                <tr>
                  <th>出発地</th>
                  <td>{e.departFrom}</td>
                </tr>
                <tr>
                  <th>到着地</th>
                  <td class="nowrap">{e.arriveAt}</td>
                </tr>
              </tbody>
            </table>
          </td>
          <td>
            <table class="inner">
              <tbody>
                <tr>
                  <th>日当</th>
                  <td class="nowrap">{e.wage}円</td>
                </tr>
                <tr>
                  <th>宿泊料</th>
                  <td class="nowrap">{e.accomodationFee}円</td>
                </tr>
                <tr>
                  <th>合計</th>
                  <td class="nowrap">{e.wage + e.accomodationFee}円</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{:else}
  <p class="na">（該当なし）</p>
{/if}
<div class="total">
  <span>合計</span>
  <span>{breakdown.grandTotal}円</span>
</div>

<h2 class="table-title">支払い済みの講師</h2>
{#if breakdown.paidEntries.length > 0}
  <table class="outermost">
    <thead>
      <tr>
        <th>講師</th>
        <th>金額</th>
      </tr>
    </thead>
    <tbody>
      {#each breakdown.paidEntries as e}
        <tr>
          <td>
            <table class="inner">
              <tbody>
                <tr>
                  <th>氏名</th>
                  <td>
                    <ruby>
                      {e.instructorName}
                      <rt>{e.instructorNamePronunciation}</rt>
                    </ruby>
                  </td>
                </tr>
                <tr>
                  <th>自宅住所</th>
                  <td>{e.homeAddress}</td>
                </tr>
                <tr>
                  <th>現職名</th>
                  <td>{e.jobName}</td>
                </tr>
                <tr>
                  <th>勤務先住所</th>
                  <td>{e.officeAddress}</td>
                </tr>
                <tr>
                  <th>担当授業</th>
                  <td>
                    {e.courseId}
                    {e.courseName}
                  </td>
                </tr>
                <tr>
                  <th>実施学期</th>
                  <td>{e.courseTerm}</td>
                </tr>
              </tbody>
            </table>
          </td>
          <td>
            <table class="inner">
              <tbody>
                <tr>
                  <th>執行額</th>
                  <td class="nowrap">{e.paidAmount}円</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{:else}
  <p class="na">（該当なし）</p>
{/if}
<div class="total">
  <span>合計執行額</span>
  <span>{breakdown.paidAmountTotal}円</span>
</div>

<style lang="scss">
  :global {
    body {
      margin: 2em auto;
      max-width: min(60em, 95vw);
      font-size: 10pt;
    }

    @media print {
      body {
        margin: 0 auto;
      }
    }
  }

  h1 {
    margin: 0 auto;
    width: fit-content;
    font-size: 16pt;
  }

  div.department {
    text-align: right;
    font-size: 12pt;
  }

  h2.table-title {
    margin-top: 2em;
    font-size: 14pt;
  }

  th {
    text-wrap: nowrap;
    vertical-align: top;
  }

  td.nowrap {
    text-wrap: nowrap;
  }

  table.outermost {
    width: 100%;
    border-collapse: collapse;

    &,
    & > thead > tr > th,
    & > tbody > tr > td {
      border: 1px solid black;
    }

    & > tbody > tr.merge-col-1-2 {
      & > td:first-child {
        border-right: none;
      }
      & > td:nth-child(2) {
        border-left: none;
      }
    }

    & > thead > tr > th {
      padding: 0.2em 0.4em;
    }

    & > tbody > tr > td {
      padding: 0.5em 0.8em;
    }
  }

  table.inner {
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

  div.total {
    width: fit-content;
    margin-top: 1em;
    margin-left: auto;
    padding: 0 2em;
    font-size: 12pt;
    border-bottom: 1px solid black;

    & > span:first-child {
      font-weight: bold;
      margin-right: 1em;
    }
  }

  p.na {
    text-align: center;
  }
</style>
