import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

type Context = { processId: string; processType: string; startedAt: number }
const als = new AsyncLocalStorage<Context>();

export function runWithLogContext<T>(processType: string, fn: () => T): T {
    const context = { processId: randomUUID(), processType, startedAt: Date.now() };
    return als.run(context, fn);


}

export function getLogContext() {
    return als.getStore();
}