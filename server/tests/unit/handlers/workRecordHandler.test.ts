/**
 * 作業記録ハンドラーのテスト
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { 
  getWorkRecordList, 
  getWorkRecordDetail, 
  createWorkRecord, 
  updateWorkRecord, 
  deleteWorkRecord 
} from '../../../src/handlers/workRecordHandler';
import * as authUtils from '../../../src/utils/auth';
import { InvalidRequestError, ResourceNotFoundError } from '../../../src/utils/errors';

// モジュールとして認識させるための空のエクスポート
export {};

// モックの作成
jest.mock('../../../src/utils/auth');
jest.mock('../../../src/services/workRecordService');

// モックサービスのインポート
import * as workRecordService from '../../../src/services/workRecordService';

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

describe('作業記録ハンドラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // authUtilsのモック
    (authUtils.getUserIdFromRequest as jest.Mock).mockReturnValue('user123');
    
    // workRecordServiceのモック
    (workRecordService.listWorkRecords as jest.Mock).mockResolvedValue({
      items: [
        {
          id: 'record1',
          bonsaiId: 'bonsai1',
          workType: 'pruning',
          date: '2025-01-20T00:00:00Z',
          description: '上部の枝を剪定しました。',
          imageUrls: ['https://example.com/images/record1-1.jpg', 'https://example.com/images/record1-2.jpg'],
          createdAt: '2025-01-20T10:30:00Z',
          updatedAt: '2025-01-20T10:30:00Z'
        },
        {
          id: 'record2',
          bonsaiId: 'bonsai1',
          workType: 'watering',
          date: '2025-02-05T00:00:00Z',
          description: '水やりを行いました。',
          imageUrls: ['https://example.com/images/record2-1.jpg'],
          createdAt: '2025-02-05T09:15:00Z',
          updatedAt: '2025-02-05T09:15:00Z'
        }
      ],
      nextToken: 'mock-next-token'
    });
    
    (workRecordService.getWorkRecord as jest.Mock).mockResolvedValue({
      id: 'record1',
      bonsaiId: 'bonsai1',
      workType: 'pruning',
      date: '2025-01-20T00:00:00Z',
      description: '上部の枝を剪定しました。',
      imageUrls: ['https://example.com/images/record1-1.jpg', 'https://example.com/images/record1-2.jpg'],
      createdAt: '2025-01-20T10:30:00Z',
      updatedAt: '2025-01-20T10:30:00Z'
    });
    
    (workRecordService.createWorkRecord as jest.Mock).mockResolvedValue({
      id: 'new-record-id',
      bonsaiId: 'bonsai1',
      workType: 'fertilizing',
      date: '2025-03-09T00:00:00Z',
      description: '肥料を与えました。',
      imageUrls: ['https://example.com/images/new-record.jpg'],
      createdAt: '2025-03-09T00:00:00Z',
      updatedAt: '2025-03-09T00:00:00Z'
    });
    
    (workRecordService.updateWorkRecord as jest.Mock).mockResolvedValue({
      id: 'record1',
      bonsaiId: 'bonsai1',
      workType: 'other',
      date: '2025-01-20T00:00:00Z',
      description: '剪定から作業タイプを変更しました。',
      imageUrls: ['https://example.com/images/record1-1.jpg', 'https://example.com/images/record1-2.jpg'],
      createdAt: '2025-01-20T10:30:00Z',
      updatedAt: '2025-03-09T00:00:00Z'
    });
    
    (workRecordService.deleteWorkRecord as jest.Mock).mockResolvedValue(undefined);
  });
  
  describe('GET /api/bonsai/{bonsaiId}/records', () => {
    it('盆栽IDに紐づく作業記録一覧を返すこと', async () => {
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/bonsai/bonsai1/records', 'GET'),
        pathParameters: { bonsaiId: 'bonsai1' }
      };
      
      // ハンドラー関数を呼び出し
      const result = await getWorkRecordList(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(200);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body).toHaveProperty('items');
      expect(body.items).toHaveLength(2);
      expect(body.items[0]).toHaveProperty('id', 'record1');
      expect(body.items[0]).toHaveProperty('workType', 'pruning');
      expect(body.items[1]).toHaveProperty('id', 'record2');
      expect(body.items[1]).toHaveProperty('workType', 'watering');
      expect(body).toHaveProperty('nextToken', 'mock-next-token');
      
      // サービス関数が正しく呼ばれたことを検証
      expect(authUtils.getUserIdFromRequest).toHaveBeenCalledWith(mockEvent);
      expect(workRecordService.listWorkRecords).toHaveBeenCalledWith('user123', 'bonsai1', undefined, undefined, undefined);
    });
    
    it('盆栽IDが指定されていない場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（pathParametersなし）
      const mockEvent = createMockEvent('/api/bonsai/undefined/records', 'GET');
      
      // ハンドラー関数を呼び出し
      const result = await getWorkRecordList(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error).toHaveProperty('message', '盆栽IDが指定されていません');
      
      // サービス関数が呼ばれていないことを検証
      expect(workRecordService.listWorkRecords).not.toHaveBeenCalled();
    });
    
    it('クエリパラメータを正しく処理すること', async () => {
      // クエリパラメータ付きのモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/bonsai/bonsai1/records', 'GET'),
        pathParameters: { bonsaiId: 'bonsai1' },
        queryStringParameters: {
          workType: 'pruning',
          limit: '10',
          nextToken: 'previous-page-token'
        }
      };
      
      // ハンドラー関数を呼び出し
      await getWorkRecordList(mockEvent);
      
      // サービス関数が正しいパラメータで呼ばれたことを検証
      expect(workRecordService.listWorkRecords).toHaveBeenCalledWith('user123', 'bonsai1', 'pruning', 10, 'previous-page-token');
    });
    
    it('盆栽が存在しない場合、404エラーを返すこと', async () => {
      // listWorkRecordsのモックを上書き（エラーをスロー）
      (workRecordService.listWorkRecords as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('盆栽', 'nonexistent')
      );
      
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/bonsai/nonexistent/records', 'GET'),
        pathParameters: { bonsaiId: 'nonexistent' }
      };
      
      // ハンドラー関数を呼び出し
      const result = await getWorkRecordList(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(404);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'RESOURCE_NOT_FOUND');
    });
  });
  
  describe('GET /api/records/{recordId}', () => {
    it('作業記録詳細を返すこと', async () => {
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/records/record1', 'GET'),
        pathParameters: { recordId: 'record1' }
      };
      
      // ハンドラー関数を呼び出し
      const result = await getWorkRecordDetail(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(200);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body).toHaveProperty('id', 'record1');
      expect(body).toHaveProperty('bonsaiId', 'bonsai1');
      expect(body).toHaveProperty('workType', 'pruning');
      expect(body).toHaveProperty('description', '上部の枝を剪定しました。');
      
      // サービス関数が正しく呼ばれたことを検証
      expect(workRecordService.getWorkRecord).toHaveBeenCalledWith('record1');
    });
    
    it('作業記録IDが指定されていない場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（pathParametersなし）
      const mockEvent = createMockEvent('/api/records/undefined', 'GET');
      
      // ハンドラー関数を呼び出し
      const result = await getWorkRecordDetail(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error).toHaveProperty('message', '作業記録IDが指定されていません');
      
      // サービス関数が呼ばれていないことを検証
      expect(workRecordService.getWorkRecord).not.toHaveBeenCalled();
    });
    
    it('作業記録が存在しない場合、404エラーを返すこと', async () => {
      // getWorkRecordのモックを上書き（エラーをスロー）
      (workRecordService.getWorkRecord as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('作業記録', 'nonexistent')
      );
      
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/records/nonexistent', 'GET'),
        pathParameters: { recordId: 'nonexistent' }
      };
      
      // ハンドラー関数を呼び出し
      const result = await getWorkRecordDetail(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(404);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'RESOURCE_NOT_FOUND');
    });
  });
  
  describe('POST /api/bonsai/{bonsaiId}/records', () => {
    it('新しい作業記録を作成して返すこと', async () => {
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/bonsai/bonsai1/records', 'POST'),
        pathParameters: { bonsaiId: 'bonsai1' },
        body: JSON.stringify({
          workType: 'fertilizing',
          date: '2025-03-09T00:00:00Z',
          description: '肥料を与えました。',
          imageUrls: ['https://example.com/images/new-record.jpg']
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await createWorkRecord(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(201);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body).toHaveProperty('id', 'new-record-id');
      expect(body).toHaveProperty('bonsaiId', 'bonsai1');
      expect(body).toHaveProperty('workType', 'fertilizing');
      expect(body).toHaveProperty('description', '肥料を与えました。');
      
      // サービス関数が正しく呼ばれたことを検証
      expect(authUtils.getUserIdFromRequest).toHaveBeenCalledWith(mockEvent);
      expect(workRecordService.createWorkRecord).toHaveBeenCalledWith('user123', {
        bonsaiId: 'bonsai1',
        workType: 'fertilizing',
        date: '2025-03-09T00:00:00Z',
        description: '肥料を与えました。',
        imageUrls: ['https://example.com/images/new-record.jpg']
      });
    });
    
    it('盆栽IDが指定されていない場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（pathParametersなし）
      const mockEvent = {
        ...createMockEvent('/api/bonsai/undefined/records', 'POST'),
        body: JSON.stringify({
          workType: 'fertilizing',
          date: '2025-03-09T00:00:00Z',
          description: '肥料を与えました。'
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await createWorkRecord(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error).toHaveProperty('message', '盆栽IDが指定されていません');
      
      // サービス関数が呼ばれていないことを検証
      expect(workRecordService.createWorkRecord).not.toHaveBeenCalled();
    });
    
    it('リクエストボディが空の場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（bodyなし）
      const mockEvent = {
        ...createMockEvent('/api/bonsai/bonsai1/records', 'POST'),
        pathParameters: { bonsaiId: 'bonsai1' },
        body: null
      };
      
      // ハンドラー関数を呼び出し
      const result = await createWorkRecord(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error).toHaveProperty('message', 'リクエストボディが空です');
      
      // サービス関数が呼ばれていないことを検証
      expect(workRecordService.createWorkRecord).not.toHaveBeenCalled();
    });
    
    it('必須項目が不足している場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（必須項目不足）
      const mockEvent = {
        ...createMockEvent('/api/bonsai/bonsai1/records', 'POST'),
        pathParameters: { bonsaiId: 'bonsai1' },
        body: JSON.stringify({
          workType: 'fertilizing',
          // date: 欠落
          // description: 欠落
          imageUrls: ['https://example.com/images/new-record.jpg']
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await createWorkRecord(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      
      // サービス関数が呼ばれていないことを検証
      expect(workRecordService.createWorkRecord).not.toHaveBeenCalled();
    });
    
    it('盆栽が存在しない場合、404エラーを返すこと', async () => {
      // createWorkRecordのモックを上書き（エラーをスロー）
      (workRecordService.createWorkRecord as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('盆栽', 'nonexistent')
      );
      
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/bonsai/nonexistent/records', 'POST'),
        pathParameters: { bonsaiId: 'nonexistent' },
        body: JSON.stringify({
          workType: 'fertilizing',
          date: '2025-03-09T00:00:00Z',
          description: '肥料を与えました。'
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await createWorkRecord(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(404);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'RESOURCE_NOT_FOUND');
    });
  });
  
  describe('PUT /api/records/{recordId}', () => {
    it('作業記録を更新して返すこと', async () => {
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/records/record1', 'PUT'),
        pathParameters: { recordId: 'record1' },
        body: JSON.stringify({
          workType: 'other',
          description: '剪定から作業タイプを変更しました。'
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await updateWorkRecord(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(200);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body).toHaveProperty('id', 'record1');
      expect(body).toHaveProperty('workType', 'other');
      expect(body).toHaveProperty('description', '剪定から作業タイプを変更しました。');
      
      // サービス関数が正しく呼ばれたことを検証
      expect(workRecordService.updateWorkRecord).toHaveBeenCalledWith('record1', {
        workType: 'other',
        description: '剪定から作業タイプを変更しました。'
      });
    });
    
    it('作業記録IDが指定されていない場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（pathParametersなし）
      const mockEvent = {
        ...createMockEvent('/api/records/undefined', 'PUT'),
        body: JSON.stringify({
          workType: 'other'
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await updateWorkRecord(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error).toHaveProperty('message', '作業記録IDが指定されていません');
      
      // サービス関数が呼ばれていないことを検証
      expect(workRecordService.updateWorkRecord).not.toHaveBeenCalled();
    });
    
    it('リクエストボディが空の場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（bodyなし）
      const mockEvent = {
        ...createMockEvent('/api/records/record1', 'PUT'),
        pathParameters: { recordId: 'record1' },
        body: null
      };
      
      // ハンドラー関数を呼び出し
      const result = await updateWorkRecord(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error).toHaveProperty('message', 'リクエストボディが空です');
      
      // サービス関数が呼ばれていないことを検証
      expect(workRecordService.updateWorkRecord).not.toHaveBeenCalled();
    });
    
    it('作業記録が存在しない場合、404エラーを返すこと', async () => {
      // updateWorkRecordのモックを上書き（エラーをスロー）
      (workRecordService.updateWorkRecord as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('作業記録', 'nonexistent')
      );
      
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/records/nonexistent', 'PUT'),
        pathParameters: { recordId: 'nonexistent' },
        body: JSON.stringify({
          description: '更新テスト'
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await updateWorkRecord(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(404);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'RESOURCE_NOT_FOUND');
    });
  });
  
  describe('DELETE /api/records/{recordId}', () => {
    it('作業記録を削除して成功メッセージを返すこと', async () => {
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/records/record1', 'DELETE'),
        pathParameters: { recordId: 'record1' }
      };
      
      // ハンドラー関数を呼び出し
      const result = await deleteWorkRecord(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(200);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body).toHaveProperty('message', '作業記録が正常に削除されました');
      expect(body).toHaveProperty('id', 'record1');
      
      // サービス関数が正しく呼ばれたことを検証
      expect(workRecordService.deleteWorkRecord).toHaveBeenCalledWith('record1');
    });
    
    it('作業記録IDが指定されていない場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（pathParametersなし）
      const mockEvent = createMockEvent('/api/records/undefined', 'DELETE');
      
      // ハンドラー関数を呼び出し
      const result = await deleteWorkRecord(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error).toHaveProperty('message', '作業記録IDが指定されていません');
      
      // サービス関数が呼ばれていないことを検証
      expect(workRecordService.deleteWorkRecord).not.toHaveBeenCalled();
    });
    
    it('作業記録が存在しない場合、404エラーを返すこと', async () => {
      // deleteWorkRecordのモックを上書き（エラーをスロー）
      (workRecordService.deleteWorkRecord as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('作業記録', 'nonexistent')
      );
      
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/records/nonexistent', 'DELETE'),
        pathParameters: { recordId: 'nonexistent' }
      };
      
      // ハンドラー関数を呼び出し
      const result = await deleteWorkRecord(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(404);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'RESOURCE_NOT_FOUND');
    });
  });
});
