"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  // Handle countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle redirect when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      router.back();
    }
  }, [countdown, router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        padding: "24px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* 404 */}
      <h1
        style={{
          fontSize: "120px",
          fontWeight: "700",
          color: "#1e293b",
          margin: "0",
          lineHeight: "1",
        }}
      >
        404
      </h1>

      {/* Message */}
      <h2
        style={{
          fontSize: "20px",
          color: "#475569",
          marginTop: "16px",
          marginBottom: "24px",
          fontWeight: "500",
        }}
      >
        ไม่พบหน้าที่ต้องการ
      </h2>

      {/* Countdown */}
      <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>
        กำลังนำคุณกลับไปหน้าหลักใน <strong>{countdown}</strong> วินาที
      </p>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            background: "#fff",
            color: "#475569",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          ← ย้อนกลับ
        </button>

        <button
          onClick={() => router.replace("/login" as Route)}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: "#1e293b",
            color: "#fff",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          เข้าสู่ระบบ
        </button>
      </div>
    </main>
  );
}
