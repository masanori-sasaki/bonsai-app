/**
 * 月次レポートモデル
 * 
 * このファイルは、月次レポートに関連するデータモデルを定義します。
 */

import { WorkType } from './workRecord';

/**
 * 月次レポートモデル
 */
export interface MonthlyReport {
  id: string;
  userId: string;         // ユーザーID
  year: number;           // 年
  month: number;          // 月（1-12）
  generatedAt: string;    // 生成日時（ISO 8601形式）
  
  // 集計データ
  totalBonsaiCount: number;  // 盆栽総数
  totalWorkCount: number;    // 作業総数
  workTypeCounts: Record<WorkType, number>;  // 作業タイプ別カウント
  
  // 盆栽ごとのサマリー
  bonsaiSummaries: BonsaiMonthlySummary[];
  
  // 重要作業ハイライト
  highlights: WorkHighlight[];
  
  // 次月の推奨作業
  recommendedWorks: RecommendedWork[];
  
  // レポートのメタデータ
  reportTitle: string;    // レポートタイトル（例：「2025年3月 盆栽管理レポート」）
  coverImageUrl?: string; // カバー画像URL
  
  // 新着フラグ
  isNew?: boolean;        // 新着フラグ（最新のレポートの場合true）
}

/**
 * 盆栽月次サマリー
 */
export interface BonsaiMonthlySummary {
  bonsaiId: string;
  bonsaiName: string;
  species: string;
  imageUrl?: string;      // 代表画像URL
  workRecordIds: string[]; // 関連する作業記録ID
  workTypes: WorkType[];   // 実施した作業タイプ
  workSummary: string;    // 作業内容のサマリーテキスト
  hasImportantWork: boolean; // 重要な作業があったかどうか
}

/**
 * 作業ハイライト
 */
export interface WorkHighlight {
  recordId: string;
  bonsaiId: string;
  bonsaiName: string;
  workTypes: WorkType[];
  date: string;
  description: string;
  imageUrl?: string;
  importance: 'high' | 'medium' | 'low';
  highlightReason: string; // ハイライトされる理由
}

/**
 * 推奨作業
 */
export interface RecommendedWork {
  bonsaiId: string;
  bonsaiName: string;
  species: string;        // 樹種
  workTypes: WorkType[];
  reason: string;         // 推奨理由
  priority: 'high' | 'medium' | 'low';
  seasonalTips?: string;  // 季節に応じたアドバイス
}

/**
 * 月次レポート一覧レスポンス
 */
export interface MonthlyReportListResponse {
  items: MonthlyReportListItem[];
  nextToken?: string;
}

/**
 * 月次レポート一覧アイテム
 */
export interface MonthlyReportListItem {
  id: string;
  year: number;
  month: number;
  generatedAt: string;
  totalBonsaiCount: number;
  totalWorkCount: number;
  highlightCount: number;  // 重要作業の数
  isNew?: boolean;         // 新着フラグ（最新のレポートの場合true）
}

/**
 * 月次レポート作成リクエスト
 * スケジューラーから呼び出される場合は使用しない
 */
export interface CreateMonthlyReportRequest {
  year: number;
  month: number;
}
