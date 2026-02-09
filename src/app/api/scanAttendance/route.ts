"use server";
import { NextResponse, NextRequest } from "next/server";
import { cutoff, attendanceStart } from "@/scripts/checkCutoff";
import { update_behaviorScore } from "@/scripts/behaviorScore-deduction";
import { MariaDBConnection } from "@/lib/config.mariaDB";
import { PoolConnection } from "mariadb";
import { auth } from "@/lib/auth";
import { position } from "html2canvas/dist/types/css/property-descriptors/position";

const now = new Date();
const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);
const endOfDay = new Date();
endOfDay.setHours(23, 59, 59, 999);

const attendance_Table = process.env.MARIA_DB_TABLE_ATTENDANCE;
const students_Table = process.env.MARIA_DB_TABLE_STUDENTS;

interface DataAttendance {
  HANDLER: string;
  STUDENT_ID: string;
  NAME: string;
  CLASSES: string;
  STATUS: string;
  CREATED_AT: Date;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "ต้องยืนยันตัวตนก่อนใช้งาน",
        code: "UNAUTHORIZED",
      },
      { status: 401 },
    );
  if (session?.user?.isAdmin === false)
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "คุณไม่มีสิทธิ์ในการเข้าถึงข้อมูลนี้",
        code: "FORBIDDEN",
      },
      { status: 403 },
    );
  let conn: PoolConnection | undefined;
  try {
    if (await attendanceStart()) {
      const post = await req.json();

      const id = typeof post.id === "object" ? post.id.id : post.id;
      conn = await MariaDBConnection.getConnection();
      const status = await cutoff();
      console.log([post.handler, status, id]);
      const query: string = `INSERT INTO ${attendance_Table} (HANDLER, STUDENT_ID, NAME, CLASSES, STATUS) SELECT ?, STUDENT_ID, NAME, CLASSES, ? FROM ${students_Table} WHERE STUDENT_ID = ?`;
      const result = await conn.execute(query, [post.handler, status, id]);
      if (result.affectedRows === 0) {
        return NextResponse.json(
          {
            error: "Not Found",
            message: "ไม่พบรหัสนักเรียนในระบบ",
            code: "NOT_FOUND",
          },
          { status: 404 },
        );
      }
      return NextResponse.json(
        {
          success: true,
          message: "เช็คชื่อสำเร็จ",
          code: "SUCCESS",
        },
        { status: 200 },
      );
    }
  } catch (error: any) {
    if (error.errno === 1062) {
      return NextResponse.json(
        {
          error: "Conflict",
          message: "วันนี้ได้ทำการเช็คชื่อไปแล้ว",
          code: "CONFLICT",
        },
        { status: 409 },
      );
    } else {
      return NextResponse.json({
        error: "Internal Server Error",
        message: error,
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  } finally {
    if (conn) conn.release();
  }
}

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
  let conn: PoolConnection | undefined;
  try {
    conn = await MariaDBConnection.getConnection();

    const query = `SELECT * FROM ${attendance_Table} WHERE CREATED_AT BETWEEN ? AND ? ORDER BY CREATED_AT DESC`;

    const data = await conn.query(query, [startOfDay, endOfDay]);

    if (data.length === 0)
      return NextResponse.json(
        { error: "Not Found", message: "ไม่พบข้อมูล", code: "NOT_FOUND" },
        { status: 404 },
      );

    const payload = data.map((index: DataAttendance) => {
      return {
        handler: index.HANDLER,
        studentId: index.STUDENT_ID,
        name: index.NAME,
        classes: index.CLASSES,
        status: index.STATUS,
        createdAt: index.CREATED_AT,
      };
    });

    return NextResponse.json(
      { success: true, message: payload },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
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
export async function PUT(req: NextRequest) {
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

  const list = await req.json();
  if (!Array.isArray(list)) {
    return NextResponse.json(
      {
        error: "Data must be an array",
        message: "Data ต้องเป็น list",
        code: "DATA_TYPE_IS_LIST_ONLY",
      },
      { status: 400 },
    );
  }
  try {
    await update_behaviorScore(list);
    return NextResponse.json(
      { success: true, message: "แก้ไขข้อมูลเสร็จสิ้น", code: "SUCCESS" },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Bad Request",
        message: error,
        code: "BAD_REQUEST",
      },
      { status: 400 },
    );
  }
}