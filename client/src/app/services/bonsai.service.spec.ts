import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BonsaiService } from './bonsai.service';
import { ApiService } from './api.service';
import { of } from 'rxjs';
import { Bonsai, BonsaiDetail, BonsaiListResponse, CreateBonsaiRequest, UpdateBonsaiRequest } from '../models/bonsai.model';

describe('BonsaiService', () => {
  let service: BonsaiService;
  let apiService: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BonsaiService, ApiService]
    });
    service = TestBed.inject(BonsaiService);
    apiService = TestBed.inject(ApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getBonsaiList', () => {
    it('should get bonsai list without parameters', () => {
      // モックデータ
      const mockResponse: BonsaiListResponse = {
        items: [
          {
            id: 'bonsai1',
            userId: 'user1',
            name: '五葉松',
            species: '五葉松（Pinus parviflora）',
            registrationDate: '2025-01-15T00:00:00Z',
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
            imageUrls: ['https://example.com/images/bonsai2-1.jpg'],
            createdAt: '2025-02-10T09:00:00Z',
            updatedAt: '2025-02-10T09:00:00Z'
          }
        ],
        nextToken: undefined
      };

      // ApiServiceのgetメソッドをモック
      spyOn(apiService, 'get').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し
      service.getBonsaiList().subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.items.length).toBe(2);
        expect(response.items[0].name).toBe('五葉松');
        expect(response.nextToken).toBeUndefined();
      });

      // ApiServiceのgetメソッドが正しく呼び出されたことを確認
      expect(apiService.get).toHaveBeenCalledWith('bonsai', {});
    });

    it('should get bonsai list with limit parameter', () => {
      // モックデータ
      const mockResponse: BonsaiListResponse = {
        items: [
          {
            id: 'bonsai1',
            userId: 'user1',
            name: '五葉松',
            species: '五葉松（Pinus parviflora）',
            registrationDate: '2025-01-15T00:00:00Z',
            imageUrls: ['https://example.com/images/bonsai1-1.jpg'],
            createdAt: '2025-01-15T10:30:00Z',
            updatedAt: '2025-02-20T15:30:00Z'
          }
        ],
        nextToken: 'next-token'
      };

      // ApiServiceのgetメソッドをモック
      spyOn(apiService, 'get').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し（limit=1を指定）
      service.getBonsaiList(1).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.items.length).toBe(1);
        expect(response.nextToken).toBe('next-token');
      });

      // ApiServiceのgetメソッドが正しく呼び出されたことを確認
      expect(apiService.get).toHaveBeenCalledWith('bonsai', { limit: '1' });
    });

    it('should get bonsai list with nextToken parameter', () => {
      // モックデータ
      const mockResponse: BonsaiListResponse = {
        items: [
          {
            id: 'bonsai2',
            userId: 'user1',
            name: '真柏',
            species: '真柏（Juniperus chinensis）',
            registrationDate: '2025-02-10T00:00:00Z',
            imageUrls: ['https://example.com/images/bonsai2-1.jpg'],
            createdAt: '2025-02-10T09:00:00Z',
            updatedAt: '2025-02-10T09:00:00Z'
          }
        ],
        nextToken: undefined
      };

      // ApiServiceのgetメソッドをモック
      spyOn(apiService, 'get').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し（nextTokenを指定）
      const nextToken = 'test-next-token';
      service.getBonsaiList(undefined, nextToken).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.items.length).toBe(1);
        expect(response.items[0].name).toBe('真柏');
        expect(response.nextToken).toBeUndefined();
      });

      // ApiServiceのgetメソッドが正しく呼び出されたことを確認
      expect(apiService.get).toHaveBeenCalledWith('bonsai', { nextToken });
    });

    it('should get bonsai list with both limit and nextToken parameters', () => {
      // モックデータ
      const mockResponse: BonsaiListResponse = {
        items: [
          {
            id: 'bonsai2',
            userId: 'user1',
            name: '真柏',
            species: '真柏（Juniperus chinensis）',
            registrationDate: '2025-02-10T00:00:00Z',
            imageUrls: ['https://example.com/images/bonsai2-1.jpg'],
            createdAt: '2025-02-10T09:00:00Z',
            updatedAt: '2025-02-10T09:00:00Z'
          }
        ],
        nextToken: 'another-next-token'
      };

      // ApiServiceのgetメソッドをモック
      spyOn(apiService, 'get').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し（limitとnextTokenを指定）
      const limit = 1;
      const nextToken = 'test-next-token';
      service.getBonsaiList(limit, nextToken).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.items.length).toBe(1);
        expect(response.nextToken).toBe('another-next-token');
      });

      // ApiServiceのgetメソッドが正しく呼び出されたことを確認
      expect(apiService.get).toHaveBeenCalledWith('bonsai', { limit: '1', nextToken });
    });
  });

  describe('getBonsaiDetail', () => {
    it('should get bonsai detail', () => {
      // モックデータ
      const mockResponse: BonsaiDetail = {
        id: 'bonsai1',
        userId: 'user1',
        name: '五葉松',
        species: '五葉松（Pinus parviflora）',
        registrationDate: '2025-01-15T00:00:00Z',
        history: '2023年に購入',
        imageUrls: ['https://example.com/images/bonsai1-1.jpg'],
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-02-20T15:30:00Z',
        workRecords: [],
        workSchedules: [],
        recentWorks: [],
        upcomingWorks: []
      };

      // ApiServiceのgetメソッドをモック
      spyOn(apiService, 'get').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し
      const bonsaiId = 'bonsai1';
      service.getBonsaiDetail(bonsaiId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.id).toBe(bonsaiId);
        expect(response.name).toBe('五葉松');
        expect(response.history).toBe('2023年に購入');
      });

      // ApiServiceのgetメソッドが正しく呼び出されたことを確認
      expect(apiService.get).toHaveBeenCalledWith(`bonsai/${bonsaiId}`);
    });
  });

  describe('createBonsai', () => {
    it('should create bonsai', () => {
      // リクエストデータ
      const createRequest: CreateBonsaiRequest = {
        name: '黒松',
        species: '黒松（Pinus thunbergii）',
        registrationDate: '2025-03-09T00:00:00Z',
        history: '2025年に購入',
        imageUrls: ['https://example.com/images/new-bonsai.jpg']
      };

      // モックレスポンス
      const mockResponse: Bonsai = {
        id: 'new-bonsai-id',
        userId: 'user1',
        name: '黒松',
        species: '黒松（Pinus thunbergii）',
        registrationDate: '2025-03-09T00:00:00Z',
        history: '2025年に購入',
        imageUrls: ['https://example.com/images/new-bonsai.jpg'],
        createdAt: '2025-03-09T00:00:00Z',
        updatedAt: '2025-03-09T00:00:00Z'
      };

      // ApiServiceのpostメソッドをモック
      spyOn(apiService, 'post').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し
      service.createBonsai(createRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.id).toBe('new-bonsai-id');
        expect(response.name).toBe('黒松');
        expect(response.species).toBe('黒松（Pinus thunbergii）');
      });

      // ApiServiceのpostメソッドが正しく呼び出されたことを確認
      expect(apiService.post).toHaveBeenCalledWith('bonsai', createRequest);
    });
  });

  describe('updateBonsai', () => {
    it('should update bonsai', () => {
      // リクエストデータ
      const updateRequest: UpdateBonsaiRequest = {
        name: '五葉松（更新）',
        history: '2023年に購入、2025年に植え替え'
      };

      // モックレスポンス
      const mockResponse: Bonsai = {
        id: 'bonsai1',
        userId: 'user1',
        name: '五葉松（更新）',
        species: '五葉松（Pinus parviflora）',
        registrationDate: '2025-01-15T00:00:00Z',
        history: '2023年に購入、2025年に植え替え',
        imageUrls: ['https://example.com/images/bonsai1-1.jpg'],
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-03-09T00:00:00Z'
      };

      // ApiServiceのputメソッドをモック
      spyOn(apiService, 'put').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し
      const bonsaiId = 'bonsai1';
      service.updateBonsai(bonsaiId, updateRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.id).toBe(bonsaiId);
        expect(response.name).toBe('五葉松（更新）');
        expect(response.history).toBe('2023年に購入、2025年に植え替え');
        expect(response.species).toBe('五葉松（Pinus parviflora）'); // 更新されていない項目は元の値を保持
      });

      // ApiServiceのputメソッドが正しく呼び出されたことを確認
      expect(apiService.put).toHaveBeenCalledWith(`bonsai/${bonsaiId}`, updateRequest);
    });
  });

  describe('deleteBonsai', () => {
    it('should delete bonsai', () => {
      // モックレスポンス
      const mockResponse = {
        message: '盆栽が正常に削除されました',
        id: 'bonsai1'
      };

      // ApiServiceのdeleteメソッドをモック
      spyOn(apiService, 'delete').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し
      const bonsaiId = 'bonsai1';
      service.deleteBonsai(bonsaiId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.id).toBe(bonsaiId);
        expect(response.message).toBeTruthy();
      });

      // ApiServiceのdeleteメソッドが正しく呼び出されたことを確認
      expect(apiService.delete).toHaveBeenCalledWith(`bonsai/${bonsaiId}`);
    });
  });
});
