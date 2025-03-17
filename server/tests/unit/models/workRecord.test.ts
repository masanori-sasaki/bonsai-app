/**
 * 作業記録モデルのテスト
 */

import { 
  WorkRecord, 
  WorkType, 
  BulkWateringRequest, 
  BulkWateringResponse 
} from '../../../src/models/workRecord';

describe('作業記録モデル', () => {
  describe('BulkWateringRequest', () => {
    it('一括水やりリクエストの型定義が正しいこと', () => {
      // 型チェックのためのダミーオブジェクト
      const request: BulkWateringRequest = {
        description: '一括水やり',
        date: '2025-03-16T00:00:00Z'
      };
      
      // プロパティの存在確認
      expect(request).toHaveProperty('description');
      expect(request).toHaveProperty('date');
      
      // 型の確認
      expect(typeof request.description).toBe('string');
      expect(typeof request.date).toBe('string');
    });
  });
  
  describe('BulkWateringResponse', () => {
    it('一括水やりレスポンスの型定義が正しいこと', () => {
      // 型チェックのためのダミーオブジェクト
      const response: BulkWateringResponse = {
        success: true,
        message: '5件の盆栽に水やり記録を作成しました',
        recordCount: 5,
        records: [
          {
            id: 'record1',
            bonsaiId: 'bonsai1',
            bonsaiName: '五葉松'
          },
          {
            id: 'record2',
            bonsaiId: 'bonsai2',
            bonsaiName: '真柏'
          }
        ]
      };
      
      // プロパティの存在確認
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('recordCount');
      expect(response).toHaveProperty('records');
      
      // 型の確認
      expect(typeof response.success).toBe('boolean');
      expect(typeof response.message).toBe('string');
      expect(typeof response.recordCount).toBe('number');
      expect(Array.isArray(response.records)).toBe(true);
      
      // recordsの中身の確認
      expect(response.records[0]).toHaveProperty('id');
      expect(response.records[0]).toHaveProperty('bonsaiId');
      expect(response.records[0]).toHaveProperty('bonsaiName');
      expect(typeof response.records[0].id).toBe('string');
      expect(typeof response.records[0].bonsaiId).toBe('string');
      expect(typeof response.records[0].bonsaiName).toBe('string');
    });
  });
});
