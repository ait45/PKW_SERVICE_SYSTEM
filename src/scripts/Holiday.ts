import fs from "fs";
import path from "path";

const pathFile = path.join(process.cwd(), "config", "holidays.json");
const holidays = JSON.parse(fs.readFileSync(pathFile, "utf-8"));

export interface HolidayResult {
  isHoliday: boolean;
  name: string;
  type: "regular" | "auto_present" | "";
  status?: string;
}

export function Holiday(dateStr: Date | string): HolidayResult {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  const day = date.getDay();

  if (day === 0 || day === 6)
    return {
      isHoliday: true,
      name: day === 0 ? "วันอาทิตย์" : "วันเสาร์",
      type: "regular",
    };

  const formatted = date.toISOString().slice(0, 10);
  const holiday = holidays.find((h: { date: string }) => h.date === formatted);
  if (holiday)
    return {
      isHoliday: true,
      name: holiday.name,
      type: holiday.type || "regular",
      status: holiday.status,
    };

  return { isHoliday: false, name: "", type: "" };
}
