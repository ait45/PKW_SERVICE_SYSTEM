import { NextResponse, NextRequest } from "next/server";
import readConfig from "@/scripts/readConfig";
import { promises as fs } from "fs";
import path from "path";
import { auth } from "@/lib/auth";

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
  try {
    const settings = await readConfig();
    return NextResponse.json(
      { success: true, data: settings, code: "SUCCESS" },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error,
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
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
  if (session.user.role !== "teacher") {
    return NextResponse.json(
      { error: "Forbidden", message: "คุณไม่ได้รับอนุญาต", code: "FORBIDDEN" },
      { status: 403 },
    );
  }

  try {
    const data = await req.json();

    const filePath = path.join(process.cwd(), "config", "settings.json");
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");

    return NextResponse.json(
      {
        success: true,
        message: "Data Uploaded SuccessFully.",
        code: "SUCCCESS",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error,
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
}
