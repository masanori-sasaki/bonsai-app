import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { WorkScheduleService } from './work-schedule.service';
import { ApiService } from './api.service';
import { of } from 'rxjs';
import { 
  WorkSchedule, 
  WorkScheduleListResponse, 
  CreateWorkScheduleRequest, 
  UpdateWorkScheduleRequest,
  RecurrencePattern
} from '../models/work-schedule.model';
import { WorkType, PriorityType } from '../models/work-record.model';

describe('WorkScheduleService', () => {
  let service: WorkScheduleService;
  let apiService: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WorkScheduleService, ApiService]
    });
    service = TestBed.inject(WorkScheduleService);
    apiService = TestBed.inject(ApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getWorkScheduleList', () => {
    it('should get work schedule list without optional parameters', () => {
      // モックデータ
      const mockResponse: WorkScheduleListResponse = {
        items: [
          {
            id: 'schedule1',
            bonsaiId: 'bonsai1',
            workTypes: ['pruning' as WorkType],
            scheduledDate: '2025-04-15T10:00:00Z',
            description: '剪定予定',
            completed: false,
            createdAt: '2025-02-15T10:30:00Z',
            updatedAt: '2025-02-15T10:30:00Z',
            startTime: '10:00',
            endTime: '12:00',
            isAllDay: false,
            priority: 'high' as PriorityType,
            colorCode: '#1A73E8'
          },
          {
            id: 'schedule2',
            bonsaiId: 'bonsai1',
            workTypes: ['watering' as WorkType, 'fertilizing' as WorkType],
            scheduledDate: '2025-03-20T09:00:00Z',
            description: '水やりと肥料予定',
            completed: true,
            createdAt: '2025-02-10T09:15:00Z',
            updatedAt: '2025-03-20T09:30:00Z',
            isAllDay: true
          }
        ],
        nextToken: undefined
      };

      // ApiServiceのgetメソッドをモック
      spyOn(apiService, 'get').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し
      const bonsaiId = 'bonsai1';
      service.getWorkScheduleList(bonsaiId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.items.length).toBe(2);
        expect(response.items[0].workTypes[0]).toBe('pruning');
        expect(response.items[1].completed).toBeTrue();
        expect(response.items[1].workTypes.length).toBe(2);
        expect(response.nextToken).toBeUndefined();
      });

      // ApiServiceのgetメソッドが正しく呼び出されたことを確認
      expect(apiService.get).toHaveBeenCalledWith(`bonsai/${bonsaiId}/schedules`, {});
    });

    it('should get work schedule list with completed filter', () => {
      // モックデータ
      const mockResponse: WorkScheduleListResponse = {
        items: [
          {
            id: 'schedule2',
            bonsaiId: 'bonsai1',
            workTypes: ['watering' as WorkType],
            scheduledDate: '2025-03-20T09:00:00Z',
            description: '水やり予定',
            completed: true,
            createdAt: '2025-02-10T09:15:00Z',
            updatedAt: '2025-03-20T09:30:00Z'
          }
        ],
        nextToken: undefined
      };

      // ApiServiceのgetメソッドをモック
      spyOn(apiService, 'get').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し（completedを指定）
      const bonsaiId = 'bonsai1';
      const completed = true;
      service.getWorkScheduleList(bonsaiId, completed).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.items.length).toBe(1);
        expect(response.items[0].completed).toBeTrue();
      });

      // ApiServiceのgetメソッドが正しく呼び出されたことを確認
      expect(apiService.get).toHaveBeenCalledWith(`bonsai/${bonsaiId}/schedules`, { completed: 'true' });
    });

    it('should get work schedule list with limit and nextToken parameters', () => {
      // モックデータ
      const mockResponse: WorkScheduleListResponse = {
        items: [
          {
            id: 'schedule1',
            bonsaiId: 'bonsai1',
            workTypes: ['pruning' as WorkType],
            scheduledDate: '2025-04-15T10:00:00Z',
            description: '剪定予定',
            completed: false,
            createdAt: '2025-02-15T10:30:00Z',
            updatedAt: '2025-02-15T10:30:00Z'
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
      service.getWorkScheduleList(bonsaiId, undefined, limit, nextToken).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.items.length).toBe(1);
        expect(response.nextToken).toBe('next-token');
      });

      // ApiServiceのgetメソッドが正しく呼び出されたことを確認
      expect(apiService.get).toHaveBeenCalledWith(`bonsai/${bonsaiId}/schedules`, { 
        limit: '1', 
        nextToken 
      });
    });
  });

  describe('getWorkScheduleDetail', () => {
    it('should get work schedule detail', () => {
      // モックデータ
      const mockResponse: WorkSchedule = {
        id: 'schedule1',
        bonsaiId: 'bonsai1',
        workTypes: ['pruning' as WorkType],
        scheduledDate: '2025-04-15T10:00:00Z',
        description: '剪定予定。上部の枝を中心に整える。',
        completed: false,
        createdAt: '2025-02-15T10:30:00Z',
        updatedAt: '2025-02-15T10:30:00Z'
      };

      // ApiServiceのgetメソッドをモック
      spyOn(apiService, 'get').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し
      const scheduleId = 'schedule1';
      service.getWorkScheduleDetail(scheduleId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.id).toBe(scheduleId);
        expect(response.workTypes[0]).toBe('pruning');
        expect(response.description).toContain('剪定予定');
        expect(response.completed).toBeFalse();
      });

      // ApiServiceのgetメソッドが正しく呼び出されたことを確認
      expect(apiService.get).toHaveBeenCalledWith(`schedules/${scheduleId}`);
    });
  });

  describe('createWorkSchedule', () => {
    it('should create work schedule', () => {
      // リクエストデータ
      const createRequest: CreateWorkScheduleRequest = {
        bonsaiId: 'bonsai1',
        workTypes: ['repotting' as WorkType],
        scheduledDate: '2025-05-10T11:00:00Z',
        description: '植え替え予定',
        completed: false
      };

      // モックレスポンス
      const mockResponse: WorkSchedule = {
        id: 'new-schedule-id',
        bonsaiId: 'bonsai1',
        workTypes: ['repotting' as WorkType],
        scheduledDate: '2025-05-10T11:00:00Z',
        description: '植え替え予定',
        completed: false,
        createdAt: '2025-03-09T11:15:00Z',
        updatedAt: '2025-03-09T11:15:00Z'
      };

      // ApiServiceのpostメソッドをモック
      spyOn(apiService, 'post').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し
      const bonsaiId = 'bonsai1';
      service.createWorkSchedule(bonsaiId, createRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.id).toBe('new-schedule-id');
        expect(response.bonsaiId).toBe(bonsaiId);
        expect(response.workTypes[0]).toBe('repotting');
        expect(response.description).toBe('植え替え予定');
        expect(response.completed).toBeFalse();
      });

      // ApiServiceのpostメソッドが正しく呼び出されたことを確認
      expect(apiService.post).toHaveBeenCalledWith(`bonsai/${bonsaiId}/schedules`, createRequest);
    });
  });

  describe('updateWorkSchedule', () => {
    it('should update work schedule', () => {
      // リクエストデータ
      const updateRequest: UpdateWorkScheduleRequest = {
        workTypes: ['pruning' as WorkType, 'wire' as WorkType],
        description: '剪定予定。上部の枝を中心に整える。必要に応じて針金を使用。',
        completed: true
      };

      // モックレスポンス
      const mockResponse: WorkSchedule = {
        id: 'schedule1',
        bonsaiId: 'bonsai1',
        workTypes: ['pruning' as WorkType, 'wire' as WorkType],
        scheduledDate: '2025-04-15T10:00:00Z',
        description: '剪定予定。上部の枝を中心に整える。必要に応じて針金を使用。',
        completed: true,
        createdAt: '2025-02-15T10:30:00Z',
        updatedAt: '2025-03-09T11:30:00Z'
      };

      // ApiServiceのputメソッドをモック
      spyOn(apiService, 'put').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し
      const scheduleId = 'schedule1';
      service.updateWorkSchedule(scheduleId, updateRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.id).toBe(scheduleId);
        expect(response.description).toContain('針金を使用');
        expect(response.completed).toBeTrue();
        expect(response.updatedAt).not.toBe(response.createdAt);
      });

      // ApiServiceのputメソッドが正しく呼び出されたことを確認
      expect(apiService.put).toHaveBeenCalledWith(`schedules/${scheduleId}`, updateRequest);
    });
  });

  describe('deleteWorkSchedule', () => {
    it('should delete work schedule', () => {
      // モックレスポンス
      const mockResponse = {
        message: '作業予定が正常に削除されました',
        id: 'schedule1'
      };

      // ApiServiceのdeleteメソッドをモック
      spyOn(apiService, 'delete').and.returnValue(of(mockResponse));

      // サービスメソッドを呼び出し
      const scheduleId = 'schedule1';
      service.deleteWorkSchedule(scheduleId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.id).toBe(scheduleId);
        expect(response.message).toBeTruthy();
      });

      // ApiServiceのdeleteメソッドが正しく呼び出されたことを確認
      expect(apiService.delete).toHaveBeenCalledWith(`schedules/${scheduleId}`);
    });
  });
});
