"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, X, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Route } from "next";

interface Notification {
  ID: number;
  TITLE: string;
  CONTENT: string;
  TYPE: "general" | "urgent" | "event" | "info";
  IS_PINNED: number;
  CREATED_AT: string;
}

interface NotificationBellProps {
  session: any;
  onNavigate?: (page: string) => void;
}

export default function NotificationBell({ session, onNavigate }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch notifications and unread count
  const fetchNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        fetch("/api/notifications?limit=5&status=active"),
        fetch("/api/notifications/read-status"),
      ]);
      
      const notifData = await notifRes.json();
      if (notifData.success) {
        setNotifications(notifData.message || []);
      }

      const countData = await countRes.json();
      if (countData.success) {
        setUnreadCount(countData.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      await fetch("/api/notifications/read-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  useEffect(() => {
    if (session) {
      fetchNotifications();
      // Refresh every 60 seconds
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "เมื่อกี้";
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    if (days < 7) return `${days} วันที่แล้ว`;
    return date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "urgent": return "bg-red-500";
      case "event": return "bg-emerald-500";
      case "info": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    if (onNavigate) {
      onNavigate("notifications");
    } else {
      router.push("/notifications" as Route);
    }
  };

  if (!session) return null;

  return (
    <main className="relative z-60" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) {
            markAllAsRead();
          }
        }}
        className="relative p-2 text-gray-600 hover:text-[#009EA3] hover:bg-gray-100 rounded-full transition-colors"
        title="การแจ้งเตือน"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-linear-to-r from-[#009EA3] to-[#188F6D] text-white">
            <h3 className="font-semibold">การแจ้งเตือน</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin w-6 h-6 border-2 border-[#009EA3] border-t-transparent rounded-full mx-auto mb-2" />
                กำลังโหลด...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                <p>ไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.ID}
                  onClick={() => markAsRead(notif.ID)}
                  className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${getTypeColor(notif.TYPE)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-800 truncate">
                        {notif.IS_PINNED === 1 && <span className="text-yellow-500 mr-1">📌</span>}
                        {notif.TITLE}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                        {notif.CONTENT}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(notif.CREATED_AT)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 bg-gray-50 border-t">
            <button
              onClick={handleViewAll}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-[#009EA3] hover:bg-[#009EA3]/10 rounded-lg transition-colors"
            >
              <ExternalLink size={14} />
              ดูทั้งหมด
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
