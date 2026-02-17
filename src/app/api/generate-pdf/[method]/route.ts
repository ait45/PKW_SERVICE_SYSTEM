export const runtime = "nodejs";

// นำเข้าโมดูลที่จำเป็น -------------------
import PDFDocument from "pdfkit";

import PDFTable from "pdfkit-table";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { MongoDBConnection } from "@/lib/config.mongoDB";
import Student from "@/models/Mongo.model.Student";
import { Buffer } from "node:buffer";
import fs from "fs";
import path from "path";
import { PoolConnection } from "mariadb/*";
import { MariaDBConnection } from "@/lib/config.mariaDB";

type PDFDoc = InstanceType<typeof PDFDocument>;

const tableStudents = process.env.MARIA_DB_TABLE_STUDENTS;
function registerFonts(doc: PDFDoc) {
  const fontsDir = path.join(process.cwd(), "src", "app", "assets", "fonts");
  const fonts = {
    THSarabunNew: {
      normal: path.join(fontsDir, "THSarabunNew.ttf"),
      bold: path.join(fontsDir, "THSarabunNew Bold.ttf"),
      italic: path.join(fontsDir, "THSarabunNew Italic.ttf"),
      ExtraBold: path.join(fontsDir, "NotoSansThai ExtraBold.ttf"),
    },
  };

  const registered = [];
  // ตรวจฟอนต์ก่อน register

  for (const [family, styles] of Object.entries(fonts)) {
    for (const [style, file] of Object.entries(styles)) {
      if (fs.existsSync(file)) {
        const fontName = `${family} ${style}`;
        doc.registerFont(fontName, file);
        registered.push(fontName);
      } else {
        console.warn(`Font Not Found : ${file}`);
      }
    }
    console.log("Registered fonts:", registered.join(", "));
    return fonts; // คืน object ไปใช้ภายหลังได้ด้วย
  }
}

// สร้างชื่อไฟล์ pdf ------------------------
function getFileName(base: string) {
  const date = new Date().toISOString().replace(/[:.]/g, "-");
  return `${base}-${date}.pdf`;
}

// สร้าง id file --------------------------
function getIdFile(type: string) {
  const date = new Date();
  const tzOffset = 7 * 60; // Thailand UTC+7
  const ISOFormat = new Date(date.getTime() + tzOffset * 60000).toISOString();
  return `TH ${type} | ${ISOFormat}`;
}

// สร้างวันที่บนไฟล์ --------------------

const getThaiDate = () => {
  const now = new Date();
  const year = now.getFullYear() + 543;
  const monthNames = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];
  return `${now.getDate()} ${monthNames[now.getMonth()]} ${year}`;
};

