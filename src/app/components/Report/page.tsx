"use client";

import React, { useState, useEffect, Suspense } from "react";
import {
  FileOutput,
  FileSpreadsheet,
  FolderOpen,
  Users,
  Star,
  CalendarCheck,
  History,
  CalendarDays,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import type { Route } from "next";

// ─── Skeleton ──────────────────────────────────────────────────────────
const ReportSkeleton = () => (
  <main className="p-4 max-w-4xl mx-auto">
    <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 space-y-4">
      <div className="h-7 w-56 bg-gray-200 rounded-xl animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  </main>
);

// ─── Types ──────────────────────────────────────────────────────────────
interface Holiday {
  isHolidays: boolean;
  name?: string;
}

interface ReportItem {
  key: string;           // type param สำหรับ API
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;         // tailwind color token เช่น "blue" | "purple" | "green" | "amber" | "rose"
  excelKey?: string;     // ถ้า API รองรับ excel format
  requiresWorkday?: boolean; // true = ปุ่ม disabled ในวันหยุด
}

// ─── Report Config ──────────────────────────────────────────────────────
const REPORTS: ReportItem[] = [
  {
    key: "studentRandomly",
    title: "รายชื่อนักเรียนคะแนนต่ำกว่าเกณฑ์",
    description: "แสดงรายชื่อนักเรียนที่มีคะแนนความประพฤติต่ำกว่าเกณฑ์ที่กำหนด",
    icon: <Users size={22} />,
    color: "blue",
  },
  {
    key: "report_student-behaviorScore-all",
    title: "คะแนนความประพฤตินักเรียนทั้งหมด",
    description: "สรุปคะแนนความประพฤติของนักเรียนทุกคนในระบบ",
    icon: <Star size={22} />,
    color: "purple",
  },
  {
    key: "attendance-Today",
    title: "การเช็คชื่อวันนี้",
    description: "รายงานผลการเช็คชื่อนักเรียนประจำวัน",
    icon: <CalendarCheck size={22} />,
    color: "emerald",
    requiresWorkday: true,
  },
  {
    key: "attendance-history-3months",
    title: "ประวัติการเช็คชื่อย้อนหลัง 3 เดือน",
    description: "บันทึกการเข้าแถวย้อนหลัง 3 เดือนล่าสุด",
    icon: <History size={22} />,
    color: "amber",
  },
  {
    key: "monthly-summary",
    title: "สรุปการเข้าแถวประจำเดือน",
    description: "สรุปสถิติการเข้าแถวรายเดือนของนักเรียนทุกชั้น",
    icon: <CalendarDays size={22} />,
    color: "rose",
  },
];

// ─── Color map ──────────────────────────────────────────────────────────
const colorMap: Record<string, { icon: string; badge: string; btn: string; btnText: string; border: string }> = {
  blue: { icon: "bg-blue-100 text-blue-600", badge: "bg-blue-50 text-blue-700 border-blue-200", btn: "bg-blue-500 hover:bg-blue-600 shadow-blue-200", btnText: "text-blue-600 hover:text-blue-800 hover:bg-blue-50", border: "border-blue-100" },
  purple: { icon: "bg-purple-100 text-purple-600", badge: "bg-purple-50 text-purple-700 border-purple-200", btn: "bg-purple-500 hover:bg-purple-600 shadow-purple-200", btnText: "text-purple-600 hover:text-purple-800 hover:bg-purple-50", border: "border-purple-100" },
  emerald: { icon: "bg-emerald-100 text-emerald-600", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", btn: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200", btnText: "text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50", border: "border-emerald-100" },
  amber: { icon: "bg-amber-100 text-amber-600", badge: "bg-amber-50 text-amber-700 border-amber-200", btn: "bg-amber-500 hover:bg-amber-600 shadow-amber-200", btnText: "text-amber-600 hover:text-amber-800 hover:bg-amber-50", border: "border-amber-100" },
  rose: { icon: "bg-rose-100 text-rose-600", badge: "bg-rose-50 text-rose-700 border-rose-200", btn: "bg-rose-500 hover:bg-rose-600 shadow-rose-200", btnText: "text-rose-600 hover:text-rose-800 hover:bg-rose-50", border: "border-rose-100" },
};

// ─── Main component ────────────────────────────────────────────────────
function ReportPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = searchParams.get("type");

  const [holiday, setHoliday] = useState<Partial<Holiday>>({});
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  // ─── Toast ──────────────────────────────────────────────────────────
  const Toast = Swal.mixin({
    toast: true,
    position: "top",
    showConfirmButton: false,
    timer: 4000,
  });

  // ─── Auto-download when ?type= present ──────────────────────────────
  useEffect(() => {
    if (!params) return;
    const processPDF = async (typeFile: string) => {
      try {
        setLoadingKey(typeFile);
        const res = await fetch(`/api/generate-pdf/${typeFile}`);
        if (res.status === 400) {
          await Toast.fire({ title: "คำขอไม่ถูกต้อง", icon: "error" });
          return;
        }
        if (!res.ok) {
          await Toast.fire({ title: "เกิดข้อผิดพลาด", icon: "error" });
          return;
        }
        await Toast.fire({ title: "กรุณารอประมาณ 1-2 นาที", icon: "success" });

        const contentDisposition = res.headers.get("Content-Disposition");
        let fileName = `${typeFile}.pdf`;
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/);
          if (match && match[1]) fileName = decodeURIComponent(match[1]);
        }
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Download error:", error);
        await Toast.fire({ title: "ดาวน์โหลดล้มเหลว", icon: "error" });
      } finally {
        setLoadingKey(null);
        // Clear the ?type= param to avoid re-triggering
        router.replace(`${pathname}?page=reports` as unknown as Route);
      }
    };
    processPDF(params);
  }, [params]);

  // ─── Fetch holiday ──────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/holidays")
      .then((r) => r.json())
      .then((d) => setHoliday(d))
      .catch(() => { });
  }, []);

  // ─── Handle PDF download ────────────────────────────────────────────
  const handleDownloadPDF = async (key: string, requiresWorkday?: boolean) => {
    if (requiresWorkday && holiday.isHolidays) {
      Swal.fire({ text: `วันนี้เป็นวันหยุด (${holiday.name}) ไม่สามารถออกรายงานนี้ได้`, icon: "warning", timer: 3000 });
      return;
    }
    try {
      setLoadingKey(key);
      const res = await fetch(`/api/generate-pdf/${key}`);
      if (res.status === 400) {
        await Toast.fire({ title: "คำขอไม่ถูกต้อง", icon: "error" });
        return;
      }
      if (!res.ok) {
        await Toast.fire({ title: "เกิดข้อผิดพลาด", icon: "error" });
        return;
      }
      await Toast.fire({ title: "กรุณารอประมาณ 1-2 นาที", icon: "success" });
      const contentDisposition = res.headers.get("Content-Disposition");
      let fileName = `${key}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) fileName = decodeURIComponent(match[1]);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      Toast.fire({ title: "ดาวน์โหลดล้มเหลว", icon: "error" });
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <main className="p-4 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-5 mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-2.5 rounded-xl shadow-md shadow-blue-200">
            <FolderOpen className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-800">ศูนย์รายงาน</h1>
            <p className="text-blue-400 text-xs">เลือกรายงานที่ต้องการดาวน์โหลด</p>
          </div>
        </div>

        {/* Holiday banner */}
        {holiday.isHolidays && (
          <div className="mt-4 flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
            <AlertTriangle className="text-rose-500 w-5 h-5 flex-shrink-0" />
            <div>
              <p className="text-rose-700 font-semibold text-sm">วันหยุด — รายงานบางรายการไม่พร้อมใช้งาน</p>
              <p className="text-rose-500 text-xs">{holiday.name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORTS.map((report) => {
          const c = colorMap[report.color];
          const isDisabledByHoliday = report.requiresWorkday && holiday.isHolidays;
          const isLoading = loadingKey === report.key;

          return (
            <div
              key={report.key}
              className={`bg-white rounded-2xl shadow-sm border ${c.border} p-5 flex flex-col gap-4 transition-shadow hover:shadow-md ${isDisabledByHoliday ? "opacity-60" : ""
                }`}
            >
              {/* Icon + title */}
              <div className="flex items-start gap-3">
                <div className={`${c.icon} p-2.5 rounded-xl flex-shrink-0`}>
                  {report.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-gray-800 text-sm leading-snug">{report.title}</h2>
                  <p className="text-gray-500 text-xs mt-1 leading-relaxed">{report.description}</p>
                  {isDisabledByHoliday && (
                    <span className="inline-block mt-1.5 text-xs text-rose-500 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                      ไม่พร้อมใช้ (วันหยุด)
                    </span>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => handleDownloadPDF(report.key, report.requiresWorkday)}
                  disabled={isLoading || !!loadingKey}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 ${c.btn} text-white rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <FileOutput size={14} />
                  )}
                  {isLoading ? "กำลังสร้าง..." : "ไฟล์ PDF"}
                </button>

                <button
                  disabled
                  title="กำลังพัฒนา"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gray-100 text-gray-400 rounded-xl text-xs font-semibold cursor-not-allowed border border-gray-200"
                >
                  <FileSpreadsheet size={14} />
                  Excel (เร็วๆ นี้)
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

export default function Report() {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <ReportPage />
    </Suspense>
  );
}
