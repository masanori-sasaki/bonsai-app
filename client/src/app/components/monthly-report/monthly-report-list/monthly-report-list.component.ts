import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MonthlyReportService, MonthlyReportListItem } from '../../../services/monthly-report.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-monthly-report-list',
  templateUrl: './monthly-report-list.component.html',
  styleUrls: ['./monthly-report-list.component.scss']
})
export class MonthlyReportListComponent implements OnInit {
  reports: MonthlyReportListItem[] = [];
  loading = false;
  error: string | null = null;
  nextToken?: string;
  hasMoreReports = false;
  
  // 現在の年月を取得（新規レポート生成用）
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1; // JavaScriptの月は0始まり
  
  // レポート生成中フラグ
  generating = false;

  constructor(
    private monthlyReportService: MonthlyReportService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadReports();
  }

  /**
   * 月次レポート一覧を読み込む
   */
  loadReports(): void {
    this.loading = true;
    this.error = null;
    
    this.monthlyReportService.getMonthlyReports()
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response) => {
          this.reports = response.items;
          this.nextToken = response.nextToken;
          this.hasMoreReports = !!response.nextToken;
        },
        error: (err) => {
          console.error('月次レポート一覧の取得エラー:', err);
          this.error = '月次レポートの取得中にエラーが発生しました。';
        }
      });
  }

  /**
   * さらに月次レポートを読み込む
   */
  loadMoreReports(): void {
    if (!this.nextToken || this.loading) {
      return;
    }
    
    this.loading = true;
    
    this.monthlyReportService.getMonthlyReports(undefined, this.nextToken)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response) => {
          this.reports = [...this.reports, ...response.items];
          this.nextToken = response.nextToken;
          this.hasMoreReports = !!response.nextToken;
        },
        error: (err) => {
          console.error('追加の月次レポート取得エラー:', err);
          this.error = '追加の月次レポートの取得中にエラーが発生しました。';
        }
      });
  }

  /**
   * 月次レポートを生成する
   */
  generateReport(): void {
    this.generating = true;
    this.error = null;
    
    this.monthlyReportService.generateMonthlyReport(this.currentYear, this.currentMonth)
      .pipe(
        finalize(() => this.generating = false)
      )
      .subscribe({
        next: (report) => {
          // 生成したレポートの詳細ページに遷移
          this.router.navigate(['/reports', report.year, report.month]);
        },
        error: (err) => {
          console.error('月次レポート生成エラー:', err);
          this.error = '月次レポートの生成中にエラーが発生しました。';
        }
      });
  }

  /**
   * 月次レポート詳細ページに遷移
   * 
   * @param report 月次レポート
   */
  viewReport(report: MonthlyReportListItem): void {
    this.router.navigate(['/reports', report.year, report.month]);
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
