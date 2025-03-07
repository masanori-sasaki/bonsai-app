/**
 * 作業予定ハンドラー
 * 
 * このファイルは作業予定関連のAPIリクエストを処理するハンドラー関数を提供します。
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CreateWorkScheduleRequest, UpdateWorkScheduleRequest } from '../models/workSchedule';
import { getUserIdFromRequest } from '../utils/auth';
import { InvalidRequestError } from '../utils/errors';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import * as workScheduleService from '../services/workScheduleService';

/**
 * 作業予定一覧を取得
 * 
 * @param event APIGatewayProxyEvent
 * @returns APIGatewayProxyResult
 */
export async function getWorkScheduleList(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // ユーザーIDを取得
    const userId = getUserIdFromRequest(event);
    
    // パスパラメータから盆栽IDを取得
    const bonsaiId = event.pathParameters?.bonsaiId;
    if (!bonsaiId) {
      throw new InvalidRequestError('盆栽IDが指定されていません');
    }
    
    // クエリパラメータを取得
    const queryParams = event.queryStringParameters || {};
    const completed = queryParams.completed !== undefined ? queryParams.completed === 'true' : undefined;
    const limit = queryParams.limit ? parseInt(queryParams.limit, 10) : undefined;
    const nextToken = queryParams.nextToken;
    
    // 作業予定一覧を取得
    const result = await workScheduleService.listWorkSchedules(userId, bonsaiId, completed, limit, nextToken);
    
    // 成功レスポンスを返す
    return createSuccessResponse(result);
  } catch (error) {
    // エラーレスポンスを返す
    return createErrorResponse(error as Error);
  }
}

/**
 * 作業予定詳細を取得
 * 
 * @param event APIGatewayProxyEvent
 * @returns APIGatewayProxyResult
 */
export async function getWorkScheduleDetail(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // パスパラメータから作業予定IDを取得
    const scheduleId = event.pathParameters?.scheduleId;
    if (!scheduleId) {
      throw new InvalidRequestError('作業予定IDが指定されていません');
    }
    
    // 作業予定詳細を取得
    const schedule = await workScheduleService.getWorkSchedule(scheduleId);
    
    // 成功レスポンスを返す
    return createSuccessResponse(schedule);
  } catch (error) {
    // エラーレスポンスを返す
    return createErrorResponse(error as Error);
  }
}

/**
 * 作業予定を作成
 * 
 * @param event APIGatewayProxyEvent
 * @returns APIGatewayProxyResult
 */
export async function createWorkSchedule(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // ユーザーIDを取得
    const userId = getUserIdFromRequest(event);
    
    // パスパラメータから盆栽IDを取得
    const bonsaiId = event.pathParameters?.bonsaiId;
    if (!bonsaiId) {
      throw new InvalidRequestError('盆栽IDが指定されていません');
    }
    
    // リクエストボディをパース
    if (!event.body) {
      throw new InvalidRequestError('リクエストボディが空です');
    }
    
    const data: CreateWorkScheduleRequest = JSON.parse(event.body);
    data.bonsaiId = bonsaiId; // パスパラメータの盆栽IDを設定
    
    // バリデーション
    if (!data.workType) {
      throw new InvalidRequestError('作業タイプは必須です');
    }
    if (!data.scheduledDate) {
      throw new InvalidRequestError('予定日は必須です');
    }
    if (!data.description) {
      throw new InvalidRequestError('作業内容は必須です');
    }
    
    // 作業予定を作成
    const newSchedule = await workScheduleService.createWorkSchedule(userId, data);
    
    // 成功レスポンスを返す（201 Created）
    return createSuccessResponse(newSchedule, 201);
  } catch (error) {
    // エラーレスポンスを返す
    return createErrorResponse(error as Error);
  }
}

/**
 * 作業予定を更新
 * 
 * @param event APIGatewayProxyEvent
 * @returns APIGatewayProxyResult
 */
export async function updateWorkSchedule(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // パスパラメータから作業予定IDを取得
    const scheduleId = event.pathParameters?.scheduleId;
    if (!scheduleId) {
      throw new InvalidRequestError('作業予定IDが指定されていません');
    }
    
    // リクエストボディをパース
    if (!event.body) {
      throw new InvalidRequestError('リクエストボディが空です');
    }
    
    const data: UpdateWorkScheduleRequest = JSON.parse(event.body);
    
    // 作業予定を更新
    const updatedSchedule = await workScheduleService.updateWorkSchedule(scheduleId, data);
    
    // 成功レスポンスを返す
    return createSuccessResponse(updatedSchedule);
  } catch (error) {
    // エラーレスポンスを返す
    return createErrorResponse(error as Error);
  }
}

/**
 * 作業予定を削除
 * 
 * @param event APIGatewayProxyEvent
 * @returns APIGatewayProxyResult
 */
export async function deleteWorkSchedule(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // パスパラメータから作業予定IDを取得
    const scheduleId = event.pathParameters?.scheduleId;
    if (!scheduleId) {
      throw new InvalidRequestError('作業予定IDが指定されていません');
    }
    
    // 作業予定を削除
    await workScheduleService.deleteWorkSchedule(scheduleId);
    
    // 成功レスポンスを返す
    return createSuccessResponse({
      message: '作業予定が正常に削除されました',
      id: scheduleId
    });
  } catch (error) {
    // エラーレスポンスを返す
    return createErrorResponse(error as Error);
  }
}
