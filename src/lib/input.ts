import type { Workbook } from "exceljs";

export type Instructor = {
  name: string;
  namePronunciation: string;
  homeAddress: string;
  officeAddress: string;
};

export function parse(workbook: Workbook): Instructor[] {
  const worksheets = workbook.worksheets;

  // FIXME
  const worksheet = worksheets[0];

  const instructors: Instructor[] = [];

  for (let i = 10; ; i += 6) {
    const cColumn: string[] = [];
    for (let j = 0; j < 6; j++) {
      const cell = worksheet.getCell(i + j, 3);
      const text = cell.text.trim();
      if (text !== "") {
        cColumn.push(text);
      }
    }
    const officeAddress = worksheet.getCell(i + 2, 16).text.trim();
    const homeAddress = worksheet.getCell(i + 3, 16).text.trim();
    if (cColumn.length !== 3) {
      break;
    }
    const [namePronunciation, name, _age] = cColumn;
    instructors.push({
      name,
      namePronunciation,
      homeAddress,
      officeAddress,
    });
  }

  return instructors;
}
