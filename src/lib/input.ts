import type { Instructor } from "./mike";
import { parseNumber } from "./util";
import type { Cell, Workbook, Worksheet } from "exceljs";

export type Position = {
  row: number;
  col: number;
};

/**
 * Returns the first element of `ts` if every element in `ts` is the same.
 * Returns undefined otherwise or when `ts` is empty.
 */
function allEqual<T>(ts: T[]): T | undefined {
  if (ts.length === 0) {
    return undefined;
  }
  const t = ts[0];
  for (let i = 1; i < ts.length; i++) {
    if (t !== ts[i]) {
      return undefined;
    }
  }
  return t;
}

/**
 * Omits empty strings.
 */
function getTexts(
  worksheet: Worksheet,
  fromRow: number,
  toRow: number,
  col: number,
): string[] {
  const texts: string[] = [];
  for (let row = fromRow; row <= toRow; row++) {
    const text = worksheet.getCell(row, col).text.trim();
    if (text !== "") {
      texts.push(text);
    }
  }
  return texts;
}

function getMaster(c: Cell): Cell {
  if (c === c.master) {
    return c;
  } else {
    return getMaster(c.master);
  }
}

function getMergedCellText(
  worksheet: Worksheet,
  fromRow: number,
  toRow: number,
  col: number,
): string | undefined {
  const masters: Cell[] = [];
  for (let row = fromRow; row <= toRow; row++) {
    const cell = worksheet.getCell(row, col);
    masters.push(getMaster(cell));
  }
  const master = allEqual(masters);
  if (master === undefined) {
    return undefined;
  }
  return master.text.trim();
}

function findTextPosition(
  sheet: Worksheet,
  text: string,
): Position | undefined {
  let p: Position | undefined;
  sheet.eachRow((r, row) => {
    r.eachCell((cell, col) => {
      if (p === undefined && cell.text === text) {
        p = { row, col };
      }
    });
  });
  return p;
}

const ROWS_PER_ENTRY = 6;

export type Range = {
  fromRow: number;
  toRow: number;
  col: number;
};

export type ParseWorkbookError =
  | { kind: "mike-sheet-not-found" }
  | { kind: "multiple-mike-start"; sheetNames: string[] };

export type ParseSheetError =
  | { kind: "mike-end-not-found" }
  | {
      kind: "mike-end-in-wrong-position";
      mikeStart: Position;
      mikeEnd: Position;
    }
  | {
      kind: "mike-end-misaligned";
      mikeCol: number;
      mikeStartRow: number;
      mikeEndRow: number;
    }
  | ((
      | { kind: "bad-name-cell"; entryCount: number }
      | { kind: "unmerged-job-name-cell" }
      | { kind: "bad-course-cell"; entryCount: number }
      | { kind: "unmerged-total-duration-cell" }
      | { kind: "unparsable-total-duration"; text: string }
      | { kind: "unmerged-course-term-cell" }
    ) &
      Range);

export type ParseResult =
  | { kind: "ok"; instructors: Instructor[]; sheetName: string }
  | { kind: "workbook-error"; error: ParseWorkbookError }
  | { kind: "sheet-errors"; sheetName: string; errors: ParseSheetError[] };

