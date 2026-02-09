import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { MariaDBConnection } from "@/lib/config.mariaDB";
import { PoolConnection } from "mariadb";

const NOTIFICATIONS_TABLE = process.env.MARIA_DB_TABLE_NOTIFICATIONS;

export async function GET(req: NextRequest) {
  const session = await auth();
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

  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit") || "20";
  const status = searchParams.get("status"); // active, expired, all

  let conn: PoolConnection | undefined;
  try {
    conn = await MariaDBConnection.getConnection();

    let query = `SELECT * FROM ${NOTIFICATIONS_TABLE}`;
    const params: any[] = [];

    if (status === "active") {
      query += ` WHERE STATUS = 'active' AND (EXPIRE_DATE IS NULL OR EXPIRE_DATE >= CURDATE())`;
    } else if (status === "expired") {
      query += ` WHERE STATUS = 'expired' OR (EXPIRE_DATE IS NOT NULL AND EXPIRE_DATE < CURDATE())`;
    }

    query += ` ORDER BY IS_PINNED DESC, CREATED_AT DESC LIMIT ?`;
    params.push(parseInt(limit));

    const data = await conn.query(query, params);

    return NextResponse.json(
      { success: true, message: data, code: "SUCCESS" },
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

export async function POST(req: NextRequest) {
  const session = await auth();
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
  if (session.user.role !== "teacher") {
    return NextResponse.json(
      { error: "Forbidden", message: "คุณไม่ได้รับอนุญาต", code: "FORBIDDEN" },
      { status: 403 },
    );
  }

  let conn: PoolConnection | undefined;
  try {
    const body = await req.json();
    const { title, content, type, targetAudience, expireDate, isPinned } = body;

    if (!title || !content) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "title and content are required",
          code: "BAD_REQUEST",
        },
        { status: 400 },
      );
    }

    conn = await MariaDBConnection.getConnection();

    const query = `
      INSERT INTO ${NOTIFICATIONS_TABLE} 
      (TITLE, CONTENT, TYPE, TARGET_AUDIENCE, EXPIRE_DATE, IS_PINNED, STATUS, CREATED_BY) 
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
    `;

    await conn.execute(query, [
      title,
      content,
      type || "general",
      targetAudience || "all",
      expireDate || null,
      isPinned ? 1 : 0,
      session.user.name || "Unknown",
    ]);

    return NextResponse.json(
      { success: true, message: "สร้างประกาศสำเร็จ", code: "SUCCESS" },
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
  if (session.user.role !== "teacher") {
    return NextResponse.json(
      { error: "Forbidden", message: "ไม่มีสิทธิ์", code: "FORBIDDEN" },
      { status: 403 },
    );
  }

  let conn: PoolConnection | undefined;
  try {
    const body = await req.json();
    const {
      id,
      title,
      content,
      type,
      targetAudience,
      expireDate,
      isPinned,
      status,
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "id จำเป็นต้องกรอก",
          code: "BAD_REQUEST",
        },
        { status: 400 },
      );
    }

    conn = await MariaDBConnection.getConnection();

    const query = `
      UPDATE ${NOTIFICATIONS_TABLE} 
      SET TITLE = ?, CONTENT = ?, TYPE = ?, TARGET_AUDIENCE = ?, EXPIRE_DATE = ?, IS_PINNED = ?, STATUS = ?
      WHERE ID = ?
    `;

    await conn.execute(query, [
      title,
      content,
      type || "general",
      targetAudience || "all",
      expireDate || null,
      isPinned ? 1 : 0,
      status || "active",
      id,
    ]);

    return NextResponse.json(
      { success: true, message: "แก้ไขประกาศสำเร็จ", code: "SUCCESS" },
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
  if (session.user.role !== "teacher") {
    return NextResponse.json(
      { error: "Forbidden", message: "คุณไม่ได้รับอนุญาต", code: "FORBIDDEN" },
      { status: 403 },
    );
  }

  let conn: PoolConnection | undefined;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "id จำเป็ฯต้องกรอก",
          code: "BAD_REQUEST",
        },
        { status: 400 },
      );
    }

    conn = await MariaDBConnection.getConnection();

    const query = `DELETE FROM ${NOTIFICATIONS_TABLE} WHERE ID = ?`;
    await conn.execute(query, [id]);

    return NextResponse.json(
      { success: true, message: "ลบประกาศสำเร็จ", code: "SUCCESS" },
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
