import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { WorkScheduleService } from './work-schedule.service';
import { WorkRecordService } from './work-record.service';
import { BonsaiService } from './bonsai.service';
import { WorkSchedule } from '../models/work-schedule.model';
import { WorkRecord, WorkType, WORK_TYPE_LABELS } from '../models/work-record.model';
import { CalendarEvent } from '../models/calendar-event.model';

@Injectable({
  providedIn: 'root'
})
export class CalendarDataService {
  // 作業タイプごとの色マッピング
  private readonly scheduleColors: Record<WorkType, string> = {
    pruning: '#4285F4',
    repotting: '#5C9CFF',
    watering: '#7EB5FF',
    fertilizing: '#A1C9FF',
    wire: '#C4DDFF',
    wireremove: '#D6E6FF',
    leafpull: '#4285F4',
    leafcut: '#5C9CFF',
    leafpeel: '#7EB5FF',
    disinfection: '#A1C9FF',
    carving: '#C4DDFF',
    replant: '#D6E6FF',
    protection: '#E8F1FF',
    other: '#F0F5FF'
  };
  
  private readonly recordColors: Record<WorkType, string> = {
    pruning: '#34A853',
    repotting: '#5ABF77',
    watering: '#7FD69A',
    fertilizing: '#A5EDBD',
    wire: '#CAFEE0',
    wireremove: '#E0FFE9',
    leafpull: '#34A853',
    leafcut: '#5ABF77',
    leafpeel: '#7FD69A',
    disinfection: '#A5EDBD',
    carving: '#CAFEE0',
    replant: '#E0FFE9',
    protection: '#F0FFF5',
    other: '#F8FFFC'
  };

  constructor(
    private workScheduleService: WorkScheduleService,
    private workRecordService: WorkRecordService,
    private bonsaiService: BonsaiService
  ) {}

  getCalendarEvents(start: Date, end: Date): Observable<CalendarEvent[]> {
    // 全ての盆栽を取得
    return this.bonsaiService.getBonsaiList(100).pipe(
      map(response => response.items),
      catchError(error => {
        console.error('盆栽一覧取得エラー:', error);
        return of([]);
      }),
      switchMap((bonsaiList: any[]) => {
        if (bonsaiList.length === 0) {
          return of([]);
        }
        
        // 各盆栽のデータを取得するObservableの配列を作成
        const observables = bonsaiList.map((bonsai: any) => 
          this.getBonsaiCalendarEvents(bonsai.id, start, end)
        );
        
        // 全てのObservableを並行して実行し、結果を結合
        return forkJoin(observables).pipe(
          map((results: CalendarEvent[][]) => {
            // 全ての結果を1つの配列にフラット化
            return results.reduce((acc: CalendarEvent[], val: CalendarEvent[]) => acc.concat(val), []);
          }),
          catchError(error => {
            console.error('カレンダーデータ取得エラー:', error);
            return of([]);
          })
        );
      }),
      catchError(error => {
        console.error('カレンダーデータ処理エラー:', error);
        return of([]);
      })
    );
  }

  private getBonsaiCalendarEvents(bonsaiId: string, start: Date, end: Date): Observable<CalendarEvent[]> {
    // 作業予定と作業記録を並行して取得
    return forkJoin([
      this.getScheduleEvents(bonsaiId, start, end),
      this.getRecordEvents(bonsaiId, start, end)
    ]).pipe(
      map(([scheduleEvents, recordEvents]) => {
        // 作業予定と作業記録のイベントを結合
        return [...scheduleEvents, ...recordEvents];
      })
    );
  }

  private getScheduleEvents(bonsaiId: string, start: Date, end: Date): Observable<CalendarEvent[]> {
    // 作業予定を取得してカレンダーイベントに変換
    return this.workScheduleService.getWorkScheduleList(bonsaiId).pipe(
      map(response => {
        return response.items
          .filter(schedule => {
            // 表示範囲内のスケジュールのみフィルタリング
            const scheduleDate = new Date(schedule.scheduledDate);
            return scheduleDate >= start && scheduleDate <= end;
          })
          .map(schedule => this.convertScheduleToEvent(schedule));
      })
    );
  }

  private getRecordEvents(bonsaiId: string, start: Date, end: Date): Observable<CalendarEvent[]> {
    // 作業記録を取得してカレンダーイベントに変換
    return this.workRecordService.getWorkRecordList(bonsaiId).pipe(
      map(response => {
        return response.items
          .filter(record => {
            // 表示範囲内の記録のみフィルタリング
            const recordDate = new Date(record.date);
            return recordDate >= start && recordDate <= end;
          })
          .map(record => this.convertRecordToEvent(record));
      })
    );
  }

  private convertScheduleToEvent(schedule: WorkSchedule): CalendarEvent {
    // 作業予定をカレンダーイベントに変換
    const primaryWorkType = schedule.workTypes[0] || 'other';
    const color = this.scheduleColors[primaryWorkType] || '#4285F4';
    
    return {
      id: `schedule-${schedule.id}`,
      title: this.getEventTitle(schedule.workTypes, '予定'),
      start: schedule.scheduledDate,
      end: schedule.endTime ? `${schedule.scheduledDate.split('T')[0]}T${schedule.endTime}` : undefined,
      allDay: schedule.isAllDay !== undefined ? schedule.isAllDay : true,
      color: schedule.colorCode || color,
      textColor: '#FFFFFF',
      extendedProps: {
        type: 'schedule',
        bonsaiId: schedule.bonsaiId,
        workTypes: schedule.workTypes,
        description: schedule.description,
        originalId: schedule.id
      }
    };
  }

  private convertRecordToEvent(record: WorkRecord): CalendarEvent {
    // 作業記録をカレンダーイベントに変換
    const primaryWorkType = record.workTypes[0] || 'other';
    const color = this.recordColors[primaryWorkType] || '#34A853';
    
    return {
      id: `record-${record.id}`,
      title: this.getEventTitle(record.workTypes, '記録'),
      start: record.date,
      end: record.endTime ? `${record.date.split('T')[0]}T${record.endTime}` : undefined,
      allDay: record.isAllDay !== undefined ? record.isAllDay : true,
      color: record.colorCode || color,
      textColor: '#FFFFFF',
      extendedProps: {
        type: 'record',
        bonsaiId: record.bonsaiId,
        workTypes: record.workTypes,
        description: record.description,
        originalId: record.id
      }
    };
  }

  private getEventTitle(workTypes: WorkType[], suffix: string): string {
    if (workTypes.length === 0) {
      return `その他 ${suffix}`;
    }
    
    const workTypeLabel = WORK_TYPE_LABELS[workTypes[0]];
    return workTypes.length > 1 
      ? `${workTypeLabel}他 ${suffix}`
      : `${workTypeLabel} ${suffix}`;
  }
}
