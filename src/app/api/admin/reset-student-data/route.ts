import { auth } from "@/lib/auth";
import { NextResponse, NextRequest } from "next/server";
import { MariaDBConnection } from "@/lib/config.mariaDB";
import { MongoDBConnection } from "@/lib/config.mongoDB";
import { PoolConnection } from "mariadb/*";
import Student from "@/models/Mongo.model.Student";

const studentTable = process.env.MARIA_DB_TABLE_STUDENTS;
const attendanceTable = process.env.MARIA_DB_TABLE_ATTENDANCE;

export async function POST(req: NextRequest) {
  const session = await auth();

  // ตรวจสอบ authentication
  if (!session) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "คุณไม่ได้ยืนยันตัวตน",
        code: "UNAUTHORIZED",
      },
      { status: 401 },
    );
  }

  // ตรวจสอบว่าเป็น admin เท่านั้น
  if (session.user.role !== "teacher" || !session.user.isAdmin) {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "เฉพาะแอดมินเท่านั้นที่สามารถรีเซ็ตข้อมูลได้",
        code: "FORBIDDEN",
      },
      { status: 403 },
    );
  }

  let conn: PoolConnection | undefined;
  try {
    const body = await req.json();
    const {
      resetType, // "all" | "attendance" | "scores" | "specific_student"
      studentId, // ใช้เมื่อ resetType เป็น "specific_student"
      confirmPassword, // ต้องยืนยันรหัสผ่านก่อนรีเซ็ต
    } = body;

    // ตรวจสอบว่ากรอก confirmPassword ถูกต้อง
    if (!confirmPassword || confirmPassword !== "CONFIRM_RESET") {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "กรุณายืนยันการรีเซ็ตโดยพิมพ์ 'CONFIRM_RESET'",
          code: "CONFIRMATION_REQUIRED",
        },
        { status: 400 },
      );
    }

    conn = await MariaDBConnection.getConnection();
    await conn.beginTransaction();
    await MongoDBConnection();

    let affectedRows = 0;
    let message = "";

    switch (resetType) {
      case "all":
        // รีเซ็ตข้อมูลทั้งหมด (คะแนนและการเช็คชื่อ)
        const resetAllQuery = `DELETE FROM ${studentTable}`;
        const result1 = await conn.execute(resetAllQuery);
        affectedRows = result1.affectedRows;
        // ลบประวัติการเช็คชื่อทั้งหมด
        await conn.execute(`DELETE FROM ${attendanceTable}`);
        // ลบข้อมูลการเข้าสู่ระบบทั้งหมด
        await Student.deleteMany({});
        message = `รีเซ็ตข้อมูลทั้งหมดสำเร็จ (${affectedRows} นักเรียน)`;
        break;

      case "attendance":
        // รีเซ็ตเฉพาะข้อมูลการเช็คชื่อ
        const resetAttendanceQuery = `
          UPDATE ${studentTable} SET 
            JOIN_DAYS = 0, 
            LEAVE_DAYS = 0, 
            LATE_DAYS = 0, 
            ABSENT_DAYS = 0
        `;
        const result2 = await conn.execute(resetAttendanceQuery);
        affectedRows = result2.affectedRows;

        await conn.execute(`DELETE FROM ${attendanceTable}`);
        message = `รีเซ็ตข้อมูลการเช็คชื่อสำเร็จ (${affectedRows} นักเรียน)`;
        break;

      case "scores":
        // รีเซ็ตเฉพาะคะแนนพฤติกรรม
        const resetScoresQuery = `UPDATE ${studentTable} SET BEHAVIOR_SCORE = 100`;
        const result3 = await conn.execute(resetScoresQuery);
        affectedRows = result3.affectedRows;
        message = `รีเซ็ตคะแนนพฤติกรรมสำเร็จ (${affectedRows} นักเรียน)`;
        break;

      case "specific_student":
        if (!studentId) {
          await conn.rollback();
          return NextResponse.json(
            {
              error: "Bad Request",
              message: "กรุณาระบุรหัสนักเรียน",
              code: "STUDENT_ID_REQUIRED",
            },
            { status: 400 },
          );
        }

        // รีเซ็ตข้อมูลนักเรียนเฉพาะคน
        const resetStudentQuery = `
          UPDATE ${studentTable} SET 
            JOIN_DAYS = 0, 
            LEAVE_DAYS = 0, 
            LATE_DAYS = 0, 
            ABSENT_DAYS = 0, 
            BEHAVIOR_SCORE = 100
          WHERE STUDENT_ID = ?
        `;
        const result4 = await conn.execute(resetStudentQuery, [studentId]);
        affectedRows = result4.affectedRows;

        // ลบประวัติการเช็คชื่อของนักเรียนคนนี้
        await conn.execute(
          `DELETE FROM ${attendanceTable} WHERE STUDENT_ID = ?`,
          [studentId],
        );

        if (affectedRows === 0) {
          await conn.rollback();
          return NextResponse.json(
            {
              error: "Not Found",
              message: "ไม่พบนักเรียนรหัสนี้",
              code: "STUDENT_NOT_FOUND",
            },
            { status: 404 },
          );
        }
        message = `รีเซ็ตข้อมูลนักเรียนรหัส ${studentId} สำเร็จ`;
        break;

      case "today_attendance":
        // ลบเฉพาะข้อมูลการเช็คชื่อวันนี้
        const deleteTodayQuery = `DELETE FROM ${attendanceTable} WHERE DATE(CREATED_AT) = CURDATE()`;
        const result5 = await conn.execute(deleteTodayQuery);
        affectedRows = result5.affectedRows;
        message = `ลบข้อมูลการเช็คชื่อวันนี้สำเร็จ (${affectedRows} รายการ)`;
        break;

      default:
        await conn.rollback();
        return NextResponse.json(
          {
            error: "Bad Request",
            message: "ประเภทการรีเซ็ตไม่ถูกต้อง",
            code: "INVALID_RESET_TYPE",
          },
          { status: 400 },
        );
    }

    await conn.commit();

    // บันทึก log การรีเซ็ต
    console.log(
      `[Admin Reset] ${session?.user?.name} (${session?.user?.id}) performed ${resetType} reset. Affected: ${affectedRows}`,
    );

    return NextResponse.json(
      {
        success: true,
        message,
        affectedRows,
        resetType,
        performedBy: session.user.name,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    if (conn) await conn.rollback();
    console.error("[Admin Reset] Error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error,
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  } finally {
    if (conn) conn.release();
  }
}

// GET: ดึงข้อมูลสถิติปัจจุบัน (สำหรับแสดงก่อนรีเซ็ต)
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized", message: "คุณไม่ได้ยืนยันตัวตน" },
      { status: 401 },
    );
  }

  if (session.user.role !== "teacher" || !session.user.isAdmin) {
    return NextResponse.json(
      { error: "Forbidden", message: "เฉพาะแอดมินเท่านั้น" },
      { status: 403 },
    );
  }

  let conn: PoolConnection | undefined;
  try {
    conn = await MariaDBConnection.getConnection();

    // นับจำนวนนักเรียนทั้งหมด
    const [totalStudents] = await conn.query(
      `SELECT COUNT(*) as count FROM ${studentTable}`,
    );

    // นับจำนวนการเช็คชื่อทั้งหมด
    const [totalAttendance] = await conn.query(
      `SELECT COUNT(*) as count FROM ${attendanceTable}`,
    );

    // นับจำนวนการเช็คชื่อวันนี้
    const [todayAttendance] = await conn.query(
      `SELECT COUNT(*) as count FROM ${attendanceTable} WHERE DATE(CREATED_AT) = CURDATE()`,
    );

    return NextResponse.json({
      success: true,
      data: {
        totalStudents: totalStudents.count,
        totalAttendanceRecords: totalAttendance.count,
        todayAttendanceRecords: todayAttendance.count,
      },
    });
  } catch (error) {
    console.error("[Admin Reset] GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error },
      { status: 500 },
    );
  } finally {
    if (conn) conn.release();
  }
}
