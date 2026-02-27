import { MariaDBConnection } from "../lib/config.mariaDB";
import type { PoolConnection } from "mariadb";
import readConfig from "./readConfig.ts";

const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);
const endOfDay = new Date();
endOfDay.setHours(23, 59, 59, 999);

const attendance_Table = process.env.MARIA_DB_TABLE_ATTENDANCE;
const data_student_Table = process.env.MARIA_DB_TABLE_STUDENTS;

// ฟังก์ชั่นคำนวณคะแนนความประพฤติหลังจาก cutoff
// ใช้สำหรับคำนวณคะแนนหลังจาก autoCutoff INSERT ข้อมูลไปแล้ว (ไม่ INSERT ซ้ำ)
// ฟังก์ชั่นคำนวณคะแนนความประพฤติหลังจาก cutoff
// ใช้สำหรับคำนวณคะแนนหลังจาก autoCutoff INSERT ข้อมูลไปแล้ว (ไม่ INSERT ซ้ำ)
export async function Calculate_behaviorScore(
  externalConn?: PoolConnection,
): Promise<void> {
  let conn: PoolConnection | undefined;
  // ถ้ามี connection ส่งมาให้ใช้ของเดิม (Reuse) ถ้าไม่มีค่อยสร้างใหม่
  conn = externalConn ? externalConn : await MariaDBConnection.getConnection();

  try {
    console.log("[Calculate_behaviorScore] start deduction score");

    const setting = await readConfig();
    const scoreDeductLate = Number(setting.Scorededucted_lateAttendance || 0);
    const scoreDeductAbsent = Number(
      setting.Scorededucted_absentAttendance || 0,
    );

    // ---------------------------------------------------------
    // ใช้ BULK UPDATE แทนการวน Loop (ทำงาน 4 Query จบ)
    // ---------------------------------------------------------

    // 1. เช็คชื่อ: เข้าร่วมกิจกรรม (เพิ่ม JOIN_DAYS)
    await conn.query(`
      UPDATE ${data_student_Table} s
      INNER JOIN ${attendance_Table} a ON s.STUDENT_ID = a.STUDENT_ID
      SET s.JOIN_DAYS = s.JOIN_DAYS + 1
      WHERE a.STATUS = 'เข้าร่วมกิจกรรม' 
      AND DATE(a.CREATED_AT) = CURDATE() 
      AND a.HANDLER = 'system'
    `);

    // 2. เช็คชื่อ: ลา (เพิ่ม LEAVE_DAYS)
    await conn.query(`
      UPDATE ${data_student_Table} s
      INNER JOIN ${attendance_Table} a ON s.STUDENT_ID = a.STUDENT_ID
      SET s.LEAVE_DAYS = s.LEAVE_DAYS + 1
      WHERE a.STATUS = 'ลา' 
      AND DATE(a.CREATED_AT) = CURDATE() 
      AND a.HANDLER = 'system'
    `);

    // 3. เช็คชื่อ: สาย (เพิ่ม LATE_DAYS และ หักคะแนน)
    await conn.query(
      `
      UPDATE ${data_student_Table} s
      INNER JOIN ${attendance_Table} a ON s.STUDENT_ID = a.STUDENT_ID
      SET s.LATE_DAYS = s.LATE_DAYS + 1,
          s.BEHAVIOR_SCORE = s.BEHAVIOR_SCORE - ?
      WHERE a.STATUS = 'สาย' 
      AND DATE(a.CREATED_AT) = CURDATE() 
      AND a.HANDLER = 'system'
    `,
      [scoreDeductLate],
    );

    // 4. เช็คชื่อ: ขาด (เพิ่ม ABSENT_DAYS และ หักคะแนน)
    await conn.query(
      `
      UPDATE ${data_student_Table} s
      INNER JOIN ${attendance_Table} a ON s.STUDENT_ID = a.STUDENT_ID
      SET s.ABSENT_DAYS = s.ABSENT_DAYS + 1,
          s.BEHAVIOR_SCORE = s.BEHAVIOR_SCORE - ?
      WHERE a.STATUS = 'ขาด' 
      AND DATE(a.CREATED_AT) = CURDATE() 
      AND a.HANDLER = 'system'
    `,
      [scoreDeductAbsent],
    );

    console.log("[Calculate_behaviorScore] Calculate successfully (Bulk Mode)");
  } catch (error) {
    throw error;
  } finally {
    // ถ้าสร้าง connection เอง ต้องปิดเอง
    // ถ้าใช้ externalConn คนเรียกจะเป็นคนปิด (เช่น autoCutoff)
    if (!externalConn && conn) {
      conn.release();
    }
  }
}

// ฟังก์ชั่นคำนวณคะแนนความประพฤติหลังจากอัพเดตข้อมูล

