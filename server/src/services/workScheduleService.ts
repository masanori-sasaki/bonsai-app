/**
 * 作業予定サービス
 * 
 * このファイルは作業予定データの操作に関するビジネスロジックを提供します。
 */

import { WorkSchedule, WorkScheduleListResponse, CreateWorkScheduleRequest, UpdateWorkScheduleRequest } from '../models/workSchedule';
import { ResourceNotFoundError } from '../utils/errors';
import * as bonsaiService from './bonsaiService';
import { createDataStore, DataStore } from '../data/dataStore';

// 作業予定データストアの作成
const workScheduleStore: DataStore<WorkSchedule> = createDataStore<WorkSchedule>('workSchedule');

/**
 * 作業予定一覧を取得
 * 
 * @param userId ユーザーID
 * @param bonsaiId 盆栽ID
 * @param completed 完了状態でフィルタリング（オプション）
 * @param limit 取得件数（オプション）
 * @param nextToken ページネーショントークン（オプション）
 * @returns 作業予定一覧レスポンス
 */
export async function listWorkSchedules(
  userId: string,
  bonsaiId: string,
  completed?: boolean,
  limit?: number,
  nextToken?: string
): Promise<WorkScheduleListResponse> {
  // 盆栽の存在確認
  await bonsaiService.getBonsai(userId, bonsaiId);
  
  // すべての作業予定を取得
  const allSchedules = await workScheduleStore.getAll();
  console.log('DynamoDBから取得した作業予定データ:', JSON.stringify(allSchedules, null, 2));
  
  // 盆栽IDに紐づく作業予定をフィルタリング
  let schedules = allSchedules.filter(schedule => {
    console.log(`フィルタリング比較: schedule.bonsaiId=${schedule.bonsaiId}, bonsaiId=${bonsaiId}, 一致=${schedule.bonsaiId === bonsaiId}`);
    return schedule.bonsaiId === bonsaiId;
  });
  
  // 完了状態でフィルタリング
  if (completed !== undefined) {
    schedules = schedules.filter(schedule => schedule.completed === completed);
  }
  
  // ページネーション処理
  const pageSize = limit || 20;
  let startIndex = 0;
  
  if (nextToken) {
    try {
      // nextTokenから開始インデックスを取得
      const decodedToken = Buffer.from(nextToken, 'base64').toString('utf-8');
      const tokenData = JSON.parse(decodedToken);
      startIndex = tokenData.lastIndex || 0;
    } catch (error) {
      console.error('ページネーショントークンのデコードエラー:', error);
      startIndex = 0;
    }
  }
  
  // 指定された件数分のデータを取得
  const endIndex = Math.min(startIndex + pageSize, schedules.length);
  const items = schedules.slice(startIndex, endIndex);
  
  // 次ページがある場合はnextTokenを生成
  let responseNextToken: string | undefined;
  if (endIndex < schedules.length) {
    const tokenData = { lastIndex: endIndex };
    responseNextToken = Buffer.from(JSON.stringify(tokenData)).toString('base64');
  }
  
  // 必ず items が配列であることを保証する
  return {
    items: Array.isArray(items) ? items : [],
    nextToken: responseNextToken
  };
}

/**
 * 作業予定詳細を取得
 * 
 * @param scheduleId 作業予定ID
 * @returns 作業予定詳細
 */
export async function getWorkSchedule(scheduleId: string): Promise<WorkSchedule> {
  // 作業予定IDに一致するデータを検索
  const schedule = await workScheduleStore.getById(scheduleId);
  
  if (!schedule) {
    throw new ResourceNotFoundError('作業予定', scheduleId);
  }
  
  return schedule;
}

/**
 * 作業予定を作成
 * 
 * @param userId ユーザーID
 * @param data 作業予定作成リクエスト
 * @returns 作成された作業予定
 */
export async function createWorkSchedule(userId: string, data: CreateWorkScheduleRequest): Promise<WorkSchedule> {
  // 盆栽の存在確認
  await bonsaiService.getBonsai(userId, data.bonsaiId);
  
  // 新しい作業予定データを作成
  const newSchedule = await workScheduleStore.create({
    bonsaiId: data.bonsaiId,
    workType: data.workType,
    scheduledDate: data.scheduledDate,
    description: data.description,
    completed: false // 初期値はfalse
  });
  
  return newSchedule;
}

/**
 * 作業予定を更新
 * 
 * @param scheduleId 作業予定ID
 * @param data 作業予定更新リクエスト
 * @returns 更新された作業予定
 */
export async function updateWorkSchedule(
  scheduleId: string,
  data: UpdateWorkScheduleRequest
): Promise<WorkSchedule> {
  // 作業予定が存在するか確認
  await getWorkSchedule(scheduleId);
  
  // 更新データを作成
  const updatedSchedule = await workScheduleStore.update(scheduleId, {
    workType: data.workType,
    scheduledDate: data.scheduledDate,
    description: data.description,
    completed: data.completed
  });
  
  return updatedSchedule;
}

/**
 * 作業予定を削除
 * 
 * @param scheduleId 作業予定ID
 */
export async function deleteWorkSchedule(scheduleId: string): Promise<void> {
  // 作業予定が存在するか確認
  await getWorkSchedule(scheduleId);
  
  // データストアから削除
  await workScheduleStore.delete(scheduleId);
}
