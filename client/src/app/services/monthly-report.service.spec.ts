import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MonthlyReportService, MonthlyReport, MonthlyReportListResponse, CreateMonthlyReportRequest } from './monthly-report.service';
import { ApiService } from './api.service';
import { of } from 'rxjs';

describe('MonthlyReportService', () => {
  let service: MonthlyReportService;
  let apiService: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MonthlyReportService, ApiService]
    });
    service = TestBed.inject(MonthlyReportService);
    apiService = TestBed.inject(ApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMonthlyReports', () => {
    it('should get monthly report list without optional parameters', () => {
      // モックデータ
      const mockResponse: MonthlyReportListResponse = {
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
        nextToken: undefined
      };

      // ApiServiceのgetメソッドをモック
      spyOn(apiService, 'get').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し
      service.getMonthlyReports().subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.items.length).toBe(2);
        expect(response.items[0].year).toBe(2025);
        expect(response.items[0].month).toBe(3);
        expect(response.items[0].isNew).toBe(true);
        expect(response.nextToken).toBeUndefined();
      });

      // ApiServiceのgetメソッドが正しく呼び出されたことを確認
      expect(apiService.get).toHaveBeenCalledWith('reports', {});
    });

    it('should get monthly report list with limit and nextToken parameters', () => {
      // モックデータ
      const mockResponse: MonthlyReportListResponse = {
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
          }
        ],
        nextToken: 'next-token'
      };

      // ApiServiceのgetメソッドをモック
      spyOn(apiService, 'get').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し（limitとnextTokenを指定）
      const limit = 1;
      const nextToken = 'current-token';
      service.getMonthlyReports(limit, nextToken).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.items.length).toBe(1);
        expect(response.nextToken).toBe('next-token');
      });

      // ApiServiceのgetメソッドが正しく呼び出されたことを確認
      expect(apiService.get).toHaveBeenCalledWith('reports', { 
        limit: '1', 
        nextToken 
      });
    });
  });

  describe('getMonthlyReport', () => {
    it('should get monthly report detail', () => {
      // モックデータ
      const mockResponse: MonthlyReport = {
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
      };

      // ApiServiceのgetメソッドをモック
      spyOn(apiService, 'get').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し
      const year = 2025;
      const month = 3;
      service.getMonthlyReport(year, month).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.id).toBe('report1');
        expect(response.year).toBe(year);
        expect(response.month).toBe(month);
        expect(response.bonsaiSummaries.length).toBe(1);
        expect(response.highlights.length).toBe(1);
        expect(response.recommendedWorks.length).toBe(1);
      });

      // ApiServiceのgetメソッドが正しく呼び出されたことを確認
      expect(apiService.get).toHaveBeenCalledWith(`reports/${year}/${month}`);
    });
  });

  describe('generateMonthlyReport', () => {
    it('should generate monthly report', () => {
      // リクエストデータ
      const createRequest: CreateMonthlyReportRequest = {
        year: 2025,
        month: 4
      };

      // モックレスポンス
      const mockResponse: MonthlyReport = {
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
      };

      // ApiServiceのpostメソッドをモック
      spyOn(apiService, 'post').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し
      service.generateMonthlyReport(createRequest.year, createRequest.month).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.id).toBe('new-report-id');
        expect(response.year).toBe(createRequest.year);
        expect(response.month).toBe(createRequest.month);
        expect(response.recommendedWorks.length).toBe(1);
      });

      // ApiServiceのpostメソッドが正しく呼び出されたことを確認
      expect(apiService.post).toHaveBeenCalledWith('reports', createRequest);
    });
  });

  describe('getMonthName', () => {
    it('should return correct month name', () => {
      expect(service.getMonthName(1)).toBe('1月');
      expect(service.getMonthName(2)).toBe('2月');
      expect(service.getMonthName(3)).toBe('3月');
      expect(service.getMonthName(4)).toBe('4月');
      expect(service.getMonthName(5)).toBe('5月');
      expect(service.getMonthName(6)).toBe('6月');
      expect(service.getMonthName(7)).toBe('7月');
      expect(service.getMonthName(8)).toBe('8月');
      expect(service.getMonthName(9)).toBe('9月');
      expect(service.getMonthName(10)).toBe('10月');
      expect(service.getMonthName(11)).toBe('11月');
      expect(service.getMonthName(12)).toBe('12月');
    });
  });

  describe('getWorkTypeLabel', () => {
    it('should return correct work type label', () => {
      expect(service.getWorkTypeLabel('pruning')).toBe('剪定');
      expect(service.getWorkTypeLabel('repotting')).toBe('植替え');
      expect(service.getWorkTypeLabel('watering')).toBe('水やり');
      expect(service.getWorkTypeLabel('fertilizing')).toBe('肥料');
      expect(service.getWorkTypeLabel('wire')).toBe('針金かけ');
      expect(service.getWorkTypeLabel('wireremove')).toBe('針金はずし');
      expect(service.getWorkTypeLabel('leafpull')).toBe('芽摘み');
      expect(service.getWorkTypeLabel('leafcut')).toBe('芽切り');
      expect(service.getWorkTypeLabel('leafpeel')).toBe('葉透かし');
      expect(service.getWorkTypeLabel('disinfection')).toBe('消毒');
      expect(service.getWorkTypeLabel('carving')).toBe('彫刻');
      expect(service.getWorkTypeLabel('replant')).toBe('改作');
      expect(service.getWorkTypeLabel('protection')).toBe('保護');
      expect(service.getWorkTypeLabel('other')).toBe('その他');
      expect(service.getWorkTypeLabel('unknown')).toBe('unknown');
    });
  });

  describe('getPriorityLabel', () => {
    it('should return correct priority label', () => {
      expect(service.getPriorityLabel('high')).toBe('高');
      expect(service.getPriorityLabel('medium')).toBe('中');
      expect(service.getPriorityLabel('low')).toBe('低');
      expect(service.getPriorityLabel('unknown' as any)).toBe('unknown');
    });
  });

  describe('getPriorityClass', () => {
    it('should return correct priority class', () => {
      expect(service.getPriorityClass('high')).toBe('priority-high');
      expect(service.getPriorityClass('medium')).toBe('priority-medium');
      expect(service.getPriorityClass('low')).toBe('priority-low');
      expect(service.getPriorityClass('unknown' as any)).toBe('');
    });
  });
});
