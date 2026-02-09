"use client";

import { useEffect, useState } from "react";
import QRScanning from "../QRScanning";
import { IdCard, UserRoundCheck, ClipboardCheck } from "lucide-react";
import Swal from "sweetalert2";

interface QRdata {
  id: string
}

interface holiday {
  isHoliday: boolean;
  name?: string;
}
// หน้าเช็คชื่อ
function AttendanceCheckPage({ session }: { session: any }) {
  const [qrData, setQrdata] = useState<QRdata>({ id: "" });
  const [showHoliday, setShowHoliday] = useState<holiday>({ isHoliday: false, name: "" });

  const [manualIdCheckIn, setManualIdCheckIn] = useState<QRdata>({ id: "" });
  const [emptyField, setEmptyField] = useState<boolean>(false);

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
      if (req.status === 400)
        return Swal.fire({ text: res.message, icon: "error", width: "60%" });
      if (res.success) {
        return Swal.fire({ title: "เช็คชื่อสำเร็จ", icon: "success", width: "60%" });
      }
      Swal.fire({ title: "เกิดข้อผิดพลาด", text: res.message, icon: "error" });
    } catch (error: any) {
      document.body.classList.remove("loading");
      console.log(error);
      Swal.fire({ title: "เกิดข้อผิดพลาด", text: error, icon: "error" });
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

  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualIdCheckIn.id.trim() === "") {
      Swal.fire({
        text: "กรุณากรอกเลขประจำตัวนักเรียน",
        icon: "warning",
        width: 300,
        timer: 2000,
      });
      setEmptyField(true);
      return;
    } else {
      Swal.fire({
        title: "ยืนยันการเช็คชื่อ?",
        text: `เลขประจำตัวนักเรียน: ${manualIdCheckIn.id}`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "ยืนยัน",
        confirmButtonColor: "#10B981",
        cancelButtonColor: "#EF4444",
        cancelButtonText: "ยกเลิก",
      }).then((result) => {
        if (result.isConfirmed) {
          attendance(manualIdCheckIn.id);
          setManualIdCheckIn({ id: "" });
          setEmptyField(false);
        }
      });
    }
  };

  return (
    <main className="bg-white rounded-lg shadow-lg p-4 mb-7 max-w-5xl mx-auto">
      <div className="">
        <div className="flex items-center justify-center mb-1">
          <div className="bg-emerald-500 text-white rounded-md p-2">
            <UserRoundCheck width={30} height={30} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 text-center ml-2">
            เช็คชื่อนักเรียน
          </h2>
        </div>
        {showHoliday ? (
          showHoliday.isHoliday && (
            <p className="text-xs text-red-500 text-center mb-4">
              * {showHoliday.name} ไม่ต้องเช็คชื่อ *
            </p>
          )

        ) : null}
      </div>

      <div className="text-center">
        <QRScanning
          onScan={(value: string) => setQrdata({ id: value })}
          holiday={showHoliday?.isHoliday}
        />
      </div>
      <div className="bg-linear-to-br from-blue-50 to-indigo-100 mt-4 p-4 rounded-md shadow-md">
        <div className="flex items-center">
          <div className="p-2 bg-blue-500 rounded-md mr-1">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-[#009EA3] text-xl font-semibold">ID Check</h1>
        </div>
        <div className="flex items-center">
          <div>
            <label className="text-xs">เลขประจำตัวนักเรียน</label>
            <div className="relative w-full">
              <IdCard
                className={`absolute z-10 left-2 top-1/2 transform -translate-y-1/2 text-blue-500 ${emptyField && "text-rose-500"
                  }`}
              />
              <input
                type="number"
                className={`relative outline-none bg-white px-3 py-2 ring-2 ring-blue-200 focus:ring-blue-400 rounded-md pl-10 w-full sm:w-fit mt-3/2 ${emptyField && "ring-rose-500"
                  } placeholder:text-slate-300`}
                value={manualIdCheckIn.id}
                onChange={(e) => {
                  setManualIdCheckIn({ id: e.target.value });
                  setEmptyField(false);
                }}
                placeholder="1234"
              />
            </div>
          </div>
          <button
            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors mt-5.5 ml-4 disabled:cursor-not-allowed"
            onClick={handleManualCheckIn}
            disabled={showHoliday?.isHoliday}
          >
            ส่งข้อมูล
          </button>
        </div>
      </div>
    </main>
  );
}

export default AttendanceCheckPage;
