"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.internalServerError = exports.conflictError = exports.forbiddenError = exports.unauthorizedError = exports.validationError = exports.notFound = exports.asyncHandler = exports.createError = exports.errorHandler = void 0;
const errorHandler = (error, req, res, next) => {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    console.error('Error:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorResponse = {
        error: message,
        status: statusCode,
        timestamp: new Date().toISOString(),
        path: req.url
    };
    if (isDevelopment) {
        errorResponse.stack = error.stack;
        errorResponse.details = error;
    }
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
exports.createError = createError;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
const notFound = (req, res, next) => {
    const error = (0, exports.createError)(`Not found - ${req.originalUrl}`, 404);
    next(error);
};
exports.notFound = notFound;
const validationError = (message) => {
    return (0, exports.createError)(message, 400);
};
exports.validationError = validationError;
const unauthorizedError = (message = 'Unauthorized') => {
    return (0, exports.createError)(message, 401);
};
exports.unauthorizedError = unauthorizedError;
const forbiddenError = (message = 'Forbidden') => {
    return (0, exports.createError)(message, 403);
};
exports.forbiddenError = forbiddenError;
const conflictError = (message) => {
    return (0, exports.createError)(message, 409);
};
exports.conflictError = conflictError;
const internalServerError = (message = 'Internal Server Error') => {
    return (0, exports.createError)(message, 500);
};
exports.internalServerError = internalServerError;
//# sourceMappingURL=errorHandler.js.map