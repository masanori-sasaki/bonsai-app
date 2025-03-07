/**
 * ユーザーモデル
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

/**
 * 認証状態
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  idToken: string | null;
  accessToken: string | null;
  refreshToken: string | null;
}

/**
 * サインインリクエスト
 */
export interface SignInRequest {
  email: string;
  password: string;
}

/**
 * サインアップリクエスト
 */
export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
}

/**
 * 確認コード送信リクエスト
 */
export interface ConfirmSignUpRequest {
  email: string;
  code: string;
}

/**
 * パスワードリセットリクエスト
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * パスワードリセット確認リクエスト
 */
export interface ConfirmForgotPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}
