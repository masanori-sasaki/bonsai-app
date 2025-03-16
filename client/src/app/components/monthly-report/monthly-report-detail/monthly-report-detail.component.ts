import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MonthlyReportService, MonthlyReport, BonsaiMonthlySummary, WorkHighlight, RecommendedWork } from '../../../services/monthly-report.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-monthly-report-detail',
  templateUrl: './monthly-report-detail.component.html',
  styleUrls: ['./monthly-report-detail.component.scss']
})
export class MonthlyReportDetailComponent implements OnInit {
  report: MonthlyReport | null = null;
  loading = false;
  error: string | null = null;
  
  // 年月パラメータ
  year: number = 0;
  month: number = 0;
  
  // 表示用の作業タイプ配列
  workTypeKeys: string[] = [];
  
  // アクティブなタブ
  activeTab: 'summary' | 'highlights' | 'recommendations' = 'summary';

  constructor(
    private monthlyReportService: MonthlyReportService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.year = +params['year'];
      this.month = +params['month'];
      
      if (isNaN(this.year) || isNaN(this.month) || this.month < 1 || this.month > 12) {
        this.error = '無効な年月です';
        return;
      }
      
      this.loadReport();
    });
  }

  /**
   * 月次レポートを読み込む
   */
  loadReport(): void {
    this.loading = true;
    this.error = null;
    
    this.monthlyReportService.getMonthlyReport(this.year, this.month)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (report) => {
          this.report = report;
          
          // 作業タイプのキーを取得
          if (report.workTypeCounts) {
            this.workTypeKeys = Object.keys(report.workTypeCounts)
              .sort((a, b) => report.workTypeCounts[b] - report.workTypeCounts[a]);
          }
        },
        error: (err) => {
          console.error('月次レポート詳細の取得エラー:', err);
          this.error = '月次レポートの取得中にエラーが発生しました。';
        }
      });
  }

  /**
   * 月次レポート一覧ページに戻る
   */
  goBack(): void {
    this.router.navigate(['/reports']);
  }

  /**
   * 盆栽詳細ページに遷移
   * 
   * @param bonsaiId 盆栽ID
   */
  viewBonsai(bonsaiId: string): void {
    this.router.navigate(['/bonsai', bonsaiId]);
  }

  /**
   * 作業記録詳細ページに遷移
   * 
   * @param recordId 作業記録ID
   */
  viewWorkRecord(recordId: string): void {
    this.router.navigate(['/records', recordId]);
  }

  /**
   * 印刷する
   */
  printReport(): void {
    window.print();
  }

  /**
   * タブを切り替える
   * 
   * @param tab タブ名
   */
  setActiveTab(tab: 'summary' | 'highlights' | 'recommendations'): void {
    this.activeTab = tab;
  }

  /**
   * 月の名前を取得
   * 
   * @param month 月（1-12）
   * @returns 月の名前
   */
  getMonthName(month: number): string {
    return this.monthlyReportService.getMonthName(month);
  }

  /**
   * 作業タイプの表示名を取得
   * 
   * @param workType 作業タイプ
   * @returns 作業タイプの表示名
   */
  getWorkTypeLabel(workType: string): string {
    return this.monthlyReportService.getWorkTypeLabel(workType);
  }

  /**
   * 優先度の表示名を取得
   * 
   * @param priority 優先度
   * @returns 優先度の表示名
   */
  getPriorityLabel(priority: 'high' | 'medium' | 'low'): string {
    return this.monthlyReportService.getPriorityLabel(priority);
  }

  /**
   * 優先度に応じたCSSクラスを取得
   * 
   * @param priority 優先度
   * @returns CSSクラス
   */
  getPriorityClass(priority: 'high' | 'medium' | 'low'): string {
    return this.monthlyReportService.getPriorityClass(priority);
  }

  /**
   * 日付をフォーマット
   * 
   * @param dateString ISO 8601形式の日付文字列
   * @returns フォーマットされた日付
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * 日時をフォーマット
   * 
   * @param dateString ISO 8601形式の日付文字列
   * @returns フォーマットされた日時
   */
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
