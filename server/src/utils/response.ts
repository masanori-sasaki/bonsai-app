/**
 * レスポンスユーティリティ
 * 
 * このファイルはAPIレスポンスを生成するためのユーティリティ関数を提供します。
 */

import { APIGatewayProxyResult } from 'aws-lambda';
import { AppError } from './errors';

/**
 * 成功レスポンスを生成
 * 
 * @param data レスポンスデータ
 * @param statusCode HTTPステータスコード（デフォルト: 200）
 * @returns APIGatewayProxyResult
 */
export function createSuccessResponse(data: any, statusCode: number = 200): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // CORS対応
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(data)
  };
}

/**
 * エラーレスポンスを生成
 * 
 * @param error エラーオブジェクト
 * @returns APIGatewayProxyResult
 */
export function createErrorResponse(error: Error): APIGatewayProxyResult {
  console.error('エラー:', error);
  
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // CORS対応
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(error.toResponse())
    };
  }
  
  // 未知のエラーの場合は500エラーを返す
  return {
    statusCode: 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // CORS対応
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバー内部エラーが発生しました'
      }
    })
  };
}
