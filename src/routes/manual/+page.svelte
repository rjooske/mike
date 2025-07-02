<script lang="ts">
  import "$lib/common.scss";
  import "$lib/paw-print-trail.scss";
  import Dialog from "./Dialog.svelte";
</script>

<svelte:head>
  <title>ミケ - 説明書</title>
</svelte:head>

<h1>ミケ - 説明書</h1>

<h2>使い方</h2>

<p>ミケを使った作業は、大まかに</p>
<ol>
  <li>任用計画書ファイルを選択する</li>
  <li>それぞれの講師と内訳書に関するデータを入力する</li>
  <li>内訳表を作成する</li>
</ol>
<p>という手順になります。</p>

<h3>詳細な手順</h3>

<p>
  まず任用計画書ファイルを選択しミケに読み込ませます。
  ファイルの読み込みに成功した場合は、任用計画書に含まれる講師の一覧と、それぞれの講師と内訳書に関するデータ入力欄が表示されます。
  読み込み時にエラーが発生した場合は、表示されるエラーメッセージを元にファイルの問題を修正してください。
  エラーメッセージの説明や関連情報は
  <a href="#errors">エラー一覧</a>
  を参照してください。
</p>
<p>
  次に、各講師に対してデータを入力します。
  講師に対して報酬を支払済みである場合は、支払い状態の「支払い済み」を選択します。
  続いて表示される執行額の入力欄に執行額を入力して、報酬を支払い済みの講師に対するデータ入力は完了です。
  講師に対して報酬を未支払いである場合は、支払い状態の「未支払い」を選択します。
  続いて、データ入力欄の左側にある経路検索リンクを用いて、講師の出発地が近郊地域に該当するかを確認します。
  講師が近郊地域に該当しない場合は、地域として「その他」を選択して完了です。
  講師が近郊地域に該当する場合は、最寄り駅や目的地など、表示されている残りの欄にデータを入力してください。
</p>
<p>
  最後に、内訳表のタイトルと、近郊地域に該当する講師共通の日当額を入力して、内訳表を作成します。
  作成された内訳表はブラウザの印刷機能を用いてPDFファイルに出力します。
  印刷画面のプリンターを選択する欄にて「PDFとして保存」を選択することで、ブラウザからPDFを出力することができます。
  （※ブラウザにより手順が異なる場合があります）
</p>

<h2>任用計画書ファイル</h2>

任用計画書ファイルをミケに読み込ませるためには、ファイルが以下で説明する様式に従っている必要があります。
{@render mikeDialog("ちゃんと説明する通りにするにゃ")}
{@render fujiweDialog("ミケちゃんはたのもしいねぇ")}

<h3>任用表</h3>

<p>
  任用計画書に含まれる非常勤講師一覧の表を、以降は任用表と呼びます。
  任用表は1人の講師につき6行からなる表です。
  任用表が従うべき様式は、それぞれの講師に対応するセルの位置や記入すべきデータ、セルの結合状態などからなります。
  以下で説明する様式に従って任用表を作成してください。
</p>
<figure>
  <img src="manual/table_example.png" alt="任用表の例" style="--width: 50em" />
  <figcaption>任用表の例</figcaption>
</figure>

<h3>mike_startセル・mike_endセル</h3>

<p>
  mike_startセルとmike_endセルは、任用表の最初の行及び最後の行を指定するためのセルです。
  セル内に文字列
  <code>mike_start</code>
  のみを含むセルはmike_startセルとして認識され、セル内に文字列
  <code>mike_end</code>
  のみを含むセルはmike_endセルとして認識されます。
</p>
<p>
  任用計画書ファイル内のシートのうち、mike_startセルとmike_endセルが存在するシートがミケに認識されます。
  任用表の最初の行のすぐ左にあるセルにmike_startセル、最後の行のすぐ左にあるセルにmike_endセルを作成してください。
  mike_startセルは表のヘッダーが始まる行ではなく、表のデータ内容が始まる行に作成することに注意してください。
  加えて、ミケに認識させるためのシートは任用計画書ファイル内に1つだけである必要があります。
</p>
<figure>
  <img
    src="manual/mike_start_mike_end_example.png"
    alt="mike_startセルとmike_endセルの使用例"
    style="--width: 40em"
  />
  <figcaption>mike_startセルとmike_endセルの使用例</figcaption>
