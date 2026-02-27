import express from "express";
import type {
  Request as ExpressRequest,
  Response,
  NextFunction,
} from "express";
import next from "next";
import rateLimit from "express-rate-limit";
import "dotenv/config";
import cron from "node-cron";
import { autoCutoffWithRetry } from "./src/scripts/checkCutoff";
import { sendDailyReport } from "./src/scripts/dailyReport";
import path from "path";
import fs from "fs";
import cookie from "cookie";
import { getToken } from "next-auth/jwt";

// Environment variables
const dev: boolean = process.env.NODE_ENV !== "production";
const hostname: string = "[0.0.0.0]";
const port: number = Number(process.env.PORT) || 3000;

// setting ratelimit api

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = next({ dev, hostname, port, turbopack: dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  /* The code `server.set('trust proxy', 1);` is setting the trust proxy setting in the Express server.
  This setting is used to indicate to the server that it is behind a proxy and to trust the
  X-Forwarded-* headers set by the proxy. */
  server.set("trust proxy", 1);

  server.use("/api", limiter);

  server.use(async (req: ExpressRequest, res: Response, next: NextFunction) => {
    const pathname = req.path;

    try {
      const cookies = req.headers.cookie
        ? cookie.parse(req.headers.cookie)
        : {};
      req.cookies = cookies;

      // อ่านสถานะระบบ
      const systemPath = path.join(process.cwd(), "config", "system.json");
      let systemStatus = { main_active: true };
      try {
        if (fs.existsSync(systemPath)) {
          systemStatus = JSON.parse(fs.readFileSync(systemPath, "utf8"));
        } else {
          console.warn("system.json not found, defaulting to active:true");
        }
      } catch (error) {
        console.error("Error reading system.json:", error);
      }

      // หน้าที่ยกเว้นจากการ redirect
      const allowedPaths = [
        "/notFound",
        "/teacher",
        "/api",
        "/settings",
        "/login",
        "/_next",
        "/favicon.ico",
      ];
      // ✅ ข้ามถ้าเป็น asset ภายใน Next.js เช่น /_next หรือ /__nextjs_*
      const isInternalAsset =
        pathname.startsWith("/_next") ||
        pathname.startsWith("/__nextjs") ||
        pathname.includes(".woff2") ||
        pathname.includes(".js") ||
        pathname.includes(".css");

      const isAllowed: boolean = allowedPaths.some((p) =>
        pathname.startsWith(p),
      );

      if (!pathname.startsWith("/api/auth")) {
        const token = await getToken({
          req: {
            headers: req.headers as Record<string, string>,
          },
          secret: process.env.NEXTAUTH_SECRET,
          secureCookie: false,
        });
        // ถ้าระบบปิด + ไม่ใช่ path ที่อนุญาต + ไม่ใช่หน้าแรก
        if (
          !systemStatus.main_active &&
          !isAllowed &&
          !isInternalAsset &&
          pathname !== "/"
        ) {
          // ✅ ใช้ AND (&&) ไม่ใช่ OR (||)
          const isTeacherOrAdmin: boolean =
            token?.role === "teacher" && token?.isAdmin === true;
          const notAuthOrSystemOff =
            !pathname.startsWith("/api/auth") &&
            !pathname.startsWith("/notFound");

          if (!isTeacherOrAdmin && notAuthOrSystemOff && !res.headersSent) {
            res.setHeader("Set-Cookie", [
              "next-auth.session-token=; Max-Age=0; Path=/;",
              "__Secure-next-auth.session-token=; Max-Age=0; Path=/;",
            ]);
            console.log("Redirecting to /notFound from:", pathname);
            res.writeHead(302, { Location: "/notFound" });
            return res.end(); // ✅ หยุดการทำงานหลัง redirect
          }
        }
      }

      next(); // ไป middleware ถัดไป ถ้ายังไม่ redirect
    } catch (error) {
      console.error("Middleware error:", error);
      next(); // อย่าลืมเรียก next() ตอน error เพื่อไม่ให้ request ค้าง
    }
  });

  server.all("/api/auth/:path", (req: ExpressRequest, res: Response) =>
    handle(req, res),
  );
  server.all(/.*/, (req: ExpressRequest, res: Response) => handle(req, res));

  server.listen(port, (err?) => {
    if (err) throw err;
    console.log(`> Start Server Successfully-----------------`);
    console.log(`> Server ready on http://${hostname}:${port}`);

    // Initial autoCutoff run on server start
    (async () => {
      try {
        console.log("> Running initial autoCutoff check...");
        const result = await autoCutoffWithRetry();
        if (result.skipped) {
          console.log(`> Initial autoCutoff skipped: ${result.reason}`);
        } else if (result.success) {
          console.log(
            `> Initial autoCutoff completed: ${result.studentsMarked} students marked`,
          );
        }
      } catch (err) {
        console.error("> Initial autoCutoff error:", err);
      }
    })();

    // setInterval autoCutoff - ทุก 10 นาที
    setInterval(async () => {
      try {
        const result = await autoCutoffWithRetry();
        if (!result.skipped && result.success) {
          console.log(
            `[autoCutoff] Completed: ${result.studentsMarked} students marked absent`,
          );
        }
      } catch (err) {
        console.error("[autoCutoff] Error:", err);
      }
    }, 600000);

    // setInterval test log
    setInterval(() => {
      const now = new Date();
      console.log("วันที่: ", now.toLocaleDateString("th-TH"));
      console.log(
        "เวลา: ",
        now.toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }, 60000); // ทุก 1 นาที

    // 🔔 Cron job: ส่งรายงานประจำวัน ทุกวันจันทร์-ศุกร์ เวลา 09:00
    cron.schedule(
      "0 9 * * 1-5",
      async () => {
        console.log("[cron] Running daily attendance report...");
        //if (true) return;
        try {
          const result = await sendDailyReport();
          if (result.success) {
            console.log(
              `[cron] Daily report sent to ${result.userCount} users`,
            );
          } else {
            console.log(`[cron] Daily report failed: ${result.message}`);
          }
        } catch (err) {
          console.error("[cron] Daily report error:", err);
        }
      },
      {
        timezone: "Asia/Bangkok",
      },
    );
    console.log("> Daily report cron scheduled (09:00 Mon-Fri, Asia/Bangkok)");
  });
});
