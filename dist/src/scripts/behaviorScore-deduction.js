import { MariaDBConnection } from "../lib/config.mariaDB.js";
import readConfig from "./readConfig.js";
const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);
const endOfDay = new Date();
endOfDay.setHours(23, 59, 59, 999);
const attendance_Table = process.env.MARIA_DB_TABLE_ATTENDANCE;
const data_student_Table = process.env.MARIA_DB_TABLE_STUDENTS;
// ฟังก์ชั่นคำนวณคะแนนความประพฤติหลังจาก cutoff
export async function Calculate_behaviorScore() {
    let conn;
    try {
        conn = await MariaDBConnection.getConnection();
        console.log("[Calculate_behaviorScore] start deduction score");
        const query_attendance_Today = `SELECT STUDENT_ID, STATUS FROM ${attendance_Table} WHERE DATE(CHECK_DATE) = CURDATE()`;
        const data_Attendance_Today = await conn.query(query_attendance_Today);
        if (!data_Attendance_Today) {
            console.log("[Calculate_behaviorScore] data Attendance today is excited");
        }
        for (const index of data_Attendance_Today) {
            const { STUDENT_ID, STATUS } = index;
            await update_behaviorScore([
                {
                    update: false,
                    studentId: STUDENT_ID,
                    status: STATUS,
                    handler: "System",
                },
            ]);
        }
        console.log("[Calculate_behaviorScore] Calculate successfully...");
    }
    catch (error) {
        throw error;
    }
    finally {
        if (conn)
            conn.release();
    }
}
// ฟังก์ชั่นคำนวณคะแนนความประพฤติหลังจากอัพเดตข้อมูล
export async function update_behaviorScore(list) {
    let conn;
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
            const scoreDeductAbsent = Number(setting.Scorededucted_absentAttendance || 0);
            if (!update) {
                const query = `INSERT INTO ${attendance_Table} (HANDLER, STUDENT_ID, NAME, CLASSES, STATUS) SELECT ?, STUDENT_ID, NAME, CLASSES, ? FROM ${data_student_Table} WHERE STUDENT_ID = ?`;
                await conn.execute(query, [handler, status, studentId]);
            }
            const queryData_old = `SELECT STUDENT_ID, STATUS FROM ${attendance_Table} WHERE STUDENT_ID = ? AND DATE(CHECK_DATE) = CURDATE()`;
            const old_data_attendance = await conn.execute(queryData_old, [
                studentId,
            ]);
            if (!old_data_attendance)
                return;
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
            const queryUpdate = `UPDATE ${attendance_Table} SET STATUS = ? WHERE STUDENT_ID = ? AND DATE(CHECK_DATE) = CURDATE()`;
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
        console.log("[update_behaviorScore] update_behaviorScore successfully...");
    }
    catch (error) {
        throw error;
    }
    finally {
        if (conn)
            conn.release();
    }
}
