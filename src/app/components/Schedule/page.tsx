"use client";

import React, { useState, useEffect, useRef } from "react";
import { Calendar, Clock, BookOpen, User, MapPin, Printer, Download, FileText, ChevronDown } from "lucide-react";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ScheduleItem {
  ID: number;
  CLASS_ID: string;
  DAY_OF_WEEK: number;
  PERIOD: number;
  SUBJECT: string;
  TEACHER_ID: string;
  TEACHER_NAME: string;
  ROOM: string;
}

const dayNames = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์"];
const periodTimes = [
  { period: 1, time: "08:40-09:30" },
  { period: 2, time: "09:30-10:20" },
  { period: 3, time: "10:20-11:10" },
  { period: 4, time: "11:10-12:00" },
  { period: 5, time: "13:00-13:50" },
  { period: 6, time: "13:50-14:40" },
  { period: 7, time: "14:50-15:40" },
];

const subjectColors: Record<string, { bg: string; text: string; border: string; print: string }> = {
  "คณิตศาสตร์": { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300", print: "#E9D5FF" },
  "ภาษาไทย": { bg: "bg-pink-100", text: "text-pink-800", border: "border-pink-300", print: "#FCE7F3" },
  "ภาษาอังกฤษ": { bg: "bg-cyan-100", text: "text-cyan-800", border: "border-cyan-300", print: "#CFFAFE" },
  "วิทยาศาสตร์": { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300", print: "#DBEAFE" },
  "สังคมศึกษา": { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300", print: "#FEF3C7" },
  "ศิลปะ": { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", print: "#FEE2E2" },
  "สุขศึกษา": { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", print: "#D1FAE5" },
  "พลศึกษา": { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300", print: "#D1FAE5" },
  "default": { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300", print: "#F3F4F6" },
};

// Skeleton row for loading state
const SkeletonRow = () => (
  <tr className="border-b border-gray-100">
    <td className="px-3 py-3 bg-gray-50 border-r border-gray-200">
      <div className="h-5 w-12 bg-gray-200 rounded animate-pulse mx-auto" />
      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto mt-1" />
    </td>
    {[1, 2, 3, 4, 5].map((d) => (
      <td key={d} className="px-2 py-2 border-r border-gray-100 last:border-r-0">
        <div className={`h-16 rounded-xl animate-pulse ${Math.random() > 0.4 ? "bg-gray-100" : "bg-transparent"}`} />
      </td>
    ))}
  </tr>
);

function SchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [exporting, setExporting] = useState(false);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const todayDay = new Date().getDay(); // 1=Mon … 5=Fri

  const classes = ["ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"];

  useEffect(() => {
    if (selectedClass) fetchSchedule();
  }, [selectedClass]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/schedule?classId=${encodeURIComponent(selectedClass)}`);
      if (res.ok) {
        const data = await res.json();
        setSchedule(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch schedule:", error);
      Swal.fire({ title: "เกิดข้อผิดพลาด", text: "ไม่สามารถโหลดข้อมูลตารางเรียนได้", icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  const getScheduleForPeriod = (day: number, period: number) =>
    schedule.find((s) => s.DAY_OF_WEEK === day && s.PERIOD === period);

  const getSubjectColor = (subject: string) => {
    for (const key in subjectColors) {
      if (subject.includes(key)) return subjectColors[key];
    }
    return subjectColors.default;
  };

  const handlePrint = () => window.print();

  const handleExportPDF = async () => {
    if (!scheduleRef.current || !selectedClass) return;
    try {
      setExporting(true);
      const canvas = await html2canvas(scheduleRef.current, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const imgWidth = 287;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 5, 5, imgWidth, imgHeight);
      pdf.save(`ตารางเรียน_${selectedClass}_${new Date().toLocaleDateString("th-TH")}.pdf`);
      Swal.fire({ title: "ส่งออกสำเร็จ!", text: "ไฟล์ PDF ถูกบันทึกแล้ว", icon: "success", timer: 2000, showConfirmButton: false });
    } catch (error) {
      console.error("Export failed:", error);
      Swal.fire({ title: "เกิดข้อผิดพลาด", text: "ไม่สามารถส่งออก PDF ได้", icon: "error" });
    } finally {
      setExporting(false);
    }
  };

  const handleExportImage = async () => {
    if (!scheduleRef.current || !selectedClass) return;
    try {
      setExporting(true);
      const canvas = await html2canvas(scheduleRef.current, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const link = document.createElement("a");
      link.download = `ตารางเรียน_${selectedClass}_${new Date().toLocaleDateString("th-TH")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      Swal.fire({ title: "ส่งออกสำเร็จ!", text: "ไฟล์รูปภาพถูกบันทึกแล้ว", icon: "success", timer: 2000, showConfirmButton: false });
    } catch (error) {
      console.error("Export failed:", error);
      Swal.fire({ title: "เกิดข้อผิดพลาด", text: "ไม่สามารถส่งออกรูปภาพได้", icon: "error" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-5 mb-5 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2.5 rounded-xl shadow-md shadow-blue-200">
              <Calendar className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-800">ตารางเรียน</h1>
              <p className="text-blue-400 text-xs">ตารางเรียนประจำสัปดาห์</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Class selector */}
            <div className="relative">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="pl-4 pr-9 py-2.5 rounded-xl border-2 border-blue-200 focus:border-blue-400 focus:outline-none bg-white text-gray-700 font-medium cursor-pointer appearance-none"
              >
                <option value="">เลือกชั้นเรียน</option>
                {classes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
            </div>

            {/* Export buttons — only when data loaded */}
            {selectedClass && schedule.length > 0 && !loading && (
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-sm font-medium transition-colors"
                  title="พิมพ์"
                >
                  <Printer size={16} />
                  <span className="hidden sm:inline">พิมพ์</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={exporting}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                  title="ส่งออก PDF"
                >
                  <FileText size={16} />
                  <span className="hidden sm:inline">PDF</span>
                </button>
                <button
                  onClick={handleExportImage}
                  disabled={exporting}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                  title="ส่งออกรูปภาพ"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">รูปภาพ</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Empty state — no class selected */}
      {!selectedClass ? (
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-16 text-center print:hidden">
          <div className="bg-blue-50 rounded-2xl p-6 inline-block mb-4">
            <Calendar size={56} className="text-blue-300" />
          </div>
          <h2 className="text-lg font-semibold text-gray-700 mb-1">เลือกชั้นเรียน</h2>
          <p className="text-gray-400 text-sm">กรุณาเลือกชั้นเรียนด้านบนเพื่อดูตารางเรียน</p>
        </div>
      ) : (
        <div ref={scheduleRef} className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden print:shadow-none print:rounded-none print:border-0">
          {/* Print Header */}
          <div className="hidden print:block p-6 text-center border-b-2 border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">ตารางเรียนประจำสัปดาห์</h1>
            <p className="text-lg text-gray-600 mt-1">ชั้น {selectedClass}</p>
            <p className="text-sm text-gray-500 mt-1">
              ปีการศึกษา {new Date().getFullYear() + 543}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="bg-blue-500 print:bg-gray-100">
                  <th className="px-4 py-3.5 text-left text-sm font-bold text-white print:text-gray-900 border-r border-white/20 print:border-gray-300 w-28">
                    <div className="flex items-center gap-1.5">
                      <Clock size={15} className="print:hidden" />
                      คาบ / เวลา
                    </div>
                  </th>
                  {dayNames.map((day, i) => {
                    const isToday = todayDay === i + 1;
                    return (
                      <th
                        key={day}
                        className={`px-4 py-3.5 text-center text-sm font-bold border-r border-white/20 print:border-gray-300 last:border-r-0 text-white print:text-gray-900 ${isToday ? "bg-white/20 print:bg-blue-50" : ""
                          }`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span>{day}</span>
                          {isToday && (
                            <span className="text-[10px] bg-white text-blue-600 px-1.5 py-0.5 rounded-full font-semibold print:hidden">
                              วันนี้
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? periodTimes.map(({ period }) => <SkeletonRow key={period} />)
                  : periodTimes.map(({ period, time }, index) => (
                    <tr
                      key={period}
                      className={`border-b border-gray-100 print:border-gray-300 ${index % 2 === 0 ? "bg-gray-50/50 print:bg-white" : "bg-white"
                        }`}
                    >
                      {/* Time column */}
                      <td className="px-3 py-3 bg-blue-50/50 border-r border-blue-100 print:bg-gray-50 print:border-gray-300">
                        <div className="text-center">
                          <div className="font-bold text-blue-700 text-sm">คาบ {period}</div>
                          <div className="text-xs text-blue-400 mt-0.5">{time}</div>
                        </div>
                      </td>

                      {/* Day columns */}
                      {[1, 2, 3, 4, 5].map((day) => {
                        const item = getScheduleForPeriod(day, period);
                        const colors = item ? getSubjectColor(item.SUBJECT) : null;
                        const isToday = todayDay === day;

                        return (
                          <td
                            key={day}
                            className={`px-2 py-2 border-r border-gray-100 print:border-gray-300 last:border-r-0 ${isToday ? "bg-blue-50/30 print:bg-gray-50" : ""
                              }`}
                          >
                            {item && colors ? (
                              <div
                                className={`p-2.5 rounded-xl ${colors.bg} ${colors.border} border-2 transition-all hover:shadow-md hover:scale-[1.02] print:shadow-none print:border print:rounded-lg`}
                              >
                                <div className={`font-bold text-xs ${colors.text} leading-tight`}>
                                  {item.SUBJECT}
                                </div>
                                {item.TEACHER_NAME && (
                                  <div className="text-[11px] text-gray-600 mt-1.5 flex items-center gap-1">
                                    <User size={9} className="print:hidden flex-shrink-0" />
                                    <span className="truncate">{item.TEACHER_NAME}</span>
                                  </div>
                                )}
                                {item.ROOM && (
                                  <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                    <MapPin size={9} className="print:hidden flex-shrink-0" />
                                    <span>ห้อง {item.ROOM}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center py-4">
                                <span className="text-gray-200 text-lg">·</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Print Footer */}
          <div className="hidden print:flex justify-between items-center p-4 border-t-2 border-gray-200 text-sm text-gray-500">
            <span>
              พิมพ์เมื่อ:{" "}
              {new Date().toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span>โรงเรียน PKW</span>
          </div>
        </div>
      )}

      {/* Empty schedule (class selected but no data) */}
      {selectedClass && !loading && schedule.length === 0 && (
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center print:hidden">
          <BookOpen size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">ยังไม่มีข้อมูลตารางเรียนสำหรับชั้น {selectedClass}</p>
          <p className="text-gray-400 text-sm mt-1">กรุณาติดต่อผู้ดูแลระบบเพื่อเพิ่มข้อมูล</p>
        </div>
      )}

      {/* Subject Legend */}
      {selectedClass && !loading && schedule.length > 0 && (
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-blue-100 p-5 print:hidden">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2 text-sm">
            <BookOpen size={16} />
            สัญลักษณ์วิชา
          </h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(schedule.map((s) => s.SUBJECT))).map((subject) => {
              const colors = getSubjectColor(subject);
              return (
                <span
                  key={subject}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}
                >
                  {subject}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #schedule-container,
          #schedule-container * { visibility: visible; }
          #schedule-container {
            position: absolute;
            left: 0; top: 0;
            width: 100%;
          }
          @page { size: A4 landscape; margin: 10mm; }
          table { border-collapse: collapse !important; }
          th, td { border: 1px solid #d1d5db !important; }
        }
      `}</style>
    </main>
  );
}

export default SchedulePage;
