import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { auth } from "../../../../lib/auth";
const systemPath = path.join(process.cwd(), "config/system.json");
export async function GET(req) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({
            error: "Unauthorized",
            message: "คุณไม่ได้ยืนยันตัวตน",
            code: "UNAUTHORIZED",
        }, { status: 401 });
    }
    const data = JSON.parse(fs.readFileSync(systemPath, "utf-8"));
    return NextResponse.json({ success: true, data: data, code: "SUCCESS" }, { status: 200 });
}
export async function POST(req) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({
            error: "Unauthorized",
            message: "คุณไม่ได้ยืนยันตัวตน",
            code: "UNAUTHORIZED",
        }, { status: 401 });
    }
    const { main_active } = await req.json();
    console.log("State is Change");
    console.log("System State:", main_active);
    fs.writeFileSync(systemPath, JSON.stringify({ main_active: main_active }, null, 2));
    return NextResponse.json({ ok: true, main_active }, { status: 200 });
}
