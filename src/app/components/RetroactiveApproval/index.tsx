"use client";
import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  User,
  Inbox,
} from "lucide-react";
import Swal from "sweetalert2";
import { SkeletonRetroactiveApproval } from "../Skeleton";

interface ChangeItem {
  studentId: string;
  name: string;
  classes: string;
  status: string;
  isNew: boolean;
}

interface RetroactiveRequestData {
  _id: string;
  requestedBy: string;
  requestedByName: string;
  targetDate: string;
  changes: ChangeItem[];
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  rejectReason?: string;
  createdAt: string;
}

const statusConfig = {
  pending: {
    label: "รอดำเนินการ",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    gradient: "from-amber-500 to-orange-500",
    icon: Clock,
  },
  approved: {
    label: "อนุมัติแล้ว",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    gradient: "from-emerald-500 to-green-500",
    icon: CheckCircle2,
  },
  rejected: {
    label: "ปฏิเสธ",
    color: "bg-red-100 text-red-700 border-red-200",
    gradient: "from-red-500 to-rose-500",
    icon: XCircle,
  },
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "เข้าร่วมกิจกรรม":
      return "bg-emerald-100 text-emerald-700";
    case "ลา":
      return "bg-yellow-100 text-yellow-700";
    case "สาย":
      return "bg-orange-100 text-orange-700";
    case "ขาด":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-500";
  }
};

