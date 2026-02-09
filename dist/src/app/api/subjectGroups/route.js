import fs from "fs";
import { auth } from "../../../lib/auth";
import { NextResponse } from "next/server";
import path from "path";
const subjectGroupsPath = path.join(process.cwd(), "config", "subject_groups.json");
export async function GET(req) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({
            error: "Unauthorized",
            message: "คุณไม่ได้ยืนยันตัวตน",
            code: "UNAUTHORIZED",
        }, { status: 401 });
    }
    try {
        const file = JSON.parse(fs.readFileSync(subjectGroupsPath, "utf-8"));
        return NextResponse.json({ success: true, data: file.subjectGroups, code: "SUCCESSFULLY" }, { status: 200 });
    }
    catch (error) {
        console.error("Failed to read subject groups:", error);
        return NextResponse.json({
            error: "Internal Server Error",
            message: "ไม่สามารถอ่านข้อมูลกลุ่มสาระได้",
            code: "INTERNAL_ERROR",
        }, { status: 500 });
    }
}
