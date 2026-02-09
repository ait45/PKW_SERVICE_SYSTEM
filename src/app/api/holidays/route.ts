import { NextResponse } from "next/server";
import { Holiday } from "@/scripts/Holiday";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "คุณไม่ได้รับอนุญาต",
        code: "UNAUTHORIZED",
      },
      { status: 401 }
    );
  const today: Date = new Date();
  const holiday = Holiday(today);
  return NextResponse.json(holiday, { status: 200 });
}