function RetroactiveApproval() {
  const [requests, setRequests] = useState<RetroactiveRequestData[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");

  function getColorStatus(type: string) {
    switch (type) {
      case "รอดำเนินการ":
        return "bg-amber-100 text-amber-500";
      case "อนุมัติแล้ว":
        return "bg-emerald-100 text-emerald-500";
      case "ปฏิเสธ":
        return "bg-red-100 text-red-500";
      default:
        return "bg-blue-100 text-blue-500";
    }
  }
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/scanAttendance/retroactive?pending=true");
      const data = await res.json();
      if (data.success) {
        setRequests(data.payload || []);
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
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter((r) =>
    filter === "all" ? true : r.status === filter,
  );

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  const handleApprove = async (requestId: string) => {
    const confirm = await Swal.fire({
      title: "ยืนยันอนุมัติ?",
      text: "ระบบจะบันทึกเช็คชื่อย้อนหลังและคำนวณคะแนนพฤติกรรมใหม่",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "อนุมัติ",
      confirmButtonColor: "#10B981",
      cancelButtonText: "ยกเลิก",
    });
    if (!confirm.isConfirmed) return;

    setProcessingId(requestId);
    try {
      const res = await fetch("/api/scanAttendance/retroactive/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action: "approve" }),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ title: "อนุมัติสำเร็จ", icon: "success", timer: 2000 });
        fetchRequests();
      } else {
        Swal.fire("เกิดข้อผิดพลาด", data.message, "error");
      }
    } catch (error) {
      Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถอนุมัติได้", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    const result = await Swal.fire({
      title: "ปฏิเสธคำขอ",
      input: "textarea",
      inputLabel: "เหตุผลในการปฏิเสธ",
      inputPlaceholder: "ระบุเหตุผล...",
      inputValidator: (value) => {
        if (!value || value.trim() === "") return "กรุณาระบุเหตุผล";
      },
      showCancelButton: true,
      confirmButtonText: "ปฏิเสธ",
      confirmButtonColor: "#EF4444",
      cancelButtonText: "ยกเลิก",
    });
    if (!result.isConfirmed) return;

    setProcessingId(requestId);
    try {
      const res = await fetch("/api/scanAttendance/retroactive/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action: "reject",
          rejectReason: result.value,
        }),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ title: "ปฏิเสธแล้ว", icon: "info", timer: 2000 });
        fetchRequests();
      } else {
        Swal.fire("เกิดข้อผิดพลาด", data.message, "error");
      }
    } catch (error) {
      Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถปฏิเสธได้", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const filterTabs = [
    {
      key: "pending" as const,
      label: "รอดำเนินการ",
      count: pendingCount,
      color: "bg-amber-500",
    },
    {
      key: "approved" as const,
      label: "อนุมัติแล้ว",
      count: approvedCount,
      color: "bg-emerald-500",
    },
    {
      key: "rejected" as const,
      label: "ปฏิเสธ",
      count: rejectedCount,
      color: "bg-red-500",
    },
    {
      key: "all" as const,
      label: "ทั้งหมด",
      count: requests.length,
      color: "bg-gray-500",
    },
  ];

  if (initialLoading) return <SkeletonRetroactiveApproval />;

  return (
    <main className="max-w-7xl mx-auto p-2 sm:p-4">
      {/* Header */}
      <div className="bg-linear-to-r from-violet-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white mb-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                อนุมัติคำขอเช็คชื่อย้อนหลัง
              </h1>
              <p className="text-white/80 text-sm">
                ตรวจสอบและอนุมัติ/ปฏิเสธคำขอจากครู
              </p>
            </div>
          </div>
          <button
            className="p-2.5 cursor-pointer bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors rounded-lg"
            onClick={fetchRequests}
            title="รีเฟรช"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-3 mt-4">
          {[
            { label: "รอดำเนินการ", count: pendingCount, icon: Clock },
            { label: "อนุมัติแล้ว", count: approvedCount, icon: CheckCircle2 },
            { label: "ปฏิเสธ", count: rejectedCount, icon: XCircle },
          ].map((item) => (
            <div
              key={item.label}
              className={`bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2 `}
            >
              <item.icon size={16} />
              <span className="text-sm">{item.label}</span>
              <span className="bg-white/25 rounded-full px-2 py-0.5 text-xs font-bold">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 mb-4 flex flex-wrap gap-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointe ${filter === tab.key ? getColorStatus(tab.label) : ""}`}
          >
            {tab.label}
            <span
              className={`text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center ${
                filter === tab.key ? "bg-white/25" : "bg-gray-100"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Request List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-16 gap-3">
            <LoaderCircle className="animate-spin text-violet-500" size={40} />
            <p className="text-sm text-gray-400">กำลังโหลดข้อมูล...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-16 gap-3">
            <Inbox size={48} className="text-gray-300" />
            <p className="text-gray-400">
              ไม่มีคำขอ
              {filter !== "all"
                ? ` (${filterTabs.find((t) => t.key === filter)?.label})`
                : ""}
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const statusInfo = statusConfig[req.status];
            const StatusIcon = statusInfo.icon;
            const isExpanded = expandedId === req._id;
            const isProcessing = processingId === req._id;

            return (
              <div
                key={req._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md"
              >
                {/* Status stripe */}
                <div className={`h-1 bg-linear-to-r ${statusInfo.gradient}`} />

                {/* Card Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : req._id)}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${statusInfo.color}`}
                    >
                      <StatusIcon size={13} />
                      {statusInfo.label}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-800 text-sm sm:text-base">
                          {req.requestedByName}
                        </p>
                        <span className="text-gray-400 text-xs">
                          ({req.requestedBy})
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(req.targetDate).toLocaleDateString(
                            "th-TH",
                            {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {req.changes.length} รายการ
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(req.createdAt).toLocaleString("th-TH")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {req.status === "pending" && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(req._id);
                          }}
                          disabled={isProcessing}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 cursor-pointer text-xs font-medium shadow-sm"
                          title="อนุมัติ"
                        >
                          {isProcessing ? (
                            <LoaderCircle size={14} className="animate-spin" />
                          ) : (
                            <Check size={14} />
                          )}
                          <span className="hidden sm:inline">อนุมัติ</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(req._id);
                          }}
                          disabled={isProcessing}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer text-xs font-medium shadow-sm"
                          title="ปฏิเสธ"
                        >
                          <X size={14} />
                          <span className="hidden sm:inline">ปฏิเสธ</span>
                        </button>
                      </div>
                    )}
                    <div className="p-1">
                      {isExpanded ? (
                        <ChevronUp size={18} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 animate-[fadeIn_0.2s_ease-out]">
                    {/* Reason & Review Info */}
                    <div className="px-4 pt-4 pb-3 space-y-2">
                      <div className="flex items-start gap-2 bg-white rounded-lg p-3 border border-gray-100">
                        <FileText
                          size={16}
                          className="text-gray-400 mt-0.5 shrink-0"
                        />
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">เหตุผล</p>
                          <p className="text-sm text-gray-700">{req.reason}</p>
                        </div>
                      </div>

                      {req.status === "rejected" && req.rejectReason && (
                        <div className="flex items-start gap-2 bg-red-50 rounded-lg p-3 border border-red-100">
                          <XCircle
                            size={16}
                            className="text-red-400 mt-0.5 shrink-0"
                          />
                          <div>
                            <p className="text-xs text-red-400 mb-0.5">
                              เหตุผลปฏิเสธ
                            </p>
                            <p className="text-sm text-red-600">
                              {req.rejectReason}
                            </p>
                          </div>
                        </div>
                      )}

                      {req.reviewedByName && (
                        <p className="text-xs text-gray-400 px-1">
                          ดำเนินการโดย:{" "}
                          <span className="font-medium text-gray-500">
                            {req.reviewedByName}
                          </span>
                          {req.reviewedAt &&
                            ` · ${new Date(req.reviewedAt).toLocaleString("th-TH")}`}
                        </p>
                      )}
                    </div>

                    {/* Changes Table */}
                    <div className="px-4 pb-4">
                      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-linear-to-r from-violet-50 to-purple-50 border-b border-violet-100">
                              <th className="px-3 py-2.5 text-left text-gray-600 font-semibold">
                                เลขประจำตัว
                              </th>
                              <th className="px-3 py-2.5 text-left text-gray-600 font-semibold">
                                ชื่อ-สกุล
                              </th>
                              <th className="px-3 py-2.5 text-left text-gray-600 font-semibold">
                                ชั้นเรียน
                              </th>
                              <th className="px-3 py-2.5 text-center text-gray-600 font-semibold">
                                สถานะ
                              </th>
                              <th className="px-3 py-2.5 text-center text-gray-600 font-semibold">
                                ประเภท
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {req.changes.map((change, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-gray-50/50 transition-colors"
                              >
                                <td className="px-3 py-2.5">
                                  <span className="font-mono text-[#009EA3] font-medium text-xs">
                                    {change.studentId}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-gray-800">
                                  {change.name}
                                </td>
                                <td className="px-3 py-2.5 text-gray-600 text-nowrap">
                                  {change.classes}
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                                      change.status,
                                    )}`}
                                  >
                                    {change.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                      change.isNew
                                        ? "bg-blue-50 text-blue-600 border border-blue-200"
                                        : "bg-amber-50 text-amber-600 border border-amber-200"
                                    }`}
                                  >
                                    {change.isNew
                                      ? "เช็คชื่อใหม่"
                                      : "แก้ไขสถานะ"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}

export default RetroactiveApproval;
