"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
    ShieldAlert,
    Search,
    RefreshCw,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    Filter,
    History,
    PlusCircle,
    MinusCircle,
    X,
    Save,
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
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedClass, setSelectedClass] = useState("ทั้งหมด");
    const [sortBy, setSortBy] = useState<"studentId" | "name" | "behaviorScore">("studentId");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);

    // Models State
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [adjustmentform, setAdjustmentForm] = useState({ score: 0, reason: "" });
    const [historyData, setHistoryData] = useState<BehaviorHistory[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Classes list
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
        if (sortBy !== column) return <ArrowUpDown size={14} className="ml-1 text-slate-400" />;
        return sortOrder === "asc"
            ? <ArrowUp size={14} className="ml-1 text-blue-600" />
            : <ArrowDown size={14} className="ml-1 text-blue-600" />;
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
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(adjustmentform),
            });

            const data = await res.json();
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'บันทึกสำเร็จ',
                    text: 'คะแนนความประพฤติถูกอัปเดตแล้ว',
                    timer: 1500,
                });
                setShowAdjustModal(false);
                fetchStudents(); // Refresh list
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาด',
                    text: data.message,
                });
            }
        } catch (error) {
            console.error("Error submitting adjustment:", error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
            });
        }
    };


    const processedStudents = useMemo(() => {
        let result = students;

        // Filter by search term
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(
                (s) =>
                    s.name.toLowerCase().includes(lowerTerm) ||
                    s.studentId.includes(lowerTerm)
            );
        }

        // Filter by class
        if (selectedClass !== "ทั้งหมด") {
            result = result.filter((s) => s.classes === selectedClass);
        }

        // Sort
        return [...result].sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];

            if (typeof aValue === "number" && typeof bValue === "number") {
                return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
            }

            const strA = String(aValue);
            const strB = String(bValue);

            return sortOrder === "asc"
                ? strA.localeCompare(strB, "th")
                : strB.localeCompare(strA, "th");
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

    return (
        <div className="p-4 md:p-6 min-h-screen max-w-7xl mx-auto">
            <div className="bg-blue-50 rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 bg-blue-50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-200">
                                <ShieldAlert className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">คะแนนความประพฤติ</h1>
                                <p className="text-sm text-slate-500">ตรวจสอบและจัดการคะแนนพฤติกรรมนักเรียน</p>
                            </div>
                        </div>

                        <button
                            onClick={fetchStudents}
                            className="p-2 hover:bg-white rounded-lg transition-colors text-slate-600 hover:text-blue-600 border border-transparent hover:border-slate-200"
                            title="รีเฟรชข้อมูล"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="mt-6 flex flex-col md:flex-row gap-4 items-end">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อ หรือ รหัสนักเรียน..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative w-full md:w-64">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-white cursor-pointer transition-all"
                            >
                                {classesList.map((cls) => (
                                    <option key={cls} value={cls}>{cls}</option>
                                ))}
                            </select>
                        </div>
                        <div className="relative w-full md:w-32">
                            <select
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none bg-white cursor-pointer transition-all text-sm"
                            >
                                <option value={10}>10 แถว</option>
                                <option value={20}>20 แถว</option>
                                <option value={50}>50 แถว</option>
                                <option value={100}>100 แถว</option>
                                <option value={students.length}>ทั้งหมด</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto w-[80%] mx-auto rounded-2xl shadow-lg px-2 border border-slate-100">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-center">
                                <th
                                    onClick={() => handleSort("studentId")}
                                    className="px-6 py-4 text-left text-sm font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors w-[150px]"
                                >
                                    <div className="flex items-center gap-2">
                                        รหัสนักเรียน
                                        {getSortIcon("studentId")}
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort("name")}
                                    className="px-6 py-4 text-left text-sm font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        ชื่อ-นามสกุล
                                        {getSortIcon("name")}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 w-[150px]">
                                    ชั้นเรียน
                                </th>
                                <th
                                    onClick={() => handleSort("behaviorScore")}
                                    className="px-6 py-4 text-center text-sm font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors w-[150px]"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        คะแนน
                                        {getSortIcon("behaviorScore")}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-600 w-[120px]">
                                    จัดการ
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedStudents.length > 0 ? (
                                paginatedStudents.map((student) => (
                                    <tr key={student.studentId} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-slate-700 font-mono">
                                            {student.studentId}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 font-medium">
                                            {student.name}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-medium">
                                                {student.classes}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center min-w-[3rem] px-2.5 py-1 rounded-full text-sm font-bold ${Number(student.behaviorScore) < 50
                                                ? "bg-red-100 text-red-600"
                                                : Number(student.behaviorScore) < 80
                                                    ? "bg-amber-100 text-amber-600"
                                                    : "bg-emerald-100 text-emerald-600"
                                                }`}>
                                                {student.behaviorScore}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openAdjustModal(student)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="ปรับคะแนน"
                                                >
                                                    <PlusCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => openHistoryModal(student)}
                                                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="ดูประวัติ"
                                                >
                                                    <History size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
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

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p>
                        แสดง {paginatedStudents.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} ถึง {Math.min(currentPage * itemsPerPage, processedStudents.length)} จากทั้งหมด {processedStudents.length} รายการ
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            ก่อนหน้า
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum = i + 1;
                                if (totalPages > 5) {
                                    if (currentPage > 3) pageNum = currentPage - 2 + i;
                                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                }
                                if (pageNum <= 0) return null;

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-medium transition-colors ${currentPage === pageNum
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                            : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-600"
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            ถัดไป
                        </button>
                    </div>
                </div>
            </div>

            {/* Adjust Score Modal */}
            {showAdjustModal && selectedStudent && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">ปรับคะแนนความประพฤติ</h3>
                            <button
                                onClick={() => setShowAdjustModal(false)}
                                className="p-1 rounded-full hover:bg-slate-200 transition-colors"
                            >
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                    {selectedStudent.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">{selectedStudent.name}</p>
                                    <p className="text-xs text-slate-500">รหัส: {selectedStudent.studentId} | ชั้น: {selectedStudent.classes}</p>
                                </div>
                                <div className="ml-auto text-right">
                                    <p className="text-xs text-slate-400">คะแนนปัจจุบัน</p>
                                    <p className="font-bold text-blue-600 text-lg">{selectedStudent.behaviorScore}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">คะแนนที่ต้องการเพิ่ม/ลด</label>
                                <p className="text-xs text-slate-400 mb-2">* ใส่เครื่องหมายลบ (-) เพื่อหักคะแนน</p>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="เช่น -5 หรือ 10"
                                    value={adjustmentform.score}
                                    onChange={(e) => setAdjustmentForm({ ...adjustmentform, score: Number(e.target.value) })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">สาเหตุ/หมายเหตุ</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                                    placeholder="ระบุสาเหตุการปรับคะแนน..."
                                    value={adjustmentform.reason}
                                    onChange={(e) => setAdjustmentForm({ ...adjustmentform, reason: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAdjustModal(false)}
                                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-200 transition-colors flex items-center gap-2"
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
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h3 className="font-bold text-lg text-slate-800">ประวัติการปรับคะแนน</h3>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="p-1 rounded-full hover:bg-slate-200 transition-colors"
                            >
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xl">
                                    {selectedStudent.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-xl text-slate-800">{selectedStudent.name}</h4>
                                    <p className="text-slate-500">รหัส: {selectedStudent.studentId}</p>
                                </div>
                            </div>

                            {loadingHistory ? (
                                <div className="flex justify-center py-10">
                                    <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                                </div>
                            ) : historyData.length > 0 ? (
                                <div className="space-y-4">
                                    {historyData.map((item) => (
                                        <div key={item.ID} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${item.SCORE > 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                                                }`}>
                                                {item.SCORE > 0 ? <PlusCircle size={24} /> : <MinusCircle size={24} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="font-semibold text-slate-800">{item.REASON}</p>
                                                    <span className={`font-bold ${item.SCORE > 0 ? "text-emerald-600" : "text-red-600"
                                                        }`}>
                                                        {item.SCORE > 0 ? "+" : ""}{item.SCORE}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
                                                    <span>โดย: {item.TEACHER_ID}</span>
                                                    <span>{new Date(item.CREATED_AT).toLocaleString('th-TH')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-slate-400">
                                    <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>ไม่พบประวัติการปรับคะแนน</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BehaviorScore;
