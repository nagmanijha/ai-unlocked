import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import * as fs from 'fs';
import * as path from 'path';

import { config } from './config';
import { logger } from './config/logger';
import { testConnection } from './database/connection';
import { cosmosService } from './azure/cosmosClient';
import { searchService } from './azure/searchClient';
import { storageService } from './azure/storageClient';
import { audioPipeline } from './azure/processAudio';
import { redisService } from './azure/redisClient';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import callsRoutes from './modules/calls/calls.routes';
import knowledgeRoutes from './modules/knowledge/knowledge.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import settingsRoutes from './modules/settings/settings.routes';

const app = express();
const server = createServer(app);

// ─── Security & Middleware ──────────────────────────────────────────────────

app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(
    morgan('short', {
        stream: { write: (message: string) => logger.info(message.trim()) },
    })
);

// Rate limiting — 100 requests per 15 minutes per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// ─── API Routes ─────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);

// Ensure public directories exist
const summariesDir = path.join(process.cwd(), 'public', 'summaries');
if (!fs.existsSync(summariesDir)) fs.mkdirSync(summariesDir, { recursive: true });

// Statically serve the 'public' directory at the root /
app.use(express.static(path.join(process.cwd(), 'public')));

// ─── User Portal Endpoints ──────────────────────────────────────────────────

// Return a list of all summaries
app.get('/api/summaries', (_req, res) => {
    try {
        const files = fs.readdirSync(summariesDir)
            .filter(f => f.endsWith('.txt'))
            .map(file => {
                const stats = fs.statSync(path.join(summariesDir, file));
                return {
                    filename: file,
                    url: `http://localhost:${config.port}/summaries/${file}`,
                    createdAt: stats.mtime
                };
            })
            // Sort newest first
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        res.json({ success: true, data: files });
    } catch (err) {
        logger.error('[API] Failed to read summaries directory', err);
        res.status(500).json({ success: false, error: 'Failed to retrieve summaries' });
    }
});

// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            service: 'AskBox Admin API',
            team: 'Team Node — Nagmani Jha',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        },
    });
});

// ─── WebSocket for Real-time Dashboard Updates ──────────────────────────────

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws: WebSocket) => {
    logger.info('WebSocket client connected');

    // Send initial data
    ws.send(JSON.stringify({ type: 'connected', message: 'Connected to AskBox real-time feed' }));

    // Simulated real-time metrics broadcast (replace with actual ACS events in production)
    const interval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(
                JSON.stringify({
                    type: 'metrics',
                    data: {
                        activeCallsCount: Math.floor(Math.random() * 20) + 1,
                        callsPerMinute: Math.floor(Math.random() * 10) + 1,
                        avgResponseTime: (Math.random() * 2 + 0.5).toFixed(2),
                        timestamp: new Date().toISOString(),
                    },
                })
            );
        }
    }, 5000);

    ws.on('close', () => {
        clearInterval(interval);
        logger.info('WebSocket client disconnected');
    });
});

// ─── ACS Audio Streaming Pipeline ───────────────────────────────────────────
const acsWss = new WebSocketServer({ noServer: true });

acsWss.on('connection', (ws: WebSocket, req: any) => {
    // Pass the real-time byte stream to the customized Audio processing pipeline
    audioPipeline.handleConnection(ws, req);
});

// ─── ACS Incoming Call Webhook ──────────────────────────────────────────────
// Phase 1, Checkpoint 1: ACS triggers this webhook when a toll-free call arrives.
// We answer the call and redirect audio to the WebSocket pipeline.
app.post('/api/acs/incoming-call', (req, res) => {
    const incomingCallContext = req.body?.incomingCallContext;
    const callerNumber = req.body?.from?.phoneNumber?.value || 'unknown';

    logger.info(`[ACS Webhook] Incoming call from ${callerNumber}`);

    // Respond to ACS with an "Answer" action pointing to our WebSocket
    res.json({
        values: [{
            action: {
                type: 'Microsoft.Communication.Answer',
                callbackUri: `ws://${req.headers.host}/acs-audio`,
                incomingCallContext,
                mediaStreamingOptions: {
                    transportUrl: `ws://${req.headers.host}/acs-audio`,
                    transportType: 'websocket',
                    contentType: 'audio',
                    audioChannelType: 'unmixed',
                },
            },
        }],
    });
});

// ─── Active Sessions Endpoint (for admin dashboard) ────────────────────────
app.get('/api/calls/active-sessions', (_req, res) => {
    res.json({
        success: true,
        data: {
            activeSessions: audioPipeline.getActiveSessionCount(),
        },
    });
});

// ─── Error Handling ─────────────────────────────────────────────────────────

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// Centralized error handler
app.use(errorHandler);

// ─── Server Startup ─────────────────────────────────────────────────────────

async function startServer(): Promise<void> {
    try {
        // Test database connection
        await testConnection();

        // Initialize Azure services
        await cosmosService.initialize();
        searchService.initialize();
        await redisService.initialize();
        await storageService.initialize();

        // Add robust HTTP Upgrade handling for multiple WebSocket paths
        server.on('upgrade', (request, socket, head) => {
            const pathname = request.url?.split('?')[0];
            const origin = request.headers.origin || 'unknown';

            logger.info(`[Upgrade] Incoming connection: ${pathname} from ${origin}`);

            if (pathname === '/ws') {
                wss.handleUpgrade(request, socket, head, (ws) => {
                    wss.emit('connection', ws, request);
                });
            } else if (pathname === '/acs-audio' || request.url?.includes('callId=')) {
                acsWss.handleUpgrade(request, socket, head, (ws) => {
                    acsWss.emit('connection', ws, request);
                });
            } else {
                logger.warn(`[Upgrade] Path rejected: ${pathname}`);
                socket.destroy();
            }
        });

        // Start HTTP server
        server.listen(config.port, '::', () => {
            logger.info(`
╔══════════════════════════════════════════════════╗
║         AskBox Admin Backend Running !           ║
║        AI for Social Good — Nagmani Jha          ║
╠══════════════════════════════════════════════════╣
║  REST API:  http://localhost:${config.port}/api         ║
║  WebSocket: ws://localhost:${config.port}/ws            ║
║  Health:    http://localhost:${config.port}/api/health   ║
║  Env:       ${config.nodeEnv.padEnd(36)}║
╚══════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        logger.error('Failed to start server', { error });
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received — shutting down gracefully');
    server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
    logger.info('SIGINT received — shutting down');
    server.close(() => process.exit(0));
});

startServer();

export default app;
