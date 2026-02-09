import { auth } from "../../../lib/auth";
import { NextResponse } from "next/server";
import { MariaDBConnection } from "../../../lib/config.mariaDB";
const EVENTS_TABLE = process.env.MARIA_DB_TABLE_EVENTS;
const EVENT_ATTENDANCE_TABLE = process.env.MARIA_DB_TABLE_EVENT_ATTENDANCE;
const STUDENTS_TABLE = process.env.MARIA_DB_TABLE_STUDENTS;
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
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    if (!eventId) {
        return NextResponse.json({
            error: "Bad Request",
            message: "eventId is required",
            code: "BAD_REQUEST",
        }, { status: 400 });
    }
    let conn;
    try {
        conn = await MariaDBConnection.getConnection();
        const query = `SELECT * FROM ${EVENT_ATTENDANCE_TABLE} WHERE EVENT_ID = ? ORDER BY CLASSES, NAME`;
        const data = await conn.query(query, [eventId]);
        return NextResponse.json({ success: true, message: data, code: "SUCCESS" }, { status: 200 });
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
        const { eventId, studentId, handler, status } = body;
        if (!eventId || !studentId) {
            return NextResponse.json({
                error: "Bad Request",
                message: "eventId and studentId are required",
                code: "BAD_REQUEST",
            }, { status: 400 });
        }
        conn = await MariaDBConnection.getConnection();
        // Insert attendance record, pull student info from students table
        const query = `
      INSERT INTO ${EVENT_ATTENDANCE_TABLE} 
      (EVENT_ID, HANDLER, STUDENT_ID, NAME, CLASSES, STATUS) 
      SELECT ?, ?, STUDENT_ID, NAME, CLASSES, ? 
      FROM ${STUDENTS_TABLE} 
      WHERE STUDENT_ID = ?
    `;
        const result = await conn.execute(query, [
            eventId,
            handler,
            status,
            studentId,
        ]);
        if (result.affectedRows === 0) {
            return NextResponse.json({
                error: "Not Found",
                message: "ไม่พบรหัสนักเรียนในระบบ",
                code: "NOT_FOUND",
            }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: "เช็คชื่อสำเร็จ", code: "SUCCESS" }, { status: 200 });
    }
    catch (error) {
        console.error(error);
        // Duplicate entry error (student already checked in for this event)
        if (error.errno === 1062) {
            return NextResponse.json({
                error: "Conflict",
                message: "นักเรียนคนนี้ได้เช็คชื่อไปแล้ว",
                code: "CONFLICT",
            }, { status: 409 });
        }
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
export async function PUT(req) {
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
        const { eventId, updates, handler } = body;
        if (!eventId || !updates || !Array.isArray(updates)) {
            return NextResponse.json({
                error: "Bad Request",
                message: "eventId and updates array are required",
                code: "BAD_REQUEST"
            }, { status: 400 });
        }
        conn = await MariaDBConnection.getConnection();
        for (const item of updates) {
            const { studentId, name, classes, status, isUpdate, recordId } = item;
            if (isUpdate && recordId) {
                // Update existing record
                const updateQuery = `UPDATE ${EVENT_ATTENDANCE_TABLE} SET STATUS = ?, HANDLER = ? WHERE ID = ?`;
                await conn.execute(updateQuery, [status, handler, recordId]);
            }
            else {
                // Insert new record
                const insertQuery = `
          INSERT INTO ${EVENT_ATTENDANCE_TABLE} 
          (EVENT_ID, HANDLER, STUDENT_ID, NAME, CLASSES, STATUS) 
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE STATUS = VALUES(STATUS), HANDLER = VALUES(HANDLER)
        `;
                await conn.execute(insertQuery, [
                    eventId,
                    handler,
                    studentId,
                    name,
                    classes,
                    status,
                ]);
            }
        }
        return NextResponse.json({ success: true, message: "อัพเดตข้อมูลสำเร็จ", code: "SUCCESS" }, { status: 200 });
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
