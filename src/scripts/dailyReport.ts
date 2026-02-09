import { MariaDBConnection } from "@/lib/config.mariaDB";
import {
  createAttendanceSummaryFlexMessage,
  multicastFlexMessage,
  AttendanceSummaryData,
} from "@/scripts/LineMessage";
import { PoolConnection } from "mariadb";

const attendance_Table = process.env.MARIA_DB_TABLE_ATTENDANCE;
const students_Table = process.env.MARIA_DB_TABLE_STUDENTS;

// ชื่อชั้นเรียน
const classNames = [
  "มัธยมศึกษาปีที่ 1",
  "มัธยมศึกษาปีที่ 2",
  "มัธยมศึกษาปีที่ 3",
  "มัธยมศึกษาปีที่ 4",
  "มัธยมศึกษาปีที่ 5",
  "มัธยมศึกษาปีที่ 6",
];

interface ClassStats {
  total: number;
  present: number;
  absent: number;
}

// ดึงข้อมูลสถิติการเข้าเรียนจาก MariaDB
async function getAttendanceStats(): Promise<AttendanceSummaryData | null> {
  let conn: PoolConnection | undefined;
  
  try {
    conn = await MariaDBConnection.getConnection();
    
    // กำหนดช่วงเวลาวันนี้
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    // ดึงข้อมูลนักเรียนทั้งหมดแยกตามชั้น
    const studentsQuery = `SELECT CLASSES, COUNT(*) as count FROM ${students_Table} GROUP BY CLASSES`;
    const studentCounts = await conn.query(studentsQuery);
    
    // ดึงข้อมูลการเข้าเรียนวันนี้แยกตามชั้นและสถานะ
    const attendanceQuery = `
      SELECT CLASSES, STATUS, COUNT(*) as count 
      FROM ${attendance_Table} 
      WHERE CREATED_AT BETWEEN ? AND ?
      GROUP BY CLASSES, STATUS
    `;
    const attendanceData = await conn.query(attendanceQuery, [startOfDay, endOfDay]);
    
    // สร้าง map สำหรับเก็บสถิติแต่ละชั้น
    const statsMap = new Map<string, ClassStats>();
    
    // Initialize ทุกชั้น
    for (const className of classNames) {
      statsMap.set(className, { total: 0, present: 0, absent: 0 });
    }
    
    // ใส่จำนวนนักเรียนทั้งหมดแต่ละชั้น
    for (const row of studentCounts) {
      const stats = statsMap.get(row.CLASSES);
      if (stats) {
        stats.total = Number(row.count);
      }
    }
    
    // ใส่จำนวนมา/ขาด
    for (const row of attendanceData) {
      const stats = statsMap.get(row.CLASSES);
      if (stats) {
        if (row.STATUS === "join" || row.STATUS === "late") {
          stats.present += Number(row.count);
        } else if (row.STATUS === "absent" || row.STATUS === "leave") {
          stats.absent += Number(row.count);
        }
      }
    }
    
    // คำนวณ absent จากคนที่ไม่ได้ scan
    for (const [className, stats] of statsMap) {
      const scanned = stats.present + stats.absent;
      if (scanned < stats.total) {
        stats.absent = stats.total - stats.present;
      }
    }
    
    // สร้าง AttendanceSummaryData
    const m1 = statsMap.get(classNames[0])!;
    const m2 = statsMap.get(classNames[1])!;
    const m3 = statsMap.get(classNames[2])!;
    const m4 = statsMap.get(classNames[3])!;
    const m5 = statsMap.get(classNames[4])!;
    const m6 = statsMap.get(classNames[5])!;
    
    const totalPresent = m1.present + m2.present + m3.present + m4.present + m5.present + m6.present;
    const totalAbsent = m1.absent + m2.absent + m3.absent + m4.absent + m5.absent + m6.absent;
    const totalStudents = totalPresent + totalAbsent;
    const percentage = totalStudents > 0 
      ? ((totalPresent / totalStudents) * 100).toFixed(2) 
      : "0.00";
    
    const data: AttendanceSummaryData = {
      date: new Date().toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      totalm1: m1.total, t1: m1.present, f1: m1.absent,
      totalm2: m2.total, t2: m2.present, f2: m2.absent,
      totalm3: m3.total, t3: m3.present, f3: m3.absent,
      totalm4: m4.total, t4: m4.present, f4: m4.absent,
      totalm5: m5.total, t5: m5.present, f5: m5.absent,
      totalm6: m6.total, t6: m6.present, f6: m6.absent,
      totalPresent,
      totalAbsent,
      percentage,
    };
    
    return data;
  } catch (error) {
    console.error("[dailyReport] Error fetching attendance stats:", error);
    return null;
  } finally {
    if (conn) conn.release();
  }
}

// ดึง LINE user IDs (ใช้จาก env)
function getLineUserIds(): string[] {
  const lineTestUserId = process.env.LINE_GROUP_ID;
  if (!lineTestUserId) {
    console.error("[dailyReport] LINE_GROUP_ID not set in .env");
    return [];
  }
  return [lineTestUserId];
}

// ฟังก์ชันหลักสำหรับส่งรายงานประจำวัน
export async function sendDailyReport(): Promise<{
  success: boolean;
  message: string;
  userCount?: number;
}> {
  try {
    console.log("[dailyReport] Starting daily report generation...");
    
    // 1. ดึงข้อมูลสถิติการเข้าเรียน
    const stats = await getAttendanceStats();
    if (!stats) {
      return { success: false, message: "ไม่สามารถดึงข้อมูลการเข้าเรียนได้" };
    }
    
    // 2. ดึง LINE user IDs
    const userIds = getLineUserIds();
    if (userIds.length === 0) {
      return { success: false, message: "ไม่มี LINE user ที่ active" };
    }
    
    // 3. สร้าง Flex Message
    const flexMessage = createAttendanceSummaryFlexMessage(stats);
    
    // 4. ส่ง multicast
    await multicastFlexMessage(userIds, flexMessage, "cron-daily-report");
    
    console.log(`[dailyReport] Successfully sent to ${userIds.length} users`);
    return { 
      success: true, 
      message: `ส่งรายงานสำเร็จ`, 
      userCount: userIds.length 
    };
  } catch (error) {
    console.error("[dailyReport] Error:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : String(error) 
    };
  }
}
