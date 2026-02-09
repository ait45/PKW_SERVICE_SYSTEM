import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { PoolConnection } from "mariadb/*";
import { MariaDBConnection } from "@/lib/config.mariaDB";

const MARIA_DB_TABLE_EVENTS = process.env.MARIA_DB_TABLE_EVENTS;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id: eventId } = await params;

  let conn: PoolConnection | undefined;

  try {
    conn = await MariaDBConnection.getConnection();
    const query = `SELECT * FROM ${MARIA_DB_TABLE_EVENTS} WHERE ID = ?`;
    const payload = await conn.query(query, [eventId]);
    return NextResponse.json(
      { success: true, message: payload, code: "SUCCESS" },
      { status: 200 },
    );
  } catch (error) {
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id: eventId } = await params;
  let conn: PoolConnection | undefined;

  try {
    const body = await req.json();
    const {
      name,
      type,
      description,
      eventDate,
      startTime,
      endTime,
      targetClasses,
      periods,
    } = body;

    conn = await MariaDBConnection.getConnection();

    const query = `
      UPDATE ${MARIA_DB_TABLE_EVENTS} 
      SET NAME = ?, TYPE = ?, DESCRIPTION = ?, EVENT_DATE = ?, START_TIME = ?, END_TIME = ?, TARGET_CLASSES = ?, PERIODS = ?
      WHERE ID = ?
    `;

    await conn.execute(query, [
      name,
      type || "activity",
      description || null,
      eventDate,
      startTime || null,
      endTime || null,
      targetClasses || null,
      periods || 1,
      eventId,
    ]);

    return NextResponse.json(
      { success: true, message: "แก้ไขกิจกรรมสำเร็จ", code: "SUCCESS" },
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id: eventId } = await params;

  let conn: PoolConnection | undefined;

  try {
    conn = await MariaDBConnection.getConnection();
    const query = `DELETE FROM ${MARIA_DB_TABLE_EVENTS} WHERE ID = ?`;
    await conn.execute(query, [eventId]);
    return NextResponse.json(
      { success: true, message: "ลบกิจกรรมสำเร็จ", code: "SUCCESS" },
      { status: 200 },
    );
  } catch (error: any) {
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
