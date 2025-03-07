/**
 * 認証ユーティリティ
 * 
 * このファイルは認証関連のユーティリティ関数を提供します。
 * AWS Lambda関数とExpress.jsの両方で使用できます。
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from './errors';

// JWT署名用のシークレットキー（開発環境用）
// 本番環境では環境変数から取得するか、AWS Secrets Managerなどを使用
const JWT_SECRET = process.env.JWT_SECRET || 'bonsai-app-development-secret-key';

// トークンの有効期限（1日）
const TOKEN_EXPIRATION = '1d';

/**
 * JWTトークンを生成
 * 
 * @param payload トークンに含めるデータ
 * @returns 生成されたトークン
 */
export function generateToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
}

/**
 * JWTトークンを検証
 * 
 * @param token 検証するトークン
 * @returns デコードされたペイロード
 * @throws Error トークンが無効な場合
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new UnauthorizedError('無効なトークンです');
  }
}

/**
 * Express.js用の認証ミドルウェア
 * 
 * @param req リクエスト
 * @param res レスポンス
 * @param next 次のミドルウェア
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('認証ヘッダーがありません');
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    // リクエストオブジェクトにユーザー情報を追加
    (req as any).user = decoded;
    
    next();
  } catch (error) {
    res.status(401).json({
      message: error instanceof Error ? error.message : '認証に失敗しました'
    });
  }
}

/**
 * リクエストからユーザーIDを取得
 * 
 * @param event APIGatewayProxyEvent
 * @returns ユーザーID
 * @throws UnauthorizedError 認証情報が不足している場合
 */
export function getUserIdFromRequest(event: APIGatewayProxyEvent): string {
  // 開発環境の場合は固定のユーザーIDを返す
  if (!event.requestContext || !event.requestContext.authorizer) {
    console.log('開発環境用の固定ユーザーIDを使用します');
    return 'dev-user-123';
  }
  
  // 認証情報はAPI Gateway/Lambda Function URLの統合によって
  // requestContext.authorizer.claimsに格納される
  const claims = event.requestContext.authorizer?.claims;
  
  if (!claims || !claims.sub) {
    throw new UnauthorizedError('有効な認証情報がありません');
  }
  
  return claims.sub;
}

/**
 * リクエストからIDトークンを取得
 * 
 * @param event APIGatewayProxyEvent
 * @returns IDトークン
 * @throws UnauthorizedError 認証情報が不足している場合
 */
export function getTokenFromRequest(event: APIGatewayProxyEvent): string {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  if (!authHeader) {
    throw new UnauthorizedError('認証ヘッダーがありません');
  }
  
  const match = authHeader.match(/^Bearer\s+(.*)$/);
  if (!match) {
    throw new UnauthorizedError('無効な認証ヘッダー形式です');
  }
  
  return match[1];
}

/**
 * リクエストからユーザーのメールアドレスを取得
 * 
 * @param event APIGatewayProxyEvent
 * @returns メールアドレス
 * @throws UnauthorizedError 認証情報が不足している場合
 */
export function getUserEmailFromRequest(event: APIGatewayProxyEvent): string {
  // 開発環境の場合は固定のメールアドレスを返す
  if (!event.requestContext || !event.requestContext.authorizer) {
    console.log('開発環境用の固定メールアドレスを使用します');
    return 'dev-user@example.com';
  }
  
  const claims = event.requestContext.authorizer?.claims;
  
  if (!claims || !claims.email) {
    throw new UnauthorizedError('有効な認証情報がありません');
  }
  
  return claims.email;
}
