"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  SquarePen,
  Calendar,
  RefreshCcw,
  Save,
} from "lucide-react";
import Swal from "sweetalert2";

interface Event {
  ID: number;
  NAME: string;
  TYPE: "special_day" | "activity";
  EVENT_DATE: string;
  PERIODS: number;
}

interface AttendanceRecord {
  ID: number;
  EVENT_ID: number;
  STUDENT_ID: string;
  NAME: string;
  CLASSES: string;
  STATUS: string;
}

interface Student {
  studentId: string;
  name: string;
  classes: string;
}

const statusOptions = [
  { value: "เข้าร่วมกิจกรรม", label: "เข้าร่วมกิจกรรม", color: "bg-emerald-500", text: "text-white" },
  { value: "ลา", label: "ลา", color: "bg-yellow-500", text: "text-white" },
  { value: "สาย", label: "สาย", color: "bg-orange-500", text: "text-white" },
  { value: "ขาด", label: "ขาด", color: "bg-red-500", text: "text-white" },
  { value: "ยังไม่เช็คชื่อ", label: "ยังไม่เช็คชื่อ", color: "bg-gray-200", text: "text-gray-700" },
];

const getStatusColor = (status: string) => {
  const found = statusOptions.find((s) => s.value === status);
  return found ? `${found.color} ${found.text}` : "bg-gray-200 text-gray-700";
};

const getStatusDot = (status: string) => {
  switch (status) {
    case "เข้าร่วมกิจกรรม": return "bg-emerald-500";
    case "ลา": return "bg-yellow-500";
    case "สาย": return "bg-orange-500";
    case "ขาด": return "bg-red-500";
    default: return "bg-gray-300";
  }
};