export async function update_behaviorScore(
  list: Array<{
    update: boolean;
    studentId: string;
    name?: string;
    classes?: string;
    status: string;
    handler?: string | "Teacher";
  }>,
): Promise<void> {
  let conn: PoolConnection | undefined;
  try {
    console.log("[BehaviorScore-Deduction] start updata_begaviorScore...");

    conn = await MariaDBConnection.getConnection();
    const setting = await readConfig();

    for (const item of list) {
      const { update, studentId, status, handler } = item;
      const NewStatus = status;

      let diffComeDays = 0;
      let diffLeaveDays = 0;
      let diffLateDays = 0;
      let diffAbsentDays = 0;
      let diffBehaviorScore = 0;

      // แปลงค่าคะแนนจาก Setting ให้เป็นตัวเลข (เผื่อเป็น string มา)
      const scoreDeductLate = Number(setting.Scorededucted_lateAttendance || 0);
      const scoreDeductAbsent = Number(
        setting.Scorededucted_absentAttendance || 0,
      );

      if (!update) {
        const query: string = `INSERT INTO ${attendance_Table} (HANDLER, STUDENT_ID, NAME, CLASSES, STATUS) SELECT ?, STUDENT_ID, NAME, CLASSES, ? FROM ${data_student_Table} WHERE STUDENT_ID = ?`;
        await conn.execute(query, [handler, status, studentId]);
        switch (status) {
          case "เข้าร่วมกิจกรรม":
            diffComeDays += 1;
            break;
          case "ลา":
            diffLeaveDays += 1;
            break;
          case "สาย":
            diffLateDays += 1;
            diffBehaviorScore -= scoreDeductLate;
            break;
          case "ขาด":
            diffAbsentDays += 1;
            diffBehaviorScore -= scoreDeductAbsent;
            break;
        }
        const sql = `
        UPDATE ${data_student_Table} 
        SET 
          JOIN_DAYS = JOIN_DAYS + ?,
          LEAVE_DAYS = LEAVE_DAYS + ?,
          LATE_DAYS = LATE_DAYS + ?,
          ABSENT_DAYS = ABSENT_DAYS + ?,
          BEHAVIOR_SCORE = BEHAVIOR_SCORE + ?
        WHERE STUDENT_ID = ?
      `;

        const values = [
          diffComeDays,
          diffLeaveDays,
          diffLateDays,
          diffAbsentDays,
          diffBehaviorScore,
          studentId,
        ];

        await conn.execute(sql, values);
        console.log("[BehaviorScore-Deduction] Calculate successfully...");
      } else {
        const queryData_old: string = `SELECT STUDENT_ID, STATUS FROM ${attendance_Table} WHERE STUDENT_ID = ? AND DATE(CHECK_DATE) = CURDATE()`;
        const old_data_attendance = await conn.execute(queryData_old, [
          studentId,
        ]);
        if (!old_data_attendance) return;
        const statusOld = old_data_attendance[0].STATUS;
        // ---------------------------------------------------------
        // 2. จัดการ "สถานะเก่า" (state) -> คือการถอนค่าเดิมออก (Revert)
        // ---------------------------------------------------------
        // สังเกต: ฝั่ง Revert ถ้าเป็นคะแนนต้อง "บวกคืน" (+)
        switch (statusOld) {
          case "เข้าร่วมกิจกรรม":
            diffComeDays -= 1; // ลบออกจากวันมา
            break;
          case "ลา":
            diffLeaveDays -= 1;
            break;
          case "สาย":
            diffLateDays -= 1;
            diffBehaviorScore += scoreDeductLate; // คืนคะแนนกลับไป
            break;
          case "ขาด":
            diffAbsentDays -= 1;
            diffBehaviorScore += scoreDeductAbsent; // คืนคะแนนกลับไป
            break;
        }

        const queryUpdate: string = `UPDATE ${attendance_Table} SET STATUS = ? WHERE STUDENT_ID = ? AND DATE(CHECK_DATE) = CURDATE()`;
        await conn.execute(queryUpdate, [NewStatus, studentId]);

        // ---------------------------------------------------------
        // 3. จัดการ "สถานะใหม่" (status) -> คือการใส่ค่าใหม่เข้าไป (Apply)
        // ---------------------------------------------------------
        // สังเกต: ฝั่ง Apply ถ้าเป็นคะแนนต้อง "ลบออก" (-)
        switch (NewStatus) {
          case "เข้าร่วมกิจกรรม":
            diffComeDays += 1; // บวกเพิ่มวันมา
            break;
          case "ลา":
            diffLeaveDays += 1;
            break;
          case "สาย":
            diffLateDays += 1;
            diffBehaviorScore -= scoreDeductLate; // หักคะแนน
            break;
          case "ขาด":
            diffAbsentDays += 1;
            diffBehaviorScore -= scoreDeductAbsent; // หักคะแนน
            break;
        }
        const sql = `
        UPDATE ${data_student_Table} 
        SET 
          JOIN_DAYS = JOIN_DAYS + ?,
          LEAVE_DAYS = LEAVE_DAYS + ?,
          LATE_DAYS = LATE_DAYS + ?,
          ABSENT_DAYS = ABSENT_DAYS + ?,
          BEHAVIOR_SCORE = BEHAVIOR_SCORE + ?
        WHERE STUDENT_ID = ?
      `;

        const values = [
          diffComeDays,
          diffLeaveDays,
          diffLateDays,
          diffAbsentDays,
          diffBehaviorScore,
          studentId,
        ];

        await conn.execute(sql, values);
      }
    }
    console.log(
      "[BehaviorScore-Deduction] update_behaviorScore successfully...",
    );
  } catch (error) {
    throw error;
  } finally {
    if (conn) conn.release();
  }
}

