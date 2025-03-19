import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { MonthlyReportDetailComponent } from './monthly-report-detail.component';
import { MonthlyReportService, MonthlyReport } from '../../../services/monthly-report.service';

describe('MonthlyReportDetailComponent', () => {
  let component: MonthlyReportDetailComponent;
  let fixture: ComponentFixture<MonthlyReportDetailComponent>;
  let monthlyReportService: jasmine.SpyObj<MonthlyReportService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  // テスト用の月次レポートデータ
  const mockReport: MonthlyReport = {
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
      },
      {
        bonsaiId: 'bonsai2',
        bonsaiName: '真柏',
        species: '真柏（Juniperus chinensis）',
        imageUrl: 'https://example.com/images/bonsai2-1.jpg',
        workRecordIds: ['record3', 'record4'],
        workTypes: ['watering', 'fertilizing'],
        workSummary: '水やり(3/15, 3/25), 肥料(3/20)',
        hasImportantWork: false
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
      },
      {
        bonsaiId: 'bonsai2',
        bonsaiName: '真柏',
        species: '真柏（Juniperus chinensis）',
        workTypes: ['pruning'],
        reason: '樹形を整えるための剪定時期です',
        priority: 'medium',
        seasonalTips: '強い剪定は避け、軽く整える程度にしましょう'
      }
    ],
    reportTitle: '2025年3月 盆栽管理レポート',
    coverImageUrl: 'https://example.com/images/record1-1.jpg',
    isNew: true
  };

  beforeEach(async () => {
    // MonthlyReportServiceのモック
    const monthlyReportServiceSpy = jasmine.createSpyObj('MonthlyReportService', [
      'getMonthlyReport',
      'getMonthName',
      'getWorkTypeLabel',
      'getPriorityLabel',
      'getPriorityClass'
    ]);
    
    // Routerのモック
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    
    // ActivatedRouteのモック
    activatedRoute = {
      params: of({ year: '2025', month: '3' })
    };

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [MonthlyReportDetailComponent],
      providers: [
        { provide: MonthlyReportService, useValue: monthlyReportServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).compileComponents();

    monthlyReportService = TestBed.inject(MonthlyReportService) as jasmine.SpyObj<MonthlyReportService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    // 月次レポート詳細取得のモック
    monthlyReportService.getMonthlyReport.and.returnValue(of(mockReport));
    
    // 月名取得のモック
    monthlyReportService.getMonthName.and.callFake((month: number) => `${month}月`);
    
    // 作業タイプの表示名取得のモック
    monthlyReportService.getWorkTypeLabel.and.callFake((workType: string) => {
      const labels: Record<string, string> = {
        pruning: '剪定',
        watering: '水やり',
        fertilizing: '肥料',
        wire: '針金かけ'
      };
      return labels[workType] || workType;
    });
    
    // 優先度の表示名取得のモック
    monthlyReportService.getPriorityLabel.and.callFake((priority: 'high' | 'medium' | 'low') => {
      const labels: Record<string, string> = {
        high: '高',
        medium: '中',
        low: '低'
      };
      return labels[priority] || priority;
    });
    
    // 優先度のCSSクラス取得のモック
    monthlyReportService.getPriorityClass.and.callFake((priority: 'high' | 'medium' | 'low') => {
      const classes: Record<string, string> = {
        high: 'priority-high',
        medium: 'priority-medium',
        low: 'priority-low'
      };
      return classes[priority] || '';
    });
    
    fixture = TestBed.createComponent(MonthlyReportDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load monthly report on init', () => {
    expect(component.report).toEqual(mockReport);
    expect(component.loading).toBeFalse();
    expect(component.error).toBeNull();
    expect(component.year).toBe(2025);
    expect(component.month).toBe(3);
    expect(component.workTypeKeys).toEqual(['pruning', 'watering', 'fertilizing']);
    expect(monthlyReportService.getMonthlyReport).toHaveBeenCalledWith(2025, 3);
  });

  it('should handle error when loading monthly report', () => {
    // エラーを返すようにモック
    monthlyReportService.getMonthlyReport.and.returnValue(throwError(() => new Error('Failed to load')));
    
    // コンポーネントを再作成
    fixture = TestBed.createComponent(MonthlyReportDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // エラーが設定されることを確認
    expect(component.error).toBe('月次レポートの取得中にエラーが発生しました。');
    expect(component.loading).toBeFalse();
  });

  it('should handle invalid year/month parameters', () => {
    // 無効なパラメータを設定
    activatedRoute.params = of({ year: 'invalid', month: 'invalid' });
    
    // コンポーネントを再作成
    fixture = TestBed.createComponent(MonthlyReportDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // エラーが設定されることを確認
    expect(component.error).toBe('無効な年月です');
    expect(monthlyReportService.getMonthlyReport).not.toHaveBeenCalled();
  });

  it('should navigate back to reports list', () => {
    // 戻るメソッドを呼び出し
    component.goBack();
    
    // 正しいルートに遷移することを確認
    expect(router.navigate).toHaveBeenCalledWith(['/reports']);
  });

  it('should navigate to bonsai detail page', () => {
    // 盆栽詳細ページに遷移
    component.viewBonsai('bonsai1');
    
    // 正しいルートに遷移することを確認
    expect(router.navigate).toHaveBeenCalledWith(['/bonsai', 'bonsai1']);
  });

  it('should navigate to work record detail page', () => {
    // 作業記録詳細ページに遷移
    component.viewWorkRecord('record1');
    
    // 正しいルートに遷移することを確認
    expect(router.navigate).toHaveBeenCalledWith(['/records', 'record1']);
  });

  it('should switch active tab', () => {
    // 初期状態を確認
    expect(component.activeTab).toBe('summary');
    
    // タブを切り替え
    component.setActiveTab('highlights');
    expect(component.activeTab).toBe('highlights');
    
    component.setActiveTab('recommendations');
    expect(component.activeTab).toBe('recommendations');
    
    component.setActiveTab('summary');
    expect(component.activeTab).toBe('summary');
  });

  it('should call print function when printReport is called', () => {
    // window.printのモック
    spyOn(window, 'print');
    
    // 印刷メソッドを呼び出し
    component.printReport();
    
    // window.printが呼ばれることを確認
    expect(window.print).toHaveBeenCalled();
  });

  it('should get month name from service', () => {
    const result = component.getMonthName(3);
    expect(result).toBe('3月');
    expect(monthlyReportService.getMonthName).toHaveBeenCalledWith(3);
  });

  it('should get work type label from service', () => {
    const result = component.getWorkTypeLabel('pruning');
    expect(result).toBe('剪定');
    expect(monthlyReportService.getWorkTypeLabel).toHaveBeenCalledWith('pruning');
  });

  it('should get priority label from service', () => {
    const result = component.getPriorityLabel('high');
    expect(result).toBe('高');
    expect(monthlyReportService.getPriorityLabel).toHaveBeenCalledWith('high');
  });

  it('should get priority class from service', () => {
    const result = component.getPriorityClass('high');
    expect(result).toBe('priority-high');
    expect(monthlyReportService.getPriorityClass).toHaveBeenCalledWith('high');
  });

  it('should format date correctly', () => {
    const dateString = '2025-03-10T10:00:00Z';
    const formattedDate = component.formatDate(dateString);
    
    // 日本語のロケールでフォーマットされることを確認
    expect(formattedDate).toContain('2025');
    expect(formattedDate).toContain('3');
    expect(formattedDate).toContain('10');
  });

  it('should format date time correctly', () => {
    const dateString = '2025-03-31T23:59:59Z';
    const formattedDateTime = component.formatDateTime(dateString);
    
    // 日本語のロケールでフォーマットされることを確認
    expect(formattedDateTime).toContain('2025');
    expect(formattedDateTime).toContain('3');
    expect(formattedDateTime).toContain('31');
    // 時間も含まれることを確認
    expect(formattedDateTime).toMatch(/\d{1,2}:\d{2}/);
  });
});
