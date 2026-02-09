import { Calculate_behaviorScore } from "./behaviorScore-deduction";
import readConfig from "./readConfig";
import { Holiday } from "./Holiday";
import { MariaDBConnection } from "../lib/config.mariaDB";
import type { PoolConnection } from "mariadb";

// Environment variables
const StudentTable_ENV = process.env.MARIA_DB_TABLE_STUDENTS;
const attendanceTable = process.env.MARIA_DB_TABLE_ATTENDANCE;

// Default retry settings
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 5000;

/**
 * Helper function for delay (used in retry mechanism)
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * ตรวจสอบสถานะการมาเรียนตามเวลา
 * @returns สถานะ: "เข้าร่วมกิจกรรม" | "สาย" | "ขาด"
 */
export async function cutoff(): Promise<string> {
  const now = new Date(); // ใช้เวลาปัจจุบันที่ถูกต้อง
  const settings = await readConfig();
  const [hourLate, minuteLate]: [number, number] = settings.lateThreshold
    .split(":")
    .map(Number);
  const [hourabsent, minuteabsent]: [number, number] = settings.absentThreshold
    .split(":")
    .map(Number);

  // กำหนดเวลา cutoff ของวันนี้
  const lateTime = new Date();
  lateTime.setHours(hourLate, minuteLate, 0, 0);

  const absentTime = new Date();
  absentTime.setHours(hourabsent, minuteabsent, 0, 0);

  let status: string = "เข้าร่วมกิจกรรม";
  if (now > absentTime) {
    status = "ขาด";
  } else if (now > lateTime) {
    status = "สาย";
  }
  return status;
}

/**
 * ตรวจสอบว่าเริ่มเช็คชื่อได้หรือยัง
 */
export async function attendanceStart(): Promise<boolean> {
  const setting = await readConfig();
  const [h, m]: [number, number] = setting.absentThreshold
    .split(":")
    .map(Number);
  const timeStart = new Date();
  timeStart.setHours(h, m, 0, 0);
  const now = new Date();
  return now > timeStart;
}

/**
 * AutoCutoff Result Interface
 */
interface AutoCutoffResult {
  success: boolean;
  skipped: boolean;
  reason?: string;
  studentsMarked: number;
  totalStudents: number;
  error?: string;
}

/**
 * ทำ autoCutoff สำหรับนักเรียนที่ไม่ได้เช็คชื่อ
 * - ตรวจสอบวันหยุด
 * - ตรวจสอบเวลา cutoff
 * - บันทึกสถานะ "ขาด" ให้นักเรียนที่ยังไม่ได้เช็คชื่อ
 * - ใช้ transaction สำหรับความปลอดภัยของข้อมูล
 */
