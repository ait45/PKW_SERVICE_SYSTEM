import { NextResponse } from "next/server";
import { MongoDBConnection } from "../../../../lib/config.mongoDB";
import { MariaDBConnection } from "../../../../lib/config.mariaDB";
import Student from "../../../../models/Mongo.model.Student";
import { auth } from "../../../../lib/auth";
const StudentTable = process.env.MARIA_DB_TABLE_STUDENTS;
export async function DELETE(req, { params }) {
    const session = await auth();
    if (!session)
        return NextResponse.json({
            error: "Unauthorized",
            message: "ต้องยืนยันตัวตนก่อนใช้งาน",
            code: "UNAUTHORIZED",
        }, { status: 401 });
    try {
        const { id } = await params;
        await MongoDBConnection();
        await Student.findByIdAndDelete(id);
        return NextResponse.json({ success: true, message: "ลบข้อมูลเสร็จสิ้น", code: "SUCCESS" }, { status: 200 });
    }
    catch (error) {
        console.error("Error to Delete Data", error);
        return NextResponse.json({
            error: "internal_server_error",
            message: error,
            code: "INTERNAL_SERVER_ERROR",
        }, { status: 500 });
    }
}
export async function PUT(req, { params }) {
    const session = await auth();
    if (!session)
        return NextResponse.json({
            error: "Unauthorized",
            message: "ต้องยืนยันตัวตนก่อนใช้งาน",
            code: "UNAUTHORIZED",
        }, { status: 401 });
    try {
        await MongoDBConnection();
        const body = await req.json();
        const update = { ...body };
        const { id } = await params;
        const res = await Student.findByIdAndUpdate(id, update, {
            new: true,
        });
        if (res)
            return NextResponse.json({ success: true, message: "แก้ไขข้อมูลเสร็จสิ้น" }, { status: 200 });
        else
            return NextResponse.json({ success: false }, { status: 400 });
    }
    catch (error) {
        console.log(error);
        return NextResponse.json({
            error: "internal_server_error",
            message: error,
            code: "INTERNAL_SERVER_ERROR",
        }, { status: 500 });
    }
}
export async function GET(req, { params }) {
    const session = await auth();
    if (!session)
        return NextResponse.json({
            error: "Unauthorized",
            message: "ต้องยืนยันตัวตนก่อนใช้งาน",
            code: "UNAUTHORIZED",
        }, { status: 401 });
    let conn;
    try {
        const { id } = await params;
        conn = await MariaDBConnection.getConnection();
        const query = `SELECT NAME,CLASSES,PHONE,PARENT_PHONE,PLANT_PASSWORD,IS_ADMIN,BEHAVIOR_SCORE,NUMBER,JOIN_DAYS,LATE_DAYS,LEAVE_DAYS,ABSENT_DAYS,EVENT_ABSENT_PERIODS FROM ${StudentTable} WHERE STUDENT_ID = ?`;
        const res = await conn.execute(query, [id]);
        if (!res)
            return NextResponse.json({
                error: "not_found",
                message: "ไม่พบข้อมูลนักเรียน",
                code: "NOT_FOUND",
            }, { status: 404 });
        return NextResponse.json({
            success: true,
            message: "ดึงข้อมูลเสร็จสิ้น",
            data: res[0],
            code: "FETCH_DATA_SUCCESSFLLY",
        }, { status: 200 });
    }
    catch (error) {
        console.error(error);
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