</figure>
<p class="info">
  「mike_start・mike_endセルが存在する列からN列右にある列」を、以降はmike+N列と呼びます。
  上の表から例を挙げると、「No」の列はmike+1列、「現職名」の列はmike+4列となります。
</p>

<h3 id="name-col">氏名列</h3>

<p>
  氏名列は講師の氏名、ふりがな、任用年度末年齢を記入する列です。
  氏名列はmike+3列に存在する必要があります。 それぞれの講師の氏名列に、
</p>
<ol>
  <li>ふりがな</li>
  <li>氏名</li>
  <li>任用年度末年齢</li>
</ol>
<p>
  をこの順で入力してください。
  また、それぞれの講師の氏名列には結合されているセルが存在してはいけません。
</p>
<figure>
  <img
    src="manual/name_col_example.png"
    alt="氏名列の例"
    style="--width: 10em"
  />
  <figcaption>氏名列の例</figcaption>
</figure>

<h3 id="job-name-col">現職名列</h3>

<p>
  現職名列は講師の現職名を記入する列です。
  現職名列はmike+4列に存在する必要があります。
  また、それぞれの講師の現職名列にあるセルは全て結合する必要があります。
</p>
<figure>
  <img
    src="manual/job_name_col_example.png"
    alt="現職名列の例"
    style="--width: 15em"
  />
  <figcaption>現職名列の例</figcaption>
</figure>

<h3 id="course-col">担当科目列</h3>

<p>
  担当科目列は講師の担当科目名と科目番号を記入する列です。
  担当科目列はmike+5列に存在する必要があります。 それぞれの講師の担当科目列に、
</p>
<ol>
  <li>担当科目番号</li>
  <li>担当科目名</li>
</ol>
<p>
  をこの順で入力してください。
  また、それぞれの講師の担当科目列には結合されているセルが存在してはいけません。
</p>
<figure>
  <img
    src="manual/course_col_example.png"
    alt="担当科目列の例"
    style="--width: 15em"
  />
  <figcaption>担当科目列の例</figcaption>
</figure>

<h3 id="total-duration-col">総時間数列</h3>

<p>
  総時間数列は講師の任用の総時間数を記入する列です。
  総時間数列はmike+9列に存在する必要があります。
  また、それぞれの講師の総時間数列にあるセルは全て結合する必要があります。
</p>
<figure>
  <img
    src="manual/total_duration_col_example.png"
    alt="総時間数列の例"
    style="--width: 6em"
  />
  <figcaption>総時間数列の例</figcaption>
</figure>

<h3 id="course-term-col">実施学期列</h3>

<p>
  実施学期列は講師の担当科目の実施学期を記入する列です。
  実施学期列はmike+11列に存在する必要があります。
  また、それぞれの講師の実施学期列にあるセルは全て結合する必要があります。
</p>
<figure>
  <img
    src="manual/course_term_col_example.png"
    alt="実施学期列の例"
    style="--width: 6em"
  />
  <figcaption>実施学期列の例</figcaption>
</figure>

<h3>詳細列</h3>

<p>
  詳細列は講師の詳細な情報を記入する列です。
  詳細列はmike+16列に存在する必要があります。
  それぞれの講師の詳細列にあるセルのうち、上から3番目にあるセルに勤務先住所、上から4番目にあるセルに自宅住所を記入してください。
  詳細列にあるこれら以外のセルのうち、結合されているセルが存在してはいけません。
</p>
<figure>
  <img
    src="manual/detail_col_example.png"
    alt="詳細列の例"
    style="--width: 35em"
  />
  <figcaption>詳細列の例</figcaption>
</figure>

<h2 id="errors">エラー一覧</h2>

<h3 id="error-cannot-read-file">入力ファイルが読み込めない</h3>
<p>
  ブラウザが入力ファイルの読み込みに失敗しました。
  他のプログラムで同じファイルを開くことができるか、選択したファイルが削除されていないか、ファイルを開く権限があるかなどを確認してください。
</p>

<h3 id="error-cannot-load-as-xlsx">
  入力ファイルがExcelファイルとして読み込めない
</h3>
<p>
  入力ファイルをExcelファイルとして読み込むことができません。
  正しくExcelファイル（.xlsx）を選択しているか確認してください。
</p>

