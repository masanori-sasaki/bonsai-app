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
 * 優先度タイプ
 */
export type PriorityType = 'high' | 'medium' | 'low';

/**
 * 作業記録モデル
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
  
  // カレンダー表示用の拡張プロパティ（オプション）
  startTime?: string;     // 開始時間（HH:mm形式）
  endTime?: string;       // 終了時間（HH:mm形式）
  isAllDay?: boolean;     // 終日イベントフラグ
  priority?: PriorityType; // 優先度（高、中、低）
  colorCode?: string;     // 表示色（CSS色コード）
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
  workTypes: WorkType[];
  date: string;
  description: string;
  imageUrls?: string[];
  
  // カレンダー表示用の拡張プロパティ（オプション）
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
  priority?: PriorityType;
  colorCode?: string;
}

/**
 * 作業記録更新リクエスト
 */
export interface UpdateWorkRecordRequest {
  workTypes?: WorkType[];
  date?: string;
  description?: string;
  imageUrls?: string[];
  
  // カレンダー表示用の拡張プロパティ（オプション）
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
  priority?: PriorityType;
  colorCode?: string;
}
