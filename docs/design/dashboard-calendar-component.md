# ダッシュボードカレンダーコンポーネント設計

このドキュメントでは、Bonsai App（盆栽管理アプリ）のダッシュボード画面に実装するカレンダーコンポーネントの設計を定義します。

## 目次

1. [概要](#概要)
2. [コンポーネント構成](#コンポーネント構成)
3. [データモデル](#データモデル)
4. [サービス設計](#サービス設計)
5. [UI設計](#ui設計)
6. [インタラクション設計](#インタラクション設計)

## 概要

ダッシュボード画面にカレンダーを配置し、作業予定と作業記録を視覚的にマッピングすることで、ユーザーが盆栽の管理状況を一目で把握できるようにします。カレンダーは月表示と週表示の切り替えが可能で、作業予定と作業記録を色分けして表示します。

## コンポーネント構成

### コンポーネント階層

```
DashboardComponent
└── CalendarComponent
```

### 必要なモジュール

```typescript
// app.module.ts
import { FullCalendarModule } from '@fullcalendar/angular';

@NgModule({
  imports: [
    // 他のモジュール
    FullCalendarModule
  ],
  // ...
})
export class AppModule { }
```

### カレンダーコンポーネント

```typescript
// calendar.component.ts
import { Component, OnInit } from '@angular/core';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Router } from '@angular/router';
import { CalendarDataService } from '../../services/calendar-data.service';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek'
    },
    events: [],
    eventClick: this.handleEventClick.bind(this),
    datesSet: this.handleDatesSet.bind(this),
    locale: 'ja',
    height: 'auto',
    firstDay: 0 // 日曜日始まり
  };

  constructor(
    private calendarDataService: CalendarDataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    this.loadCalendarData(startDate, endDate);
  }

  handleEventClick(arg: EventClickArg): void {
    const eventType = arg.event.extendedProps['type'];
    const originalId = arg.event.extendedProps['originalId'];
    
    if (eventType === 'schedule') {
      this.router.navigate(['/schedules', originalId]);
    } else if (eventType === 'record') {
      this.router.navigate(['/records', originalId]);
    }
  }

  handleDatesSet(dateInfo: any): void {
    this.loadCalendarData(dateInfo.start, dateInfo.end);
  }

  loadCalendarData(start: Date, end: Date): void {
    this.calendarDataService.getCalendarEvents(start, end)
      .subscribe(events => {
        this.calendarOptions.events = events;
      });
  }
}
```

```html
<!-- calendar.component.html -->
<div class="calendar-container">
  <full-calendar [options]="calendarOptions"></full-calendar>
</div>
```

```scss
/* calendar.component.scss */
.calendar-container {
  width: 100%;
  margin-bottom: 2rem;
  
  ::ng-deep {
    .fc-event {
      cursor: pointer;
      border-radius: 4px;
      padding: 2px 4px;
      font-size: 0.85rem;
    }
    
    .fc-day-today {
      background-color: rgba(0, 0, 0, 0.05);
    }
    
    .fc-toolbar-title {
      font-size: 1.25rem;
    }
  }
}
```

### ダッシュボードコンポーネントへの統合

```typescript
// dashboard.component.ts
import { Component, OnInit } from '@angular/core';
// 既存のインポート

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // 既存のプロパティとメソッド
}
```

```html
<!-- dashboard.component.html -->
<div class="dashboard-container">
  <div class="dashboard-header">
    <!-- ヘッダー内容 -->
  </div>

  <div *ngIf="error" class="alert alert-danger">{{ error }}</div>

  <div *ngIf="loading" class="loading-container">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">読み込み中...</span>
    </div>
    <p>データを読み込んでいます...</p>
  </div>

  <div *ngIf="!loading" class="dashboard-content">
    <!-- カレンダーセクションを追加 -->
    <div class="dashboard-section">
      <div class="section-header">
        <h2>カレンダー</h2>
      </div>
      <app-calendar></app-calendar>
    </div>

    <!-- 既存のセクション -->
    <div class="dashboard-section">
      <!-- 盆栽一覧セクション -->
    </div>

    <div class="dashboard-section">
      <!-- 最近の更新セクション -->
    </div>

    <div class="dashboard-section">
      <!-- クイックアクセスセクション -->
    </div>
  </div>
</div>
```

## データモデル

### カレンダーイベントモデル

```typescript
// calendar-event.model.ts
import { WorkType } from '../models/work-record.model';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  color: string;
  textColor: string;
  extendedProps: {
    type: 'schedule' | 'record';
    bonsaiId: string;
    workTypes: WorkType[];
    description: string;
    originalId: string;
  }
}
```

## サービス設計

### カレンダーデータサービス

```typescript
// calendar-data.service.ts
import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
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
      map(bonsaiList => {
        // 各盆栽のデータを取得するObservableの配列を作成
        const observables = bonsaiList.map(bonsai => 
          this.getBonsaiCalendarEvents(bonsai.id, start, end)
        );
        
        // 全てのObservableを並行して実行し、結果を結合
        return forkJoin(observables).pipe(
          map(results => {
            // 全ての結果を1つの配列にフラット化
            return results.reduce((acc, val) => acc.concat(val), []);
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
```

## UI設計

### カレンダーレイアウト

カレンダーコンポーネントは、ダッシュボード画面の上部に配置します。レイアウトは以下の通りです：

```
+-----------------------------------------------+
| カレンダーヘッダー                            |
| +-------+ +-------+ +-------------------+     |
| | < 前月 | | 今日  | | 月表示 | 週表示  |     |
| +-------+ +-------+ +-------------------+     |
+-----------------------------------------------+
|                                               |
|                                               |
|                                               |
|             カレンダー本体                    |
|                                               |
|                                               |
|                                               |
+-----------------------------------------------+
```

### カレンダーイベントの表示スタイル

カレンダーイベントは、以下のスタイルで表示します：

- **作業予定**：青系統の色（#4285F4）で表示
  - 背景色：作業タイプに応じた青の濃淡
  - テキスト色：白（#FFFFFF）
  - 枠線：なし
  - 角丸：4px

- **作業記録**：緑系統の色（#34A853）で表示
  - 背景色：作業タイプに応じた緑の濃淡
  - テキスト色：白（#FFFFFF）
  - 枠線：なし
  - 角丸：4px

## インタラクション設計

### 表示切り替え

- 月表示/週表示ボタンをクリックすると、カレンダーの表示モードが切り替わります。
- 前月/次月または前週/次週ボタンをクリックすると、カレンダーの表示期間が移動します。
- 今日ボタンをクリックすると、現在の月または週に移動します。

### イベントクリック

- カレンダー上のイベントをクリックすると、イベントの種類に応じて詳細画面に遷移します。
  - 作業予定の場合：作業予定詳細画面（/schedules/:id）に遷移
  - 作業記録の場合：作業記録詳細画面（/records/:id）に遷移
