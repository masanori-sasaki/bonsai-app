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
      right: 'dayGridMonth,dayGridWeek' // timeGridWeekからdayGridWeekに変更
    },
    events: [],
    eventClick: this.handleEventClick.bind(this),
    datesSet: this.handleDatesSet.bind(this),
    locale: 'ja',
    height: 'auto',
    firstDay: 0, // 日曜日始まり
    dayMaxEvents: 2, // 1日に表示する最大イベント数（これを超えると「+more」が表示される）
    moreLinkClick: 'day', // 「+more」クリック時の動作（dayビューに切り替え）
    fixedWeekCount: false, // 月によって週の数を可変にする
    eventTimeFormat: { // イベントの時間フォーマット
      hour: '2-digit',
      minute: '2-digit',
      meridiem: false
    },
    views: {
      dayGridWeek: {
        dayMaxEvents: 6, // 週表示で1日に表示する最大イベント数
        dayHeaderFormat: { // 曜日ヘッダーのフォーマット
          weekday: 'short',
          day: 'numeric',
          omitCommas: true
        }
      }
    }
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
