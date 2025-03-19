/**
 * 作業予定モデル
 * 
 * このファイルは作業予定データのモデル定義を提供します。
 */

import { WorkType } from './workRecord';

/**
 * 作業予定インターフェース
 */
export interface WorkSchedule {
  id: string;
  bonsaiId: string;
  workTypes: WorkType[];  // 作業タイプの配列
  scheduledDate: string;  // 予定日（ISO 8601形式）
  description: string;    // 予定内容
  completed: boolean;     // 完了フラグ
  createdAt: string;      // ISO 8601形式
  updatedAt: string;      // ISO 8601形式
}

/**
 * 作業予定作成リクエスト
 */
export interface CreateWorkScheduleRequest {
  bonsaiId: string;
  workTypes: WorkType[];
  scheduledDate: string;
  description: string;
}

/**
 * 作業予定更新リクエスト
 */
export interface UpdateWorkScheduleRequest {
  workTypes?: WorkType[];
  scheduledDate?: string;
  description?: string;
  completed?: boolean;
}

/**
 * 作業予定一覧レスポンス
 */
export interface WorkScheduleListResponse {
  items: WorkSchedule[];
  nextToken?: string;
}
