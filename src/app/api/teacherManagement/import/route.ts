import { auth } from "@/lib/auth";
import { NextResponse, NextRequest } from "next/server";
import { MariaDBConnection } from "@/lib/config.mariaDB";
import { MongoDBConnection } from "@/lib/config.mongoDB";
import Teacher from "@/models/Mongo.model.Teacher";
import bcrypt from "bcrypt";
import {
  parseExcelBuffer,
  mapDataWithHeaders,
  teacherHeaderMapping,
} from "@/utils/excelParser";
import { PoolConnection } from "mariadb/*";

interface TeacherImportData {
  teacherId: string;
  name: string;
  department?: string;
  subject?: string;
  subjectGroup?: string;
  phone?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; teacherId: string; error: string }>;
}

async function genPassword(length: number) {
  const characters = "0123456789";
  let password = "T";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters.charAt(randomIndex);
  }
  return password;
}

export async function POST(req: NextRequest) {
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
  if (session.user.role !== "teacher")
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
        code: "FORBIDDEN",
      },
      { status: 403 }
    );

  let conn: PoolConnection | undefined;
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "กรุณาอัปโหลดไฟล์ Excel",
          code: "NO_FILE",
        },
        { status: 400 }
      );
    }

    // Check file type
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "กรุณาอัปโหลดไฟล์ Excel (.xlsx หรือ .xls) เท่านั้น",
          code: "INVALID_FILE_TYPE",
        },
        { status: 400 }
      );
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse Excel
    const parseResult = parseExcelBuffer(buffer);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: parseResult.error || "ไม่สามารถอ่านไฟล์ Excel ได้",
          code: "PARSE_ERROR",
        },
        { status: 400 }
      );
    }

    // Map data with Thai headers
    const teachers = mapDataWithHeaders<TeacherImportData>(
      parseResult.data,
      teacherHeaderMapping
    );

    if (teachers.length === 0) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "ไฟล์ Excel ไม่มีข้อมูล",
          code: "EMPTY_FILE",
        },
        { status: 400 }
      );
    }

    conn = await MariaDBConnection.getConnection();
    await MongoDBConnection();

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < teachers.length; i++) {
      const teacher = teachers[i];
      const rowNum = i + 2; // Excel row (1-indexed + header)

      // Validate required fields
      if (!teacher.teacherId || !teacher.name) {
        result.failed++;
        result.errors.push({
          row: rowNum,
          teacherId: teacher.teacherId || "N/A",
          error: "ข้อมูลไม่ครบ (ต้องมีรหัสครูและชื่อ)",
        });
        continue;
      }

      try {
        const passwordLogin = await genPassword(6);
        const hashPass = await bcrypt.hash(passwordLogin, 10);

        const query = `INSERT INTO ${process.env.MARIA_DB_TABLE_TEACHERS} 
          (TEACHER_ID, NAME, PASSWORD, DEPARTMENT, SUBJECT, PHONE, SUBJECT_GROUP, IS_ADMIN) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        await conn.execute(query, [
          teacher.teacherId,
          teacher.name,
          passwordLogin,
          teacher.department || null,
          teacher.subject || null,
          teacher.phone || null,
          teacher.subjectGroup || null,
          false,
        ]);

        // Add to MongoDB for authentication
        await Teacher.create({
          teacherId: teacher.teacherId,
          name: teacher.name,
          password: hashPass,
          department: teacher.department || null,
          role: "teacher",
          isAdmin: false,
        });

        result.success++;
      } catch (error: any) {
        result.failed++;
        console.error(`Error importing teacher ${teacher.teacherId}:`, error);
        let errorMessage = "เกิดข้อผิดพลาด";
        if (error.code === "ER_DUP_ENTRY") {
          const message = error.sqlMessage || error.message;
          if (message.includes("TEACHER_ID")) {
            errorMessage = `รหัสครู "${teacher.teacherId}" ซ้ำในระบบ`;
          } else {
            errorMessage = `ข้อมูลซ้ำ: ${message}`;
          }
        } else if (error.code === 11000) {
          // MongoDB duplicate key error
          errorMessage = `รหัสครู "${teacher.teacherId}" มีในระบบ MongoDB แล้ว`;
        } else {
          errorMessage = error.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        }
        result.errors.push({
          row: rowNum,
          teacherId: teacher.teacherId,
          error: errorMessage,
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `นำเข้าข้อมูลสำเร็จ ${result.success} รายการ, ล้มเหลว ${result.failed} รายการ`,
        result,
        code: "IMPORT_COMPLETE",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: error,
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}
