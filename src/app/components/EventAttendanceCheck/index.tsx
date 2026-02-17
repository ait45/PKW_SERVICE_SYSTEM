"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  UserRoundCheck,
  IdCard,
  Calendar,
  Clock,
  Users,
  Check,
  XCircle,
  AlertCircle,
  Timer,
} from "lucide-react";
import Swal from "sweetalert2";
import QRScanning from "../QRScanning";

interface Event {
  ID: number;
  NAME: string;
  TYPE: "special_day" | "activity";
  EVENT_DATE: string;
  START_TIME: string;
  END_TIME: string;
  TARGET_CLASSES: string | null;
  PERIODS: number;
  STATUS: "upcoming" | "active" | "completed";
}

interface AttendanceStats {
  present: number;
  leave: number;
  late: number;
  absent: number;
  total: number;
}

function EventAttendanceCheck({ session }: { session: any }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [qrData, setQrData] = useState<Record<string, string>>({});
  const [manualId, setManualId] = useState("");
  const [emptyField, setEmptyField] = useState(false);
  const [stats, setStats] = useState<AttendanceStats>({
    present: 0,
    leave: 0,
    late: 0,
    absent: 0,
    total: 0,
  });

  // Fetch events
  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (data.success) {
        // Filter only upcoming and active events
        const activeEvents = (data.message || []).filter(
          (e: Event) => e.STATUS === "upcoming" || e.STATUS === "active"
        );
        setEvents(activeEvents);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch attendance stats for selected event
  const fetchStats = async (eventId: number) => {
    try {
      const res = await fetch(`/api/eventAttendance?eventId=${eventId}`);
      const data = await res.json();
      if (data.success && data.message) {
        const attendanceList = data.message;
        const present = attendanceList.filter(
          (a: any) => a.STATUS === "เข้าร่วมกิจกรรม"
        ).length;
        const leave = attendanceList.filter(
          (a: any) => a.STATUS === "ลา"
        ).length;
        const late = attendanceList.filter(
          (a: any) => a.STATUS === "สาย"
        ).length;
        const absent = attendanceList.filter(
          (a: any) => a.STATUS === "ขาด"
        ).length;
        setStats({
          present,
          leave,
          late,
          absent,
          total: attendanceList.length,
        });
      } else {
        setStats({ present: 0, leave: 0, late: 0, absent: 0, total: 0 });
      }
    } catch (error) {
      console.error(error);
    }
  };


  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchEvents();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      const event = events.find((e) => e.ID === selectedEventId);
      setSelectedEvent(event || null);
      fetchStats(selectedEventId);
    } else {
      setSelectedEvent(null);
      setStats({ present: 0, leave: 0, late: 0, absent: 0, total: 0 });
    }
  }, [selectedEventId, events]);

  // Handle QR Scan
  useEffect(() => {
    if (Object.keys(qrData).length > 0 && selectedEventId) {
      handleAttendance(qrData.id);
      setQrData({});
    }
  }, [qrData]);

  // Attendance function
  const handleAttendance = async (studentId: string) => {
    if (!selectedEventId) {
      Swal.fire({
        text: "กรุณาเลือกกิจกรรมก่อน",
        icon: "warning",
        timer: 2000,
      });
      return;
    }

    document.body.classList.add("loading");
    try {
      const res = await fetch("/api/eventAttendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId,
          studentId,
          handler: session?.user?.name || "Unknown",
          status: "เข้าร่วมกิจกรรม",
        }),
      });
      const data = await res.json();

      if (res.status === 409) {
        Swal.fire({
          text: "นักเรียนคนนี้ได้เช็คชื่อไปแล้ว",
          icon: "info",
          timer: 2000,
        });
      } else if (data.success) {
        Swal.fire({
          title: "เช็คชื่อสำเร็จ!",
          icon: "success",
          timer: 1500,
        });
        fetchStats(selectedEventId);
      } else {
        Swal.fire({
          title: "เกิดข้อผิดพลาด",
          text: data.message || "ไม่พบนักเรียนในระบบ",
          icon: "error",
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        icon: "error",
      });
    } finally {
      document.body.classList.remove("loading");
    }
  };

  // Handle manual check-in
  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim() === "") {
      Swal.fire({
        text: "กรุณากรอกเลขประจำตัวนักเรียน",
        icon: "warning",
        timer: 2000,
      });
      setEmptyField(true);
      return;
    }

    if (!selectedEventId) {
      Swal.fire({
        text: "กรุณาเลือกกิจกรรมก่อน",
        icon: "warning",
        timer: 2000,
      });
      return;
    }

    Swal.fire({
      title: "ยืนยันการเช็คชื่อ?",
      text: `เลขประจำตัวนักเรียน: ${manualId}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      confirmButtonColor: "#10B981",
      cancelButtonColor: "#EF4444",
      cancelButtonText: "ยกเลิก",
    }).then((result) => {
      if (result.isConfirmed) {
        handleAttendance(manualId);
        setManualId("");
        setEmptyField(false);
      }
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <main className="p-4 h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center mb-4">
          <div className="bg-emerald-500 text-white rounded-md p-2">
            <UserRoundCheck size={30} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 ml-3">
            เช็คชื่อกิจกรรม
          </h2>
        </div>

        {/* Event Selector */}
        <div className="mb-6">
          <label className="text-sm text-slate-600 block mb-2">
            เลือกกิจกรรม
          </label>
          <select
            value={selectedEventId || ""}
            onChange={(e) =>
              setSelectedEventId(e.target.value ? Number(e.target.value) : null)
            }
            className="w-full px-4 py-3 border-2 border-emerald-500 rounded-lg outline-none focus:ring-2 focus:ring-emerald-300 cursor-pointer text-lg"
          >
            <option value="">-- เลือกกิจกรรม --</option>
            {events.map((event) => (
              <option key={event.ID} value={event.ID}>
                {event.NAME} ({formatDate(event.EVENT_DATE)})
              </option>
            ))}
          </select>
        </div>

        {/* Event Info Card */}
        {/* Event Info Card */}
        {selectedEvent && (
          <div className="bg-linear-to-r from-emerald-50 to-teal-50 rounded-xl p-4 mb-6 border border-emerald-200 overflow-x-scroll">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
              <h3 className="font-bold text-lg text-emerald-800">
                {selectedEvent.NAME}
              </h3>
              <div className="mt-2 md:mt-0">
                {(() => {
                  const now = new Date();
                  const eventDate = new Date(selectedEvent.EVENT_DATE);
                  const [startHour, startMinute] = selectedEvent.START_TIME.split(
                    ":"
                  ).map(Number);
                  const [endHour, endMinute] = selectedEvent.END_TIME.split(
                    ":"
                  ).map(Number);

                  const startTime = new Date(eventDate);
                  startTime.setHours(startHour, startMinute, 0);

                  const endTime = new Date(eventDate);
                  endTime.setHours(endHour, endMinute, 0);

                  // Adjust for date only comparison if needed, or full datetime
                  // Assuming EVENT_DATE is "YYYY-MM-DD"
                  // If current time is before start time
                  let statusEl;

                  if (now < startTime) {
                    statusEl = (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                        <span className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></span>
                        กำลังจะมาถึง
                      </span>
                    );
                  } else if (now >= startTime && now <= endTime) {
                    statusEl = (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-ping"></span>
                        กำลังดำเนินอยู่
                      </span>
                    );
                  } else {
                    statusEl = (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
                        จบกิจกรรมแล้ว
                      </span>
                    );
                  }
                  return statusEl;
                })()}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm p-2">
              <div className="flex items-center text-slate-600 p-2">
                <Calendar size={16} className="mr-2 text-emerald-600" />
                <p className="text-nowrap">
                  {formatDate(selectedEvent.EVENT_DATE)}
                </p>
              </div>
              <div className="flex items-center text-slate-600 p-2">
                <Clock size={16} className="mr-2 text-emerald-600" />
                <p className="text-nowrap">
                  {selectedEvent.START_TIME} - {selectedEvent.END_TIME}
                </p>
              </div>
              <div className="flex items-center text-slate-600 p-2">
                <Timer size={16} className="mr-2 text-emerald-600" />
                <p className="text-nowrap">{selectedEvent.PERIODS} คาบ</p>
              </div>
              <div className="flex items-center text-slate-600 p-2">
                <Users size={16} className="mr-2 text-emerald-600" />
                <p className="text-nowrap">
                  {selectedEvent.TARGET_CLASSES || "ทุกชั้น"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* QR Scanner and Manual Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* QR Scanner */}
            <div className="h-auto">
            <QRScanning
              onScan={(value: any) => setQrData(value)}
              holiday={!selectedEventId}
            />
          </div>

          {/* Manual ID Input */}
          <div className="bg-linear-to-br from-blue-50 to-indigo-50 p-4 rounded-xl">
            <h3 className="text-[#009EA3] text-lg font-semibold mb-3">
              ID Check
            </h3>
            <div className="flex flex-col">
              <label className="text-xs text-slate-600 mb-1">
                เลขประจำตัวนักเรียน
              </label>
              <div className="relative">
                <IdCard
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                    emptyField ? "text-rose-500" : "text-blue-500"
                  }`}
                  size={20}
                />
                <input
                  type="number"
                  value={manualId}
                  onChange={(e) => {
                    setManualId(e.target.value);
                    setEmptyField(false);
                  }}
                  placeholder="1234"
                  disabled={!selectedEventId}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border-2 outline-none transition-colors ${
                    emptyField
                      ? "border-rose-500 ring-2 ring-rose-200"
                      : "border-blue-200 focus:border-blue-400"
                  } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                />
              </div>
              <button
                onClick={handleManualCheckIn}
                disabled={!selectedEventId}
                className="mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                ส่งข้อมูล
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-emerald-500 rounded-xl p-4 text-center text-white shadow-lg">
            <div className="flex justify-center mb-2">
              <Check size={24} />
            </div>
            <p className="text-sm opacity-90">เข้าร่วม</p>
            <p className="text-3xl font-bold">{stats.present}</p>
          </div>

          <div className="bg-yellow-500 rounded-xl p-4 text-center text-white shadow-lg">
            <div className="flex justify-center mb-2">
              <AlertCircle size={24} />
            </div>
            <p className="text-sm opacity-90">ลา</p>
            <p className="text-3xl font-bold">{stats.leave}</p>
          </div>

          <div className="bg-orange-500 rounded-xl p-4 text-center text-white shadow-lg">
            <div className="flex justify-center mb-2">
              <Timer size={24} />
            </div>
            <p className="text-sm opacity-90">สาย</p>
            <p className="text-3xl font-bold">{stats.late}</p>
          </div>

          <div className="bg-red-500 rounded-xl p-4 text-center text-white shadow-lg">
            <div className="flex justify-center mb-2">
              <XCircle size={24} />
            </div>
            <p className="text-sm opacity-90">ขาด</p>
            <p className="text-3xl font-bold">{stats.absent}</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default EventAttendanceCheck;
