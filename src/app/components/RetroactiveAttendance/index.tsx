"use client";
import React, { useEffect, useState, useMemo } from "react";
import {
  CalendarClock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  LoaderCircle,
  RefreshCw,
  Send,
  Save,
  Search,
  Users,
  UserCheck,
  UserX,
  Clock,
  Undo2,
  Info,
} from "lucide-react";
import Swal from "sweetalert2";
import { SkeletonRetroactiveAttendance } from "../Skeleton";

interface StudentData {
  studentId: string;
  name: string;
  classes: string;
}

interface AttendanceData {
  handler: string;
  studentId: string;
  name: string;
  classes: string;
  status: string;
  createdAt: string;
}

const statusOptions = [
  {
    value: "เข้าร่วมกิจกรรม",
    label: "เข้าร่วมกิจกรรม",
    color: "bg-emerald-500",
    text: "text-white",
  },
  { value: "ลา", label: "ลา", color: "bg-yellow-500", text: "text-white" },
  { value: "สาย", label: "สาย", color: "bg-orange-500", text: "text-white" },
  { value: "ขาด", label: "ขาด", color: "bg-red-500", text: "text-white" },
  {
    value: "ยังไม่เช็คชื่อ",
    label: "ยังไม่เช็คชื่อ",
    color: "bg-gray-200",
    text: "text-gray-700",
  },
];

const getStatusColor = (status: string) => {
  const found = statusOptions.find((s) => s.value === status);
  return found ? `${found.color} ${found.text}` : "bg-gray-200 text-gray-700";
};

