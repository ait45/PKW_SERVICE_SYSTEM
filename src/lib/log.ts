import { logger } from './logger';
import { getLogContext } from './log-context';

export function log(level: 'info' | 'warn' | 'error', msg: string, extra: object = {}) {
    const ctx = getLogContext();
    logger[level]({ ...ctx, ...extra }, msg)
}