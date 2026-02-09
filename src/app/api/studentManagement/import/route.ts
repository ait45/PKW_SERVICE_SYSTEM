import { auth } from "@/lib/auth";
import { NextResponse, NextRequest } from "next/server";
import { MariaDBConnection } from "@/lib/config.mariaDB";
import { MongoDBConnection } from "@/lib/config.mongoDB";
import Student from "@/models/Mongo.model.Student";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  parseExcelBuffer,
  mapDataWithHeaders,
  studentHeaderMapping,
} from "@/utils/excelParser";
import { PoolConnection } from "mariadb/*";

interface StudentImportData {
  studentId: string;
  name: string;
  classes?: string;
  Number?: string;
  phone?: string;
  parentPhone?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; studentId: string; error: string }>;
}

const TABLE_STUDENTS = process.env.MARIA_DB_TABLE_STUDENTS;

async function genPassword(size: number) {
  const number = "1234567890";
  let password = "PKW_";

  const bytes = crypto.randomBytes(size);
  for (let i = 0; i < size; i++) {
    password += number[bytes[i] % number.length];
  }
  return password;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "ต้องยืนยันตัวตนก่อนใช้งาน",
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
    const students = mapDataWithHeaders<StudentImportData>(
      parseResult.data,
      studentHeaderMapping
    );

    if (students.length === 0) {
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

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const rowNum = i + 2; // Excel row (1-indexed + header)

      // Validate required fields
      if (!student.studentId || !student.name) {
        result.failed++;
        result.errors.push({
          row: rowNum,
          studentId: student.studentId || "N/A",
          error: "ข้อมูลไม่ครบ (ต้องมีรหัสนักเรียนและชื่อ)",
        });
        continue;
      }

      try {
        const plantData = await genPassword(5);
        const password = await bcrypt.hash(plantData, 10);

        const query = `INSERT INTO ${TABLE_STUDENTS} 
          (STUDENT_ID, NAME, CLASSES, PHONE, PARENT_PHONE, PLANT_PASSWORD, NUMBER) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`;

        await conn.execute(query, [
          student.studentId,
          student.name,
          student.classes || null,
          student.phone || null,
          student.parentPhone || null,
          plantData,
          student.Number || null,
        ]);

        // Add to MongoDB for authentication
        await Student.create({
          studentId: student.studentId,
          name: student.name,
          password: password,
        });

        result.success++;
      } catch (error: any) {
        result.failed++;
        console.error(`Error importing student ${student.studentId}:`, error);
        let errorMessage = "เกิดข้อผิดพลาด";
        if (error.code === "ER_DUP_ENTRY") {
          const message = error.sqlMessage || error.message;
          if (message.includes("STUDENT_ID")) {
            errorMessage = `รหัสนักเรียน "${student.studentId}" ซ้ำในระบบ`;
          } else if (message.includes("unique_class_number")) {
            errorMessage = `เลขที่ "${student.Number}" ซ้ำในห้อง ${student.classes}`;
          } else {
            errorMessage = `ข้อมูลซ้ำ: ${message}`;
          }
        } else if (error.code === 11000) {
          // MongoDB duplicate key error
          errorMessage = `รหัสนักเรียน "${student.studentId}" มีในระบบ MongoDB แล้ว`;
        } else {
          errorMessage = error.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        }
        result.errors.push({
          row: rowNum,
          studentId: student.studentId,
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
