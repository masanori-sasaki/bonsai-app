import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CalendarDataService } from './calendar-data.service';
import { WorkScheduleService } from './work-schedule.service';
import { WorkRecordService } from './work-record.service';
import { BonsaiService } from './bonsai.service';
import { WorkType } from '../models/work-record.model';

describe('CalendarDataService', () => {
  let service: CalendarDataService;
  let workScheduleServiceSpy: jasmine.SpyObj<WorkScheduleService>;
  let workRecordServiceSpy: jasmine.SpyObj<WorkRecordService>;
  let bonsaiServiceSpy: jasmine.SpyObj<BonsaiService>;

  beforeEach(() => {
    const workScheduleSpy = jasmine.createSpyObj('WorkScheduleService', ['getWorkScheduleList']);
    const workRecordSpy = jasmine.createSpyObj('WorkRecordService', ['getWorkRecordList']);
    const bonsaiSpy = jasmine.createSpyObj('BonsaiService', ['getBonsaiList']);

    TestBed.configureTestingModule({
      providers: [
        CalendarDataService,
        { provide: WorkScheduleService, useValue: workScheduleSpy },
        { provide: WorkRecordService, useValue: workRecordSpy },
        { provide: BonsaiService, useValue: bonsaiSpy }
      ]
    });

    service = TestBed.inject(CalendarDataService);
    workScheduleServiceSpy = TestBed.inject(WorkScheduleService) as jasmine.SpyObj<WorkScheduleService>;
    workRecordServiceSpy = TestBed.inject(WorkRecordService) as jasmine.SpyObj<WorkRecordService>;
    bonsaiServiceSpy = TestBed.inject(BonsaiService) as jasmine.SpyObj<BonsaiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCalendarEvents', () => {
    const startDate = new Date(2025, 2, 1);
    const endDate = new Date(2025, 2, 31);
    
    beforeEach(() => {
      // モックデータの設定
      bonsaiServiceSpy.getBonsaiList.and.returnValue(of({
        items: [
          { 
            id: 'bonsai1', 
            userId: 'user1',
            name: '松',
            species: '五葉松',
            registrationDate: '2025-01-15T00:00:00Z',
            imageUrls: ['https://example.com/images/bonsai1.jpg'],
            createdAt: '2025-01-15T10:30:00Z',
            updatedAt: '2025-02-20T15:30:00Z'
          },
          { 
            id: 'bonsai2', 
            userId: 'user1',
            name: '梅',
            species: '梅（Prunus mume）',
            registrationDate: '2025-02-10T00:00:00Z',
            imageUrls: ['https://example.com/images/bonsai2.jpg'],
            createdAt: '2025-02-10T09:00:00Z',
            updatedAt: '2025-02-10T09:00:00Z'
          }
        ],
        nextToken: undefined
      }));
      
      workScheduleServiceSpy.getWorkScheduleList.and.returnValue(of({
        items: [
          {
            id: 'schedule1',
            bonsaiId: 'bonsai1',
            scheduledDate: '2025-03-15T10:00:00',
            workTypes: ['pruning' as WorkType],
            description: '剪定予定',
            completed: false,
            createdAt: '2025-02-15T10:30:00Z',
            updatedAt: '2025-02-15T10:30:00Z',
            isAllDay: false,
            startTime: '10:00',
            endTime: '12:00',
            colorCode: '#1A73E8'
          }
        ],
        nextToken: undefined
      }));
      
      workRecordServiceSpy.getWorkRecordList.and.returnValue(of({
        items: [
          {
            id: 'record1',
            bonsaiId: 'bonsai1',
            date: '2025-03-10T09:00:00',
            workTypes: ['watering' as WorkType, 'fertilizing' as WorkType],
            description: '水やりと肥料の記録',
            imageUrls: ['https://example.com/images/record1.jpg'],
            createdAt: '2025-03-10T09:15:00Z',
            updatedAt: '2025-03-10T09:15:00Z',
            isAllDay: true,
            colorCode: '#0F9D58'
          }
        ],
        nextToken: undefined
      }));
    });

    it('should fetch calendar events for all bonsai', (done) => {
      service.getCalendarEvents(startDate, endDate).subscribe(events => {
        expect(events.length).toBe(2); // 2つのイベント（1つの予定と1つの記録）
        
        // 盆栽リストの取得が呼ばれたことを確認
        expect(bonsaiServiceSpy.getBonsaiList).toHaveBeenCalledWith(100);
        
        // 各盆栽の作業予定と作業記録の取得が呼ばれたことを確認
        expect(workScheduleServiceSpy.getWorkScheduleList).toHaveBeenCalledWith('bonsai1');
        expect(workScheduleServiceSpy.getWorkScheduleList).toHaveBeenCalledWith('bonsai2');
        expect(workRecordServiceSpy.getWorkRecordList).toHaveBeenCalledWith('bonsai1');
        expect(workRecordServiceSpy.getWorkRecordList).toHaveBeenCalledWith('bonsai2');
        
        // イベントの形式を確認
        const scheduleEvent = events.find(e => e.id === 'schedule-schedule1');
        expect(scheduleEvent).toBeTruthy();
        expect(scheduleEvent?.title).toContain('予定');
        expect(scheduleEvent?.extendedProps.type).toBe('schedule');
        
        const recordEvent = events.find(e => e.id === 'record-record1');
        expect(recordEvent).toBeTruthy();
        expect(recordEvent?.title).toContain('記録');
        expect(recordEvent?.extendedProps.type).toBe('record');
        
        done();
      });
    });

    it('should handle empty bonsai list', (done) => {
      bonsaiServiceSpy.getBonsaiList.and.returnValue(of({ items: [], nextToken: undefined }));
      
      service.getCalendarEvents(startDate, endDate).subscribe(events => {
        expect(events.length).toBe(0);
        expect(workScheduleServiceSpy.getWorkScheduleList).not.toHaveBeenCalled();
        expect(workRecordServiceSpy.getWorkRecordList).not.toHaveBeenCalled();
        done();
      });
    });

    it('should handle API errors gracefully', (done) => {
      bonsaiServiceSpy.getBonsaiList.and.returnValue(of({
        items: [{ 
          id: 'bonsai1', 
          userId: 'user1',
          name: '松',
          species: '五葉松',
          registrationDate: '2025-01-15T00:00:00Z',
          imageUrls: ['https://example.com/images/bonsai1.jpg'],
          createdAt: '2025-01-15T10:30:00Z',
          updatedAt: '2025-02-20T15:30:00Z'
        }],
        nextToken: undefined
      }));
      
      // 作業予定の取得でエラーが発生した場合
      workScheduleServiceSpy.getWorkScheduleList.and.throwError('API error');
      
      service.getCalendarEvents(startDate, endDate).subscribe(events => {
        // エラーが発生しても処理が続行され、空の配列が返されることを確認
        expect(events).toEqual([]);
        done();
      });
    });
  });
});
