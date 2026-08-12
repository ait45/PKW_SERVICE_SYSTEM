"use client";
import React, { useEffect, useState } from "react";
import { Power, AlertTriangle } from "lucide-react";
import Footer from "../components/Footer/page";
import { redirect } from "next/navigation";
import type { Route } from "next";

function NotAvailable() {
  const [status, setStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const status_system = async () => {
    const res = await fetch("/api/system/toggle");
    const data = await res.json();
    setStatus(data.main_active);
    setLoading(false);
  };
  useEffect(() => {
    status_system();
  }, []);
  if (status) {
    redirect("/login" as Route);
  }
  if (loading) return null;
  return (
    <main className="w-full bg-blue-50 ">
      <div className="w-full h-screen flex justify-center items-center">
        <div className="bg-white w-[60%] h-[50%] rounded-xl shadow-2xl">
          <div className="absolute inset-0 z-0 flex justify-center items-center pointer-events-none select-none">
            <span className="fixed text-gray-400/20 text-9xl font-bold  tracking-widest">
              503
            </span>
          </div>
          <div className="flex flex-col z-50">
            <header className="mt-8 flex justify-center">
              <div className="flex justify-center mb-10">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-400/30 rounded-full blur-md animate-pulse" />
                  <div className="relative bg-white p-4 rounded-full border-4 border-red-100 transform hover:scale-110 transition-transform duration-500">
                    <Power size={40} className="text-red-400" />
                  </div>
                  {/* Rotating ring */}
                  <div
                    className="absolute inset-0 border-4 border-transparent border-t-red-400 rounded-full animate-spin"
                    style={{ animationDuration: "3s" }}
                  />
                </div>
              </div>
            </header>
            <div className="text-center">
              <div className="flex justify-center items-center">
                <AlertTriangle className="text-yellow-400 mr-2" />
                <h1 className="text-3xl font-bold">ระบบปิดปรับปรุง</h1>
              </div>
              <p className="text-sm">กรุณากลับมาอีกครั้ง ในภายหลัง</p>
            </div>
            <div className="text-xs mt-10 text-center text-blue-400 ">
              หากต้องการความช่วยเหลือ ติดต่อ{" "}
              <a href="mailto:pkw.controller@gmail.com" className="underline">
                Support
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default NotAvailable;
