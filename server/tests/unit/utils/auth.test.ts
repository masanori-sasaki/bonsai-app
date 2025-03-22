/**
 * 認証ユーティリティのテスト
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { 
  generateToken, 
  verifyToken, 
  authMiddleware, 
  getUserIdFromRequest, 
  getTokenFromRequest,
  getUserEmailFromRequest
} from '../../../src/utils/auth';
import { UnauthorizedError } from '../../../src/utils/errors';

// モジュールとして認識させるための空のエクスポート
export {};

// jwtモジュールのモック
jest.mock('jsonwebtoken');

describe('認証ユーティリティ', () => {
  // テスト前の共通設定
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('ペイロードからJWTトークンを生成すること', () => {
      // モックの設定
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');
      
      // テスト対象の関数を実行
      const payload = { sub: 'user123', email: 'user@example.com' };
      const token = generateToken(payload);
      
      // 結果の検証
      expect(token).toBe('mock-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        expect.any(String),
        { expiresIn: '1d' }
      );
    });
  });

  describe('verifyToken', () => {
    beforeEach(() => {
      // 環境変数をリセット
      process.env.ENVIRONMENT = undefined;
      process.env.IS_LOCAL = undefined;
      process.env.IS_OFFLINE = undefined;
    });

    it('ローカル環境では有効なトークンを検証して、デコードされたペイロードを返すこと', () => {
      // ローカル環境を設定
      process.env.IS_LOCAL = 'true';
      
      // モックの設定
      const mockPayload = { sub: 'user123', email: 'user@example.com' };
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      
      // テスト対象の関数を実行
      const result = verifyToken('valid-token');
      
      // 結果の検証
      expect(result).toEqual(mockPayload);
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
    });

    it('開発環境ではトークンをデコードするだけで、デコードされたペイロードを返すこと', () => {
      // 開発環境を設定（ローカルではない）
      process.env.ENVIRONMENT = 'dev';
      process.env.IS_LOCAL = 'false';
      
      // モックの設定
      const mockPayload = { sub: 'user123', email: 'user@example.com' };
      (jwt.decode as jest.Mock).mockReturnValue(mockPayload);
      
      // テスト対象の関数を実行
      const result = verifyToken('valid-token');
      
      // 結果の検証
      expect(result).toEqual(mockPayload);
      expect(jwt.decode).toHaveBeenCalledWith('valid-token');
    });

    it('本番環境ではトークンをデコードするだけで、デコードされたペイロードを返すこと', () => {
      // 本番環境を設定
      process.env.ENVIRONMENT = 'prod';
      
      // モックの設定
      const mockPayload = { sub: 'user123', email: 'user@example.com' };
      (jwt.decode as jest.Mock).mockReturnValue(mockPayload);
      
      // テスト対象の関数を実行
      const result = verifyToken('valid-token');
      
      // 結果の検証
      expect(result).toEqual(mockPayload);
      expect(jwt.decode).toHaveBeenCalledWith('valid-token');
    });

    it('ローカル環境で無効なトークンの場合はUnauthorizedErrorをスローすること', () => {
      // ローカル環境を設定
      process.env.IS_LOCAL = 'true';
      
      // モックの設定
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      // テスト対象の関数を実行して例外をキャッチ
      expect(() => verifyToken('invalid-token')).toThrow(UnauthorizedError);
      expect(jwt.verify).toHaveBeenCalledWith('invalid-token', expect.any(String));
    });
  });

  describe('authMiddleware', () => {
    it('有効な認証ヘッダーがある場合、ユーザー情報をリクエストに追加すること', () => {
      // モックの設定
      const mockPayload = { sub: 'user123', email: 'user@example.com' };
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      
      // モックリクエスト、レスポンス、ネクスト関数の作成
      const req = {
        headers: {
          authorization: 'Bearer valid-token'
        }
      } as unknown as Request;
      
      const res = {} as Response;
      const next = jest.fn() as NextFunction;
      
      // テスト対象の関数を実行
      authMiddleware(req, res, next);
      
      // 結果の検証
      expect((req as any).user).toEqual(mockPayload);
      expect(next).toHaveBeenCalled();
    });

    it('認証ヘッダーがない場合、401エラーを返すこと', () => {
      // モックリクエスト、レスポンス、ネクスト関数の作成
      const req = {
        headers: {}
      } as unknown as Request;
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as Response;
      
      const next = jest.fn() as NextFunction;
      
      // テスト対象の関数を実行
      authMiddleware(req, res, next);
      
      // 結果の検証
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.any(String)
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('無効なトークン形式の場合、401エラーを返すこと', () => {
      // モックリクエスト、レスポンス、ネクスト関数の作成
      const req = {
        headers: {
          authorization: 'InvalidFormat'
        }
      } as unknown as Request;
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as Response;
      
      const next = jest.fn() as NextFunction;
      
      // テスト対象の関数を実行
      authMiddleware(req, res, next);
      
      // 結果の検証
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.any(String)
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('トークン検証に失敗した場合、401エラーを返すこと', () => {
      // モックの設定
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      // モックリクエスト、レスポンス、ネクスト関数の作成
      const req = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      } as unknown as Request;
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as Response;
      
      const next = jest.fn() as NextFunction;
      
      // テスト対象の関数を実行
      authMiddleware(req, res, next);
      
      // 結果の検証
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.any(String)
      }));
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('getUserIdFromRequest', () => {
    beforeEach(() => {
      // 環境変数をリセット
      process.env.ENVIRONMENT = undefined;
      process.env.IS_LOCAL = undefined;
      process.env.IS_OFFLINE = undefined;
      jest.clearAllMocks();
    });

    it('認証情報からユーザーIDを取得すること', () => {
      // モックイベントの作成
      const mockEvent = {
        requestContext: {
          authorizer: {
            claims: {
              sub: 'user123'
            }
          }
        },
        headers: {}
      } as unknown as APIGatewayProxyEvent;
      
      // テスト対象の関数を実行
      const userId = getUserIdFromRequest(mockEvent);
      
      // 結果の検証
      expect(userId).toBe('user123');
    });

    it('ローカル開発環境では固定のユーザーIDを返すこと', () => {
      // ローカル開発環境を設定
      process.env.ENVIRONMENT = 'dev';
      process.env.IS_LOCAL = 'true';
      
      // モックイベントの作成（認証情報なし）
      const mockEvent = {
        headers: {}
      } as unknown as APIGatewayProxyEvent;
      
      // テスト対象の関数を実行
      const userId = getUserIdFromRequest(mockEvent);
      
      // 結果の検証
      expect(userId).toBe('dev-user-123');
    });

    it('開発環境（ローカルではない）で認証情報が不足している場合はUnauthorizedErrorをスローすること', () => {
      // 開発環境を設定（ローカルではない）
      process.env.ENVIRONMENT = 'dev';
      process.env.IS_LOCAL = 'false';
      
      // モックイベントの作成（認証情報が不完全）
      const mockEvent = {
        requestContext: {
          authorizer: {
            claims: {}
          }
        },
        headers: {}
      } as unknown as APIGatewayProxyEvent;
      
      // テスト対象の関数を実行して例外をキャッチ
      expect(() => getUserIdFromRequest(mockEvent)).toThrow(UnauthorizedError);
    });

    it('本番環境で認証情報が不足している場合はUnauthorizedErrorをスローすること', () => {
      // 本番環境を設定
      process.env.ENVIRONMENT = 'prod';
      
      // モックイベントの作成（認証情報が不完全）
      const mockEvent = {
        requestContext: {
          authorizer: {
            claims: {}
          }
        },
        headers: {}
      } as unknown as APIGatewayProxyEvent;
      
      // テスト対象の関数を実行して例外をキャッチ
      expect(() => getUserIdFromRequest(mockEvent)).toThrow(UnauthorizedError);
    });

    it('Lambda Function URLの場合、認証ヘッダーからユーザーIDを取得すること', () => {
      // モックの設定
      const mockPayload = { sub: 'user123', email: 'user@example.com' };
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      
      // モックイベントの作成（認証ヘッダーあり）
      const mockEvent = {
        headers: {
          Authorization: 'Bearer valid-token'
        }
      } as unknown as APIGatewayProxyEvent;
      
      // テスト対象の関数を実行
      const userId = getUserIdFromRequest(mockEvent);
      
      // 結果の検証
      expect(userId).toBe('user123');
    });
  });

  describe('getTokenFromRequest', () => {
    it('認証ヘッダーからトークンを取得すること', () => {
      // モックイベントの作成
      const mockEvent = {
        headers: {
          Authorization: 'Bearer token123'
        }
      } as unknown as APIGatewayProxyEvent;
      
      // テスト対象の関数を実行
      const token = getTokenFromRequest(mockEvent);
      
      // 結果の検証
      expect(token).toBe('token123');
    });

    it('小文字の認証ヘッダーからもトークンを取得すること', () => {
      // モックイベントの作成
      const mockEvent = {
        headers: {
          authorization: 'Bearer token123'
        }
      } as unknown as APIGatewayProxyEvent;
      
      // テスト対象の関数を実行
      const token = getTokenFromRequest(mockEvent);
      
      // 結果の検証
      expect(token).toBe('token123');
    });

    it('認証ヘッダーがない場合はUnauthorizedErrorをスローすること', () => {
      // モックイベントの作成（認証ヘッダーなし）
      const mockEvent = {
        headers: {}
      } as unknown as APIGatewayProxyEvent;
      
      // テスト対象の関数を実行して例外をキャッチ
      expect(() => getTokenFromRequest(mockEvent)).toThrow(UnauthorizedError);
    });

    it('無効な認証ヘッダー形式の場合はUnauthorizedErrorをスローすること', () => {
      // モックイベントの作成（無効な形式）
      const mockEvent = {
        headers: {
          Authorization: 'InvalidFormat'
        }
      } as unknown as APIGatewayProxyEvent;
      
      // テスト対象の関数を実行して例外をキャッチ
      expect(() => getTokenFromRequest(mockEvent)).toThrow(UnauthorizedError);
    });
  });

  describe('getUserEmailFromRequest', () => {
    beforeEach(() => {
      // 環境変数をリセット
      process.env.ENVIRONMENT = undefined;
      process.env.IS_LOCAL = undefined;
      process.env.IS_OFFLINE = undefined;
      jest.clearAllMocks();
    });

    it('認証情報からメールアドレスを取得すること', () => {
      // モックイベントの作成
      const mockEvent = {
        requestContext: {
          authorizer: {
            claims: {
              email: 'user@example.com'
            }
          }
        },
        headers: {}
      } as unknown as APIGatewayProxyEvent;
      
      // テスト対象の関数を実行
      const email = getUserEmailFromRequest(mockEvent);
      
      // 結果の検証
      expect(email).toBe('user@example.com');
    });

    it('ローカル開発環境では固定のメールアドレスを返すこと', () => {
      // ローカル開発環境を設定
      process.env.ENVIRONMENT = 'dev';
      process.env.IS_LOCAL = 'true';
      
      // モックイベントの作成（認証情報なし）
      const mockEvent = {
        headers: {}
      } as unknown as APIGatewayProxyEvent;
      
      // テスト対象の関数を実行
      const email = getUserEmailFromRequest(mockEvent);
      
      // 結果の検証
      expect(email).toBe('dev-user@example.com');
    });

    it('開発環境（ローカルではない）で認証情報が不足している場合はUnauthorizedErrorをスローすること', () => {
      // 開発環境を設定（ローカルではない）
      process.env.ENVIRONMENT = 'dev';
      process.env.IS_LOCAL = 'false';
      
      // モックイベントの作成（認証情報が不完全）
      const mockEvent = {
        requestContext: {
          authorizer: {
            claims: {}
          }
        },
        headers: {}
      } as unknown as APIGatewayProxyEvent;
      
      // テスト対象の関数を実行して例外をキャッチ
      expect(() => getUserEmailFromRequest(mockEvent)).toThrow(UnauthorizedError);
    });

    it('本番環境で認証情報が不足している場合はUnauthorizedErrorをスローすること', () => {
      // 本番環境を設定
      process.env.ENVIRONMENT = 'prod';
      
      // モックイベントの作成（認証情報が不完全）
      const mockEvent = {
        requestContext: {
          authorizer: {
            claims: {}
          }
        },
        headers: {}
      } as unknown as APIGatewayProxyEvent;
      
      // テスト対象の関数を実行して例外をキャッチ
      expect(() => getUserEmailFromRequest(mockEvent)).toThrow(UnauthorizedError);
    });

    it('Lambda Function URLの場合、認証ヘッダーからメールアドレスを取得すること', () => {
      // モックの設定
      const mockPayload = { sub: 'user123', email: 'user@example.com' };
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      
      // モックイベントの作成（認証ヘッダーあり）
      const mockEvent = {
        headers: {
          Authorization: 'Bearer valid-token'
        }
      } as unknown as APIGatewayProxyEvent;
      
      // テスト対象の関数を実行
      const email = getUserEmailFromRequest(mockEvent);
      
      // 結果の検証
      expect(email).toBe('user@example.com');
    });
  });
});
