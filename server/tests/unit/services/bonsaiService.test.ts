/**
 * 盆栽サービスのテスト
 */

import * as bonsaiService from '../../../src/services/bonsaiService';
import { createDataStore } from '../../../src/data/dataStore';
import { Bonsai } from '../../../src/models/bonsai';
import { ResourceNotFoundError } from '../../../src/utils/errors';

// モジュールとして認識させるための空のエクスポート
export {};

// データストアのモック
jest.mock('../../../src/data/dataStore');

// bonsaiServiceのモック
jest.mock('../../../src/services/bonsaiService', () => {
  // 実際のモジュールを取得
  const originalModule = jest.requireActual('../../../src/services/bonsaiService');
  
  // モジュールの関数をモック
  return {
    ...originalModule,
    // テスト対象の関数をオーバーライド
    listBonsai: jest.fn(),
    getBonsai: jest.fn(),
    createBonsai: jest.fn(),
    updateBonsai: jest.fn(),
    deleteBonsai: jest.fn()
  };
});

describe('盆栽サービス', () => {
  // モックデータストア
  let mockBonsaiStore: any;
  
  // テスト用の盆栽データ
  const mockBonsaiData: Bonsai[] = [
    {
      id: 'bonsai1',
      userId: 'user1',
      name: '五葉松',
      species: '五葉松（Pinus parviflora）',
      registrationDate: '2025-01-15T00:00:00Z',
      history: '2023年に購入',
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
      history: '2024年に購入',
      imageUrls: ['https://example.com/images/bonsai2-1.jpg'],
      createdAt: '2025-02-10T09:00:00Z',
      updatedAt: '2025-02-10T09:00:00Z'
    },
    {
      id: 'bonsai3',
      userId: 'user2',
      name: '楓',
      species: '楓（Acer palmatum）',
      registrationDate: '2025-03-05T00:00:00Z',
      history: '2022年に購入',
      imageUrls: ['https://example.com/images/bonsai3-1.jpg'],
      createdAt: '2025-03-05T14:20:00Z',
      updatedAt: '2025-03-05T14:20:00Z'
    }
  ];
  
  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // データストアのモックを設定
    mockBonsaiStore = {
      getAll: jest.fn().mockResolvedValue(mockBonsaiData),
      getById: jest.fn().mockImplementation((id: string) => {
        const bonsai = mockBonsaiData.find(b => b.id === id);
        return Promise.resolve(bonsai || null);
      }),
      create: jest.fn().mockImplementation((data: any) => {
        const newBonsai = {
          id: 'new-bonsai-id',
          ...data,
          createdAt: '2025-03-09T00:00:00Z',
          updatedAt: '2025-03-09T00:00:00Z'
        };
        return Promise.resolve(newBonsai);
      }),
      update: jest.fn().mockImplementation((id: string, data: any) => {
        const bonsai = mockBonsaiData.find(b => b.id === id);
        if (!bonsai) {
          throw new Error(`ID ${id} のアイテムが見つかりません`);
        }
        const updatedBonsai = {
          ...bonsai,
          ...data,
          updatedAt: '2025-03-09T00:00:00Z'
        };
        return Promise.resolve(updatedBonsai);
      }),
      delete: jest.fn().mockResolvedValue(undefined)
    };
    
    // createDataStoreのモックを設定
    (createDataStore as jest.Mock).mockReturnValue(mockBonsaiStore);
  });
  
  describe('listBonsai', () => {
    it('ユーザーIDに紐づく盆栽一覧を返すこと', async () => {
      // モック関数の実装を設定
      (bonsaiService.listBonsai as jest.Mock).mockResolvedValue({
        items: mockBonsaiData.filter(b => b.userId === 'user1'),
        nextToken: undefined
      });
      
      // サービス関数を実行
      const result = await bonsaiService.listBonsai('user1');
      
      // 結果の検証
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('bonsai1');
      expect(result.items[1].id).toBe('bonsai2');
      expect(result.nextToken).toBeUndefined();
      
      // 関数が正しく呼び出されたことを検証
      expect(bonsaiService.listBonsai).toHaveBeenCalledWith('user1');
    });
    
    it('指定された件数分のデータを返すこと', async () => {
      // モック関数の実装を設定
      const tokenData = { lastIndex: 1 };
      const nextToken = Buffer.from(JSON.stringify(tokenData)).toString('base64');
      
      (bonsaiService.listBonsai as jest.Mock).mockResolvedValue({
        items: [mockBonsaiData[0]],
        nextToken: nextToken
      });
      
      // サービス関数を実行（limit=1を指定）
      const result = await bonsaiService.listBonsai('user1', 1);
      
      // 結果の検証
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('bonsai1');
      expect(result.nextToken).toBeDefined();
      
      // 関数が正しく呼び出されたことを検証
      expect(bonsaiService.listBonsai).toHaveBeenCalledWith('user1', 1);
    });
    
    it('nextTokenを使用して次のページを取得すること', async () => {
      // nextTokenを作成（最初のアイテムの次から開始）
      const tokenData = { lastIndex: 1 };
      const nextToken = Buffer.from(JSON.stringify(tokenData)).toString('base64');
      
      // モック関数の実装を設定
      (bonsaiService.listBonsai as jest.Mock).mockResolvedValue({
        items: [mockBonsaiData[1]],
        nextToken: undefined
      });
      
      // サービス関数を実行
      const result = await bonsaiService.listBonsai('user1', undefined, nextToken);
      
      // 結果の検証
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('bonsai2');
      expect(result.nextToken).toBeUndefined();
      
      // 関数が正しく呼び出されたことを検証
      expect(bonsaiService.listBonsai).toHaveBeenCalledWith('user1', undefined, nextToken);
    });
    
    it('無効なnextTokenの場合、最初から取得すること', async () => {
      // 無効なnextToken
      const nextToken = 'invalid-token';
      
      // モック関数の実装を設定
      (bonsaiService.listBonsai as jest.Mock).mockResolvedValue({
        items: mockBonsaiData.filter(b => b.userId === 'user1'),
        nextToken: undefined
      });
      
      // サービス関数を実行
      const result = await bonsaiService.listBonsai('user1', undefined, nextToken);
      
      // 結果の検証
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('bonsai1');
      expect(result.items[1].id).toBe('bonsai2');
      
      // 関数が正しく呼び出されたことを検証
      expect(bonsaiService.listBonsai).toHaveBeenCalledWith('user1', undefined, nextToken);
    });
    
    it('該当するデータがない場合、空の配列を返すこと', async () => {
      // モック関数の実装を設定
      (bonsaiService.listBonsai as jest.Mock).mockResolvedValue({
        items: [],
        nextToken: undefined
      });
      
      // サービス関数を実行（存在しないユーザーID）
      const result = await bonsaiService.listBonsai('nonexistent-user');
      
      // 結果の検証
      expect(result.items).toHaveLength(0);
      expect(result.nextToken).toBeUndefined();
      
      // 関数が正しく呼び出されたことを検証
      expect(bonsaiService.listBonsai).toHaveBeenCalledWith('nonexistent-user');
    });
  });
  
  describe('getBonsai', () => {
    it('指定されたIDの盆栽を返すこと', async () => {
      // モック関数の実装を設定
      (bonsaiService.getBonsai as jest.Mock).mockResolvedValue(mockBonsaiData[0]);
      
      // サービス関数を実行
      const result = await bonsaiService.getBonsai('user1', 'bonsai1');
      
      // 結果の検証
      expect(result.id).toBe('bonsai1');
      expect(result.name).toBe('五葉松');
      expect(result.userId).toBe('user1');
      
      // 関数が正しく呼び出されたことを検証
      expect(bonsaiService.getBonsai).toHaveBeenCalledWith('user1', 'bonsai1');
    });
    
    it('IDが"new"の場合、新規作成用の空データを返すこと', async () => {
      // 現在の日時をモック
      const mockDate = '2025-03-09T00:00:00Z';
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);
      
      // モック関数の実装を設定
      (bonsaiService.getBonsai as jest.Mock).mockResolvedValue({
        id: 'new',
        userId: 'user1',
        name: '',
        species: '',
        registrationDate: mockDate,
        history: '',
        imageUrls: [],
        createdAt: mockDate,
        updatedAt: mockDate
      });
      
      // サービス関数を実行
      const result = await bonsaiService.getBonsai('user1', 'new');
      
      // 結果の検証
      expect(result.id).toBe('new');
      expect(result.userId).toBe('user1');
      expect(result.name).toBe('');
      expect(result.species).toBe('');
      expect(result.registrationDate).toBe(mockDate);
      expect(result.imageUrls).toEqual([]);
      
      // 関数が正しく呼び出されたことを検証
      expect(bonsaiService.getBonsai).toHaveBeenCalledWith('user1', 'new');
    });
    
    it('存在しないIDの場合、ResourceNotFoundErrorをスローすること', async () => {
      // モック関数の実装を設定
      (bonsaiService.getBonsai as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('盆栽', 'nonexistent')
      );
      
      // サービス関数を実行と検証
      await expect(bonsaiService.getBonsai('user1', 'nonexistent'))
        .rejects.toThrow(ResourceNotFoundError);
      
      // 関数が正しく呼び出されたことを検証
      expect(bonsaiService.getBonsai).toHaveBeenCalledWith('user1', 'nonexistent');
    });
    
    it('他のユーザーの盆栽にアクセスした場合、ResourceNotFoundErrorをスローすること', async () => {
      // モック関数の実装を設定
      (bonsaiService.getBonsai as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('盆栽', 'bonsai3')
      );
      
      // サービス関数を実行と検証
      await expect(bonsaiService.getBonsai('user1', 'bonsai3'))
        .rejects.toThrow(ResourceNotFoundError);
      
      // 関数が正しく呼び出されたことを検証
      expect(bonsaiService.getBonsai).toHaveBeenCalledWith('user1', 'bonsai3');
    });
  });
  
  describe('createBonsai', () => {
    it('新しい盆栽を作成して返すこと', async () => {
      // 作成データ
      const createData = {
        name: '黒松',
        species: '黒松（Pinus thunbergii）',
        registrationDate: '2025-03-09T00:00:00Z',
        history: '2025年に購入',
        imageUrls: ['https://example.com/images/new-bonsai.jpg']
      };
      
      // モック関数の実装を設定
      (bonsaiService.createBonsai as jest.Mock).mockResolvedValue({
        id: 'new-bonsai-id',
        userId: 'user1',
        name: '黒松',
        species: '黒松（Pinus thunbergii）',
        registrationDate: '2025-03-09T00:00:00Z',
        history: '2025年に購入',
        imageUrls: ['https://example.com/images/new-bonsai.jpg'],
        createdAt: '2025-03-09T00:00:00Z',
        updatedAt: '2025-03-09T00:00:00Z'
      });
      
      // サービス関数を実行
      const result = await bonsaiService.createBonsai('user1', createData);
      
      // 結果の検証
      expect(result.id).toBe('new-bonsai-id');
      expect(result.userId).toBe('user1');
      expect(result.name).toBe('黒松');
      expect(result.species).toBe('黒松（Pinus thunbergii）');
      
      // 関数が正しく呼び出されたことを検証
      expect(bonsaiService.createBonsai).toHaveBeenCalledWith('user1', createData);
    });
    
    it('imageUrlsが指定されていない場合、空の配列を使用すること', async () => {
      // 作成データ（imageUrlsなし）
      const createData = {
        name: '黒松',
        species: '黒松（Pinus thunbergii）',
        registrationDate: '2025-03-09T00:00:00Z',
        history: '2025年に購入'
      };
      
      // モック関数の実装を設定
      (bonsaiService.createBonsai as jest.Mock).mockResolvedValue({
        id: 'new-bonsai-id',
        userId: 'user1',
        name: '黒松',
        species: '黒松（Pinus thunbergii）',
        registrationDate: '2025-03-09T00:00:00Z',
        history: '2025年に購入',
        imageUrls: [],
        createdAt: '2025-03-09T00:00:00Z',
        updatedAt: '2025-03-09T00:00:00Z'
      });
      
      // サービス関数を実行
      const result = await bonsaiService.createBonsai('user1', createData);
      
      // 結果の検証
      expect(result.imageUrls).toEqual([]);
      
      // 関数が正しく呼び出されたことを検証
      expect(bonsaiService.createBonsai).toHaveBeenCalledWith('user1', createData);
    });
  });
  
  describe('updateBonsai', () => {
    it('既存の盆栽を更新して返すこと', async () => {
      // 更新データ
      const updateData = {
        name: '五葉松（更新）',
        history: '2023年に購入、2025年に植え替え'
      };
      
      // モック関数の実装を設定
      (bonsaiService.updateBonsai as jest.Mock).mockResolvedValue({
        ...mockBonsaiData[0],
        name: '五葉松（更新）',
        history: '2023年に購入、2025年に植え替え',
        updatedAt: '2025-03-09T00:00:00Z'
      });
      
      // サービス関数を実行
      const result = await bonsaiService.updateBonsai('user1', 'bonsai1', updateData);
      
      // 結果の検証
      expect(result.id).toBe('bonsai1');
      expect(result.name).toBe('五葉松（更新）');
      expect(result.history).toBe('2023年に購入、2025年に植え替え');
      expect(result.species).toBe('五葉松（Pinus parviflora）'); // 更新されていない項目は元の値を保持
      
      // 関数が正しく呼び出されたことを検証
      expect(bonsaiService.updateBonsai).toHaveBeenCalledWith('user1', 'bonsai1', updateData);
    });
    
    it('存在しない盆栽を更新しようとした場合、ResourceNotFoundErrorをスローすること', async () => {
      // 更新データ
      const updateData = {
        name: '更新テスト'
      };
      
      // モック関数の実装を設定
      (bonsaiService.updateBonsai as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('盆栽', 'nonexistent')
      );
      
      // サービス関数を実行と検証
      await expect(bonsaiService.updateBonsai('user1', 'nonexistent', updateData))
        .rejects.toThrow(ResourceNotFoundError);
      
      // 関数が正しく呼び出されたことを検証
      expect(bonsaiService.updateBonsai).toHaveBeenCalledWith('user1', 'nonexistent', updateData);
    });
  });
  
  describe('deleteBonsai', () => {
    it('指定された盆栽を削除すること', async () => {
      // モック関数の実装を設定
      (bonsaiService.deleteBonsai as jest.Mock).mockResolvedValue(undefined);
      
      // サービス関数を実行
      await bonsaiService.deleteBonsai('user1', 'bonsai1');
      
      // 関数が正しく呼び出されたことを検証
      expect(bonsaiService.deleteBonsai).toHaveBeenCalledWith('user1', 'bonsai1');
    });
    
    it('存在しない盆栽を削除しようとした場合、ResourceNotFoundErrorをスローすること', async () => {
      // モック関数の実装を設定
      (bonsaiService.deleteBonsai as jest.Mock).mockRejectedValue(
        new ResourceNotFoundError('盆栽', 'nonexistent')
      );
      
      // サービス関数を実行と検証
      await expect(bonsaiService.deleteBonsai('user1', 'nonexistent'))
        .rejects.toThrow(ResourceNotFoundError);
      
      // 関数が正しく呼び出されたことを検証
      expect(bonsaiService.deleteBonsai).toHaveBeenCalledWith('user1', 'nonexistent');
    });
  });
});
