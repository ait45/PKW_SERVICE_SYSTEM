import * as XLSX from "xlsx";

export interface ParsedRow {
  [key: string]: string | number | boolean | null;
}

export interface ExcelParseResult {
  success: boolean;
  data: ParsedRow[];
  headers: string[];
  error?: string;
}

/**
 * Parse Excel file buffer to JSON array
 * @param buffer - File buffer from uploaded file
 * @returns Parsed data with headers and rows
 */
export function parseExcelBuffer(buffer: Buffer): ExcelParseResult {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Get all data as JSON
    const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(worksheet, {
      defval: null,
      raw: false,
    });

    // Get headers from first row
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    const headers: string[] = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: col })];
      headers.push(cell ? String(cell.v) : `Column${col + 1}`);
    }

    return {
      success: true,
      data: jsonData,
      headers,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      headers: [],
      error: error instanceof Error ? error.message : "Failed to parse Excel file",
    };
  }
}

/**
 * Map Thai headers to English field names for students
 */
export const studentHeaderMapping: Record<string, string> = {
  "รหัสนักเรียน": "studentId",
  "เลขประจำตัว": "studentId",
  "ชื่อ-นามสกุล": "name",
  "ชื่อ": "name",
  "ห้อง": "classes",
  "ชั้นเรียน": "classes",
  "เลขที่": "Number",
  "เบอร์โทร": "phone",
  "เบอร์โทรนักเรียน": "phone",
  "เบอร์ผู้ปกครอง": "parentPhone",
  "เบอร์โทรผู้ปกครอง": "parentPhone",
};

/**
 * Map Thai headers to English field names for teachers
 */
export const teacherHeaderMapping: Record<string, string> = {
  "รหัสครู": "teacherId",
  "รหัสประจำตัว": "teacherId",
  "ชื่อ-นามสกุล": "name",
  "ชื่อ": "name",
  "แผนก": "department",
  "วิชา": "subject",
  "วิชาที่สอน": "subject",
  "กลุ่มสาระ": "subjectGroup",
  "เบอร์โทร": "phone",
};

/**
 * Map parsed data using header mapping
 */
export function mapDataWithHeaders<T>(
  data: ParsedRow[],
  headerMapping: Record<string, string>
): T[] {
  return data.map((row) => {
    const mappedRow: Record<string, unknown> = {};
    for (const [originalKey, value] of Object.entries(row)) {
      const mappedKey = headerMapping[originalKey] || originalKey;
      mappedRow[mappedKey] = value;
    }
    return mappedRow as T;
  });
}
