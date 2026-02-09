import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { MariaDBConnection } from "@/lib/config.mariaDB";
import { MongoDBConnection } from "@/lib/config.mongoDB";
import NotificationRead from "@/models/Mongo.model.NotificationRead";
import { PoolConnection } from "mariadb";

const NOTIFICATIONS_TABLE = process.env.MARIA_DB_TABLE_NOTIFICATIONS;
const TABLE_STUDENTS = process.env.MARIA_DB_TABLE_STUDENTS;

// Helper function to get student class from MariaDB
async function getStudentClass(
  conn: PoolConnection,
  studentId: string,
): Promise<string> {
  try {
    const result = await conn.query(
      `SELECT CLASSES FROM ${TABLE_STUDENTS} WHERE STUDENT_ID = ?`,
      [studentId],
    );
    return result[0]?.CLASSES || "";
  } catch {
    return "";
  }
}

// GET: ดึงจำนวนประกาศที่ยังไม่ได้อ่าน
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
    await MongoDBConnection();
    conn = await MariaDBConnection.getConnection();

    const userId = session?.user?.username;
    const userRole = session?.user?.role;

    // Get all active notification IDs
    let query = `SELECT ID FROM ${NOTIFICATIONS_TABLE} WHERE STATUS = 'active' AND (EXPIRE_DATE IS NULL OR EXPIRE_DATE >= CURDATE())`;

    // Filter by target audience based on user role
    if (userRole === "student") {
      // Get student class from MariaDB
      const userClass = await getStudentClass(conn, userId);
      query += ` AND (TARGET_AUDIENCE = 'all' OR TARGET_AUDIENCE = 'students'`;
      if (userClass) {
        // Match class-based targets like "class:ม.1"
        query += ` OR CONVERT(TARGET_AUDIENCE USING utf8mb4) LIKE '%${userClass}%'`;
      }
      query += `)`;
    } else if (userRole === "teacher") {
      query += ` AND (TARGET_AUDIENCE = 'all' OR TARGET_AUDIENCE = 'teachers')`;
    }

    const notifications = await conn.query(query);
    const notificationIds = notifications.map((n: any) => n.ID);

    // Get read notification IDs for this user
    const readNotifications = await NotificationRead.find({
      userId,
      notificationId: { $in: notificationIds },
    }).select("notificationId");

    const readIds = readNotifications.map((r) => r.notificationId);
    const unreadCount = notificationIds.filter(
      (id: number) => !readIds.includes(id),
    ).length;

    return NextResponse.json(
      {
        success: true,
        unreadCount,
        total: notificationIds.length,
        code: "SUCCESS",
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

// POST: บันทึกว่า user อ่านประกาศแล้ว
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

  let conn: PoolConnection | undefined;
  try {
    await MongoDBConnection();

    const body = await req.json();
    const { notificationId, markAll } = body;

    const userId = session?.user?.username;
    const userRole = session?.user?.role as "teacher" | "student";

    if (markAll) {
      // Get all unread notification IDs
      try {
        conn = await MariaDBConnection.getConnection();

        let query = `SELECT ID FROM ${NOTIFICATIONS_TABLE} WHERE STATUS = 'active' AND (EXPIRE_DATE IS NULL OR EXPIRE_DATE >= CURDATE())`;

        if (userRole === "student") {
          const userClass = await getStudentClass(conn, userId);
          query += ` AND (TARGET_AUDIENCE = 'all' OR TARGET_AUDIENCE = 'students'`;
          if (userClass) {
            query += ` OR CONVERT(TARGET_AUDIENCE USING utf8mb4) LIKE '%${userClass}%'`;
          }
          query += `)`;
        } else if (userRole === "teacher") {
          query += ` AND (TARGET_AUDIENCE = 'all' OR TARGET_AUDIENCE = 'teachers')`;
        }

        const notifications = await conn.query(query);

        // Mark all as read using upsert
        const bulkOps = notifications.map((n: any) => ({
          updateOne: {
            filter: { notificationId: n.ID, userId },
            update: { $set: { userRole, readAt: new Date() } },
            upsert: true,
          },
        }));

        if (bulkOps.length > 0) {
          await NotificationRead.bulkWrite(bulkOps);
        }

        return NextResponse.json(
          { success: true, message: "Marked all as read", code: "SUCCESS" },
          { status: 200 },
        );
      } finally {
        if (conn) conn.release();
      }
    }

    if (!notificationId) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "notificationId is required",
          code: "BAD_REQUEST",
        },
        { status: 400 },
      );
    }

    // Upsert single notification read
    await NotificationRead.updateOne(
      { notificationId, userId },
      { $set: { userRole, readAt: new Date() } },
      { upsert: true },
    );

    return NextResponse.json(
      { success: true, message: "Marked as read", code: "SUCCESS" },
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
  }
}
