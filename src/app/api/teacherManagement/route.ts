import { auth } from "@/lib/auth";
import { NextResponse, NextRequest } from "next/server";
import { MariaDBConnection } from "@/lib/config.mariaDB";
import { PoolConnection } from "mariadb/*";
import Teacher from "@/models/Mongo.model.Teacher";
import bcrypt from "bcrypt";

async function genPassword(length: number) {
  const characters = "0123456789";
  let password = "T";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters.charAt(randomIndex);
  }
  return password;
}

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
  if (session.user.role !== "teacher")
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
        code: "FORBIDDEN",
      },
      { status: 403 },
    );
  let conn: PoolConnection | undefined;
  try {
    conn = await MariaDBConnection.getConnection();
    const { searchParams } = new URL(req.url);
    const subjectGroup = searchParams.get("subjectGroup");

    let query = `SELECT TEACHER_ID, NAME, PASSWORD, DEPARTMENT, SUBJECT, PHONE, IS_ADMIN, SUBJECT_GROUP FROM ${process.env.MARIA_DB_TABLE_TEACHERS}`;
    const params: string[] = [];

    if (subjectGroup && subjectGroup !== "all") {
      query += ` WHERE SUBJECT_GROUP = ?`;
      params.push(subjectGroup);
    }

    query += ` ORDER BY SUBJECT_GROUP, NAME`;

    const payload = await conn.query(query, params);

    return NextResponse.json(
      { success: true, message: payload, code: "SUCCESS" },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Internal server error",
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
        message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
        code: "FORBIDDEN",
      },
      { status: 403 },
    );

  let conn: PoolConnection | undefined;
  try {
    const body = await req.json();
    console.log(body);
    const {
      teacherId,
      name,
      password,
      department,
      subject,
      phone,
      subjectGroup,
      isAdmin,
    } = body;

    if (!teacherId || !name || !password) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "กรุณากรอกรหัสครู, ชื่อ และรหัสผ่าน",
          code: "BAD_REQUEST",
        },
        { status: 400 },
      );
    }
    const hashPass = await bcrypt.hash(password, 10);

    conn = await MariaDBConnection.getConnection();
    const query = `INSERT INTO ${process.env.MARIA_DB_TABLE_TEACHERS} 
      (TEACHER_ID, NAME, PASSWORD, DEPARTMENT, SUBJECT, PHONE, SUBJECT_GROUP, IS_ADMIN) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    await conn.execute(query, [
      teacherId,
      name,
      password,
      department || null,
      subject || null,
      phone || null,
      subjectGroup || null,
      isAdmin || false,
    ]);
    // add account to system login
    const passwordLogin = await genPassword(6);
    await Teacher.create({
      teacherId: teacherId,
      name: name,
      password: hashPass,
      department: department || null,
      role: "teacher",
      isAdmin: isAdmin || false,
    });
    return NextResponse.json(
      { success: true, message: "เพิ่มข้อมูลครูสำเร็จ", code: "SUCCESSFULLY" },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error,
        code: "INTERNAL_ERROR",
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
    const {
      teacherId,
      name,
      password,
      department,
      subject,
      phone,
      subjectGroup,
      isAdmin,
    } = body;

    if (!teacherId) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "ต้องระบุ teacherId",
          code: "BAD_REQUEST",
        },
        { status: 400 },
      );
    }

    conn = await MariaDBConnection.getConnection();

    // ถ้ามีการเปลี่ยนรหัสผ่าน
    if (password) {
      const query = `UPDATE ${process.env.MARIA_DB_TABLE_TEACHERS} SET 
        NAME = ?, PASSWORD = ?, DEPARTMENT = ?, SUBJECT = ?, PHONE = ?, SUBJECT_GROUP = ?, IS_ADMIN = ?
        WHERE TEACHER_ID = ?`;

      await conn.execute(query, [
        name,
        password,
        department || null,
        subject || null,
        phone || null,
        subjectGroup || null,
        isAdmin || false,
        teacherId,
      ]);

      // อัพเดต password ใน MongoDB ด้วย
      const hashPass = await bcrypt.hash(password, 10);
      await Teacher.updateOne(
        { teacherId: teacherId },
        { $set: { name: name, password: hashPass, isAdmin: isAdmin } },
      );
    } else {
      // ไม่เปลี่ยนรหัสผ่าน
      const query = `UPDATE ${process.env.MARIA_DB_TABLE_TEACHERS} SET 
        NAME = ?, DEPARTMENT = ?, SUBJECT = ?, PHONE = ?, SUBJECT_GROUP = ?, IS_ADMIN = ?
        WHERE TEACHER_ID = ?`;

      await conn.execute(query, [
        name,
        department || null,
        subject || null,
        phone || null,
        subjectGroup || null,
        isAdmin || false,
        teacherId,
      ]);
      console.log(isAdmin);
      // อัพเดตข้อมูลใน MongoDB ด้วย
      await Teacher.updateOne(
        { teacherId: teacherId },
        { $set: { name: name, isAdmin: isAdmin } },
      );
    }

    return NextResponse.json(
      { success: true, message: "แก้ไขข้อมูลครูสำเร็จ", code: "SUCCESSFULLY" },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error,
        code: "INTERNAL_ERROR",
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
    const teacherId = searchParams.get("teacherId");

    if (!teacherId) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "ต้องระบุ teacherId",
          code: "BAD_REQUEST",
        },
        { status: 400 },
      );
    }

    conn = await MariaDBConnection.getConnection();
    const query = `DELETE FROM ${process.env.MARIA_DB_TABLE_TEACHERS} WHERE TEACHER_ID = ?`;
    await conn.execute(query, [teacherId]);

    return NextResponse.json(
      { success: true, message: "ลบข้อมูลครูสำเร็จ", code: "SUCCESSFULLY" },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error,
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  } finally {
    if (conn) conn.release();
  }
}
