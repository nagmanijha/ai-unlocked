import winston from 'winston';
import { config } from './index';

/** Production-grade logger with structured output */
export const logger = winston.createLogger({
    level: config.nodeEnv === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'askbox-admin' },
    transports: [
        new winston.transports.Console({
            format:
                config.nodeEnv === 'production'
                    ? winston.format.json()
                    : winston.format.combine(
                        winston.format.colorize(),
                        winston.format.printf(({ timestamp, level, message, ...meta }) => {
                            const metaStr = Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
                            return `${timestamp} [${level}]: ${message}${metaStr}`;
                        })
                    ),
        }),
    ],
});
