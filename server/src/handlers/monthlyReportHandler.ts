/**
 * 月次レポートハンドラー
 * 
 * このファイルは、月次レポート関連のAPIエンドポイントを処理するハンドラーを提供します。
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as monthlyReportService from '../services/monthlyReportService';
import { CreateMonthlyReportRequest } from '../models/monthlyReport';
import { getUserIdFromRequest } from '../utils/auth';
import { InvalidRequestError } from '../utils/errors';
import { createSuccessResponse, createErrorResponse } from '../utils/response';

/**
 * 月次レポート一覧を取得
 * 
 * @param event APIGatewayProxyEvent
 * @returns APIGatewayProxyResult
 */
export async function listMonthlyReports(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserIdFromRequest(event);
    const queryParams = event.queryStringParameters || {};
    const limit = queryParams.limit ? parseInt(queryParams.limit, 10) : undefined;
    const nextToken = queryParams.nextToken;
    
    const reports = await monthlyReportService.listMonthlyReports(userId, limit, nextToken);
    
    return createSuccessResponse(reports);
  } catch (error) {
    return createErrorResponse(error as Error);
  }
}

/**
 * 月次レポート詳細を取得
 * 
 * @param event APIGatewayProxyEvent
 * @returns APIGatewayProxyResult
 */
export async function getMonthlyReport(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserIdFromRequest(event);
    const year = parseInt(event.pathParameters?.year || '', 10);
    const month = parseInt(event.pathParameters?.month || '', 10);
    
    // 年月の妥当性チェック
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      throw new InvalidRequestError('無効な年月です', { year, month });
    }
    
    const report = await monthlyReportService.getMonthlyReport(userId, year, month);
    
    return createSuccessResponse(report);
  } catch (error) {
    return createErrorResponse(error as Error);
  }
}

/**
 * 月次レポートを生成
 * 
 * @param event APIGatewayProxyEvent
 * @returns APIGatewayProxyResult
 */
export async function generateMonthlyReport(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserIdFromRequest(event);
    
    // リクエストボディをパース
    if (!event.body) {
      throw new InvalidRequestError('リクエストボディが空です');
    }
    
    const requestBody: CreateMonthlyReportRequest = JSON.parse(event.body);
    
    // リクエストボディの妥当性チェック
    if (!requestBody.year || !requestBody.month || requestBody.month < 1 || requestBody.month > 12) {
      throw new InvalidRequestError('無効な年月です', { 
        year: requestBody.year, 
        month: requestBody.month 
      });
    }
    
    const report = await monthlyReportService.generateMonthlyReport(
      userId,
      requestBody.year,
      requestBody.month
    );
    
    return createSuccessResponse(report);
  } catch (error) {
    return createErrorResponse(error as Error);
  }
}
