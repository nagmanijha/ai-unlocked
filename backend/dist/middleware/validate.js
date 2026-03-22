"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
const errors_1 = require("../shared/errors");
/**
 * Request validation middleware using Zod schemas.
 * Validates the request body against the provided schema.
 */
function validateBody(schema) {
    return (req, _res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            const message = error.errors
                ? error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
                : 'Invalid request body';
            next(new errors_1.BadRequestError(message));
        }
    };
}
/**
 * Validates query parameters against a Zod schema.
 */
function validateQuery(schema) {
    return (req, _res, next) => {
        try {
            req.query = schema.parse(req.query);
            next();
        }
        catch (error) {
            const message = error.errors
                ? error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
                : 'Invalid query parameters';
            next(new errors_1.BadRequestError(message));
        }
    };
}
//# sourceMappingURL=validate.js.map