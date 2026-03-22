/**
 * Custom application error with HTTP status code.
 * Used with centralized error handler for consistent error responses.
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(message: string, statusCode?: number, isOperational?: boolean);
}
/** 400 Bad Request */
export declare class BadRequestError extends AppError {
    constructor(message?: string);
}
/** 401 Unauthorized */
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
/** 403 Forbidden */
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
/** 404 Not Found */
export declare class NotFoundError extends AppError {
    constructor(message?: string);
}
/** 409 Conflict */
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
//# sourceMappingURL=errors.d.ts.map