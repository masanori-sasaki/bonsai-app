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
  // レスポンスデータをログに出力
  console.log('APIレスポンス:', {
    statusCode,
    data
  });
  
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json'
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
  
  let response: APIGatewayProxyResult;
  
  if (error instanceof AppError) {
    const errorResponse = error.toResponse();
    
    // エラーレスポンスをログに出力
    console.log('APIエラーレスポンス:', {
      statusCode: error.statusCode,
      error: errorResponse
    });
    
    response = {
      statusCode: error.statusCode,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(errorResponse)
    };
  } else {
    // 未知のエラーの場合は500エラーを返す
    const errorResponse = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバー内部エラーが発生しました'
      }
    };
    
    // エラーレスポンスをログに出力
    console.log('APIエラーレスポンス:', {
      statusCode: 500,
      error: errorResponse
    });
    
    response = {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(errorResponse)
    };
  }
  
  return response;
}
