import { APIGatewayProxyEvent } from 'aws-lambda';
import { 
  getBonsaiList, 
  getBonsaiDetail, 
  createBonsai, 
  updateBonsai, 
  deleteBonsai 
} from '../../../src/handlers/bonsaiHandler';
import * as authUtils from '../../../src/utils/auth';
import { InvalidRequestError, ResourceNotFoundError } from '../../../src/utils/errors';

// モジュールとして認識させるための空のエクスポート
export {};

// モックの作成
jest.mock('../../../src/utils/auth');
jest.mock('../../../src/services/bonsaiService');

// モックサービスのインポート
import * as bonsaiService from '../../../src/services/bonsaiService';

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

describe('盆栽ハンドラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // authUtilsのモック
    (authUtils.getUserIdFromRequest as jest.Mock).mockReturnValue('user123');
    
    // bonsaiServiceのモック
    (bonsaiService.listBonsai as jest.Mock).mockResolvedValue({
      items: [
        {
          id: 'bonsai123',
          userId: 'user123',
          name: '五葉松',
          species: '五葉松（Pinus parviflora）',
          registrationDate: '2024-01-15T00:00:00Z',
          imageUrls: ['https://example.com/images/bonsai123-1.jpg'],
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-02-20T15:30:00Z'
        },
        {
          id: 'bonsai456',
          userId: 'user123',
          name: '真柏',
          species: '真柏（Juniperus chinensis）',
          registrationDate: '2024-02-10T00:00:00Z',
          imageUrls: ['https://example.com/images/bonsai456-1.jpg'],
          createdAt: '2024-02-10T09:00:00Z',
          updatedAt: '2024-02-10T09:00:00Z'
        }
      ],
      nextToken: 'mock-next-token'
    });
  });
  
  describe('GET /api/bonsai', () => {
    it('ユーザーの盆栽一覧を返すこと', async () => {
      // テスト用のモックイベントを作成
      const mockEvent = createMockEvent('/api/bonsai', 'GET');
      
      // ハンドラー関数を呼び出し
      const result = await getBonsaiList(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(200);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body).toHaveProperty('items');
      expect(body.items).toHaveLength(2);
      expect(body.items[0]).toHaveProperty('id', 'bonsai123');
      expect(body.items[0]).toHaveProperty('name', '五葉松');
      expect(body.items[1]).toHaveProperty('id', 'bonsai456');
      expect(body.items[1]).toHaveProperty('name', '真柏');
      expect(body).toHaveProperty('nextToken', 'mock-next-token');
      
      // サービス関数が正しく呼ばれたことを検証
      expect(authUtils.getUserIdFromRequest).toHaveBeenCalledWith(mockEvent);
      expect(bonsaiService.listBonsai).toHaveBeenCalledWith('user123', undefined, undefined);
    });
    
    it('クエリパラメータを正しく処理すること', async () => {
      // クエリパラメータ付きのモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/bonsai', 'GET'),
        queryStringParameters: {
          limit: '10',
          nextToken: 'previous-page-token'
        }
      };
      
      // ハンドラー関数を呼び出し
      await getBonsaiList(mockEvent);
      
      // サービス関数が正しいパラメータで呼ばれたことを検証
      expect(bonsaiService.listBonsai).toHaveBeenCalledWith('user123', 10, 'previous-page-token');
    });
  });
  
  describe('GET /api/bonsai/{bonsaiId}', () => {
    beforeEach(() => {
      // getBonsaiのモック
      (bonsaiService.getBonsai as jest.Mock).mockResolvedValue({
        id: 'bonsai123',
        userId: 'user123',
        name: '五葉松',
        species: '五葉松（Pinus parviflora）',
        registrationDate: '2024-01-15T00:00:00Z',
        history: '2023年に購入',
        imageUrls: ['https://example.com/images/bonsai123-1.jpg'],
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-02-20T15:30:00Z'
      });
    });
    
    it('盆栽詳細を返すこと', async () => {
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/bonsai/bonsai123', 'GET'),
        pathParameters: { bonsaiId: 'bonsai123' }
      };
      
      // ハンドラー関数を呼び出し
      const result = await getBonsaiDetail(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(200);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body).toHaveProperty('id', 'bonsai123');
      expect(body).toHaveProperty('name', '五葉松');
      expect(body).toHaveProperty('species', '五葉松（Pinus parviflora）');
      expect(body).toHaveProperty('history', '2023年に購入');
      
      // サービス関数が正しく呼ばれたことを検証
      expect(authUtils.getUserIdFromRequest).toHaveBeenCalledWith(mockEvent);
      expect(bonsaiService.getBonsai).toHaveBeenCalledWith('user123', 'bonsai123');
    });
    
    it('盆栽IDが指定されていない場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（pathParametersなし）
      const mockEvent = createMockEvent('/api/bonsai/undefined', 'GET');
      
      // ハンドラー関数を呼び出し
      const result = await getBonsaiDetail(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error).toHaveProperty('message', '盆栽IDが指定されていません');
      
      // サービス関数が呼ばれていないことを検証
      expect(bonsaiService.getBonsai).not.toHaveBeenCalled();
    });
    
    it('盆栽が存在しない場合、404エラーを返すこと', async () => {
      // getBonsaiのモックを上書き（エラーをスロー）
      (bonsaiService.getBonsai as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('盆栽', 'nonexistent')
      );
      
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/bonsai/nonexistent', 'GET'),
        pathParameters: { bonsaiId: 'nonexistent' }
      };
      
      // ハンドラー関数を呼び出し
      const result = await getBonsaiDetail(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(404);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'RESOURCE_NOT_FOUND');
    });
  });
  
  describe('POST /api/bonsai', () => {
    beforeEach(() => {
      // createBonsaiのモック
      (bonsaiService.createBonsai as jest.Mock).mockResolvedValue({
        id: 'new-bonsai-id',
        userId: 'user123',
        name: '黒松',
        species: '黒松（Pinus thunbergii）',
        registrationDate: '2024-03-09T00:00:00Z',
        history: '2024年に購入',
        imageUrls: ['https://example.com/images/new-bonsai.jpg'],
        createdAt: '2024-03-09T00:00:00Z',
        updatedAt: '2024-03-09T00:00:00Z'
      });
    });
    
    it('新しい盆栽を作成して返すこと', async () => {
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/bonsai', 'POST'),
        body: JSON.stringify({
          name: '黒松',
          species: '黒松（Pinus thunbergii）',
          registrationDate: '2024-03-09T00:00:00Z',
          history: '2024年に購入',
          imageUrls: ['https://example.com/images/new-bonsai.jpg']
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await createBonsai(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(201);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body).toHaveProperty('id', 'new-bonsai-id');
      expect(body).toHaveProperty('name', '黒松');
      expect(body).toHaveProperty('species', '黒松（Pinus thunbergii）');
      
      // サービス関数が正しく呼ばれたことを検証
      expect(authUtils.getUserIdFromRequest).toHaveBeenCalledWith(mockEvent);
      expect(bonsaiService.createBonsai).toHaveBeenCalledWith('user123', {
        name: '黒松',
        species: '黒松（Pinus thunbergii）',
        registrationDate: '2024-03-09T00:00:00Z',
        history: '2024年に購入',
        imageUrls: ['https://example.com/images/new-bonsai.jpg']
      });
    });
    
    it('リクエストボディが空の場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（bodyなし）
      const mockEvent = {
        ...createMockEvent('/api/bonsai', 'POST'),
        body: null
      };
      
      // ハンドラー関数を呼び出し
      const result = await createBonsai(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error).toHaveProperty('message', 'リクエストボディが空です');
      
      // サービス関数が呼ばれていないことを検証
      expect(bonsaiService.createBonsai).not.toHaveBeenCalled();
    });
    
    it('必須項目が不足している場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（必須項目不足）
      const mockEvent = {
        ...createMockEvent('/api/bonsai', 'POST'),
        body: JSON.stringify({
          name: '黒松',
          // species: 欠落
          // registrationDate: 欠落
          history: '2024年に購入'
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await createBonsai(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      
      // サービス関数が呼ばれていないことを検証
      expect(bonsaiService.createBonsai).not.toHaveBeenCalled();
    });
  });
  
  describe('PUT /api/bonsai/{bonsaiId}', () => {
    beforeEach(() => {
      // updateBonsaiのモック
      (bonsaiService.updateBonsai as jest.Mock).mockResolvedValue({
        id: 'bonsai123',
        userId: 'user123',
        name: '五葉松（更新）',
        species: '五葉松（Pinus parviflora）',
        registrationDate: '2024-01-15T00:00:00Z',
        history: '2023年に購入、2024年に植え替え',
        imageUrls: ['https://example.com/images/bonsai123-1.jpg', 'https://example.com/images/bonsai123-2.jpg'],
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-03-09T00:00:00Z'
      });
    });
    
    it('盆栽を更新して返すこと', async () => {
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/bonsai/bonsai123', 'PUT'),
        pathParameters: { bonsaiId: 'bonsai123' },
        body: JSON.stringify({
          name: '五葉松（更新）',
          history: '2023年に購入、2024年に植え替え',
          imageUrls: ['https://example.com/images/bonsai123-1.jpg', 'https://example.com/images/bonsai123-2.jpg']
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await updateBonsai(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(200);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body).toHaveProperty('id', 'bonsai123');
      expect(body).toHaveProperty('name', '五葉松（更新）');
      expect(body).toHaveProperty('history', '2023年に購入、2024年に植え替え');
      
      // サービス関数が正しく呼ばれたことを検証
      expect(authUtils.getUserIdFromRequest).toHaveBeenCalledWith(mockEvent);
      expect(bonsaiService.updateBonsai).toHaveBeenCalledWith('user123', 'bonsai123', {
        name: '五葉松（更新）',
        history: '2023年に購入、2024年に植え替え',
        imageUrls: ['https://example.com/images/bonsai123-1.jpg', 'https://example.com/images/bonsai123-2.jpg']
      });
    });
    
    it('盆栽IDが指定されていない場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（pathParametersなし）
      const mockEvent = {
        ...createMockEvent('/api/bonsai/undefined', 'PUT'),
        body: JSON.stringify({
          name: '五葉松（更新）'
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await updateBonsai(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error).toHaveProperty('message', '盆栽IDが指定されていません');
      
      // サービス関数が呼ばれていないことを検証
      expect(bonsaiService.updateBonsai).not.toHaveBeenCalled();
    });
    
    it('リクエストボディが空の場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（bodyなし）
      const mockEvent = {
        ...createMockEvent('/api/bonsai/bonsai123', 'PUT'),
        pathParameters: { bonsaiId: 'bonsai123' },
        body: null
      };
      
      // ハンドラー関数を呼び出し
      const result = await updateBonsai(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error).toHaveProperty('message', 'リクエストボディが空です');
      
      // サービス関数が呼ばれていないことを検証
      expect(bonsaiService.updateBonsai).not.toHaveBeenCalled();
    });
    
    it('盆栽が存在しない場合、404エラーを返すこと', async () => {
      // updateBonsaiのモックを上書き（エラーをスロー）
      (bonsaiService.updateBonsai as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('盆栽', 'nonexistent')
      );
      
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/bonsai/nonexistent', 'PUT'),
        pathParameters: { bonsaiId: 'nonexistent' },
        body: JSON.stringify({
          name: '更新テスト'
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await updateBonsai(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(404);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'RESOURCE_NOT_FOUND');
    });
  });
  
  describe('DELETE /api/bonsai/{bonsaiId}', () => {
    beforeEach(() => {
      // deleteBonsaiのモック
      (bonsaiService.deleteBonsai as jest.Mock).mockResolvedValue(undefined);
    });
    
    it('盆栽を削除して成功メッセージを返すこと', async () => {
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/bonsai/bonsai123', 'DELETE'),
        pathParameters: { bonsaiId: 'bonsai123' }
      };
      
      // ハンドラー関数を呼び出し
      const result = await deleteBonsai(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(200);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body).toHaveProperty('message', '盆栽が正常に削除されました');
      expect(body).toHaveProperty('id', 'bonsai123');
      
      // サービス関数が正しく呼ばれたことを検証
      expect(authUtils.getUserIdFromRequest).toHaveBeenCalledWith(mockEvent);
      expect(bonsaiService.deleteBonsai).toHaveBeenCalledWith('user123', 'bonsai123');
    });
    
    it('盆栽IDが指定されていない場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（pathParametersなし）
      const mockEvent = createMockEvent('/api/bonsai/undefined', 'DELETE');
      
      // ハンドラー関数を呼び出し
      const result = await deleteBonsai(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error).toHaveProperty('message', '盆栽IDが指定されていません');
      
      // サービス関数が呼ばれていないことを検証
      expect(bonsaiService.deleteBonsai).not.toHaveBeenCalled();
    });
    
    it('盆栽が存在しない場合、404エラーを返すこと', async () => {
      // deleteBonsaiのモックを上書き（エラーをスロー）
      (bonsaiService.deleteBonsai as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('盆栽', 'nonexistent')
      );
      
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/bonsai/nonexistent', 'DELETE'),
        pathParameters: { bonsaiId: 'nonexistent' }
      };
      
      // ハンドラー関数を呼び出し
      const result = await deleteBonsai(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(404);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'RESOURCE_NOT_FOUND');
    });
  });
});
