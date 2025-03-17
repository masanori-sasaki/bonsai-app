import { Component, OnInit, OnDestroy } from '@angular/core';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Router } from '@angular/router';
import { CalendarDataService } from '../../services/calendar-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit, OnDestroy {
  private refreshSubscription!: Subscription;
  private calendarApi: any;
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek' // timeGridWeekからdayGridWeekに変更
    },
    events: [],
    eventClick: this.handleEventClick.bind(this),
    datesSet: this.handleDatesSet.bind(this),
    locale: 'ja',
    height: 'auto',
    firstDay: 0, // 日曜日始まり
    buttonText: {
      today: '今日',
      month: '月',
      week: '週'
    },
    dayMaxEvents: true, // trueに設定すると、スペースに基づいて自動的に「+more」リンクを表示
    moreLinkClick: 'day', // 「+more」クリック時の動作（dayビューに切り替え）
    fixedWeekCount: false, // 月によって週の数を可変にする
    eventTimeFormat: { // イベントの時間フォーマット
      hour: '2-digit',
      minute: '2-digit',
      meridiem: false
    },
    views: {
      dayGridWeek: {
        dayMaxEvents: 15, // 週表示で1日に表示する最大イベント数を15個に増やす
        dayHeaderFormat: { // 曜日ヘッダーのフォーマット
          weekday: 'short',
          day: 'numeric',
          omitCommas: true
        }
      }
    },
    eventDidMount: this.handleEventDidMount.bind(this) // イベント要素がDOMに追加された時のコールバック
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
    
    // カレンダーデータの更新通知を購読
    this.refreshSubscription = this.calendarDataService.calendarRefresh$.subscribe(() => {
      // 現在表示中の日付範囲でカレンダーデータを再読み込み
      if (this.calendarApi) {
        const view = this.calendarApi.view;
        this.loadCalendarData(view.activeStart, view.activeEnd);
      }
    });
  }
  
  ngOnDestroy(): void {
    // コンポーネント破棄時にSubscriptionを解除
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
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
    // カレンダーAPIを保存
    this.calendarApi = dateInfo.view.calendar;
    this.loadCalendarData(dateInfo.start, dateInfo.end);
  }
  
  // イベント要素がDOMに追加された時のコールバック
  handleEventDidMount(info: any): void {
    // イベントの種類に基づいて境界線の色を設定
    const eventType = info.event.extendedProps.type;
    const eventEl = info.el;
    
    if (eventType === 'schedule') {
      // 作業予定の場合は境界線を少し暗く
      const bgColor = info.event.backgroundColor;
      eventEl.style.borderColor = this.darkenColor(bgColor, 15);
    } else if (eventType === 'record') {
      // 作業記録の場合は境界線を少し暗く
      const bgColor = info.event.backgroundColor;
      eventEl.style.borderColor = this.darkenColor(bgColor, 15);
    }
    
    // ツールチップを追加
    const workTypes = info.event.extendedProps.workTypes || [];
    const description = info.event.extendedProps.description || '';
    
    // ツールチップのHTMLを作成
    let tooltipContent = `<div style="font-weight: bold;">${info.event.title}</div>`;
    if (description) {
      tooltipContent += `<div>${description}</div>`;
    }
    
    // ツールチップを設定（title属性を使用）
    eventEl.title = this.stripHtml(tooltipContent);
  }
  
  // 色を暗くするヘルパーメソッド
  private darkenColor(color: string, percent: number): string {
    // #で始まる場合は#を削除
    color = color.replace('#', '');
    
    // 16進数の色コードをRGB値に変換
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    
    // 各色成分を指定されたパーセンテージだけ暗くする
    const darkenR = Math.max(0, Math.floor(r * (100 - percent) / 100));
    const darkenG = Math.max(0, Math.floor(g * (100 - percent) / 100));
    const darkenB = Math.max(0, Math.floor(b * (100 - percent) / 100));
    
    // RGB値を16進数の色コードに戻す
    return `#${this.componentToHex(darkenR)}${this.componentToHex(darkenG)}${this.componentToHex(darkenB)}`;
  }
  
  // 数値を16進数に変換するヘルパーメソッド
  private componentToHex(c: number): string {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }
  
  // HTMLタグを削除するヘルパーメソッド（ツールチップ用）
  private stripHtml(html: string): string {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  loadCalendarData(start: Date, end: Date): void {
    this.calendarDataService.getCalendarEvents(start, end)
      .subscribe(events => {
        this.calendarOptions.events = events;
      });
  }
}
