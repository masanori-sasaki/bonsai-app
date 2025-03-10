/**
 * 作業記録モデル
 * 
 * このファイルは作業記録データのモデル定義を提供します。
 */

/**
 * 作業タイプ
 */
export type WorkType = 'pruning' | 'repotting' | 'watering' | 'fertilizing' | 'other';

/**
 * 作業記録インターフェース
 */
export interface WorkRecord {
  id: string;
  bonsaiId: string;
  workTypes: WorkType[];  // 作業タイプ（剪定、植替え、水やり、肥料、その他）の配列
  date: string;           // 作業日（ISO 8601形式）
  description: string;    // 作業内容の詳細
  imageUrls: string[];    // 作業前後の画像URL配列
  createdAt: string;      // ISO 8601形式
  updatedAt: string;      // ISO 8601形式
}

/**
 * 作業記録作成リクエスト
 */
export interface CreateWorkRecordRequest {
  bonsaiId: string;
  workTypes: WorkType[];
  date: string;
  description: string;
  imageUrls?: string[];
}

/**
 * 作業記録更新リクエスト
 */
export interface UpdateWorkRecordRequest {
  workTypes?: WorkType[];
  date?: string;
  description?: string;
  imageUrls?: string[];
}

/**
 * 作業記録一覧レスポンス
 */
export interface WorkRecordListResponse {
  items: WorkRecord[];
  nextToken?: string;
}
