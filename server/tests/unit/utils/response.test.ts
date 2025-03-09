/**
 * レスポンスユーティリティのテスト
 */

import { createSuccessResponse, createErrorResponse } from '../../../src/utils/response';
import { AppError, ErrorCode, InvalidRequestError, InternalError } from '../../../src/utils/errors';

// モジュールとして認識させるための空のエクスポート
export {};

describe('レスポンスユーティリティ', () => {
  describe('createSuccessResponse', () => {
    it('デフォルトのステータスコード(200)で成功レスポンスを生成すること', () => {
      const data = { id: 'bonsai123', name: '五葉松' };
      
      const response = createSuccessResponse(data);
      
      expect(response.statusCode).toBe(200);
      expect(response.headers).toEqual({
        'Content-Type': 'application/json'
      });
      expect(JSON.parse(response.body)).toEqual(data);
    });

    it('指定されたステータスコードで成功レスポンスを生成すること', () => {
      const data = { id: 'bonsai123', name: '五葉松' };
      
      const response = createSuccessResponse(data, 201);
      
      expect(response.statusCode).toBe(201);
      expect(response.headers).toEqual({
        'Content-Type': 'application/json'
      });
      expect(JSON.parse(response.body)).toEqual(data);
    });

    it('空のデータでも成功レスポンスを生成すること', () => {
      const response = createSuccessResponse({});
      
      expect(response.statusCode).toBe(200);
      expect(response.headers).toEqual({
        'Content-Type': 'application/json'
      });
      expect(JSON.parse(response.body)).toEqual({});
    });

    it('配列データでも成功レスポンスを生成すること', () => {
      const data = [
        { id: 'bonsai123', name: '五葉松' },
        { id: 'bonsai456', name: '真柏' }
      ];
      
      const response = createSuccessResponse(data);
      
      expect(response.statusCode).toBe(200);
      expect(response.headers).toEqual({
        'Content-Type': 'application/json'
      });
      expect(JSON.parse(response.body)).toEqual(data);
    });

    it('nullデータでも成功レスポンスを生成すること', () => {
      const response = createSuccessResponse(null);
      
      expect(response.statusCode).toBe(200);
      expect(response.headers).toEqual({
        'Content-Type': 'application/json'
      });
      expect(JSON.parse(response.body)).toBeNull();
    });
  });

  describe('createErrorResponse', () => {
    it('AppErrorから適切なエラーレスポンスを生成すること', () => {
      // コンソールエラーを抑制
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      const error = new InvalidRequestError('無効なリクエスト', { field: 'name' });
      
      const response = createErrorResponse(error);
      
      expect(response.statusCode).toBe(400);
      expect(response.headers).toEqual({
        'Content-Type': 'application/json'
      });
      
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        error: {
          code: ErrorCode.INVALID_REQUEST,
          message: '無効なリクエスト',
          details: { field: 'name' }
        }
      });
      
      // コンソールエラーの復元
      console.error = originalConsoleError;
    });

    it('通常のErrorから500エラーレスポンスを生成すること', () => {
      // コンソールエラーを抑制
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      const error = new Error('予期しないエラー');
      
      const response = createErrorResponse(error);
      
      expect(response.statusCode).toBe(500);
      expect(response.headers).toEqual({
        'Content-Type': 'application/json'
      });
      
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'サーバー内部エラーが発生しました'
        }
      });
      
      // コンソールエラーの復元
      console.error = originalConsoleError;
    });

    it('InternalErrorから500エラーレスポンスを生成すること', () => {
      // コンソールエラーを抑制
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      const error = new InternalError('データベース接続エラー');
      
      const response = createErrorResponse(error);
      
      expect(response.statusCode).toBe(500);
      expect(response.headers).toEqual({
        'Content-Type': 'application/json'
      });
      
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'データベース接続エラー'
        }
      });
      
      // コンソールエラーの復元
      console.error = originalConsoleError;
    });

    it('エラーがコンソールに出力されること', () => {
      // コンソールエラーをモック化
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      const error = new Error('テストエラー');
      
      createErrorResponse(error);
      
      // コンソールエラーが呼び出されたことを検証
      expect(console.error).toHaveBeenCalled();
      
      // コンソールエラーの復元
      console.error = originalConsoleError;
    });
  });
});
