import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import fs from "fs";
import path from "path";

const holidaysPath = path.join(process.cwd(), "config", "holidays.json");

function readHolidays() {
  return JSON.parse(fs.readFileSync(holidaysPath, "utf-8"));
}

function writeHolidays(data: any[]) {
  fs.writeFileSync(holidaysPath, JSON.stringify(data, null, 2), "utf-8");
}

// GET — ดึงรายการวันหยุดทั้งหมด
export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const holidays = readHolidays();
    return NextResponse.json({ success: true, holidays });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "ไม่สามารถอ่านข้อมูลวันหยุดได้" },
      { status: 500 },
    );
  }
}

// POST — เพิ่มวันหยุดใหม่
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { date, name, type, status } = body;

    if (!date || !name || !type) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกข้อมูลให้ครบ (date, name, type)" },
        { status: 400 },
      );
    }

    const holidays = readHolidays();

    // ตรวจสอบวันซ้ำ
    if (holidays.some((h: any) => h.date === date)) {
      return NextResponse.json(
        { success: false, message: `วันที่ ${date} มีอยู่แล้วในระบบ` },
        { status: 409 },
      );
    }

    const entry: any = { date, name, type };
    if (type === "auto_present" && status) {
      entry.status = status;
    }

    holidays.push(entry);
    // เรียงตามวันที่
    holidays.sort((a: any, b: any) => a.date.localeCompare(b.date));
    writeHolidays(holidays);

    return NextResponse.json({ success: true, message: "เพิ่มวันหยุดสำเร็จ" });
  } catch (error) {
    console.error("Error adding holiday:", error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}

// PUT — แก้ไขวันหยุด
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { originalDate, date, name, type, status } = body;

    if (!originalDate || !date || !name || !type) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกข้อมูลให้ครบ" },
        { status: 400 },
      );
    }

    const holidays = readHolidays();
    const idx = holidays.findIndex((h: any) => h.date === originalDate);
    if (idx === -1) {
      return NextResponse.json(
        { success: false, message: "ไม่พบวันหยุดที่ต้องการแก้ไข" },
        { status: 404 },
      );
    }

    // ตรวจสอบวันซ้ำ (ถ้าเปลี่ยนวัน)
    if (originalDate !== date && holidays.some((h: any) => h.date === date)) {
      return NextResponse.json(
        { success: false, message: `วันที่ ${date} มีอยู่แล้วในระบบ` },
        { status: 409 },
      );
    }

    holidays[idx] = { date, name, type };
    if (type === "auto_present" && status) {
      holidays[idx].status = status;
    }

    holidays.sort((a: any, b: any) => a.date.localeCompare(b.date));
    writeHolidays(holidays);

    return NextResponse.json({ success: true, message: "แก้ไขวันหยุดสำเร็จ" });
  } catch (error) {
    console.error("Error updating holiday:", error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}

// DELETE — ลบวันหยุด
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุวันที่ต้องการลบ" },
        { status: 400 },
      );
    }

    const holidays = readHolidays();
    const filtered = holidays.filter((h: any) => h.date !== date);

    if (filtered.length === holidays.length) {
      return NextResponse.json(
        { success: false, message: "ไม่พบวันหยุดที่ต้องการลบ" },
        { status: 404 },
      );
    }

    writeHolidays(filtered);

    return NextResponse.json({ success: true, message: "ลบวันหยุดสำเร็จ" });
  } catch (error) {
    console.error("Error deleting holiday:", error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
