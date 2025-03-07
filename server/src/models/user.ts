/**
 * ユーザーモデル
 * 
 * このファイルはユーザーデータのモデル定義を提供します。
 */

/**
 * ユーザーインターフェース
 */
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string; // ISO 8601形式
  updatedAt: string; // ISO 8601形式
}

/**
 * ユーザープロファイル更新リクエスト
 */
export interface UpdateUserProfileRequest {
  name?: string;
}
