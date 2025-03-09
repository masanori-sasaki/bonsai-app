/**
 * エラーユーティリティのテスト
 */

import {
  ErrorCode,
  AppError,
  InvalidRequestError,
  UnauthorizedError,
  ForbiddenError,
  ResourceNotFoundError,
  ValidationError,
  ConflictError,
  InternalError
} from '../../../src/utils/errors';

// モジュールとして認識させるための空のエクスポート
export {};

describe('エラーユーティリティ', () => {
  describe('AppError', () => {
    it('正しくインスタンス化されること', () => {
      const error = new AppError(ErrorCode.INTERNAL_ERROR, 'テストエラー', 500);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('AppError');
      expect(error.message).toBe('テストエラー');
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.details).toBeUndefined();
    });

    it('詳細情報を含めて正しくインスタンス化されること', () => {
      const details = { field: 'username', reason: 'required' };
      const error = new AppError(ErrorCode.VALIDATION_ERROR, 'バリデーションエラー', 400, details);
      
      expect(error.details).toEqual(details);
    });

    it('APIエラーレスポンスに変換できること', () => {
      const details = { field: 'username', reason: 'required' };
      const error = new AppError(ErrorCode.VALIDATION_ERROR, 'バリデーションエラー', 400, details);
      
      const response = error.toResponse();
      
      expect(response).toEqual({
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'バリデーションエラー',
          details: details
        }
      });
    });
  });

  describe('InvalidRequestError', () => {
    it('正しくインスタンス化されること', () => {
      const error = new InvalidRequestError('無効なリクエスト');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(InvalidRequestError);
      expect(error.name).toBe('InvalidRequestError');
      expect(error.message).toBe('無効なリクエスト');
      expect(error.code).toBe(ErrorCode.INVALID_REQUEST);
      expect(error.statusCode).toBe(400);
      expect(error.details).toBeUndefined();
    });

    it('詳細情報を含めて正しくインスタンス化されること', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const error = new InvalidRequestError('無効なメールアドレス', details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('UnauthorizedError', () => {
    it('正しくインスタンス化されること', () => {
      const error = new UnauthorizedError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.name).toBe('UnauthorizedError');
      expect(error.message).toBe('認証が必要です');
      expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(error.statusCode).toBe(401);
    });

    it('カスタムメッセージで正しくインスタンス化されること', () => {
      const error = new UnauthorizedError('トークンが無効です');
      
      expect(error.message).toBe('トークンが無効です');
    });
  });

  describe('ForbiddenError', () => {
    it('正しくインスタンス化されること', () => {
      const error = new ForbiddenError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.name).toBe('ForbiddenError');
      expect(error.message).toBe('権限がありません');
      expect(error.code).toBe(ErrorCode.FORBIDDEN);
      expect(error.statusCode).toBe(403);
    });

    it('カスタムメッセージで正しくインスタンス化されること', () => {
      const error = new ForbiddenError('この操作を行う権限がありません');
      
      expect(error.message).toBe('この操作を行う権限がありません');
    });
  });

  describe('ResourceNotFoundError', () => {
    it('正しくインスタンス化されること', () => {
      const error = new ResourceNotFoundError('盆栽', 'bonsai123');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ResourceNotFoundError);
      expect(error.name).toBe('ResourceNotFoundError');
      expect(error.message).toBe('指定された盆栽が見つかりませんでした');
      expect(error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
      expect(error.statusCode).toBe(404);
      expect(error.details).toEqual({
        resourceType: '盆栽',
        resourceId: 'bonsai123'
      });
    });
  });

  describe('ValidationError', () => {
    it('正しくインスタンス化されること', () => {
      const error = new ValidationError('バリデーションエラー');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('バリデーションエラー');
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
      expect(error.details).toBeUndefined();
    });

    it('詳細情報を含めて正しくインスタンス化されること', () => {
      const details = {
        fields: [
          { name: 'username', error: 'required' },
          { name: 'email', error: 'invalid format' }
        ]
      };
      const error = new ValidationError('複数のバリデーションエラー', details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('ConflictError', () => {
    it('正しくインスタンス化されること', () => {
      const error = new ConflictError('リソースが既に存在します');
      
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ConflictError);
      expect(error.name).toBe('ConflictError');
      expect(error.message).toBe('リソースが既に存在します');
      expect(error.code).toBe(ErrorCode.CONFLICT);
      expect(error.statusCode).toBe(409);
      expect(error.details).toBeUndefined();
    });

    it('詳細情報を含めて正しくインスタンス化されること', () => {
      const details = { existingId: 'user123' };
      const error = new ConflictError('ユーザーが既に存在します', details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('InternalError', () => {
    it('正しくインスタンス化されること', () => {
      const error = new InternalError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(InternalError);
      expect(error.name).toBe('InternalError');
      expect(error.message).toBe('サーバー内部エラーが発生しました');
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.statusCode).toBe(500);
    });

    it('カスタムメッセージで正しくインスタンス化されること', () => {
      const error = new InternalError('データベース接続エラー');
      
      expect(error.message).toBe('データベース接続エラー');
    });
  });
});
