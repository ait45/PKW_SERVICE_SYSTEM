import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendDailyReport } from "@/scripts/dailyReport";

// GET - ทดสอบส่งรายงานประจำวัน (manual trigger)
export async function GET(req: NextRequest) {
  const session = await auth();
  
  // ต้อง login เป็น teacher เท่านั้น
  if (!session || session.user.role !== "teacher") {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const result = await sendDailyReport();
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
