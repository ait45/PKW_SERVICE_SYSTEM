import fs from "fs";
import path from "path";

export default function readConfig() {
  const configPath: string = path.join(process.cwd(), "config", "setting.json");
  return JSON.parse(fs.readFileSync(configPath, "utf-8"));
}