function EventAttendanceTable({ session }: { session: any }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [dataUpdate, setDataUpdate] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectClasses, setSelectClasses] = useState("ทั้งหมด");
  const [refresh, setRefresh] = useState(false);

  const classesList = [
    { label: "มัธยมศึกษาปีที่ 1", val: 0 },
    { label: "มัธยมศึกษาปีที่ 2", val: 1 },
    { label: "มัธยมศึกษาปีที่ 3", val: 2 },
    { label: "มัธยมศึกษาปีที่ 4", val: 3 },
    { label: "มัธยมศึกษาปีที่ 5", val: 4 },
    { label: "มัธยมศึกษาปีที่ 6", val: 5 },
    { label: "ทั้งหมด", val: 6 },
  ];

  // Fetch events
  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (data.success) {
        setEvents(data.message || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch students
  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/studentManagement");
      const data = await res.json();
      if (data.payload) {
        setStudents(data.payload);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch attendance for selected event
  const fetchAttendance = async (eventId: number) => {
    try {
      const res = await fetch(`/api/eventAttendance?eventId=${eventId}`);
      const data = await res.json();
      if (data.success) {
        setAttendance(data.message || []);
      } else {
        setAttendance([]);
      }
    } catch (error) {
      console.error(error);
      setAttendance([]);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchAttendance(selectedEventId);
      setDataUpdate([]);
    } else {
      setAttendance([]);
    }
  }, [selectedEventId]);

  // Merge students with attendance
  const mergedData = useMemo(() => {
    if (!selectedEventId) return [];

    const filteredStudents =
      selectClasses === "ทั้งหมด"
        ? students
        : students.filter((s) => s.classes === selectClasses);

    return filteredStudents.map((student) => {
      const record = attendance.find(
        (a) => a.STUDENT_ID === student.studentId
      );
      return {
        studentId: student.studentId,
        name: student.name,
        classes: student.classes,
        status: record ? record.STATUS : "ยังไม่เช็คชื่อ",
        hasRecord: !!record,
        recordId: record?.ID,
      };
    });
  }, [students, attendance, selectedEventId, selectClasses]);

  // Handle status change
  const handleStatusChange = (studentId: string, newStatus: string) => {
    // Update dataUpdate for saving later
    setDataUpdate((prev) => {
      const existing = prev.find((d) => d.studentId === studentId);
      const student = students.find((s) => s.studentId === studentId);
      const record = attendance.find((a) => a.STUDENT_ID === studentId);

      if (existing) {
        return prev.map((d) =>
          d.studentId === studentId ? { ...d, status: newStatus } : d
        );
      }

      return [
        ...prev,
        {
          studentId,
          name: student?.name,
          classes: student?.classes,
          status: newStatus,
          isUpdate: !!record,
          recordId: record?.ID,
        },
      ];
    });

    // Update local attendance display
    setAttendance((prev) => {
      const existing = prev.find((a) => a.STUDENT_ID === studentId);
      if (existing) {
        return prev.map((a) =>
          a.STUDENT_ID === studentId ? { ...a, STATUS: newStatus } : a
        );
      }
      // Add new record locally
      const student = students.find((s) => s.studentId === studentId);
      return [
        ...prev,
        {
          ID: 0,
          EVENT_ID: selectedEventId!,
          STUDENT_ID: studentId,
          NAME: student?.name || "",
          CLASSES: student?.classes || "",
          STATUS: newStatus,
        },
      ];
    });
  };

  // Save changes
  const handleSave = async () => {
    if (dataUpdate.length === 0) {
      Swal.fire({ text: "ไม่มีการเปลี่ยนแปลง", icon: "info", timer: 2000 });
      return;
    }

    Swal.fire({
      title: "ยืนยันการบันทึก?",
      text: `บันทึกการเปลี่ยนแปลง ${dataUpdate.length} รายการ`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "บันทึก",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#10B981",
      cancelButtonColor: "#EF4444",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const res = await fetch("/api/eventAttendance", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              eventId: selectedEventId,
              updates: dataUpdate,
              handler: session?.user?.name || "Unknown",
            }),
          });

          const data = await res.json();
          if (data.success) {
            Swal.fire({
              text: "บันทึกสำเร็จ!",
              icon: "success",
              timer: 2000,
            });
            setDataUpdate([]);
            fetchAttendance(selectedEventId!);
          } else {
            Swal.fire("เกิดข้อผิดพลาด", data.message || "", "error");
          }
        } catch (error) {
          console.error(error);
          Swal.fire("เกิดข้อผิดพลาด", "", "error");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "เข้าร่วมกิจกรรม":
        return "bg-emerald-500 text-white";
      case "ลา":
        return "bg-yellow-500 text-white";
      case "สาย":
        return "bg-orange-500 text-white";
      case "ขาด":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(mergedData.length / rowsPerPage);
  const currentData = mergedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const selectedEvent = events.find((e) => e.ID === selectedEventId);

  return (
    <main className="p-4">
      <div className="bg-white rounded-lg shadow-lg p-4">
        {/* Header */}
        <div className="flex items-center mb-4">
          <div className="bg-[#009EA3] mr-3 p-2 rounded-md text-white">
            <SquarePen size={28} />
          </div>
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-800">
              ตารางแก้ไขการเช็คชื่อกิจกรรม
            </h2>
            <p className="text-xs text-slate-600">
              แก้ไขสถานะการเข้าร่วมกิจกรรม
            </p>
          </div>
        </div>

        {/* Event Selector and Filters */}
        <div className="flex flex-wrap gap-4 mb-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <p className="text-xs text-slate-500 mb-1">เลือกกิจกรรม</p>
            <select
              value={selectedEventId || ""}
              onChange={(e) => {
                setSelectedEventId(
                  e.target.value ? Number(e.target.value) : null
                );
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border-2 border-[#009EA3] rounded-md text-sm cursor-pointer outline-none"
            >
              <option value="">-- เลือกกิจกรรม --</option>
              {events.map((event) => (
                <option key={event.ID} value={event.ID}>
                  {event.NAME} ({formatDate(event.EVENT_DATE)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">ชั้นเรียน</p>
            <select
              value={selectClasses}
              onChange={(e) => {
                setSelectClasses(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-[#009EA3] rounded-md text-sm cursor-pointer outline-none"
            >
              {classesList.map((cls) => (
                <option key={cls.label} value={cls.label}>
                  {cls.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1">จำนวนแถว</p>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-[#009EA3] rounded-md text-sm cursor-pointer outline-none"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={handleSave}
            disabled={dataUpdate.length === 0 || loading || !selectedEventId}
            className={`flex items-center px-4 py-2 rounded-lg text-white transition-colors ${
              dataUpdate.length === 0 || !selectedEventId
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-600 cursor-pointer"
            } ${loading ? "cursor-wait" : ""}`}
          >
            <Save size={18} className="mr-2" />
            บันทึกการเปลี่ยนแปลง
            {dataUpdate.length > 0 && (
              <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {dataUpdate.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              if (selectedEventId) {
                setTimeout(async () => {
                  try {
                    await fetchAttendance(selectedEventId);
                    setDataUpdate([]);
                    setRefresh(false);
                  } catch (error) {
                    Swal.fire({ text:"เกิดข้อผิดพลาด", icon:"error"});
                    setRefresh(false);
                  } finally {
                    setRefresh(false);
                  }
                  
                }, 300);
              }
            }}
            disabled={!selectedEventId}
            className="flex items-center px-3 py-2 rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-600 cursor-pointer disabled:cursor-not-allowedl transition-colors disabled:opacity-50"
          >
            <RefreshCcw size={20} className={`${refresh ? "animate-ping" : ""}`}/>
          </button>
        </div>

        {/* Selected Event Info */}
        {selectedEvent && (
          <div className="bg-blue-50 rounded-lg p-3 mb-4 flex items-center text-sm">
            <Calendar size={16} className="mr-2 text-blue-600" />
            <span className="font-medium">{selectedEvent.NAME}</span>
            <span className="mx-2 text-slate-400">|</span>
            <span>{formatDate(selectedEvent.EVENT_DATE)}</span>
            <span className="mx-2 text-slate-400">|</span>
            <span>{selectedEvent.PERIODS} คาบ</span>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto border border-collapse border-slate-300 text-sm">
            <thead>
              <tr className="bg-blue-100 text-nowrap">
                <th className="border border-slate-300 px-4 py-3 w-[15%]">
                  เลขประจำตัว
                </th>
                <th className="border border-slate-300 px-4 py-3">ชื่อ-สกุล</th>
                <th className="border border-slate-300 px-4 py-3 w-[20%]">
                  ชั้นเรียน
                </th>
                <th className="border border-slate-300 px-4 py-3 w-[20%]">
                  สถานะ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!selectedEventId ? (
                <tr>
                  <td
                    colSpan={4}
                    className=" px-4 py-8 text-center text-slate-500"
                  >
                    กรุณาเลือกกิจกรรม
                  </td>
                </tr>
              ) : currentData.length > 0 ? (
                currentData.map((row) => (
                  <tr
                    key={row.studentId}
                    className="bg-slate-50 text-center hover:bg-slate-100 font-mono border-b border-slate-300"
                  >
                    <td className=" text-[#009EA3] px-4 py-3 text-nowrap">
                      {row.studentId}
                    </td>
                    <td className=" px-4 py-3 text-left text-nowrap">
                      {row.name}
                    </td>
                    <td className=" px-4 py-3 text-nowrap">
                      <div className="p-2 rounded-md bg-blue-100 text-blue-500">{row.classes}</div>
                    </td>
                    <td className=" px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusDot(row.status)} shrink-0`}/>
                        <select
                        value={row.status}
                        onChange={(e) =>
                          handleStatusChange(row.studentId, e.target.value)
                        }
                        className={`px-3 py-1 rounded-lg outline-none cursor-pointer ${getStatusColor(
                          row.status
                        )} border-2 border-transparent hover:border-amber-300 transition-colors shadow-sm`}
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value} className={`${opt.color} ${opt.text} p-4 `}>{opt.label}</option>
                        ))}
                      </select>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="border border-slate-300 px-4 py-8 text-center text-slate-500"
                  >
                    ไม่มีข้อมูลนักเรียน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {selectedEventId && mergedData.length > 0 && (
          <div className="flex-col sm:flex justify-between items-center mt-4 mb-2 text-sm">
            <p className="text-slate-500">
              แสดง {(currentPage - 1) * rowsPerPage + 1} -{" "}
              {Math.min(currentPage * rowsPerPage, mergedData.length)} จาก{" "}
              {mergedData.length} รายการ
            </p>
            <hr className="sm:hidden p-2"/>
            <div className="flex">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="hover:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ย้อนกลับ
              </button>
              <span className="px-3 py-1">
                {currentPage} / {totalPages || 1}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage >= totalPages}
                className=" hover:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ต่อไป
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default EventAttendanceTable;