export function parse(workbook: Workbook): ParseResult {
  let mikeSheets: [Worksheet, Position][] = [];
  for (const w of workbook.worksheets) {
    const mikeStart = findTextPosition(w, "mike_start");
    if (mikeStart !== undefined) {
      mikeSheets.push([w, mikeStart]);
    }
  }

  if (mikeSheets.length === 0) {
    return { kind: "workbook-error", error: { kind: "mike-sheet-not-found" } };
  } else if (mikeSheets.length > 1) {
    return {
      kind: "workbook-error",
      error: {
        kind: "multiple-mike-start",
        sheetNames: mikeSheets.map(([w]) => w.name),
      },
    };
  }
  const [worksheet, mikeStart] = mikeSheets[0];
  const sheetName = worksheet.name;

  const mikeEnd = findTextPosition(worksheet, "mike_end");
  if (mikeEnd === undefined) {
    return {
      kind: "sheet-errors",
      sheetName,
      errors: [{ kind: "mike-end-not-found" }],
    };
  }

  if (mikeStart.col !== mikeEnd.col) {
    return {
      kind: "sheet-errors",
      sheetName,
      errors: [{ kind: "mike-end-in-wrong-position", mikeStart, mikeEnd }],
    };
  }
  const mikeCol = mikeStart.col;
  const mikeStartRow = mikeStart.row;
  const mikeEndRow = mikeEnd.row;

  if ((mikeEndRow - mikeStartRow + 1) % ROWS_PER_ENTRY !== 0) {
    return {
      kind: "sheet-errors",
      sheetName,
      errors: [
        {
          kind: "mike-end-misaligned",
          mikeCol,
          mikeStartRow,
          mikeEndRow,
        },
      ],
    };
  }

  const nameCol = mikeCol + 3;
  const jobNameCol = mikeCol + 4;
  const courseCol = mikeCol + 5;
  const totalDurationCol = mikeCol + 9;
  const courseTermCol = mikeCol + 11;
  const addressCol = mikeCol + 16;

  const instructors: Instructor[] = [];
  const errors: ParseSheetError[] = [];

  for (
    let fromRow = mikeStartRow;
    fromRow < mikeEndRow;
    fromRow += ROWS_PER_ENTRY
  ) {
    const toRow = fromRow + ROWS_PER_ENTRY - 1;

    const nameColTexts = getTexts(worksheet, fromRow, toRow, nameCol);
    if (nameColTexts.length !== 3) {
      errors.push({
        kind: "bad-name-cell",
        entryCount: nameColTexts.length,
        fromRow,
        toRow,
        col: nameCol,
      });
      continue;
    }
    const [namePronunciation, name, _age] = nameColTexts;

    const jobName = getMergedCellText(worksheet, fromRow, toRow, jobNameCol);
    if (jobName === undefined) {
      errors.push({
        kind: "unmerged-job-name-cell",
        fromRow,
        toRow,
        col: jobNameCol,
      });
      continue;
    }

    const courseColTexts = getTexts(worksheet, fromRow, toRow, courseCol);
    if (courseColTexts.length !== 2) {
      errors.push({
        kind: "bad-course-cell",
        entryCount: courseColTexts.length,
        fromRow,
        toRow,
        col: courseCol,
      });
      continue;
    }
    const [courseId, courseName] = courseColTexts;

    const totalDurationText = getMergedCellText(
      worksheet,
      fromRow,
      toRow,
      totalDurationCol,
    );
    if (totalDurationText === undefined) {
      errors.push({
        kind: "unmerged-total-duration-cell",
        fromRow,
        toRow,
        col: totalDurationCol,
      });
      continue;
    }
    const totalDuration = parseNumber(totalDurationText);
    if (totalDuration === undefined) {
      errors.push({
        kind: "unparsable-total-duration",
        text: totalDurationText,
        fromRow,
        toRow,
        col: totalDurationCol,
      });
      continue;
    }

    const courseTerm = getMergedCellText(
      worksheet,
      fromRow,
      toRow,
      courseTermCol,
    );
    if (courseTerm === undefined) {
      errors.push({
        kind: "unmerged-course-term-cell",
        fromRow,
        toRow,
        col: courseTermCol,
      });
      continue;
    }

    const officeAddress = worksheet
      .getCell(fromRow + 2, addressCol)
      .text.trim();
    const homeAddress = worksheet.getCell(fromRow + 3, addressCol).text.trim();

    instructors.push({
      name,
      namePronunciation,
      homeAddress,
      officeAddress,
      jobName,
      courseId,
      courseName,
      courseTerm,
      totalDuration,
    });
  }

  if (errors.length > 0) {
    return { kind: "sheet-errors", sheetName, errors };
  }
  return { kind: "ok", instructors, sheetName };
}
