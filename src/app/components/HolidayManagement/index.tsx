"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  CalendarOff,
  LoaderCircle,
  Filter,
} from "lucide-react";
import Swal from "sweetalert2";

interface Holiday {
  date: string;
  name: string;
  type: "regular" | "auto_present";
  status?: string;
}

const typeOptions = [
  {
    value: "regular",
    label: "วันหยุด (ไม่เช็คชื่อ)",
    color: "bg-amber-100 text-amber-700",
    icon: CalendarOff,
  },
  {
    value: "auto_present",
    label: "เช็คชื่อมาอัตโนมัติ",
    color: "bg-emerald-100 text-emerald-700",
    icon: PartyPopper,
  },
];

function HolidayManagement() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "regular" | "auto_present"
  >("all");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [form, setForm] = useState<Holiday>({
    date: "",
    name: "",
    type: "regular",
    status: "",
  });
  const [saving, setSaving] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  function getColorStatus(type: string) {
    switch (type) {
      case "อนุมัติแล้ว":
        return "bg-emerald-100 text-emerald-500";
      case "กำลังดำเนินการ":
        return "bg-amber-100 text-amber-500";
      case "ปฏิเสธ":
        return "bg-red-100 text-red-500";
    }
  }
  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/holidays/manage");
      const data = await res.json();
      if (data.success) {
        setHolidays(data.holidays || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  // Filtered + searched
  const filtered = useMemo(() => {
    let result = holidays;
    if (filterType !== "all") {
      result = result.filter((h) => h.type === filterType);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (h) => h.name.toLowerCase().includes(term) || h.date.includes(term),
      );
    }
    return result;
  }, [holidays, filterType, searchTerm]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  // Stats
  const regularCount = holidays.filter((h) => h.type === "regular").length;
  const autoCount = holidays.filter((h) => h.type === "auto_present").length;

  // Handlers
  const openAdd = () => {
    setEditingDate(null);
    setForm({ date: "", name: "", type: "regular", status: "" });
    setShowModal(true);
  };

  const openEdit = (h: Holiday) => {
    setEditingDate(h.date);
    setForm({ ...h, status: h.status || "" });
    setShowModal(true);
  };

  const handleDelete = async (date: string, name: string) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบ",
      html: `ต้องการลบ <strong>${name}</strong> (${date}) ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/holidays/manage?date=${date}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "ลบสำเร็จ",
          timer: 1200,
          showConfirmButton: false,
        });
        fetchHolidays();
      } else {
        Swal.fire("เกิดข้อผิดพลาด", data.message, "error");
      }
    } catch {
      Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถลบได้", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const isEdit = editingDate !== null;
      const body = isEdit ? { originalDate: editingDate, ...form } : form;

      const res = await fetch("/api/holidays/manage", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: data.message,
          timer: 1200,
          showConfirmButton: false,
        });
        setShowModal(false);
        fetchHolidays();
      } else {
        Swal.fire("เกิดข้อผิดพลาด", data.message, "error");
      }
    } catch {
      Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกได้", "error");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("th-TH", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Ellipsis pagination
  const getPageNumbers = () => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | string)[] = [1];
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  // Skeleton loading
  if (initialLoading) {
    return (
      <main className="max-w-7xl mx-auto p-2 sm:p-4">
        <div className="bg-gray-300 rounded-xl p-4 sm:p-6 mb-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-white/20" />
            <div>
              <div className="h-6 w-48 bg-white/20 rounded mb-2" />
              <div className="h-4 w-64 bg-white/20 rounded" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-3 animate-pulse border border-gray-100"
            >
              <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
              <div className="h-7 w-10 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="px-4 py-3 border-b border-gray-50 flex gap-4 animate-pulse"
            >
              <div className="h-4 w-[20%] bg-gray-200 rounded" />
              <div className="h-4 w-[35%] bg-gray-200 rounded" />
              <div className="h-4 w-[20%] bg-gray-200 rounded" />
              <div className="h-4 w-[15%] bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-2 sm:p-4">
      {/* Header */}
      <div className="bg-[#7C3AED] rounded-xl p-4 sm:p-6 text-white mb-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <CalendarDays size={28} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">จัดการวันหยุด</h1>
              <p className="text-white/80 text-sm">
                เพิ่ม แก้ไข หรือลบวันหยุดและวันกิจกรรม
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openAdd}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg px-3 py-2.5 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Plus size={18} />
              เพิ่มวันหยุด
            </button>
            <button
              onClick={fetchHolidays}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg p-2.5 transition-colors"
              title="รีเฟรช"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
        {[
          {
            label: "ทั้งหมด",
            value: holidays.length,
            color: "text-violet-600",
            bg: "bg-violet-50",
            icon: CalendarDays,
          },
          {
            label: "วันหยุด",
            value: regularCount,
            color: "text-amber-600",
            bg: "bg-amber-50",
            icon: CalendarOff,
          },
          {
            label: "เช็คอัตโนมัติ",
            value: autoCount,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            icon: PartyPopper,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-1">
              <stat.icon size={16} className={stat.color} />
              <span className="text-xs text-gray-500">{stat.label}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">ค้นหา</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="ชื่อวันหยุด หรือ วันที่..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 text-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">ประเภท</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 text-sm bg-white cursor-pointer appearance-none pr-8"
            >
              <option value="all">ทั้งหมด</option>
              <option value="regular">วันหยุด</option>
              <option value="auto_present">เช็คอัตโนมัติ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-auto w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100">
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-600 text-nowrap">
                  วันที่
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-600 text-nowrap">
                  ชื่อวันหยุด
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-600 text-nowrap">
                  ประเภท
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-600 text-nowrap">
                  สถานะเช็ค
                </th>
                <th className="px-4 py-3.5 text-center text-sm font-semibold text-slate-600 w-[100px] text-nowrap">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? (
                paginated.map((h) => {
                  const typeInfo =
                    typeOptions.find((t) => t.value === h.type) ||
                    typeOptions[0];
                  return (
                    <tr
                      key={h.date}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-nowrap">
                        <div>
                          <span className="font-mono text-violet-600 font-medium">
                            {h.date}
                          </span>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatDate(h.date)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-800">{h.name}</td>
                      <td className="px-4 py-3 text-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}
                        >
                          <typeInfo.icon size={12} />
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-nowrap">
                        {h.type === "auto_present" ? (
                          <span className="text-emerald-600 font-medium">
                            {h.status || "เข้าร่วมกิจกรรม"}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEdit(h)}
                            className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                            title="แก้ไข"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(h.date, h.name)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="ลบ"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>ไม่พบข้อมูลวันหยุด</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-100 px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-gray-500">
              แสดง {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, filtered.length)} จาก{" "}
              {filtered.length} รายการ
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {getPageNumbers().map((page, idx) =>
                typeof page === "string" ? (
                  <span
                    key={`e-${idx}`}
                    className="w-8 text-center text-gray-400 text-sm"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "bg-violet-600 text-white shadow-sm"
                        : "border border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">
                {editingDate ? "แก้ไขวันหยุด" : "เพิ่มวันหยุดใหม่"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อวันหยุด
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น วันตรุษจีน, กิจกรรมกีฬาสี"
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ประเภท
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {typeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setForm({ ...form, type: opt.value as any })
                      }
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 text-center ${
                        form.type === opt.value
                          ? "border-violet-500 bg-violet-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <opt.icon
                        size={20}
                        className={
                          form.type === opt.value
                            ? "text-violet-600"
                            : "text-gray-400"
                        }
                      />
                      <span
                        className={`text-xs font-medium ${form.type === opt.value ? "text-violet-700" : "text-gray-500"}`}
                      >
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {form.type === "auto_present" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    สถานะที่จะเช็ค
                  </label>
                  <select
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                  >
                    <option value="">เลือกสถานะ</option>
                    <option value="เข้าร่วมกิจกรรม">เข้าร่วมกิจกรรม</option>
                    <option value="เรียนออนไลน์">เรียนออนไลน์</option>
                  </select>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-medium shadow-lg shadow-violet-200 transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  {editingDate ? "บันทึก" : "เพิ่ม"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default HolidayManagement;
