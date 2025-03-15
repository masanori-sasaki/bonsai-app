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
  // 作業タイプごとの色マッピング（視認性向上のため色を濃くしました）
  private readonly scheduleColors: Record<WorkType, string> = {
    pruning: '#1A73E8',     // より濃いブルー
    repotting: '#4285F4',   // 標準的なブルー
    watering: '#5C9CFF',    // やや薄いブルー
    fertilizing: '#7EB5FF', // 薄いブルー
    wire: '#3C78D8',        // 濃いブルー
    wireremove: '#5B8BE8',  // やや濃いブルー
    leafpull: '#1967D2',    // 濃いブルー
    leafcut: '#4D90FE',     // 標準的なブルー
    leafpeel: '#3B78E7',    // やや濃いブルー
    disinfection: '#2A56C6', // 濃いブルー
    carving: '#3D5AFE',     // 鮮やかなブルー
    replant: '#5677FC',     // 標準的なブルー
    protection: '#4A6FE3',  // やや濃いブルー
    other: '#6889F7'        // 薄めのブルー
  };
  
  private readonly recordColors: Record<WorkType, string> = {
    pruning: '#0F9D58',     // より濃いグリーン
    repotting: '#34A853',   // 標準的なグリーン
    watering: '#5ABF77',    // やや薄いグリーン
    fertilizing: '#7FD69A', // 薄いグリーン
    wire: '#137333',        // 濃いグリーン
    wireremove: '#1E8E3E',  // やや濃いグリーン
    leafpull: '#0C7C42',    // 濃いグリーン
    leafcut: '#30B05D',     // 標準的なグリーン
    leafpeel: '#1AA260',    // やや濃いグリーン
    disinfection: '#188038', // 濃いグリーン
    carving: '#1B9E77',     // 鮮やかなグリーン
    replant: '#43A047',     // 標準的なグリーン
    protection: '#2E7D32',  // やや濃いグリーン
    other: '#66BB6A'        // 薄めのグリーン
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
      textColor: '#FFFFFF', // 常に白テキスト
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
      textColor: '#FFFFFF', // 常に白テキスト
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

  // 注: getTextColorForBackgroundメソッドは削除しました（常に白テキストを使用するため）
}
