/**
 * データストアインターフェース
 * 
 * このファイルはデータの永続化を担当するインターフェースと実装を提供します。
 * 開発環境ではJSONファイルを使用し、本番環境ではDynamoDBを使用する想定です。
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// データディレクトリのパス
const DATA_DIR = path.join(__dirname, '../../data');

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
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

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
      this.data = [];
      this.initialized = true;
    }
  }

  // データの保存
  private async saveData(): Promise<void> {
    await fs.promises.writeFile(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
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

// データストアのファクトリ関数
export function createDataStore<T extends { id: string }>(entityName: string): DataStore<T> {
  return new JsonFileDataStore<T>(entityName);
}
