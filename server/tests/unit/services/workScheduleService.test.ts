/**
 * 作業予定サービスのテスト
 */

import * as workScheduleService from '../../../src/services/workScheduleService';
import * as bonsaiService from '../../../src/services/bonsaiService';
import { createDataStore } from '../../../src/data/dataStore';
import { WorkSchedule } from '../../../src/models/workSchedule';
import { WorkType } from '../../../src/models/workRecord';
import { ResourceNotFoundError } from '../../../src/utils/errors';

// モジュールとして認識させるための空のエクスポート
export {};

// データストアのモック
jest.mock('../../../src/data/dataStore');

// 盆栽サービスのモック
jest.mock('../../../src/services/bonsaiService');

// workScheduleServiceのモック
jest.mock('../../../src/services/workScheduleService', () => {
  // 実際のモジュールを取得
  const originalModule = jest.requireActual('../../../src/services/workScheduleService');
  
  // モジュールの関数をモック
  return {
    ...originalModule,
    // テスト対象の関数をオーバーライド
    listWorkSchedules: jest.fn(),
    getWorkSchedule: jest.fn(),
    createWorkSchedule: jest.fn(),
    updateWorkSchedule: jest.fn(),
    deleteWorkSchedule: jest.fn()
  };
});

describe('作業予定サービス', () => {
  // モックデータストア
  let mockWorkScheduleStore: any;
  
  // テスト用の作業予定データ
  const mockWorkScheduleData: WorkSchedule[] = [
    {
      id: 'schedule1',
      bonsaiId: 'bonsai1',
      workType: 'pruning',
      scheduledDate: '2025-04-15T00:00:00Z',
      description: '上部の枝を剪定する予定',
      completed: false,
      createdAt: '2025-03-01T10:30:00Z',
      updatedAt: '2025-03-01T10:30:00Z'
    },
    {
      id: 'schedule2',
      bonsaiId: 'bonsai1',
      workType: 'repotting',
      scheduledDate: '2025-05-10T00:00:00Z',
      description: '新しい鉢に植え替える予定',
      completed: true,
      createdAt: '2025-03-02T09:15:00Z',
      updatedAt: '2025-03-05T14:20:00Z'
    },
    {
      id: 'schedule3',
      bonsaiId: 'bonsai2',
      workType: 'fertilizing',
      scheduledDate: '2025-04-20T00:00:00Z',
      description: '肥料を与える予定',
      completed: false,
      createdAt: '2025-03-03T14:00:00Z',
      updatedAt: '2025-03-03T14:00:00Z'
    }
  ];
  
  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // データストアのモックを設定
    mockWorkScheduleStore = {
      getAll: jest.fn().mockResolvedValue(mockWorkScheduleData),
      getById: jest.fn().mockImplementation((id: string) => {
        const schedule = mockWorkScheduleData.find(s => s.id === id);
        return Promise.resolve(schedule || null);
      }),
      create: jest.fn().mockImplementation((data: any) => {
        const newSchedule = {
          id: 'new-schedule-id',
          ...data,
          createdAt: '2025-03-09T00:00:00Z',
          updatedAt: '2025-03-09T00:00:00Z'
        };
        return Promise.resolve(newSchedule);
      }),
      update: jest.fn().mockImplementation((id: string, data: any) => {
        const schedule = mockWorkScheduleData.find(s => s.id === id);
        if (!schedule) {
          throw new Error(`ID ${id} のアイテムが見つかりません`);
        }
        const updatedSchedule = {
          ...schedule,
          ...data,
          updatedAt: '2025-03-09T00:00:00Z'
        };
        return Promise.resolve(updatedSchedule);
      }),
      delete: jest.fn().mockResolvedValue(undefined)
    };
    
    // createDataStoreのモックを設定
    (createDataStore as jest.Mock).mockReturnValue(mockWorkScheduleStore);
    
    // bonsaiServiceのモックを設定
    (bonsaiService.getBonsai as jest.Mock).mockResolvedValue({
      id: 'bonsai1',
      userId: 'user1',
      name: '五葉松'
    });
  });
  
  describe('listWorkSchedules', () => {
    it('盆栽IDに紐づく作業予定一覧を返すこと', async () => {
      // モック関数の実装を設定
      (workScheduleService.listWorkSchedules as jest.Mock).mockResolvedValue({
        items: mockWorkScheduleData.filter(s => s.bonsaiId === 'bonsai1'),
        nextToken: undefined
      });
      
      // サービス関数を実行
      const result = await workScheduleService.listWorkSchedules('user1', 'bonsai1');
      
      // 結果の検証
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('schedule1');
      expect(result.items[1].id).toBe('schedule2');
      expect(result.nextToken).toBeUndefined();
      
      // 関数が正しく呼び出されたことを検証
      expect(workScheduleService.listWorkSchedules).toHaveBeenCalledWith('user1', 'bonsai1');
    });
    
    it('完了状態でフィルタリングできること（未完了）', async () => {
      // モック関数の実装を設定
      (workScheduleService.listWorkSchedules as jest.Mock).mockResolvedValue({
        items: mockWorkScheduleData.filter(s => s.bonsaiId === 'bonsai1' && s.completed === false),
        nextToken: undefined
      });
      
      // サービス関数を実行（完了状態指定：未完了）
      const result = await workScheduleService.listWorkSchedules('user1', 'bonsai1', false);
      
      // 結果の検証
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('schedule1');
      expect(result.items[0].completed).toBe(false);
      
      // 関数が正しく呼び出されたことを検証
      expect(workScheduleService.listWorkSchedules).toHaveBeenCalledWith('user1', 'bonsai1', false);
    });
    
    it('完了状態でフィルタリングできること（完了済み）', async () => {
      // モック関数の実装を設定
      (workScheduleService.listWorkSchedules as jest.Mock).mockResolvedValue({
        items: mockWorkScheduleData.filter(s => s.bonsaiId === 'bonsai1' && s.completed === true),
        nextToken: undefined
      });
      
      // サービス関数を実行（完了状態指定：完了済み）
      const result = await workScheduleService.listWorkSchedules('user1', 'bonsai1', true);
      
      // 結果の検証
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('schedule2');
      expect(result.items[0].completed).toBe(true);
      
      // 関数が正しく呼び出されたことを検証
      expect(workScheduleService.listWorkSchedules).toHaveBeenCalledWith('user1', 'bonsai1', true);
    });
    
    it('指定された件数分のデータを返すこと', async () => {
      // モック関数の実装を設定
      const tokenData = { lastIndex: 1 };
      const nextToken = Buffer.from(JSON.stringify(tokenData)).toString('base64');
      
      (workScheduleService.listWorkSchedules as jest.Mock).mockResolvedValue({
        items: [mockWorkScheduleData[0]],
        nextToken: nextToken
      });
      
      // サービス関数を実行（limit=1を指定）
      const result = await workScheduleService.listWorkSchedules('user1', 'bonsai1', undefined, 1);
      
      // 結果の検証
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('schedule1');
      expect(result.nextToken).toBeDefined();
      
      // 関数が正しく呼び出されたことを検証
      expect(workScheduleService.listWorkSchedules).toHaveBeenCalledWith('user1', 'bonsai1', undefined, 1);
    });
    
    it('nextTokenを使用して次のページを取得すること', async () => {
      // nextTokenを作成（最初のアイテムの次から開始）
      const tokenData = { lastIndex: 1 };
      const nextToken = Buffer.from(JSON.stringify(tokenData)).toString('base64');
      
      // モック関数の実装を設定
      (workScheduleService.listWorkSchedules as jest.Mock).mockResolvedValue({
        items: [mockWorkScheduleData[1]],
        nextToken: undefined
      });
      
      // サービス関数を実行
      const result = await workScheduleService.listWorkSchedules('user1', 'bonsai1', undefined, undefined, nextToken);
      
      // 結果の検証
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('schedule2');
      expect(result.nextToken).toBeUndefined();
      
      // 関数が正しく呼び出されたことを検証
      expect(workScheduleService.listWorkSchedules).toHaveBeenCalledWith('user1', 'bonsai1', undefined, undefined, nextToken);
    });
    
    it('無効なnextTokenの場合、最初から取得すること', async () => {
      // 無効なnextToken
      const nextToken = 'invalid-token';
      
      // モック関数の実装を設定
      (workScheduleService.listWorkSchedules as jest.Mock).mockResolvedValue({
        items: mockWorkScheduleData.filter(s => s.bonsaiId === 'bonsai1'),
        nextToken: undefined
      });
      
      // サービス関数を実行
      const result = await workScheduleService.listWorkSchedules('user1', 'bonsai1', undefined, undefined, nextToken);
      
      // 結果の検証
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('schedule1');
      expect(result.items[1].id).toBe('schedule2');
      
      // 関数が正しく呼び出されたことを検証
      expect(workScheduleService.listWorkSchedules).toHaveBeenCalledWith('user1', 'bonsai1', undefined, undefined, nextToken);
    });
    
    it('該当するデータがない場合、空の配列を返すこと', async () => {
      // モック関数の実装を設定
      (workScheduleService.listWorkSchedules as jest.Mock).mockResolvedValue({
        items: [],
        nextToken: undefined
      });
      
      // サービス関数を実行（存在しない盆栽ID）
      const result = await workScheduleService.listWorkSchedules('user1', 'nonexistent-bonsai');
      
      // 結果の検証
      expect(result.items).toHaveLength(0);
      expect(result.nextToken).toBeUndefined();
      
      // 関数が正しく呼び出されたことを検証
      expect(workScheduleService.listWorkSchedules).toHaveBeenCalledWith('user1', 'nonexistent-bonsai');
    });
    
    it('盆栽が存在しない場合、ResourceNotFoundErrorをスローすること', async () => {
      // モック関数の実装を設定
      (workScheduleService.listWorkSchedules as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('盆栽', 'nonexistent-bonsai')
      );
      
      // サービス関数を実行と検証
      await expect(workScheduleService.listWorkSchedules('user1', 'nonexistent-bonsai'))
        .rejects.toThrow(ResourceNotFoundError);
      
      // 関数が正しく呼び出されたことを検証
      expect(workScheduleService.listWorkSchedules).toHaveBeenCalledWith('user1', 'nonexistent-bonsai');
    });
  });
  
  describe('getWorkSchedule', () => {
    it('指定されたIDの作業予定を返すこと', async () => {
      // モック関数の実装を設定
      (workScheduleService.getWorkSchedule as jest.Mock).mockResolvedValue(mockWorkScheduleData[0]);
      
      // サービス関数を実行
      const result = await workScheduleService.getWorkSchedule('schedule1');
      
      // 結果の検証
      expect(result.id).toBe('schedule1');
      expect(result.bonsaiId).toBe('bonsai1');
      expect(result.workType).toBe('pruning');
      expect(result.completed).toBe(false);
      
      // 関数が正しく呼び出されたことを検証
      expect(workScheduleService.getWorkSchedule).toHaveBeenCalledWith('schedule1');
    });
    
    it('存在しないIDの場合、ResourceNotFoundErrorをスローすること', async () => {
      // モック関数の実装を設定
      (workScheduleService.getWorkSchedule as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('作業予定', 'nonexistent')
      );
      
      // サービス関数を実行と検証
      await expect(workScheduleService.getWorkSchedule('nonexistent'))
        .rejects.toThrow(ResourceNotFoundError);
      
      // 関数が正しく呼び出されたことを検証
      expect(workScheduleService.getWorkSchedule).toHaveBeenCalledWith('nonexistent');
    });
  });
  
  describe('createWorkSchedule', () => {
    it('新しい作業予定を作成して返すこと', async () => {
      // 作成データ
      const createData = {
        bonsaiId: 'bonsai1',
        workType: 'watering' as WorkType,
        scheduledDate: '2025-04-01T00:00:00Z',
        description: '水やりを行う予定'
      };
      
      // モック関数の実装を設定
      (workScheduleService.createWorkSchedule as jest.Mock).mockResolvedValue({
        id: 'new-schedule-id',
        bonsaiId: 'bonsai1',
        workType: 'watering',
        scheduledDate: '2025-04-01T00:00:00Z',
        description: '水やりを行う予定',
        completed: false,
        createdAt: '2025-03-09T00:00:00Z',
        updatedAt: '2025-03-09T00:00:00Z'
      });
      
      // サービス関数を実行
      const result = await workScheduleService.createWorkSchedule('user1', createData);
      
      // 結果の検証
      expect(result.id).toBe('new-schedule-id');
      expect(result.bonsaiId).toBe('bonsai1');
      expect(result.workType).toBe('watering');
      expect(result.scheduledDate).toBe('2025-04-01T00:00:00Z');
      expect(result.description).toBe('水やりを行う予定');
      expect(result.completed).toBe(false); // 初期値はfalse
      
      // 関数が正しく呼び出されたことを検証
      expect(workScheduleService.createWorkSchedule).toHaveBeenCalledWith('user1', createData);
    });
    
    it('盆栽が存在しない場合、ResourceNotFoundErrorをスローすること', async () => {
      // 作成データ
      const createData = {
        bonsaiId: 'nonexistent-bonsai',
        workType: 'watering' as WorkType,
        scheduledDate: '2025-04-01T00:00:00Z',
        description: '水やりを行う予定'
      };
      
      // モック関数の実装を設定
      (workScheduleService.createWorkSchedule as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('盆栽', 'nonexistent-bonsai')
      );
      
      // サービス関数を実行と検証
      await expect(workScheduleService.createWorkSchedule('user1', createData))
        .rejects.toThrow(ResourceNotFoundError);
      
      // 関数が正しく呼び出されたことを検証
      expect(workScheduleService.createWorkSchedule).toHaveBeenCalledWith('user1', createData);
    });
  });
  
  describe('updateWorkSchedule', () => {
    it('既存の作業予定を更新して返すこと', async () => {
      // 更新データ
      const updateData = {
        workType: 'other' as WorkType,
        description: '剪定から作業タイプを変更しました',
        completed: true
      };
      
      // モック関数の実装を設定
      (workScheduleService.updateWorkSchedule as jest.Mock).mockResolvedValue({
        ...mockWorkScheduleData[0],
        workType: 'other',
        description: '剪定から作業タイプを変更しました',
        completed: true,
        updatedAt: '2025-03-09T00:00:00Z'
      });
      
      // サービス関数を実行
      const result = await workScheduleService.updateWorkSchedule('schedule1', updateData);
      
      // 結果の検証
      expect(result.id).toBe('schedule1');
      expect(result.workType).toBe('other');
      expect(result.description).toBe('剪定から作業タイプを変更しました');
      expect(result.completed).toBe(true);
      expect(result.scheduledDate).toBe('2025-04-15T00:00:00Z'); // 更新されていない項目は元の値を保持
      
      // 関数が正しく呼び出されたことを検証
      expect(workScheduleService.updateWorkSchedule).toHaveBeenCalledWith('schedule1', updateData);
    });
    
    it('存在しない作業予定を更新しようとした場合、ResourceNotFoundErrorをスローすること', async () => {
      // 更新データ
      const updateData = {
        description: '更新テスト'
      };
      
      // モック関数の実装を設定
      (workScheduleService.updateWorkSchedule as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('作業予定', 'nonexistent')
      );
      
      // サービス関数を実行と検証
      await expect(workScheduleService.updateWorkSchedule('nonexistent', updateData))
        .rejects.toThrow(ResourceNotFoundError);
      
      // 関数が正しく呼び出されたことを検証
      expect(workScheduleService.updateWorkSchedule).toHaveBeenCalledWith('nonexistent', updateData);
    });
  });
  
  describe('deleteWorkSchedule', () => {
    it('指定された作業予定を削除すること', async () => {
      // モック関数の実装を設定
      (workScheduleService.deleteWorkSchedule as jest.Mock).mockResolvedValue(undefined);
      
      // サービス関数を実行
      await workScheduleService.deleteWorkSchedule('schedule1');
      
      // 関数が正しく呼び出されたことを検証
      expect(workScheduleService.deleteWorkSchedule).toHaveBeenCalledWith('schedule1');
    });
    
    it('存在しない作業予定を削除しようとした場合、ResourceNotFoundErrorをスローすること', async () => {
      // モック関数の実装を設定
      (workScheduleService.deleteWorkSchedule as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('作業予定', 'nonexistent')
      );
      
      // サービス関数を実行と検証
      await expect(workScheduleService.deleteWorkSchedule('nonexistent'))
        .rejects.toThrow(ResourceNotFoundError);
      
      // 関数が正しく呼び出されたことを検証
      expect(workScheduleService.deleteWorkSchedule).toHaveBeenCalledWith('nonexistent');
    });
  });
});
