import { LRUCache } from "lru-cache";
export const limiter = new LRUCache({
    max: 1000,
    ttl: 60 * 1000,
    updateAgeOnGet: false,
});
// จำกัดการเข้าสู่ระบบ ภายใน 1 นาที
export function checkRatelimit(ip, limit = 5) {
    const count = limiter.get(ip) || 0;
    if (count >= limit)
        return false;
    limiter.set(ip, count + 1);
    return true;
}
