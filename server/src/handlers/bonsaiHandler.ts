/**
 * 盆栽ハンドラー
 * 
 * このファイルは盆栽関連のAPIリクエストを処理するハンドラー関数を提供します。
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Bonsai, CreateBonsaiRequest, UpdateBonsaiRequest } from '../models/bonsai';
import { getUserIdFromRequest } from '../utils/auth';
import { InvalidRequestError } from '../utils/errors';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import * as bonsaiService from '../services/bonsaiService';

/**
 * 盆栽一覧を取得
 * 
 * @param event APIGatewayProxyEvent
 * @returns APIGatewayProxyResult
 */
export async function getBonsaiList(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // ユーザーIDを取得
    const userId = getUserIdFromRequest(event);
    
    // クエリパラメータを取得
    const queryParams = event.queryStringParameters || {};
    const limit = queryParams.limit ? parseInt(queryParams.limit, 10) : undefined;
    const nextToken = queryParams.nextToken;
    
    // 盆栽一覧を取得
    const result = await bonsaiService.listBonsai(userId, limit, nextToken);
    
    // 成功レスポンスを返す
    return createSuccessResponse(result);
  } catch (error) {
    // エラーレスポンスを返す
    return createErrorResponse(error as Error);
  }
}

/**
 * 盆栽詳細を取得
 * 
 * @param event APIGatewayProxyEvent
 * @returns APIGatewayProxyResult
 */
export async function getBonsaiDetail(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // ユーザーIDを取得
    const userId = getUserIdFromRequest(event);
    
    // パスパラメータから盆栽IDを取得
    const bonsaiId = event.pathParameters?.bonsaiId;
    if (!bonsaiId) {
      throw new InvalidRequestError('盆栽IDが指定されていません');
    }
    
    // 盆栽詳細を取得
    const bonsai = await bonsaiService.getBonsai(userId, bonsaiId);
    
    // 成功レスポンスを返す
    return createSuccessResponse(bonsai);
  } catch (error) {
    // エラーレスポンスを返す
    return createErrorResponse(error as Error);
  }
}

/**
 * 盆栽を作成
 * 
 * @param event APIGatewayProxyEvent
 * @returns APIGatewayProxyResult
 */
export async function createBonsai(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // ユーザーIDを取得
    const userId = getUserIdFromRequest(event);
    
    // リクエストボディをパース
    if (!event.body) {
      throw new InvalidRequestError('リクエストボディが空です');
    }
    
    const data: CreateBonsaiRequest = JSON.parse(event.body);
    
    // バリデーション
    if (!data.name) {
      throw new InvalidRequestError('盆栽名は必須です');
    }
    if (!data.species) {
      throw new InvalidRequestError('樹種は必須です');
    }
    if (!data.registrationDate) {
      throw new InvalidRequestError('登録日は必須です');
    }
    
    // 盆栽を作成
    const newBonsai = await bonsaiService.createBonsai(userId, data);
    
    // 成功レスポンスを返す（201 Created）
    return createSuccessResponse(newBonsai, 201);
  } catch (error) {
    // エラーレスポンスを返す
    return createErrorResponse(error as Error);
  }
}

/**
 * 盆栽を更新
 * 
 * @param event APIGatewayProxyEvent
 * @returns APIGatewayProxyResult
 */
export async function updateBonsai(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
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
    
    const data: UpdateBonsaiRequest = JSON.parse(event.body);
    
    // 盆栽を更新
    const updatedBonsai = await bonsaiService.updateBonsai(userId, bonsaiId, data);
    
    // 成功レスポンスを返す
    return createSuccessResponse(updatedBonsai);
  } catch (error) {
    // エラーレスポンスを返す
    return createErrorResponse(error as Error);
  }
}

/**
 * 盆栽を削除
 * 
 * @param event APIGatewayProxyEvent
 * @returns APIGatewayProxyResult
 */
export async function deleteBonsai(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // ユーザーIDを取得
    const userId = getUserIdFromRequest(event);
    
    // パスパラメータから盆栽IDを取得
    const bonsaiId = event.pathParameters?.bonsaiId;
    if (!bonsaiId) {
      throw new InvalidRequestError('盆栽IDが指定されていません');
    }
    
    // 盆栽を削除
    await bonsaiService.deleteBonsai(userId, bonsaiId);
    
    // 成功レスポンスを返す
    return createSuccessResponse({
      message: '盆栽が正常に削除されました',
      id: bonsaiId
    });
  } catch (error) {
    // エラーレスポンスを返す
    return createErrorResponse(error as Error);
  }
}
