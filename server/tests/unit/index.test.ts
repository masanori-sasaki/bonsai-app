import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../../src/index';
import * as bonsaiHandler from '../../src/handlers/bonsaiHandler';

// モジュールとして認識させるための空のエクスポート
export {};

// モックの作成
jest.mock('../../src/handlers/bonsaiHandler');

// モックイベントの作成ヘルパー関数
const createMockEvent = (path: string, method: string): APIGatewayProxyEvent => {
  return {
    path,
    httpMethod: method,
    headers: {},
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
    body: null,
    isBase64Encoded: false
  };
};

describe('Lambda Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // bonsaiHandlerのモック
    (bonsaiHandler.getBonsaiList as jest.Mock).mockResolvedValue({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [] })
    });
    
    (bonsaiHandler.getBonsaiDetail as jest.Mock).mockResolvedValue({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'bonsai123' })
    });
  });
  
  // ヘルスチェックエンドポイントのテスト
  describe('GET /api/health', () => {
    it('200 OKとヘルスステータスを返すこと', async () => {
      // テスト用のモックイベントを作成
      const mockEvent = createMockEvent('/api/health', 'GET');
      
      // ハンドラー関数を呼び出し
      const result = await handler(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(200);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body).toHaveProperty('status', 'healthy');
      expect(body).toHaveProperty('timestamp');
    });
  });
  
  // 盆栽一覧エンドポイントのテスト
  describe('GET /api/bonsai', () => {
    it('盆栽ハンドラーを呼び出すこと', async () => {
      // テスト用のモックイベントを作成
      const mockEvent = createMockEvent('/api/bonsai', 'GET');
      
      // ハンドラー関数を呼び出し
      await handler(mockEvent);
      
      // ハンドラーが呼び出されたことを検証
      expect(bonsaiHandler.getBonsaiList).toHaveBeenCalledWith(mockEvent);
    });
  });
  
  // 盆栽詳細エンドポイントのテスト
  describe('GET /api/bonsai/{bonsaiId}', () => {
    it('盆栽詳細ハンドラーを呼び出すこと', async () => {
      // テスト用のモックイベントを作成
      const mockEvent = createMockEvent('/api/bonsai/bonsai123', 'GET');
      
      // ハンドラー関数を呼び出し
      await handler(mockEvent);
      
      // パスパラメータが正しく設定されていることを検証
      expect(mockEvent.pathParameters).toHaveProperty('bonsaiId', 'bonsai123');
      
      // ハンドラーが呼び出されたことを検証
      expect(bonsaiHandler.getBonsaiDetail).toHaveBeenCalledWith(mockEvent);
    });
  });
  
  // 存在しないエンドポイントのテスト
  describe('未実装のエンドポイント', () => {
    it('404 Not Foundを返すこと', async () => {
      // テスト用のモックイベントを作成
      const mockEvent = createMockEvent('/api/nonexistent', 'GET');
      
      // ハンドラー関数を呼び出し
      const result = await handler(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(404);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body).toHaveProperty('message', 'Not Found');
    });
  });
});
