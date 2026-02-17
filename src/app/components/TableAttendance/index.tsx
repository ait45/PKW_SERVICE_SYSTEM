"use client";
import React, { useEffect, useState, useMemo } from "react";
import {
  LoaderCircle,
  Calendar,
  RefreshCw,
  SquarePen,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Users,
  UserCheck,
  UserX,
  Clock,
  Info,
  Save,
  Undo2,
  AlertTriangle,
} from "lucide-react";
import Swal from "sweetalert2";
import CurrentDay from "../date-time/day";
import { SkeletonTableAttendance } from "../Skeleton";

interface holiday {
  isHoliday: boolean;
  name?: string;
  type?: "regular" | "auto_present" | "";
  status?: string;
}
interface DataStudent {
  _id: string;
  studentId: string;
  name: string;
  classes: string;
  phone: string;
  parentPhone: string;
  Number: number;
  plantData: string;
  joinDays: number;
  lateDays: number;
  leaveDays: number;
  adsentDays: number;
  behaviorScore: number;
  event_absent_periods: number;
}

interface DataAttendance {
  HANDLER: string;
  STUDENT_ID: string;
  NAME: string;
  CLASSES: string;
  STATUS: string;
  CREATED_AT: Date;
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

const classOptions = [
  "ทั้งหมด",
  "มัธยมศึกษาปีที่ 1",
  "มัธยมศึกษาปีที่ 2",
  "มัธยมศึกษาปีที่ 3",
  "มัธยมศึกษาปีที่ 4",
  "มัธยมศึกษาปีที่ 5",
  "มัธยมศึกษาปีที่ 6",
];

function TableAttendance({ session }: { session: any }) {
  const now = new Date();
  const [DataStudentAttendance, setDataStudentAttendance] = useState<DataAttendance[]>([]);
  const [DataStudent, setDataStudent] = useState<DataStudent[]>([]);
  const [stateSelectDisable, setStateSelectDisable] = useState<boolean>(false);
  const [selectClasses, setSelectClasses] = useState<string>("ทั้งหมด");
  const [overTimeEditState, setOverTimeEditState] = useState<boolean>(false);
  const [dataHoliday, setDataHolidays] = useState<holiday>({ isHoliday: false, name: "", type: "" });
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Sorting states
  const [sortBy, setSortBy] = useState<"studentId" | "name" | "classes" | "status">("studentId");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const [dataUpdate, setDataUpdate] = useState<any[]>([]);
  const [statusUpdate, setStatusUpdate] = useState<boolean>(false);

  const fetchDataAttendance = async () => {
    setLoading(true);
    try {
      const req = await fetch("/api/scanAttendance");
      if (req.status === 404 || req.status === 204) {
        setDataStudentAttendance([]);
        return;
      }
      const data = await req.json();
      if (Array.isArray(data.message)) {
        setDataStudentAttendance(data.message);
      } else {
        setDataStudentAttendance([]);
      }
    } catch (error) {
      console.error(error);
      setDataStudentAttendance([]);
      Swal.fire("เกิดข้อผิดพลาด", "", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchDataSetting = async () => {
    try {
      const req = await fetch("/api/setting");
      if (req.status === 204) return;
      const data = await req.json();
      return data.data;
    } catch (error: any) {
      console.error(error);
      Swal.fire("เกิดข้อผิดพลาด", error, "error");
    }
  };

  const holiday = async () => {
    try {
      const res = await fetch("/api/holidays");
      const data = await res.json();
      setDataHolidays(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchDataStudent = async () => {
    try {
      const req = await fetch("/api/studentManagement");
      const data = await req.json();
      if (data.payload.lenght < 1) return;
      setDataStudent(data.payload);
    } catch (error: any) {
      console.log(error);
      Swal.fire("เกิดข้อผิดพลาด", error, "error");
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([
        fetchDataAttendance(),
        fetchDataStudent(),
        fetchDataSetting(),
        checkTimeOut_Edit(),
        holiday(),
      ]);
      setInitialLoading(false);
    };
    loadAll();

    if (session?.user?.role !== "teacher" && session?.user?.isAdmin === false)
      setStateSelectDisable(true);
  }, []);

  const checkTimeOut_Edit = async () => {
    const setting = await fetchDataSetting();
    const [h, m] = setting.absentThreshold.split(":").map(Number);
    const timeCutoff = new Date();
    timeCutoff.setHours(h, m, 0, 0);
    if (now > timeCutoff) {
      if (session?.user?.role === "teacher" && session?.user?.isAdmin === true)
        return;
      setStateSelectDisable(true);
      setOverTimeEditState(true);
    }
  };

  // Sorting
  const handleSort = (column: "studentId" | "name" | "classes" | "status") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown size={14} className="ml-1 opacity-40" />;
    return sortOrder === "asc"
      ? <ArrowUp size={14} className="ml-1 text-teal-600" />
      : <ArrowDown size={14} className="ml-1 text-teal-600" />;
  };

  // Merged + filtered + searched + sorted data
  const filteredStudentSelected = useMemo(() => {
    let students =
      selectClasses === "ทั้งหมด"
        ? DataStudent
        : DataStudent.filter((s: any) => s.classes === selectClasses);

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      students = students.filter(
        (s) =>
          s.studentId.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q)
      );
    }

    if (!DataStudentAttendance) {
      return students.map((student) => ({
        studentId: student.studentId,
        name: student.name,
        classes: student.classes,
        status: "ยังไม่เช็คชื่อ",
      }));
    } else {
      setStateSelectDisable(false);
      if (students.length === 0) return null;
      const mappedStudents = students.map((student: any) => {
        const attendance: any = DataStudentAttendance.find(
          (a: any) => a.studentId === student.studentId
        );
        return {
          ...student,
          status: attendance ? attendance.status : "ยังไม่เช็คชื่อ",
        };
      });

      return [...mappedStudents].sort((a, b) => {
        const aValue = String(a[sortBy] ?? "");
        const bValue = String(b[sortBy] ?? "");
        if (sortOrder === "asc") {
          return aValue.localeCompare(bValue, "th");
        }
        return bValue.localeCompare(aValue, "th");
      });
    }
  }, [DataStudent, selectClasses, DataStudentAttendance, sortBy, sortOrder, searchQuery]);

  // Summary stats
  const stats = useMemo(() => {
    const data = filteredStudentSelected || [];
    const total = data.length;
    const present = data.filter((s: any) => s.status === "เข้าร่วมกิจกรรม").length;
    const late = data.filter((s: any) => s.status === "สาย").length;
    const leave = data.filter((s: any) => s.status === "ลา").length;
    const absent = data.filter((s: any) => s.status === "ขาด").length;
    const unchecked = data.filter((s: any) => s.status === "ยังไม่เช็คชื่อ").length;
    return { total, present, late, leave, absent, unchecked };
  }, [filteredStudentSelected]);

  const totalPages = Math.ceil(
    (filteredStudentSelected?.length ?? 0) / rowsPerPage
  );

  const currentData =
    filteredStudentSelected?.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    ) || [];

  function handleStatusChange(inputId: string, newStatus: string) {
    setDataUpdate((prev: any) => {
      const filtered = prev.filter((item: any) => item.studentId !== inputId);
      const data: any = DataStudentAttendance.find((d: any) => d.studentId === inputId);
      if (data) {
        return [
          ...filtered,
          { update: true, studentId: inputId, status: newStatus },
        ];
      }
      const student: any = DataStudent.find((d: any) => d.studentId === inputId);
      return [
        ...filtered,
        {
          update: false,
          studentId: inputId,
          status: newStatus,
          name: student.name,
          classes: student.classes,
        },
      ];
    });
    setDataStudentAttendance((prev: any) => {
      const currentData = prev ?? [];
      const exists = currentData.find((d: any) => d.studentId === inputId);
      if (exists) {
        return currentData.map((d: any) =>
          d.studentId === inputId ? { ...d, status: newStatus } : d
        );
      }
      const student = DataStudent.find((s: any) => s.studentId === inputId);
      if (student) {
        return [
          ...currentData,
          {
            studentId: inputId,
            name: student.name,
            classes: student.classes,
            status: newStatus,
          },
        ];
      }
      return currentData;
    });
  }

  const handleUpdate = async () => {
    if (dataUpdate.length === 0) return;
    Swal.fire({
      text: "ยืนยันการบันทึกข้อมูล...",
      confirmButtonText: "ตกลง",
      showCancelButton: true,
      cancelButtonText: "ยกเลิก",
      icon: "question",
      iconColor: "#009EA3",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setStatusUpdate(true);
        setLoading(true);
        try {
          const req = await fetch("/api/scanAttendance", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataUpdate),
          });
          if (req.ok) {
            Swal.fire({
              text: "อัพเดตข้อมูลสำเร็จ",
              icon: "success",
              timer: 2000,
            });
            setDataUpdate([]);
            fetchDataAttendance();
          }
        } catch (error: any) {
          setStatusUpdate(false);
          setLoading(false);
          Swal.fire("เกิดข้อผิดพลาด", error, "error");
          throw error;
        } finally {
          setLoading(false);
          setStatusUpdate(false);
        }
      }
    });
  };

  const isSelectDisabled =
    stateSelectDisable ||
    (session?.user?.role === "teacher" && session?.user?.isAdmin === false) ||
    dataHoliday.isHoliday;

  if (initialLoading) return <SkeletonTableAttendance />;

  return (
    <main className="max-w-7xl mx-auto p-2 sm:p-4">
      {/* Header Card */}
      <div className="bg-[#009EA3] rounded-xl p-4 sm:p-6 text-white mb-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <SquarePen size={28} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">ตารางแก้ไขเช็คชื่อ</h1>
              <p className="text-white/80 text-sm">การเช็คชื่อเข้าร่วมกิจกรรมหน้าเสาธง</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2">
              <Calendar size={16} />
              <span className="text-sm"><CurrentDay /></span>
            </div>
            <button
              className="p-2.5 cursor-pointer bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors rounded-lg"
              onClick={fetchDataAttendance}
              title="รีเฟรช"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {overTimeEditState && (
          <div className="mt-3 bg-red-500/20 backdrop-blur-sm rounded-lg px-4 py-2.5 flex items-center gap-2">
            <AlertTriangle size={18} />
            <div>
              <p className="text-sm font-medium">หมดเวลาการแก้ไขข้อมูล</p>
              <p className="text-xs text-white/70">กรุณาติดต่อผู้ดูแลเพื่อดำเนินการ</p>
            </div>
          </div>
        )}
        {dataHoliday.isHoliday && (
          <div className={`mt-3 backdrop-blur-sm rounded-lg px-4 py-2.5 flex items-center gap-2 ${
            dataHoliday.type === "auto_present" 
              ? "bg-emerald-500/20" 
              : "bg-amber-500/20"
          }`}>
            <Info size={18} />
            {dataHoliday.type === "auto_present" ? (
              <p className="text-sm">🎉 {dataHoliday.name} — ระบบเช็คชื่อมาทั้งหมดอัตโนมัติ ({dataHoliday.status})</p>
            ) : (
              <p className="text-sm">📅 {dataHoliday.name} — ไม่ต้องเช็คชื่อ</p>
            )}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4">
        {[
          { label: "ทั้งหมด", val: stats.total, icon: Users, bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700" },
          { label: "เข้าร่วม", val: stats.present, icon: UserCheck, bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
          { label: "สาย", val: stats.late, icon: Clock, bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
          { label: "ลา", val: stats.leave, icon: Info, bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
          { label: "ขาด", val: stats.absent, icon: UserX, bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
          { label: "ยังไม่เช็ค", val: stats.unchecked, icon: Clock, bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-500" },
        ].map((card) => (
          <div
            key={card.label}
            className={`${card.bg} ${card.border} border rounded-xl p-3 transition-all hover:shadow-sm`}
          >
            <div className="flex items-center gap-2 mb-1">
              <card.icon size={16} className={card.text} />
              <span className="text-xs text-gray-500">{card.label}</span>
            </div>
            <p className={`text-xl sm:text-2xl font-bold ${card.text}`}>{card.val}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end justify-between">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-gray-500 block mb-1">ค้นหานักเรียน</label>
              <div className="relative">
                <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="เลขประจำตัว หรือ ชื่อ..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg outline-none text-sm focus:border-teal-400 transition-colors w-48 sm:w-56"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">ชั้นเรียน</label>
              <select
                className="px-3 py-2 border border-gray-200 rounded-lg cursor-pointer text-sm outline-none focus:border-teal-400 transition-colors"
                value={selectClasses}
                onChange={(e) => {
                  setSelectClasses(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {classOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">แถว</label>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg cursor-pointer text-sm outline-none focus:border-teal-400 transition-colors"
              >
                {[10, 25, 50, 75].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {dataUpdate.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-teal-600 font-medium">
                แก้ไข {dataUpdate.length} รายการ
              </span>
              <button
                onClick={() => {
                  setDataUpdate([]);
                  fetchDataAttendance();
                }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
              >
                <Undo2 size={14} /> รีเซ็ต
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <LoaderCircle className="animate-spin text-teal-500" size={40} />
            <p className="text-sm text-gray-400">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-linear-to-r from-teal-50 to-cyan-50 border-b border-teal-100">
                  {[
                    { key: "studentId", label: "เลขประจำตัว", width: "w-[18%]" },
                    { key: "name", label: "ชื่อ-สกุล", width: "" },
                    { key: "classes", label: "ชั้นเรียน", width: "w-[18%]" },
                    { key: "status", label: "สถานะ", width: "w-[22%]" },
                  ].map((col) => (
                    <th
                      key={col.key}
                      className={`px-4 py-3.5 ${col.width} cursor-pointer hover:bg-teal-100/50 transition-colors select-none text-left text-nowrap`}
                      onClick={() => handleSort(col.key as any)}
                    >
                      <div className="flex items-center text-gray-600 font-semibold">
                        {col.label}
                        {getSortIcon(col.key)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentData.length > 0 ? (
                  currentData.map((value: any) => {
                    const isModified = dataUpdate.some((u: any) => u.studentId === value.studentId);
                    return (
                      <tr
                        key={value.studentId}
                        className={`transition-colors hover:bg-gray-50 ${
                          isModified ? "bg-teal-50/60" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-[#009EA3] font-medium">{value.studentId}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-800 text-nowrap">{value.name}</td>
                        <td className="px-4 py-3 text-gray-600 text-nowrap"><div className="p-1 bg-blue-100 text-blue-500 rounded-md text-center">
                          {value.classes}</div></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getStatusDot(value.status)} shrink-0`} />
                            <select
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium outline-none cursor-pointer transition-all border ${
                                isModified
                                  ? "border-teal-400 ring-2 ring-teal-100"
                                  : "border-gray-200"
                              } ${getStatusColor(value.status)} disabled:opacity-50 disabled:cursor-not-allowed`}
                              value={value.status}
                              onChange={(e) => handleStatusChange(value.studentId, e.target.value)}
                              disabled={isSelectDisabled}
                            >
                              {statusOptions.map((opt) => (
                                <option
                                  key={opt.value}
                                  value={opt.value}
                                  className="text-black bg-white"
                                  disabled={opt.value === "ยังไม่เช็คชื่อ" && value.status !== "ยังไม่เช็คชื่อ"}
                                >
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                      <Users size={32} className="mx-auto mb-2 opacity-40" />
                      ไม่พบข้อมูลนักเรียน
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer: Pagination + Submit */}
        <div className="border-t border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Pagination */}
          <div className="flex items-center gap-1 text-sm">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              ก่อนหน้า
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                if (totalPages <= 7) return true;
                if (page === 1 || page === totalPages) return true;
                if (Math.abs(page - currentPage) <= 1) return true;
                return false;
              })
              .map((page, idx, arr) => (
                <React.Fragment key={page}>
                  {idx > 0 && arr[idx - 1] !== page - 1 && (
                    <span className="px-1 text-gray-300">...</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[32px] py-1 rounded-md cursor-pointer transition-colors ${
                      page === currentPage
                        ? "bg-teal-500 text-white font-medium shadow-sm"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-2.5 py-1 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              ต่อไป
            </button>
            <span className="text-xs text-gray-400 ml-2">
              {filteredStudentSelected?.length || 0} รายการ
            </span>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleUpdate}
            disabled={dataUpdate.length === 0 || overTimeEditState}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
          >
            {statusUpdate ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            บันทึกการเปลี่ยนแปลง
            {dataUpdate.length > 0 && (
              <span className="bg-white/25 rounded-full px-2 py-0.5 text-xs">
                {dataUpdate.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

export default TableAttendance;