/**
 * อัพเดตคะแนนพฤติกรรมย้อนหลัง (ใช้ targetDate แทน CURDATE())
 */
export async function update_behaviorScore_retroactive(
  list: Array<{
    isFirstRecord: boolean;
    studentId: string;
    name: string;
    classes: string;
    status: string;
    handler?: string | "Teacher";
  }>,
  targetDate: string, // format: YYYY-MM-DD
): Promise<void> {
  let conn: PoolConnection | undefined;
  try {
    console.log(`[BehaviorScore-Retroactive] start for date: ${targetDate}`);

    conn = await MariaDBConnection.getConnection();
    const setting = await readConfig();

    for (const item of list) {
      const { isFirstRecord, studentId, status, handler } = item;

      let diffComeDays = 0;
      let diffLeaveDays = 0;
      let diffLateDays = 0;
      let diffAbsentDays = 0;
      let diffBehaviorScore = 0;

      const scoreDeductLate = Number(setting.Scorededucted_lateAttendance || 0);
      const scoreDeductAbsent = Number(
        setting.Scorededucted_absentAttendance || 0,
      );

      if (isFirstRecord) {
        // INSERT ข้อมูลใหม่ย้อนหลัง
        const query = `INSERT INTO ${attendance_Table} (HANDLER, STUDENT_ID, NAME, CLASSES, STATUS, CREATED_AT) VALUES (?, ?, ?, ?, ?, ?)`;
        const dateTimestamp = new Date(`${targetDate}T08:00:00`);
        await conn.execute(query, [
          handler || "retroactive",
          studentId,
          item.name,
          item.classes,
          status,
          dateTimestamp,
        ]);

        switch (status) {
          case "เข้าร่วมกิจกรรม":
            diffComeDays += 1;
            break;
          case "ลา":
            diffLeaveDays += 1;
            break;
          case "สาย":
            diffLateDays += 1;
            diffBehaviorScore -= scoreDeductLate;
            break;
          case "ขาด":
            diffAbsentDays += 1;
            diffBehaviorScore -= scoreDeductAbsent;
            break;
        }
      } else {
        // แก้ไขสถานะย้อนหลัง — Revert สถานะเก่า + Apply สถานะใหม่
        const queryOld = `SELECT STUDENT_ID, STATUS FROM ${attendance_Table} WHERE STUDENT_ID = ? AND DATE(CREATED_AT) = ?`;
        const oldData = await conn.execute(queryOld, [studentId, targetDate]);
        if (!oldData || oldData.length === 0) continue;
        const statusOld = oldData[0].STATUS;

        // Revert สถานะเก่า
        switch (statusOld) {
          case "เข้าร่วมกิจกรรม":
            diffComeDays -= 1;
            break;
          case "ลา":
            diffLeaveDays -= 1;
            break;
          case "สาย":
            diffLateDays -= 1;
            diffBehaviorScore += scoreDeductLate;
            break;
          case "ขาด":
            diffAbsentDays -= 1;
            diffBehaviorScore += scoreDeductAbsent;
            break;
        }

        // UPDATE สถานะใหม่
        const queryUpdate = `UPDATE ${attendance_Table} SET STATUS = ? WHERE STUDENT_ID = ? AND DATE(CREATED_AT) = ?`;
        await conn.execute(queryUpdate, [status, studentId, targetDate]);

        // Apply สถานะใหม่
        switch (status) {
          case "เข้าร่วมกิจกรรม":
            diffComeDays += 1;
            break;
          case "ลา":
            diffLeaveDays += 1;
            break;
          case "สาย":
            diffLateDays += 1;
            diffBehaviorScore -= scoreDeductLate;
            break;
          case "ขาด":
            diffAbsentDays += 1;
            diffBehaviorScore -= scoreDeductAbsent;
            break;
        }
      }

      // อัพเดต student summary
      const sql = `
        UPDATE ${data_student_Table} 
        SET 
          JOIN_DAYS = JOIN_DAYS + ?,
          LEAVE_DAYS = LEAVE_DAYS + ?,
          LATE_DAYS = LATE_DAYS + ?,
          ABSENT_DAYS = ABSENT_DAYS + ?,
          BEHAVIOR_SCORE = BEHAVIOR_SCORE + ?
        WHERE STUDENT_ID = ?
      `;
      await conn.execute(sql, [
        diffComeDays,
        diffLeaveDays,
        diffLateDays,
        diffAbsentDays,
        diffBehaviorScore,
        studentId,
      ]);
    }

    console.log("[BehaviorScore-Retroactive] completed successfully");
  } catch (error) {
    throw error;
  } finally {
    if (conn) conn.release();
  }
}
