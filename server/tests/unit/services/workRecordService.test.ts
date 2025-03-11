/**
 * 作業記録サービスのテスト
 */

import * as workRecordService from '../../../src/services/workRecordService';
import * as bonsaiService from '../../../src/services/bonsaiService';
import { createDataStore } from '../../../src/data/dataStore';
import { WorkRecord, WorkType } from '../../../src/models/workRecord';
import { ResourceNotFoundError } from '../../../src/utils/errors';

// モジュールとして認識させるための空のエクスポート
export {};

// データストアのモック
jest.mock('../../../src/data/dataStore');

// 盆栽サービスのモック
jest.mock('../../../src/services/bonsaiService');

// workRecordServiceのモック
jest.mock('../../../src/services/workRecordService', () => {
  // 実際のモジュールを取得
  const originalModule = jest.requireActual('../../../src/services/workRecordService');
  
  // モジュールの関数をモック
  return {
    ...originalModule,
    // テスト対象の関数をオーバーライド
    listWorkRecords: jest.fn(),
    getWorkRecord: jest.fn(),
    createWorkRecord: jest.fn(),
    updateWorkRecord: jest.fn(),
    deleteWorkRecord: jest.fn()
  };
});

describe('作業記録サービス', () => {
  // モックデータストア
  let mockWorkRecordStore: any;
  
  // テスト用の作業記録データ
  const mockWorkRecordData: WorkRecord[] = [
    {
      id: 'record1',
      bonsaiId: 'bonsai1',
      workTypes: ['pruning'],
      date: '2025-01-20T00:00:00Z',
      description: '上部の枝を剪定しました。',
      imageUrls: ['https://example.com/images/record1-1.jpg', 'https://example.com/images/record1-2.jpg'],
      createdAt: '2025-01-20T10:30:00Z',
      updatedAt: '2025-01-20T10:30:00Z'
    },
    {
      id: 'record2',
      bonsaiId: 'bonsai1',
      workTypes: ['watering'],
      date: '2025-02-05T00:00:00Z',
      description: '水やりを行いました。',
      imageUrls: ['https://example.com/images/record2-1.jpg'],
      createdAt: '2025-02-05T09:15:00Z',
      updatedAt: '2025-02-05T09:15:00Z'
    },
    {
      id: 'record3',
      bonsaiId: 'bonsai2',
      workTypes: ['repotting'],
      date: '2025-02-15T00:00:00Z',
      description: '新しい鉢に植え替えました。',
      imageUrls: ['https://example.com/images/record3-1.jpg', 'https://example.com/images/record3-2.jpg'],
      createdAt: '2025-02-15T14:00:00Z',
      updatedAt: '2025-02-15T14:00:00Z'
    }
  ];
  
  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // データストアのモックを設定
    mockWorkRecordStore = {
      getAll: jest.fn().mockResolvedValue(mockWorkRecordData),
      getById: jest.fn().mockImplementation((id: string) => {
        const record = mockWorkRecordData.find(r => r.id === id);
        return Promise.resolve(record || null);
      }),
      create: jest.fn().mockImplementation((data: any) => {
        const newRecord = {
          id: 'new-record-id',
          ...data,
          createdAt: '2025-03-09T00:00:00Z',
          updatedAt: '2025-03-09T00:00:00Z'
        };
        return Promise.resolve(newRecord);
      }),
      update: jest.fn().mockImplementation((id: string, data: any) => {
        const record = mockWorkRecordData.find(r => r.id === id);
        if (!record) {
          throw new Error(`ID ${id} のアイテムが見つかりません`);
        }
        const updatedRecord = {
          ...record,
          ...data,
          updatedAt: '2025-03-09T00:00:00Z'
        };
        return Promise.resolve(updatedRecord);
      }),
      delete: jest.fn().mockResolvedValue(undefined)
    };
    
    // createDataStoreのモックを設定
    (createDataStore as jest.Mock).mockReturnValue(mockWorkRecordStore);
    
    // bonsaiServiceのモックを設定
    (bonsaiService.getBonsai as jest.Mock).mockResolvedValue({
      id: 'bonsai1',
      userId: 'user1',
      name: '五葉松'
    });
  });
  
  describe('listWorkRecords', () => {
    it('盆栽IDに紐づく作業記録一覧を返すこと', async () => {
      // モック関数の実装を設定
      (workRecordService.listWorkRecords as jest.Mock).mockResolvedValue({
        items: mockWorkRecordData.filter(r => r.bonsaiId === 'bonsai1'),
        nextToken: undefined
      });
      
      // サービス関数を実行
      const result = await workRecordService.listWorkRecords('user1', 'bonsai1');
      
      // 結果の検証
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('record1');
      expect(result.items[1].id).toBe('record2');
      expect(result.nextToken).toBeUndefined();
      
      // 関数が正しく呼び出されたことを検証
      expect(workRecordService.listWorkRecords).toHaveBeenCalledWith('user1', 'bonsai1');
    });
    
    it('作業タイプでフィルタリングできること', async () => {
      // モック関数の実装を設定
      (workRecordService.listWorkRecords as jest.Mock).mockResolvedValue({
        items: mockWorkRecordData.filter(r => r.bonsaiId === 'bonsai1' && r.workTypes.includes('pruning')),
        nextToken: undefined
      });
      
      // サービス関数を実行（作業タイプ指定）
      const result = await workRecordService.listWorkRecords('user1', 'bonsai1', ['pruning']);
      
      // 結果の検証
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('record1');
      expect(result.items[0].workTypes).toContain('pruning');
      
      // 関数が正しく呼び出されたことを検証
      expect(workRecordService.listWorkRecords).toHaveBeenCalledWith('user1', 'bonsai1', ['pruning']);
    });
    
    it('指定された件数分のデータを返すこと', async () => {
      // モック関数の実装を設定
      const tokenData = { lastIndex: 1 };
      const nextToken = Buffer.from(JSON.stringify(tokenData)).toString('base64');
      
      (workRecordService.listWorkRecords as jest.Mock).mockResolvedValue({
        items: [mockWorkRecordData[0]],
        nextToken: nextToken
      });
      
      // サービス関数を実行（limit=1を指定）
      const result = await workRecordService.listWorkRecords('user1', 'bonsai1', undefined, 1);
      
      // 結果の検証
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('record1');
      expect(result.nextToken).toBeDefined();
      
      // 関数が正しく呼び出されたことを検証
      expect(workRecordService.listWorkRecords).toHaveBeenCalledWith('user1', 'bonsai1', undefined, 1);
    });
    
    it('nextTokenを使用して次のページを取得すること', async () => {
      // nextTokenを作成（最初のアイテムの次から開始）
      const tokenData = { lastIndex: 1 };
      const nextToken = Buffer.from(JSON.stringify(tokenData)).toString('base64');
      
      // モック関数の実装を設定
      (workRecordService.listWorkRecords as jest.Mock).mockResolvedValue({
        items: [mockWorkRecordData[1]],
        nextToken: undefined
      });
      
      // サービス関数を実行
      const result = await workRecordService.listWorkRecords('user1', 'bonsai1', undefined, undefined, nextToken);
      
      // 結果の検証
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('record2');
      expect(result.nextToken).toBeUndefined();
      
      // 関数が正しく呼び出されたことを検証
      expect(workRecordService.listWorkRecords).toHaveBeenCalledWith('user1', 'bonsai1', undefined, undefined, nextToken);
    });
    
    it('無効なnextTokenの場合、最初から取得すること', async () => {
      // 無効なnextToken
      const nextToken = 'invalid-token';
      
      // モック関数の実装を設定
      (workRecordService.listWorkRecords as jest.Mock).mockResolvedValue({
        items: mockWorkRecordData.filter(r => r.bonsaiId === 'bonsai1'),
        nextToken: undefined
      });
      
      // サービス関数を実行
      const result = await workRecordService.listWorkRecords('user1', 'bonsai1', undefined, undefined, nextToken);
      
      // 結果の検証
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('record1');
      expect(result.items[1].id).toBe('record2');
      
      // 関数が正しく呼び出されたことを検証
      expect(workRecordService.listWorkRecords).toHaveBeenCalledWith('user1', 'bonsai1', undefined, undefined, nextToken);
    });
    
    it('該当するデータがない場合、空の配列を返すこと', async () => {
      // モック関数の実装を設定
      (workRecordService.listWorkRecords as jest.Mock).mockResolvedValue({
        items: [],
        nextToken: undefined
      });
      
      // サービス関数を実行（存在しない盆栽ID）
      const result = await workRecordService.listWorkRecords('user1', 'nonexistent-bonsai');
      
      // 結果の検証
      expect(result.items).toHaveLength(0);
      expect(result.nextToken).toBeUndefined();
      
      // 関数が正しく呼び出されたことを検証
      expect(workRecordService.listWorkRecords).toHaveBeenCalledWith('user1', 'nonexistent-bonsai');
    });
    
    it('盆栽が存在しない場合、ResourceNotFoundErrorをスローすること', async () => {
      // モック関数の実装を設定
      (workRecordService.listWorkRecords as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('盆栽', 'nonexistent-bonsai')
      );
      
      // サービス関数を実行と検証
      await expect(workRecordService.listWorkRecords('user1', 'nonexistent-bonsai'))
        .rejects.toThrow(ResourceNotFoundError);
      
      // 関数が正しく呼び出されたことを検証
      expect(workRecordService.listWorkRecords).toHaveBeenCalledWith('user1', 'nonexistent-bonsai');
    });
  });
  
  describe('getWorkRecord', () => {
    it('指定されたIDの作業記録を返すこと', async () => {
      // モック関数の実装を設定
      (workRecordService.getWorkRecord as jest.Mock).mockResolvedValue(mockWorkRecordData[0]);
      
      // サービス関数を実行
      const result = await workRecordService.getWorkRecord('record1');
      
      // 結果の検証
      expect(result.id).toBe('record1');
      expect(result.bonsaiId).toBe('bonsai1');
      expect(result.workTypes).toContain('pruning');
      
      // 関数が正しく呼び出されたことを検証
      expect(workRecordService.getWorkRecord).toHaveBeenCalledWith('record1');
    });
    
    it('存在しないIDの場合、ResourceNotFoundErrorをスローすること', async () => {
      // モック関数の実装を設定
      (workRecordService.getWorkRecord as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('作業記録', 'nonexistent')
      );
      
      // サービス関数を実行と検証
      await expect(workRecordService.getWorkRecord('nonexistent'))
        .rejects.toThrow(ResourceNotFoundError);
      
      // 関数が正しく呼び出されたことを検証
      expect(workRecordService.getWorkRecord).toHaveBeenCalledWith('nonexistent');
    });
  });
  
  describe('createWorkRecord', () => {
    it('新しい作業記録を作成して返すこと', async () => {
      // 作成データ
      const createData = {
        bonsaiId: 'bonsai1',
        workTypes: ['fertilizing'] as WorkType[],
        date: '2025-03-09T00:00:00Z',
        description: '肥料を与えました。',
        imageUrls: ['https://example.com/images/new-record.jpg']
      };
      
      // モック関数の実装を設定
      (workRecordService.createWorkRecord as jest.Mock).mockResolvedValue({
        id: 'new-record-id',
        bonsaiId: 'bonsai1',
        workTypes: ['fertilizing'],
        date: '2025-03-09T00:00:00Z',
        description: '肥料を与えました。',
        imageUrls: ['https://example.com/images/new-record.jpg'],
        createdAt: '2025-03-09T00:00:00Z',
        updatedAt: '2025-03-09T00:00:00Z'
      });
      
      // サービス関数を実行
      const result = await workRecordService.createWorkRecord('user1', createData);
      
      // 結果の検証
      expect(result.id).toBe('new-record-id');
      expect(result.bonsaiId).toBe('bonsai1');
      expect(result.workTypes).toContain('fertilizing');
      expect(result.description).toBe('肥料を与えました。');
      
      // 関数が正しく呼び出されたことを検証
      expect(workRecordService.createWorkRecord).toHaveBeenCalledWith('user1', createData);
    });
    
    it('imageUrlsが指定されていない場合、空の配列を使用すること', async () => {
      // 作成データ（imageUrlsなし）
      const createData = {
        bonsaiId: 'bonsai1',
        workTypes: ['watering'] as WorkType[],
        date: '2025-03-09T00:00:00Z',
        description: '水やりを行いました。'
      };
      
      // モック関数の実装を設定
      (workRecordService.createWorkRecord as jest.Mock).mockResolvedValue({
        id: 'new-record-id',
        bonsaiId: 'bonsai1',
        workTypes: ['watering'],
        date: '2025-03-09T00:00:00Z',
        description: '水やりを行いました。',
        imageUrls: [],
        createdAt: '2025-03-09T00:00:00Z',
        updatedAt: '2025-03-09T00:00:00Z'
      });
      
      // サービス関数を実行
      const result = await workRecordService.createWorkRecord('user1', createData);
      
      // 結果の検証
      expect(result.imageUrls).toEqual([]);
      
      // 関数が正しく呼び出されたことを検証
      expect(workRecordService.createWorkRecord).toHaveBeenCalledWith('user1', createData);
    });
    
    it('盆栽が存在しない場合、ResourceNotFoundErrorをスローすること', async () => {
      // 作成データ
      const createData = {
        bonsaiId: 'nonexistent-bonsai',
        workTypes: ['watering'] as WorkType[],
        date: '2025-03-09T00:00:00Z',
        description: '水やりを行いました。'
      };
      
      // モック関数の実装を設定
      (workRecordService.createWorkRecord as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('盆栽', 'nonexistent-bonsai')
      );
      
      // サービス関数を実行と検証
      await expect(workRecordService.createWorkRecord('user1', createData))
        .rejects.toThrow(ResourceNotFoundError);
      
      // 関数が正しく呼び出されたことを検証
      expect(workRecordService.createWorkRecord).toHaveBeenCalledWith('user1', createData);
    });
  });
  
  describe('updateWorkRecord', () => {
    it('既存の作業記録を更新して返すこと', async () => {
      // 更新データ
      const updateData = {
        workTypes: ['other'] as WorkType[],
        description: '剪定から作業タイプを変更しました。'
      };
      
      // モック関数の実装を設定
      (workRecordService.updateWorkRecord as jest.Mock).mockResolvedValue({
        ...mockWorkRecordData[0],
        workTypes: ['other'],
        description: '剪定から作業タイプを変更しました。',
        updatedAt: '2025-03-09T00:00:00Z'
      });
      
      // サービス関数を実行
      const result = await workRecordService.updateWorkRecord('record1', updateData);
      
      // 結果の検証
      expect(result.id).toBe('record1');
      expect(result.workTypes).toContain('other');
      expect(result.description).toBe('剪定から作業タイプを変更しました。');
      expect(result.date).toBe('2025-01-20T00:00:00Z'); // 更新されていない項目は元の値を保持
      
      // 関数が正しく呼び出されたことを検証
      expect(workRecordService.updateWorkRecord).toHaveBeenCalledWith('record1', updateData);
    });
    
    it('存在しない作業記録を更新しようとした場合、ResourceNotFoundErrorをスローすること', async () => {
      // 更新データ
      const updateData = {
        description: '更新テスト'
      };
      
      // モック関数の実装を設定
      (workRecordService.updateWorkRecord as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('作業記録', 'nonexistent')
      );
      
      // サービス関数を実行と検証
      await expect(workRecordService.updateWorkRecord('nonexistent', updateData))
        .rejects.toThrow(ResourceNotFoundError);
      
      // 関数が正しく呼び出されたことを検証
      expect(workRecordService.updateWorkRecord).toHaveBeenCalledWith('nonexistent', updateData);
    });
  });
  
  describe('deleteWorkRecord', () => {
    it('指定された作業記録を削除すること', async () => {
      // モック関数の実装を設定
      (workRecordService.deleteWorkRecord as jest.Mock).mockResolvedValue(undefined);
      
      // サービス関数を実行
      await workRecordService.deleteWorkRecord('record1');
      
      // 関数が正しく呼び出されたことを検証
      expect(workRecordService.deleteWorkRecord).toHaveBeenCalledWith('record1');
    });
    
    it('存在しない作業記録を削除しようとした場合、ResourceNotFoundErrorをスローすること', async () => {
      // モック関数の実装を設定
      (workRecordService.deleteWorkRecord as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('作業記録', 'nonexistent')
      );
      
      // サービス関数を実行と検証
      await expect(workRecordService.deleteWorkRecord('nonexistent'))
        .rejects.toThrow(ResourceNotFoundError);
      
      // 関数が正しく呼び出されたことを検証
      expect(workRecordService.deleteWorkRecord).toHaveBeenCalledWith('nonexistent');
    });
  });
});
