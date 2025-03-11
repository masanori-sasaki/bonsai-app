/**
 * 作業予定ハンドラーのテスト
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { 
  getWorkScheduleList, 
  getWorkScheduleDetail, 
  createWorkSchedule, 
  updateWorkSchedule, 
  deleteWorkSchedule 
} from '../../../src/handlers/workScheduleHandler';
import * as authUtils from '../../../src/utils/auth';
import { InvalidRequestError, ResourceNotFoundError } from '../../../src/utils/errors';

// モジュールとして認識させるための空のエクスポート
export {};

// モックの作成
jest.mock('../../../src/utils/auth');
jest.mock('../../../src/services/workScheduleService');

// モックサービスのインポート
import * as workScheduleService from '../../../src/services/workScheduleService';

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

describe('作業予定ハンドラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // authUtilsのモック
    (authUtils.getUserIdFromRequest as jest.Mock).mockReturnValue('user123');
    
    // workScheduleServiceのモック
    (workScheduleService.listWorkSchedules as jest.Mock).mockResolvedValue({
      items: [
        {
          id: 'schedule1',
          bonsaiId: 'bonsai1',
          workTypes: ['pruning'],
          scheduledDate: '2025-04-15T00:00:00Z',
          description: '上部の枝を剪定する予定',
          completed: false,
          createdAt: '2025-03-01T10:30:00Z',
          updatedAt: '2025-03-01T10:30:00Z'
        },
        {
          id: 'schedule2',
          bonsaiId: 'bonsai1',
          workTypes: ['repotting'],
          scheduledDate: '2025-05-10T00:00:00Z',
          description: '新しい鉢に植え替える予定',
          completed: true,
          createdAt: '2025-03-02T09:15:00Z',
          updatedAt: '2025-03-05T14:20:00Z'
        }
      ],
      nextToken: 'mock-next-token'
    });
    
    (workScheduleService.getWorkSchedule as jest.Mock).mockResolvedValue({
      id: 'schedule1',
      bonsaiId: 'bonsai1',
      workTypes: ['pruning'],
      scheduledDate: '2025-04-15T00:00:00Z',
      description: '上部の枝を剪定する予定',
      completed: false,
      createdAt: '2025-03-01T10:30:00Z',
      updatedAt: '2025-03-01T10:30:00Z'
    });
    
    (workScheduleService.createWorkSchedule as jest.Mock).mockResolvedValue({
      id: 'new-schedule-id',
      bonsaiId: 'bonsai1',
      workTypes: ['watering'],
      scheduledDate: '2025-04-01T00:00:00Z',
      description: '水やりを行う予定',
      completed: false,
      createdAt: '2025-03-09T00:00:00Z',
      updatedAt: '2025-03-09T00:00:00Z'
    });
    
    (workScheduleService.updateWorkSchedule as jest.Mock).mockResolvedValue({
      id: 'schedule1',
      bonsaiId: 'bonsai1',
      workTypes: ['pruning'],
      scheduledDate: '2025-04-15T00:00:00Z',
      description: '上部の枝を剪定する予定（更新）',
      completed: true,
      createdAt: '2025-03-01T10:30:00Z',
      updatedAt: '2025-03-09T00:00:00Z'
    });
    
    (workScheduleService.deleteWorkSchedule as jest.Mock).mockResolvedValue(undefined);
  });
  
  describe('GET /api/bonsai/{bonsaiId}/schedules', () => {
    it('盆栽IDに紐づく作業予定一覧を返すこと', async () => {
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/bonsai/bonsai1/schedules', 'GET'),
        pathParameters: { bonsaiId: 'bonsai1' }
      };
      
      // ハンドラー関数を呼び出し
      const result = await getWorkScheduleList(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(200);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body).toHaveProperty('items');
      expect(body.items).toHaveLength(2);
      expect(body.items[0]).toHaveProperty('id', 'schedule1');
      expect(body.items[0].workTypes).toContain('pruning');
      expect(body.items[0]).toHaveProperty('completed', false);
      expect(body.items[1]).toHaveProperty('id', 'schedule2');
      expect(body.items[1].workTypes).toContain('repotting');
      expect(body.items[1]).toHaveProperty('completed', true);
      expect(body).toHaveProperty('nextToken', 'mock-next-token');
      
      // サービス関数が正しく呼ばれたことを検証
      expect(authUtils.getUserIdFromRequest).toHaveBeenCalledWith(mockEvent);
      expect(workScheduleService.listWorkSchedules).toHaveBeenCalledWith('user123', 'bonsai1', undefined, undefined, undefined);
    });
    
    it('盆栽IDが指定されていない場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（pathParametersなし）
      const mockEvent = createMockEvent('/api/bonsai/undefined/schedules', 'GET');
      
      // ハンドラー関数を呼び出し
      const result = await getWorkScheduleList(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error).toHaveProperty('message', '盆栽IDが指定されていません');
      
      // サービス関数が呼ばれていないことを検証
      expect(workScheduleService.listWorkSchedules).not.toHaveBeenCalled();
    });
    
    it('クエリパラメータを正しく処理すること', async () => {
      // クエリパラメータ付きのモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/bonsai/bonsai1/schedules', 'GET'),
        pathParameters: { bonsaiId: 'bonsai1' },
        queryStringParameters: {
          completed: 'true',
          limit: '10',
          nextToken: 'previous-page-token'
        }
      };
      
      // ハンドラー関数を呼び出し
      await getWorkScheduleList(mockEvent);
      
      // サービス関数が正しいパラメータで呼ばれたことを検証
      expect(workScheduleService.listWorkSchedules).toHaveBeenCalledWith('user123', 'bonsai1', true, 10, 'previous-page-token');
    });
    
    it('盆栽が存在しない場合、404エラーを返すこと', async () => {
      // listWorkSchedulesのモックを上書き（エラーをスロー）
      (workScheduleService.listWorkSchedules as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('盆栽', 'nonexistent')
      );
      
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/bonsai/nonexistent/schedules', 'GET'),
        pathParameters: { bonsaiId: 'nonexistent' }
      };
      
      // ハンドラー関数を呼び出し
      const result = await getWorkScheduleList(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(404);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'RESOURCE_NOT_FOUND');
    });
  });
  
  describe('GET /api/schedules/{scheduleId}', () => {
    it('作業予定詳細を返すこと', async () => {
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/schedules/schedule1', 'GET'),
        pathParameters: { scheduleId: 'schedule1' }
      };
      
      // ハンドラー関数を呼び出し
      const result = await getWorkScheduleDetail(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(200);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body).toHaveProperty('id', 'schedule1');
      expect(body).toHaveProperty('bonsaiId', 'bonsai1');
      expect(body.workTypes).toContain('pruning');
      expect(body).toHaveProperty('description', '上部の枝を剪定する予定');
      expect(body).toHaveProperty('completed', false);
      
      // サービス関数が正しく呼ばれたことを検証
      expect(workScheduleService.getWorkSchedule).toHaveBeenCalledWith('schedule1');
    });
    
    it('作業予定IDが指定されていない場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（pathParametersなし）
      const mockEvent = createMockEvent('/api/schedules/undefined', 'GET');
      
      // ハンドラー関数を呼び出し
      const result = await getWorkScheduleDetail(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error).toHaveProperty('message', '作業予定IDが指定されていません');
      
      // サービス関数が呼ばれていないことを検証
      expect(workScheduleService.getWorkSchedule).not.toHaveBeenCalled();
    });
    
    it('作業予定が存在しない場合、404エラーを返すこと', async () => {
      // getWorkScheduleのモックを上書き（エラーをスロー）
      (workScheduleService.getWorkSchedule as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('作業予定', 'nonexistent')
      );
      
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/schedules/nonexistent', 'GET'),
        pathParameters: { scheduleId: 'nonexistent' }
      };
      
      // ハンドラー関数を呼び出し
      const result = await getWorkScheduleDetail(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(404);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'RESOURCE_NOT_FOUND');
    });
  });
  
  describe('POST /api/bonsai/{bonsaiId}/schedules', () => {
    it('新しい作業予定を作成して返すこと', async () => {
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/bonsai/bonsai1/schedules', 'POST'),
        pathParameters: { bonsaiId: 'bonsai1' },
        body: JSON.stringify({
          workTypes: ['watering'],
          scheduledDate: '2025-04-01T00:00:00Z',
          description: '水やりを行う予定'
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await createWorkSchedule(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(201);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body).toHaveProperty('id', 'new-schedule-id');
      expect(body).toHaveProperty('bonsaiId', 'bonsai1');
      expect(body.workTypes).toContain('watering');
      expect(body).toHaveProperty('description', '水やりを行う予定');
      expect(body).toHaveProperty('completed', false);
      
      // サービス関数が正しく呼ばれたことを検証
      expect(authUtils.getUserIdFromRequest).toHaveBeenCalledWith(mockEvent);
      expect(workScheduleService.createWorkSchedule).toHaveBeenCalledWith('user123', {
        bonsaiId: 'bonsai1',
        workTypes: ['watering'],
        scheduledDate: '2025-04-01T00:00:00Z',
        description: '水やりを行う予定'
      });
    });
    
    it('盆栽IDが指定されていない場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（pathParametersなし）
      const mockEvent = {
        ...createMockEvent('/api/bonsai/undefined/schedules', 'POST'),
        body: JSON.stringify({
          workTypes: ['watering'],
          scheduledDate: '2025-04-01T00:00:00Z',
          description: '水やりを行う予定'
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await createWorkSchedule(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error).toHaveProperty('message', '盆栽IDが指定されていません');
      
      // サービス関数が呼ばれていないことを検証
      expect(workScheduleService.createWorkSchedule).not.toHaveBeenCalled();
    });
    
    it('リクエストボディが空の場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（bodyなし）
      const mockEvent = {
        ...createMockEvent('/api/bonsai/bonsai1/schedules', 'POST'),
        pathParameters: { bonsaiId: 'bonsai1' },
        body: null
      };
      
      // ハンドラー関数を呼び出し
      const result = await createWorkSchedule(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error).toHaveProperty('message', 'リクエストボディが空です');
      
      // サービス関数が呼ばれていないことを検証
      expect(workScheduleService.createWorkSchedule).not.toHaveBeenCalled();
    });
    
    it('必須項目が不足している場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（必須項目不足）
      const mockEvent = {
        ...createMockEvent('/api/bonsai/bonsai1/schedules', 'POST'),
        pathParameters: { bonsaiId: 'bonsai1' },
        body: JSON.stringify({
          workTypes: ['watering'],
          // scheduledDate: 欠落
          // description: 欠落
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await createWorkSchedule(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      
      // サービス関数が呼ばれていないことを検証
      expect(workScheduleService.createWorkSchedule).not.toHaveBeenCalled();
    });
    
    it('盆栽が存在しない場合、404エラーを返すこと', async () => {
      // createWorkScheduleのモックを上書き（エラーをスロー）
      (workScheduleService.createWorkSchedule as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('盆栽', 'nonexistent')
      );
      
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/bonsai/nonexistent/schedules', 'POST'),
        pathParameters: { bonsaiId: 'nonexistent' },
        body: JSON.stringify({
          workTypes: ['watering'],
          scheduledDate: '2025-04-01T00:00:00Z',
          description: '水やりを行う予定'
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await createWorkSchedule(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(404);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'RESOURCE_NOT_FOUND');
    });
  });
  
  describe('PUT /api/schedules/{scheduleId}', () => {
    it('作業予定を更新して返すこと', async () => {
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/schedules/schedule1', 'PUT'),
        pathParameters: { scheduleId: 'schedule1' },
        body: JSON.stringify({
          description: '上部の枝を剪定する予定（更新）',
          completed: true
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await updateWorkSchedule(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(200);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body).toHaveProperty('id', 'schedule1');
      expect(body).toHaveProperty('description', '上部の枝を剪定する予定（更新）');
      expect(body).toHaveProperty('completed', true);
      
      // サービス関数が正しく呼ばれたことを検証
      expect(workScheduleService.updateWorkSchedule).toHaveBeenCalledWith('schedule1', {
        description: '上部の枝を剪定する予定（更新）',
        completed: true
      });
    });
    
    it('作業予定IDが指定されていない場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（pathParametersなし）
      const mockEvent = {
        ...createMockEvent('/api/schedules/undefined', 'PUT'),
        body: JSON.stringify({
          completed: true
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await updateWorkSchedule(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error).toHaveProperty('message', '作業予定IDが指定されていません');
      
      // サービス関数が呼ばれていないことを検証
      expect(workScheduleService.updateWorkSchedule).not.toHaveBeenCalled();
    });
    
    it('リクエストボディが空の場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（bodyなし）
      const mockEvent = {
        ...createMockEvent('/api/schedules/schedule1', 'PUT'),
        pathParameters: { scheduleId: 'schedule1' },
        body: null
      };
      
      // ハンドラー関数を呼び出し
      const result = await updateWorkSchedule(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error).toHaveProperty('message', 'リクエストボディが空です');
      
      // サービス関数が呼ばれていないことを検証
      expect(workScheduleService.updateWorkSchedule).not.toHaveBeenCalled();
    });
    
    it('作業予定が存在しない場合、404エラーを返すこと', async () => {
      // updateWorkScheduleのモックを上書き（エラーをスロー）
      (workScheduleService.updateWorkSchedule as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('作業予定', 'nonexistent')
      );
      
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/schedules/nonexistent', 'PUT'),
        pathParameters: { scheduleId: 'nonexistent' },
        body: JSON.stringify({
          completed: true
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await updateWorkSchedule(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(404);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'RESOURCE_NOT_FOUND');
    });
  });
  
  describe('DELETE /api/schedules/{scheduleId}', () => {
    it('作業予定を削除して成功メッセージを返すこと', async () => {
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/schedules/schedule1', 'DELETE'),
        pathParameters: { scheduleId: 'schedule1' }
      };
      
      // ハンドラー関数を呼び出し
      const result = await deleteWorkSchedule(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(200);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body).toHaveProperty('message', '作業予定が正常に削除されました');
      expect(body).toHaveProperty('id', 'schedule1');
      
      // サービス関数が正しく呼ばれたことを検証
      expect(workScheduleService.deleteWorkSchedule).toHaveBeenCalledWith('schedule1');
    });
    
    it('作業予定IDが指定されていない場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（pathParametersなし）
      const mockEvent = createMockEvent('/api/schedules/undefined', 'DELETE');
      
      // ハンドラー関数を呼び出し
      const result = await deleteWorkSchedule(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error).toHaveProperty('message', '作業予定IDが指定されていません');
      
      // サービス関数が呼ばれていないことを検証
      expect(workScheduleService.deleteWorkSchedule).not.toHaveBeenCalled();
    });
    
    it('作業予定が存在しない場合、404エラーを返すこと', async () => {
      // deleteWorkScheduleのモックを上書き（エラーをスロー）
      (workScheduleService.deleteWorkSchedule as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('作業予定', 'nonexistent')
      );
      
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/schedules/nonexistent', 'DELETE'),
        pathParameters: { scheduleId: 'nonexistent' }
      };
      
      // ハンドラー関数を呼び出し
      const result = await deleteWorkSchedule(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(404);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'RESOURCE_NOT_FOUND');
    });
  });
});
