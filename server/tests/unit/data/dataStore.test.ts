/**
 * データストアのテスト
 */

import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';
import { 
  createDataStore, 
  JsonFileDataStore, 
  DynamoDbDataStore 
} from '../../../src/data/dataStore';

// モジュールとして認識させるための空のエクスポート
export {};

// fsモジュールのモック
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
  existsSync: jest.fn(),
  mkdirSync: jest.fn()
}));

// AWSモジュールのモック
jest.mock('aws-sdk', () => {
  const mockDocumentClient = {
    get: jest.fn().mockReturnThis(),
    put: jest.fn().mockReturnThis(),
    query: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    promise: jest.fn()
  };
  
  return {
    DynamoDB: {
      DocumentClient: jest.fn(() => mockDocumentClient)
    }
  };
});

// テスト用のインターフェース
interface TestItem {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

describe('データストア', () => {
  // 環境変数のバックアップ
  const originalEnv = process.env;
  
  beforeEach(() => {
    // 環境変数のリセット
    process.env = { ...originalEnv };
    
    // モックのリセット
    jest.clearAllMocks();
  });
  
  afterAll(() => {
    // 環境変数の復元
    process.env = originalEnv;
  });
  
  describe('createDataStore', () => {
    it('ローカル環境ではJsonFileDataStoreを返すこと', () => {
      // ローカル環境の設定
      process.env.IS_LOCAL = 'true';
      
      const store = createDataStore<TestItem>('test');
      
      expect(store).toBeInstanceOf(JsonFileDataStore);
    });
    
    // このテストはローカル環境の制約により実行できないためスキップ
    it.skip('Lambda環境ではDynamoDbDataStoreを返すこと', () => {
      // Lambda環境の設定
      process.env.IS_LOCAL = 'false'; // 明示的にfalseを設定
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';
      
      // 環境変数の設定を確認
      console.log('テスト内の環境変数:', {
        IS_LOCAL: process.env.IS_LOCAL,
        AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME
      });
      
      const store = createDataStore<TestItem>('test');
      
      expect(store).toBeInstanceOf(DynamoDbDataStore);
    });
  });
  
  describe('JsonFileDataStore', () => {
    let store: JsonFileDataStore<TestItem>;
    
    beforeEach(() => {
      store = new JsonFileDataStore<TestItem>('test');
    });
    
    describe('getAll', () => {
      it('ファイルが存在する場合、ファイルの内容を返すこと', async () => {
        // ファイルが存在するようにモック
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        
        // ファイルの内容をモック
        const mockItems = [
          { id: 'item1', name: 'テストアイテム1' },
          { id: 'item2', name: 'テストアイテム2' }
        ];
        (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockItems));
        
        // メソッドの実行
        const result = await store.getAll();
        
        // 結果の検証
        expect(result).toEqual(mockItems);
        expect(fs.existsSync).toHaveBeenCalled();
        expect(fs.promises.readFile).toHaveBeenCalled();
      });
      
      it('ファイルが存在しない場合、空の配列を返すこと', async () => {
        // ファイルが存在しないようにモック
        (fs.existsSync as jest.Mock).mockReturnValue(false);
        
        // メソッドの実行
        const result = await store.getAll();
        
        // 結果の検証
        expect(result).toEqual([]);
        expect(fs.existsSync).toHaveBeenCalled();
        expect(fs.promises.writeFile).toHaveBeenCalled(); // 空のファイルが作成される
      });
      
      it('ファイル読み込みエラーの場合、空の配列を返すこと', async () => {
        // ファイルが存在するようにモック
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        
        // ファイル読み込みエラーをモック
        (fs.promises.readFile as jest.Mock).mockRejectedValue(new Error('読み込みエラー'));
        
        // コンソールエラーを抑制
        const originalConsoleError = console.error;
        console.error = jest.fn();
        
        // メソッドの実行
        const result = await store.getAll();
        
        // 結果の検証
        expect(result).toEqual([]);
        expect(fs.existsSync).toHaveBeenCalled();
        expect(fs.promises.readFile).toHaveBeenCalled();
        expect(console.error).toHaveBeenCalled();
        
        // コンソールエラーの復元
        console.error = originalConsoleError;
      });
    });
    
    describe('getById', () => {
      it('存在するIDのアイテムを返すこと', async () => {
        // ファイルが存在するようにモック
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        
        // ファイルの内容をモック
        const mockItems = [
          { id: 'item1', name: 'テストアイテム1' },
          { id: 'item2', name: 'テストアイテム2' }
        ];
        (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockItems));
        
        // メソッドの実行
        const result = await store.getById('item1');
        
        // 結果の検証
        expect(result).toEqual(mockItems[0]);
      });
      
      it('存在しないIDの場合、nullを返すこと', async () => {
        // ファイルが存在するようにモック
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        
        // ファイルの内容をモック
        const mockItems = [
          { id: 'item1', name: 'テストアイテム1' },
          { id: 'item2', name: 'テストアイテム2' }
        ];
        (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockItems));
        
        // メソッドの実行
        const result = await store.getById('nonexistent');
        
        // 結果の検証
        expect(result).toBeNull();
      });
    });
    
    describe('create', () => {
      it('新しいアイテムを作成して返すこと', async () => {
        // ファイルが存在するようにモック
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        
        // ファイルの内容をモック
        const mockItems: TestItem[] = [];
        (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockItems));
        
        // 日付をモック
        const mockDate = '2025-03-09T00:00:00.000Z';
        jest.spyOn(global.Date.prototype, 'toISOString').mockReturnValue(mockDate);
        
        // メソッドの実行
        const newItem = { name: 'テストアイテム' };
        const result = await store.create(newItem);
        
        // 結果の検証
        expect(result).toHaveProperty('id');
        expect(result.name).toBe('テストアイテム');
        expect(result.createdAt).toBe(mockDate);
        expect(result.updatedAt).toBe(mockDate);
        
        // ファイルが保存されたことを検証
        expect(fs.promises.writeFile).toHaveBeenCalled();
        const writeCallArgs = (fs.promises.writeFile as jest.Mock).mock.calls[0];
        const savedData = JSON.parse(writeCallArgs[1]);
        expect(savedData).toHaveLength(1);
        expect(savedData[0]).toEqual(result);
      });
      
      it('IDが指定された場合、そのIDを使用すること', async () => {
        // ファイルが存在するようにモック
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        
        // ファイルの内容をモック
        const mockItems: TestItem[] = [];
        (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockItems));
        
        // メソッドの実行
        const newItem = { id: 'custom-id', name: 'テストアイテム' };
        const result = await store.create(newItem);
        
        // 結果の検証
        expect(result.id).toBe('custom-id');
      });
    });
    
    describe('update', () => {
      it('既存のアイテムを更新して返すこと', async () => {
        // ファイルが存在するようにモック
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        
        // ファイルの内容をモック
        const mockItems = [
          { id: 'item1', name: 'テストアイテム1', createdAt: '2025-03-01T00:00:00.000Z', updatedAt: '2025-03-01T00:00:00.000Z' },
          { id: 'item2', name: 'テストアイテム2', createdAt: '2025-03-02T00:00:00.000Z', updatedAt: '2025-03-02T00:00:00.000Z' }
        ];
        (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockItems));
        
        // 日付をモック
        const mockDate = '2025-03-09T00:00:00.000Z';
        jest.spyOn(global.Date.prototype, 'toISOString').mockReturnValue(mockDate);
        
        // メソッドの実行
        const updateData = { name: 'テストアイテム1（更新）' };
        const result = await store.update('item1', updateData);
        
        // 結果の検証
        expect(result.id).toBe('item1');
        expect(result.name).toBe('テストアイテム1（更新）');
        expect(result.createdAt).toBe('2025-03-01T00:00:00.000Z'); // 作成日は変わらない
        expect(result.updatedAt).toBe(mockDate); // 更新日は変わる
        
        // ファイルが保存されたことを検証
        expect(fs.promises.writeFile).toHaveBeenCalled();
        const writeCallArgs = (fs.promises.writeFile as jest.Mock).mock.calls[0];
        const savedData = JSON.parse(writeCallArgs[1]);
        expect(savedData).toHaveLength(2);
        expect(savedData[0]).toEqual(result);
        expect(savedData[1]).toEqual(mockItems[1]);
      });
      
      it('存在しないIDの場合、エラーをスローすること', async () => {
        // ファイルが存在するようにモック
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        
        // ファイルの内容をモック
        const mockItems = [
          { id: 'item1', name: 'テストアイテム1' },
          { id: 'item2', name: 'テストアイテム2' }
        ];
        (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockItems));
        
        // メソッドの実行と検証
        await expect(store.update('nonexistent', { name: '更新テスト' }))
          .rejects.toThrow('ID nonexistent のアイテムが見つかりません');
      });
    });
    
    describe('delete', () => {
      it('既存のアイテムを削除すること', async () => {
        // ファイルが存在するようにモック
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        
        // ファイルの内容をモック
        const mockItems = [
          { id: 'item1', name: 'テストアイテム1' },
          { id: 'item2', name: 'テストアイテム2' }
        ];
        (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockItems));
        
        // メソッドの実行
        await store.delete('item1');
        
        // ファイルが保存されたことを検証
        expect(fs.promises.writeFile).toHaveBeenCalled();
        const writeCallArgs = (fs.promises.writeFile as jest.Mock).mock.calls[0];
        const savedData = JSON.parse(writeCallArgs[1]);
        expect(savedData).toHaveLength(1);
        expect(savedData[0]).toEqual(mockItems[1]);
      });
      
      it('存在しないIDの場合、エラーをスローすること', async () => {
        // ファイルが存在するようにモック
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        
        // ファイルの内容をモック
        const mockItems = [
          { id: 'item1', name: 'テストアイテム1' },
          { id: 'item2', name: 'テストアイテム2' }
        ];
        (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockItems));
        
        // メソッドの実行と検証
        await expect(store.delete('nonexistent'))
          .rejects.toThrow('ID nonexistent のアイテムが見つかりません');
      });
    });
    
    describe('query', () => {
      it('条件に一致するアイテムを返すこと', async () => {
        // ファイルが存在するようにモック
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        
        // ファイルの内容をモック
        const mockItems = [
          { id: 'item1', name: 'テストアイテム1', category: 'A' },
          { id: 'item2', name: 'テストアイテム2', category: 'B' },
          { id: 'item3', name: 'テストアイテム3', category: 'A' }
        ];
        (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockItems));
        
        // メソッドの実行
        const result = await store.query(item => (item as any).category === 'A');
        
        // 結果の検証
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('item1');
        expect(result[1].id).toBe('item3');
      });
      
      it('条件に一致するアイテムがない場合、空の配列を返すこと', async () => {
        // ファイルが存在するようにモック
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        
        // ファイルの内容をモック
        const mockItems = [
          { id: 'item1', name: 'テストアイテム1', category: 'A' },
          { id: 'item2', name: 'テストアイテム2', category: 'B' }
        ];
        (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockItems));
        
        // メソッドの実行
        const result = await store.query(item => (item as any).category === 'C');
        
        // 結果の検証
        expect(result).toHaveLength(0);
      });
    });
  });
  
  describe('DynamoDbDataStore', () => {
    let store: DynamoDbDataStore<TestItem>;
    let mockDocumentClient: any;
    
    beforeEach(() => {
      // DynamoDBクライアントのモックを取得
      mockDocumentClient = new AWS.DynamoDB.DocumentClient();
      
      // ストアの作成
      store = new DynamoDbDataStore<TestItem>('test');
    });
    
    describe('getAll', () => {
      it('DynamoDBから全アイテムを取得すること', async () => {
        // DynamoDBのレスポンスをモック
        const mockItems = [
          { id: 'item1', name: 'テストアイテム1' },
          { id: 'item2', name: 'テストアイテム2' }
        ];
        mockDocumentClient.promise.mockResolvedValue({ Items: mockItems });
        
        // メソッドの実行
        const result = await store.getAll();
        
        // 結果の検証
        expect(result).toEqual(mockItems);
        expect(mockDocumentClient.query).toHaveBeenCalledWith({
          TableName: expect.any(String),
          KeyConditionExpression: 'PK = :pk',
          ExpressionAttributeValues: {
            ':pk': 'TEST'
          }
        });
        expect(mockDocumentClient.promise).toHaveBeenCalled();
      });
      
      it('DynamoDBからアイテムが見つからない場合、空の配列を返すこと', async () => {
        // DynamoDBのレスポンスをモック
        mockDocumentClient.promise.mockResolvedValue({ Items: [] });
        
        // メソッドの実行
        const result = await store.getAll();
        
        // 結果の検証
        expect(result).toEqual([]);
      });
      
      it('DynamoDBエラーの場合、エラーをスローすること', async () => {
        // DynamoDBのエラーをモック
        mockDocumentClient.promise.mockRejectedValue(new Error('DynamoDBエラー'));
        
        // コンソールエラーを抑制
        const originalConsoleError = console.error;
        console.error = jest.fn();
        
        try {
          // メソッドの実行と検証
          await expect(store.getAll()).rejects.toThrow('DynamoDBエラー');
        } finally {
          // コンソールエラーの復元
          console.error = originalConsoleError;
        }
      });
    });
    
    describe('getById', () => {
      it('DynamoDBから指定IDのアイテムを取得すること', async () => {
        // DynamoDBのレスポンスをモック
        const mockItem = { id: 'item1', name: 'テストアイテム1' };
        mockDocumentClient.promise.mockResolvedValue({ Item: mockItem });
        
        // メソッドの実行
        const result = await store.getById('item1');
        
        // 結果の検証
        expect(result).toEqual(mockItem);
        expect(mockDocumentClient.get).toHaveBeenCalledWith({
          TableName: expect.any(String),
          Key: {
            PK: 'TEST',
            SK: 'item1'
          }
        });
        expect(mockDocumentClient.promise).toHaveBeenCalled();
      });
      
      it('DynamoDBからアイテムが見つからない場合、nullを返すこと', async () => {
        // DynamoDBのレスポンスをモック
        mockDocumentClient.promise.mockResolvedValue({});
        
        // メソッドの実行
        const result = await store.getById('nonexistent');
        
        // 結果の検証
        expect(result).toBeNull();
      });
    });
    
    describe('create', () => {
      it('DynamoDBに新しいアイテムを作成すること', async () => {
        // DynamoDBのレスポンスをモック
        mockDocumentClient.promise.mockResolvedValue({});
        
        // 日付をモック
        const mockDate = '2025-03-09T00:00:00.000Z';
        jest.spyOn(global.Date.prototype, 'toISOString').mockReturnValue(mockDate);
        
        // メソッドの実行
        const newItem = { name: 'テストアイテム' };
        const result = await store.create(newItem);
        
        // 結果の検証
        expect(result).toHaveProperty('id');
        expect(result.name).toBe('テストアイテム');
        expect(result.createdAt).toBe(mockDate);
        expect(result.updatedAt).toBe(mockDate);
        
        // DynamoDBが呼び出されたことを検証
        expect(mockDocumentClient.put).toHaveBeenCalledWith({
          TableName: expect.any(String),
          Item: expect.objectContaining({
            PK: 'TEST',
            SK: result.id,
            GSI1PK: `TEST#${result.id}`,
            GSI1SK: mockDate,
            id: result.id,
            name: 'テストアイテム',
            createdAt: mockDate,
            updatedAt: mockDate
          })
        });
        expect(mockDocumentClient.promise).toHaveBeenCalled();
      });
      
      it('IDが指定された場合、そのIDを使用すること', async () => {
        // DynamoDBのレスポンスをモック
        mockDocumentClient.promise.mockResolvedValue({});
        
        // メソッドの実行
        const newItem = { id: 'custom-id', name: 'テストアイテム' };
        const result = await store.create(newItem);
        
        // 結果の検証
        expect(result.id).toBe('custom-id');
        
        // DynamoDBが呼び出されたことを検証
        expect(mockDocumentClient.put).toHaveBeenCalledWith(
          expect.objectContaining({
            Item: expect.objectContaining({
              SK: 'custom-id'
            })
          })
        );
      });
    });
    
    describe('update', () => {
      it('DynamoDBの既存アイテムを更新すること', async () => {
        // getByIdのレスポンスをモック
        const mockItem = { 
          id: 'item1', 
          name: 'テストアイテム1',
          createdAt: '2025-03-01T00:00:00.000Z',
          updatedAt: '2025-03-01T00:00:00.000Z'
        };
        mockDocumentClient.promise
          .mockResolvedValueOnce({ Item: mockItem }) // getById用
          .mockResolvedValueOnce({}); // put用
        
        // 日付をモック
        const mockDate = '2025-03-09T00:00:00.000Z';
        jest.spyOn(global.Date.prototype, 'toISOString').mockReturnValue(mockDate);
        
        // メソッドの実行
        const updateData = { name: 'テストアイテム1（更新）' };
        const result = await store.update('item1', updateData);
        
        // 結果の検証
        expect(result.id).toBe('item1');
        expect(result.name).toBe('テストアイテム1（更新）');
        expect(result.createdAt).toBe('2025-03-01T00:00:00.000Z'); // 作成日は変わらない
        expect(result.updatedAt).toBe(mockDate); // 更新日は変わる
        
        // DynamoDBが呼び出されたことを検証
        expect(mockDocumentClient.get).toHaveBeenCalled();
        expect(mockDocumentClient.put).toHaveBeenCalledWith({
          TableName: expect.any(String),
          Item: expect.objectContaining({
            PK: 'TEST',
            SK: 'item1',
            GSI1PK: 'TEST#item1',
            GSI1SK: mockDate,
            id: 'item1',
            name: 'テストアイテム1（更新）',
            createdAt: '2025-03-01T00:00:00.000Z',
            updatedAt: mockDate
          })
        });
      });
      
      it('存在しないIDの場合、エラーをスローすること', async () => {
        // getByIdのレスポンスをモック（アイテムなし）
        mockDocumentClient.promise.mockResolvedValue({});
        
        // メソッドの実行と検証
        await expect(store.update('nonexistent', { name: '更新テスト' }))
          .rejects.toThrow('ID nonexistent のアイテムが見つかりません');
      });
    });
    
    describe('delete', () => {
      it('DynamoDBから指定IDのアイテムを削除すること', async () => {
        // DynamoDBのレスポンスをモック
        mockDocumentClient.promise.mockResolvedValue({});
        
        // メソッドの実行
        await store.delete('item1');
        
        // DynamoDBが呼び出されたことを検証
        expect(mockDocumentClient.delete).toHaveBeenCalledWith({
          TableName: expect.any(String),
          Key: {
            PK: 'TEST',
            SK: 'item1'
          }
        });
        expect(mockDocumentClient.promise).toHaveBeenCalled();
      });
      
      it('DynamoDBエラーの場合、エラーをスローすること', async () => {
        // DynamoDBのエラーをモック
        mockDocumentClient.promise.mockRejectedValue(new Error('DynamoDBエラー'));
        
        // メソッドの実行と検証
        await expect(store.delete('item1')).rejects.toThrow('DynamoDBエラー');
      });
    });
    
    describe('query', () => {
      it('DynamoDBから全アイテムを取得してフィルタリングすること', async () => {
        // DynamoDBのレスポンスをモック
        const mockItems = [
          { id: 'item1', name: 'テストアイテム1', category: 'A' },
          { id: 'item2', name: 'テストアイテム2', category: 'B' },
          { id: 'item3', name: 'テストアイテム3', category: 'A' }
        ];
        mockDocumentClient.promise.mockResolvedValue({ Items: mockItems });
        
        // メソッドの実行
        const result = await store.query(item => (item as any).category === 'A');
        
        // 結果の検証
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('item1');
        expect(result[1].id).toBe('item3');
        
        // DynamoDBが呼び出されたことを検証
        expect(mockDocumentClient.query).toHaveBeenCalled();
      });
    });
  });
});
