import { auth } from "../../../lib/auth";
import { NextResponse } from "next/server";
import { MariaDBConnection } from "../../../lib/config.mariaDB";
const MARIA_DB_TABLE_EVENTS = process.env.MARIA_DB_TABLE_EVENTS;
export async function GET(req) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({
            error: "Unauthorized",
            message: "คุณไม่ได้ยืนยันตัวตน",
            code: "UNAUTHORIZED",
        }, { status: 401 });
    }
    if (session.user.role !== "teacher") {
        return NextResponse.json({ error: "Forbidden", message: "คุณไม่ได้รับอนุญาต", code: "FORBIDDEN" }, { status: 403 });
    }
    let conn;
    try {
        conn = await MariaDBConnection.getConnection();
        const query = `SELECT * FROM ${MARIA_DB_TABLE_EVENTS}`;
        const payload = await conn.query(query);
        conn.end();
        return NextResponse.json({ success: true, message: payload, code: "SUCCESS" }, { status: 200 });
    }
    catch (error) {
        console.error(error);
        return NextResponse.json({
            error: "Internal Server Error",
            message: error,
            code: "INTERNAL_SERVER_ERROR",
        }, { status: 500 });
    }
    finally {
        if (conn)
            conn.release();
    }
}
export async function POST(req) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({
            error: "Unauthorized",
            message: "คุณไม่ได้ยืนยันตัวตน",
            code: "UNAUTHORIZED",
        }, { status: 401 });
    }
    if (session.user.role !== "teacher") {
        return NextResponse.json({ error: "Forbidden", message: "คุณไม่ได้รับอนุญาต", code: "FORBIDDEN" }, { status: 403 });
    }
    let conn;
    try {
        const body = await req.json();
        const { name, type, description, eventDate, startTime, endTime, targetClasses, periods, createdBy, } = body;
        if (!name || !eventDate) {
            return NextResponse.json({
                error: "Bad Request",
                message: "name and eventDate are required",
                code: "BAD_REQUEST",
            }, { status: 400 });
        }
        conn = await MariaDBConnection.getConnection();
        const query = `
      INSERT INTO ${MARIA_DB_TABLE_EVENTS} 
      (NAME, TYPE, DESCRIPTION, EVENT_DATE, START_TIME, END_TIME, TARGET_CLASSES, PERIODS, STATUS, CREATED_BY) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', ?)
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
            createdBy || "Unknown",
        ]);
        return NextResponse.json({ success: true, message: "สร้างกิจกรรมสำเร็จ", code: "SUCCESS" }, { status: 200 });
    }
    catch (error) {
        console.error(error);
        return NextResponse.json({
            error: "Internal Server Error",
            message: error,
            code: "INTERNAL_SERVER_ERROR",
        }, { status: 500 });
    }
    finally {
        if (conn)
            conn.release();
    }
}
