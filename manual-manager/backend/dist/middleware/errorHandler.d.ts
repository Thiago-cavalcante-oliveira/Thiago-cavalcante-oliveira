import { Request, Response, NextFunction } from 'express';
export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}
export declare const errorHandler: (error: AppError, req: Request, res: Response, next: NextFunction) => void;
export declare const createError: (message: string, statusCode?: number) => AppError;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const notFound: (req: Request, res: Response, next: NextFunction) => void;
export declare const validationError: (message: string) => AppError;
export declare const unauthorizedError: (message?: string) => AppError;
export declare const forbiddenError: (message?: string) => AppError;
export declare const conflictError: (message: string) => AppError;
export declare const internalServerError: (message?: string) => AppError;
//# sourceMappingURL=errorHandler.d.ts.map