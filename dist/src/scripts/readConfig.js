import fs from "fs";
import path from "path";
export default function readConfig() {
    const configPath = path.join(process.cwd(), "config", "settings.json");
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
}
