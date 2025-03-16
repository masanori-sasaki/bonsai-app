/**
 * 月次レポートハンドラー
 * 
 * このファイルは、月次レポート関連のAPIエンドポイントを処理するハンドラーを提供します。
 * また、CloudWatch Eventsからのトリガーに対応するハンドラーも含まれています。
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, ScheduledEvent } from 'aws-lambda';
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
 * 月次レポートを生成（APIリクエスト用）
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

/**
 * 月次レポートを生成（CloudWatch Eventsからのトリガー用）
 * 
 * @param event ScheduledEvent
 * @returns void
 */
export async function handleScheduledMonthlyReportGeneration(event: ScheduledEvent): Promise<void> {
  try {
    console.log('CloudWatch Eventsからのトリガーを受信:', JSON.stringify(event));
    
    // イベントの詳細を確認
    if (event.detail && event.detail.action === 'generateMonthlyReports') {
      console.log('月次レポート生成処理を開始します');
      
      // 前月の年月を計算
      const now = new Date();
      // 現在の月から1を引いて前月にする（0になった場合は前年の12月）
      const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
      // 前月が12月の場合は前年、それ以外は現在の年
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      
      console.log(`前月の年月: ${prevYear}年${prevMonth}月`);
      
      // アクティブユーザー一覧を取得
      const activeUsers = await monthlyReportService.getActiveUsers();
      console.log(`アクティブユーザー数: ${activeUsers.length}`);
      
      // 各ユーザーに対して月次レポートを生成
      for (const userId of activeUsers) {
        try {
          console.log(`ユーザー ${userId} の月次レポート生成を開始`);
          const report = await monthlyReportService.generateMonthlyReport(
            userId,
            prevYear,
            prevMonth
          );
          console.log(`ユーザー ${userId} の月次レポート生成が完了しました: ${report.id}`);
        } catch (userError) {
          console.error(`ユーザー ${userId} の月次レポート生成中にエラーが発生しました:`, userError);
          // 個別ユーザーのエラーは無視して次のユーザーに進む
        }
      }
      
      console.log('すべてのユーザーの月次レポート生成が完了しました');
    } else {
      console.log('不明なアクションまたはイベント形式です。処理をスキップします。');
    }
  } catch (error) {
    console.error('月次レポート生成中にエラーが発生しました:', error);
    throw error; // Lambda関数のエラーログに記録するためにエラーを再スロー
  }
}
