"use server";
import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { MariaDBConnection } from "@/lib/config.mariaDB";
import { MongoDBConnection } from "@/lib/config.mongoDB";
import RetroactiveRequest from "@/models/Mongo.model.RetroactiveRequest";
import { update_behaviorScore_retroactive } from "@/scripts/behaviorScore-deduction";
import type { PoolConnection } from "mariadb";

const attendance_Table = process.env.MARIA_DB_TABLE_ATTENDANCE;
const students_Table = process.env.MARIA_DB_TABLE_STUDENTS;

/**
 * GET - ดึงข้อมูลเช็คชื่อของวันที่ระบุ
 * Query: ?date=YYYY-MM-DD
 * หรือ: ?pending=true (ดึงคำขอ pending สำหรับ Admin)
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "คุณไม่ได้รับอนุญาต",
        code: "UNAUTHORIZED",
      },
      { status: 401 },
    );
  }
  if (session.user.role !== "teacher") {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "คุณไม่มีสิทธิ์เข้าถึง",
        code: "FORBIDDEN",
      },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(req.url);
  const pending = searchParams.get("pending");

  // ดึงคำขอ pending (Admin only)
  if (pending === "true") {
    if (!session.user.isAdmin) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "เฉพาะ Admin เท่านั้น",
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }

    try {
      await MongoDBConnection();
      const requests = await RetroactiveRequest.find()
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json(
        { success: true, payload: requests },
        { status: 200 },
      );
    } catch (error) {
      console.error("[Retroactive] Error fetching pending:", error);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "เกิดข้อผิดพลาด",
          code: "INTERNAL_ERROR",
        },
        { status: 500 },
      );
    }
  }

  // ดึงข้อมูลเช็คชื่อของวันที่ระบุ
  const date = searchParams.get("date");
  if (!date) {
    return NextResponse.json(
      { error: "Bad Request", message: "กรุณาระบุวันที่", code: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  let conn: PoolConnection | undefined;
  try {
    conn = await MariaDBConnection.getConnection();
    const query = `SELECT HANDLER, STUDENT_ID, NAME, CLASSES, STATUS, CREATED_AT FROM ${attendance_Table} WHERE DATE(CREATED_AT) = ? ORDER BY CREATED_AT DESC`;
    const data = await conn.query(query, [date]);

    // ดึงข้อมูลนักเรียนทั้งหมดมาด้วย
    const studentsQuery = `SELECT STUDENT_ID, NAME, CLASSES FROM ${students_Table}`;
    const students = await conn.query(studentsQuery);

    return NextResponse.json(
      {
        success: true,
        attendance: data.map((row: any) => ({
          handler: row.HANDLER,
          studentId: row.STUDENT_ID,
          name: row.NAME,
          classes: row.CLASSES,
          status: row.STATUS,
          createdAt: row.CREATED_AT,
        })),
        students: students.map((s: any) => ({
          studentId: s.STUDENT_ID,
          name: s.NAME,
          classes: s.CLASSES,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Retroactive] Error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "เกิดข้อผิดพลาด",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  } finally {
    if (conn) conn.release();
  }
}

/**
 * POST - เช็คชื่อ/แก้ไขย้อนหลัง
 * Admin: บันทึกทันที
 * ครู: สร้าง pending request
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "คุณไม่ได้รับอนุญาต",
        code: "UNAUTHORIZED",
      },
      { status: 401 },
    );
  }
  if (session.user.role !== "teacher") {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "คุณไม่มีสิทธิ์เข้าถึง",
        code: "FORBIDDEN",
      },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const { date, changes, reason } = body;

    if (!date || !changes || !Array.isArray(changes) || changes.length === 0) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "ข้อมูลไม่ครบถ้วน",
          code: "BAD_REQUEST",
        },
        { status: 400 },
      );
    }

    // ตรวจสอบว่าวันที่ไม่เกินวันนี้
    const targetDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (targetDate > today) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "ไม่สามารถเช็คชื่อล่วงหน้าได้",
          code: "FUTURE_DATE",
        },
        { status: 400 },
      );
    }

    if (session.user.isAdmin) {
      // Admin: บันทึกทันที
      const handler = session.user.username || "admin";
      const changesWithHandler = changes.map((c: any) => ({
        ...c,
        handler,
      }));
      await update_behaviorScore_retroactive(changesWithHandler, date);

      return NextResponse.json(
        {
          success: true,
          message: "บันทึกเช็คชื่อย้อนหลังสำเร็จ",
          code: "SUCCESS",
        },
        { status: 200 },
      );
    } else {
      // ครู: สร้าง pending request
      if (!reason || reason.trim() === "") {
        return NextResponse.json(
          {
            error: "Bad Request",
            message: "กรุณาระบุเหตุผล",
            code: "REASON_REQUIRED",
          },
          { status: 400 },
        );
      }

      await MongoDBConnection();
      const request = new RetroactiveRequest({
        requestedBy: session.user.username,
        requestedByName: session.user.name,
        targetDate: new Date(date),
        changes,
        reason,
        status: "pending",
      });
      await request.save();

      return NextResponse.json(
        {
          success: true,
          message: "ส่งคำขอเช็คชื่อย้อนหลังสำเร็จ รอ Admin อนุมัติ",
          code: "PENDING",
        },
        { status: 201 },
      );
    }
  } catch (error: any) {
    console.error("[Retroactive] POST Error:", error);
    if (error.errno === 1062) {
      return NextResponse.json(
        {
          error: "Conflict",
          message: "นักเรียนถูกเช็คชื่อวันนี้แล้ว",
          code: "CONFLICT",
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "เกิดข้อผิดพลาด",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
}
