/**
 * 作業記録ハンドラー
 * 
 * このファイルは作業記録関連のAPIリクエストを処理するハンドラー関数を提供します。
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CreateWorkRecordRequest, UpdateWorkRecordRequest } from '../models/workRecord';
import { getUserIdFromRequest } from '../utils/auth';
import { InvalidRequestError } from '../utils/errors';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import * as workRecordService from '../services/workRecordService';

/**
 * 作業記録一覧を取得
 * 
 * @param event APIGatewayProxyEvent
 * @returns APIGatewayProxyResult
 */
export async function getWorkRecordList(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
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
    const workTypes = queryParams.workTypes ? queryParams.workTypes.split(',') : undefined;
    const limit = queryParams.limit ? parseInt(queryParams.limit, 10) : undefined;
    const nextToken = queryParams.nextToken;
    
    // 作業記録一覧を取得
    const result = await workRecordService.listWorkRecords(userId, bonsaiId, workTypes, limit, nextToken);
    
    // 成功レスポンスを返す
    return createSuccessResponse(result);
  } catch (error) {
    // エラーレスポンスを返す
    return createErrorResponse(error as Error);
  }
}

/**
 * 作業記録詳細を取得
 * 
 * @param event APIGatewayProxyEvent
 * @returns APIGatewayProxyResult
 */
export async function getWorkRecordDetail(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // パスパラメータから作業記録IDを取得
    const recordId = event.pathParameters?.recordId;
    if (!recordId) {
      throw new InvalidRequestError('作業記録IDが指定されていません');
    }
    
    // 作業記録詳細を取得
    const record = await workRecordService.getWorkRecord(recordId);
    
    // 成功レスポンスを返す
    return createSuccessResponse(record);
  } catch (error) {
    // エラーレスポンスを返す
    return createErrorResponse(error as Error);
  }
}

/**
 * 作業記録を作成
 * 
 * @param event APIGatewayProxyEvent
 * @returns APIGatewayProxyResult
 */
export async function createWorkRecord(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
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
    
    const data: CreateWorkRecordRequest = JSON.parse(event.body);
    data.bonsaiId = bonsaiId; // パスパラメータの盆栽IDを設定
    
    // バリデーション
    if (!data.workTypes || data.workTypes.length === 0) {
      // 作業タイプは必須ではなくなったため、空の配列を設定
      data.workTypes = [];
    }
    if (!data.date) {
      throw new InvalidRequestError('作業日は必須です');
    }
    if (!data.description) {
      throw new InvalidRequestError('作業内容は必須です');
    }
    
    // 作業記録を作成
    const newRecord = await workRecordService.createWorkRecord(userId, data);
    
    // 成功レスポンスを返す（201 Created）
    return createSuccessResponse(newRecord, 201);
  } catch (error) {
    // エラーレスポンスを返す
    return createErrorResponse(error as Error);
  }
}

/**
 * 作業記録を更新
 * 
 * @param event APIGatewayProxyEvent
 * @returns APIGatewayProxyResult
 */
export async function updateWorkRecord(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // パスパラメータから作業記録IDを取得
    const recordId = event.pathParameters?.recordId;
    if (!recordId) {
      throw new InvalidRequestError('作業記録IDが指定されていません');
    }
    
    // リクエストボディをパース
    if (!event.body) {
      throw new InvalidRequestError('リクエストボディが空です');
    }
    
    const data: UpdateWorkRecordRequest = JSON.parse(event.body);
    
    // 作業記録を更新
    const updatedRecord = await workRecordService.updateWorkRecord(recordId, data);
    
    // 成功レスポンスを返す
    return createSuccessResponse(updatedRecord);
  } catch (error) {
    // エラーレスポンスを返す
    return createErrorResponse(error as Error);
  }
}

/**
 * 作業記録を削除
 * 
 * @param event APIGatewayProxyEvent
 * @returns APIGatewayProxyResult
 */
export async function deleteWorkRecord(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // パスパラメータから作業記録IDを取得
    const recordId = event.pathParameters?.recordId;
    if (!recordId) {
      throw new InvalidRequestError('作業記録IDが指定されていません');
    }
    
    // 作業記録を削除
    await workRecordService.deleteWorkRecord(recordId);
    
    // 成功レスポンスを返す
    return createSuccessResponse({
      message: '作業記録が正常に削除されました',
      id: recordId
    });
  } catch (error) {
    // エラーレスポンスを返す
    return createErrorResponse(error as Error);
  }
}