<h3 id="error-mike-sheet-not-found">ミケが読み取るべきシートが存在しない</h3>
<p>
  選択された任用計画書ファイルのどのシートにもmike_startセルが存在しません。
  mike_startセル及びmike_endセルを作成してください。
</p>

<h3 id="error-multiple-mike-start">ミケが読み取るべきシートが複数存在する</h3>
<p>
  選択された任用計画書ファイルのシートのうち複数のシートにmike_startセルが含まれています。
  mike_startセルを含むシートがファイル内に1つだけになるようにしてください。
</p>

<h3 id="error-mike-end-not-found">mike_endセルが存在しない</h3>
<p>
  mike_startセルを含むシート中にmike_endセルが存在しません。
  mike_startセル及びmike_endセルを作成してください。
</p>

<h3 id="error-mike-end-in-wrong-position">
  mike_startセルとmike_endセルが異なる列に存在する
</h3>
<p>
  mike_startセルとmike_endセルが異なる列に存在します。
  mike_startセルとmike_endセルを同じ列に作成してください。
</p>

<h3 id="error-mike-end-misaligned">
  mike_endセルの行が表の最終行と異なる可能性がある
</h3>
<p>
  mike_startセルとmike_endセルで指定される表の行数が6の倍数になっていません。
  次の原因が考えられます：
</p>
<ul>
  <li>mike_startセルの行がずれている</li>
  <li>mike_endセルの行がずれている</li>
  <li>いずれかの講師に6行未満もしくは6行より多く行が割り当てられている</li>
</ul>
{@render yoshiharuDialog("なんで6の倍数になるんじゃ")}
{@render mikeDialog(
  "講師みんなに6行割り当てられてると、表の合計の行数は6の倍数になるにゃ",
)}
{@render yoshiharuDialog("なるほどなぁ")}

<h3 id="error-bad-name-cell">氏名列のデータが多い・少ない</h3>
<p>
  氏名列に3個未満もしくは3個より多くデータが含まれています。
  <a href="#name-col">氏名列の説明</a>
  を参考にデータを修正してください。
</p>

<h3 id="error-unmerged-job-name-cell">
  現職名列に結合されていないセルが存在する
</h3>
<p>
  現職名列に結合されていないセルが存在します。
  現職名列のセルはそれぞれの講師に関して全て結合してください。
</p>

<h3 id="error-bad-course-cell">担当科目列のデータが多い・少ない</h3>
<p>
  担当科目列に2個未満もしくは2個より多くデータが含まれています。
  <a href="#course-col">担当科目列の説明</a>
  を参考にデータを修正してください。
</p>

<h3 id="error-unmerged-total-duration-cell">
  総時間数列に結合されていないセルが存在する
</h3>
<p>
  総時間数列に結合されていないセルが存在します。
  総時間数列のセルはそれぞれの講師に関して全て結合してください。
</p>

<h3 id="error-unparsable-total-duration">総時間数列のデータが数字ではない</h3>
<p>
  総時間数列に入力されているデータが数字として読み取れません。
  誤って余分な文字などが含まれていないか確認してください。
</p>

<h3 id="error-unmerged-course-term-cell">
  実施学期列に結合されていないセルが存在する
</h3>
<p>
  実施学期列に結合されていないセルが存在します。
  実施学期列のセルはそれぞれの講師に関して全て結合してください。
</p>

{#snippet mikeDialog(s: string)}
  <Dialog imageSrc="pfp/mike.png" name="ミケ">{s}</Dialog>
{/snippet}

{#snippet fujiweDialog(s: string)}
  <Dialog imageSrc="pfp/fujiwe.png" name="フジヱ">{s}</Dialog>
{/snippet}

{#snippet yoshiharuDialog(s: string)}
  <Dialog imageSrc="pfp/yoshiharu.png" name="よしはる">{s}</Dialog>
{/snippet}

<style>
  h3 {
    margin-top: 2em;
  }

  figure {
    margin: 2em 0;

    & > img {
      display: block;
      width: min(100%, var(--width, 100%));
      margin: 0 auto;
    }

    & > figcaption {
      margin-bottom: 1em;
      text-align: center;
      color: #444;
    }
  }

  p.info {
    padding: 1em;
    background-color: #e9f8ff;
    border: 1px solid #d1e5ff;
    border-radius: 1em;

    &::before {
      content: "ℹ️ ";
      font-size: 1.5em;
    }
  }
</style>
