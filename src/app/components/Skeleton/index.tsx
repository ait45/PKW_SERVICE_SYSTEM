"use client";

import React from "react";

// Base skeleton with pulse animation
export const SkeletonPulse = ({
  className = "",
}: {
  className?: string;
}) => (
  <div
    className={`animate-pulse bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 bg-size-[200%_100%] rounded ${className}`}
    style={{
      animation: "shimmer 1.5s infinite linear",
    }}
  />
);

// Text skeleton - for text lines
export const SkeletonText = ({
  lines = 1,
  className = "",
  widths = ["100%"],
}: {
  lines?: number;
  className?: string;
  widths?: string[];
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="h-4 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"
        style={{ width: widths[i] || widths[widths.length - 1] || "100%" }}
      />
    ))}
  </div>
);

// Avatar skeleton
export const SkeletonAvatar = ({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20",
  };

  return (
    <div
      className={`${sizes[size]} rounded-full bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse ${className}`}
    />
  );
};

// Card skeleton - for stat cards
export const SkeletonCard = ({
  className = "",
  hasIcon = true,
}: {
  className?: string;
  hasIcon?: boolean;
}) => (
  <div
    className={`bg-white rounded-xl shadow-lg p-6 ${className}`}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1 space-y-3">
        <div className="h-4 w-20 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse" />
        <div className="h-8 w-16 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse" />
        <div className="h-3 w-24 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse" />
      </div>
      {hasIcon && (
        <div className="w-14 h-14 rounded-2xl bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
      )}
    </div>
  </div>
);

