
import { NextRequest, NextResponse } from "next/server";
import { MariaDBConnection } from "@/lib/config.mariaDB";
import { auth } from "@/lib/auth";
import { PoolConnection } from "mariadb";

const TABLE_STUDENTS = process.env.MARIA_DB_TABLE_STUDENTS;
const TABLE_HISTORY = process.env.MARIA_DB_TABLE_BEHAVIOR_HISTORY || "behavior_history_pkw";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET: Retrieve behavior score history for a student
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized", message: "ต้องยืนยันตัวตนก่อนใช้งาน" },
      { status: 401 }
    );
  }

  let conn: PoolConnection | undefined;
  try {
    const { id } = await params;
    conn = await MariaDBConnection.getConnection();

    // Get history ordered by latest first
    const query = `
      SELECT * FROM ${TABLE_HISTORY} 
      WHERE STUDENT_ID = ? 
      ORDER BY CREATED_AT DESC
    `;
    const history = await conn.execute(query, [id]);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error fetching behavior history:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: String(error) },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}

// POST: Add or deduct behavior score
export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  const session = await auth();
  if (!session || session.user?.role !== "teacher") {
    return NextResponse.json(
      { error: "Unauthorized", message: "ไม่มีสิทธิ์ในการใช้งาน" },
      { status: 403 }
    );
  }

  let conn: PoolConnection | undefined;
  try {
    const { id } = await params;
    const { score, reason } = await req.json();

    if (typeof score !== "number" || !reason) {
      return NextResponse.json(
        { error: "Bad Request", message: "ข้อมูลไม่ครบถ้วน (score, reason)" },
        { status: 400 }
      );
    }

    conn = await MariaDBConnection.getConnection();
    await conn.beginTransaction();

    try {
      // 1. Insert history record
      const insertHistory = `
        INSERT INTO ${TABLE_HISTORY} (STUDENT_ID, SCORE, REASON, TEACHER_ID)
        VALUES (?, ?, ?, ?)
      `;
      await conn.execute(insertHistory, [
        id,
        score,
        reason,
        session.user?.username || "unknown",
      ]);

      // 2. Update student score
      const updateStudent = `
        UPDATE ${TABLE_STUDENTS}
        SET BEHAVIOR_SCORE = BEHAVIOR_SCORE + ?
        WHERE STUDENT_ID = ?
      `;
      await conn.execute(updateStudent, [score, id]);

      await conn.commit();

      return NextResponse.json({
        success: true,
        message: "บันทึกคะแนนเรียบร้อยแล้ว",
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    }
  } catch (error) {
    console.error("Error updating behavior score:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: String(error) },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}
