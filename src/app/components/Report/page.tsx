"use client";

import React, { useState, useEffect, Suspense } from "react";
import { FileOutput, FileSpreadsheet, FolderOpenIcon } from "lucide-react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import type { Route } from "next";
import { SkeletonCard, SkeletonText } from "../Skeleton";

// Report Skeleton
const ReportSkeleton = () => (
  <main className="p-4">
    <div className="bg-white rounded-xl shadow-xl p-4 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-4 ml-2">
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  </main>
);


interface holiday {
  isHolidays: boolean;
  name?: string;
}
function ReportPage() {
  //--------- อ่านค่าจาก Parameter Url ------------
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = searchParams.get("type");

  // แจ้งเตือนแบบมุมบน
  const Toast = Swal.mixin({
    toast: true,
    position: "top",
    showConfirmButton: false,
    timer: 4000,
  });

  useEffect(() => {
    if (!params) return;

    const processPDF = async (typeFile: string) => {
      try {
        const res = await fetch(`/api/generate-pdf/${typeFile}`);
        if (res.ok)
          await Toast.fire({
            title: "กรุณารอประมาณ 1-2 นาที",
            icon: "success",
          });
        if (res.status === 400)
          return await Toast.fire({ title: "คำขอไม่ถูกต้อง", icon: "error" });

        const contentDisposition = res.headers.get("Content-Disposition");

        let fileName = `${typeFile}.pdf`;
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/);
          if (match && match[1]) {
            fileName = decodeURIComponent(match[1]); // รองรับชื่อไฟล์ภาษาไทย
          }
        }

        // ดาวน์โหลดไฟล์ pdf ที่ส่งกลับมาแบบอัตโนมัติ
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error To Download: ", error);
        return Toast.fire({ title: "Download Failed", icon: "error" });
      }
    };

    processPDF(params);
    const newUrl = `${window.location.pathname}?page=reports`;
    router.replace(newUrl as unknown as Route);
  }, [params]);
  // สิ้นสุดการดาวน์โหลดไฟล์ -----------------

  // ตรวจสอบวันหยุด ------------------------
  const [holiday, setHoliday] = useState<Partial<holiday>>({});

  const fetchData_holiday = async () => {
    const response = await fetch("/api/holidays", {
      method: "GET",
    });

    if (response.ok) setHoliday(await response.json());
  };

  // สิ้นสุดการตรวจสอบวันหยุด ------------------

  // เรียกใช้ฟังก์ชั่นของหน้า component ------------

  useEffect(() => {
    fetchData_holiday();
  }, []);

  return (
    <main className="p-4">
      <div className="bg-white rounded-xl shadow-xl p-4">
        <header className="text-base md:text-xl font-bold flex items-center">
          <FolderOpenIcon className="mr-2" /> เมนูแสดงการรายงานต่าง ๆ
        </header>
        {/* รายการฟังก์ชั่นรายงานทั้งหมด */}
        <div className="text-sm mt-4">
          <h1>- ไฟล์แสดงรายชื่อนักเรียน</h1>
          <p className="text-red-500 text-xs ml-2">
            ที่มีคะแนนความประพฤติต่ำกว่าเกณฑ์
          </p>
          <div className="flex m-2">
            <Link
              href={`${pathname}?${searchParams}&type=studentRandomly` as Route}
              className="flex items-center mr-2 text-blue-700"
            >
              <FileOutput />
              ไฟล์ PDF
            </Link>
            <a href="#" className="flex items-center text-green-700">
              <FileSpreadsheet />
              ไฟล์ Excel
            </a>
          </div>
        </div>
        <div className="text-sm mt-4">
          <h1>- คะแนนความประพฤตินักเรียนทั้งหมด</h1>
          <div className="flex m-2">
            <Link
              href={`${pathname}?${searchParams}&type=report_student-behaviorScore-all` as Route}
              className="flex items-center mr-2 text-blue-700"
            >
              <FileOutput />
              ไฟล์ PDF
            </Link>
            <a href="#" className="flex items-center text-green-700">
              <FileSpreadsheet />
              ไฟล์ Excel
            </a>
          </div>
        </div>
        <div className="text-sm mt-4">
          <div className="flex">
            <h1>- การเช็คชื่อวันนี้ </h1>
            {holiday.isHolidays && (
              <p className="text-red-500 text-xs ml-2">* {holiday.name}</p>
            )}
          </div>
          <div className="flex m-2">
            <a
              href={`${pathname}?${searchParams}&type=attendance-Today`}
              className={`flex items-center mr-2 text-blue-700 ${
                holiday.isHolidays && "cursor-not-allowed"
              }`}
            >
              <FileOutput />
              ไฟล์ PDF
            </a>
            <a
              href="#"
              className={`flex items-center text-green-700 ${
                holiday.isHolidays && "cursor-not-allowed"
              }`}
            >
              <FileSpreadsheet />
              ไฟล์ Excel
            </a>
          </div>
        </div>
        <div className="text-sm mt-4">
          <h1>- ประวัติการเช็คชื่อย้อนหลัง 3 เดือน</h1>
          <div className="flex m-2">
            <Link
              href={`${pathname}?${searchParams}&type=attendance-history-3months` as Route}
              className="flex items-center mr-2 text-blue-700"
            >
              <FileOutput />
              ไฟล์ PDF
            </Link>
            <a href="#" className="flex items-center text-green-700">
              <FileSpreadsheet />
              ไฟล์ Excel
            </a>
          </div>
        </div>
        <div className="text-sm mt-4">
          <h1>- สรุปการเข้าแถวประจำเดือน</h1>
          <div className="flex m-2">
            <Link
              href={`${pathname}?${searchParams}&type=monthly-summary` as Route}
              className="flex items-center mr-2 text-blue-700"
            >
              <FileOutput />
              ไฟล์ PDF
            </Link>
            <a href="#" className="flex items-center text-green-700">
              <FileSpreadsheet />
              ไฟล์ Excel
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
export default function Report() {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <ReportPage />
    </Suspense>
  )
}
