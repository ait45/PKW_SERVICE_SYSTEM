import pino from "pino";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
}, pino.transport({
  targets: [
    {
      target: 'pino-roll',
      level: 'info',
      options: {
        file: path.join(process.cwd(), 'logs', 'app'),
        frequency: 'daily',
        size: '50m',
        mkdir: true,
        extenion: '.log',
      },
    },
    {
      target: 'pino/file',
      level: 'info',
      options: { destination: 1 }, // stout
    },
    {
      target: 'pino-roll',
      level: 'error',
      options: {
        file: path.join(process.cwd(), 'logs', 'error'),
        frequency: 'daily',
        mkdir: true,
        extenion: '.log',
      },
    },
  ],
}))