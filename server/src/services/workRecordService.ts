/**
 * 作業記録サービス
 * 
 * このファイルは作業記録データの操作に関するビジネスロジックを提供します。
 */

import { 
  WorkRecord, 
  WorkRecordListResponse, 
  CreateWorkRecordRequest, 
  UpdateWorkRecordRequest,
  BulkWateringRequest,
  BulkWateringResponse
} from '../models/workRecord';
import { ResourceNotFoundError } from '../utils/errors';
import * as bonsaiService from './bonsaiService';
import { createDataStore, DataStore } from '../data/dataStore';

// 作業記録データストアの作成
const workRecordStore: DataStore<WorkRecord> = createDataStore<WorkRecord>('workRecord');

/**
 * 作業記録一覧を取得
 * 
 * @param userId ユーザーID
 * @param bonsaiId 盆栽ID
 * @param workTypes 作業タイプでフィルタリング（オプション）
 * @param limit 取得件数（オプション）
 * @param nextToken ページネーショントークン（オプション）
 * @returns 作業記録一覧レスポンス
 */
export async function listWorkRecords(
  userId: string,
  bonsaiId: string,
  workTypes?: string[],
  limit?: number,
  nextToken?: string
): Promise<WorkRecordListResponse> {
  // 盆栽の存在確認
  await bonsaiService.getBonsai(userId, bonsaiId);
  
  // すべての作業記録を取得
  const allRecords = await workRecordStore.getAll();
  
  // 盆栽IDに紐づく作業記録をフィルタリング
  let records = allRecords.filter(record => record.bonsaiId === bonsaiId);
  
  // 作業タイプでフィルタリング
  if (workTypes && workTypes.length > 0) {
    records = records.filter(record => {
      // 少なくとも1つの作業タイプが一致する場合に含める
      return record.workTypes.some(type => workTypes.includes(type));
    });
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
  const endIndex = Math.min(startIndex + pageSize, records.length);
  const items = records.slice(startIndex, endIndex);
  
  // 次ページがある場合はnextTokenを生成
  let responseNextToken: string | undefined;
  if (endIndex < records.length) {
    const tokenData = { lastIndex: endIndex };
    responseNextToken = Buffer.from(JSON.stringify(tokenData)).toString('base64');
  }
  
  return {
    items,
    nextToken: responseNextToken
  };
}

/**
 * 作業記録詳細を取得
 * 
 * @param recordId 作業記録ID
 * @returns 作業記録詳細
 */
export async function getWorkRecord(recordId: string): Promise<WorkRecord> {
  // 作業記録IDに一致するデータを検索
  const record = await workRecordStore.getById(recordId);
  
  if (!record) {
    throw new ResourceNotFoundError('作業記録', recordId);
  }
  
  return record;
}

/**
 * 作業記録を作成
 * 
 * @param userId ユーザーID
 * @param data 作業記録作成リクエスト
 * @returns 作成された作業記録
 */
export async function createWorkRecord(userId: string, data: CreateWorkRecordRequest): Promise<WorkRecord> {
  // 盆栽の存在確認
  await bonsaiService.getBonsai(userId, data.bonsaiId);
  
  // 新しい作業記録データを作成
  const newRecord = await workRecordStore.create({
    bonsaiId: data.bonsaiId,
    workTypes: data.workTypes,
    date: data.date,
    description: data.description,
    imageUrls: data.imageUrls || []
  });
  
  return newRecord;
}

/**
 * 作業記録を更新
 * 
 * @param recordId 作業記録ID
 * @param data 作業記録更新リクエスト
 * @returns 更新された作業記録
 */
export async function updateWorkRecord(
  recordId: string,
  data: UpdateWorkRecordRequest
): Promise<WorkRecord> {
  // 作業記録が存在するか確認
  await getWorkRecord(recordId);
  
  // 更新データを作成
  const updatedRecord = await workRecordStore.update(recordId, {
    workTypes: data.workTypes,
    date: data.date,
    description: data.description,
    imageUrls: data.imageUrls
  });
  
  return updatedRecord;
}

/**
 * 作業記録を削除
 * 
 * @param recordId 作業記録ID
 */
export async function deleteWorkRecord(recordId: string): Promise<void> {
  // 作業記録が存在するか確認
  await getWorkRecord(recordId);
  
  // データストアから削除
  await workRecordStore.delete(recordId);
}

/**
 * 一括水やり記録を作成
 * 
 * @param userId ユーザーID
 * @param data 一括水やりリクエスト
 * @returns 一括水やりレスポンス
 */
export async function createBulkWateringRecords(
  userId: string,
  data: BulkWateringRequest
): Promise<BulkWateringResponse> {
  // バリデーション
  if (!data.description) {
    throw new Error('説明は必須です');
  }
  
  // ユーザーの全盆栽を取得
  const bonsaiResponse = await bonsaiService.listBonsai(userId);
  const bonsaiList = bonsaiResponse.items;
  
  // 盆栽が存在しない場合はエラー
  if (bonsaiList.length === 0) {
    throw new Error('水やり記録を作成する盆栽がありません');
  }
  
  // 各盆栽に対して水やり記録を作成
  const createdRecords = [];
  
  for (const bonsai of bonsaiList) {
    // 水やり記録を作成
    const newRecord = await workRecordStore.create({
      bonsaiId: bonsai.id,
      workTypes: ['watering'],
      date: data.date,
      description: data.description,
      imageUrls: []
    });
    
    // 作成された記録を配列に追加
    createdRecords.push({
      id: newRecord.id,
      bonsaiId: bonsai.id,
      bonsaiName: bonsai.name
    });
  }
  
  // レスポンスを作成
  return {
    success: true,
    message: `${createdRecords.length}件の盆栽に水やり記録を作成しました`,
    recordCount: createdRecords.length,
    records: createdRecords
  };
}
