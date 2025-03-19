import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

/**
 * 月次レポートのリストアイテムインターフェース
 */
export interface MonthlyReportListItem {
  id: string;
  year: number;
  month: number;
  generatedAt: string;
  totalBonsaiCount: number;
  totalWorkCount: number;
  highlightCount: number;
  isNew?: boolean;
}

/**
 * 月次レポートのリストレスポンスインターフェース
 */
export interface MonthlyReportListResponse {
  items: MonthlyReportListItem[];
  nextToken?: string;
}

/**
 * 盆栽月次サマリーインターフェース
 */
export interface BonsaiMonthlySummary {
  bonsaiId: string;
  bonsaiName: string;
  species: string;
  imageUrl?: string;
  workRecordIds: string[];
  workTypes: string[];
  workSummary: string;
  hasImportantWork: boolean;
}

/**
 * 作業ハイライトインターフェース
 */
export interface WorkHighlight {
  recordId: string;
  bonsaiId: string;
  bonsaiName: string;
  workTypes: string[];
  date: string;
  description: string;
  imageUrl?: string;
  importance: 'high' | 'medium' | 'low';
  highlightReason: string;
}

/**
 * 推奨作業インターフェース
 */
export interface RecommendedWork {
  bonsaiId: string;
  bonsaiName: string;
  species: string;
  workTypes: string[];
  reason: string;
  priority: 'high' | 'medium' | 'low';
  seasonalTips?: string;
}

/**
 * 月次レポート詳細インターフェース
 */
export interface MonthlyReport {
  id: string;
  userId: string;
  year: number;
  month: number;
  generatedAt: string;
  totalBonsaiCount: number;
  totalWorkCount: number;
  workTypeCounts: Record<string, number>;
  bonsaiSummaries: BonsaiMonthlySummary[];
  highlights: WorkHighlight[];
  recommendedWorks: RecommendedWork[];
  reportTitle: string;
  coverImageUrl?: string;
  isNew?: boolean;
}

/**
 * 月次レポート作成リクエストインターフェース
 */
export interface CreateMonthlyReportRequest {
  year: number;
  month: number;
}

/**
 * 月次レポートサービス
 * 
 * 月次レポートの取得や生成を行うサービス
 */
@Injectable({
  providedIn: 'root'
})
export class MonthlyReportService {

  constructor(private apiService: ApiService) { }

  /**
   * 月次レポート一覧を取得
   * 
   * @param limit 取得件数（オプション）
   * @param nextToken ページネーショントークン（オプション）
   * @returns 月次レポート一覧
   */
  getMonthlyReports(limit?: number, nextToken?: string): Observable<MonthlyReportListResponse> {
    let url = 'reports';
    const params: Record<string, string> = {};
    
    if (limit) {
      params['limit'] = limit.toString();
    }
    
    if (nextToken) {
      params['nextToken'] = nextToken;
    }
    
    return this.apiService.get<MonthlyReportListResponse>(url, params);
  }

  /**
   * 月次レポート詳細を取得
   * 
   * @param year 年
   * @param month 月（1-12）
   * @returns 月次レポート詳細
   */
  getMonthlyReport(year: number, month: number): Observable<MonthlyReport> {
    const url = `reports/${year}/${month}`;
    return this.apiService.get<MonthlyReport>(url);
  }

  /**
   * 月次レポートを生成
   * 
   * @param year 年
   * @param month 月（1-12）
   * @returns 生成された月次レポート
   */
  generateMonthlyReport(year: number, month: number): Observable<MonthlyReport> {
    const url = 'reports';
    const data: CreateMonthlyReportRequest = { year, month };
    return this.apiService.post<MonthlyReport>(url, data);
  }

  /**
   * 月の名前を取得
   * 
   * @param month 月（1-12）
   * @returns 月の名前
   */
  getMonthName(month: number): string {
    const monthNames = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ];
    return monthNames[month - 1];
  }

  /**
   * 作業タイプの表示名を取得
   * 
   * @param workType 作業タイプ
   * @returns 作業タイプの表示名
   */
  getWorkTypeLabel(workType: string): string {
    const workTypeLabels: Record<string, string> = {
      pruning: '剪定',
      repotting: '植替え',
      watering: '水やり',
      fertilizing: '肥料',
      wire: '針金かけ',
      wireremove: '針金はずし',
      leafpull: '芽摘み',
      leafcut: '芽切り',
      leafpeel: '葉透かし',
      disinfection: '消毒',
      carving: '彫刻',
      replant: '改作',
      protection: '保護',
      other: 'その他'
    };
    
    return workTypeLabels[workType] || workType;
  }

  /**
   * 優先度の表示名を取得
   * 
   * @param priority 優先度
   * @returns 優先度の表示名
   */
  getPriorityLabel(priority: 'high' | 'medium' | 'low'): string {
    const priorityLabels: Record<string, string> = {
      high: '高',
      medium: '中',
      low: '低'
    };
    
    return priorityLabels[priority] || priority;
  }

  /**
   * 優先度に応じたCSSクラスを取得
   * 
   * @param priority 優先度
   * @returns CSSクラス
   */
  getPriorityClass(priority: 'high' | 'medium' | 'low'): string {
    const priorityClasses: Record<string, string> = {
      high: 'priority-high',
      medium: 'priority-medium',
      low: 'priority-low'
    };
    
    return priorityClasses[priority] || '';
  }
}
