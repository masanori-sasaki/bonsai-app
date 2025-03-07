import { APIGatewayProxyEvent } from 'aws-lambda';
import { getBonsaiList } from '../../../src/handlers/bonsaiHandler';
import * as authUtils from '../../../src/utils/auth';

// モジュールとして認識させるための空のエクスポート
export {};

// モックの作成
jest.mock('../../../src/utils/auth');
jest.mock('../../../src/services/bonsaiService');

// モックサービスのインポート
import { listBonsai } from '../../../src/services/bonsaiService';

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
    (listBonsai as jest.Mock).mockResolvedValue({
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
      expect(listBonsai).toHaveBeenCalledWith('user123', undefined, undefined);
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
      expect(listBonsai).toHaveBeenCalledWith('user123', 10, 'previous-page-token');
    });
  });
});
