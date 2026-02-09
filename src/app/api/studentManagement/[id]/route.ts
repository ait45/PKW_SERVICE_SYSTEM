import { NextResponse, NextRequest } from "next/server";
import { MongoDBConnection } from "@/lib/config.mongoDB";
import { MariaDBConnection } from "@/lib/config.mariaDB";
import Student from "@/models/Mongo.model.Student";
import { auth } from "@/lib/auth";
import { PoolConnection } from "mariadb/*";

type RouteParams = {
  params: Promise<{ id: string }>;
};

interface Student {
  studentId: string;
  name: string;
  classes: string;
  phone: string;
  parentPhone: string;
  joinDays: number;
  leaveDays: number;
  lateDays: number;
  absentDays: number;
  behaviorScore: number;
  status: string;
  plantData: string;
  Number: number;
  isAdmin: boolean;
}

const StudentTable = process.env.MARIA_DB_TABLE_STUDENTS;

export async function DELETE(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
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
    let conn: PoolConnection | undefined;
  try {
    const { id } = await params;
    await MongoDBConnection();
    conn = await MariaDBConnection.getConnection();
    // ตัด 0 นำหน้าออกเพื่อเปรียบเทียบ
    const query = `DELETE FROM ${StudentTable} WHERE TRIM(LEADING '0' FROM STUDENT_ID) = TRIM(LEADING '0' FROM ?)`;
    await conn.execute(query, [id]);
    // สำหรับ MongoDB ใช้ regex เพื่อ match ทั้งแบบมีและไม่มี 0 นำหน้า
    await Student.findOneAndDelete({ studentId: { $regex: new RegExp(`^0*${id.replace(/^0+/, '')}$`) } });
    return NextResponse.json(
      { success: true, message: "ลบข้อมูลเสร็จสิ้น", code: "DELETE_SUCCESS" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error to Delete Data", error);
    return NextResponse.json(
      {
        error: "internal_server_error",
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
  { params }: RouteParams,
): Promise<NextResponse> {
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
    let conn: PoolConnection | undefined;
  try {
    await MongoDBConnection();
    const { name, classes, phone, parentPhone, isAdmin } = await req.json();
    const { id } = await params;
    console.log(isAdmin);

    // ตัด 0 นำหน้าออกเพื่อเปรียบเทียบ
    const query = `UPDATE ${StudentTable} SET NAME = ?, CLASSES = ?, PHONE = ?, PARENT_PHONE = ?, IS_ADMIN = ? WHERE TRIM(LEADING '0' FROM STUDENT_ID) = TRIM(LEADING '0' FROM ?)`;

    conn = await MariaDBConnection.getConnection();
    // สำหรับ MongoDB ใช้ regex เพื่อ match ทั้งแบบมีและไม่มี 0 นำหน้า
    await Student.findOneAndUpdate({ studentId: { $regex: new RegExp(`^0*${id.replace(/^0+/, '')}$`) } }, { isAdmin: Number(isAdmin) === 1 ? true : false });
    await conn.execute(query, [name, classes, phone, parentPhone, isAdmin, id]);
    return NextResponse.json(
      { success: true, message: "แก้ไขข้อมูลเสร็จสิ้น", code: "MODIFY_SUCCESS" },
      { status: 200 },
    );

  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        error: "internal_server_error",
        message: error,
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 },
    );
  } finally {
    if (conn) conn.release();
  }
}
export async function GET(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
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

  let conn: PoolConnection | undefined;
  try {
    const { id } = await params;
    conn = await MariaDBConnection.getConnection();
    // ตัด 0 นำหน้าออกเพื่อเปรียบเทียบ
    const query = `SELECT STUDENT_ID,NAME,CLASSES,PHONE,PARENT_PHONE,PLANT_PASSWORD,IS_ADMIN,BEHAVIOR_SCORE,NUMBER,JOIN_DAYS,LATE_DAYS,LEAVE_DAYS,ABSENT_DAYS,EVENT_ABSENT_PERIODS FROM ${StudentTable} WHERE TRIM(LEADING '0' FROM STUDENT_ID) = TRIM(LEADING '0' FROM ?)`;

    const res = await conn.execute(query, [id]);
    if (!res)
      return NextResponse.json(
        {
          error: "not_found",
          message: "ไม่พบข้อมูลนักเรียน",
          code: "NOT_FOUND",
        },
        { status: 404 },
      );
    return NextResponse.json(
      {
        success: true,
        message: "ดึงข้อมูลเสร็จสิ้น",
        data: res[0],
        code: "FETCH_DATA_SUCCESSFLLY",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "internal_server_error",
        message: error,
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 },
    );
  } finally {
    if (conn) conn.release();
  }
}
