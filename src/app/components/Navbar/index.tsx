"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import logo from "../../assets/logo.png";
import Link from "next/link";
import { Clock, Calendar, LogIn } from "lucide-react";
import Timer from "../date-time/timer";
import Day from "../date-time/day";
import type { Route } from "next";
import NotificationBell from "../NotificationBell";
import UserInfo from "../UserInfo";

function NavBar({ session }: { session?: any }) {
  const [currentDate] = useState(Day());
  const [component, setComponent] = useState("");
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobile(isMobile);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <header className="flex items-center bg-white w-auto max-h-50 border-b-2 border-[#009EA3]">
      <Image
        src={logo}
        width={40}
        height={40}
        alt="logo"
        className="m-1 sm:m-2"
      />
      <h2 className="text-sm sm:text-lg font-bold cursor-default">
        PKW SERVICE SYSTEM
      </h2>
      <div className="flex items-center justify-end ml-auto gap-2 ">
        <div className="relative flex items-center sm:mr-2">
          <Calendar
            className="sm:mr-2 cursor-pointer"
            width={12}
            height={12}
            onClick={() => {
              setComponent("date");
              setTimeout(() => {
                setComponent("");
              }, 3000);
            }}
          />
          <p className="hidden md:inline text-xs cursor-context-menu">
            {currentDate}
          </p>
          {component === "date" && (
            <span className="absolute left-1/2 transform -translate-x-1/2 px-2 py-1 z-50 bg-gray-500 text-white text-xs rounded text-nowrap">
              {currentDate}
            </span>
          )}
        </div>
        <div className="relative flex items-center sm:mr-2">
          <Clock
            className="sm:mr-2 cursor-pointer"
            width={12}
            height={12}
            onClick={() => {
              setComponent("time");
              setTimeout(() => {
                setComponent("");
              }, 3000);
            }}
          />
          <p className="hidden md:inline text-xs cursor-context-menu">
            <Timer />
          </p>
          {component === "time" && (
            <span className="absolute left-1/2 transform -translate-x-1/2 px-2 py-1 z-50 bg-gray-500 text-white text-xs rounded text-nowrap">
              <Timer />
            </span>
          )}
        </div>
        {!session ? (
          <Link
            href={"/login" as Route}
            className="flex items-center p-4 text-sm text-[#009EA3]  hover:text-[#188F6D] hover:transition-colors"
            title="เข้าสู่ระบบ"
          >
            <LogIn width={15} height={15} className="mr-1" />
            <p className="hidden sm:inline">เข้าสู่ระบบ</p>
          </Link>
        ) : (
          <div className="flex items-center">
            {/* Notification Bell */}
            <NotificationBell session={session} />
            {/* UserInfo */}
            <UserInfo session={session} isMobile={isMobile} />
          </div>
        )}
      </div>
    </header>
  );
}

export default NavBar;
