import fs from "fs";
import path from "path";
const pathFile = path.join(process.cwd(), "config", "holidays.json");
const holidays = JSON.parse(fs.readFileSync(pathFile, "utf-8"));
export function Holiday(dateStr) {
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    const day = date.getDay();
    if (day === 0 || day === 6)
        return { isHoliday: true, name: day === 0 ? "วันอาทิตย์" : "วันเสาร์" };
    const formatted = date.toISOString().slice(0, 10);
    const holiday = holidays.find((h) => h.date === formatted);
    if (holiday)
        return { isHoliday: true, name: holiday.name };
    return { isHoliday: false, name: "" };
}
