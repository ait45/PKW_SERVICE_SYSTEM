"use client";

// นำเข้าโมดูลที่จำเป็นต่อการใช้งาน
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Upload,
  Save,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import Swal from "sweetalert2";

function SettingsPage() {
  // ประกาศตัวแปรและ state ต่างๆ
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dataSetting, setDataSetting] = useState<Record<string, string>>({});
  const [isChange, setIsChange] = useState(false);
  const [error, setError] = useState<Record<string, string>>({});
  const [main_active, set_main_active] = useState(false);
  const [teacher_Admin, setTeacher_Admin] = useState(false);

  // ดีงค่าสถานะการตั้งค่าต่างๆ จาก server
  const fetchSetting = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/setting");
      if (res.status !== 200) return;
      const data = await res.json();
      if (data) {
        setDataSetting(data.data);
        setLoading(false);
      }
      const res_main_active = await fetch("/api/system/toggle");
      const data_main_active = await res_main_active.json();
      set_main_active(data_main_active.main_active);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    fetchSetting();
    //ตรวจสอลสถานะของผู้ใช้งาน -------------------------
    if (session?.user?.role === "teacher" && session?.user?.isAdmin === true)
      setTeacher_Admin(true);
  }, []);

  useEffect(() => {
    // ตรวจสอบเวลาที่กรอกลงฟอร์ม ------------------------
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
    const edit_Start = new Date(`1970-01-01T${timerStartEditAttendance}:00`);
    const edit_end = new Date(`1970-01-01T${timerEndEditAttendance}:00`);

    if (start >= late) {
      setError({ AttendanceStart: "เวลาเริ่มเช็คต้องเร็วกว่าเวลาสาย" });
    } else if (late >= absent) {
      setError({ lateThreshold: "เวลาสายต้องเร็วกว่าเวลาขาด" });
    } else if (edit_Start >= edit_end) {
      setError({
        timerStartEditAttendance: "เวลาเริ่มแก้ไขต้องเร็วกว่าเวลาสิ้นสุด",
      });
    } else {
      setError({});
    }
  }, [dataSetting]);
  const validateForm = () => {
    const newError: Record<string, string> = {};
    if (!dataSetting.AttendanceStart)
      newError.AttendanceStart = "ช่องนี้ไม่สามารถเว้นว่าง กรุณาป้อนเวลา";
    if (!dataSetting.lateThreshold)
      newError.lateThreshold = "ช่องนี้ไม่สามารถเว้นว่าง กรุณาป้อนเวลา";
    if (!dataSetting.absentThreshold)
      newError.absentThresholed = "ช่องนี้ไม่สามารถเว้นว่าง กรุณาป้อนเวลา";
    if (!dataSetting.timerStartEditAttendance)
      newError.timerStartEditAttendance =
        "ช่องนี้ไม่สามารถเว้นว่าง กรุณาป้อนเวลา";
    if (!dataSetting.timerEndEditAttendance)
      newError.timerEndEditAttendance =
        "ช่องนี้ไม่สามารถเว้นว่าง กรุณาป้อนเวลา";
    if (!dataSetting.Scorededucted_lateAttendance)
      newError.Scorededucted_lateAttendance =
        "ช่องนี้ไม่สามารถเว้นว่าง กรุณาป้อนเวลา";
    if (!dataSetting.Scorededucted_absentAttendance)
      newError.Scorededucted_absentAttendance =
        "ช่องนี้ไม่สามารถเว้นว่าง กรุณาป้อนเวลา";
    return newError;
  };
  // สั้นสุดการตรวจสอบเวลาที่กรอกลงฟอร์ม ------------------------

  // ฟังก์ชั่นการเปลี่ยนแปลงข้อมูล --------------------------------
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDataSetting((prev) => ({ ...prev, [name]: value }));
    setIsChange(true);
    if (error[name]) {
      setError((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };
  // สิ้นสุดฟังก์ชั่นการเปลี่ยนแปลงข้อมูล --------------------------------

  // ฟังก์ชั่นการปิดระบบ ----------------------------------
  const toggleMainSystem = async () => {
    Swal.fire({
      title: `${main_active ? "ยืนยันการปิดระบบ" : "ยืนยันการเปิดระบบ"}`,
      text: `${main_active ? "หน้าเว็บจะทำการปิดทุกหน้า.." : ""}`,
      width: "90%",
      icon: `${main_active ? "warning" : "question"}`,
      showConfirmButton: true,
      confirmButtonText: "ยืนยัน",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const status = !main_active;
        const req = await fetch("/api/system/toggle", {
          method: "POST",
          body: JSON.stringify({ main_active: status }),
        });
        if (req.ok)
          return Swal.fire({
            title: `${main_active ? "ปิดระบบสำเร็จ" : "เปิดระบบสำเร็จ"}`,
            icon: "success",
            width: "90%",
          }).then(() => {
            window.location.reload();
            fetchSetting();
          });
        else
          return Swal.fire({
            title: `${main_active ? "ปิดระบบไม่สำเร็จ" : "เปิดระบบไม่สำเร็จ"}`,
            icon: "error",
            width: "90%",
          }).then(() => {
            window.location.reload();
            fetchSetting();
          });
      }
    });
  };

  // สิ้นสุดฟังก์ชั่นการปิดระบบ ----------------------------------

  // ฟังก์ชันรีเซ็ตข้อมูล ----------------------------------
  const handleResetData = async (resetType: string, title: string) => {
    // ขอยืนยันจากผู้ใช้
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
      width: "90%",
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
        body: JSON.stringify({
          resetType,
          confirmPassword: "CONFIRM_RESET",
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        await Swal.fire({
          title: "รีเซ็ตสำเร็จ!",
          text: data.message,
          icon: "success",
          width: "90%",
        });
        window.location.reload();
      } else {
        await Swal.fire({
          title: "เกิดข้อผิดพลาด",
          text: data.message || "ไม่สามารถรีเซ็ตข้อมูลได้",
          icon: "error",
          width: "90%",
        });
      }
    } catch (error) {
      console.error("Reset error:", error);
      await Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        icon: "error",
        width: "90%",
      });
    }
  };
  // สิ้นสุดฟังก์ชันรีเซ็ตข้อมูล ----------------------------------

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const error = validateForm();
    console.log(error);
    if (Object.keys(error).length > 0) {
      setError(error);
      return;
    }
    setIsChange(false);
    await Swal.fire({
      title: "ยืนยันการบันทึกตั้งค่า",
      showConfirmButton: true,
      confirmButtonText: "บันทึก",
      width: "80%",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const req = await fetch("/api/setting", {
          method: "POST",
          body: JSON.stringify(dataSetting),
        });
        if (!req.ok)
          return Swal.fire({
            title: "บันทึกการตั้งค่าไม่สำเร็จสำเร็จ",
            text: "กรุณาลองอีกครั้ง",
            icon: "error",
          });
        await Swal.fire({ title: "บันทึกการตั้งค่าสำเร็จ", icon: "success" });
        fetchSetting();
      }
    });
  };

  // การตรวจสอบ session ของ ผู้ใช้งาน

  if (session?.user?.role === "teacher" && status === "unauthenticated")
    redirect("/login" as Route);
  if (session?.user?.role === "student" && !session?.user?.isAdmin)
    return redirect(`/student/${session?.id}` as Route);
  if (session?.user?.role === "student" && session?.user?.isAdmin)
    return redirect(`/student/admin/${session?.id}` as Route);
  if (!session && status === "unauthenticated") return redirect("/login" as Route);

  if (status === "loading") return null;
  if (loading) return null;
  // สิ้นสุดการตรวจสอบ session ของ ผู้ใช้งาน
  return (
    <main className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="flex justify-center pt-2 mb-10">
        <div className="bg-white rounded-xl shadow-2xl w-[90%] sm:w-[70%] p-6 ">
          <Link
            href="#"
            onClick={async (e) => {
              if (isChange) {
                await handleSubmit(e);
              }
              router.back();
            }}
            title="ย้อนกลับ"
            className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={20} />
            <p className="text-sm hidden sm:inline">ย้อนกลับ</p>
          </Link>
          <header className="pt-3 mb-2 flex justify-between items-center">
            <div>
              <h1 className="font-bold text-xl sm:text-2xl">ตั้งค่าระบบ</h1>
              {isChange && (
                <p className="text-xs text-red-500">* ข้อมูลมีการเปลี่ยนแปลง</p>
              )}
            </div>
            <div className="flex items-center">
              <button
                className="flex items-center sm:mr-2 px-3 py-2 outline-none sm:outline-2 outline-blue-500 text-blue-500  hover:bg-blue-500 hover:text-white  transition-colors rounded-md cursor-pointer"
                title="ส่งออก"
              >
                <Upload />
                <p className="hidden sm:inline">ส่งออก</p>
              </button>
              <button
                onClick={handleSubmit}
                disabled={!teacher_Admin}
                title="บันทึก"
                className="flex items-center px-3 py-2 outline-none sm:outline-2 outline-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-colors rounded-md cursor-pointer disabled:cursor-not-allowed"
              >
                <Save />
                <p className="hidden sm:inline">บันทึก</p>
              </button>
            </div>
          </header>
          <div className="bg-white rounded-xl shadow-xl p-4 m-2">
            <h1 className="text-lg text-blue-500 font-semibold">
              คะแนนความประพฤติ
            </h1>
            <div className="ml-2 mb-4">
              <h1>การหักคะแนน</h1>
              <div className="flex items-center my-2 justify-between">
                <p>สาย</p>
                <div className="flex items-center">
                  หัก
                  <input
                    type="number"
                    className={`mx-2 px-3 py-1 w-15 border-b-2 border-gray-500 hover:border-blue-500 focus:border-blue-500 ${error.Scorededucted_lateAttendance && "border-red-500"
                      } transition-all outline-none disabled:cursor-not-allowed disabled:text-gray-500 disabled:border-gray-500`}
                    maxLength={1}
                    min={0}
                    name="Scorededucted_lateAttendance"
                    value={dataSetting.Scorededucted_lateAttendance}
                    onChange={handleInputChange}
                    disabled={!teacher_Admin}
                  />
                  คะแนน
                </div>
              </div>
              {error.Scorededucted_lateAttendance && (
                <p className="mt-1 text-[12px] sm:text-sm text-red-600 ml-1">
                  {error.Scorededucted_lateAttendance}
                </p>
              )}
              <hr className="text-[#009EA7]" />
              <div className="flex items-center my-2 justify-between">
                <p>ขาด</p>
                <div>
                  หัก
                  <input
                    type="number"
                    className={`mx-2 px-3 py-1 w-15 border-b-2 border-gray-500 hover:border-blue-500 focus:border-blue-500 ${error.Scorededucted_absentAttendance && "border-red-500"
                      } transition-all outline-none disabled:cursor-not-allowed disabled:text-gray-500 disabled:border-gray-500`}
                    min={0}
                    maxLength={1}
                    name="Scorededucted_absentAttendance"
                    value={dataSetting.Scorededucted_absentAttendance}
                    onChange={handleInputChange}
                    disabled={!teacher_Admin}
                  />
                  คะแนน
                </div>
              </div>
              {error.Scorededucted_absentAttendance && (
                <p className="flex justify-end mt-1 text-[12px] sm:text-sm text-red-600 ml-1">
                  {error.Scorededucted_absentAttendance}
                </p>
              )}
              <hr className="text-[#009AE3]" />
            </div>
            <h1 className="text-lg text-blue-500 font-semibold">
              การตั้งค่าเวลาต่างๆ
            </h1>
            <div className="ml-2 mb-2 ">
              <h1 className="font-bold mb-2">กิจกรรมหน้าเสาธง</h1>
              <div className="flex justify-between items-center px-2 mb-2">
                <p>เริ่มเช็คชื่อ</p>
                <div>
                  <input
                    type="time"
                    name="AttendanceStart"
                    value={dataSetting.AttendanceStart}
                    onChange={handleInputChange}
                    disabled={!teacher_Admin}
                    className={`border-b-2 border-gray-500 focus:border-blue-500 ${error.AttendanceStart && "border-red-500"
                      } transition-all outline-none disabled:cursor-not-allowed disabled:text-gray-500 disabled:border-gray-500 w-full`}
                  />
                </div>
              </div>
              {error.AttendanceStart && (
                <p className="text-[12px] sm:text-sm text-red-600 ml-2">
                  {error.AttendanceStart}
                </p>
              )}
              <div className="flex justify-between items-center px-2 mb-2">
                <p>สาย</p>
                <div>
                  <input
                    type="time"
                    name="lateThreshold"
                    value={dataSetting.lateThreshold}
                    onChange={handleInputChange}
                    disabled={!teacher_Admin}
                    className={`border-b-2 border-gray-500 focus:border-blue-500 ${error.lateThreshold && "border-red-500"
                      } transition-all outline-none disabled:cursor-not-allowed disabled:text-gray-500 disabled:border-gray-500 w-full`}
                  />
                </div>
              </div>
              {error.lateThreshold && (
                <p className="mt-1 text-[12px] sm:text-sm text-red-600 ml-1">
                  {error.lateThreshold}
                </p>
              )}
              <div className="flex justify-between items-center px-2 mb-2">
                <p>หมดเวลา</p>
                <div>
                  <input
                    type="time"
                    name="absentThreshold"
                    value={dataSetting.absentThreshold}
                    onChange={handleInputChange}
                    disabled={!teacher_Admin}
                    className={`border-b-2 border-gray-500 focus:border-blue-500 ${error.absentThreshold && "border-red-500"
                      } transition-all outline-none disabled:cursor-not-allowed disabled:text-gray-500 disabled:border-gray-500 w-full`}
                  />
                </div>
              </div>
              {error.absentThreshold && (
                <p className="mt-1 text-[12px] sm:text-sm text-red-600 ml-1">
                  {error.absentThreshold}
                </p>
              )}
              <div className="flex justify-between items-center px-2 mb-2">
                <p>เวลาเริ่มแก้ไข</p>
                <div>
                  <input
                    type="time"
                    name="timerStartEditAttendance"
                    value={dataSetting.timerStartEditAttendance}
                    onChange={handleInputChange}
                    disabled={!teacher_Admin}
                    className={`border-b-2 border-gray-500 focus:border-blue-500 ${error.timerStartEditAttendance && "border-red-500"
                      } transition-all outline-none disabled:cursor-not-allowed disabled:text-gray-500 disabled:border-gray-500 w-full`}
                  />
                </div>
              </div>
              {error.timerStartEditAttendance && (
                <p className="mt-1 text-[12px] sm:text-sm text-red-600 ml-1">
                  {error.timerStartEditAttendance}
                </p>
              )}
              <div className="flex justify-between items-center px-2 mb-2">
                <p>หมดเวลาแก้ไข</p>
                <div>
                  <input
                    type="time"
                    name="timerEndEditAttendance"
                    value={dataSetting.timerEndEditAttendance}
                    onChange={handleInputChange}
                    disabled={!teacher_Admin}
                    className={`border-b-2 border-gray-500 focus:border-blue-500 ${error.timerEndEditAttendance && "border-red-500"
                      } transition-all outline-none disabled:cursor-not-allowed disabled:text-gray-500 disabled:border-gray-500 w-full`}
                  />
                </div>
              </div>
              {error.timerEndEditAttendance && (
                <p className="mt-1 text-[12px] sm:text-sm text-red-600 ml-1">
                  {error.timerEndEditAttendance}
                </p>
              )}
            </div>
          </div>
          <div
            className={`bg-white rounded-xl shadow-xl p-4 m-2 ${!teacher_Admin && "hidden"
              }`}
          >
            <h1 className="font-bold text-blue-500">ควบคุม</h1>
            <div className="flex justify-between">
              <p className="font-bold">Main System</p>
              <button
                onClick={() => toggleMainSystem()}
                className={`relative w-14 h-6 rounded-full transition-all duration-300 cursor-pointer ${main_active
                  ? "bg-blue-500 shadow-md shadow-blue-500/30"
                  : "bg-white shadow-md shadow-blue-500/30"
                  }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 ${main_active ? "bg-white" : "bg-blue-500"
                    } rounded-full shadow-md transition-all duration-300 ${main_active ? "translate-x-8" : "translate-x-0"
                    }`}
                />
              </button>
            </div>
          </div>
          <div
            className={`bg-white rounded-xl shadow-xl p-4 m-2 ${!teacher_Admin && "hidden"
              }`}
          >
            <h1 className="font-bold text-blue-500">รีเซ็ตระบบ</h1>
            <div className="ml-2 my-2 space-y-2">
              <button
                type="button"
                onClick={() => handleResetData("scores", "รีเซ็ตคะแนนความประพฤติ")}
                className="cursor-pointer px-3 py-2 bg-[#009E7A] hover:bg-[#008264] transition-all rounded-md text-sm sm:text-base text-white"
              >
                รีเซ็ตคะแนนความประพฤติ
              </button>
              <br />
              <button
                type="button"
                onClick={() => handleResetData("all", "รีเซ็ตข้อมูลนักเรียนทั้งหมด")}
                className="cursor-pointer px-3 py-2 bg-red-500 hover:bg-red-700 transition-all rounded-md text-sm sm:text-base text-white"
              >
                รีเซ็ตข้อมูลนักเรียนทั้งหมด
              </button>
              <br />
              <button
                type="button"
                onClick={() => handleResetData("attendance", "รีเซ็ตข้อมูลการเช็คชื่อ")}
                className="cursor-pointer px-3 py-2 bg-blue-500 hover:bg-blue-700 transition-all rounded-md text-sm sm:text-base text-white"
              >
                รีเซ็ตข้อมูลการเช็คชื่อ
              </button>
              <br />
              <button
                type="button"
                onClick={() => handleResetData("today_attendance", "ลบข้อมูลการเช็คชื่อวันนี้")}
                className="cursor-pointer px-3 py-2 bg-orange-500 hover:bg-orange-700 transition-all rounded-md text-sm sm:text-base text-white"
              >
                ลบข้อมูลการเช็คชื่อวันนี้
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default SettingsPage;
