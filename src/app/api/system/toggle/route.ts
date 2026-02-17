import { NextResponse, NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { auth } from "@/lib/auth";

const systemPath = path.join(process.cwd(), "config", "setting.json");

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

  const data = JSON.parse(fs.readFileSync(systemPath, "utf-8"));
  return NextResponse.json(
    { success: true, data: data.system.main_active, code: "SUCCESS" },
    { status: 200 },
  );
}
export async function POST(req: NextRequest) {
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

  const { main_active } = await req.json();

  console.log("State is Change");
  console.log("System State:", main_active);

  try {
    // อ่านไฟล์เดิมก่อนเพื่อไม่ให้ค่า config อื่นหาย
    const fileContent = fs.readFileSync(systemPath, "utf-8");
    const currentData = JSON.parse(fileContent);

    // อัปเดตค่าเฉพาะส่วนที่ต้องการ
    const newData = {
      ...currentData,
      system: {
        ...currentData.system,
        main_active: main_active,
      },
    };
    fs.writeFileSync(systemPath, JSON.stringify(newData, null, 2));
    return NextResponse.json(
      { success: true, state: main_active, code: "STATE_CHANGED" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json({
      error: "Internal Server Error",
      message: error,
      code: "INTERNAL SERVER ERROR",
    });
  }
}
