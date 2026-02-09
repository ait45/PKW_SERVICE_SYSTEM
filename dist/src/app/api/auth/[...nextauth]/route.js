import { NextResponse } from "next/server";
import { handlers } from "../../../../lib/auth";
import { checkRatelimit } from "../../../../utils/ratelimit";
import { getIP } from "../../../../utils/getIP";
export async function GET(req) {
    return handlers.GET(req);
}
export async function POST(req) {
    const ip = getIP(req);
    if (!checkRatelimit(ip, 5)) {
        return NextResponse.json({ error: "Too Many requests" }, {
            status: 429,
        });
    }
    return handlers.POST(req);
}