const getStatusDot = (status: string) => {
  switch (status) {
    case "เข้าร่วมกิจกรรม":
      return "bg-emerald-500";
    case "ลา":
      return "bg-yellow-500";
    case "สาย":
      return "bg-orange-500";
    case "ขาด":
      return "bg-red-500";
    default:
      return "bg-gray-300";
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

function RetroactiveAttendance({ session }: { session: any }) {
  const isAdmin = session?.user?.isAdmin === true;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const defaultDate = yesterday.toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [attendance, setAttendance] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [selectClasses, setSelectClasses] = useState("ทั้งหมด");
  const [dataUpdate, setDataUpdate] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Sorting
  const [sortBy, setSortBy] = useState<
    "studentId" | "name" | "classes" | "status"
  >("studentId");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const today = new Date().toISOString().split("T")[0];

  const fetchData = async (date: string) => {
    setLoading(true);
    setDataUpdate([]);
    try {
      const res = await fetch(`/api/scanAttendance/retroactive?date=${date}`);
      const data = await res.json();
      if (data.success) {
        setAttendance(data.attendance || []);
        setStudents(data.students || []);
      } else {
        setAttendance([]);
        setStudents([]);
      }
    } catch (error) {
      console.error(error);
      Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถดึงข้อมูลได้", "error");
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) fetchData(selectedDate);
  }, [selectedDate]);

  // Merge + filter + sort
  const mergedData = useMemo(() => {
    let filtered =
      selectClasses === "ทั้งหมด"
        ? students
        : students.filter((s) => s.classes === selectClasses);

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.studentId.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q),
      );
    }

    const merged = filtered.map((student) => {
      const att = attendance.find((a) => a.studentId === student.studentId);
      const update = dataUpdate.find(
        (u: any) => u.studentId === student.studentId,
      );
      return {
        ...student,
        status: update ? update.status : att ? att.status : "ยังไม่เช็คชื่อ",
        hasAttendance: !!att,
      };
    });

    return [...merged].sort((a, b) => {
      const aVal = String((a as any)[sortBy] ?? "");
      const bVal = String((b as any)[sortBy] ?? "");
      return sortOrder === "asc"
        ? aVal.localeCompare(bVal, "th")
        : bVal.localeCompare(aVal, "th");
    });
  }, [
    students,
    attendance,
    selectClasses,
    sortBy,
    sortOrder,
    dataUpdate,
    searchQuery,
  ]);

  // Summary stats
  const stats = useMemo(() => {
    const total = mergedData.length;
    const present = mergedData.filter(
      (s) => s.status === "เข้าร่วมกิจกรรม",
    ).length;
    const late = mergedData.filter((s) => s.status === "สาย").length;
    const leave = mergedData.filter((s) => s.status === "ลา").length;
    const absent = mergedData.filter((s) => s.status === "ขาด").length;
    const unchecked = mergedData.filter(
      (s) => s.status === "ยังไม่เช็คชื่อ",
    ).length;
    return { total, present, late, leave, absent, unchecked };
  }, [mergedData]);

  const totalPages = Math.ceil(mergedData.length / rowsPerPage);
  const pageData = mergedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const handleSort = (col: "studentId" | "name" | "classes" | "status") => {
    if (sortBy === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (col: string) => {
    if (sortBy !== col)
      return <ArrowUpDown size={14} className="ml-1 opacity-40" />;
    return sortOrder === "asc" ? (
      <ArrowUp size={14} className="ml-1 text-amber-600" />
    ) : (
      <ArrowDown size={14} className="ml-1 text-amber-600" />
    );
  };

  const handleStatusChange = (studentId: string, newStatus: string) => {
    const att = attendance.find((a) => a.studentId === studentId);
    const student = students.find((s) => s.studentId === studentId);
    if (!student) return;

    setDataUpdate((prev: any[]) => {
      const filtered = prev.filter((item: any) => item.studentId !== studentId);
      if (att && att.status === newStatus) return filtered;
      if (!att && newStatus === "ยังไม่เช็คชื่อ") return filtered;
      return [
        ...filtered,
        {
          studentId,
          name: student.name,
          classes: student.classes,
          status: newStatus,
          isFirstRecord: !att,
        },
      ];
    });
  };

  const handleSubmit = async () => {
    if (dataUpdate.length === 0) return;
    if (!isAdmin && (!reason || reason.trim() === "")) {
      Swal.fire(
        "กรุณาระบุเหตุผล",
        "ครูต้องระบุเหตุผลในการเช็คชื่อย้อนหลัง",
        "warning",
      );
      return;
    }

    const confirmResult = await Swal.fire({
      title: isAdmin ? "ยืนยันบันทึกเช็คชื่อย้อนหลัง?" : "ยืนยันส่งคำขอ?",
      text: isAdmin
        ? `บันทึกการเปลี่ยนแปลง ${dataUpdate.length} รายการ`
        : `ส่งคำขอเช็คชื่อย้อนหลัง ${dataUpdate.length} รายการ ให้ Admin อนุมัติ`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      confirmButtonColor: "#10B981",
      cancelButtonText: "ยกเลิก",
      cancelButtonColor: "#EF4444",
    });
    if (!confirmResult.isConfirmed) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/scanAttendance/retroactive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          changes: dataUpdate,
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          title: "สำเร็จ",
          text: data.message,
          icon: "success",
          timer: 3000,
        });
        setDataUpdate([]);
        setReason("");
        fetchData(selectedDate);
      } else {
        Swal.fire("เกิดข้อผิดพลาด", data.message, "error");
      }
    } catch (error) {
      console.error(error);
      Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกได้", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const dateLabel = selectedDate
    ? new Date(selectedDate).toLocaleDateString("th-TH", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  if (initialLoading) return <SkeletonRetroactiveAttendance />;

  return (
    <main className="max-w-7xl mx-auto p-2 sm:p-4">
      {/* Header Card */}
      <div className="bg-linear-to-r from-amber-500 to-orange-500 rounded-xl p-4 sm:p-6 text-white mb-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <CalendarClock size={28} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                เช็คชื่อย้อนหลัง
              </h1>
              <p className="text-white/80 text-sm">
                {isAdmin
                  ? "Admin: บันทึกทันที"
                  : "ครู: ส่งคำขอให้ Admin อนุมัติ"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
              <input
                type="date"
                value={selectedDate}
                max={today}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setCurrentPage(1);
                  setSearchQuery("");
                }}
                className="bg-transparent text-white outline-none cursor-pointer text-sm scheme-dark"
              />
            </div>
            <button
              className="p-2.5 cursor-pointer bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors rounded-lg"
              onClick={() => fetchData(selectedDate)}
              title="รีเฟรช"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
        {dateLabel && (
          <p className="mt-3 text-white/90 text-sm bg-white/10 rounded-lg px-3 py-1.5 inline-block">
            📅 {dateLabel}
          </p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4">
        {[
          {
            label: "ทั้งหมด",
            val: stats.total,
            icon: Users,
            bg: "bg-slate-50",
            border: "border-slate-200",
            text: "text-slate-700",
          },
          {
            label: "เข้าร่วม",
            val: stats.present,
            icon: UserCheck,
            bg: "bg-emerald-50",
            border: "border-emerald-200",
            text: "text-emerald-700",
          },
          {
            label: "สาย",
            val: stats.late,
            icon: Clock,
            bg: "bg-orange-50",
            border: "border-orange-200",
            text: "text-orange-700",
          },
          {
            label: "ลา",
            val: stats.leave,
            icon: Info,
            bg: "bg-yellow-50",
            border: "border-yellow-200",
            text: "text-yellow-700",
          },
          {
            label: "ขาด",
            val: stats.absent,
            icon: UserX,
            bg: "bg-red-50",
            border: "border-red-200",
            text: "text-red-700",
          },
          {
            label: "ยังไม่เช็ค",
            val: stats.unchecked,
            icon: Clock,
            bg: "bg-gray-50",
            border: "border-gray-200",
            text: "text-gray-500",
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`${card.bg} ${card.border} border rounded-xl p-3 transition-all hover:shadow-sm`}
          >
            <div className="flex items-center gap-2 mb-1">
              <card.icon size={16} className={card.text} />
              <span className="text-xs text-gray-500">{card.label}</span>
            </div>
            <p className={`text-xl sm:text-2xl font-bold ${card.text}`}>
              {card.val}
            </p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end justify-between">
          {/* Search + Filter */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-gray-500 block mb-1">
                ค้นหานักเรียน
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="เลขประจำตัว หรือ ชื่อ..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg outline-none text-sm focus:border-amber-400 transition-colors w-48 sm:w-56"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                ชั้นเรียน
              </label>
              <select
                className="px-3 py-2 border border-gray-200 rounded-lg cursor-pointer text-sm outline-none focus:border-amber-400 transition-colors"
                value={selectClasses}
                onChange={(e) => {
                  setSelectClasses(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {classOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
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
                className="px-3 py-2 border border-gray-200 rounded-lg cursor-pointer text-sm outline-none focus:border-amber-400 transition-colors"
              >
                {[10, 25, 50, 75].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Changed count + Reset */}
          {dataUpdate.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-amber-600 font-medium">
                แก้ไข {dataUpdate.length} รายการ
              </span>
              <button
                onClick={() => setDataUpdate([])}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
              >
                <Undo2 size={14} /> รีเซ็ต
              </button>
            </div>
          )}
        </div>

        {/* Reason (teacher only) */}
        {!isAdmin && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <label className="text-sm text-gray-600 block mb-1">
              เหตุผลในการเช็คชื่อย้อนหลัง{" "}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ระบุเหตุผล เช่น ลืมเช็คชื่อ, ระบบขัดข้อง ฯลฯ"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-400 transition-colors resize-none"
              rows={2}
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <LoaderCircle className="animate-spin text-amber-500" size={40} />
            <p className="text-sm text-gray-400">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-lineat-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                  {[
                    {
                      key: "studentId",
                      label: "เลขประจำตัว",
                      width: "w-[18%]",
                    },
                    { key: "name", label: "ชื่อ-สกุล", width: "" },
                    { key: "classes", label: "ชั้นเรียน", width: "w-[18%]" },
                    { key: "status", label: "สถานะ", width: "w-[22%]" },
                  ].map((col) => (
                    <th
                      key={col.key}
                      className={`px-4 py-3.5 ${col.width} cursor-pointer hover:bg-amber-100/50 transition-colors select-none text-left text-nowrap`}
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
                {pageData.length > 0 ? (
                  pageData.map((row, idx) => {
                    const isModified = dataUpdate.some(
                      (u: any) => u.studentId === row.studentId,
                    );
                    return (
                      <tr
                        key={row.studentId}
                        className={`transition-colors hover:bg-gray-50 ${
                          isModified ? "bg-amber-50/60" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-[#009EA3] font-medium">
                            {row.studentId}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-800 text-nowrap">
                          {row.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-nowrap">
                          <div className="p-2 bg-blue-100 text-blue-500 rounded-md">
                            {row.classes}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${getStatusDot(row.status)} shrink-0`}
                            />
                            <select
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium outline-none cursor-pointer transition-all border ${
                                isModified
                                  ? "border-amber-400 ring-2 ring-amber-100"
                                  : "border-gray-200"
                              } ${getStatusColor(row.status)}`}
                              value={row.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  row.studentId,
                                  e.target.value,
                                )
                              }
                            >
                              {statusOptions.map((opt) => (
                                <option
                                  key={opt.value}
                                  value={opt.value}
                                  className="text-black bg-white"
                                  disabled={
                                    opt.value === "ยังไม่เช็คชื่อ" &&
                                    row.hasAttendance
                                  }
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
                    <td
                      colSpan={4}
                      className="px-4 py-12 text-center text-gray-400"
                    >
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
                        ? "bg-amber-500 text-white font-medium shadow-sm"
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
              {mergedData.length} รายการ
            </span>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={dataUpdate.length === 0 || submitting}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md ${
              isAdmin
                ? "bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                : "bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            }`}
          >
            {submitting ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : isAdmin ? (
              <Save size={18} />
            ) : (
              <Send size={18} />
            )}
            {isAdmin ? "บันทึกเช็คชื่อย้อนหลัง" : "ส่งคำขออนุมัติ"}
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

export default RetroactiveAttendance;
