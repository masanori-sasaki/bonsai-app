/**
 * 盆栽サービス
 * 
 * このファイルは盆栽データの操作に関するビジネスロジックを提供します。
 */

import { Bonsai, BonsaiListResponse, CreateBonsaiRequest, UpdateBonsaiRequest } from '../models/bonsai';
import { ResourceNotFoundError } from '../utils/errors';
import { createDataStore, DataStore } from '../data/dataStore';

// 盆栽データストアの作成
const bonsaiStore: DataStore<Bonsai> = createDataStore<Bonsai>('bonsai');

/**
 * 盆栽一覧を取得
 * 
 * @param userId ユーザーID
 * @param limit 取得件数（オプション）
 * @param nextToken ページネーショントークン（オプション）
 * @returns 盆栽一覧レスポンス
 */
export async function listBonsai(
  userId: string,
  limit?: number,
  nextToken?: string
): Promise<BonsaiListResponse> {
  // ユーザーIDに紐づく盆栽を取得
  const allBonsai = await bonsaiStore.getAll();
  const userBonsai = allBonsai.filter(bonsai => bonsai.userId === userId);
  
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
  const endIndex = Math.min(startIndex + pageSize, userBonsai.length);
  const items = userBonsai.slice(startIndex, endIndex);
  
  // 次ページがある場合はnextTokenを生成
  let responseNextToken: string | undefined;
  if (endIndex < userBonsai.length) {
    const tokenData = { lastIndex: endIndex };
    responseNextToken = Buffer.from(JSON.stringify(tokenData)).toString('base64');
  }
  
  return {
    items,
    nextToken: responseNextToken
  };
}

/**
 * 盆栽詳細を取得
 * 
 * @param userId ユーザーID
 * @param bonsaiId 盆栽ID
 * @returns 盆栽詳細
 */
export async function getBonsai(userId: string, bonsaiId: string): Promise<Bonsai> {
  // 'new'の場合は特別に処理（新規作成画面用）
  if (bonsaiId === 'new') {
    console.log('新規作成用の空の盆栽データを返します');
    return {
      id: 'new',
      userId: userId,
      name: '',
      species: '',
      registrationDate: new Date().toISOString(),
      history: '',
      imageUrls: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  
  // 盆栽IDに一致するデータを検索
  const bonsai = await bonsaiStore.getById(bonsaiId);
  
  if (!bonsai) {
    throw new ResourceNotFoundError('盆栽', bonsaiId);
  }
  
  // ユーザーIDが一致するか確認
  if (bonsai.userId !== userId) {
    throw new ResourceNotFoundError('盆栽', bonsaiId);
  }
  
  return bonsai;
}

/**
 * 盆栽を作成
 * 
 * @param userId ユーザーID
 * @param data 盆栽作成リクエスト
 * @returns 作成された盆栽
 */
export async function createBonsai(userId: string, data: CreateBonsaiRequest): Promise<Bonsai> {
  // 新しい盆栽データを作成
  const newBonsai = await bonsaiStore.create({
    userId,
    name: data.name,
    species: data.species,
    registrationDate: data.registrationDate,
    history: data.history,
    imageUrls: data.imageUrls || []
  });
  
  return newBonsai;
}

/**
 * 盆栽を更新
 * 
 * @param userId ユーザーID
 * @param bonsaiId 盆栽ID
 * @param data 盆栽更新リクエスト
 * @returns 更新された盆栽
 */
export async function updateBonsai(
  userId: string,
  bonsaiId: string,
  data: UpdateBonsaiRequest
): Promise<Bonsai> {
  // 盆栽が存在するか確認
  const existingBonsai = await getBonsai(userId, bonsaiId);
  
  // 更新データを作成
  const updatedBonsai = await bonsaiStore.update(bonsaiId, {
    name: data.name,
    species: data.species,
    registrationDate: data.registrationDate,
    history: data.history,
    imageUrls: data.imageUrls
  });
  
  return updatedBonsai;
}

/**
 * 盆栽を削除
 * 
 * @param userId ユーザーID
 * @param bonsaiId 盆栽ID
 */
export async function deleteBonsai(userId: string, bonsaiId: string): Promise<void> {
  // 盆栽が存在するか確認
  await getBonsai(userId, bonsaiId);
  
  // データストアから削除
  await bonsaiStore.delete(bonsaiId);
}
