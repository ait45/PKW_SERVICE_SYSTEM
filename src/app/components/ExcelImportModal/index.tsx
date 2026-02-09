"use client";

import React, { useState, useRef } from "react";
import { X, Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Swal from "sweetalert2";

interface ImportResult {
    success: number;
    failed: number;
    errors: Array<{ row: number; studentId?: string; teacherId?: string; error: string }>;
}

interface ExcelImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    importType: "student" | "teacher";
    onSuccess?: () => void;
}

export default function ExcelImportModal({
    isOpen,
    onClose,
    importType,
    onSuccess,
}: ExcelImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Validate file type
            const allowedTypes = [
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-excel",
            ];
            if (!allowedTypes.includes(selectedFile.type)) {
                Swal.fire({
                    icon: "error",
                    title: "ไฟล์ไม่ถูกต้อง",
                    text: "กรุณาอัปโหลดไฟล์ Excel (.xlsx หรือ .xls) เท่านั้น",
                    width: "60%",
                });
                return;
            }
            setFile(selectedFile);
            setResult(null);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            const allowedTypes = [
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-excel",
            ];
            if (!allowedTypes.includes(droppedFile.type)) {
                Swal.fire({
                    icon: "error",
                    title: "ไฟล์ไม่ถูกต้อง",
                    text: "กรุณาอัปโหลดไฟล์ Excel (.xlsx หรือ .xls) เท่านั้น",
                    width: "60%",
                });
                return;
            }
            setFile(droppedFile);
            setResult(null);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleImport = async () => {
        if (!file) return;

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const endpoint =
                importType === "student"
                    ? "/api/studentManagement/import"
                    : "/api/teacherManagement/import";

            const response = await fetch(endpoint, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setResult(data.result);
                if (data.result.success > 0 && onSuccess) {
                    onSuccess();
                }
                Swal.fire({
                    icon: data.result.failed > 0 ? "warning" : "success",
                    title: "นำเข้าข้อมูลเสร็จสิ้น",
                    text: data.message,
                    width: "60%",
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "เกิดข้อผิดพลาด",
                    text: data.message,
                    width: "60%",
                });
            }
        } catch (error) {
            console.error("Import error:", error);
            Swal.fire({
                icon: "error",
                title: "เกิดข้อผิดพลาด",
                text: "ไม่สามารถนำเข้าข้อมูลได้ กรุณาลองใหม่",
                width: "60%",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setResult(null);
        onClose();
    };

    if (!isOpen) return null;

    const title = importType === "student" ? "นำเข้าข้อมูลนักเรียน" : "นำเข้าข้อมูลครู";
    const columns =
        importType === "student"
            ? "รหัสนักเรียน, ชื่อ-นามสกุล, ห้อง, เลขที่, เบอร์โทร, เบอร์ผู้ปกครอง"
            : "รหัสครู, ชื่อ-นามสกุล, แผนก, วิชา, กลุ่มสาระ, เบอร์โทร";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <FileSpreadsheet size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{title}</h2>
                            <p className="text-sm text-white/80">อัปโหลดไฟล์ Excel (.xlsx, .xls)</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {/* Instructions */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="flex items-start gap-2">
                            <AlertCircle size={20} className="text-blue-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm text-blue-700 font-medium">รูปแบบคอลัมน์ที่รองรับ:</p>
                                <p className="text-sm text-blue-600 mt-1">{columns}</p>
                            </div>
                        </div>
                    </div>

                    {/* Drop zone */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${file
                                ? "border-emerald-400 bg-emerald-50"
                                : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        {file ? (
                            <div className="flex flex-col items-center">
                                <FileSpreadsheet size={48} className="text-emerald-500 mb-3" />
                                <p className="font-medium text-gray-800">{file.name}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {(file.size / 1024).toFixed(2)} KB
                                </p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                        setResult(null);
                                    }}
                                    className="mt-3 text-sm text-red-500 hover:text-red-600"
                                >
                                    ลบไฟล์
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <Upload size={48} className="text-gray-400 mb-3" />
                                <p className="font-medium text-gray-600">ลากและวางไฟล์ที่นี่</p>
                                <p className="text-sm text-gray-400 mt-1">หรือคลิกเพื่อเลือกไฟล์</p>
                            </div>
                        )}
                    </div>

                    {/* Result summary */}
                    {result && (
                        <div className="mt-6 space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1 p-4 bg-green-50 rounded-xl border border-green-200">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle size={20} className="text-green-500" />
                                        <span className="text-green-700 font-medium">สำเร็จ</span>
                                    </div>
                                    <p className="text-2xl font-bold text-green-600 mt-1">{result.success}</p>
                                </div>
                                <div className="flex-1 p-4 bg-red-50 rounded-xl border border-red-200">
                                    <div className="flex items-center gap-2">
                                        <XCircle size={20} className="text-red-500" />
                                        <span className="text-red-700 font-medium">ล้มเหลว</span>
                                    </div>
                                    <p className="text-2xl font-bold text-red-600 mt-1">{result.failed}</p>
                                </div>
                            </div>

                            {/* Error details */}
                            {result.errors.length > 0 && (
                                <div className="p-4 bg-red-50 rounded-xl border border-red-200 max-h-40 overflow-y-auto">
                                    <p className="text-sm font-medium text-red-700 mb-2">รายละเอียดข้อผิดพลาด:</p>
                                    <ul className="text-sm text-red-600 space-y-1">
                                        {result.errors.map((err, idx) => (
                                            <li key={idx}>
                                                แถว {err.row}: {err.error}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        ปิด
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={!file || loading}
                        className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                กำลังนำเข้า...
                            </>
                        ) : (
                            <>
                                <Upload size={18} />
                                นำเข้าข้อมูล
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
