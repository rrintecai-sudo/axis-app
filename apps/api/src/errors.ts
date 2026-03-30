export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    // Maintains proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export const NOT_FOUND = (resource: string = 'Resource'): AppError =>
  new AppError('NOT_FOUND', `${resource} not found`, 404);

export const UNAUTHORIZED = (message: string = 'Unauthorized'): AppError =>
  new AppError('UNAUTHORIZED', message, 401);

export const VALIDATION_ERROR = (message: string = 'Validation error'): AppError =>
  new AppError('VALIDATION_ERROR', message, 400);

export const INTERNAL_ERROR = (message: string = 'Internal server error'): AppError =>
  new AppError('INTERNAL_ERROR', message, 500);
