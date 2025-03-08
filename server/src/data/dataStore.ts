/**
 * データストアインターフェース
 * 
 * このファイルはデータの永続化を担当するインターフェースと実装を提供します。
 * ローカル環境ではJSONファイルを使用し、開発環境と本番環境ではDynamoDBを使用します。
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk';

// 環境設定
const IS_LOCAL = process.env.IS_LOCAL === 'true' || !process.env.AWS_LAMBDA_FUNCTION_NAME;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// DynamoDBの設定
const REGION = process.env.AWS_REGION || 'ap-northeast-1';
const ENVIRONMENT = IS_PRODUCTION ? 'prod' : 'dev';
const ACCOUNT_ID = process.env.AWS_ACCOUNT_ID || 'local';
// 環境変数からテーブル名を取得するか、デフォルト値を使用
const TABLE_NAME = process.env.TABLE_NAME || `BonsaiTable-${ENVIRONMENT}-${ACCOUNT_ID}`;

// データディレクトリのパス（JSONファイルストア用）
const DATA_DIR = IS_PRODUCTION
  ? '/tmp/data'  // Lambda環境では/tmpディレクトリを使用
  : path.join(__dirname, '../../data');

// DynamoDBクライアントの設定
const dynamoDbConfig = {
  region: REGION
};

// DynamoDBクライアントの初期化
const dynamoDb = new AWS.DynamoDB.DocumentClient(dynamoDbConfig);

// データストアのインターフェース
export interface DataStore<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<T>;
  update(id: string, item: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  query(filterFn: (item: T) => boolean): Promise<T[]>;
}

// JSONファイルベースのデータストア実装
export class JsonFileDataStore<T extends { id: string }> implements DataStore<T> {
  private filePath: string;
  private data: T[] = [];
  private initialized = false;

  constructor(entityName: string) {
    // データディレクトリが存在しない場合は作成
    // try {
    //   if (!fs.existsSync(DATA_DIR)) {
    //     fs.mkdirSync(DATA_DIR, { recursive: true });
    //   }
    // } catch (error) {
    //   console.error(`データディレクトリの作成に失敗しました: ${error}`);
    //   // エラーをスローせず、続行を試みる
    // }

    this.filePath = path.join(DATA_DIR, `${entityName}.json`);
  }

  // データの初期化
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = await fs.promises.readFile(this.filePath, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.data = [];
        await this.saveData();
      }
      this.initialized = true;
    } catch (error) {
      console.error('データ初期化エラー:', error);
      // エラーが発生した場合は空の配列を使用
      this.data = [];
      this.initialized = true;
    }
  }

  // データの保存
  private async saveData(): Promise<void> {
    try {
      await fs.promises.writeFile(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error(`データの保存に失敗しました: ${error}`);
      // エラーをスローせず、続行を試みる
    }
  }

  // 全アイテムの取得
  async getAll(): Promise<T[]> {
    await this.initialize();
    return [...this.data];
  }

  // IDによるアイテムの取得
  async getById(id: string): Promise<T | null> {
    await this.initialize();
    const item = this.data.find(item => item.id === id);
    return item || null;
  }

  // アイテムの作成
  async create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<T> {
    await this.initialize();
    
    const now = new Date().toISOString();
    const newItem = {
      ...item as any,
      id: item.id || uuidv4(),
      createdAt: now,
      updatedAt: now
    } as T;
    
    this.data.push(newItem);
    await this.saveData();
    
    return newItem;
  }

  // アイテムの更新
  async update(id: string, item: Partial<T>): Promise<T> {
    await this.initialize();
    
    const index = this.data.findIndex(i => i.id === id);
    if (index === -1) {
      throw new Error(`ID ${id} のアイテムが見つかりません`);
    }
    
    const updatedItem = {
      ...this.data[index],
      ...item,
      updatedAt: new Date().toISOString()
    } as T;
    
    this.data[index] = updatedItem;
    await this.saveData();
    
    return updatedItem;
  }

  // アイテムの削除
  async delete(id: string): Promise<void> {
    await this.initialize();
    
    const index = this.data.findIndex(i => i.id === id);
    if (index === -1) {
      throw new Error(`ID ${id} のアイテムが見つかりません`);
    }
    
    this.data.splice(index, 1);
    await this.saveData();
  }

  // クエリによるアイテムの検索
  async query(filterFn: (item: T) => boolean): Promise<T[]> {
    await this.initialize();
    return this.data.filter(filterFn);
  }
}

// DynamoDB用のデータストア実装
export class DynamoDbDataStore<T extends { id: string }> implements DataStore<T> {
  private entityName: string;

  constructor(entityName: string) {
    this.entityName = entityName;
  }

  // 全アイテムの取得
  async getAll(): Promise<T[]> {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `${this.entityName.toUpperCase()}`
      }
    };

    try {
      const result = await dynamoDb.query(params).promise();
      return (result.Items || []).map(item => this.fromDynamoItem(item));
    } catch (error) {
      console.error(`DynamoDB getAll エラー:`, error);
      throw error;
    }
  }

  // IDによるアイテムの取得
  async getById(id: string): Promise<T | null> {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        PK: `${this.entityName.toUpperCase()}`,
        SK: id
      }
    };

    try {
      const result = await dynamoDb.get(params).promise();
      return result.Item ? this.fromDynamoItem(result.Item) : null;
    } catch (error) {
      console.error(`DynamoDB getById エラー:`, error);
      throw error;
    }
  }

  // アイテムの作成
  async create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<T> {
    const now = new Date().toISOString();
    const id = item.id || uuidv4();
    
    const newItem = {
      ...item as any,
      id,
      createdAt: now,
      updatedAt: now
    } as T;
    
    const dynamoItem = this.toDynamoItem(newItem);
    
    const params = {
      TableName: TABLE_NAME,
      Item: dynamoItem
    };

    try {
      await dynamoDb.put(params).promise();
      return newItem;
    } catch (error) {
      console.error(`DynamoDB create エラー:`, error);
      throw error;
    }
  }

  // アイテムの更新
  async update(id: string, item: Partial<T>): Promise<T> {
    // 現在のアイテムを取得
    const currentItem = await this.getById(id);
    if (!currentItem) {
      throw new Error(`ID ${id} のアイテムが見つかりません`);
    }
    
    const updatedItem = {
      ...currentItem,
      ...item,
      updatedAt: new Date().toISOString()
    } as T;
    
    const dynamoItem = this.toDynamoItem(updatedItem);
    
    const params = {
      TableName: TABLE_NAME,
      Item: dynamoItem
    };

    try {
      await dynamoDb.put(params).promise();
      return updatedItem;
    } catch (error) {
      console.error(`DynamoDB update エラー:`, error);
      throw error;
    }
  }

  // アイテムの削除
  async delete(id: string): Promise<void> {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        PK: `${this.entityName.toUpperCase()}`,
        SK: id
      }
    };

    try {
      await dynamoDb.delete(params).promise();
    } catch (error) {
      console.error(`DynamoDB delete エラー:`, error);
      throw error;
    }
  }

  // クエリによるアイテムの検索
  async query(filterFn: (item: T) => boolean): Promise<T[]> {
    // DynamoDBでは効率的なフィルタリングが難しいため、全アイテムを取得してからフィルタリング
    const allItems = await this.getAll();
    return allItems.filter(filterFn);
  }

// DynamoDBアイテムからモデルへの変換
  private fromDynamoItem(item: AWS.DynamoDB.DocumentClient.AttributeMap): T {
    // PK, SK, GSI1PK, GSI1SKを除外し、残りの属性を返す
    const { PK, SK, GSI1PK, GSI1SK, ...data } = item;
    return data as T;
  }

  // モデルからDynamoDBアイテムへの変換
  private toDynamoItem(item: T): AWS.DynamoDB.DocumentClient.AttributeMap {
    const updatedAt = (item as any).updatedAt || new Date().toISOString();
    
    return {
      PK: `${this.entityName.toUpperCase()}`,
      SK: item.id,
      GSI1PK: `${this.entityName.toUpperCase()}#${item.id}`,
      GSI1SK: updatedAt,
      ...item
    };
  }
}

// データストアのファクトリ関数
export function createDataStore<T extends { id: string }>(entityName: string): DataStore<T> {
  // ローカル環境ではJSONファイルを使用し、それ以外の環境ではDynamoDBを使用
  if (IS_LOCAL) {
    console.log(`ローカル環境: ${entityName} にJSONファイルストアを使用します`);
    return new JsonFileDataStore<T>(entityName);
  } else {
    console.log(`クラウド環境: ${entityName} にDynamoDBストアを使用します`);
    return new DynamoDbDataStore<T>(entityName);
  }
}
