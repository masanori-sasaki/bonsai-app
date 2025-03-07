/**
 * 盆栽モデル
 */
export interface Bonsai {
  id: string;
  name: string;           // 盆栽の名前
  species: string;        // 樹種
  registrationDate: string; // 登録日（ISO 8601形式）
  history?: string;        // 来歴
  imageUrls: string[];    // 画像URL配列
  createdAt: string;      // ISO 8601形式
  updatedAt: string;      // ISO 8601形式
}

/**
 * 盆栽詳細レスポンス（作業記録と作業予定を含む）
 */
export interface BonsaiDetail extends Bonsai {
  recentWorks?: {
    id: string;
    workType: string;
    date: string;
  }[];
  upcomingWorks?: {
    id: string;
    workType: string;
    scheduledDate: string;
  }[];
}

/**
 * 盆栽一覧レスポンス
 */
export interface BonsaiListResponse {
  items: Bonsai[];
  nextToken?: string;
}

/**
 * 盆栽作成リクエスト
 */
export interface CreateBonsaiRequest {
  name: string;
  species: string;
  registrationDate: string;
  history?: string;
  imageUrls?: string[];
}

/**
 * 盆栽更新リクエスト
 */
export interface UpdateBonsaiRequest {
  name?: string;
  species?: string;
  registrationDate?: string;
  history?: string;
  imageUrls?: string[];
}
