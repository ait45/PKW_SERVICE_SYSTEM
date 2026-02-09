export function getIP(req) {
    return (req.headers.get("x-forwarded-for")?.split(",")[0] ||
        req.headers.get("x-real-ip") ||
        "unknown" ||
        "127.0.0.1");
}
