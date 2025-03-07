/**
 * エラーユーティリティ
 * 
 * このファイルはアプリケーション全体で使用するエラー関連のユーティリティを提供します。
 */

/**
 * エラーコード
 */
export enum ErrorCode {
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

/**
 * APIエラーレスポンス
 */
export interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, any>;
  };
}

/**
 * アプリケーションエラークラス
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, any>;

  constructor(code: ErrorCode, message: string, statusCode: number, details?: Record<string, any>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  /**
   * APIエラーレスポンスに変換
   */
  toResponse(): ApiErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details
      }
    };
  }
}

/**
 * 無効なリクエストエラー
 */
export class InvalidRequestError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.INVALID_REQUEST, message, 400, details);
    this.name = 'InvalidRequestError';
  }
}

/**
 * 認証エラー
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = '認証が必要です') {
    super(ErrorCode.UNAUTHORIZED, message, 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * 権限エラー
 */
export class ForbiddenError extends AppError {
  constructor(message: string = '権限がありません') {
    super(ErrorCode.FORBIDDEN, message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * リソース未検出エラー
 */
export class ResourceNotFoundError extends AppError {
  constructor(resourceType: string, resourceId: string) {
    super(
      ErrorCode.RESOURCE_NOT_FOUND,
      `指定された${resourceType}が見つかりませんでした`,
      404,
      { resourceType, resourceId }
    );
    this.name = 'ResourceNotFoundError';
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * 競合エラー
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ErrorCode.CONFLICT, message, 409, details);
    this.name = 'ConflictError';
  }
}

/**
 * 内部エラー
 */
export class InternalError extends AppError {
  constructor(message: string = 'サーバー内部エラーが発生しました') {
    super(ErrorCode.INTERNAL_ERROR, message, 500);
    this.name = 'InternalError';
  }
}
