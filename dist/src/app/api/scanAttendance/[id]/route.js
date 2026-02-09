import { NextResponse } from "next/server";
import { auth } from "../../../../lib/auth";
import { MariaDBConnection } from "../../../../lib/config.mariaDB";
const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);
const endOfDay = new Date();
endOfDay.setHours(23, 59, 59, 999);
const attendance_Table = process.env.MARIA_DB_TABLE_ATTENDANCE;
export async function GET(req, { params }) {
    const session = await auth();
    if (!session)
        return NextResponse.json({
            error: "Unauthorized",
            message: "คุณไม่ได้รับอนุญาต",
            code: "UNAUTHORIZED",
        }, { status: 401 });
    const { id } = await params;
    let conn;
    try {
        conn = await MariaDBConnection.getConnection();
        const query = `SELECT NAME, STATUS, CREATED_AT FROM ${attendance_Table} WHERE STUDENT_ID = ? AND DATE(CREATED_AT) = CURDATE()`;
        const data = conn.execute(query, [id]);
        if (!data) {
            return NextResponse.json({ error: "Not Found", message: "ไม่พบข้อมูล", code: "NOT FOUND" }, { status: 404 });
        }
        return NextResponse.json({
            success: true,
            payload: data,
            code: "SUCCESS",
        }, { status: 200 });
    }
    catch (error) {
        console.error(error);
        return NextResponse.json({
            error: "Internal Server Error",
            message: error,
            code: "INTERNAL_ERROR",
        }, { status: 500 });
    }
}
