"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  Clock,
  ShieldAlert,
  Power,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  LoaderCircle,
  Minus,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import type { Route } from "next";
import Swal from "sweetalert2";

interface SettingData {
  AttendanceStart: string;
  lateThreshold: string;
  absentThreshold: string;
  timerStartEditAttendance: string;
  timerEndEditAttendance: string;
  Scorededucted_lateAttendance: string;
  Scorededucted_absentAttendance: string;
  autoCutoff: {
    enabled: boolean;
    maxRetries: number;
    retryDelayMs: number;
  };
  system: {
    main_active: boolean;
  };
  updatedAt: string;
}

function SettingsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dataSetting, setDataSetting] = useState<Partial<SettingData>>({});
  const [isChange, setIsChange] = useState(false);
  const [error, setError] = useState<Record<string, string>>({});
  const [teacher_Admin, setTeacher_Admin] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSetting = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/setting");
      if (res.status !== 200) return;
      const data = await res.json();
      if (data) {
        setDataSetting(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchSetting();
    if (session?.user?.role === "teacher" && session?.user?.isAdmin === true)
      setTeacher_Admin(true);
  }, []);

  // Time validation
  useEffect(() => {
    const {
      AttendanceStart,
      lateThreshold,
      absentThreshold,
      timerStartEditAttendance,
      timerEndEditAttendance,
    } = dataSetting;
    if (
      !AttendanceStart ||
      !lateThreshold ||
      !absentThreshold ||
      !timerStartEditAttendance ||
      !timerEndEditAttendance
    ) {
      setError({});
      return;
    }
    const start = new Date(`1970-01-01T${AttendanceStart}:00`);
    const late = new Date(`1970-01-01T${lateThreshold}:00`);
    const absent = new Date(`1970-01-01T${absentThreshold}:00`);
    const editStart = new Date(`1970-01-01T${timerStartEditAttendance}:00`);
    const editEnd = new Date(`1970-01-01T${timerEndEditAttendance}:00`);

    if (start >= late) {
      setError({ AttendanceStart: "เวลาเริ่มเช็คต้องเร็วกว่าเวลาสาย" });
    } else if (late >= absent) {
      setError({ lateThreshold: "เวลาสายต้องเร็วกว่าเวลาขาด" });
    } else if (editStart >= editEnd) {
      setError({ timerStartEditAttendance: "เวลาเริ่มแก้ไขต้องเร็วกว่าเวลาสิ้นสุด" });
    } else {
      setError({});
    }
  }, [dataSetting]);

  const validateForm = () => {
    const newError: Record<string, string> = {};
    if (!dataSetting.AttendanceStart) newError.AttendanceStart = "กรุณาป้อนเวลา";
    if (!dataSetting.lateThreshold) newError.lateThreshold = "กรุณาป้อนเวลา";
    if (!dataSetting.absentThreshold) newError.absentThreshold = "กรุณาป้อนเวลา";
    if (!dataSetting.timerStartEditAttendance) newError.timerStartEditAttendance = "กรุณาป้อนเวลา";
    if (!dataSetting.timerEndEditAttendance) newError.timerEndEditAttendance = "กรุณาป้อนเวลา";
    if (!dataSetting.Scorededucted_lateAttendance) newError.Scorededucted_lateAttendance = "กรุณาป้อนคะแนน";
    if (!dataSetting.Scorededucted_absentAttendance) newError.Scorededucted_absentAttendance = "กรุณาป้อนคะแนน";
    return newError;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDataSetting((prev) => ({ ...prev, [name]: value }));
    setIsChange(true);
    if (error[name]) {
      setError((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const toggleMainSystem = async () => {
    const isActive = dataSetting.system?.main_active;
    const result = await Swal.fire({
      title: isActive ? "ยืนยันการปิดระบบ" : "ยืนยันการเปิดระบบ",
      text: isActive ? "หน้าเว็บจะทำการปิดทุกหน้า.." : "ระบบจะกลับมาใช้งานได้ตามปกติ",
      icon: isActive ? "warning" : "question",
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: isActive ? "#ef4444" : "#22c55e",
    });

    if (!result.isConfirmed) return;

    const newStatus = !isActive;
    const req = await fetch("/api/system/toggle", {
      method: "POST",
      body: JSON.stringify({ main_active: newStatus }),
    });

    if (req.ok) {
      await Swal.fire({
        title: newStatus ? "เปิดระบบสำเร็จ" : "ปิดระบบสำเร็จ",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      window.location.reload();
    } else {
      Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถเปลี่ยนสถานะระบบได้", "error");
    }
  };

  const handleResetData = async (resetType: string, title: string) => {
    const confirmResult = await Swal.fire({
      title: `⚠️ ${title}`,
      html: `
        <p class="text-red-500 font-bold">การดำเนินการนี้ไม่สามารถย้อนกลับได้!</p>
        <p class="mt-2">กรุณาพิมพ์ <strong>CONFIRM_RESET</strong> เพื่อยืนยัน:</p>
      `,
      input: "text",
      inputPlaceholder: "CONFIRM_RESET",
      showCancelButton: true,
      confirmButtonText: "ยืนยันรีเซ็ต",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#dc2626",
      preConfirm: (value) => {
        if (value !== "CONFIRM_RESET") {
          Swal.showValidationMessage("กรุณาพิมพ์ CONFIRM_RESET ให้ถูกต้อง");
          return false;
        }
        return value;
      },
    });

    if (!confirmResult.isConfirmed) return;

    try {
      Swal.fire({
        title: "กำลังดำเนินการ...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await fetch("/api/admin/reset-student-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetType, confirmPassword: "CONFIRM_RESET" }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        await Swal.fire({ title: "รีเซ็ตสำเร็จ!", text: data.message, icon: "success" });
        window.location.reload();
      } else {
        await Swal.fire("เกิดข้อผิดพลาด", data.message || "ไม่สามารถรีเซ็ตข้อมูลได้", "error");
      }
    } catch (error) {
      console.error("Reset error:", error);
      await Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", "error");
    }
  };

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    const formError = validateForm();
    if (Object.keys(formError).length > 0) {
      setError(formError);
      return;
    }
    const result = await Swal.fire({
      title: "ยืนยันการบันทึกตั้งค่า",
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#6366f1",
    });
    if (!result.isConfirmed) return;

    setSaving(true);
    setIsChange(false);
    try {
      const req = await fetch("/api/setting", {
        method: "POST",
        body: JSON.stringify(dataSetting),
      });
      if (!req.ok) {
        Swal.fire("บันทึกไม่สำเร็จ", "กรุณาลองอีกครั้ง", "error");
        return;
      }
      await Swal.fire({ title: "บันทึกสำเร็จ", icon: "success", timer: 1200, showConfirmButton: false });
      fetchSetting();
    } finally {
      setSaving(false);
    }
  };

  // Session checks
  if (session?.user?.role === "teacher" && status === "unauthenticated")
    redirect("/login" as Route);
  if (session?.user?.role === "student" && !session?.user?.isAdmin)
    return redirect(`/student/${session?.id}` as Route);
  if (session?.user?.role === "student" && session?.user?.isAdmin)
    return redirect(`/student/admin/${session?.id}` as Route);
  if (!session && status === "unauthenticated") return redirect("/login" as Route);
  if (status === "loading") return null;

  // Skeleton
  if (initialLoading) {
    return (
      <main className="max-w-4xl mx-auto p-2 sm:p-4">
        <div className="bg-gray-300 rounded-xl p-6 mb-4 animate-pulse">
          <div className="h-7 w-40 bg-white/20 rounded mb-2" />
          <div className="h-4 w-64 bg-white/20 rounded" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-5 mb-4 animate-pulse border border-gray-100">
            <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </main>
    );
  }

  const mainActive = dataSetting.system?.main_active ?? false;

  const timeFields = [
    { name: "AttendanceStart", label: "เริ่มเช็คชื่อ", desc: "เวลาที่เปิดให้เช็คชื่อได้" },
    { name: "lateThreshold", label: "เวลาสาย", desc: "เช็คชื่อหลังเวลานี้ถือว่าสาย" },
    { name: "absentThreshold", label: "เวลาหมด (ขาด)", desc: "เลยเวลานี้ถือว่าขาด" },
    { name: "timerStartEditAttendance", label: "เริ่มเวลาแก้ไข", desc: "เปิดให้แก้ไขข้อมูลเช็คชื่อ" },
    { name: "timerEndEditAttendance", label: "หมดเวลาแก้ไข", desc: "ปิดการแก้ไขข้อมูลเช็คชื่อ" },
  ];

  const resetActions = [
    { type: "scores", label: "รีเซ็ตคะแนนความประพฤติ", desc: "คืนคะแนนทุกคนกลับเป็น 100", color: "bg-emerald-600 hover:bg-emerald-700" },
    { type: "attendance", label: "รีเซ็ตข้อมูลการเช็คชื่อ", desc: "ลบข้อมูลเช็คชื่อทั้งหมด", color: "bg-blue-600 hover:bg-blue-700" },
    { type: "today_attendance", label: "ลบข้อมูลเช็คชื่อวันนี้", desc: "ลบเฉพาะข้อมูลวันนี้", color: "bg-orange-500 hover:bg-orange-600" },
    { type: "all", label: "รีเซ็ตข้อมูลนักเรียนทั้งหมด", desc: "ลบข้อมูลนักเรียน + เช็คชื่อ + คะแนนทั้งหมด", color: "bg-red-600 hover:bg-red-700" },
  ];

  return (
    <main className="max-w-4xl mx-auto p-2 sm:p-4 h-screen overflow-y-scroll">
      {/* Header */}
      <div className="bg-[#6366f1] rounded-xl p-4 sm:p-6 text-white mb-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <Settings size={28} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">ตั้งค่าระบบ</h1>
              <p className="text-white/80 text-sm">กำหนดค่าเวลา คะแนน และการควบคุมระบบ</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isChange && (
              <span className="bg-amber-400/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                มีการเปลี่ยนแปลง
              </span>
            )}
            <button
              onClick={handleSubmit}
              disabled={!teacher_Admin || saving}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg px-4 py-2.5 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
              บันทึก
            </button>
            <button
              onClick={fetchSetting}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg p-2.5 transition-colors"
              title="รีเฟรช"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Section: Behavior Score Deduction */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
            <ShieldAlert size={18} className="text-orange-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">คะแนนความประพฤติ</h2>
            <p className="text-xs text-gray-400">กำหนดคะแนนที่หักเมื่อสาย/ขาด</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Late deduction */}
          <div className={`rounded-xl border p-4 ${error.Scorededucted_lateAttendance ? "border-red-300 bg-red-50/30" : "border-gray-100 bg-gray-50/50"}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                <span className="font-medium text-gray-700">มาสาย</span>
              </div>
              <span className="text-xs text-gray-400">คะแนนที่หัก</span>
            </div>
            <div className="flex items-center gap-2">
              <Minus size={16} className="text-gray-400" />
              <input
                type="number"
                min="0"
                name="Scorededucted_lateAttendance"
                value={dataSetting.Scorededucted_lateAttendance || ""}
                onChange={handleInputChange}
                disabled={!teacher_Admin}
                inputMode="decimal"
                step="0.1"
                className="w-20 px-3 py-2 rounded-lg border border-gray-200 text-center font-bold text-lg text-orange-600 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 outline-none disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
              />
              <span className="text-sm text-gray-500">คะแนน</span>
            </div>
            {error.Scorededucted_lateAttendance && (
              <p className="text-xs text-red-500 mt-2">{error.Scorededucted_lateAttendance}</p>
            )}
          </div>

          {/* Absent deduction */}
          <div className={`rounded-xl border p-4 ${error.Scorededucted_absentAttendance ? "border-red-300 bg-red-50/30" : "border-gray-100 bg-gray-50/50"}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="font-medium text-gray-700">ขาดเรียน</span>
              </div>
              <span className="text-xs text-gray-400">คะแนนที่หัก</span>
            </div>
            <div className="flex items-center gap-2">
              <Minus size={16} className="text-gray-400" />
              <input
                type="number"
                min="0"
                name="Scorededucted_absentAttendance"
                value={dataSetting.Scorededucted_absentAttendance || ""}
                onChange={handleInputChange}
                disabled={!teacher_Admin}
                step="0.5"
                inputMode="decimal"
                className="w-20 px-3 py-2 rounded-lg border border-gray-200 text-center font-bold text-lg text-red-600 focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
              />
              <span className="text-sm text-gray-500">คะแนน</span>
            </div>
            {error.Scorededucted_absentAttendance && (
              <p className="text-xs text-red-500 mt-2">{error.Scorededucted_absentAttendance}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section: Time Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <Clock size={18} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">การตั้งค่าเวลา</h2>
            <p className="text-xs text-gray-400">กำหนดเวลาเช็คชื่อกิจกรรมหน้าเสาธง</p>
          </div>
        </div>

        <div className="space-y-3">
          {timeFields.map((field) => (
            <div key={field.name} className={`rounded-xl border p-3.5 transition-all ${error[field.name] ? "border-red-300 bg-red-50/30" : "border-gray-100 hover:border-gray-200"}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-700 text-sm">{field.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{field.desc}</p>
                </div>
                <input
                  type="time"
                  name={field.name}
                  value={(dataSetting as any)[field.name] || ""}
                  onChange={handleInputChange}
                  disabled={!teacher_Admin}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
                />
              </div>
              {error[field.name] && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {error[field.name]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section: System Control (admin only) */}
      {teacher_Admin && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
              <Power size={18} className="text-violet-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">ควบคุมระบบ</h2>
              <p className="text-xs text-gray-400">เปิด/ปิดระบบหลัก</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Main System</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {mainActive ? "ระบบกำลังทำงานอยู่" : "ระบบปิดอยู่ — นักเรียนไม่สามารถเข้าถึงได้"}
              </p>
            </div>
            <button
              onClick={toggleMainSystem}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 cursor-pointer ${
                mainActive
                  ? "bg-emerald-500 shadow-md shadow-emerald-500/30"
                  : "bg-gray-300 shadow-md"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
                  mainActive ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Section: Reset (admin only) */}
      {teacher_Admin && (
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-5 mb-4">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
              <RotateCcw size={18} className="text-red-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">รีเซ็ตระบบ</h2>
              <p className="text-xs text-red-400">⚠️ การดำเนินการเหล่านี้ไม่สามารถย้อนกลับได้</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {resetActions.map((action) => (
              <button
                key={action.type}
                onClick={() => handleResetData(action.type, action.label)}
                className={`${action.color} text-white rounded-xl p-4 text-left transition-all shadow-sm hover:shadow-md cursor-pointer`}
              >
                <p className="font-medium text-sm">{action.label}</p>
                <p className="text-xs text-white/70 mt-1">{action.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

export default SettingsPage;
