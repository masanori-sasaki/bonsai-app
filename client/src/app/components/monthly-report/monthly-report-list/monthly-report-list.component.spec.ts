import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { MonthlyReportListComponent } from './monthly-report-list.component';
import { MonthlyReportService, MonthlyReportListItem } from '../../../services/monthly-report.service';

describe('MonthlyReportListComponent', () => {
  let component: MonthlyReportListComponent;
  let fixture: ComponentFixture<MonthlyReportListComponent>;
  let monthlyReportService: jasmine.SpyObj<MonthlyReportService>;
  let router: jasmine.SpyObj<Router>;

  // テスト用の月次レポートデータ
  const mockReportList: MonthlyReportListItem[] = [
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
  ];

  beforeEach(async () => {
    // MonthlyReportServiceのモック
    const monthlyReportServiceSpy = jasmine.createSpyObj('MonthlyReportService', [
      'getMonthlyReports',
      'generateMonthlyReport',
      'getMonthName'
    ]);
    
    // Routerのモック
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [MonthlyReportListComponent],
      providers: [
        { provide: MonthlyReportService, useValue: monthlyReportServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    monthlyReportService = TestBed.inject(MonthlyReportService) as jasmine.SpyObj<MonthlyReportService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    // 月次レポート一覧取得のモック
    monthlyReportService.getMonthlyReports.and.returnValue(of({
      items: mockReportList,
      nextToken: undefined
    }));
    
    // 月名取得のモック
    monthlyReportService.getMonthName.and.callFake((month: number) => `${month}月`);
    
    fixture = TestBed.createComponent(MonthlyReportListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load monthly reports on init', () => {
    expect(component.reports).toEqual(mockReportList);
    expect(component.loading).toBeFalse();
    expect(component.hasMoreReports).toBeFalse();
    expect(monthlyReportService.getMonthlyReports).toHaveBeenCalled();
  });

  it('should handle error when loading monthly reports', () => {
    // エラーを返すようにモック
    monthlyReportService.getMonthlyReports.and.returnValue(throwError(() => new Error('Failed to load')));
    
    // コンポーネントを再作成
    fixture = TestBed.createComponent(MonthlyReportListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // エラーが設定されることを確認
    expect(component.error).toBe('月次レポートの取得中にエラーが発生しました。');
    expect(component.loading).toBeFalse();
  });

  it('should load more reports when loadMoreReports is called', () => {
    // 次のページがあるようにモック
    component.nextToken = 'next-token';
    component.hasMoreReports = true;
    
    // 追加の月次レポートデータ
    const additionalReport: MonthlyReportListItem = {
      id: 'report3',
      year: 2025,
      month: 1,
      generatedAt: '2025-01-31T23:59:59Z',
      totalBonsaiCount: 2,
      totalWorkCount: 5,
      highlightCount: 0,
      isNew: false
    };
    
    // 次のページのモック
    monthlyReportService.getMonthlyReports.and.returnValue(of({
      items: [additionalReport],
      nextToken: undefined
    }));
    
    // もっと読み込むメソッドを呼び出し
    component.loadMoreReports();
    
    // 月次レポートリストが更新されることを確認
    expect(component.reports.length).toBe(3);
    expect(component.reports[2]).toEqual(additionalReport);
    expect(component.hasMoreReports).toBeFalse();
    expect(monthlyReportService.getMonthlyReports).toHaveBeenCalledWith(undefined, 'next-token');
  });

  it('should not load more when loading is in progress', () => {
    // ロード中の状態を設定
    component.loading = true;
    component.hasMoreReports = true;
    component.nextToken = 'next-token';
    
    // もっと読み込むメソッドを呼び出し
    component.loadMoreReports();
    
    // getMonthlyReportsが2回目は呼ばれないことを確認
    expect(monthlyReportService.getMonthlyReports).toHaveBeenCalledTimes(1);
  });

  it('should generate monthly report', () => {
    // 生成された月次レポート
    const generatedReport = {
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
      recommendedWorks: [],
      reportTitle: '2025年4月 盆栽管理レポート'
    };
    
    // レポート生成のモック
    monthlyReportService.generateMonthlyReport.and.returnValue(of(generatedReport));
    
    // 現在の年月を設定
    component.currentYear = 2025;
    component.currentMonth = 4;
    
    // レポート生成メソッドを呼び出し
    component.generateReport();
    
    // 生成中フラグが設定されることを確認
    expect(component.generating).toBeFalse(); // finalize()で元に戻る
    
    // サービスメソッドが正しく呼ばれたことを確認
    expect(monthlyReportService.generateMonthlyReport).toHaveBeenCalledWith(2025, 4);
    
    // 生成されたレポートの詳細ページに遷移することを確認
    expect(router.navigate).toHaveBeenCalledWith(['/reports', 2025, 4]);
  });

  it('should handle error when generating monthly report', () => {
    // エラーを返すようにモック
    monthlyReportService.generateMonthlyReport.and.returnValue(throwError(() => new Error('Failed to generate')));
    
    // レポート生成メソッドを呼び出し
    component.generateReport();
    
    // エラーが設定されることを確認
    expect(component.error).toBe('月次レポートの生成中にエラーが発生しました。');
    expect(component.generating).toBeFalse();
    
    // 遷移が行われないことを確認
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should navigate to report detail page', () => {
    // 月次レポート詳細ページに遷移
    component.viewReport(mockReportList[0]);
    
    // 正しいルートに遷移することを確認
    expect(router.navigate).toHaveBeenCalledWith(['/reports', 2025, 3]);
  });

  // it('should format date correctly', () => {
  //   const dateString = '2025-03-31T23:59:59Z';
  //   const formattedDate = component.formatDate(dateString);
    
  //   // 日本語のロケールでフォーマットされることを確認
  //   expect(formattedDate).toContain('2025');
  //   expect(formattedDate).toContain('3');
  //   expect(formattedDate).toContain('31');
  // });
});
