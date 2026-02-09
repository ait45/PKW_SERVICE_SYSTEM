"use server";
import { NextResponse } from "next/server";
import { MariaDBConnection } from "../../../../lib/config.mariaDB";
import { startOfWeek, endOfWeek } from "date-fns";
import { auth } from "../../../../lib/auth";
export async function GET() {
    const session = await auth();
    if (!session)
        return NextResponse.json({
            error: "Unauthorized",
            message: "คุณไม่ได้รับอนุญาต",
            code: "UNAUTHORIZED",
        }, { status: 401 });
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    let conn;
    try {
        conn = await MariaDBConnection.getConnection();
        const query = `SELECT 
    DAYOFWEEK(CREATED_AT) as _id,
    SUM(CASE WHEN STATUS = 'เข้าร่วมกิจกรรม' THEN 1 ELSE 0 END) as present,
    SUM(CASE WHEN STATUS = 'ลา' THEN 1 ELSE 0 END) as \`leave\`, -- leave เป็นคำสงวน ต้องใส่ backtick ครอบ
    SUM(CASE WHEN STATUS = 'สาย' THEN 1 ELSE 0 END) as late,
    SUM(CASE WHEN STATUS = 'ขาด' THEN 1 ELSE 0 END) as absent
FROM 
    ${process.env.MARIA_DB_TABLE_ATTENDANCE}
WHERE 
    CREATED_AT >= ? AND CREATED_AT <= ?
GROUP BY 
    DAYOFWEEK(CREATED_AT)
ORDER BY 
    _id ASC;`;
        const data = await conn.query(query, [start, end]);
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
        const weeklyData = days.map((day, i) => {
            const d = data.find((x) => x._id === i + 2);
            return {
                day,
                present: d ? d.present : 0,
                leave: d ? d.leave : 0,
                late: d ? d.late : 0,
                absent: d ? d.absent : 0,
            };
        });
        return NextResponse.json({
            data: weeklyData,
        }, { status: 200 });
    }
    catch (error) {
        console.error("Error fetching weekly chart data:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
            code: "INTERNAL_SERVER_ERROR",
        }, { status: 500 });
    }
    finally {
        if (conn)
            conn.release();
    }
}
