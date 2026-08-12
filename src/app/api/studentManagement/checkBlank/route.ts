"use server";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MariaDBConnection } from "@/lib/config.mariaDB";
import { PoolConnection } from "mariadb/*";

export async function GET(req: NextRequest) {
    const commandQuery = 'SELECT * FROM ${process.env.MARIA_DB_TABLE_STUDENTS}';
    const session = await auth();
    if (!session)
        return NextResponse.json(
            {
                error: "Unauthorized",
                message: "ต้องยืนยันตัวตนก่อนใช้งาน",
                code: "UNAUTHORIZED",
            },
            { status: 401 },
        );
    let conn: PoolConnection | undefined;
    try {
        conn = await MariaDBConnection.getConnection();
        const [rows] = await conn.execute(commandQuery);
        return NextResponse.json(
            { success: true, data: rows, code: "GET_SUCCESS" },
            { status: 200 },
        );
    } catch (error) {
        return NextResponse.json(
            {
                error: "internal_server_error",
                message: error,
                code: "INTERNAL_SERVER_ERROR",
            },
            { status: 500 },
        );
    }
}

