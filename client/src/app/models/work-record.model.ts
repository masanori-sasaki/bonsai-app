/**
 * 作業タイプ
 */
export type WorkType = 'pruning' | 'repotting' | 'watering' | 'fertilizing' | 'other';

/**
 * 作業タイプの表示名マッピング
 */
export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  pruning: '剪定',
  repotting: '植替え',
  watering: '水やり',
  fertilizing: '肥料',
  other: 'その他'
};

/**
 * 作業記録モデル
 */
export interface WorkRecord {
  id: string;
  bonsaiId: string;
  workType: WorkType;     // 作業タイプ（剪定、植替え、水やり、肥料、その他）
  date: string;           // 作業日（ISO 8601形式）
  description: string;    // 作業内容の詳細
  imageUrls: string[];    // 作業前後の画像URL配列
  createdAt: string;      // ISO 8601形式
  updatedAt: string;      // ISO 8601形式
}

/**
 * 作業記録一覧レスポンス
 */
export interface WorkRecordListResponse {
  items: WorkRecord[];
  nextToken?: string;
}

/**
 * 作業記録作成リクエスト
 */
export interface CreateWorkRecordRequest {
  bonsaiId: string;
  workType: WorkType;
  date: string;
  description: string;
  imageUrls?: string[];
}

/**
 * 作業記録更新リクエスト
 */
export interface UpdateWorkRecordRequest {
  workType?: WorkType;
  date?: string;
  description?: string;
  imageUrls?: string[];
}
