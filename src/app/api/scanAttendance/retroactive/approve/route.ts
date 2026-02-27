"use server";
import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { MongoDBConnection } from "@/lib/config.mongoDB";
import RetroactiveRequest from "@/models/Mongo.model.RetroactiveRequest";
import { update_behaviorScore_retroactive } from "@/scripts/behaviorScore-deduction";

/**
 * POST - Admin อนุมัติ/ปฏิเสธคำขอเช็คชื่อย้อนหลัง
 * Body: { requestId, action: 'approve' | 'reject', rejectReason? }
 */
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
  if (!session?.user?.isAdmin === false) {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "เฉพาะ Admin เท่านั้น",
        code: "FORBIDDEN",
      },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const { requestId, action, rejectReason } = body;

    if (!requestId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "ข้อมูลไม่ถูกต้อง",
          code: "BAD_REQUEST",
        },
        { status: 400 },
      );
    }

    await MongoDBConnection();
    const request = await RetroactiveRequest.findById(requestId);

    if (!request) {
      return NextResponse.json(
        { error: "Not Found", message: "ไม่พบคำขอ", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (request.status !== "pending") {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "คำขอนี้ถูกดำเนินการแล้ว",
          code: "ALREADY_PROCESSED",
        },
        { status: 400 },
      );
    }

    if (action === "approve") {
      // คำนวณวันที่ target
      const targetDate = new Date(request.targetDate)
        .toISOString()
        .split("T")[0];

      // บันทึกเช็คชื่อลง MariaDB + คำนวณคะแนนพฤติกรรม
      const changesWithHandler = request.changes.map((c) => ({
        isFirstRecord: c.isFirstRecord,
        studentId: c.studentId,
        name: c.name,
        classes: c.classes,
        status: c.status,
        handler: request.requestedBy,
      }));

      await update_behaviorScore_retroactive(changesWithHandler, targetDate);

      // อัพเดตสถานะเป็น approved
      request.status = "approved";
      request.reviewedBy = session?.user?.username ?? undefined;
      request.reviewedByName = session?.user?.name ?? undefined;
      request.reviewedAt = new Date();
      await request.save();

      return NextResponse.json(
        { success: true, message: "อนุมัติคำขอสำเร็จ", code: "APPROVED" },
        { status: 200 },
      );
    } else {
      // reject
      if (!rejectReason || rejectReason.trim() === "") {
        return NextResponse.json(
          {
            error: "Bad Request",
            message: "กรุณาระบุเหตุผลในการปฏิเสธ",
            code: "REASON_REQUIRED",
          },
          { status: 400 },
        );
      }

      request.status = "rejected";
      request.reviewedBy = session?.user?.username ?? undefined;
      request.reviewedByName = session?.user?.name ?? undefined;
      request.reviewedAt = new Date();
      request.rejectReason = rejectReason;
      await request.save();

      return NextResponse.json(
        { success: true, message: "ปฏิเสธคำขอสำเร็จ", code: "REJECTED" },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error("[Retroactive Approve] Error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "เกิดข้อผิดพลาด",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
}
