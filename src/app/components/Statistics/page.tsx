"use client";

import React, { useEffect, useState } from "react";
import Day from "../date-time/day";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ChartArea,
  ChartPie,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Pause,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { SkeletonStatistics } from "../Skeleton";

interface WeeklyData {
  day: string;
  present: number;
  leave: number;
  late: number;
  absent: number;
}

const COLORS = {
  present: { main: "#10B981", gradient: ["#10B981", "#059669"] },
  leave: { main: "#8B5CF6", gradient: ["#8B5CF6", "#7C3AED"] },
  late: { main: "#F59E0B", gradient: ["#F59E0B", "#D97706"] },
  absent: { main: "#EF4444", gradient: ["#EF4444", "#DC2626"] },
};

function StatisticsPage() {
  const [data, setData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    present: 0,
    leave: 0,
    late: 0,
    absent: 0,
  });

  useEffect(() => {
    setLoading(true);
    fetch("/api/charts/weekly")
      .then((res) => res.json())
      .then((d) => {
        const weeklyData = d.data || [];
        setData(weeklyData);

        // Calculate totals from entire week data (convert BigInt to Number)
        const weekTotals = weeklyData.reduce(
          (acc: { present: number; leave: number; late: number; absent: number }, day: WeeklyData) => ({
            present: acc.present + Number(day.present || 0),
            leave: acc.leave + Number(day.leave || 0),
            late: acc.late + Number(day.late || 0),
            absent: acc.absent + Number(day.absent || 0),
          }),
          { present: 0, leave: 0, late: 0, absent: 0 }
        );
        setTotals(weekTotals);
      })
      .catch((err) => {
        console.error("Error fetching weekly data:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const total = totals.present + totals.leave + totals.late + totals.absent || 1;
  const pieData = [
    { name: "เข้าร่วม", value: totals.present, color: COLORS.present.main },
    { name: "ลา", value: totals.leave, color: COLORS.leave.main },
    { name: "สาย", value: totals.late, color: COLORS.late.main },
    { name: "ขาด", value: totals.absent, color: COLORS.absent.main },
  ];

  // Format percentage - show integer if whole number, otherwise 1 decimal
  const formatPercentage = (value: number) => {
    const pct = (value / total) * 100;
    return pct % 1 === 0 ? pct.toString() : pct.toFixed(1);
  };

  const statCards = [
    {
      label: "เข้าร่วม",
      value: totals.present,
      icon: CheckCircle,
      color: COLORS.present.main,
      bgColor: "bg-emerald-50",
      percentage: formatPercentage(totals.present),
    },
    {
      label: "ลา",
      value: totals.leave,
      icon: Pause,
      color: COLORS.leave.main,
      bgColor: "bg-violet-50",
      percentage: formatPercentage(totals.leave),
    },
    {
      label: "สาย",
      value: totals.late,
      icon: Clock,
      color: COLORS.late.main,
      bgColor: "bg-amber-50",
      percentage: formatPercentage(totals.late),
    },
    {
      label: "ขาด",
      value: totals.absent,
      icon: XCircle,
      color: COLORS.absent.main,
      bgColor: "bg-red-50",
      percentage: formatPercentage(totals.absent),
    },
  ];

  if (loading) {
    return <SkeletonStatistics />;
  }

  return (
    <main className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <ChartArea className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              สถิติการเช็คชื่อ
            </h1>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <Day />
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          <span className="text-sm text-gray-600">ข้อมูลรายสัปดาห์</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`relative overflow-hidden ${stat.bgColor} rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group`}
            >
              {/* Background decoration */}
              <div
                className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-20 group-hover:opacity-30 transition-opacity"
                style={{ backgroundColor: stat.color }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </span>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12"
                    style={{ backgroundColor: stat.color + "20" }}
                  >
                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                </div>
                <div
                  className="text-3xl font-bold mb-1"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(parseFloat(stat.percentage), 100)}%`,
                        backgroundColor: stat.color,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{stat.percentage}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartArea className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              สถิติรายวัน
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 20, bottom: 30, left: 0 }}
            >
              <defs>
                <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.present.gradient[0]} />
                  <stop offset="100%" stopColor={COLORS.present.gradient[1]} />
                </linearGradient>
                <linearGradient id="leaveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.leave.gradient[0]} />
                  <stop offset="100%" stopColor={COLORS.leave.gradient[1]} />
                </linearGradient>
                <linearGradient id="lateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.late.gradient[0]} />
                  <stop offset="100%" stopColor={COLORS.late.gradient[1]} />
                </linearGradient>
                <linearGradient id="absentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.absent.gradient[0]} />
                  <stop offset="100%" stopColor={COLORS.absent.gradient[1]} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    present: "เข้าร่วม",
                    leave: "ลา",
                    late: "สาย",
                    absent: "ขาด",
                  };
                  return <span className="text-sm text-gray-600">{labels[value] || value}</span>;
                }}
              />
              <Bar
                dataKey="present"
                fill="url(#presentGradient)"
                radius={[4, 4, 0, 0]}
                name="present"
              />
              <Bar
                dataKey="leave"
                fill="url(#leaveGradient)"
                radius={[4, 4, 0, 0]}
                name="leave"
              />
              <Bar
                dataKey="late"
                fill="url(#lateGradient)"
                radius={[4, 4, 0, 0]}
                name="late"
              />
              <Bar
                dataKey="absent"
                fill="url(#absentGradient)"
                radius={[4, 4, 0, 0]}
                name="absent"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-violet-100 rounded-lg">
              <ChartPie className="w-5 h-5 text-violet-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              สัดส่วนการเข้าร่วม
            </h2>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value) => [`${value ?? 0} คน`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex flex-wrap md:flex-col gap-3 justify-center">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">{entry.name}</span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: entry.color }}
                  >
                    {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="mt-4 text-center p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              <span className="text-gray-600">จำนวนทั้งหมด</span>
              <span className="text-xl font-bold text-gray-900">{total}</span>
              <span className="text-gray-500">รายการ</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default StatisticsPage;
