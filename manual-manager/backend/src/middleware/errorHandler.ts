import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  // Log error details
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse: any = {
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

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Common error types
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = createError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

export const validationError = (message: string): AppError => {
  return createError(message, 400);
};

export const unauthorizedError = (message: string = 'Unauthorized'): AppError => {
  return createError(message, 401);
};

export const forbiddenError = (message: string = 'Forbidden'): AppError => {
  return createError(message, 403);
};

export const conflictError = (message: string): AppError => {
  return createError(message, 409);
};

export const internalServerError = (message: string = 'Internal Server Error'): AppError => {
  return createError(message, 500);
};