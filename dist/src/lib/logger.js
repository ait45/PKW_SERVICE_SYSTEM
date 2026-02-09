"use server";
import fs from "fs";
import path from "path";
export async function log(payload) {
    const entry = {
        ...payload,
        timestamp: new Date().toISOString(),
    };
    // 1) console (dev)
    if (process.env.NODE_ENV !== "production") {
        console[payload.level === "info" ? "log" : "error"](entry);
    }
    // 2) save files
    await savelog(entry);
}
async function savelog(entry) {
    const pathFile = path.join(process.cwd(), "log/system.log");
    if (!fs.existsSync(pathFile)) {
        fs.mkdirSync(pathFile, { recursive: true });
    }
    fs.appendFileSync(pathFile, JSON.stringify(entry) + "\n");
}