export async function autoCutoff(): Promise<AutoCutoffResult> {
  const now = new Date();
  const setting = await readConfig();
  const [h, m]: [number, number] = setting.absentThreshold
    .split(":")
    .map(Number);
  const timeCutoff = new Date();
  timeCutoff.setHours(h, m, 0, 0);

  const HANDLER = "system";
  const STATUS = "ขาด";

  // ตรวจสอบว่าเลยเวลา cutoff หรือยัง
  if (now <= timeCutoff) {
    return {
      success: true,
      skipped: true,
      reason: "before_cutoff_time",
      studentsMarked: 0,
      totalStudents: 0,
    };
  }

  console.log("[autoCutoff] Starting autoCutoff process...");

  // ตรวจสอบวันหยุด
  const holiday = Holiday(now);
  if (holiday.isHoliday) {
    console.log(`[autoCutoff] Skipped - Holiday: ${holiday.name}`);
    return {
      success: true,
      skipped: true,
      reason: `holiday:${holiday.name}`,
      studentsMarked: 0,
      totalStudents: 0,
    };
  }

  let conn: PoolConnection | undefined;
  try {
    // ตรวจสอบ environment variables
    if (!StudentTable_ENV) {
      throw new Error("MARIA_DB_TABLE_STUDENTS is not defined");
    }
    if (!attendanceTable) {
      throw new Error("MARIA_DB_TABLE_ATTENDANCE is not defined");
    }

    conn = await MariaDBConnection.getConnection();

    // ดึงข้อมูลนักเรียนทั้งหมด
    const queryTotalStudent = `SELECT STUDENT_ID, NAME, CLASSES FROM ${StudentTable_ENV}`;
    const students = await conn.query(queryTotalStudent);
    const totalStudents = students.length;

    if (totalStudents === 0) {
      console.log("[autoCutoff] No students in database");
      return {
        success: true,
        skipped: true,
        reason: "no_students",
        studentsMarked: 0,
        totalStudents: 0,
      };
    }

    // ดึงข้อมูลการเช็คชื่อวันนี้
    const queryCheckedToday = `SELECT STUDENT_ID FROM ${attendanceTable} WHERE DATE(CREATED_AT) = CURDATE()`;
    const checkedToday = await conn.query(queryCheckedToday);
    const checkedIds = new Set(
      checkedToday.map((s: { STUDENT_ID: string }) => s.STUDENT_ID),
    );

    // ตรวจสอบว่าเช็คครบทุกคนแล้วหรือยัง
    if (checkedIds.size >= totalStudents) {
      console.log("[autoCutoff] All students already checked in");
      return {
        success: true,
        skipped: true,
        reason: "all_checked",
        studentsMarked: 0,
        totalStudents,
      };
    }

    // หานักเรียนที่ยังไม่ได้เช็คชื่อ
    const missing = students.filter(
      (student: { STUDENT_ID: string }) => !checkedIds.has(student.STUDENT_ID),
    );

    if (missing.length === 0) {
      console.log("[autoCutoff] No missing students");
      return {
        success: true,
        skipped: true,
        reason: "no_missing",
        studentsMarked: 0,
        totalStudents,
      };
    }

    // ใช้ transaction สำหรับ bulk insert
    await conn.beginTransaction();
    try {
      // สร้าง timestamp พื้นฐานและเพิ่ม offset ให้แต่ละแถวเพื่อหลีกเลี่ยง duplicate
      const baseTime = new Date();
      const insertData = missing.map(
        (
          student: { STUDENT_ID: string; NAME: string; CLASSES: string },
          index: number,
        ) => {
          // เพิ่ม milliseconds offset ให้แต่ละแถว
          const timestamp = new Date(baseTime.getTime() + index);
          return [
            HANDLER,
            student.STUDENT_ID,
            student.NAME,
            student.CLASSES,
            STATUS,
            timestamp,
          ];
        },
      );

      const placeholders = insertData
        .map(() => "(?, ?, ?, ?, ?, ?)")
        .join(", ");
      const flatValues = insertData.flat();
      const queryInsert = `INSERT INTO ${attendanceTable} (HANDLER, STUDENT_ID, NAME, CLASSES, STATUS, CREATED_AT) VALUES ${placeholders}`;

      await conn.query(queryInsert, flatValues);
      await conn.commit();

      console.log(`[autoCutoff] Marked ${missing.length} students as absent`);

      // คำนวณคะแนนพฤติกรรม (ส่ง connection ไปใช้ต่อ)
      await Calculate_behaviorScore(conn);
      console.log("[autoCutoff] Behavior score calculated");

      return {
        success: true,
        skipped: false,
        studentsMarked: missing.length,
        totalStudents,
      };
    } catch (insertError) {
      await conn.rollback();
      throw insertError;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[autoCutoff] Error:", errorMessage);
    return {
      success: false,
      skipped: false,
      error: errorMessage,
      studentsMarked: 0,
      totalStudents: 0,
    };
  } finally {
    if (conn) {
      conn.release(); // ใช้ release() แทน end() สำหรับ connection pool
    }
  }
}

/**
 * AutoCutoff with Retry Mechanism
 * - Exponential backoff: 5s, 10s, 20s
 * - Max 3 retries by default
 */
export async function autoCutoffWithRetry(
  maxRetries?: number,
  retryDelayMs?: number,
): Promise<AutoCutoffResult> {
  // อ่าน settings หรือใช้ค่า default
  let config;
  try {
    config = await readConfig();
  } catch {
    config = {};
  }

  const retries =
    maxRetries ?? config.autoCutoff?.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelay =
    retryDelayMs ?? config.autoCutoff?.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;

  let lastError: string | undefined;

  for (let attempt = 1; attempt <= retries; attempt++) {
    console.log(`[autoCutoff] Attempt ${attempt}/${retries}`);

    const result = await autoCutoff();

    // สำเร็จหรือ skip ไม่ต้อง retry
    if (result.success) {
      return result;
    }

    // บันทึก error
    lastError = result.error;
    console.error(`[autoCutoff] Attempt ${attempt} failed: ${lastError}`);

    // ไม่ต้อง retry ถ้าเป็น attempt สุดท้าย
    if (attempt < retries) {
      const delayMs = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
      console.log(`[autoCutoff] Retrying in ${delayMs}ms...`);
      await delay(delayMs);
    }
  }

  // หลังจาก retry หมดแล้วยังไม่สำเร็จ
  console.error(`[autoCutoff] All ${retries} attempts failed`);
  return {
    success: false,
    skipped: false,
    error: `All ${retries} attempts failed. Last error: ${lastError}`,
    studentsMarked: 0,
    totalStudents: 0,
  };
}

/**
 * Get autoCutoff status information
 */
export async function getAutoCutoffStatus(): Promise<{
  enabled: boolean;
  cutoffTime: string;
  isAfterCutoff: boolean;
  isHoliday: boolean;
  holidayName?: string;
}> {
  const now = new Date();
  const setting = await readConfig();
  const [h, m]: [number, number] = setting.absentThreshold
    .split(":")
    .map(Number);
  const timeCutoff = new Date();
  timeCutoff.setHours(h, m, 0, 0);

  const holiday = Holiday(now);

  return {
    enabled: setting.autoCutoff?.enabled ?? true,
    cutoffTime: setting.absentThreshold,
    isAfterCutoff: now > timeCutoff,
    isHoliday: holiday.isHoliday,
    holidayName: holiday.isHoliday ? holiday.name : undefined,
  };
}
