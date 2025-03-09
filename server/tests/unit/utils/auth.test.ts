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
    it('有効なトークンを検証して、デコードされたペイロードを返すこと', () => {
      // モックの設定
      const mockPayload = { sub: 'user123', email: 'user@example.com' };
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      
      // テスト対象の関数を実行
      const result = verifyToken('valid-token');
      
      // 結果の検証
      expect(result).toEqual(mockPayload);
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', expect.any(String));
    });

    it('無効なトークンの場合はUnauthorizedErrorをスローすること', () => {
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
    it('認証情報からユーザーIDを取得すること', () => {
      // モックイベントの作成
      const mockEvent = {
        requestContext: {
          authorizer: {
            claims: {
              sub: 'user123'
            }
          }
        }
      } as unknown as APIGatewayProxyEvent;
      
      // テスト対象の関数を実行
      const userId = getUserIdFromRequest(mockEvent);
      
      // 結果の検証
      expect(userId).toBe('user123');
    });

    it('開発環境では固定のユーザーIDを返すこと', () => {
      // モックイベントの作成（認証情報なし）
      const mockEvent = {} as APIGatewayProxyEvent;
      
      // テスト対象の関数を実行
      const userId = getUserIdFromRequest(mockEvent);
      
      // 結果の検証
      expect(userId).toBe('dev-user-123');
    });

    it('認証情報が不足している場合はUnauthorizedErrorをスローすること', () => {
      // モックイベントの作成（認証情報が不完全）
      const mockEvent = {
        requestContext: {
          authorizer: {
            claims: {}
          }
        }
      } as unknown as APIGatewayProxyEvent;
      
      // テスト対象の関数を実行して例外をキャッチ
      expect(() => getUserIdFromRequest(mockEvent)).toThrow(UnauthorizedError);
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
    it('認証情報からメールアドレスを取得すること', () => {
      // モックイベントの作成
      const mockEvent = {
        requestContext: {
          authorizer: {
            claims: {
              email: 'user@example.com'
            }
          }
        }
      } as unknown as APIGatewayProxyEvent;
      
      // テスト対象の関数を実行
      const email = getUserEmailFromRequest(mockEvent);
      
      // 結果の検証
      expect(email).toBe('user@example.com');
    });

    it('開発環境では固定のメールアドレスを返すこと', () => {
      // モックイベントの作成（認証情報なし）
      const mockEvent = {} as APIGatewayProxyEvent;
      
      // テスト対象の関数を実行
      const email = getUserEmailFromRequest(mockEvent);
      
      // 結果の検証
      expect(email).toBe('dev-user@example.com');
    });

    it('認証情報が不足している場合はUnauthorizedErrorをスローすること', () => {
      // モックイベントの作成（認証情報が不完全）
      const mockEvent = {
        requestContext: {
          authorizer: {
            claims: {}
          }
        }
      } as unknown as APIGatewayProxyEvent;
      
      // テスト対象の関数を実行して例外をキャッチ
      expect(() => getUserEmailFromRequest(mockEvent)).toThrow(UnauthorizedError);
    });
  });
});
