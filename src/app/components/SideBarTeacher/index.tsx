"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Home,
  Settings,
  Mail,
  Pin,
  ChevronLeft,
  ChevronRight,
  UserRound,
  Users,
  ShieldUser,
  CalendarRange,
  UserRoundCheck,
  SquarePen,
  LucideIcon,
  RotateCcwKey,
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

interface SideBarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  session: any;
  menuGroups?: MenuGroup[];
  onCollapseChange?: (isCollapsed: boolean) => void;
}

const defaultMenuGroups: MenuGroup[] = [
  {
    title: "หลัก",
    items: [
      { id: "dashboard", label: "Dashboard", icon: Home },
      { id: "messages", label: "Messages", icon: Mail },
    ],
  },
  {
    title: "ข้อมูล",
    items: [
      { id: "teachers", label: "ข้อมูลครู", icon: UserRound },
      { id: "teacherBoard", label: "บอร์ดกลุ่มสาระ", icon: Users },
      { id: "behaviorScore", label: "คะแนนความประพฤติ", icon: ShieldUser },
      { id: "notifications", label: "ประกาศ", icon: Pin },
      { id: "forgetPasswordMess", label: "การแจ้งลืมรหัสผ่าน", icon: RotateCcwKey },
    ],
  },
  {
    title: "กิจกรรม",
    items: [
      { id: "event", label: "จัดการกิจกรรม", icon: CalendarRange },
      { id: "eventCheck", label: "เช็คชื่อกิจกรรม", icon: UserRoundCheck },
      { id: "eventTable", label: "ตารางกิจกรรม", icon: SquarePen },
    ],
  },
  {
    title: "ระบบ",
    items: [
      { id: "settings", label: "ตั้งค่า", icon: Settings },
    ],
  },
];

function SideBarTeacher({
  activeMenu,
  setActiveMenu,
  session,
  menuGroups = defaultMenuGroups,
  onCollapseChange,
}: SideBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [pendingIssuesCount, setPendingIssuesCount] = useState(0);

  const fetchPendingIssues = useCallback(async () => {
    try {
      const res = await fetch("/api/issue-reports?status=pending&type=all");
      const data = await res.json();
      if (data.success) {
        setPendingIssuesCount(data.data.stats?.pending || 0);
      }
    } catch (error) {
      console.error("Failed to fetch pending issues:", error);
    }
  }, []);

  useEffect(() => {
    fetchPendingIssues();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingIssues, 30000);
    return () => clearInterval(interval);
  }, [fetchPendingIssues]);

  // Sync collapse state with parent component
  useEffect(() => {
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);

  const toggleSideBar = () => {
    setIsCollapsed((prev) => !prev);
  };

  const handleMenuClick = (itemId: string) => {
    setActiveMenu(itemId);
    // Refresh count when clicking on messages
    if (itemId === "messages") {
      fetchPendingIssues();
    }
  };

  return (
    <div
      className={`relative bg-[#009EA3] text-white transition-all duration-500 ease-initial shadow-2xl ${isCollapsed ? "w-16" : "w-60"
        } h-screen overflow-y-auto hide-scrollbar`}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <ShieldUser className="w-5 h-5" />
              </div>
              {session?.user?.role === "teacher" &&
                session?.user?.isAdmin === true ? (
                <span className="font-bold text-xl cursor-default whitespace-nowrap overflow-hidden">
                  หน้าผู้ดูแลระบบ
                </span>
              ) : (
                <span className="font-bold text-xl cursor-default whitespace-nowrap overflow-hidden">
                  หน้าบุคลากร
                </span>
              )}
            </div>
          )}
          <button
            onClick={toggleSideBar}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors duration-200 cursor-pointer"
            title={isCollapsed ? "เปิดเมนู" : "ปิดเมนู"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 overflow-y-scroll hide-scrollbar">
        {menuGroups.map((group, groupIndex) => (
          <div key={group.title} className={groupIndex > 0 ? "mt-4" : ""}>
            {/* Group Title */}
            {!isCollapsed && (
              <p className="text-xs text-white/50 uppercase tracking-wider mb-2 px-3">
                {group.title}
              </p>
            )}
            {isCollapsed && groupIndex > 0 && (
              <div className="border-t border-white/10 my-2" />
            )}

            {/* Group Items */}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeMenu === item.id;
                const badgeCount = item.id === "messages" ? pendingIssuesCount : 0;

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleMenuClick(item.id)}
                      className={`w-full flex items-center px-3 py-3 rounded-xl transition-all duration-200 hover:bg-white/10 hover:translate-x-1 group relative ${isActive ? "bg-white/20 shadow-lg" : ""
                        } ${isCollapsed
                          ? "justify-center"
                          : "justify-start space-x-3"
                        }`}
                    >
                      <div className="relative">
                        <IconComponent
                          className={`w-5 h-5 transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-105"
                            }`}
                        />
                        {/* Badge */}
                        {badgeCount > 0 && (
                          <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg animate-pulse">
                            {badgeCount > 99 ? "99+" : badgeCount}
                          </span>
                        )}
                      </div>
                      {!isCollapsed && (
                        <span className="font-medium flex-1 text-left text-sm whitespace-nowrap overflow-hidden">
                          {item.label}
                        </span>
                      )}

                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute right-0 w-1 h-6 bg-white rounded-l-full" />
                      )}

                      {/* Tooltip for collapsed state */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                          {item.label}
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}

export default SideBarTeacher;
