"use client";
import { useEffect, useState } from "react";
import Nav from "@/app/components/Navbar";
import Footer from "@/app/components/Footer/page";
import { signOut, useSession } from "next-auth/react";
import Swal from "sweetalert2";
import type { Route } from "next";
import {
  Home,
  UserRound,
  Settings,
  FileText,
  Mail,
  Database,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import StatisticsPage from "@/app/components/Statistics/page";
import SchedulePage from "@/app/components/Schedule/page";
import StudentManagement from "@/app/components/StudentManagement/index";
import AttendanceCheckPage from "@/app/components/AttendanceCheck";
import TableAttendance from "@/app/components/TableAttendance";
import QRDownload from "@/app/components/QRDownload";
import {
  redirect,
  useRouter,
  usePathname,
  useSearchParams,
} from "next/navigation";
import Dashboard from "@/app/components/Dashboard/page";
import ReportPage from "@/app/components/Report/page";
import SettingsPage from "@/app/components/Settings/page";
import MenuBar from "@/app/components/MenuBarTeacher";
import SideBarTeacher from "@/app/components/SideBarTeacher";
import TeacherAdminBoard from "@/app/components/TeacherAdminBoard";
import TeacherBoard from "@/app/components/TeacherBoard";
import Notifications from "@/app/components/Notifications";
import EventManagement from "@/app/components/EventManagement";
import EventAttendanceCheck from "@/app/components/EventAttendanceCheck";
import EventAttendanceTable from "@/app/components/EventAttendanceTable";
import IssueReportManagement from "@/app/components/IssueReportManagement";
import PasswordResetManagement from "@/app/components/PasswordResetManagement";
import DownloadPdf from "@/app/components/QRDownload";
import BehaviorScore from "@/app/components/BehaviorScore";

function TeacherPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentPage = searchParams.get("page") || "dashboard";
  const handleChangePage = (pageName: string) => {
    router.push(`${pathname}?page=${pageName}` as Route);
  };
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

  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  Swal.close();
  if (session?.user?.role === "teacher" && status === "unauthenticated")
    redirect("/login" as Route);
  if (session?.user?.role === "teacher" && session?.user?.isAdmin === true)
    return redirect(`/teacher/admin/${session?.id}` as Route);
  if (session?.user?.role === "student" && session?.user?.isAdmin === false)
    return redirect(`/student/${session?.id}` as Route);
  if (session?.user?.role === "student" && session?.user?.isAdmin === true)
    return redirect(`/student/admin/${session?.id}` as Route);
  if (!session && status === "unauthenticated") return redirect("/login" as Route);
  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <Nav session={session} />
      {/* Navigation */}
      <MenuBar currentPage={currentPage} handleChangePage={handleChangePage} />
      <main className="flex h-screen">
        <SideBarTeacher
          activeMenu={currentPage}
          setActiveMenu={handleChangePage}
          session={session}
          onCollapseChange={(isCollapsed) => setIsSidebarOpen(!isCollapsed)}
        />
        <main
          className={`flex-1 py-1 w-full overflow-auto ${isMobile && isSidebarOpen ? "hidden" : ""
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
          {currentPage === "schedule" && <SchedulePage />}
          {currentPage === "statistics" && <StatisticsPage />}
          {currentPage === "PDFStudent" && (
            <QRDownload setBack={handleChangePage} />
          )}
          {currentPage === "reports" && <ReportPage />}
          {currentPage === "settings" && <SettingsPage />}
          {currentPage === "teachers" && (
            <TeacherAdminBoard />
          )}
          {currentPage === "teacherBoard" && (
            <TeacherBoard />
          )}
          {currentPage === "notifications" && (
            <Notifications session={session} />
          )}
          {currentPage === "behaviorScore" && <BehaviorScore />}
          {currentPage === "event" && <EventManagement session={session} />}
          {currentPage === "eventCheck" && <EventAttendanceCheck session={session} />}
          {currentPage === "eventTable" && <EventAttendanceTable session={session} />}
          {currentPage === "messages" && <IssueReportManagement />}
          {currentPage === "forgetPasswordMess" && <PasswordResetManagement />}
          {currentPage === "PDFDownload" && <DownloadPdf setBack={handleChangePage} />}
          {currentPage === "behaviorScore" && <BehaviorScore />}
        </main>
      </main>
      <Footer />
    </div>
  );
}

export default TeacherPage;
