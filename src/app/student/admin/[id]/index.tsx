"use client";

import React, { useState } from "react";
import type { Route } from "next";
import { signOut, useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Nav from "@/app/components/Navbar";
import Footer from "@/app/components/Footer/page";
import StudentCouncilDashboard from "@/app/components/StudentCouncilDashboard";

function Admin() {
  const { data: session, status } = useSession();

  if (session?.user?.role === "student" && status === "unauthenticated")
    redirect("/login" as Route);
  if (session?.user?.role === "teacher" && session?.user?.isAdmin === false)
    return redirect(`/teacher/${session?.id}` as Route);
  if (session?.user?.role === "teacher" && session?.user?.isAdmin === true)
    return redirect(`/teacher/admin/${session?.id}` as Route);
  if (session?.user?.role === "student" && session?.user?.isAdmin === false)
    return redirect(`/student/${session?.id}` as Route);
  if (!session && status === "unauthenticated") return redirect("/login" as Route);
  if (status === "loading") return null;
  return (
    <main>
      <Nav session={session} />
      <StudentCouncilDashboard session={session} />
      <Footer />
    </main>
  );
}

export default Admin;

