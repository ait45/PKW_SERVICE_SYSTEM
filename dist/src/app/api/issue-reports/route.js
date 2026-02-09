import { auth } from "../../../lib/auth";
import { NextResponse } from "next/server";
import { MongoDBConnection } from "../../../lib/config.mongoDB";
import IssueReport from "../../../models/Mongo.model.IssueReport";
// GET - ดึงรายการ Issue Reports
export async function GET(req) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({
            error: "Unauthorized",
            message: "คุณไม่ได้ยืนยันตัวตน",
            code: "UNAUTHORIZED",
        }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    try {
        await MongoDBConnection();
        const query = {};
        if (status && status !== "all") {
            query.status = status;
        }
        if (type && type !== "all") {
            query.type = type;
        }
        const reports = await IssueReport.find(query)
            .sort({ createdAt: -1 })
            .lean();
        // Get stats
        const stats = await IssueReport.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);
        const statsMap = {
            pending: 0,
            in_progress: 0,
            resolved: 0,
            closed: 0,
            total: 0,
        };
        stats.forEach((s) => {
            statsMap[s._id] = s.count;
            statsMap.total += s.count;
        });
        return NextResponse.json({ success: true, data: { reports, stats: statsMap }, code: "SUCCESS" }, { status: 200 });
    }
    catch (error) {
        console.error(error);
        return NextResponse.json({
            error: "Internal Server Error",
            message: error,
            code: "INTERNAL_SERVER_ERROR",
        }, { status: 500 });
    }
}
// POST - สร้าง Issue Report ใหม่
export async function POST(req) {
    try {
        const body = await req.json();
        const { type, title, description, reportedBy, studentId } = body;
        if (!type || !title || !description) {
            return NextResponse.json({
                error: "Bad Request",
                message: "กรุณากรอกข้อมูลให้ครบ",
                code: "BAD_REQUEST",
            }, { status: 400 });
        }
        await MongoDBConnection();
        const newReport = await IssueReport.create({
            type,
            title,
            description,
            reportedBy: reportedBy || "anonymous",
            studentId: studentId || "",
        });
        return NextResponse.json({
            success: true,
            message: "บันทึกเรื่องร้องเรียนสำเร็จ",
            data: newReport,
        }, { status: 200 });
    }
    catch (error) {
        console.error(error);
        return NextResponse.json({
            error: "Internal Server Error",
            message: error,
            code: "INTERNAL_SERVER_ERROR",
        }, { status: 500 });
    }
}
// PUT - อัพเดท Issue Report (Admin)
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
    try {
        const body = await req.json();
        const { id, status, priority, adminNote } = body;
        if (!id) {
            return NextResponse.json({
                error: "Bad Request",
                message: "id จำเป็นต้องกรอก",
                code: "BAD_REQUEST",
            }, { status: 400 });
        }
        await MongoDBConnection();
        await IssueReport.findByIdAndUpdate(id, {
            status,
            priority,
            adminNote,
        });
        return NextResponse.json({ success: true, message: "อัพเดทสำเร็จ", code: "SUCCESS" }, { status: 200 });
    }
    catch (error) {
        console.error(error);
        return NextResponse.json({
            error: "Internal Server Error",
            message: error,
            code: "INTERNAL_SERVER_ERROR",
        }, { status: 500 });
    }
}
// DELETE - ลบ Issue Report
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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
        return NextResponse.json({
            error: "Bad Request",
            message: "id จำเป็นต้องกรอก",
            code: "BAD_REQUEST",
        }, { status: 400 });
    }
    try {
        await MongoDBConnection();
        await IssueReport.findByIdAndDelete(id);
        return NextResponse.json({ success: true, message: "ลบสำเร็จ", code: "SUCCESS" }, { status: 200 });
    }
    catch (error) {
        console.error(error);
        return NextResponse.json({
            error: "Internal Server Error",
            message: error,
            code: "INTERNAL_SERVER_ERROR",
        }, { status: 500 });
    }
}
