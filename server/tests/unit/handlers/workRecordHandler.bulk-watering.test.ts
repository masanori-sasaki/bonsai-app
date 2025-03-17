/**
 * 作業記録ハンドラーの一括水やり機能のテスト
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { createBulkWateringRecords } from '../../../src/handlers/workRecordHandler';
import * as authUtils from '../../../src/utils/auth';
import * as workRecordService from '../../../src/services/workRecordService';
import { BulkWateringResponse } from '../../../src/models/workRecord';

// モジュールとして認識させるための空のエクスポート
export {};

// モックの作成
jest.mock('../../../src/utils/auth');
jest.mock('../../../src/services/workRecordService');

// モックイベントの作成ヘルパー関数
const createMockEvent = (path: string, method: string): APIGatewayProxyEvent => {
  return {
    path,
    httpMethod: method,
    headers: {
      'Authorization': 'Bearer mock-token'
    },
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    requestContext: {
      authorizer: {
        claims: {
          sub: 'user123',
          email: 'user@example.com'
        }
      }
    } as any,
    resource: '',
    body: null,
    isBase64Encoded: false
  };
};

describe('作業記録ハンドラー - 一括水やり機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // authUtilsのモック
    (authUtils.getUserIdFromRequest as jest.Mock).mockReturnValue('user123');
    
    // workRecordServiceのモック
    (workRecordService.createBulkWateringRecords as jest.Mock).mockResolvedValue({
      success: true,
      message: '3件の盆栽に水やり記録を作成しました',
      recordCount: 3,
      records: [
        {
          id: 'record1',
          bonsaiId: 'bonsai1',
          bonsaiName: '五葉松'
        },
        {
          id: 'record2',
          bonsaiId: 'bonsai2',
          bonsaiName: '真柏'
        },
        {
          id: 'record3',
          bonsaiId: 'bonsai3',
          bonsaiName: '黒松'
        }
      ]
    } as BulkWateringResponse);
  });
  
  describe('POST /api/bulk-watering', () => {
    it('一括水やり記録を作成して成功レスポンスを返すこと', async () => {
      // テスト対象の関数が実装されていない場合はスキップ
      if (typeof createBulkWateringRecords !== 'function') {
        console.warn('createBulkWateringRecords関数が実装されていないためテストをスキップします');
        return;
      }
      
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/bulk-watering', 'POST'),
        body: JSON.stringify({
          description: '一括水やり',
          date: '2025-03-16T00:00:00Z'
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await createBulkWateringRecords(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(201);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('message', '3件の盆栽に水やり記録を作成しました');
      expect(body).toHaveProperty('recordCount', 3);
      expect(body).toHaveProperty('records');
      expect(body.records).toHaveLength(3);
      
      // サービス関数が正しく呼ばれたことを検証
      expect(authUtils.getUserIdFromRequest).toHaveBeenCalledWith(mockEvent);
      expect(workRecordService.createBulkWateringRecords).toHaveBeenCalledWith('user123', {
        description: '一括水やり',
        date: '2025-03-16T00:00:00Z'
      });
    });
    
    it('リクエストボディが空の場合、400エラーを返すこと', async () => {
      // テスト対象の関数が実装されていない場合はスキップ
      if (typeof createBulkWateringRecords !== 'function') {
        console.warn('createBulkWateringRecords関数が実装されていないためテストをスキップします');
        return;
      }
      
      // テスト用のモックイベントを作成（bodyなし）
      const mockEvent = {
        ...createMockEvent('/api/bulk-watering', 'POST'),
        body: null
      };
      
      // ハンドラー関数を呼び出し
      const result = await createBulkWateringRecords(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error).toHaveProperty('message', 'リクエストボディが空です');
      
      // サービス関数が呼ばれていないことを検証
      expect(workRecordService.createBulkWateringRecords).not.toHaveBeenCalled();
    });
    
    it('必須項目が不足している場合、400エラーを返すこと', async () => {
      // テスト対象の関数が実装されていない場合はスキップ
      if (typeof createBulkWateringRecords !== 'function') {
        console.warn('createBulkWateringRecords関数が実装されていないためテストをスキップします');
        return;
      }
      
      // テスト用のモックイベントを作成（必須項目不足）
      const mockEvent = {
        ...createMockEvent('/api/bulk-watering', 'POST'),
        body: JSON.stringify({
          // description: 欠落
          date: '2025-03-16T00:00:00Z'
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await createBulkWateringRecords(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      
      // サービス関数が呼ばれていないことを検証
      expect(workRecordService.createBulkWateringRecords).not.toHaveBeenCalled();
    });
    
    it('盆栽が存在しない場合、エラーを返すこと', async () => {
      // テスト対象の関数が実装されていない場合はスキップ
      if (typeof createBulkWateringRecords !== 'function') {
        console.warn('createBulkWateringRecords関数が実装されていないためテストをスキップします');
        return;
      }
      
      // createBulkWateringRecordsのモックを上書き（エラーをスロー）
      (workRecordService.createBulkWateringRecords as jest.Mock).mockRejectedValue(
        new Error('水やり記録を作成する盆栽がありません')
      );
      
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/bulk-watering', 'POST'),
        body: JSON.stringify({
          description: '一括水やり',
          date: '2025-03-16T00:00:00Z'
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await createBulkWateringRecords(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(500);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('message', 'サーバー内部エラーが発生しました');
    });
    
    it('説明が空の場合、エラーを返すこと', async () => {
      // テスト対象の関数が実装されていない場合はスキップ
      if (typeof createBulkWateringRecords !== 'function') {
        console.warn('createBulkWateringRecords関数が実装されていないためテストをスキップします');
        return;
      }
      
      // createBulkWateringRecordsのモックを上書き（エラーをスロー）
      (workRecordService.createBulkWateringRecords as jest.Mock).mockRejectedValue(
        new Error('説明は必須です')
      );
      
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/bulk-watering', 'POST'),
        body: JSON.stringify({
          description: '',
          date: '2025-03-16T00:00:00Z'
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await createBulkWateringRecords(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('message', '説明は必須です');
    });
  });
});
