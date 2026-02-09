import { auth } from "@/lib/auth";
import { NextResponse, NextRequest } from "next/server";
import { MariaDBConnection } from "@/lib/config.mariaDB";
import { PoolConnection } from "mariadb/*";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "คุณไม่ได้รับอนุญาต",
        code: "UNAUTHORIZED",
      },
      { status: 401 },
    );

  let conn: PoolConnection | undefined;
  try {
    conn = await MariaDBConnection.getConnection();
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const dayOfWeek = searchParams.get("dayOfWeek");

    let query = `
      SELECT s.*, t.NAME as TEACHER_NAME 
      FROM ${process.env.MARIA_DB_TABLE_SCHEDULE} s
      LEFT JOIN ${process.env.MARIA_DB_TABLE_TEACHERS} t ON s.TEACHER_ID = t.TEACHER_ID
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (classId) {
      query += ` AND s.CLASS_ID COLLATE utf8mb4_general_ci = ?`;
      params.push(classId);
    }

    if (dayOfWeek) {
      query += ` AND s.DAY_OF_WEEK = ?`;
      params.push(parseInt(dayOfWeek));
    }

    query += ` ORDER BY s.DAY_OF_WEEK, s.PERIOD`;

    const payload = await conn.query(query, params);

    return NextResponse.json({ success: true, data: payload }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error,
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 },
    );
  } finally {
    if (conn) conn.release();
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "คุณไม่ได้รับอนุญาต",
        code: "UNAUTHORIZED",
      },
      { status: 401 },
    );
  if (session.user.role !== "teacher")
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "คุณไม่มีสิทธิ์เข้าถึง",
        code: "FORBIDDEN",
      },
      { status: 403 },
    );

  let conn;
  try {
    const body = await req.json();
    const { classId, dayOfWeek, period, subject, teacherId, room } = body;

    if (!classId || !dayOfWeek || !period || !subject) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "กรุณากรอกข้อมูลที่จำเป็น",
          code: "BAD_REQUEST",
        },
        { status: 400 },
      );
    }

    conn = await MariaDBConnection.getConnection();

    // Check for duplicate
    const checkQuery = `
      SELECT ID FROM ${process.env.MARIA_DB_TABLE_SCHEDULE}
      WHERE CLASS_ID = ? AND DAY_OF_WEEK = ? AND PERIOD = ?
    `;
    const existing = await conn.query(checkQuery, [classId, dayOfWeek, period]);

    if (existing.length > 0) {
      return NextResponse.json(
        {
          error: "Conflict",
          message: "มีรายการซ้ำในคาบนี้แล้ว",
          code: "CONFLICT",
        },
        { status: 409 },
      );
    }

    const query = `
      INSERT INTO ${process.env.MARIA_DB_TABLE_SCHEDULE} 
      (CLASS_ID, DAY_OF_WEEK, PERIOD, SUBJECT, TEACHER_ID, ROOM) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await conn.query(query, [
      classId,
      dayOfWeek,
      period,
      subject,
      teacherId || null,
      room || null,
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "เพิ่มตารางเรียนสำเร็จ",
        code: "ADD_TABLE_SUCCESS",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error,
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 },
    );
  } finally {
    if (conn) conn.release();
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "คุณไม่ได้รับอนุญาต",
        code: "UNAUTHORIZED",
      },
      { status: 401 },
    );
  if (session.user.role !== "teacher")
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "คุณไม่มีสิทธิ์เข้าถึง",
        code: "FORBIDDEN",
      },
      { status: 403 },
    );

  let conn;
  try {
    const body = await req.json();
    const { id, classId, dayOfWeek, period, subject, teacherId, room } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Bad Request", message: "ต้องระบุ id", code: "BAD_REQUEST" },
        { status: 400 },
      );
    }

    conn = await MariaDBConnection.getConnection();
    const query = `
      UPDATE ${process.env.MARIA_DB_TABLE_SCHEDULE} SET 
      CLASS_ID = ?, DAY_OF_WEEK = ?, PERIOD = ?, SUBJECT = ?, TEACHER_ID = ?, ROOM = ?
      WHERE ID = ?
    `;

    await conn.query(query, [
      classId,
      dayOfWeek,
      period,
      subject,
      teacherId || null,
      room || null,
      id,
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "แก้ไขตารางเรียนสำเร็จ",
        code: "EDITED_TABLE_SUCCESS",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error,
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 },
    );
  } finally {
    if (conn) conn.release();
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "คุณไม่ได้รับอนุญาต",
        code: "UNAUTHORIZED",
      },
      { status: 401 },
    );
  if (session.user.role !== "teacher")
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "คุณไม่มีสิทธิ์เข้าถึง",
        code: "FORBIDDEN",
      },
      { status: 403 },
    );

  let conn;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Bad Request", message: "ต้องระบุ id", code: "BAD_REQUEST" },
        { status: 400 },
      );
    }

    conn = await MariaDBConnection.getConnection();
    const query = `DELETE FROM ${process.env.MARIA_DB_TABLE_SCHEDULE} WHERE ID = ?`;
    await conn.query(query, [id]);

    return NextResponse.json(
      { success: true, message: "ลบรายการสำเร็จ", code: "DELETE_SUCCESS" },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error,
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 },
    );
  } finally {
    if (conn) conn.release();
  }
}
