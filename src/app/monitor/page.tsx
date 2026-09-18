"use client";

import { useEffect, useState } from "react";

type Event = {
    id: string;
    timestamp: number;
    method: string;
    path: string;
    status: number;
    duration: number;
};

export default function MonitorPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const source = new EventSource(
            "/api/monitor/stream"
        );

        source.onopen = () => {
            setConnected(true);
        };

        source.onmessage = (event) => {
            const data = JSON.parse(event.data);

            setEvents((current) => {
                const next = [
                    data,
                    ...current.filter(
                        (item) => item.id !== data.id
                    ),
                ];

                return next.slice(0, 100);
            });
        };

        source.onerror = () => {
            setConnected(false);
        };

        return () => {
            source.close();
        };
    }, []);

    const errors = events.filter(
        (event) => event.status >= 500
    ).length;

    const avg =
        events.length > 0
            ? Math.round(
                events.reduce(
                    (sum, event) => sum + event.duration,
                    0
                ) / events.length
            )
            : 0;

    return (
        <main className="min-h-screen bg-[#0b1120] text-white p-4">

            <div className="max-w-6xl mx-auto">

                <header className="flex justify-between items-center mb-5">

                    <div>
                        <h1 className="text-2xl font-bold">
                            Web Monitor
                        </h1>

                        <p className="text-sm text-slate-400">
                            Next.js Application Monitor
                        </p>
                    </div>

                    <div className="flex items-center gap-2">

                        <span
                            className={`w-3 h-3 rounded-full ${connected
                                    ? "bg-green-400"
                                    : "bg-red-500"
                                }`}
                        />

                        <span className="text-sm">
                            {connected ? "LIVE" : "OFFLINE"}
                        </span>

                    </div>

                </header>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">

                    <Card
                        title="Requests"
                        value={events.length.toString()}
                    />

                    <Card
                        title="Errors"
                        value={errors.toString()}
                    />

                    <Card
                        title="Avg Response"
                        value={`${avg} ms`}
                    />

                    <Card
                        title="Stream"
                        value={connected ? "Connected" : "Disconnected"}
                    />

                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

                    <div className="px-4 py-3 border-b border-slate-800 flex justify-between">

                        <span className="font-semibold">
                            Request Activity
                        </span>

                        <span className="text-xs text-green-400">
                            REAL-TIME
                        </span>

                    </div>

                    <div className="overflow-x-auto">

                        <table className="w-full text-sm">

                            <thead className="bg-slate-950 text-slate-400">

                                <tr>
                                    <th className="text-left p-3">
                                        Time
                                    </th>

                                    <th className="text-left p-3">
                                        Method
                                    </th>

                                    <th className="text-left p-3">
                                        Path
                                    </th>

                                    <th className="text-left p-3">
                                        Status
                                    </th>

                                    <th className="text-right p-3">
                                        Response
                                    </th>
                                </tr>

                            </thead>

                            <tbody>

                                {events.map((event) => (

                                    <tr
                                        key={event.id}
                                        className="border-t border-slate-800"
                                    >

                                        <td className="p-3 text-slate-400 whitespace-nowrap">
                                            {new Date(
                                                event.timestamp
                                            ).toLocaleTimeString("th-TH")}
                                        </td>

                                        <td className="p-3 font-mono">
                                            <span
                                                className={
                                                    event.method === "POST"
                                                        ? "text-yellow-400"
                                                        : "text-blue-400"
                                                }
                                            >
                                                {event.method}
                                            </span>
                                        </td>

                                        <td className="p-3 font-mono text-xs">
                                            {event.path}
                                        </td>

                                        <td className="p-3">
                                            <span
                                                className={
                                                    event.status >= 500
                                                        ? "text-red-400"
                                                        : event.status >= 400
                                                            ? "text-yellow-400"
                                                            : "text-green-400"
                                                }
                                            >
                                                {event.status}
                                            </span>
                                        </td>

                                        <td className="p-3 text-right text-slate-400">
                                            {event.duration} ms
                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        </main>
    );
}

function Card({
    title,
    value,
}: {
    title: string;
    value: string;
}) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">

            <div className="text-xs text-slate-400">
                {title}
            </div>

            <div className="text-xl font-bold mt-1">
                {value}
            </div>

        </div>
    );
}