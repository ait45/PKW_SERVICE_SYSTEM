export const dynamic = "force-dynamic";

export async function GET() {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            // บอก client ว่าเชื่อมต่อสำเร็จ
            controller.enqueue(
                encoder.encode(
                    `data: ${JSON.stringify({
                        type: "connected",
                        timestamp: Date.now(),
                    })}\n\n`
                )
            );

            // heartbeat ทุก 5 วินาที
            const interval = setInterval(() => {
                try {
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({
                                type: "heartbeat",
                                timestamp: Date.now(),
                            })}\n\n`
                        )
                    );
                } catch {
                    clearInterval(interval);
                }
            }, 5000);
        },

        cancel() {
            console.log("Monitor client disconnected");
        },
    });

    return new Response(stream, {
        status: 200,
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        },
    });
}