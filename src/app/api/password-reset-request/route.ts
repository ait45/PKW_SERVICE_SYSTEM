import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { MongoDBConnection } from "@/lib/config.mongoDB";
import PasswordResetRequest from "@/models/Mongo.model.PasswordResetRequest";

// GET - ดึงรายการคำขอรีเซ็ตรหัสผ่าน (Admin)
export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  try {
    await MongoDBConnection();

    const query: Record<string, unknown> = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const requests = await PasswordResetRequest.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Get stats
    const stats = await PasswordResetRequest.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const statsMap = { pending: 0, acknowledged: 0, resolved: 0, total: 0 };
    stats.forEach((s) => {
      statsMap[s._id as keyof typeof statsMap] = s.count;
      statsMap.total += s.count;
    });

    return NextResponse.json(
      { success: true, data: { requests, stats: statsMap }, code: "SUCCESS" },
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

// POST - สร้างคำขอรีเซ็ตรหัสผ่านใหม่ (Public)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, studentName, classes, reason } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "Bad Request", message: "กรุณากรอกรหัสนักเรียน" },
        { status: 400 },
      );
    }

    await MongoDBConnection();

    // ตรวจสอบว่ามีคำขอที่รอดำเนินการอยู่หรือไม่
    const existingRequest = await PasswordResetRequest.findOne({
      studentId,
      status: "pending",
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "มีคำขอที่รอดำเนินการอยู่แล้ว กรุณารอการตอบกลับ",
          code: "BAD_REQUEST",
        },
        { status: 400 },
      );
    }

    const newRequest = await PasswordResetRequest.create({
      studentId,
      studentName: studentName || "",
      classes: classes || "",
      reason: reason || "",
    });

    return NextResponse.json(
      {
        success: true,
        message: "ส่งคำขอสำเร็จ กรุณารอการตอบกลับจากผู้ดูแลระบบ",
        data: newRequest,
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
  }
}

// PUT - อัพเดทสถานะคำขอ (Admin)
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

  try {
    const body = await req.json();
    const { id, status, note } = body;

    if (!id) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "id จำเป็นต้องกรอก",
          code: "BAD_REQUEST",
        },
        { status: 400 },
      );
    }

    await MongoDBConnection();

    const updateData: Record<string, unknown> = { status, note };
    if (status === "acknowledged" || status === "resolved") {
      updateData.acknowledgedBy = session.user.name || "Unknown";
      updateData.acknowledgedAt = new Date();
    }

    await PasswordResetRequest.findByIdAndUpdate(id, updateData);

    return NextResponse.json(
      { success: true, message: "อัพเดทสำเร็จ", code: "SUCCESS" },
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

// DELETE - ลบคำขอ
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

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      {
        error: "Bad Request",
        message: "id จำเป็นต้องกรอก",
        code: "BAD_REQUEST",
      },
      { status: 400 },
    );
  }

  try {
    await MongoDBConnection();
    await PasswordResetRequest.findByIdAndDelete(id);

    return NextResponse.json(
      { success: true, message: "ลบสำเร็จ", code: "DELETE_DATA_SUCCESS" },
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