const NameService: string = "PKW SERVICE SYSTEM";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ method: string }> },
) {
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

  const { method } = await params;

  // วาดลายน้ำด้านหลังเอกสาร

  const WaterMarkPage = (doc: PDFDoc, text: string = "PKW SERVICE SYSTEM") => {
    const { width, height } = doc.page;
    doc
      .save()
      .rotate(-45, { origin: [width / 1.5, height / 2.3] })
      .font("THSarabunNew ExtraBold")
      .fontSize(60)
      .fillColor("#F0F9FF")
      .text(text, doc.page.margins.left + 50, doc.page.margins.top + 200, {
        align: "center",
      })
      .restore();
  };

  // -------- HeaderPage ---------- //
  const HeaderPage = (doc: PDFDoc) => {
    const startX = doc.page.margins.left;
    const startY = doc.page.margins.top;

    // ระบุตำแหน่ง x, y ของโลโก้
    doc.image("./src/app/assets/logo.png", startX, startY, {
      width: 80,
    });
    
    // คำนวณตำแหน่งข้อความ (ขวาของโลโก้)
    const textX = startX + 80 + 10; // เว้นห่างจากโลโก้เล็กน้อย
    const textY = startY + 10; // ขยับลงมาหน่อยให้ดูบาลานซ์

    doc
      .font("THSarabunNew ExtraBold")
      .fontSize(24)
      .fillColor("#000")
      .text("PRAKEAWASAWITTAYA", textX, textY, { lineBreak: false });

    doc
      .moveTo(textX, textY + 30)
      .lineTo(textX + 250, textY + 30)
      .lineWidth(1.5)
      .strokeColor("blue")
      .stroke();
    doc
      .font("THSarabunNew bold")
      .fontSize(18)
      .text("PKW SERVICE SYSTEM", textX, textY + 32, { lineBreak: false })
      .fillColor("black");

    // date + handlers (วาดแยกไม่ให้กระทบ cursor หลัก)
    doc.fontSize(12).opacity(1);
    doc.text(
      `ออกเมื่อวันที่: ${getThaiDate()}`,
      doc.page.margins.left,
      doc.page.height - 40,
      { align: "right", lineBreak: false },
    );
    doc.text("โดยระบบ", doc.page.margins.left, doc.page.height - 28, { 
      align: "right", 
      lineBreak: false 
    });
  };
  const FooterPage = (doc: PDFDoc, pageNumber: number, idFile: string) => {
    doc
      .font("THSarabunNew normal")
      .fontSize(10)
      .fillColor("#888")
      .text(
        `${getIdFile(idFile)}  หน้าที่ ${pageNumber}`,
        50,
        doc.page.height - 50,
        {
          align: "right",
        },
      );
  };

  if (method === "qr-student") {
    let conn: PoolConnection | undefined;
    try {
      conn = await MariaDBConnection.getConnection();
      const fileName = getFileName("PKW-QrCode-Student");
      
      const query = `SELECT STUDENT_ID, NAME, CLASSES FROM ${tableStudents}`;
      const students = await conn.query(query);

      // สร่้าง table content แบบ QR
      const doc = new PDFDocument({
        size: "A4",
        margin: 30,
        info: {
          Title: "QrCode สำหรับการเช็คชื่อ",
          Author: NameService,
        },
      });

      // เช็ค fonts ในระบบ
      registerFonts(doc);

      const buffers: any[] = [];
      doc.on("data", buffers.push.bind(buffers));
      const pdfPromise = new Promise(async (resolve, reject) => {
        // ตั้งค่า layout
        const pageWidth =
          doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const colWidth = pageWidth / 3;
        const qrSize = 100;

        // กำหนดพิกัด x y
        let x = doc.page.margins.left;
        let y = doc.page.margins.top;

        // แยกข้อมูลตามชั้นเรียน
        const classes = [...new Set(students.map((s: any) => s.CLASSES))];
        let isFirstClass = true;
        for (const cls of classes) {
          const classStudent = students.filter((s: any) => s.CLASSES === cls);
          // ถ้าไม่ใช่ชั้นแรก ให้ขึ้นหน้าใหม่
          if (!isFirstClass) {
            doc.addPage();
          }
          isFirstClass = false;
          HeaderPage(doc);

          x = doc.page.margins.left;
          // ใช้ค่าคงที่แทน doc.y เพราะ doc.y อาจไม่แน่นอน
          y = doc.page.margins.top + 80; // เริ่มหลัง header
          let count = 0;

          doc
            .fontSize(16)
            .fillColor("#000")
            .text(`ชั้น: ${cls}`, x + 30, y);
          y += 40;

          // วาด QRcode
          for (const student of classStudent) {
            // แปลงเป็น string เพราะ QRCode ต้องการ string
            const studentId = String(student.STUDENT_ID || "");
            if (!studentId) continue;
            
            const qrData = await QRCode.toDataURL(studentId, {
              type: "image/png",
              color: {
                dark: "#000000",
                light: "#00000000",
              },
            });
            const base64Data = qrData.replace(/^data:image\/png;base64,/, "");
            const buffer = Buffer.from(base64Data, "base64");

            // QRcode
            doc.image(buffer, x + (colWidth - qrSize) / 2, y, {
              width: qrSize,
              height: qrSize,
            });

            // ข้อมูลใต้ QrCode
            doc
              .font("THSarabunNew bold")
              .fontSize(16)
              .text(`${student.STUDENT_ID}`, x, y + qrSize + 5, {
                width: colWidth,
                align: "center",
              });
            doc.text(`${student.NAME}`, x, y + qrSize + 20, {
              width: colWidth,
              align: "center",
            });
            doc.text(`${student.CLASSES}`, x, y + qrSize + 35, {
              width: colWidth,
              align: "center",
            });

            count++;
            if (count % 3 === 0) {
              x = doc.page.margins.left;
              y += 180;
              if (y + 180 > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
                HeaderPage(doc);
                doc
                  .fontSize(16)
                  .fillColor("#000")
                  .text(`ชั้น: ${cls}`, x + 30, doc.page.margins.top + 80);
                y = doc.page.margins.top + 100;
              }
            } else {
              x += colWidth;
            }
          }
        }
        y += 200;

        doc.end();
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", reject);
      });

      const pdfBuffer = await pdfPromise;

      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${encodeURIComponent(
            fileName,
          )}`,
        },
      });
    } catch (error) {
      console.error("Pdf generate failed", error);
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: error,
          code: "INTERNAL_ERROR",
        },
        { status: 500 },
      );
    } finally {
      if (conn) conn.release();
    }
  }
  // รายงานคะแนนความประพฤติของนักเรียนทั้งหมด ----------------------------
  if (method === "report_student-behaviorScore-all") {
    try {
      const filename = getFileName("behaviorScore-all");
      const data_student = await Student.find();
      const doc = new PDFDocument({
        size: "A4",
        margin: "30",
        info: {
          Title: "คะแนนความประพฤตินักเรียน",
          Author: NameService,
        },
      });

      const buffers: any[] = [];
      doc.on("data", buffers.push.bind(buffers));
      const pdfPromise = new Promise(async (resolve, reject) => {
        let pageNumber = 1;

        // จัดข้อมูลตามชั้นเรียน
        const groupByClass = data_student.reduce(
          (acc: Record<string, any[]>, cur) => {
            if (!acc[cur.classes]) acc[cur.classes] = [];
            acc[cur.classes].push(cur);
            return acc;
          },
          {} as Record<string, any[]>,
        );

        // loop ชั้นเรียนแต่ละชั้น
        let index = 0;
        const lastIndex = Object.keys(groupByClass).length - 1;
        for (const classes of Object.keys(groupByClass)) {
          HeaderPage(doc);
          WaterMarkPage(doc);

          const classStudent = groupByClass[classes];
          const isLast = index === lastIndex;
          doc
            .font("THSarabunNew bold")
            .fontSize(24)
            .text(
              "รายงานคะแนนความประพฤติ",
              doc.page.margins.left,
              doc.page.margins.top + 65,
              { align: "center" },
            );
          doc
            .font("THSarabunNew normal")
            .fontSize(16)
            .text(
              `ระดับชั้น : ${classes}`,
              doc.page.margins.left,
              doc.page.margins.top + 90,
              { align: "center" },
            );
          // สร้างตาราง
          const headers = [
            { text: "รหัสนักเรียน" },
            { text: "ชื่อ-สกุล" },
            "คะแนน",
            "มา",
            "ลา",
            "สาย",
            "ขาด",
          ];
          const data = classStudent.map((s: any) => [
            s.studentId,
            { text: s.name },
            s.behaviorScore,
            s.joinDays,
            s.leaveDays,
            s.lateDays,
            s.absentDays,
          ]);
          const tableData = [headers, ...data];

          doc.font("THSarabunNew normal").table({
            position: {
              x: doc.page.margins.left + 30,
              y: doc.page.margins.top + 120,
            },
            columnStyles: [80, 200, 60, 30, 30, 30, 30],
            data: tableData,
          });
          FooterPage(doc, pageNumber, "RP-sc/a");
          pageNumber++;
          index++;
          if (!isLast) doc.addPage();
        }
        doc.end();
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", reject);
      });
      const pdfBuffer = await pdfPromise;

      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename=${encodeURIComponent(
            filename,
          )}`,
        },
      });
    } catch (error) {
      console.error("PDF Generate failed: ", error);
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
  // รายงานนักเรียนที่มีคะแนนความประพฤติต่ำกว่าเกณฑ์ ----------------------------
  if (method === "studentRandomly") {
    try {
      const filename = getFileName("low-behavior-students");
      await MongoDBConnection();
      const data_student = await Student.find();

      // กรองเฉพาะนักเรียนที่มีคะแนนต่ำกว่า 60
      const lowScoreStudents = data_student.filter(
        (s: any) => (s.behaviorScore || 100) < 60,
      );

      const doc = new PDFDocument({
        size: "A4",
        margin: 30,
        info: {
          Title: "นักเรียนที่มีคะแนนความประพฤติต่ำกว่าเกณฑ์",
          Author: NameService,
        },
      });

      registerFonts(doc);
      const buffers: any[] = [];
      doc.on("data", buffers.push.bind(buffers));

      const pdfPromise = new Promise(async (resolve, reject) => {
        let pageNumber = 1;

        // จัดข้อมูลตามชั้นเรียน
        const groupByClass = lowScoreStudents.reduce(
          (acc: Record<string, any[]>, cur: any) => {
            const cls = cur.classes || "ไม่ระบุ";
            if (!acc[cls]) acc[cls] = [];
            acc[cls].push(cur);
            return acc;
          },
          {} as Record<string, any[]>,
        );

        const classKeys = Object.keys(groupByClass);

        if (classKeys.length === 0) {
          // ไม่มีนักเรียนที่คะแนนต่ำ
          HeaderPage(doc);
          WaterMarkPage(doc);
          doc
            .font("THSarabunNew bold")
            .fontSize(24)
            .text(
              "รายงานนักเรียนที่มีคะแนนความประพฤติต่ำกว่าเกณฑ์",
              doc.page.margins.left,
              doc.page.margins.top + 65,
              { align: "center" },
            );
          doc
            .font("THSarabunNew normal")
            .fontSize(16)
            .text(
              "ไม่พบนักเรียนที่มีคะแนนความประพฤติต่ำกว่า 60 คะแนน",
              doc.page.margins.left,
              doc.page.margins.top + 120,
              { align: "center" },
            );
          FooterPage(doc, pageNumber, "RP-low/s");
        } else {
          let index = 0;
          const lastIndex = classKeys.length - 1;

          for (const classes of classKeys) {
            HeaderPage(doc);
            WaterMarkPage(doc);

            const classStudent = groupByClass[classes];
            const isLast = index === lastIndex;

            doc
              .font("THSarabunNew bold")
              .fontSize(24)
              .text(
                "รายงานนักเรียนที่มีคะแนนความประพฤติต่ำกว่าเกณฑ์",
                doc.page.margins.left,
                doc.page.margins.top + 65,
                { align: "center" },
              );
            doc
              .font("THSarabunNew normal")
              .fontSize(16)
              .text(
                `ระดับชั้น : ${classes}`,
                doc.page.margins.left,
                doc.page.margins.top + 90,
                { align: "center" },
              );

            // สร้างตาราง
            const headers = [
              { text: "รหัสนักเรียน" },
              { text: "ชื่อ-สกุล" },
              "คะแนน",
              "มา",
              "ลา",
              "สาย",
              "ขาด",
            ];
            const data = classStudent.map((s: any) => [
              s.studentId,
              { text: s.name },
              s.behaviorScore || 100,
              s.joinDays || 0,
              s.leaveDays || 0,
              s.lateDays || 0,
              s.absentDays || 0,
            ]);
            const tableData = [headers, ...data];

            doc.font("THSarabunNew normal").table({
              position: {
                x: doc.page.margins.left + 30,
                y: doc.page.margins.top + 120,
              },
              columnStyles: [80, 200, 60, 30, 30, 30, 30],
              data: tableData,
            });

            FooterPage(doc, pageNumber, "RP-low/s");
            pageNumber++;
            index++;
            if (!isLast) doc.addPage();
          }
        }

        doc.end();
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", reject);
      });

      const pdfBuffer = await pdfPromise;

      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename=${encodeURIComponent(filename)}`,
        },
      });
    } catch (error) {
      console.error("PDF Generate failed: ", error);
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

  // รายงานการเข้าแถวประจำวัน ----------------------------
  if (method === "attendance-Today") {
    let conn;
    try {
      const filename = getFileName("attendance-today");
      const attendance_Table = process.env.MARIA_DB_TABLE_ATTENDANCE;
      const students_Table = process.env.MARIA_DB_TABLE_STUDENTS;

      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      conn = await (
        await import("@/lib/config.mariaDB")
      ).MariaDBConnection.getConnection();

      // ดึงข้อมูลนักเรียนทั้งหมด
      const allStudents = await conn.query(
        `SELECT STUDENT_ID, NAME, CLASSES FROM ${students_Table} ORDER BY CLASSES, NUMBER`,
      );

      // ดึงข้อมูลการเช็คชื่อวันนี้
      const attendanceToday = await conn.query(
        `SELECT STUDENT_ID, NAME, CLASSES, STATUS, CREATED_AT FROM ${attendance_Table} WHERE CREATED_AT BETWEEN ? AND ? ORDER BY CLASSES, CREATED_AT`,
        [startOfDay, endOfDay],
      );

      // สร้าง map ของการเช็คชื่อ
      const attendanceMap = new Map();
      for (const record of attendanceToday) {
        attendanceMap.set(record.STUDENT_ID, record);
      }

      const doc = new PDFDocument({
        size: "A4",
        margin: 30,
        info: {
          Title: "รายงานการเข้าแถวประจำวัน",
          Author: NameService,
        },
      });

      registerFonts(doc);
      const buffers: any[] = [];
      doc.on("data", buffers.push.bind(buffers));

      const pdfPromise = new Promise(async (resolve, reject) => {
        let pageNumber = 1;

        // จัดข้อมูลตามชั้นเรียน
        const groupByClass = allStudents.reduce(
          (acc: Record<string, any[]>, cur: any) => {
            const cls = cur.CLASSES || "ไม่ระบุ";
            if (!acc[cls]) acc[cls] = [];
            acc[cls].push(cur);
            return acc;
          },
          {} as Record<string, any[]>,
        );

        let index = 0;
        const classKeys = Object.keys(groupByClass);
        const lastIndex = classKeys.length - 1;

        for (const classes of classKeys) {
          HeaderPage(doc);
          WaterMarkPage(doc);

          const classStudents = groupByClass[classes];
          const isLast = index === lastIndex;

          doc
            .font("THSarabunNew bold")
            .fontSize(24)
            .text(
              "รายงานการเข้าแถวประจำวัน",
              doc.page.margins.left,
              doc.page.margins.top + 65,
              { align: "center" },
            );
          doc
            .font("THSarabunNew normal")
            .fontSize(16)
            .text(
              `ระดับชั้น : ${classes} | วันที่ : ${getThaiDate()}`,
              doc.page.margins.left,
              doc.page.margins.top + 90,
              { align: "center" },
            );

          // สร้างตาราง
          const headers = [
            { text: "รหัสนักเรียน" },
            { text: "ชื่อ-สกุล" },
            "สถานะ",
            "เวลา",
          ];

          const data = classStudents.map((s: any) => {
            const attendance = attendanceMap.get(s.STUDENT_ID);
            let status = "ยังไม่เช็คชื่อ";
            let time = "-";

            if (attendance) {
              status =
                attendance.STATUS === "join"
                  ? "มา"
                  : attendance.STATUS === "late"
                    ? "สาย"
                    : attendance.STATUS === "leave"
                      ? "ลา"
                      : attendance.STATUS === "absent"
                        ? "ขาด"
                        : attendance.STATUS;
              time = new Date(attendance.CREATED_AT).toLocaleTimeString(
                "th-TH",
                { hour: "2-digit", minute: "2-digit" },
              );
            }

            return [s.STUDENT_ID, { text: s.NAME }, status, time];
          });

          const tableData = [headers, ...data];

          doc.font("THSarabunNew normal").table({
            position: {
              x: doc.page.margins.left + 30,
              y: doc.page.margins.top + 120,
            },
            columnStyles: [100, 220, 60, 60],
            data: tableData,
          });

          FooterPage(doc, pageNumber, "RP-att/t");
          pageNumber++;
          index++;
          if (!isLast) doc.addPage();
        }

        doc.end();
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", reject);
      });

      const pdfBuffer = await pdfPromise;
      conn.release();

      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename=${encodeURIComponent(filename)}`,
        },
      });
    } catch (error) {
      if (conn) conn.release();
      console.error("PDF Generate failed: ", error);
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

  // รายงานประวัติการเข้าแถวย้อนหลัง 3 เดือน ----------------------------
  if (method === "attendance-history-3months") {
    try {
      const filename = getFileName("attendance-history-3months");
      await MongoDBConnection();
      const data_student = await Student.find();

      const doc = new PDFDocument({
        size: "A4",
        margin: 30,
        info: {
          Title: "ประวัติการเข้าแถวย้อนหลัง 3 เดือน",
          Author: NameService,
        },
      });

      registerFonts(doc);
      const buffers: any[] = [];
      doc.on("data", buffers.push.bind(buffers));

      const pdfPromise = new Promise(async (resolve, reject) => {
        let pageNumber = 1;

        // จัดข้อมูลตามชั้นเรียน
        const groupByClass = data_student.reduce(
          (acc: Record<string, any[]>, cur: any) => {
            const cls = cur.classes || "ไม่ระบุ";
            if (!acc[cls]) acc[cls] = [];
            acc[cls].push(cur);
            return acc;
          },
          {} as Record<string, any[]>,
        );

        let index = 0;
        const classKeys = Object.keys(groupByClass);
        const lastIndex = classKeys.length - 1;

        for (const classes of classKeys) {
          HeaderPage(doc);
          WaterMarkPage(doc);

          const classStudent = groupByClass[classes];
          const isLast = index === lastIndex;

          doc
            .font("THSarabunNew bold")
            .fontSize(24)
            .text(
              "ประวัติการเข้าแถวย้อนหลัง 3 เดือน",
              doc.page.margins.left,
              doc.page.margins.top + 65,
              { align: "center" },
            );
          doc
            .font("THSarabunNew normal")
            .fontSize(16)
            .text(
              `ระดับชั้น : ${classes}`,
              doc.page.margins.left,
              doc.page.margins.top + 90,
              { align: "center" },
            );

          // สร้างตาราง
          const headers = [
            { text: "รหัสนักเรียน" },
            { text: "ชื่อ-สกุล" },
            "มา",
            "ลา",
            "สาย",
            "ขาด",
            "รวม",
          ];
          const data = classStudent.map((s: any) => {
            const join = s.joinDays || 0;
            const leave = s.leaveDays || 0;
            const late = s.lateDays || 0;
            const absent = s.absentDays || 0;
            const total = join + leave + late + absent;
            return [
              s.studentId,
              { text: s.name },
              join,
              leave,
              late,
              absent,
              total,
            ];
          });
          const tableData = [headers, ...data];

          doc.font("THSarabunNew normal").table({
            position: {
              x: doc.page.margins.left + 30,
              y: doc.page.margins.top + 120,
            },
            columnStyles: [80, 200, 40, 40, 40, 40, 40],
            data: tableData,
          });

          FooterPage(doc, pageNumber, "RP-hist/3m");
          pageNumber++;
          index++;
          if (!isLast) doc.addPage();
        }

        doc.end();
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", reject);
      });

      const pdfBuffer = await pdfPromise;

      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename=${encodeURIComponent(filename)}`,
        },
      });
    } catch (error) {
      console.error("PDF Generate failed: ", error);
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

  // รายงานสรุปการเข้าแถวประจำเดือน ----------------------------
  if (method === "monthly-summary") {
    try {
      await MongoDBConnection();
      const filename = getFileName("monthly-summary");
      const data_student = await Student.find();

      // ดึงเดือนปัจจุบัน
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const thaiMonthNames = [
        "มกราคม",
        "กุมภาพันธ์",
        "มีนาคม",
        "เมษายน",
        "พฤษภาคม",
        "มิถุนายน",
        "กรกฎาคม",
        "สิงหาคม",
        "กันยายน",
        "ตุลาคม",
        "พฤศจิกายน",
        "ธันวาคม",
      ];
      const monthName = thaiMonthNames[currentMonth];
      const thaiYear = currentYear + 543;

      const doc = new PDFDocument({
        size: "A4",
        margin: 30,
        info: {
          Title: `สรุปการเข้าแถวประจำเดือน ${monthName} ${thaiYear}`,
          Author: NameService,
        },
      });

      registerFonts(doc);

      const buffers: any[] = [];
      doc.on("data", buffers.push.bind(buffers));
      const pdfPromise = new Promise(async (resolve, reject) => {
        let pageNumber = 1;

        // จัดข้อมูลตามชั้นเรียน
        const groupByClass = data_student.reduce(
          (acc: Record<string, any[]>, cur) => {
            if (!acc[cur.classes]) acc[cur.classes] = [];
            acc[cur.classes].push(cur);
            return acc;
          },
          {} as Record<string, any[]>,
        );

        // loop ชั้นเรียนแต่ละชั้น
        let index = 0;
        const lastIndex = Object.keys(groupByClass).length - 1;
        for (const classes of Object.keys(groupByClass)) {
          HeaderPage(doc);
          WaterMarkPage(doc);

          const classStudent = groupByClass[classes];
          const isLast = index === lastIndex;

          doc
            .font("THSarabunNew bold")
            .fontSize(24)
            .text(
              `สรุปการเข้าแถวประจำเดือน ${monthName} พ.ศ. ${thaiYear}`,
              doc.page.margins.left,
              doc.page.margins.top + 65,
              { align: "center" },
            );
          doc
            .font("THSarabunNew normal")
            .fontSize(16)
            .text(
              `ระดับชั้น : ${classes}`,
              doc.page.margins.left,
              doc.page.margins.top + 90,
              { align: "center" },
            );

          // สร้างตาราง
          const headers = [
            { text: "ลำดับ" },
            { text: "รหัสนักเรียน" },
            { text: "ชื่อ-สกุล" },
            "มา",
            "ลา",
            "สาย",
            "ขาด",
            "รวม",
          ];
          const data = classStudent.map((s: any, idx: number) => {
            const join = s.joinDays || 0;
            const leave = s.leaveDays || 0;
            const late = s.lateDays || 0;
            const absent = s.absentDays || 0;
            const total = join + leave + late + absent;
            return [
              idx + 1,
              s.studentId,
              { text: s.name },
              join,
              leave,
              late,
              absent,
              total,
            ];
          });
          const tableData = [headers, ...data];

          doc.font("THSarabunNew normal").table({
            position: {
              x: doc.page.margins.left + 10,
              y: doc.page.margins.top + 120,
            },
            columnStyles: [35, 80, 180, 40, 40, 40, 40, 40],
            data: tableData,
          });

          FooterPage(doc, pageNumber, "RP-monthly");
          pageNumber++;
          index++;
          if (!isLast) doc.addPage();
        }

        doc.end();
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", reject);
      });

      const pdfBuffer = await pdfPromise;

      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename=${encodeURIComponent(filename)}`,
        },
      });
    } catch (error) {
      console.error("PDF Generate failed: ", error);
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

  return NextResponse.json(
    { error: "Bad Request", message: "คำขอไม่ถูกต้อง", code: "BAD_REQUEST" },
    { status: 400 },
  );
}
