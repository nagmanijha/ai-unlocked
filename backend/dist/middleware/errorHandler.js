"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = require("../config/logger");
const errors_1 = require("../shared/errors");
/**
 * Centralized error handling middleware.
 * Converts all errors to a consistent JSON response format.
 * Logs unexpected errors for debugging.
 */
function errorHandler(err, _req, res, _next) {
    // Handle known operational errors
    if (err instanceof errors_1.AppError) {
        const response = {
            success: false,
            error: err.message,
        };
        res.status(err.statusCode).json(response);
        return;
    }
    // Handle Zod validation errors
    if (err.name === 'ZodError') {
        const response = {
            success: false,
            error: 'Validation error',
            message: err.message,
        };
        res.status(400).json(response);
        return;
    }
    // Log unexpected errors
    logger_1.logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
    });
    // Send generic error in production
    const response = {
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
    };
    res.status(500).json(response);
}
//# sourceMappingURL=errorHandler.js.map