import { NextRequest, NextResponse } from "next/server";
import {
  createAttendanceSummaryFlexMessage,
  sendFlexMessage,
  AttendanceSummaryData,
} from "@/scripts/LineMessage";

// POST - ทดสอบส่ง Flex Message แบบส่วนตัว (push message)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุ userId" },
        { status: 400 }
      );
    }

    // ข้อมูลทดสอบสำหรับ Flex Message
    const testData: AttendanceSummaryData = {
      date: new Date().toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      totalm1: 120, t1: 115, f1: 5,
      totalm2: 110, t2: 108, f2: 2,
      totalm3: 100, t3: 95, f3: 5,
      totalm4: 90, t4: 88, f4: 2,
      totalm5: 85, t5: 80, f5: 5,
      totalm6: 80, t6: 78, f6: 2,
      totalPresent: 564,
      totalAbsent: 21,
      percentage: "96.41",
    };

    const flexMessage = createAttendanceSummaryFlexMessage(testData);
    await sendFlexMessage(userId, flexMessage, "test-api");

    return NextResponse.json(
      { success: true, message: "ส่ง Flex Message สำเร็จ!", userId },
      { status: 200 }
    );
  } catch (error) {
    console.error("LINE push error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการส่งข้อความ",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// GET - ทดสอบส่ง Flex Message ผ่าน browser
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { success: false, message: "กรุณาระบุ userId ใน query string เช่น ?userId=xxx" },
      { status: 400 }
    );
  }

  try {
    // ข้อมูลทดสอบสำหรับ Flex Message
    const testData: AttendanceSummaryData = {
      date: new Date().toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      totalm1: 120, t1: 115, f1: 5,
      totalm2: 110, t2: 108, f2: 2,
      totalm3: 100, t3: 95, f3: 5,
      totalm4: 90, t4: 88, f4: 2,
      totalm5: 85, t5: 80, f5: 5,
      totalm6: 80, t6: 78, f6: 2,
      totalPresent: 564,
      totalAbsent: 21,
      percentage: "96.41",
    };

    const flexMessage = createAttendanceSummaryFlexMessage(testData);
    await sendFlexMessage(userId, flexMessage, "test-api");

    return NextResponse.json(
      { success: true, message: "ส่ง Flex Message สำเร็จ!", userId },
      { status: 200 }
    );
  } catch (error) {
    console.error("LINE push error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการส่งข้อความ",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
