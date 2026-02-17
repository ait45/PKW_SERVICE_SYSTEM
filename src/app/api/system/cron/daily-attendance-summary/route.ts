export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { MariaDBConnection } from "@/lib/config.mariaDB";
import {
  createAttendanceSummaryFlexMessage,
  sendFlexMessageToGroup,
  AttendanceSummaryData,
} from "@/scripts/LineMessage";

const attendance_Table =
  process.env.MARIA_DB_TABLE_ATTENDANCE || "attendance_history_pkw";
const students_Table =
  process.env.MARIA_DB_TABLE_STUDENTS || "data_students_pkw";
const LINE_GROUP_ID = process.env.LINE_GROUP_ID || "";
const CRON_SECRET = process.env.CRON_SECRET || "";

// ฟังก์ชันแปลงวันที่เป็นภาษาไทย
function getThaiDate(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  };
  return now.toLocaleDateString("th-TH", options);
}

// GET - สำหรับ cron job เรียก
export async function GET(req: NextRequest) {
  try {
    // ตรวจสอบ secret (ถ้ามีการตั้งค่า)
    const authHeader = req.headers.get("authorization");
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    if (!LINE_GROUP_ID) {
      return NextResponse.json(
        { error: "LINE_GROUP_ID not configured", code: "CONFIG_ERROR" },
        { status: 500 },
      );
    }

    // ดึงข้อมูลการเข้าเรียนวันนี้
    const conn = await MariaDBConnection.getConnection();

    try {
      // ดึงจำนวนนักเรียนทั้งหมดแยกตามชั้น
      const totalByClass = await conn.query(`
        SELECT 
          CASE 
            WHEN CLASSES LIKE 'ม.1/%' THEN 'ม.1'
            WHEN CLASSES LIKE 'ม.2/%' THEN 'ม.2'
            WHEN CLASSES LIKE 'ม.3/%' THEN 'ม.3'
            WHEN CLASSES LIKE 'ม.4/%' THEN 'ม.4'
            WHEN CLASSES LIKE 'ม.5/%' THEN 'ม.5'
            WHEN CLASSES LIKE 'ม.6/%' THEN 'ม.6'
          END as LEVEL,
          COUNT(*) as TOTAL
        FROM ${students_Table}
        GROUP BY LEVEL
        HAVING LEVEL IS NOT NULL
      `);

      // ดึงจำนวนนักเรียนที่มาเรียนวันนี้แยกตามชั้น
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const presentByClass = await conn.query(
        `
        SELECT 
          CASE 
            WHEN CLASSES LIKE 'ม.1/%' THEN 'ม.1'
            WHEN CLASSES LIKE 'ม.2/%' THEN 'ม.2'
            WHEN CLASSES LIKE 'ม.3/%' THEN 'ม.3'
            WHEN CLASSES LIKE 'ม.4/%' THEN 'ม.4'
            WHEN CLASSES LIKE 'ม.5/%' THEN 'ม.5'
            WHEN CLASSES LIKE 'ม.6/%' THEN 'ม.6'
          END as LEVEL,
          COUNT(DISTINCT STUDENT_ID) as PRESENT
        FROM ${attendance_Table}
        WHERE CREATED_AT BETWEEN ? AND ?
          AND STATUS = 'มา'
        GROUP BY LEVEL
        HAVING LEVEL IS NOT NULL
      `,
        [startOfDay, endOfDay],
      );

      // จัดข้อมูลให้อยู่ในรูปแบบ object
      const totalMap: Record<string, number> = {};
      const presentMap: Record<string, number> = {};

      for (const row of totalByClass as any[]) {
        totalMap[row.LEVEL] = parseInt(row.TOTAL) || 0;
      }

      for (const row of presentByClass as any[]) {
        presentMap[row.LEVEL] = parseInt(row.PRESENT) || 0;
      }

      // สร้างข้อมูลสรุป
      const totalm1 = totalMap["ม.1"] || 0;
      const totalm2 = totalMap["ม.2"] || 0;
      const totalm3 = totalMap["ม.3"] || 0;
      const totalm4 = totalMap["ม.4"] || 0;
      const totalm5 = totalMap["ม.5"] || 0;
      const totalm6 = totalMap["ม.6"] || 0;

      const t1 = presentMap["ม.1"] || 0;
      const t2 = presentMap["ม.2"] || 0;
      const t3 = presentMap["ม.3"] || 0;
      const t4 = presentMap["ม.4"] || 0;
      const t5 = presentMap["ม.5"] || 0;
      const t6 = presentMap["ม.6"] || 0;

      const totalPresent = t1 + t2 + t3 + t4 + t5 + t6;
      const totalStudents =
        totalm1 + totalm2 + totalm3 + totalm4 + totalm5 + totalm6;
      const totalAbsent = totalStudents - totalPresent;
      const percentage =
        totalStudents > 0
          ? ((totalPresent / totalStudents) * 100).toFixed(2)
          : "0.00";

      const summaryData: AttendanceSummaryData = {
        date: getThaiDate(),
        totalm1,
        t1,
        f1: totalm1 - t1,
        totalm2,
        t2,
        f2: totalm2 - t2,
        totalm3,
        t3,
        f3: totalm3 - t3,
        totalm4,
        t4,
        f4: totalm4 - t4,
        totalm5,
        t5,
        f5: totalm5 - t5,
        totalm6,
        t6,
        f6: totalm6 - t6,
        totalPresent,
        totalAbsent,
        percentage,
      };

      // สร้าง Flex Message และส่ง
      const flexMessage = createAttendanceSummaryFlexMessage(summaryData);
      await sendFlexMessageToGroup(LINE_GROUP_ID, flexMessage, "system-cron");

      return NextResponse.json({
        success: true,
        message: "ส่งสรุปการเข้าเรียนไปยังกลุ่ม LINE สำเร็จ",
        data: summaryData,
        code: "SUCCESS",
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : String(error),
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
}

// POST - สำหรับทดสอบด้วย manual trigger
export async function POST(req: NextRequest) {
  return GET(req);
}
