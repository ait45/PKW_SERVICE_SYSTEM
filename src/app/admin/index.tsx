"use client";

import { useState, useEffect } from "react";

function Admin() {
  const [systemStatus, setSystemStatus] = useState(false);

  useEffect(() => {
    const getSystemStatus = async () => {
      const res = await fetch("/api/system-status");
      const data = await res.json();
      setSystemStatus(data.main_active);
    };
    getSystemStatus();
  }, []);
  return (
    <>
      <div>หน้า Admin</div>
      <iframe src="/teacher/admin/0" frameBorder="1" title="Admin"></iframe>
    </>
  );
}

export default Admin;
