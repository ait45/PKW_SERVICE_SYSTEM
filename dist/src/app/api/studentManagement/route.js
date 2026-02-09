import { MongoDBConnection } from "../../../lib/config.mongoDB";
import { MariaDBConnection } from "../../../lib/config.mariaDB";
import { NextResponse } from "next/server";
import Student from "../../../models/Mongo.model.Student";
import { auth } from "../../../lib/auth";
import crypto from "crypto";
import bcrypt from "bcrypt";
const TABLE_STUDENTS = process.env.MARIA_DB_TABLE_STUDENTS;
// generatePassword
async function genPassword(size) {
    const number = "1234567890";
    let password = "PKW_";
    const bytes = crypto.randomBytes(size);
    for (let i = 0; i < size; i++) {
        password += number[bytes[i] % number.length];
    }
    return password;
}
export async function GET() {
    const session = await auth();
    if (!session) {
        return NextResponse.json({
            error: "Unauthorized",
            message: "คุณไม่ได้ยืนยันตัวตน",
            code: "UNAUTHORIZED",
        }, { status: 401 });
    }
    let conn;
    try {
        conn = await MariaDBConnection.getConnection();
        const query = `SELECT * FROM ${TABLE_STUDENTS}`;
        const data = await conn.query(query);
        if (session?.user?.role === "teacher") {
            const payload = data.map((index) => {
                return {
                    _id: index._id,
                    studentId: index.STUDENT_ID,
                    name: index.NAME,
                    classes: index.CLASSES,
                    phone: index.PHONE,
                    parentPhone: index.PARENT_PHONE,
                    plantData: index.PLANT_PASSWORD,
                    Number: index.NUMBER,
                    joinDays: index.JOIN_DAYS,
                    leaveDays: index.LEAVE_DAYS,
                    lateDays: index.LATE_DAYS,
                    absentDays: index.ABSENT_DAYS,
                    behaviorScore: index.BEHAVIOR_SCORE,
                    isAdmin: index.IS_ADMIN === 1 ? true : false,
                    event_absent_periods: index.EVENT_ABSENT_PERIODS,
                };
            });
            return NextResponse.json({
                success: true,
                payload: payload,
                message: "ดึงข้อมูลสำเร็จ",
                code: "SUCCESS",
            }, { status: 200 });
        }
        else {
            return NextResponse.json({
                error: "Forbidden",
                message: "ไม่มีสิทธิ์เข้าถึงข้อมูล",
                code: "FORBIDDEN",
            }, { status: 403 });
        }
    }
    catch (error) {
        console.log("Error :", error);
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
export async function POST(req) {
    const session = await auth();
    if (!session)
        return NextResponse.json({
            error: "Unauthorized",
            message: "ต้องยืนยันตัวตนก่อนใช้งาน",
            code: "UNAUTHORIZED",
        }, { status: 401 });
    let conn;
    try {
        const { studentId, name, classes, phone, parentPhone, Number } = await req.json();
        const plantData = await genPassword(5);
        const password = await bcrypt.hash(plantData, 10);
        conn = await MariaDBConnection.getConnection();
        const query = `INSERT INTO ${TABLE_STUDENTS} (STUDENT_ID, NAME, CLASSES, PHONE, PARENT_PHONE, PLANT_PASSWORD, NUMBER) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        await conn.execute(query, [
            studentId,
            name,
            classes,
            phone,
            parentPhone,
            plantData,
            Number,
        ]);
        await MongoDBConnection();
        await Student.create({
            studentId: studentId,
            name: name,
            password: password,
        });
        return NextResponse.json({ success: true, message: "เพิ่มข้อมูลเสร็จสิ้น", code: "SUCCESS" }, { status: 200 });
    }
    catch (error) {
        console.error("Error :", error);
        if (error.code === "ER_DUP_ENTRY") {
            const message = error.sqlMessage || error.message;
            if (message.includes("STUDENT_ID")) {
                return NextResponse.json({
                    error: "student_id_exists",
                    message: { studentId: "มีข้อมูลในระบบแล้ว" },
                    code: "STUDENT_ID_EXISTS",
                }, { status: 409 });
            }
            if (message.includes("unique_class_number")) {
                return NextResponse.json({
                    error: "number_exists",
                    message: { Number: "เลขที่มีข้อมูลในระบบแล้ว" },
                    code: "NUMBER_EXISTS",
                }, { status: 409 });
            }
        }
        return NextResponse.json({
            error: "internal_server_error",
            message: error,
            code: "INTERNAL_SERVER_ERROR",
        }, { status: 500 });
    }
    finally {
        if (conn)
            conn.release();
    }
}
