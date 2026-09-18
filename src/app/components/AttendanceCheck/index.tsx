"use client";

import { useEffect, useState } from "react";
import QRScanning from "../QRScanning";
import { IdCard, UserRoundCheck, ClipboardCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import Swal from "sweetalert2";

interface QRdata {
  id: string;
}

interface Holiday {
  isHoliday: boolean;
  name?: string;
}

// หน้าเช็คชื่อ
function AttendanceCheckPage({ session }: { session: any }) {
  const [qrData, setQrdata] = useState<QRdata>({ id: "" });
  const [showHoliday, setShowHoliday] = useState<Holiday>({ isHoliday: false, name: "" });
  const [manualIdCheckIn, setManualIdCheckIn] = useState<QRdata>({ id: "" });
  const [emptyField, setEmptyField] = useState<boolean>(false);
  const [lastCheckedId, setLastCheckedId] = useState<string>("");
  const [checkSuccess, setCheckSuccess] = useState<boolean>(false);

  const getHoliday = async () => {
    const req = await fetch("/api/holidays");
    const data = await req.json();
    setShowHoliday(data);
  };

  const attendance = async (id: string) => {
    if (id === "") return;
    document.body.classList.add("loading");
    try {
      const req = await fetch("/api/scanAttendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, handler: session?.user?.username }),
      });
      const res = await req.json();
      console.log(res);
      if (req.status === 400)
        return Swal.fire({ text: res.message, icon: "error", width: "60%" });
      if (res?.success) {
        setLastCheckedId(id);
        setCheckSuccess(true);
        setTimeout(() => setCheckSuccess(false), 5000);
        return Swal.fire({ title: "เช็คชื่อสำเร็จ", icon: "success", width: "60%", timer: 1500, showConfirmButton: false });
      }
      Swal.fire({ title: "เกิดข้อผิดพลาด", text: res.message || "เกิดข้อผิดพลาดในการเช็คชื่อ", icon: "error" });
    } catch (error: any) {
      console.log(error);
      Swal.fire({ title: "เกิดข้อผิดพลาด", text: error?.error, icon: "error" });
    } finally {
      document.body.classList.remove("loading");
    }
  };

  useEffect(() => {
    if (Object.keys(qrData).length !== 0 && qrData.id !== "") {
      attendance(qrData.id);
      setQrdata({ id: "" });
    }
  }, [qrData]);

  useEffect(() => {
    getHoliday();
  }, []);

  const handleManualCheckIn = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (manualIdCheckIn.id.trim() === "") {
      setEmptyField(true);
      Swal.fire({ text: "กรุณากรอกเลขประจำตัวนักเรียน", icon: "warning", width: 300, timer: 2000 });
      return;
    }
    Swal.fire({
      title: "ยืนยันการเช็คชื่อ?",
      text: `เลขประจำตัวนักเรียน: ${manualIdCheckIn.id}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      confirmButtonColor: "#3B82F6",
      cancelButtonColor: "#EF4444",
      cancelButtonText: "ยกเลิก",
    }).then((result) => {
      if (result.isConfirmed) {
        attendance(manualIdCheckIn.id);
        setManualIdCheckIn({ id: "" });
        setEmptyField(false);
      }
    });
  };

  return (
    <main className="max-w-5xl mx-auto px-4 pb-8">
      {/* Page Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-5 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 text-white rounded-xl p-2.5 shadow-md shadow-blue-200">
              <UserRoundCheck size={26} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-800">เช็คชื่อนักเรียน</h1>
              <p className="text-blue-400 text-xs">สแกน QR หรือกรอกเลขประจำตัวเพื่อเช็คชื่อ</p>
            </div>
          </div>

          {/* Last checked success indicator */}
          {checkSuccess && lastCheckedId && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full animate-pulse">
              <CheckCircle2 className="text-emerald-500 w-4 h-4" />
              <span className="text-emerald-700 text-sm font-medium">เช็คชื่อสำเร็จ: <span className="font-mono">{lastCheckedId}</span></span>
            </div>
          )}
        </div>

        {/* Holiday Banner */}
        {showHoliday?.isHoliday && (
          <div className="mt-4 flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
            <AlertTriangle className="text-rose-500 w-5 h-5 shrink-0" />
            <div>
              <p className="text-rose-700 font-semibold text-sm">วันหยุด — ไม่ต้องเช็คชื่อ</p>
              <p className="text-rose-500 text-xs">{showHoliday.name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main content: 2 columns on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* QR Scanner */}
        <div>
          <QRScanning
            onScan={(id: string) => setQrdata({ id })}
            holiday={showHoliday?.isHoliday}
          />
        </div>

        {/* Manual ID Check */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <div className="bg-blue-500 p-2 rounded-xl shadow-md shadow-blue-200">
              <ClipboardCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-blue-700 font-bold text-lg leading-none">กรอกรหัสนักเรียน</h2>
              <p className="text-blue-400 text-xs">กรอกเลขประจำตัวแล้วกด Enter หรือปุ่มส่ง</p>
            </div>
          </div>

          <form onSubmit={handleManualCheckIn} className="flex flex-col gap-3 flex-1">
            <div>
              <label className="text-sm text-gray-600 font-medium mb-1.5 block">
                เลขประจำตัวนักเรียน
              </label>
              <div className="relative">
                <IdCard
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${emptyField ? "text-rose-500" : "text-blue-400"
                    }`}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 outline-none text-gray-800 text-base transition-colors
                    ${emptyField
                      ? "border-rose-400 ring-2 ring-rose-100 bg-rose-50"
                      : "border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
                    } placeholder:text-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                  value={manualIdCheckIn.id}
                  onChange={(e) => {
                    setManualIdCheckIn({ id: e.target.value });
                    setEmptyField(false);
                  }}
                  placeholder="เช่น 12345"
                  disabled={showHoliday?.isHoliday}
                />
              </div>
              {emptyField && (
                <p className="text-rose-500 text-xs mt-1">⚠ กรุณากรอกเลขประจำตัวนักเรียน</p>
              )}
            </div>

            <button
              type="submit"
              disabled={showHoliday?.isHoliday}
              className="mt-auto w-full flex items-center justify-center gap-2 py-3.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-200 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-base transition-colors shadow-md shadow-blue-200"
            >
              <ClipboardCheck className="w-5 h-5" />
              ส่งข้อมูล
            </button>
          </form>

          {/* Hint */}
          <p className="text-center text-gray-400 text-xs mt-3">
            💡 กด <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-xs">Enter</kbd> เพื่อส่งข้อมูลได้เลย
          </p>
        </div>
      </div>
    </main>
  );
}

export default AttendanceCheckPage;