// Chart skeleton
export const SkeletonChart = ({
  height = 300,
  type = "bar",
  className = "",
}: {
  height?: number;
  type?: "bar" | "pie" | "line";
  className?: string;
}) => {
  if (type === "pie") {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="w-48 h-48 rounded-full bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`${className}`} style={{ height }}>
      <div className="flex items-end justify-between h-full gap-2 px-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col gap-1">
            <div
              className="w-full bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded-t animate-pulse"
              style={{ height: `${Math.random() * 60 + 20}%` }}
            />
            <div className="h-4 w-full bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Table skeleton
export const SkeletonTable = ({
  rows = 5,
  columns = 4,
  className = "",
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) => (
  <div className={`overflow-hidden rounded-xl ${className}`}>
    {/* Header */}
    <div className="bg-gray-100 p-4 flex gap-4">
      {Array.from({ length: columns }).map((_, i) => (
        <div
          key={i}
          className="h-4 flex-1 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"
        />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        className={`p-4 flex gap-4 ${rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div
            key={colIndex}
            className="h-4 flex-1 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse"
          />
        ))}
      </div>
    ))}
  </div>
);

// Stats grid skeleton - for dashboard stats
export const SkeletonStatsGrid = ({
  count = 4,
  className = "",
}: {
  count?: number;
  className?: string;
}) => (
  <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="relative bg-white rounded-xl shadow-lg p-6 overflow-hidden"
      >
        <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-linear-to-r from-gray-100 to-gray-200 animate-pulse" />
        <div className="relative z-10 space-y-3">
          <div className="h-8 w-16 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse" />
          <div className="h-4 w-20 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

// Page skeleton - full page loading
export const SkeletonPage = ({
  variant = "dashboard",
}: {
  variant?: "dashboard" | "table" | "form" | "cards";
}) => {
  switch (variant) {
    case "table":
      return (
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center mb-6">
            <div className="h-8 w-48 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse" />
            <div className="h-10 w-32 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse" />
          </div>
          <SkeletonTable rows={8} columns={5} />
        </div>
      );
    case "cards":
      return (
        <div className="p-4 space-y-6">
          <div className="h-8 w-48 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      );
    case "form":
      return (
        <div className="p-4 max-w-2xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return (
        <div className="p-4 space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4 mb-6">
              <SkeletonAvatar size="lg" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse" />
                <div className="h-4 w-32 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <SkeletonStatsGrid count={4} />
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="h-6 w-32 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse mb-4" />
            <SkeletonTable rows={5} columns={4} />
          </div>
        </div>
      );
  }
};

// Statistics page skeleton
export const SkeletonStatistics = () => (
  <main className="p-4 space-y-6">
    {/* Summary Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
    
    {/* Charts Section */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bar Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
          <div className="h-6 w-48 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse" />
        </div>
        <SkeletonChart height={300} type="bar" />
      </div>
      
      {/* Pie Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
          <div className="h-6 w-48 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse" />
        </div>
        <SkeletonChart height={300} type="pie" />
      </div>
    </div>
  </main>
);

// Teacher cards skeleton
export const SkeletonTeacherCards = () => (
  <main className="max-w-7xl mx-auto p-6">
    <div className="mb-8 space-y-2">
      <div className="h-8 w-64 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse" />
      <div className="h-4 w-48 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse" />
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl p-6 bg-gray-100 animate-pulse"
        >
          <div className="w-12 h-12 rounded-xl bg-gray-200 mb-4" />
          <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
          <div className="h-8 w-12 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
    
    <div className="bg-gray-200 rounded-2xl p-8 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="text-center">
            <div className="h-10 w-16 bg-gray-300 rounded mx-auto mb-2" />
            <div className="h-4 w-20 bg-gray-300 rounded mx-auto" />
          </div>
        ))}
      </div>
    </div>
  </main>
);

// Student dashboard skeleton
export const SkeletonStudentDashboard = () => (
  <div className="min-h-screen bg-linear-to-br from-slate-50 via-violet-50 to-pink-50">
    {/* Header */}
    <div className="bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SkeletonAvatar size="xl" />
            <div className="hidden sm:block space-y-2">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="flex gap-3">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
          <div className="h-16 w-36 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Tabs */}
      <div className="flex gap-2 mb-8 p-2 bg-white/50 backdrop-blur-sm rounded-2xl w-fit">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-24 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/80 rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-gray-200 animate-pulse" />
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="text-center space-y-4">
              <div className="h-16 w-20 bg-gray-200 rounded mx-auto animate-pulse" />
              <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded mx-auto animate-pulse" />
            </div>
          </div>
          <div className="bg-white/80 rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-gray-200 animate-pulse" />
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Teacher Admin Board skeleton
export const SkeletonTeacherAdminBoard = () => (
  <main className="max-w-7xl mx-auto p-6">
    {/* Header */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-14 h-14 rounded-xl bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
          <div className="h-8 w-48 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-4 w-40 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse" />
      </div>
      <div className="h-12 w-36 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded-xl animate-pulse mt-4 md:mt-0" />
    </div>

    {/* Statistics Cards */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-6 bg-gray-100 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gray-200" />
            <div>
              <div className="h-8 w-12 bg-gray-200 rounded mb-1" />
              <div className="h-4 w-20 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Filter and Search */}
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 h-12 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-12 w-48 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    </div>

    {/* Table */}
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        {/* Table Header */}
        <div className="bg-gray-50 px-6 py-4 flex gap-4">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse flex-1" />
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
        {/* Table Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-6 py-4 border-b flex gap-4 items-center">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
              <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </main>
);

// Issue Report Management skeleton
export const SkeletonIssueReportManagement = () => (
  <div className="p-6 bg-gray-50 min-h-screen">
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8 w-64 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse" />
        </div>
        <div className="p-2 w-10 h-10 bg-gray-100 rounded-lg animate-pulse" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-3 border animate-pulse">
            <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
            <div className="h-7 w-10 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-8 w-32 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 border-b px-4 py-3 flex gap-4">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse flex-1" />
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
        {/* Table Rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-4 py-3 border-b flex gap-4 items-center hover:bg-gray-50">
            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse flex-1" />
            <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Notifications skeleton
export const SkeletonNotifications = () => (
  <div className="p-4">
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gray-200 rounded-md animate-pulse mr-3" />
          <div>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-1" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                </div>
                <div className="h-5 w-64 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-3" />
                <div className="flex items-center gap-4">
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <div className="w-8 h-8 bg-gray-200 rounded-md animate-pulse" />
                <div className="w-8 h-8 bg-gray-200 rounded-md animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Line User Management skeleton
export const SkeletonLineUserManagement = () => (
  <div className="p-6 bg-gray-50 min-h-screen">
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px] h-10 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 border-b px-4 py-3 flex gap-4">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse flex-1" />
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
        {/* Table Rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-4 py-3 border-b flex gap-4 items-center">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse font-mono" />
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse flex-1" />
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
              <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Event Management skeleton
export const SkeletonEventManagement = () => (
  <div className="p-4">
    <div className="bg-white rounded-lg shadow-lg p-4">
      {/* Header */}
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-md animate-pulse mr-3" />
        <div>
          <div className="h-6 w-56 bg-gray-200 rounded animate-pulse mb-1" />
          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div>
          <div className="h-3 w-12 bg-gray-200 rounded animate-pulse mb-1" />
          <div className="h-10 w-28 bg-gray-200 rounded-md animate-pulse" />
        </div>
        <div>
          <div className="h-3 w-12 bg-gray-200 rounded animate-pulse mb-1" />
          <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse" />
        </div>
        <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse ml-auto" />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="w-full min-w-[800px]">
          {/* Table Header */}
          <div className="bg-gray-100 flex">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex-1 px-4 py-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
          {/* Table Rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex border-b">
              {Array.from({ length: 7 }).map((_, j) => (
                <div key={j} className="flex-1 px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
              <div className="flex-1 px-4 py-3 flex justify-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-md animate-pulse" />
                <div className="w-8 h-8 bg-gray-200 rounded-md animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-16 bg-gray-200 rounded-md animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

// Table Attendance skeleton (today's attendance page)
export const SkeletonTableAttendance = () => (
  <main className="max-w-7xl mx-auto p-2 sm:p-4">
    {/* Header */}
    <div className="bg-gray-300 rounded-xl p-4 sm:p-6 mb-4 animate-pulse">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-white/20" />
          <div>
            <div className="h-6 w-40 bg-white/20 rounded mb-2" />
            <div className="h-4 w-56 bg-white/20 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-36 bg-white/20 rounded-lg" />
          <div className="w-10 h-10 bg-white/20 rounded-lg" />
        </div>
      </div>
    </div>

    {/* Summary Cards */}
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-xl p-3 animate-pulse">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-gray-200 rounded" />
            <div className="h-3 w-12 bg-gray-200 rounded" />
          </div>
          <div className="h-7 w-10 bg-gray-200 rounded" />
        </div>
      ))}
    </div>

    {/* Controls */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 animate-pulse">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <div className="h-3 w-20 bg-gray-200 rounded mb-1" />
          <div className="h-9 w-56 bg-gray-100 rounded-lg" />
        </div>
        <div>
          <div className="h-3 w-14 bg-gray-200 rounded mb-1" />
          <div className="h-9 w-36 bg-gray-100 rounded-lg" />
        </div>
        <div>
          <div className="h-3 w-8 bg-gray-200 rounded mb-1" />
          <div className="h-9 w-16 bg-gray-100 rounded-lg" />
        </div>
      </div>
    </div>

    {/* Table */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 border-b border-gray-100 px-4 py-3.5 flex gap-4">
        <div className="h-4 w-[18%] bg-gray-200 rounded animate-pulse" />
        <div className="h-4 flex-1 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-[18%] bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-[22%] bg-gray-200 rounded animate-pulse" />
      </div>
      {/* Table Rows */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="px-4 py-3 border-b border-gray-50 flex gap-4 items-center animate-pulse">
          <div className="h-4 w-[18%] bg-gray-200 rounded" />
          <div className="h-4 flex-1 bg-gray-200 rounded" />
          <div className="h-4 w-[18%] bg-gray-200 rounded" />
          <div className="h-6 w-[22%] bg-gray-200 rounded-lg" />
        </div>
      ))}
      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-3 flex justify-between items-center animate-pulse">
        <div className="flex gap-1">
          <div className="h-7 w-16 bg-gray-200 rounded-md" />
          <div className="h-7 w-8 bg-gray-200 rounded-md" />
          <div className="h-7 w-8 bg-gray-200 rounded-md" />
          <div className="h-7 w-16 bg-gray-200 rounded-md" />
        </div>
        <div className="h-10 w-40 bg-gray-200 rounded-xl" />
      </div>
    </div>
  </main>
);

// Retroactive Attendance skeleton
export const SkeletonRetroactiveAttendance = () => (
  <main className="max-w-7xl mx-auto p-2 sm:p-4">
    {/* Header */}
    <div className="bg-gray-300 rounded-xl p-4 sm:p-6 mb-4 animate-pulse">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-white/20" />
          <div>
            <div className="h-6 w-40 bg-white/20 rounded mb-2" />
            <div className="h-4 w-48 bg-white/20 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-36 bg-white/20 rounded-lg" />
          <div className="w-10 h-10 bg-white/20 rounded-lg" />
        </div>
      </div>
      <div className="mt-3 h-8 w-48 bg-white/10 rounded-lg" />
    </div>

    {/* Summary Cards */}
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-xl p-3 animate-pulse">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-gray-200 rounded" />
            <div className="h-3 w-12 bg-gray-200 rounded" />
          </div>
          <div className="h-7 w-10 bg-gray-200 rounded" />
        </div>
      ))}
    </div>

    {/* Controls */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 animate-pulse">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <div className="h-3 w-20 bg-gray-200 rounded mb-1" />
          <div className="h-9 w-56 bg-gray-100 rounded-lg" />
        </div>
        <div>
          <div className="h-3 w-14 bg-gray-200 rounded mb-1" />
          <div className="h-9 w-36 bg-gray-100 rounded-lg" />
        </div>
        <div>
          <div className="h-3 w-8 bg-gray-200 rounded mb-1" />
          <div className="h-9 w-16 bg-gray-100 rounded-lg" />
        </div>
      </div>
    </div>

    {/* Table */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-100 px-4 py-3.5 flex gap-4">
        <div className="h-4 w-[18%] bg-gray-200 rounded animate-pulse" />
        <div className="h-4 flex-1 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-[18%] bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-[22%] bg-gray-200 rounded animate-pulse" />
      </div>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="px-4 py-3 border-b border-gray-50 flex gap-4 items-center animate-pulse">
          <div className="h-4 w-[18%] bg-gray-200 rounded" />
          <div className="h-4 flex-1 bg-gray-200 rounded" />
          <div className="h-4 w-[18%] bg-gray-200 rounded" />
          <div className="h-6 w-[22%] bg-gray-200 rounded-lg" />
        </div>
      ))}
      <div className="border-t border-gray-100 px-4 py-3 flex justify-between items-center animate-pulse">
        <div className="flex gap-1">
          <div className="h-7 w-16 bg-gray-200 rounded-md" />
          <div className="h-7 w-8 bg-gray-200 rounded-md" />
          <div className="h-7 w-8 bg-gray-200 rounded-md" />
          <div className="h-7 w-16 bg-gray-200 rounded-md" />
        </div>
        <div className="h-10 w-40 bg-gray-200 rounded-xl" />
      </div>
    </div>
  </main>
);

// Retroactive Approval skeleton
export const SkeletonRetroactiveApproval = () => (
  <main className="max-w-7xl mx-auto p-2 sm:p-4">
    {/* Header */}
    <div className="bg-gray-300 rounded-xl p-4 sm:p-6 mb-4 animate-pulse">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-white/20" />
          <div>
            <div className="h-6 w-56 bg-white/20 rounded mb-2" />
            <div className="h-4 w-48 bg-white/20 rounded" />
          </div>
        </div>
        <div className="w-10 h-10 bg-white/20 rounded-lg" />
      </div>
      <div className="flex gap-3 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-9 w-32 bg-white/15 rounded-lg" />
        ))}
      </div>
    </div>

    {/* Filter Tabs */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 mb-4 flex gap-1 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-9 w-28 bg-gray-100 rounded-lg" />
      ))}
    </div>

    {/* Request Cards */}
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
          <div className="h-1 bg-gray-200" />
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="h-6 w-24 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-32 bg-gray-200 rounded" />
                  <div className="h-4 w-20 bg-gray-100 rounded" />
                </div>
                <div className="flex gap-3">
                  <div className="h-3 w-28 bg-gray-100 rounded" />
                  <div className="h-3 w-16 bg-gray-100 rounded" />
                  <div className="h-3 w-32 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <div className="h-8 w-20 bg-gray-200 rounded-lg" />
              <div className="h-8 w-20 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </main>
);

// Export all components
export default {
  SkeletonPulse,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonChart,
  SkeletonTable,
  SkeletonStatsGrid,
  SkeletonPage,
  SkeletonStatistics,
  SkeletonTeacherCards,
  SkeletonStudentDashboard,
  SkeletonIssueReportManagement,
  SkeletonTeacherAdminBoard,
  SkeletonNotifications,
  SkeletonLineUserManagement,
  SkeletonEventManagement,
  SkeletonTableAttendance,
  SkeletonRetroactiveAttendance,
  SkeletonRetroactiveApproval,
};
