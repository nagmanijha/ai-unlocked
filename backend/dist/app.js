"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const ws_1 = require("ws");
const config_1 = require("./config");
const logger_1 = require("./config/logger");
const connection_1 = require("./database/connection");
const cosmosClient_1 = require("./azure/cosmosClient");
const searchClient_1 = require("./azure/searchClient");
const storageClient_1 = require("./azure/storageClient");
const processAudio_1 = require("./azure/processAudio");
const redisClient_1 = require("./azure/redisClient");
const errorHandler_1 = require("./middleware/errorHandler");
// Route imports
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const calls_routes_1 = __importDefault(require("./modules/calls/calls.routes"));
const knowledge_routes_1 = __importDefault(require("./modules/knowledge/knowledge.routes"));
const analytics_routes_1 = __importDefault(require("./modules/analytics/analytics.routes"));
const settings_routes_1 = __importDefault(require("./modules/settings/settings.routes"));
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// ─── Security & Middleware ──────────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: config_1.config.corsOrigin, credentials: true }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging
app.use((0, morgan_1.default)('short', {
    stream: { write: (message) => logger_1.logger.info(message.trim()) },
}));
// Rate limiting — 100 requests per 15 minutes per IP
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);
// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', auth_routes_1.default);
app.use('/api/calls', calls_routes_1.default);
app.use('/api/knowledge', knowledge_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/settings', settings_routes_1.default);
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
const wss = new ws_1.WebSocketServer({ noServer: true });
wss.on('connection', (ws) => {
    logger_1.logger.info('WebSocket client connected');
    // Send initial data
    ws.send(JSON.stringify({ type: 'connected', message: 'Connected to AskBox real-time feed' }));
    // Simulated real-time metrics broadcast (replace with actual ACS events in production)
    const interval = setInterval(() => {
        if (ws.readyState === ws_1.WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'metrics',
                data: {
                    activeCallsCount: Math.floor(Math.random() * 20) + 1,
                    callsPerMinute: Math.floor(Math.random() * 10) + 1,
                    avgResponseTime: (Math.random() * 2 + 0.5).toFixed(2),
                    timestamp: new Date().toISOString(),
                },
            }));
        }
    }, 5000);
    ws.on('close', () => {
        clearInterval(interval);
        logger_1.logger.info('WebSocket client disconnected');
    });
});
// ─── ACS Audio Streaming Pipeline ───────────────────────────────────────────
const acsWss = new ws_1.WebSocketServer({ noServer: true });
acsWss.on('connection', (ws, req) => {
    // Pass the real-time byte stream to the customized Audio processing pipeline
    processAudio_1.audioPipeline.handleConnection(ws, req);
});
// ─── ACS Incoming Call Webhook ──────────────────────────────────────────────
// Phase 1, Checkpoint 1: ACS triggers this webhook when a toll-free call arrives.
// We answer the call and redirect audio to the WebSocket pipeline.
app.post('/api/acs/incoming-call', (req, res) => {
    const incomingCallContext = req.body?.incomingCallContext;
    const callerNumber = req.body?.from?.phoneNumber?.value || 'unknown';
    logger_1.logger.info(`[ACS Webhook] Incoming call from ${callerNumber}`);
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
            activeSessions: processAudio_1.audioPipeline.getActiveSessionCount(),
        },
    });
});
// ─── Error Handling ─────────────────────────────────────────────────────────
// 404 handler
app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});
// Centralized error handler
app.use(errorHandler_1.errorHandler);
// ─── Server Startup ─────────────────────────────────────────────────────────
async function startServer() {
    try {
        // Test database connection
        await (0, connection_1.testConnection)();
        // Initialize Azure services
        await cosmosClient_1.cosmosService.initialize();
        searchClient_1.searchService.initialize();
        await redisClient_1.redisService.initialize();
        await storageClient_1.storageService.initialize();
        // Add robust HTTP Upgrade handling for multiple WebSocket paths
        server.on('upgrade', (request, socket, head) => {
            const pathname = request.url?.split('?')[0];
            if (pathname === '/ws') {
                wss.handleUpgrade(request, socket, head, (ws) => {
                    wss.emit('connection', ws, request);
                });
            }
            else if (pathname === '/acs-audio' || request.url?.includes('callId=')) {
                acsWss.handleUpgrade(request, socket, head, (ws) => {
                    acsWss.emit('connection', ws, request);
                });
            }
            else {
                socket.destroy();
            }
        });
        // Start HTTP server
        server.listen(config_1.config.port, '0.0.0.0', () => {
            logger_1.logger.info(`
╔══════════════════════════════════════════════════╗
║         AskBox Admin Backend Running !           ║
║        AI for Social Good — Nagmani Jha          ║
╠══════════════════════════════════════════════════╣
║  REST API:  http://localhost:${config_1.config.port}/api         ║
║  WebSocket: ws://localhost:${config_1.config.port}/ws            ║
║  Health:    http://localhost:${config_1.config.port}/api/health   ║
║  Env:       ${config_1.config.nodeEnv.padEnd(36)}║
╚══════════════════════════════════════════════════╝
      `);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server', { error });
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received — shutting down gracefully');
    server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT received — shutting down');
    server.close(() => process.exit(0));
});
startServer();
exports.default = app;
//# sourceMappingURL=app.js.map