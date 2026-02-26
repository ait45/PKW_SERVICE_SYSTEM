"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  UserRound,
  X,
  LogOut,
  Shield,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import type { Route } from "next";

const roleConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  teacher: {
    label: "ครู",
    color: "bg-blue-100 text-blue-700",
    icon: <BookOpen size={12} />,
  },
  student: {
    label: "นักเรียน",
    color: "bg-emerald-100 text-emerald-700",
    icon: <GraduationCap size={12} />,
  },
  studentAdmin: {
    label: "สภานักเรียน",
    color: "bg-purple-100 text-purple-700",
    icon: <Shield size={12} />,
  },
};

function UserInfo({ session, isMobile }: { session: any; isMobile: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userName = session?.user?.name || "ผู้ใช้";
  const userRole = session?.user?.role || "student";
  const userUsername = session?.user?.username || "";
  const isAdmin = session?.user?.isAdmin;

  const role = roleConfig[userRole] || roleConfig.student;

  // Get initials for avatar
  const initials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    setIsOpen(false);
    const result = await Swal.fire({
      title: "ออกจากระบบ?",
      text: "คุณต้องการออกจากระบบหรือไม่",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#009EA3",
      cancelButtonColor: "#d33",
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      await signOut();
      setTimeout(() => {
        Swal.fire({
          title: "ออกจากระบบเสร็จสิ้น",
          icon: "success",
          timer: 5000,
        });
      }, 1000);
      router.push("/login" as Route);
    }
  };

  return (
    <div className="relative z-60" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        title={isMobile ? userName : "ข้อมูลผู้ใช้"}
      >
        <div className="w-7 h-7 rounded-full bg-linear-to-br from-[#009EA3] to-[#188F6D] flex items-center justify-center text-white text-xs font-bold shadow-sm">
          {initials}
        </div>
        <span className="hidden sm:inline text-sm font-medium text-gray-700 max-w-[120px] truncate">
          {userName}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Gradient Header */}
          <div className="relative px-4 py-4 bg-linear-to-r from-[#009EA3] to-[#188F6D]">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-base border-2 border-white/30">
                {initials}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">
                  {userName}
                </p>
                {userUsername && (
                  <p className="text-white/70 text-xs truncate">
                    @{userUsername}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Role Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${role.color}`}
              >
                {role.icon}
                {role.label}
              </span>
              {/* Admin Badge */}
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  <Shield size={12} />
                  ผู้ดูแลระบบ
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut size={16} />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserInfo;
