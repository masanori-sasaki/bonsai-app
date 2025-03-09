import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { WorkRecordService } from './work-record.service';
import { ApiService } from './api.service';
import { of } from 'rxjs';
import { 
  WorkRecord, 
  WorkRecordListResponse, 
  CreateWorkRecordRequest, 
  UpdateWorkRecordRequest 
} from '../models/work-record.model';

describe('WorkRecordService', () => {
  let service: WorkRecordService;
  let apiService: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WorkRecordService, ApiService]
    });
    service = TestBed.inject(WorkRecordService);
    apiService = TestBed.inject(ApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getWorkRecordList', () => {
    it('should get work record list without optional parameters', () => {
      // モックデータ
      const mockResponse: WorkRecordListResponse = {
        items: [
          {
            id: 'record1',
            bonsaiId: 'bonsai1',
            workType: 'pruning',
            date: '2025-02-15T10:00:00Z',
            description: '剪定作業を行いました。',
            imageUrls: ['https://example.com/images/record1-1.jpg'],
            createdAt: '2025-02-15T10:30:00Z',
            updatedAt: '2025-02-15T10:30:00Z'
          },
          {
            id: 'record2',
            bonsaiId: 'bonsai1',
            workType: 'watering',
            date: '2025-02-10T09:00:00Z',
            description: '水やりを行いました。',
            imageUrls: [],
            createdAt: '2025-02-10T09:15:00Z',
            updatedAt: '2025-02-10T09:15:00Z'
          }
        ],
        nextToken: undefined
      };

      // ApiServiceのgetメソッドをモック
      spyOn(apiService, 'get').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し
      const bonsaiId = 'bonsai1';
      service.getWorkRecordList(bonsaiId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.items.length).toBe(2);
        expect(response.items[0].workType).toBe('pruning');
        expect(response.nextToken).toBeUndefined();
      });

      // ApiServiceのgetメソッドが正しく呼び出されたことを確認
      expect(apiService.get).toHaveBeenCalledWith(`bonsai/${bonsaiId}/records`, {});
    });

    it('should get work record list with workType filter', () => {
      // モックデータ
      const mockResponse: WorkRecordListResponse = {
        items: [
          {
            id: 'record1',
            bonsaiId: 'bonsai1',
            workType: 'pruning',
            date: '2025-02-15T10:00:00Z',
            description: '剪定作業を行いました。',
            imageUrls: ['https://example.com/images/record1-1.jpg'],
            createdAt: '2025-02-15T10:30:00Z',
            updatedAt: '2025-02-15T10:30:00Z'
          }
        ],
        nextToken: undefined
      };

      // ApiServiceのgetメソッドをモック
      spyOn(apiService, 'get').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し（workTypeを指定）
      const bonsaiId = 'bonsai1';
      const workType = 'pruning';
      service.getWorkRecordList(bonsaiId, workType).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.items.length).toBe(1);
        expect(response.items[0].workType).toBe(workType);
      });

      // ApiServiceのgetメソッドが正しく呼び出されたことを確認
      expect(apiService.get).toHaveBeenCalledWith(`bonsai/${bonsaiId}/records`, { workType });
    });

    it('should get work record list with limit and nextToken parameters', () => {
      // モックデータ
      const mockResponse: WorkRecordListResponse = {
        items: [
          {
            id: 'record2',
            bonsaiId: 'bonsai1',
            workType: 'watering',
            date: '2025-02-10T09:00:00Z',
            description: '水やりを行いました。',
            imageUrls: [],
            createdAt: '2025-02-10T09:15:00Z',
            updatedAt: '2025-02-10T09:15:00Z'
          }
        ],
        nextToken: 'next-token'
      };

      // ApiServiceのgetメソッドをモック
      spyOn(apiService, 'get').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し（limitとnextTokenを指定）
      const bonsaiId = 'bonsai1';
      const limit = 1;
      const nextToken = 'current-token';
      service.getWorkRecordList(bonsaiId, undefined, limit, nextToken).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.items.length).toBe(1);
        expect(response.nextToken).toBe('next-token');
      });

      // ApiServiceのgetメソッドが正しく呼び出されたことを確認
      expect(apiService.get).toHaveBeenCalledWith(`bonsai/${bonsaiId}/records`, { 
        limit: '1', 
        nextToken 
      });
    });
  });

  describe('getWorkRecordDetail', () => {
    it('should get work record detail', () => {
      // モックデータ
      const mockResponse: WorkRecord = {
        id: 'record1',
        bonsaiId: 'bonsai1',
        workType: 'pruning',
        date: '2025-02-15T10:00:00Z',
        description: '剪定作業を行いました。枝を整えて形を整えました。',
        imageUrls: ['https://example.com/images/record1-1.jpg', 'https://example.com/images/record1-2.jpg'],
        createdAt: '2025-02-15T10:30:00Z',
        updatedAt: '2025-02-15T10:30:00Z'
      };

      // ApiServiceのgetメソッドをモック
      spyOn(apiService, 'get').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し
      const recordId = 'record1';
      service.getWorkRecordDetail(recordId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.id).toBe(recordId);
        expect(response.workType).toBe('pruning');
        expect(response.description).toContain('剪定作業');
        expect(response.imageUrls.length).toBe(2);
      });

      // ApiServiceのgetメソッドが正しく呼び出されたことを確認
      expect(apiService.get).toHaveBeenCalledWith(`records/${recordId}`);
    });
  });

  describe('createWorkRecord', () => {
    it('should create work record', () => {
      // リクエストデータ
      const createRequest: CreateWorkRecordRequest = {
        bonsaiId: 'bonsai1', // bonsaiIdを追加
        workType: 'fertilizing',
        date: '2025-03-09T11:00:00Z',
        description: '肥料を与えました。',
        imageUrls: ['https://example.com/images/new-record.jpg']
      };

      // モックレスポンス
      const mockResponse: WorkRecord = {
        id: 'new-record-id',
        bonsaiId: 'bonsai1',
        workType: 'fertilizing',
        date: '2025-03-09T11:00:00Z',
        description: '肥料を与えました。',
        imageUrls: ['https://example.com/images/new-record.jpg'],
        createdAt: '2025-03-09T11:15:00Z',
        updatedAt: '2025-03-09T11:15:00Z'
      };

      // ApiServiceのpostメソッドをモック
      spyOn(apiService, 'post').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し
      const bonsaiId = 'bonsai1';
      service.createWorkRecord(bonsaiId, createRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.id).toBe('new-record-id');
        expect(response.bonsaiId).toBe(bonsaiId);
        expect(response.workType).toBe('fertilizing');
        expect(response.description).toBe('肥料を与えました。');
      });

      // ApiServiceのpostメソッドが正しく呼び出されたことを確認
      expect(apiService.post).toHaveBeenCalledWith(`bonsai/${bonsaiId}/records`, createRequest);
    });
  });

  describe('updateWorkRecord', () => {
    it('should update work record', () => {
      // リクエストデータ
      const updateRequest: UpdateWorkRecordRequest = {
        description: '剪定作業を行いました。枝を整えて形を整えました。追記：特に上部を重点的に剪定しました。',
        imageUrls: ['https://example.com/images/record1-1.jpg', 'https://example.com/images/record1-2.jpg', 'https://example.com/images/record1-3.jpg']
      };

      // モックレスポンス
      const mockResponse: WorkRecord = {
        id: 'record1',
        bonsaiId: 'bonsai1',
        workType: 'pruning',
        date: '2025-02-15T10:00:00Z',
        description: '剪定作業を行いました。枝を整えて形を整えました。追記：特に上部を重点的に剪定しました。',
        imageUrls: ['https://example.com/images/record1-1.jpg', 'https://example.com/images/record1-2.jpg', 'https://example.com/images/record1-3.jpg'],
        createdAt: '2025-02-15T10:30:00Z',
        updatedAt: '2025-03-09T11:30:00Z'
      };

      // ApiServiceのputメソッドをモック
      spyOn(apiService, 'put').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し
      const recordId = 'record1';
      service.updateWorkRecord(recordId, updateRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.id).toBe(recordId);
        expect(response.description).toContain('追記');
        expect(response.imageUrls.length).toBe(3);
        expect(response.updatedAt).not.toBe(response.createdAt);
      });

      // ApiServiceのputメソッドが正しく呼び出されたことを確認
      expect(apiService.put).toHaveBeenCalledWith(`records/${recordId}`, updateRequest);
    });
  });

  describe('deleteWorkRecord', () => {
    it('should delete work record', () => {
      // モックレスポンス
      const mockResponse = {
        message: '作業記録が正常に削除されました',
        id: 'record1'
      };

      // ApiServiceのdeleteメソッドをモック
      spyOn(apiService, 'delete').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し
      const recordId = 'record1';
      service.deleteWorkRecord(recordId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.id).toBe(recordId);
        expect(response.message).toBeTruthy();
      });

      // ApiServiceのdeleteメソッドが正しく呼び出されたことを確認
      expect(apiService.delete).toHaveBeenCalledWith(`records/${recordId}`);
    });
  });
});
