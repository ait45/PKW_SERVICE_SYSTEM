"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  ShieldAlert,
  Search,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  History,
  PlusCircle,
  MinusCircle,
  X,
  Save,
  Users,
  Award,
  AlertTriangle,
  ShieldX,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
} from "lucide-react";
import Swal from "sweetalert2";

interface Student {
  studentId: string;
  name: string;
  classes: string;
  behaviorScore: number;
}

interface BehaviorHistory {
  ID: number;
  SCORE: number;
  REASON: string;
  TEACHER_ID: string;
  CREATED_AT: string;
}

function BehaviorScore() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("ทั้งหมด");
  const [sortBy, setSortBy] = useState<"studentId" | "name" | "behaviorScore">("studentId");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [adjustmentform, setAdjustmentForm] = useState({ score: 0, reason: "" });
  const [historyData, setHistoryData] = useState<BehaviorHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const classesList = [
    "ทั้งหมด",
    "มัธยมศึกษาปีที่ 1",
    "มัธยมศึกษาปีที่ 2",
    "มัธยมศึกษาปีที่ 3",
    "มัธยมศึกษาปีที่ 4",
    "มัธยมศึกษาปีที่ 5",
    "มัธยมศึกษาปีที่ 6",
  ];

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/studentManagement");
      const data = await res.json();
      if (data.success) {
        setStudents(data.payload);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const fetchHistory = async (studentId: string) => {
    try {
      setLoadingHistory(true);
      const res = await fetch(`/api/studentManagement/${studentId}/behaviorScore`);
      const data = await res.json();
      if (data.success) {
        setHistoryData(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSort = (column: "studentId" | "name" | "behaviorScore") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown size={14} className="text-gray-400" />;
    return sortOrder === "asc"
      ? <ArrowUp size={14} className="text-indigo-600" />
      : <ArrowDown size={14} className="text-indigo-600" />;
  };

  const openAdjustModal = (student: Student) => {
    setSelectedStudent(student);
    setAdjustmentForm({ score: 0, reason: "" });
    setShowAdjustModal(true);
  };

  const openHistoryModal = (student: Student) => {
    setSelectedStudent(student);
    fetchHistory(student.studentId);
    setShowHistoryModal(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      const res = await fetch(`/api/studentManagement/${selectedStudent.studentId}/behaviorScore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adjustmentform),
      });

      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "บันทึกสำเร็จ",
          text: "คะแนนความประพฤติถูกอัปเดตแล้ว",
          timer: 1500,
        });
        setShowAdjustModal(false);
        fetchStudents();
      } else {
        Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: data.message });
      }
    } catch (error) {
      console.error("Error submitting adjustment:", error);
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้" });
    }
  };

  const processedStudents = useMemo(() => {
    let result = students;

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (s) => `${s.name ?? ""}`.toLowerCase().includes(lowerTerm) || `${s.studentId ?? ""}`.includes(lowerTerm)
      );
    }

    if (selectedClass !== "ทั้งหมด") {
      result = result.filter((s) => s.classes === selectedClass);
    }

    return [...result].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }
      const strA = String(aValue);
      const strB = String(bValue);
      return sortOrder === "asc" ? strA.localeCompare(strB, "th") : strB.localeCompare(strA, "th");
    });
  }, [students, searchTerm, selectedClass, sortBy, sortOrder]);

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [processedStudents, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(processedStudents.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClass, itemsPerPage]);

  // Stats
  const totalStudents = processedStudents.length;
  const excellentCount = processedStudents.filter((s) => Number(s.behaviorScore) >= 80).length;
  const warningCount = processedStudents.filter((s) => Number(s.behaviorScore) >= 50 && Number(s.behaviorScore) < 80).length;
  const criticalCount = processedStudents.filter((s) => Number(s.behaviorScore) < 50).length;

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
    if (score >= 50) return { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 ring-amber-200" };
    return { dot: "bg-red-500", badge: "bg-red-50 text-red-700 ring-red-200" };
  };

  // Ellipsis pagination
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | string)[] = [1];
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  // Skeleton
  if (initialLoading) {
    return (
      <main className="max-w-7xl mx-auto p-2 sm:p-4">
        <div className="bg-gray-300 rounded-xl p-4 sm:p-6 mb-4 animate-pulse">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-white/20" />
              <div>
                <div className="h-6 w-48 bg-white/20 rounded mb-2" />
                <div className="h-4 w-64 bg-white/20 rounded" />
              </div>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-3 animate-pulse">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 bg-gray-200 rounded" />
                <div className="h-3 w-14 bg-gray-200 rounded" />
              </div>
              <div className="h-7 w-10 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 animate-pulse">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="h-9 w-56 bg-gray-100 rounded-lg flex-1" />
            <div className="h-9 w-40 bg-gray-100 rounded-lg" />
            <div className="h-9 w-20 bg-gray-100 rounded-lg" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-4 py-3.5 flex gap-4">
            {[18, 30, 18, 15, 12].map((w, i) => (
              <div key={i} className={`h-4 bg-gray-200 rounded animate-pulse`} style={{ width: `${w}%` }} />
            ))}
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-gray-50 flex gap-4 items-center animate-pulse">
              <div className="h-4 w-[18%] bg-gray-200 rounded" />
              <div className="h-4 w-[30%] bg-gray-200 rounded" />
              <div className="h-4 w-[18%] bg-gray-200 rounded" />
              <div className="h-6 w-[15%] bg-gray-200 rounded-full" />
              <div className="h-4 w-[12%] bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-2 sm:p-4">
      {/* Header */}
      <div className="bg-[#4F46E5] rounded-xl p-4 sm:p-6 text-white mb-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">คะแนนความประพฤติ</h1>
              <p className="text-white/80 text-sm">ตรวจสอบและจัดการคะแนนพฤติกรรมนักเรียน</p>
            </div>
          </div>
          <button
            onClick={fetchStudents}
            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg p-2.5 transition-colors"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
        {[
          { label: "ทั้งหมด", value: totalStudents, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "ดีเยี่ยม ≥80", value: excellentCount, icon: Award, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "เฝ้าระวัง 50-79", value: warningCount, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "วิกฤต <50", value: criticalCount, icon: ShieldX, color: "text-red-600", bg: "bg-red-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon size={16} className={stat.color} />
              <span className="text-xs text-gray-500 text-nowrap">{stat.label}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">ค้นหานักเรียน</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="รหัส หรือ ชื่อ..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">ชั้นเรียน</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-sm bg-white cursor-pointer appearance-none pr-8"
            >
              {classesList.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">แถว</label>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-sm bg-white cursor-pointer appearance-none pr-8"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  { key: "studentId" as const, label: "รหัสนักเรียน", width: "w-[18%]" },
                  { key: "name" as const, label: "ชื่อ-นามสกุล", width: "flex-1" },
                  { key: null, label: "ชั้นเรียน", width: "w-[16%]" },
                  { key: "behaviorScore" as const, label: "คะแนน", width: "w-[14%]" },
                  { key: null, label: "จัดการ", width: "w-[12%]" },
                ].map((col, idx) => (
                  <th
                    key={idx}
                    className={`px-4 py-3.5 ${col.width} ${col.key ? "cursor-pointer hover:bg-gray-100/50" : ""} transition-colors select-none text-left text-nowrap`}
                    onClick={() => col.key && handleSort(col.key)}
                  >
                    <div className={`flex items-center text-gray-600 font-semibold text-sm ${idx === 4 ? "justify-center" : ""}`}>
                      {col.label}
                      {col.key && <span className="ml-1">{getSortIcon(col.key)}</span>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((student) => {
                  const scoreStyle = getScoreBadge(Number(student.behaviorScore));
                  return (
                    <tr key={student.studentId} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-indigo-600 font-medium">{student.studentId}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-800 text-nowrap">{student.name}</td>
                      <td className="px-4 py-3 text-nowrap">
                        <div className="p-1 bg-blue-100 text-blue-500 rounded-md text-center text-sm">
                          {student.classes}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${scoreStyle.dot} shrink-0`} />
                          <span className={`inline-flex items-center justify-center min-w-10 px-2 py-0.5 rounded-full text-sm font-bold ring-1 ${scoreStyle.badge}`}>
                            {student.behaviorScore}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openAdjustModal(student)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="ปรับคะแนน"
                          >
                            <PlusCircle size={18} />
                          </button>
                          <button
                            onClick={() => openHistoryModal(student)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="ดูประวัติ"
                          >
                            <History size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 opacity-50" />
                      <p>ไม่พบข้อมูลนักเรียน</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-gray-100 px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-500">
            แสดง {paginatedStudents.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, processedStudents.length)} จาก {processedStudents.length} รายการ
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {getPageNumbers().map((page, idx) =>
              typeof page === "string" ? (
                <span key={`ellipsis-${idx}`} className="w-8 text-center text-gray-400 text-sm">…</span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "border border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Adjust Score Modal */}
      {showAdjustModal && selectedStudent && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">ปรับคะแนนความประพฤติ</h3>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{selectedStudent.name}</p>
                  <p className="text-xs text-gray-500">รหัส: {selectedStudent.studentId} | ชั้น: {selectedStudent.classes}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-gray-400">คะแนนปัจจุบัน</p>
                  <p className="font-bold text-indigo-600 text-lg">{selectedStudent.behaviorScore}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">คะแนนที่ต้องการเพิ่ม/ลด</label>
                <p className="text-xs text-gray-400 mb-2">* ใส่เครื่องหมายลบ (-) เพื่อหักคะแนน</p>
                <input
                  type="number"
                  required
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="เช่น -5 หรือ 10"
                  value={adjustmentform.score}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentform, score: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">สาเหตุ/หมายเหตุ</label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                  placeholder="ระบุสาเหตุการปรับคะแนน..."
                  value={adjustmentform.reason}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentform, reason: e.target.value })}
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-200 transition-colors flex items-center gap-2"
                >
                  <Save size={18} />
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
              <h3 className="font-bold text-lg text-gray-800">ประวัติการปรับคะแนน</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-lg text-gray-800">{selectedStudent.name}</h4>
                  <p className="text-gray-500 text-sm">รหัส: {selectedStudent.studentId}</p>
                </div>
              </div>

              {loadingHistory ? (
                <div className="flex justify-center py-10">
                  <LoaderCircle className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              ) : historyData.length > 0 ? (
                <div className="space-y-3">
                  {historyData.map((item) => (
                    <div key={item.ID} className="flex gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        item.SCORE > 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                      }`}>
                        {item.SCORE > 0 ? <PlusCircle size={20} /> : <MinusCircle size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <p className="font-semibold text-gray-800 text-sm truncate">{item.REASON}</p>
                          <span className={`font-bold text-sm shrink-0 ${item.SCORE > 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {item.SCORE > 0 ? "+" : ""}{item.SCORE}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                          <span>โดย: {item.TEACHER_ID}</span>
                          <span>{new Date(item.CREATED_AT).toLocaleString("th-TH")}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>ไม่พบประวัติการปรับคะแนน</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default BehaviorScore;
