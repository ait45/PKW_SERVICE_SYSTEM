import { auth } from "../../../lib/auth";
import { NextResponse } from "next/server";
import { MariaDBConnection } from "../../../lib/config.mariaDB";
import Teacher from "../../../models/Mongo.model.Teacher";
async function genPassword(length) {
    const characters = "0123456789";
    let password = "T";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        password += characters.charAt(randomIndex);
    }
    return password;
}
export async function GET(req) {
    const session = await auth();
    if (!session)
        return NextResponse.json({
            error: "Unauthorized",
            message: "คุณไม่ได้รับอนุญาต",
            code: "UNAUTHORIZED",
        }, { status: 401 });
    if (session.user.role !== "teacher")
        return NextResponse.json({
            error: "Forbidden",
            message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
            code: "FORBIDDEN",
        }, { status: 403 });
    try {
        const conn = await MariaDBConnection.getConnection();
        const { searchParams } = new URL(req.url);
        const subjectGroup = searchParams.get("subjectGroup");
        let query = `SELECT TEACHER_ID, NAME, DEPARTMENT, SUBJECT, PHONE, IS_ADMIN, SUBJECT_GROUP FROM ${process.env.MARIA_DB_TABLE_TEACHERS}`;
        const params = [];
        if (subjectGroup && subjectGroup !== "all") {
            query += ` WHERE SUBJECT_GROUP = ?`;
            params.push(subjectGroup);
        }
        query += ` ORDER BY SUBJECT_GROUP, NAME`;
        const payload = await conn.query(query, params);
        conn.end();
        return NextResponse.json({ success: true, message: payload }, { status: 200 });
    }
    catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, message: error }, { status: 500 });
    }
}
export async function POST(req) {
    const session = await auth();
    if (!session)
        return NextResponse.json({
            error: "Unauthorized",
            message: "คุณไม่ได้รับอนุญาต",
            code: "UNAUTHORIZED",
        }, { status: 401 });
    if (session.user.role !== "teacher")
        return NextResponse.json({
            error: "Forbidden",
            message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
            code: "FORBIDDEN",
        }, { status: 403 });
    let conn;
    try {
        const body = await req.json();
        console.log(body);
        const { teacherId, name, department, subject, phone, subjectGroup, isAdmin, } = body;
        if (!teacherId || !name) {
            return NextResponse.json({
                error: "Bad Request",
                message: "กรุณากรอกข้อมูลที่จำเป็น",
                code: "BAD_REQUEST",
            }, { status: 400 });
        }
        conn = await MariaDBConnection.getConnection();
        const query = `INSERT INTO ${process.env.MARIA_DB_TABLE_TEACHERS} 
      (TEACHER_ID, NAME, DEPARTMENT, SUBJECT, PHONE, SUBJECT_GROUP, IS_ADMIN) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`;
        await conn.execute(query, [
            teacherId,
            name,
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
            password: passwordLogin,
            department: department || null,
            role: "teacher",
            isAdmin: isAdmin || false,
        });
        return NextResponse.json({ success: true, message: "เพิ่มข้อมูลครูสำเร็จ", code: "SUCCESSFULLY" }, { status: 201 });
    }
    catch (error) {
        console.error(error);
        return NextResponse.json({
            error: "Internal Server Error",
            message: error,
            code: "INTERNAL_ERROR",
        }, { status: 500 });
    }
    finally {
        if (conn)
            conn.end();
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
        const { teacherId, name, department, subject, phone, subjectGroup, isAdmin, } = body;
        if (!teacherId) {
            return NextResponse.json({
                error: "Bad Request",
                message: "ต้องระบุ teacherId",
                code: "BAD_REQUEST",
            }, { status: 400 });
        }
        conn = await MariaDBConnection.getConnection();
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
        return NextResponse.json({ success: true, message: "แก้ไขข้อมูลครูสำเร็จ", code: "SUCCESSFULLY" }, { status: 200 });
    }
    catch (error) {
        console.error(error);
        return NextResponse.json({
            error: "Internal Server Error",
            message: error,
            code: "INTERNAL_ERROR",
        }, { status: 500 });
    }
    finally {
        if (conn)
            conn.release();
    }
}
export async function DELETE(req) {
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
        const { searchParams } = new URL(req.url);
        const teacherId = searchParams.get("teacherId");
        if (!teacherId) {
            return NextResponse.json({
                error: "Bad Request",
                message: "ต้องระบุ teacherId",
                code: "BAD_REQUEST",
            }, { status: 400 });
        }
        conn = await MariaDBConnection.getConnection();
        const query = `DELETE FROM ${process.env.MARIA_DB_TABLE_TEACHERS} WHERE TEACHER_ID = ?`;
        await conn.execute(query, [teacherId]);
        conn.end();
        return NextResponse.json({ success: true, message: "ลบข้อมูลครูสำเร็จ", code: "SUCCESSFULLY" }, { status: 200 });
    }
    catch (error) {
        console.error(error);
        return NextResponse.json({
            error: "Internal Server Error",
            message: error,
            code: "INTERNAL_ERROR",
        }, { status: 500 });
    }
    finally {
        if (conn)
            conn.release();
    }
}
