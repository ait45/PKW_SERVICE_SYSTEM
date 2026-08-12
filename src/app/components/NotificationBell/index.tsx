"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  X,
  ExternalLink,
  CheckCheck,
  AlertCircle,
  Calendar,
  Info,
  Megaphone,
} from "lucide-react";
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

export default function NotificationBell({
  session,
  onNavigate,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readIds, setReadIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch notifications and unread count
  const fetchNotifications = useCallback(async () => {
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
        setReadIds(countData.readIds || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark single notification as read
  const markAsRead = async (notificationId: number) => {
    if (readIds.includes(notificationId)) return;
    try {
      await fetch("/api/notifications/read-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      setReadIds((prev) => [...prev, notificationId]);
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await fetch("/api/notifications/read-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setReadIds(notifications.map((n) => n.ID));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  useEffect(() => {
    if (session) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [session, fetchNotifications]);

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
    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "urgent":
        return <AlertCircle size={14} className="text-red-500" />;
      case "event":
        return <Calendar size={14} className="text-emerald-500" />;
      case "info":
        return <Info size={14} className="text-blue-500" />;
      default:
        return <Megaphone size={14} className="text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "urgent":
        return "bg-red-500";
      case "event":
        return "bg-emerald-500";
      case "info":
        return "bg-blue-500";
      default:
        return "bg-gray-400";
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

  const isUnread = (id: number) => !readIds.includes(id);

  return (
    <div className="relative z-60" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-[#009EA3] hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
        title="การแจ้งเตือน"
      >
        <Bell
          size={20}
          className={unreadCount > 0 ? "animate-bellShake" : ""}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-slideDown">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#009EA3] to-[#188F6D] text-white rounded-t-2xl">
            <h3 className="font-semibold text-sm sm:text-base">การแจ้งเตือน</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                  title="อ่านทั้งหมด"
                >
                  <CheckCheck size={16} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              // Skeleton shimmer loading
              <div className="space-y-0">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="px-4 py-3 border-b border-gray-50">
                    <div className="flex items-start gap-3 animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-full" />
                        <div className="h-2.5 bg-gray-200 rounded w-1/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">ไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const unread = isUnread(notif.ID);
                return (
                  <div
                    key={notif.ID}
                    onClick={() => markAsRead(notif.ID)}
                    className={`px-4 py-3 border-b border-gray-50 cursor-pointer transition-all duration-200 ${
                      unread
                        ? "bg-blue-50/60 hover:bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Type icon or unread dot */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          unread
                            ? `${getTypeColor(notif.TYPE)} text-white`
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {getTypeIcon(notif.TYPE)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm truncate ${
                            unread
                              ? "font-semibold text-gray-900"
                              : "font-medium text-gray-600"
                          }`}
                        >
                          {notif.IS_PINNED === 1 && (
                            <span className="text-yellow-500 mr-1">📌</span>
                          )}
                          {notif.TITLE}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                          {notif.CONTENT}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {formatDate(notif.CREATED_AT)}
                        </p>
                      </div>
                      {/* Unread indicator dot */}
                      {unread && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2 bg-gray-50 border-t rounded-b-2xl">
            <button
              onClick={handleViewAll}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-[#009EA3] hover:bg-[#009EA3]/10 rounded-lg transition-colors cursor-pointer"
            >
              <ExternalLink size={14} />
              ดูทั้งหมด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
