import type { Instructor } from "./mike";
import { parseNumber } from "./util";
import type { Workbook } from "exceljs";

const ROWS_PER_ENTRY = 6;

export function parse(workbook: Workbook): Instructor[] | undefined {
  const worksheets = workbook.worksheets;

  // FIXME
  const worksheet = worksheets[0];

  const instructors: Instructor[] = [];

  for (let i = 10; ; i += ROWS_PER_ENTRY) {
    const cColumn: string[] = [];
    for (let j = 0; j < ROWS_PER_ENTRY; j++) {
      const text = worksheet.getCell(i + j, 3).text.trim();
      if (text !== "") {
        cColumn.push(text);
      }
    }
    const officeAddress = worksheet.getCell(i + 2, 16).text.trim();
    const homeAddress = worksheet.getCell(i + 3, 16).text.trim();
    if (cColumn.length !== 3) {
      // TODO
      break;
    }
    const [namePronunciation, name, _age] = cColumn;

    const jobName = worksheet.getCell(i, 4).text.trim();

    const eColumn: string[] = [];
    for (let j = 0; j < ROWS_PER_ENTRY; j++) {
      const text = worksheet.getCell(i + j, 5).text.trim();
      if (text !== "") {
        eColumn.push(text);
      }
    }
    if (eColumn.length !== 2) {
      // TODO
      break;
    }
    const [courseId, courseName] = eColumn;

    const totalDuration = parseNumber(worksheet.getCell(i, 9).text.trim());
    if (totalDuration === undefined) {
      // TODO
      break;
    }

    const courseTerm = worksheet.getCell(i, 11).text.trim();

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

  return instructors;
}
