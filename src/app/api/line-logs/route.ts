import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { MongoDBConnection } from "@/lib/config.mongoDB";
import LineLog from "@/models/Mongo.model.LineLog";

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

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const page = parseInt(searchParams.get("page") || "1");
  const status = searchParams.get("status"); // success, failed, all
  const messageType = searchParams.get("type"); // push, broadcast, multicast

  try {
    await MongoDBConnection();

    // Build query
    const query: Record<string, unknown> = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (messageType && messageType !== "all") {
      query.messageType = messageType;
    }

    // Get total count for pagination
    const total = await LineLog.countDocuments(query);

    // Get logs with pagination
    const logs = await LineLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get statistics
    const stats = await LineLog.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statsMap = {
      success: 0,
      failed: 0,
      pending: 0,
      total: 0,
    };

    stats.forEach((s) => {
      statsMap[s._id as keyof typeof statsMap] = s.count;
      statsMap.total += s.count;
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          logs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
          stats: statsMap,
        },
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

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Bad Request", message: "id จำเป็นต้องกรอก", code: "SUCCESS" },
      { status: 400 },
    );
  }

  try {
    await MongoDBConnection();
    await LineLog.findByIdAndDelete(id);

    return NextResponse.json(
      { success: true, message: "ลบ log สำเร็จ", code: "SUCCESS" },
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
