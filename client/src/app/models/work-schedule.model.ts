import { WorkType, WORK_TYPE_LABELS, PriorityType } from './work-record.model';

/**
 * 繰り返しタイプ
 */
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

/**
 * 繰り返しパターン
 */
export interface RecurrencePattern {
  type: RecurrenceType;   // 繰り返しタイプ
  interval: number;       // 間隔（例：2週間ごとなら2）
  endDate?: string;       // 終了日（ISO 8601形式）
  occurrences?: number;   // 繰り返し回数
  weekDays?: number[];    // 週の曜日（0=日曜, 1=月曜, ..., 6=土曜）
  monthDay?: number;      // 月の日（1-31）
}

/**
 * 作業予定モデル
 */
export interface WorkSchedule {
  id: string;
  bonsaiId: string;
  workType: WorkType;     // 作業タイプ
  scheduledDate: string;  // 予定日（ISO 8601形式）
  description: string;    // 予定内容
  completed: boolean;     // 完了フラグ
  createdAt: string;      // ISO 8601形式
  updatedAt: string;      // ISO 8601形式
  
  // カレンダー表示用の拡張プロパティ（オプション）
  startTime?: string;     // 開始時間（HH:mm形式）
  endTime?: string;       // 終了時間（HH:mm形式）
  isAllDay?: boolean;     // 終日イベントフラグ
  priority?: PriorityType; // 優先度（高、中、低）
  colorCode?: string;     // 表示色（CSS色コード）
  recurrencePattern?: RecurrencePattern; // 繰り返しパターン
  reminderDays?: number;  // リマインダー日数（予定日の何日前に通知するか）
}

/**
 * 作業予定一覧レスポンス
 */
export interface WorkScheduleListResponse {
  items: WorkSchedule[];
  nextToken?: string;
}

/**
 * 作業予定作成リクエスト
 */
export interface CreateWorkScheduleRequest {
  bonsaiId: string;
  workType: WorkType;
  scheduledDate: string;
  description: string;
  completed?: boolean;
  
  // カレンダー表示用の拡張プロパティ（オプション）
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
  priority?: PriorityType;
  colorCode?: string;
  recurrencePattern?: RecurrencePattern;
  reminderDays?: number;
}

/**
 * 作業予定更新リクエスト
 */
export interface UpdateWorkScheduleRequest {
  workType?: WorkType;
  scheduledDate?: string;
  description?: string;
  completed?: boolean;
  
  // カレンダー表示用の拡張プロパティ（オプション）
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
  priority?: PriorityType;
  colorCode?: string;
  recurrencePattern?: RecurrencePattern;
  reminderDays?: number;
}
