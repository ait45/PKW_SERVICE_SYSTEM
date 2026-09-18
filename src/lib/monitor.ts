export type MonitorEvent = {
    id: string;
    timestamp: number;
    method: string;
    path: string;
    status: number;
    duration: number;
    userAgent?: string;
    ip?: string;
};

const events: MonitorEvent[] = [];

const listeners = new Set<(event: MonitorEvent) => void>();

export function addMonitorEvent(
    event: Omit<MonitorEvent, "id">
) {
    const item: MonitorEvent = {
        ...event,
        id: crypto.randomUUID(),
    };

    events.unshift(item);

    // เก็บล่าสุด 200 รายการ
    if (events.length > 200) {
        events.length = 200;
    }

    listeners.forEach((listener) => {
        listener(item);
    });
}

export function getMonitorEvents() {
    return events;
}

export function subscribeMonitor(
    listener: (event: MonitorEvent) => void
) {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}