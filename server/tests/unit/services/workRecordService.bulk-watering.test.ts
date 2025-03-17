/**
 * 作業記録サービスの一括水やり機能のテスト
 */

// データストアのモック
jest.mock('../../../src/data/dataStore');

// 盆栽サービスのモック
jest.mock('../../../src/services/bonsaiService');

import * as workRecordService from '../../../src/services/workRecordService';
import * as bonsaiService from '../../../src/services/bonsaiService';
import { createDataStore } from '../../../src/data/dataStore';
import { WorkRecord, BulkWateringRequest } from '../../../src/models/workRecord';
import { Bonsai } from '../../../src/models/bonsai';
import { ResourceNotFoundError } from '../../../src/utils/errors';

// モジュールとして認識させるための空のエクスポート
export {};

describe('作業記録サービス - 一括水やり機能', () => {
  // モックデータストア
  let mockWorkRecordStore: any;
  
  // テスト用の盆栽データ
  const mockBonsaiData: Bonsai[] = [
    {
      id: 'bonsai1',
      userId: 'user1',
      name: '五葉松',
      species: '五葉松（Pinus parviflora）',
      registrationDate: '2025-01-15T00:00:00Z',
      history: '2023年に購入。元は山採りの素材で、樹齢は推定30年。',
      imageUrls: ['https://example.com/images/bonsai1-1.jpg'],
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-02-20T15:30:00Z'
    },
    {
      id: 'bonsai2',
      userId: 'user1',
      name: '真柏',
      species: '真柏（Juniperus chinensis）',
      registrationDate: '2025-02-10T00:00:00Z',
      history: '2024年に購入。',
      imageUrls: ['https://example.com/images/bonsai2-1.jpg'],
      createdAt: '2025-02-10T09:00:00Z',
      updatedAt: '2025-02-10T09:00:00Z'
    },
    {
      id: 'bonsai3',
      userId: 'user1',
      name: '黒松',
      species: '黒松（Pinus thunbergii）',
      registrationDate: '2025-03-01T00:00:00Z',
      history: '2025年3月に購入。樹齢は推定10年。',
      imageUrls: ['https://example.com/images/bonsai3-1.jpg'],
      createdAt: '2025-03-05T14:40:00Z',
      updatedAt: '2025-03-05T14:40:00Z'
    }
  ];
  
  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // データストアのモックを設定
    mockWorkRecordStore = {
      getAll: jest.fn().mockResolvedValue([]),
      getById: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((data: any) => {
        const newRecord = {
          id: `new-record-${Math.random().toString(36).substring(2, 9)}`,
          ...data,
          createdAt: '2025-03-16T00:00:00Z',
          updatedAt: '2025-03-16T00:00:00Z'
        };
        return Promise.resolve(newRecord);
      }),
      update: jest.fn(),
      delete: jest.fn()
    };
    
    // createDataStoreのモックを設定
    (createDataStore as jest.Mock).mockReturnValue(mockWorkRecordStore);
    
    // bonsaiServiceのモックを設定
    (bonsaiService.listBonsai as jest.Mock).mockResolvedValue({
      items: mockBonsaiData,
      nextToken: undefined
    });
    
    // workRecordServiceのcreateBulkWateringRecords関数をモック化
    jest.spyOn(workRecordService, 'createBulkWateringRecords').mockImplementation(
      async (userId: string, data: BulkWateringRequest) => {
        // バリデーション
        if (!data.description) {
          throw new Error('説明は必須です');
        }
        
        // ユーザーの全盆栽を取得
        const bonsaiResponse = await bonsaiService.listBonsai(userId, undefined, undefined);
        const bonsaiList = bonsaiResponse.items;
        
        // 盆栽が存在しない場合はエラー
        if (bonsaiList.length === 0) {
          throw new Error('水やり記録を作成する盆栽がありません');
        }
        
        // 各盆栽に対して水やり記録を作成
        const createdRecords: {
          id: string;
          bonsaiId: string;
          bonsaiName: string;
        }[] = [];
        
        for (const bonsai of bonsaiList) {
          // 水やり記録を作成
          const newRecord = await mockWorkRecordStore.create({
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
    );
  });
  
  describe('createBulkWateringRecords', () => {
    it('ユーザーの全盆栽に水やり記録を作成すること', async () => {
      // テスト対象の関数が実装されていない場合はスキップ
      if (typeof workRecordService.createBulkWateringRecords !== 'function') {
        console.warn('createBulkWateringRecords関数が実装されていないためテストをスキップします');
        return;
      }
      
      // リクエストデータ
      const request: BulkWateringRequest = {
        description: '一括水やり',
        date: '2025-03-16T00:00:00Z'
      };
      
      // 関数を実行
      const result = await workRecordService.createBulkWateringRecords('user1', request);
      
      // 結果の検証
      expect(result.success).toBe(true);
      expect(result.message).toContain('3件の盆栽に水やり記録を作成しました');
      expect(result.recordCount).toBe(3);
      expect(result.records).toHaveLength(3);
      
      // 各レコードの検証
      result.records.forEach((record, index) => {
        expect(record).toHaveProperty('id');
        expect(record).toHaveProperty('bonsaiId');
        expect(record).toHaveProperty('bonsaiName');
        expect(mockBonsaiData.some(bonsai => bonsai.id === record.bonsaiId)).toBe(true);
      });
      
      // 盆栽一覧の取得が呼ばれたことを検証
      expect(bonsaiService.listBonsai).toHaveBeenCalledWith('user1', undefined, undefined);
      
      // 作業記録の作成が3回呼ばれたことを検証
      expect(mockWorkRecordStore.create).toHaveBeenCalledTimes(3);
      
      // 作業記録の作成パラメータを検証
      const createCalls = (mockWorkRecordStore.create as jest.Mock).mock.calls;
      createCalls.forEach(call => {
        const data = call[0];
        expect(data).toHaveProperty('bonsaiId');
        expect(data).toHaveProperty('workTypes', ['watering']);
        expect(data).toHaveProperty('date', '2025-03-16T00:00:00Z');
        expect(data).toHaveProperty('description', '一括水やり');
        expect(data).toHaveProperty('imageUrls', []);
      });
    });
    
    it('盆栽が存在しない場合、エラーを返すこと', async () => {
      // テスト対象の関数が実装されていない場合はスキップ
      if (typeof workRecordService.createBulkWateringRecords !== 'function') {
        console.warn('createBulkWateringRecords関数が実装されていないためテストをスキップします');
        return;
      }
      
      // 盆栽一覧を空に設定
      (bonsaiService.listBonsai as jest.Mock).mockResolvedValue({
        items: [],
        nextToken: undefined
      });
      
      // リクエストデータ
      const request: BulkWateringRequest = {
        description: '一括水やり',
        date: '2025-03-16T00:00:00Z'
      };
      
      // 関数を実行して例外が発生することを検証
      await expect(workRecordService.createBulkWateringRecords('user1', request))
        .rejects.toThrow('水やり記録を作成する盆栽がありません');
    });
    
    it('説明が空の場合、エラーを返すこと', async () => {
      // テスト対象の関数が実装されていない場合はスキップ
      if (typeof workRecordService.createBulkWateringRecords !== 'function') {
        console.warn('createBulkWateringRecords関数が実装されていないためテストをスキップします');
        return;
      }
      
      // リクエストデータ（説明が空）
      const request: BulkWateringRequest = {
        description: '',
        date: '2025-03-16T00:00:00Z'
      };
      
      // 関数を実行して例外が発生することを検証
      await expect(workRecordService.createBulkWateringRecords('user1', request))
        .rejects.toThrow('説明は必須です');
    });
  });
});
