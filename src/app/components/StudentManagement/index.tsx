"use client";

import React, { useEffect, useState, useMemo, SyntheticEvent } from "react";
import {
  Plus,
  Phone,
  FileUser,
  UserPlus,
  UserPen,
  Trash2,
  Upload,
  BookOpen,
  X,
  UserRoundPlus,
  FolderOpen,
  RefreshCw,
  FileSpreadsheet,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  IdCardLanyard
} from "lucide-react";
import Swal from "sweetalert2";
import ExcelImportModal from "@/app/components/ExcelImportModal";

interface Student {
  studentId: string | number;
  password: string | number;
  titles: string;
  name: string;
  classes: string;
  phone: string | number;
  parentPhone: string | number;
  number: string | number;
  plantData: string;
  isAdmin: number | boolean;
}
type Mode = 'add' | 'edit';

function StudentManagement({
  session,
  setMenu,
}: {
  session?: any;
  setMenu: any;
}) {
  const Titles_list = [
    "เด็กชาย",
    "เด็กหญิง",
    "นาย",
    "นางสาว",
  ];
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    studentId: "",
    password: "",
    titles: "",
    name: "",
    classes: "",
    phone: "",
    parentPhone: "",
    number: "",
    plantData: "",
    isAdmin: 0,
  });

  const [isOpenModel, setIsOpenModel] = useState<boolean>(false);
  const [isFormUpdate, setIsFormUpdate] = useState<boolean>(false);
  const [idUpdate, setIdUpdate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [statusFetch, setStatusFetch] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  // Sorting states
  const [sortBy, setSortBy] = useState<"studentId" | "name" | "classes">(
    "studentId",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const openModel = () => {
    setIsOpenModel(true);
  };

  const closeModel = () => {
    setIsOpenModel(false);
    setIsFormUpdate(false);
    setTimeout(() => {
      setNewStudent({
        studentId: "",
        password: "",
        titles: "",
        name: "",
        classes: "",
        phone: "",
        parentPhone: "",
        number: "",
        plantData: "",
        isAdmin: 0,
      });
      setErrors({});
    }, 300);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setNewStudent((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // ฟังก์ชั่นเช็คการกรอกข้อมูลต่าง ๆ
  const validateForm = () => {
    const newError: Record<string, string> = {};
    if (!newStudent.studentId) newError.studentId = "กรุณากรอกเลขประจำตัวนักเรียน";
    if (!newStudent.name) newError.name = "กรุณากรอกชื่อ-นามสกุล";
    if (!newStudent.classes) newError.classes = "กรุณาเลือกชั้นเรียน";
    if (newStudent.phone && newStudent.phone.toString().length < 12)
      newError.phone = "กรุณากรอกเบอร์มือถือให้ครบ";
    if (newStudent.parentPhone && newStudent.parentPhone.toString().length < 12)
      newError.parentPhone = "กรุณากรอกเบอร์มือถือให้ครบ";

    return newError;
  };

  // ฟังก์ชั่นเพิ่มข้อมูลนักเรียน
  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    const error = validateForm();
    if (Object.keys(error).length > 0) {
      setErrors(error);
      return;
    }
    setErrors({});
    document.body.classList.add("loading");
    try {
      Swal.fire({
        titleText: `${isFormUpdate ? "ยืนยันการแก้ไขข้อมูล" : "ยืนยันการเพิ่มข้อมูล"
          }`,
        icon: "question",
        width: "60%",
        showConfirmButton: true,
        showCancelButton: true,
        cancelButtonText: "ยกเลิก",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#31C950",
        cancelButtonColor: "#FB2C36",
      }).then(async (result) => {
        if (result.isConfirmed) {
          Swal.fire({
            width: "60%",
            didOpen: () => {
              Swal.showLoading();
            },
          });
          if (isFormUpdate) {
            const req = await fetch(`/api/studentManagement/${idUpdate}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(newStudent),
            });
            const res = await req.json();
            if (res.success) {
              Swal.fire({
                text: "แก้ไขข้อมูลสำเร็จ!",
                icon: "success",
                timer: 2000,
                width: "60%",
              });
              closeModel();
              setNewStudent({
                studentId: "",
                name: "",
                classes: "",
                phone: "",
                parentPhone: "",
                number: "",
                plantData: "",
                isAdmin: 0,
              });
              fetchStudents();
            } else {
              Swal.fire({
                title: "ไม่สามารถแก้ไขข้อมูลได้ในขณะนี้",
                text: "กรุณาลองอีกครั้ง",
                icon: "warning",
                timer: 3000,
                width: "60%",
              });
            }
          } else {
            try {
              const req = await fetch("/api/studentManagement", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newStudent),
              });

              const res = await req.json();
              if (res.success) {
                Swal.fire({
                  text: "เพิ่มข้อมูลสำเร็จ!",
                  icon: "success",
                  timer: 2000,
                  width: "60%",
                });
                setNewStudent({
                  studentId: "",
                  name: "",
                  classes: "",
                  phone: "",
                  parentPhone: "",
                  number: "",
                  isAdmin: 0,
                });
                fetchStudents();
              } else if (req.status === 409) {
                setErrors(res.message);
                Swal.close();
                return;
              } else {
                Swal.fire({
                  title: "ไม่สามารถเพิ่มข้อมูลได้ในขณะนี้",
                  text: "กรุณาลองอีกครั้ง",
                  icon: "warning",
                  timer: 3000,
                  width: "60%",
                });
              }
            } catch (error) {
              Swal.fire({
                title: "เกิดข้อผิดพลาด",
                text: "กรุณาลองใหม่อีกครั้ง",
                icon: "error",
                width: "60%",
              });
              console.log("Error: ", error);
            }
          }
        }
      });
    } catch (error) {
      console.log(error);
      document.body.classList.remove("loading");
    } finally {
      document.body.classList.remove("loading");
    }
  };

  // ฟังก์ชั่นลบข้อมูลนักเรียน
  const handleDelete = async (id: string, name?: string) => {
    Swal.fire({
      title: "ยืนยันการลบข้อมูล",
      text: `ของ ${name}`,
      showCancelButton: true,
      showConfirmButton: true,
      confirmButtonColor: "#31C950",
      confirmButtonText: "ตกลง",
      cancelButtonColor: "#FB2C36",
      cancelButtonText: "ยกเลิก",
      icon: "warning",
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          didOpen: () => {
            Swal.showLoading();
          },
        });

        try {
          const req = await fetch(`/api/studentManagement/${id}`, {
            method: "DELETE",
          });
          const res = await req.json();
          if (res.success) {
            fetchStudents();
            return Swal.fire({
              text: "ลบข้อมูลสำเร็จ",
              timer: 3000,
              icon: "success",
              showConfirmButton: true,
              width: "60%",
            });
          }
          Swal.fire({
            title: "เกิดข้อผิดพลาด",
            text: "กรุณาลองใหม่อีกครั้ง",
            icon: "error",
            timer: 3000,
            width: "60%",
          });
        } catch (error) {
          console.log(error);
        }
      }
    });
  };

  //อัพเดตข้อมูลนักเรียน
  const handleUpdate = async (id: string, _index?: string) => {
    setIsOpenModel(true);
    setIsFormUpdate(true);
    const targetStudent = tableStudent.find((data: any) => String(data.studentId) === String(id));
    if (!targetStudent) return;
    setNewStudent({
      studentId: targetStudent.studentId,
      password: targetStudent.password,
      titles: targetStudent.titles ?? (targetStudent as any).preFace ?? "",
      name: targetStudent.name,
      classes: targetStudent.classes,
      phone: targetStudent.phone,
      parentPhone: targetStudent.parentPhone,
      number: targetStudent.number ?? (targetStudent as any).Number ?? "",
      plantData: targetStudent.plantData,
      isAdmin: targetStudent.isAdmin,
    });
    setIdUpdate(id);
  };
  // Handle sorting
  const handleSort = (column: "studentId" | "name" | "classes") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Get sort icon
  const getSortIcon = (column: string) => {
    if (sortBy !== column)
      return <ArrowUpDown size={14} className="ml-1 text-slate-400" />;
    return sortOrder === "asc" ? (
      <ArrowUp size={14} className="ml-1 text-blue-600" />
    ) : (
      <ArrowDown size={14} className="ml-1 text-blue-600" />
    );
  };

  // ประกาศตัวเก็บข้อมูลของ รายชื่อนักเรียนสำหรับการแก้ไขข้อมูล
  const [tableStudent, setTableStudent] = useState<
    (Student & { _id: string })[]
  >([]);

  // ฟังก์ชัน format เบอร์โทร (xxx-xxx-xxxx)
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10); // 10 หลักจริง
    let result = "";
    if (digits.length > 0) result = digits.slice(0, 3);
    if (digits.length > 3) result += "-" + digits.slice(3, 6);
    if (digits.length > 6) result += "-" + digits.slice(6, 10);
    return result;
  };

  // ดึงข้อมูลจาก api
  const fetchStudents = async () => {
    try {
      setStatusFetch(true);
      const res = await fetch("/api/studentManagement", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        setTableStudent(data.payload);
        setStatusFetch(false);
      }
    } catch (error) {
      console.error(error);
      setStatusFetch(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (isOpenModel) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
  }, [isOpenModel]);

  // แยกข้อมูลของแต่ละชั้น
  const [selectClasses, setSelectClasses] = useState("ทั้งหมด");
  const classesList = [
    { label: "มัธยมศึกษาปีที่ 1", val: 0 },
    { label: "มัธยมศึกษาปีที่ 2", val: 1 },
    { label: "มัธยมศึกษาปีที่ 3", val: 2 },
    { label: "มัธยมศึกษาปีที่ 4", val: 3 },
    { label: "มัธยมศึกษาปีที่ 5", val: 4 },
    { label: "มัธยมศึกษาปีที่ 6", val: 5 },
    { label: "ทั้งหมด", val: 6 },
  ];

  const filteredStudentSelected = useMemo(() => {
    // Filter by class
    const filtered =
      selectClasses === "ทั้งหมด"
        ? tableStudent
        : tableStudent.filter((s: any) => s.classes === selectClasses);

    // Apply sorting
    return [...filtered].sort((a, b) => {
      const aValue = String(a[sortBy] ?? "");
      const bValue = String(b[sortBy] ?? "");
      if (sortOrder === "asc") {
        return aValue.localeCompare(bValue, "th");
      }
      return bValue.localeCompare(aValue, "th");
    });
  }, [tableStudent, selectClasses, sortBy, sortOrder]);

  // Pagination ------------------------------
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [NumberPager, setNumberPager] = useState(1);

  const totalPages = Math.ceil(
    (filteredStudentSelected?.length || 0) / rowsPerPage,
  );

  // slice data ข้อมูลหน้าปัจจุบัน

  const currentData =
    filteredStudentSelected?.slice(
      (NumberPager - 1) * rowsPerPage,
      NumberPager * rowsPerPage,
    ) || [];

  const handleRowChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setRowsPerPage(Number(e.target.value));
    setNumberPager(1);
  };

  return (
    // หน้าจัดการนักเรียน
    <div className="p-4">
      <div className="flex items-center mb-3">
        <div className="bg-blue-500 mr-3 p-2 rounded-md text-white">
          <FileUser />
        </div>
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-800">
            จัดการข้อมูลนักเรียน
          </h2>
          <p className="text-xs text-slate-600">
            เพิ่ม แก้ไข ลบ ข้อมูลนักเรียน
          </p>
        </div>
      </div>
      {/* ฟอร์มเพิ่มนักเรียน */}
      <button
        onClick={() => {
          setIsFormUpdate(false);
          openModel();
        }}
        className="bg-blue-500 hover:bg-blue-700 text-white  px-3 py-2 rounded-lg shadow-lg transition-colors flex items-center"
      >
        <UserRoundPlus size={20} className="mr-2" />
        เพิ่มข้อมูลนักเรียน
      </button>

      {/* Modal Overlay */}
      {isOpenModel && (
        <div className="fixed inset-0 flex items-center justify-center z-100 p-4">
          <div
            onClick={closeModel}
            className="fixed inset-0 bg-slate-50 h-full backdrop-blur"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
          />
          <div className="w-[92%] md:w-140 max-h-[90vh] bg-white shadow-2xl rounded-2xl overflow-y-auto hide-scrollbar relative z-10">

            {/* Modal Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 ${isFormUpdate ? "border-l-4 border-l-amber-400" : "border-l-4 border-l-blue-500"}`}>
              <div className="flex items-center gap-3">
                <div className={`${isFormUpdate ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"} p-2.5 rounded-xl`}>
                  {isFormUpdate ? <UserPen size={20} /> : <UserPlus size={20} />}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">
                    {isFormUpdate ? "แก้ไขข้อมูลนักเรียน" : "เพิ่มนักเรียนใหม่"}
                  </h1>
                  <p className="text-xs text-gray-400">
                    {isFormUpdate ? "แก้ไขข้อมูลนักเรียนในระบบ" : "กรอกข้อมูลให้ครบถ้วนเพื่อบันทึก"}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModel}
                title="ปิด"
                className="hover:bg-gray-100 transition-all cursor-pointer rounded-full p-2 text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <div className="px-6 py-5 space-y-5">

              {/* ─── Section 1: ข้อมูลพื้นฐาน ─── */}
              <div>
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-3">
                  ข้อมูลพื้นฐาน
                </p>
                <div className="space-y-3">

                  {/* รหัสนักเรียน */}
                  <div>
                    <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">
                      เลขประจำตัวนักเรียน <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IdCardLanyard className={`w-4 h-4 ${errors.studentId ? "text-rose-400" : "text-blue-400"}`} />
                      </div>
                      <input
                        id="studentId"
                        type="number"
                        name="studentId"
                        min="0"
                        value={newStudent.studentId}
                        onChange={handleInputChange}
                        disabled={isFormUpdate}
                        className={`w-full pl-9 pr-4 py-2.5 rounded-xl border-2 outline-none transition-colors text-gray-800 text-sm
                          ${errors.studentId
                            ? "border-rose-400 bg-rose-50 focus:border-rose-500"
                            : "border-gray-200 focus:border-blue-400 bg-white"
                          }
                          ${isFormUpdate ? "text-gray-400 cursor-not-allowed bg-gray-50" : ""}`}
                        placeholder="เช่น 12345"
                      />
                    </div>
                    {errors.studentId && (
                      <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                        <span>⚠</span> {errors.studentId}
                      </p>
                    )}
                  </div>

                  {/* คำนำหน้า + ชื่อ-นามสกุล */}
                  <div className="flex gap-3">
                    <div className="w-32 shrink-0">
                      <label htmlFor="Titles" className="block text-sm font-medium text-gray-700 mb-1">
                        คำนำหน้า
                      </label>
                      <select
                        name="titles"
                        id="Titles"
                        value={newStudent.titles || ""}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-400 outline-none bg-white text-gray-800 text-sm cursor-pointer"
                      >
                        <option value="">-</option>
                        {Titles_list.map((title) => (
                          <option key={title} value={title}>{title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={newStudent.name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 rounded-xl border-2 outline-none transition-colors text-gray-800 text-sm
                          ${errors.name
                            ? "border-rose-400 bg-rose-50 focus:border-rose-500"
                            : "border-gray-200 focus:border-blue-400 bg-white"
                          }`}
                        placeholder="ชื่อ นามสกุล"
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs text-rose-500">⚠ {errors.name}</p>
                      )}
                    </div>
                  </div>

                  {/* ชั้นเรียน + เลขที่ */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label htmlFor="classes" className="block text-sm font-medium text-gray-700 mb-1">
                        ชั้นเรียน <span className="text-rose-500">*</span>
                      </label>
                      <select
                        id="classes"
                        name="classes"
                        value={newStudent.classes}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2.5 rounded-xl border-2 outline-none transition-colors bg-white text-gray-800 text-sm cursor-pointer
                          ${errors.classes
                            ? "border-rose-400 bg-rose-50"
                            : "border-gray-200 focus:border-blue-400"
                          }`}
                      >
                        <option value="">เลือกชั้นเรียน</option>
                        {classesList.map((cls) => (
                          <option key={cls.label} value={cls.label}>{cls.label}</option>
                        ))}
                      </select>
                      {errors.classes && (
                        <p className="mt-1 text-xs text-rose-500">⚠ {errors.classes}</p>
                      )}
                    </div>
                    <div className="w-28 shrink-0">
                      <label htmlFor="Number" className="block text-sm font-medium text-gray-700 mb-1">
                        เลขที่
                      </label>
                      <input
                        type="text"
                        id="Number"
                        name="number"
                        value={newStudent.number || ""}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2.5 rounded-xl border-2 outline-none transition-colors text-gray-800 text-sm
                          ${errors.number
                            ? "border-rose-400 bg-rose-50"
                            : "border-gray-200 focus:border-blue-400 bg-white"
                          }`}
                        placeholder="เช่น 15"
                      />
                      {errors.number && (
                        <p className="mt-1 text-xs text-rose-500">⚠ {errors.number}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Section 2: ข้อมูลการติดต่อ ─── */}
              <div>
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Phone size={12} />
                  ข้อมูลการติดต่อ
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* เบอร์โทรนักเรียน */}
                  <div>
                    <label htmlFor="phoneId" className="block text-sm font-medium text-gray-700 mb-1">
                      เบอร์โทรนักเรียน
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className={`w-4 h-4 ${errors.phone ? "text-rose-400" : "text-gray-400"}`} />
                      </div>
                      <input
                        id="phoneId"
                        type="tel"
                        value={newStudent.phone || ""}
                        maxLength={12}
                        onChange={(e) => setNewStudent({ ...newStudent, phone: formatPhone(e.target.value) })}
                        placeholder="xxx-xxx-xxxx"
                        className={`w-full pl-9 pr-4 py-2.5 rounded-xl border-2 outline-none transition-colors text-gray-800 text-sm
                          ${errors.phone
                            ? "border-rose-400 bg-rose-50 focus:border-rose-500"
                            : "border-gray-200 focus:border-blue-400 bg-white"
                          }`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-xs text-rose-500">⚠ {errors.phone}</p>
                    )}
                  </div>

                  {/* เบอร์โทรผู้ปกครอง */}
                  <div>
                    <label htmlFor="parentPhoneId" className="block text-sm font-medium text-gray-700 mb-1">
                      เบอร์โทรผู้ปกครอง
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className={`w-4 h-4 ${errors.parentPhone ? "text-rose-400" : "text-gray-400"}`} />
                      </div>
                      <input
                        id="parentPhoneId"
                        type="tel"
                        value={newStudent.parentPhone || ""}
                        maxLength={12}
                        placeholder="xxx-xxx-xxxx"
                        onChange={(e) => setNewStudent({ ...newStudent, parentPhone: formatPhone(e.target.value) })}
                        className={`w-full pl-9 pr-4 py-2.5 rounded-xl border-2 outline-none transition-colors text-gray-800 text-sm
                          ${errors.parentPhone
                            ? "border-rose-400 bg-rose-50 focus:border-rose-500"
                            : "border-gray-200 focus:border-blue-400 bg-white"
                          }`}
                      />
                    </div>
                    {errors.parentPhone && (
                      <p className="mt-1 text-xs text-rose-500">⚠ {errors.parentPhone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── Section 3: ข้อมูลระบบ (เฉพาะ teacher + edit mode) ─── */}
              {session?.user?.role === "teacher" && isFormUpdate && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    ข้อมูลระบบ
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* รหัสการเข้าสู่ระบบ */}
                    <div>
                      <label htmlFor="plantData" className="block text-sm font-medium text-gray-600 mb-1">
                        รหัสการเข้าสู่ระบบ
                      </label>
                      <input
                        type="text"
                        id="plantData"
                        name="plantData"
                        value={newStudent.plantData}
                        readOnly
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 text-gray-400 text-sm cursor-copy"
                        title="คลิกเพื่อคัดลอก"
                        onClick={() => {
                          navigator.clipboard?.writeText(newStudent.plantData || "");
                        }}
                      />
                    </div>
                    {/* สิทธิ์การใช้งาน */}
                    <div>
                      <label htmlFor="isAdminToggle" className="block text-sm font-medium text-gray-600 mb-1">
                        สิทธิ์การใช้งาน
                      </label>
                      <select
                        name="isAdmin"
                        id="isAdminToggle"
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-400 outline-none bg-white text-gray-800 text-sm cursor-pointer"
                        value={newStudent.isAdmin ? 1 : 0}
                        onChange={handleInputChange}
                      >
                        <option value={0}>นักเรียน</option>
                        <option value={1}>สภานักเรียน</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Required note */}
              <p className="text-xs text-gray-400">
                <span className="text-rose-500">*</span> จำเป็นต้องกรอก
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl sticky bottom-0">
              <button
                type="button"
                onClick={closeModel}
                className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-100 text-sm font-medium transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors shadow-md cursor-pointer
                  ${isFormUpdate
                    ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200"
                    : "bg-blue-500 hover:bg-blue-600 shadow-blue-200"
                  }`}
              >
                {isFormUpdate ? <Upload size={16} /> : <Plus size={16} />}
                {isFormUpdate ? "บันทึกการแก้ไข" : "เพิ่มนักเรียน"}
              </button>
            </div>

          </div>
        </div>
      )}
      <div className="mt-8 p-4 bg-white rounded-lg">
        <div className="flex justify-between items-center  mb-3">
          <div className="flex item-center">
            <FolderOpen className="text-blue-700 mr-3" />
            <h1 className="text-md sm:text-lg font-bold">
              ข้อมูลแต่ละชั้นเรียน
            </h1>
          </div>
          <div
            className="p-2 rounded-xl bg-slate-100 text-slate-600 cursor-pointer"
            onClick={fetchStudents}
          >
            <RefreshCw className={`${statusFetch ? "animate-spin" : ""}`} />
          </div>
        </div>
        <div className="p-2 mb-4 flex justify-between">
          <div>
            <p className="text-xs">ชั้นเรียน</p>
            <select
              value={selectClasses}
              onChange={(e) => {
                setSelectClasses(e.target.value);
                setNumberPager(1);
              }}
              className="text-sm px-2 py-1 rounded-md border border-[#009EA3] outline-none w-fit cursor-pointer"
            >
              {classesList.map((val) => (
                <option value={val.label} key={val.label}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs mr-2">จำนวนแถว</p>
            <select
              value={rowsPerPage}
              onChange={handleRowChange}
              className="px-2 py-1 text-sm border border-[#009EA3] outline-none rounded-md w-fit cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={75}>75</option>
            </select>
          </div>
        </div>
        <hr className="py-5 text-slate-500 w-[90%] m-auto" />
        {/* ตารางนักเรียน */}
        <div className="overflow-x-auto">
          <table className="table w-full border text-sm sm:text-md">
            <thead>
              <tr className="bg-blue-100 text-nowrap">
                <th
                  className="border border-gray-300 px-4 py-3 w-[10%] cursor-pointer hover:bg-blue-200 transition-colors select-none"
                  onClick={() => handleSort("studentId")}
                >
                  <div className="flex items-center justify-center">
                    รหัสนักเรียน
                    {getSortIcon("studentId")}
                  </div>
                </th>
                <th className="border border-gray-300 px-4 py-3 w-[10%]">
                  คำนำหน้า
                </th>
                <th
                  className="border border-gray-300 px-4 py-3 w-[30%] cursor-pointer hover:bg-blue-200 transition-colors select-none"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex justify-center items-center">
                    ชื่อ-นามสกุล
                    {getSortIcon("name")}
                  </div>
                </th>

                <th className="border border-gray-300 px-4 py-3 w-[15%] cursor-pointer hover:bg-blue-200 transition-colors select-none">
                  เบอร์โทร
                </th>
                <th className="border border-gray-300 px-4 py-3 w-[15%] cursor-pointer hover:bg-blue-200 transition-colors select-none">
                  เบอร์โทรผู้ปกครอง
                </th>
                <th
                  className="border border-gray-300 px-4 py-3 w-[15%] cursor-pointer hover:bg-blue-200 transition-colors select-none"
                  onClick={() => handleSort("classes")}
                >
                  <div className="flex justify-center items-center">
                    ชั้นเรียน
                    {getSortIcon("classes")}
                  </div>
                </th>
                <th className="border border-gray-300 px-6 py-3 w-[20%] cursor-pointer hover:bg-blue-200 transition-colors select-none">
                  การดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((value: any, index: any) => (
                  <tr
                    key={index}
                    className="text-center border-b border-l border-r border-blue-100"
                  >
                    <td className="whitespace-nowrap p-2 text-[#009EA3]">
                      {value.studentId || "ไม่มีข้อมูล"}
                    </td>
                    <td className="whitespace-nowrap p-2">
                      {value.titles || value.preFace || "-"}
                    </td>
                    <td className="whitespace-nowrap p-2">
                      {value.name || "ไม่มีข้อมูล"}
                    </td>

                    <td className="whitespace-nowrap p-2 text-center">
                      <div className="bg-blue-500 text-white rounded-xl text-center px-2">
                        {value.phone || "ไม่มีข้อมูล"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap p-2 text-center">
                      <div className="bg-blue-700 text-white rounded-xl text-center px-2">
                        {value.parentPhone || "ไม่มีข้อมูล"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap p-2 text-center">
                      <div className="bg-green-500 text-white rounded-xl text-center px-2">
                        {value.classes || "ไม่มีข้อมูล"}
                      </div>
                    </td>

                    <td className="px-4 py-1.5">
                      <div className="flex justify-center-safe items-center-safe">
                        <button
                          className="bg-yellow-500 hover:bg-yellow-600 text-white cursor-pointer flex items-center transition-colors px-2 py-1 rounded-md mr-5"
                          onClick={() =>
                            handleUpdate(value.studentId, value.name)
                          }
                        >
                          <UserPen className="w-4 h-4 mr-2" />
                          <p className="text-white">แก้ไข</p>
                        </button>
                        <button
                          className="bg-red-500 hover:bg-red-600 text-white cursor-pointer flex items-center transition-colors px-2 py-1 rounded-md"
                          onClick={() =>
                            handleDelete(value.studentId, value.name)
                          }
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          <p className="text-white">ลบ</p>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="border p-2 text-center text-gray-500"
                  >
                    ไม่มีข้อมูลนักเรียน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {/* Pagination */}
          <div className="text-sm mt-4 mb-3 ">
            <button
              onClick={() => setNumberPager(NumberPager - 1)}
              disabled={NumberPager === 1}
              className="mr-3 cursor-pointer text-gray-500 hover:text-gray-700 transition-colors disabled:cursor-not-allowed"
            >
              Prev
            </button>
            {/* แสดงเลขหน้า */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((Page) => (
              <button
                key={Page}
                onClick={() => setNumberPager(Page)}
                className={`mr-3 ${Page === NumberPager && "bg-blue-400 text-white "
                  } outline outline-blue-400 rounded-sm px-3 py-1/2 cursor-pointer text-slate-500 hover:text-slate-700 transition-colors `}
              >
                {Page}
              </button>
            ))}
            <button
              onClick={() => setNumberPager(NumberPager + 1)}
              disabled={NumberPager === totalPages}
              className="ml-3 cursor-pointer text-slate-500 hover:text-slate-700 transition-colors disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
        <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
          <button
            title="นำเข้าข้อมูลนักเรียนจาก Excel"
            onClick={() => setIsImportModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          >
            <FileSpreadsheet className="w-6 h-6" />
          </button>
          <button
            title="ดาวน์โหลดข้อมูลนักเรียน"
            onClick={() => setMenu("PDFDownload")}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          >
            <BookOpen className="w-6 h-6" />
          </button>
        </div>
        <ExcelImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          importType="student"
          onSuccess={fetchStudents}
        />
      </div>
    </div>
  );
}

export default StudentManagement;
