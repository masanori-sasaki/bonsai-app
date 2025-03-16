/**
 * 月次レポートハンドラーのテスト
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { 
  listMonthlyReports, 
  getMonthlyReport, 
  generateMonthlyReport 
} from '../../../src/handlers/monthlyReportHandler';
import * as authUtils from '../../../src/utils/auth';
import { InvalidRequestError, ResourceNotFoundError } from '../../../src/utils/errors';

// モジュールとして認識させるための空のエクスポート
export {};

// モックの作成
jest.mock('../../../src/utils/auth');
jest.mock('../../../src/services/monthlyReportService');

// モックサービスのインポート
import * as monthlyReportService from '../../../src/services/monthlyReportService';

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

describe('月次レポートハンドラー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // authUtilsのモック
    (authUtils.getUserIdFromRequest as jest.Mock).mockReturnValue('user123');
    
    // monthlyReportServiceのモック
    (monthlyReportService.listMonthlyReports as jest.Mock).mockResolvedValue({
      items: [
        {
          id: 'report1',
          year: 2025,
          month: 3,
          generatedAt: '2025-03-31T23:59:59Z',
          totalBonsaiCount: 3,
          totalWorkCount: 10,
          highlightCount: 1,
          isNew: true
        },
        {
          id: 'report2',
          year: 2025,
          month: 2,
          generatedAt: '2025-02-28T23:59:59Z',
          totalBonsaiCount: 3,
          totalWorkCount: 8,
          highlightCount: 1,
          isNew: false
        }
      ],
      nextToken: 'mock-next-token'
    });
    
    (monthlyReportService.getMonthlyReport as jest.Mock).mockResolvedValue({
      id: 'report1',
      userId: 'user123',
      year: 2025,
      month: 3,
      generatedAt: '2025-03-31T23:59:59Z',
      totalBonsaiCount: 3,
      totalWorkCount: 10,
      workTypeCounts: {
        pruning: 2,
        watering: 5,
        fertilizing: 3
      },
      bonsaiSummaries: [
        {
          bonsaiId: 'bonsai1',
          bonsaiName: '五葉松',
          species: '五葉松（Pinus parviflora）',
          imageUrl: 'https://example.com/images/bonsai1-1.jpg',
          workRecordIds: ['record1', 'record2'],
          workTypes: ['pruning', 'watering'],
          workSummary: '剪定(3/10), 水やり(3/15, 3/20, 3/25)',
          hasImportantWork: true
        }
      ],
      highlights: [
        {
          recordId: 'record1',
          bonsaiId: 'bonsai1',
          bonsaiName: '五葉松',
          workTypes: ['pruning'],
          date: '2025-03-10T10:00:00Z',
          description: '上部の枝を剪定しました。',
          imageUrl: 'https://example.com/images/record1-1.jpg',
          importance: 'medium',
          highlightReason: '樹形を整える重要な剪定作業'
        }
      ],
      recommendedWorks: [
        {
          bonsaiId: 'bonsai1',
          bonsaiName: '五葉松',
          species: '五葉松（Pinus parviflora）',
          workTypes: ['wire'],
          reason: '針金かけに適した時期です',
          priority: 'high',
          seasonalTips: '新芽の伸びが落ち着いた時期に行うと効果的です'
        }
      ],
      reportTitle: '2025年3月 盆栽管理レポート',
      coverImageUrl: 'https://example.com/images/record1-1.jpg',
      isNew: true
    });
    
    (monthlyReportService.generateMonthlyReport as jest.Mock).mockResolvedValue({
      id: 'new-report-id',
      userId: 'user123',
      year: 2025,
      month: 4,
      generatedAt: '2025-04-01T00:00:00Z',
      totalBonsaiCount: 3,
      totalWorkCount: 0,
      workTypeCounts: {},
      bonsaiSummaries: [],
      highlights: [],
      recommendedWorks: [
        {
          bonsaiId: 'bonsai1',
          bonsaiName: '五葉松',
          species: '五葉松（Pinus parviflora）',
          workTypes: ['wire'],
          reason: '針金かけに適した時期です',
          priority: 'high',
          seasonalTips: '新芽の伸びが落ち着いた時期に行うと効果的です'
        }
      ],
      reportTitle: '2025年4月 盆栽管理レポート'
    });
  });
  
  describe('GET /api/reports', () => {
    it('月次レポート一覧を返すこと', async () => {
      // テスト用のモックイベントを作成
      const mockEvent = createMockEvent('/api/reports', 'GET');
      
      // ハンドラー関数を呼び出し
      const result = await listMonthlyReports(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(200);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body).toHaveProperty('items');
      expect(body.items).toHaveLength(2);
      expect(body.items[0]).toHaveProperty('id', 'report1');
      expect(body.items[0]).toHaveProperty('year', 2025);
      expect(body.items[0]).toHaveProperty('month', 3);
      expect(body.items[0]).toHaveProperty('isNew', true);
      expect(body.items[1]).toHaveProperty('id', 'report2');
      expect(body.items[1]).toHaveProperty('year', 2025);
      expect(body.items[1]).toHaveProperty('month', 2);
      expect(body).toHaveProperty('nextToken', 'mock-next-token');
      
      // サービス関数が正しく呼ばれたことを検証
      expect(authUtils.getUserIdFromRequest).toHaveBeenCalledWith(mockEvent);
      expect(monthlyReportService.listMonthlyReports).toHaveBeenCalledWith('user123', undefined, undefined);
    });
    
    it('クエリパラメータを正しく処理すること', async () => {
      // クエリパラメータ付きのモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/reports', 'GET'),
        queryStringParameters: {
          limit: '10',
          nextToken: 'previous-page-token'
        }
      };
      
      // ハンドラー関数を呼び出し
      await listMonthlyReports(mockEvent);
      
      // サービス関数が正しいパラメータで呼ばれたことを検証
      expect(monthlyReportService.listMonthlyReports).toHaveBeenCalledWith('user123', 10, 'previous-page-token');
    });
    
    it('エラーが発生した場合、エラーレスポンスを返すこと', async () => {
      // listMonthlyReportsのモックを上書き（エラーをスロー）
      (monthlyReportService.listMonthlyReports as jest.Mock).mockRejectedValue(
        new Error('サービスエラー')
      );
      
      // テスト用のモックイベントを作成
      const mockEvent = createMockEvent('/api/reports', 'GET');
      
      // ハンドラー関数を呼び出し
      const result = await listMonthlyReports(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(500);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INTERNAL_ERROR');
      expect(body.error).toHaveProperty('message');
    });
  });
  
  describe('GET /api/reports/{year}/{month}', () => {
    it('月次レポート詳細を返すこと', async () => {
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/reports/2025/3', 'GET'),
        pathParameters: { year: '2025', month: '3' }
      };
      
      // ハンドラー関数を呼び出し
      const result = await getMonthlyReport(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(200);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body).toHaveProperty('id', 'report1');
      expect(body).toHaveProperty('userId', 'user123');
      expect(body).toHaveProperty('year', 2025);
      expect(body).toHaveProperty('month', 3);
      expect(body).toHaveProperty('bonsaiSummaries');
      expect(body.bonsaiSummaries).toHaveLength(1);
      expect(body).toHaveProperty('highlights');
      expect(body.highlights).toHaveLength(1);
      expect(body).toHaveProperty('recommendedWorks');
      expect(body.recommendedWorks).toHaveLength(1);
      
      // サービス関数が正しく呼ばれたことを検証
      expect(authUtils.getUserIdFromRequest).toHaveBeenCalledWith(mockEvent);
      expect(monthlyReportService.getMonthlyReport).toHaveBeenCalledWith('user123', 2025, 3);
    });
    
    it('年月が指定されていない場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（pathParametersなし）
      const mockEvent = createMockEvent('/api/reports/undefined/undefined', 'GET');
      
      // ハンドラー関数を呼び出し
      const result = await getMonthlyReport(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error.message).toContain('無効な年月');
      
      // サービス関数が呼ばれていないことを検証
      expect(monthlyReportService.getMonthlyReport).not.toHaveBeenCalled();
    });
    
    it('無効な年月の場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（無効な月）
      const mockEvent = {
        ...createMockEvent('/api/reports/2025/13', 'GET'),
        pathParameters: { year: '2025', month: '13' }
      };
      
      // ハンドラー関数を呼び出し
      const result = await getMonthlyReport(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error.message).toContain('無効な年月');
      
      // サービス関数が呼ばれていないことを検証
      expect(monthlyReportService.getMonthlyReport).not.toHaveBeenCalled();
    });
    
    it('レポートが存在しない場合、404エラーを返すこと', async () => {
      // getMonthlyReportのモックを上書き（エラーをスロー）
      (monthlyReportService.getMonthlyReport as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('月次レポート', '2025年1月')
      );
      
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/reports/2025/1', 'GET'),
        pathParameters: { year: '2025', month: '1' }
      };
      
      // ハンドラー関数を呼び出し
      const result = await getMonthlyReport(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(404);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'RESOURCE_NOT_FOUND');
    });
  });
  
  describe('POST /api/reports', () => {
    it('新しい月次レポートを生成して返すこと', async () => {
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/reports', 'POST'),
        body: JSON.stringify({
          year: 2025,
          month: 4
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await generateMonthlyReport(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(200);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body).toHaveProperty('id', 'new-report-id');
      expect(body).toHaveProperty('userId', 'user123');
      expect(body).toHaveProperty('year', 2025);
      expect(body).toHaveProperty('month', 4);
      expect(body).toHaveProperty('recommendedWorks');
      expect(body.recommendedWorks).toHaveLength(1);
      
      // サービス関数が正しく呼ばれたことを検証
      expect(authUtils.getUserIdFromRequest).toHaveBeenCalledWith(mockEvent);
      expect(monthlyReportService.generateMonthlyReport).toHaveBeenCalledWith('user123', 2025, 4);
    });
    
    it('リクエストボディが空の場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（bodyなし）
      const mockEvent = {
        ...createMockEvent('/api/reports', 'POST'),
        body: null
      };
      
      // ハンドラー関数を呼び出し
      const result = await generateMonthlyReport(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error.message).toContain('リクエストボディが空です');
      
      // サービス関数が呼ばれていないことを検証
      expect(monthlyReportService.generateMonthlyReport).not.toHaveBeenCalled();
    });
    
    it('無効な年月の場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（無効な月）
      const mockEvent = {
        ...createMockEvent('/api/reports', 'POST'),
        body: JSON.stringify({
          year: 2025,
          month: 13
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await generateMonthlyReport(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error.message).toContain('無効な年月');
      
      // サービス関数が呼ばれていないことを検証
      expect(monthlyReportService.generateMonthlyReport).not.toHaveBeenCalled();
    });
    
    it('必須項目が不足している場合、400エラーを返すこと', async () => {
      // テスト用のモックイベントを作成（月が欠落）
      const mockEvent = {
        ...createMockEvent('/api/reports', 'POST'),
        body: JSON.stringify({
          year: 2025
          // month: 欠落
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await generateMonthlyReport(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(400);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INVALID_REQUEST');
      expect(body.error.message).toContain('無効な年月');
      
      // サービス関数が呼ばれていないことを検証
      expect(monthlyReportService.generateMonthlyReport).not.toHaveBeenCalled();
    });
    
    it('エラーが発生した場合、エラーレスポンスを返すこと', async () => {
      // generateMonthlyReportのモックを上書き（エラーをスロー）
      (monthlyReportService.generateMonthlyReport as jest.Mock).mockRejectedValue(
        new Error('サービスエラー')
      );
      
      // テスト用のモックイベントを作成
      const mockEvent = {
        ...createMockEvent('/api/reports', 'POST'),
        body: JSON.stringify({
          year: 2025,
          month: 4
        })
      };
      
      // ハンドラー関数を呼び出し
      const result = await generateMonthlyReport(mockEvent);
      
      // レスポンスの検証
      expect(result.statusCode).toBe(500);
      
      // レスポンスボディをパース
      const body = JSON.parse(result.body);
      
      // 期待される値の検証
      expect(body.error).toHaveProperty('code', 'INTERNAL_ERROR');
      expect(body.error).toHaveProperty('message');
    });
  });
});
