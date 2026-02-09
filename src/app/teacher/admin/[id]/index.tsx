"use client";
import { useEffect, useState } from "react";
import Nav from "@/app/components/Navbar";
import Footer from "@/app/components/Footer/page";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";
import type { Route } from "next";
import StatisticsPage from "@/app/components/Statistics/page";
import SchedulePage from "@/app/components/Schedule/page";
import StudentManagement from "@/app/components/StudentManagement";
import AttendanceCheckPage from "@/app/components/AttendanceCheck";
import TableAttendance from "@/app/components/TableAttendance";
import Dashboard from "@/app/components/Dashboard/page";
import ReportPage from "@/app/components/Report/page";
import QRDownload from "@/app/components/QRDownload";
import SettingsPage from "@/app/components/Settings/page";
import MenuBar from "@/app/components/MenuBarTeacher";
import Notifications from "@/app/components/Notifications";
import SideBarTeacher from "@/app/components/SideBarTeacher";
import {
  useSearchParams,
  usePathname,
  useRouter,
  redirect,
} from "next/navigation";
import EventManagement from "@/app/components/EventManagement";
import EventAttendanceCheck from "@/app/components/EventAttendanceCheck";
import EventAttendanceTable from "@/app/components/EventAttendanceTable";
import TeacherAdminBoard from "@/app/components/TeacherAdminBoard";
import TeacherBoard from "@/app/components/TeacherBoard";
import IssueReportManagement from "@/app/components/IssueReportManagement";
import PasswordResetManagement from "@/app/components/PasswordResetManagement";
import BehaviorScore from "@/app/components/BehaviorScore";

function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  Swal.close();

  const currentPage = searchParams.get("page") || "dashboard";
  const handleChangePage = (pageName: string) => {
    router.push(`${pathname}?page=${pageName}` as Route);
  };

  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto close sidebar when switching to desktop
      if (!mobile) setIsSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ตรวจสอบ session ต่างๆ
  if (session?.user?.role === "teacher" && status === "unauthenticated")
    redirect("/login" as Route);
  if (session?.user?.role === "teacher" && !session?.user?.isAdmin)
    return redirect(`/teacher/${session?.id}` as Route);
  if (session?.user?.role === "student" && !session?.user?.isAdmin)
    return redirect(`/student/${session?.id}` as Route);
  if (session?.user?.role === "student" && session?.user?.isAdmin)
    return redirect(`/student/admin/${session?.id}` as Route);
  if (!session && status === "unauthenticated") return redirect("/login" as Route);
  if (status === "loading") return null;

  return (
    <main className="min-h-screen bg-gray-100">
      <Nav session={session} />
      {/* Navigation */}
      <MenuBar currentPage={currentPage} handleChangePage={handleChangePage} />
      <div className="flex h-screen bg-linear-gradient-to-br from-blue-50 to-indigo-100 mb-4 w-full">
        <SideBarTeacher
          activeMenu={currentPage}
          setActiveMenu={handleChangePage}
          session={session}
          onCollapseChange={(isCollapsed) => setIsSidebarOpen(!isCollapsed)}
        />
        <main
          className={`flex-1 py-1 w-full overflow-y-scroll hide-scrollbar duration-300 ${isMobile && isSidebarOpen ? "hidden" : ""
            }`}
        >
          {currentPage === "dashboard" && <Dashboard />}
          {currentPage === "scan" && <AttendanceCheckPage session={session} />}
          {currentPage === "tableAttendance" && (
            <TableAttendance session={session} />
          )}
          {currentPage === "students" && (
            <StudentManagement session={session} setMenu={handleChangePage} />
          )}
          {currentPage === "PDFDownload" && (
            <QRDownload setBack={handleChangePage} />
          )}
          {currentPage === "schedule" && <SchedulePage />}
          {currentPage === "statistics" && <StatisticsPage />}
          {currentPage === "reports" && <ReportPage />}
          {currentPage === "teachers" && (
            <TeacherAdminBoard />
          )}
          {currentPage === "teacherBoard" && (
            <TeacherBoard />
          )}
          {currentPage === "settings" && <SettingsPage />}
          {currentPage === "notifications" && (
            <Notifications session={session} />
          )}
          {currentPage === "event" && <EventManagement session={session} />}
          {currentPage === "eventCheck" && <EventAttendanceCheck session={session} />}
          {currentPage === "eventTable" && <EventAttendanceTable session={session} />}
          {currentPage === "messages" && <IssueReportManagement />}
          {currentPage === "forgetPasswordMess" && <PasswordResetManagement />}
          {currentPage === "behaviorScore" && <BehaviorScore />}
        </main>
      </div>
      <Footer />
    </main>
  );
}

export default AdminPage;
