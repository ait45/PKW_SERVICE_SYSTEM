"use client";

import React from "react";
import {
  GraduationCap,
  QrCode,
  Users,
  Calendar,
  BookOpen,
  BarChart3,
} from "lucide-react";


interface MenuBarProps {
  currentPage: string;
  handleChangePage: (page: string) => void;
}

function MenuBar({ currentPage, handleChangePage }: MenuBarProps) {
  return (
    <main className="bg-white shadow-lg max-w-full">
      <nav className="w-full mx-auto px-4">
        <div className="flex justify-between items-center h-10 sm:h-16">
          <div className="flex items-center gap-3" title="Prakeawasawittaya">
            <GraduationCap className="text-blue-600 w-5/6 h-5/6 sm:w-8 sm:h-8" />
            <div className="text-sm font-bold text-gray-800 hidden sm:inline">
              โรงเรียนพระแก้วอาสาวิทยา
            </div>
          </div>
          <div className="flex space-x-2">
            <div
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors rounded-md"
              title={currentPage}
            >
              <QrCode className="w-4 h-4 sm:w-6 sm:h-6" />
              <select
                className="outline-none w-[60px] sm:w-[120px] text-xs focus:text-gray-900 cursor-pointer overflow-hidden"
                value={currentPage}
                onChange={(e) => handleChangePage(e.target.value)}
                id="attendance"
              >
                <option value="dashboard">หน้าแรก</option>
                <option value="scan">เช็คชื่อ</option>
                <option value="tableAttendance">ตารางการเช็คชื่อ</option>
              </select>
            </div>
            <button
              onClick={() => handleChangePage("students")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${currentPage === "students"
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:text-gray-800"
                } cursor-pointer`}
              title="นักเรียน"
            >
              <Users className="w-4 h-4 sm:w-6 sm:h-6" />
              <p className="hidden md:inline">นักเรียน</p>
            </button>
            <button
              onClick={() => handleChangePage("schedule")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${currentPage === "schedule"
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:text-gray-800"
                } cursor-pointer`}
              title="ตารางเรียน"
            >
              <Calendar className="w-4 h-4 sm:w-6 sm:h-6" />
              <p className="hidden md:inline">ตารางเรียน</p>
            </button>
            <button
              onClick={() => handleChangePage("reports")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${currentPage === "reports"
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:text-gray-800"
                } cursor-pointer`}
              title="รายงาน"
            >
              <BookOpen className="w-4 h-4 sm:w-6 sm:h-6" />
              <p className="hidden md:inline">รายงาน</p>
            </button>
            <button
              onClick={() => handleChangePage("statistics")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${currentPage === "statistics"
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:text-gray-800"
                } cursor-pointer`}
              title="สถิติ"
            >
              <BarChart3 className="w-4 h-4 sm:w-6 sm:h-6" />
              <p className="hidden md:inline">สถิติ</p>
            </button>
          </div>
        </div>
      </nav>
    </main>
  );
}

export default MenuBar;
