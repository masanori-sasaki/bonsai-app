import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FullCalendarModule } from '@fullcalendar/angular';
import { of } from 'rxjs';
import { CalendarComponent } from './calendar.component';
import { CalendarDataService } from '../../services/calendar-data.service';
import { Router } from '@angular/router';

describe('CalendarComponent', () => {
  let component: CalendarComponent;
  let fixture: ComponentFixture<CalendarComponent>;
  let calendarDataServiceSpy: jasmine.SpyObj<CalendarDataService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const calendarDataSpy = jasmine.createSpyObj('CalendarDataService', ['getCalendarEvents']);
    // calendarRefresh$プロパティを追加
    calendarDataSpy.calendarRefresh$ = of();
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        FullCalendarModule
      ],
      declarations: [
        CalendarComponent
      ],
      providers: [
        { provide: CalendarDataService, useValue: calendarDataSpy },
        { provide: Router, useValue: routerSpyObj }
      ]
    }).compileComponents();

    calendarDataServiceSpy = TestBed.inject(CalendarDataService) as jasmine.SpyObj<CalendarDataService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    calendarDataServiceSpy.getCalendarEvents.and.returnValue(of([]));
    fixture = TestBed.createComponent(CalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load calendar data on init', () => {
    expect(calendarDataServiceSpy.getCalendarEvents).toHaveBeenCalled();
  });

  it('should navigate to schedule detail when schedule event is clicked', () => {
    // モックイベントクリック引数を作成
    const mockEventArg = {
      event: {
        extendedProps: {
          type: 'schedule',
          originalId: '123'
        }
      }
    } as any;

    component.handleEventClick(mockEventArg);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/schedules', '123']);
  });

  it('should navigate to record detail when record event is clicked', () => {
    // モックイベントクリック引数を作成
    const mockEventArg = {
      event: {
        extendedProps: {
          type: 'record',
          originalId: '456'
        }
      }
    } as any;

    component.handleEventClick(mockEventArg);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/records', '456']);
  });

  it('should reload calendar data when dates change', () => {
    const mockDateInfo = {
      start: new Date(2025, 2, 1),
      end: new Date(2025, 2, 31),
      view: {
        calendar: {}
      }
    };

    calendarDataServiceSpy.getCalendarEvents.calls.reset();
    component.handleDatesSet(mockDateInfo);
    expect(calendarDataServiceSpy.getCalendarEvents).toHaveBeenCalledWith(mockDateInfo.start, mockDateInfo.end);
  });

  it('should properly handle event did mount callback', () => {
    // モックイベント情報を作成
    const mockEventInfo = {
      event: {
        backgroundColor: '#4285F4',
        title: 'テストイベント',
        extendedProps: {
          type: 'schedule',
          workTypes: ['pruning'],
          description: 'テスト説明'
        }
      },
      el: document.createElement('div')
    };

    // スパイを設定
    spyOn(component as any, 'darkenColor').and.returnValue('#3367d6');
    spyOn(component as any, 'stripHtml').and.returnValue('テストイベント テスト説明');

    // イベントマウントハンドラを呼び出し
    component.handleEventDidMount(mockEventInfo);

    // 境界線の色が設定されることを確認
    expect(mockEventInfo.el.style.borderColor).toBe('rgb(51, 103, 214)');
    
    // ツールチップが設定されることを確認
    expect(mockEventInfo.el.title).toBe('テストイベント テスト説明');
    
    // darkenColorメソッドが呼び出されることを確認
    expect((component as any).darkenColor).toHaveBeenCalledWith('#4285F4', 15);
  });

  it('should darken color correctly', () => {
    // プライベートメソッドをテスト - thisコンテキストを保持するためにbindを使用
    const darkenColor = (component as any).darkenColor.bind(component);
    
    // 色を暗くする
    expect(darkenColor('#FF0000', 20)).toBe('#cc0000'); // 赤を20%暗く
    expect(darkenColor('#00FF00', 50)).toBe('#007f00'); // 緑を50%暗く
    expect(darkenColor('#0000FF', 10)).toBe('#0000e5'); // 青を10%暗く
  });

  it('should convert component to hex correctly', () => {
    // プライベートメソッドをテスト - thisコンテキストを保持するためにbindを使用
    const componentToHex = (component as any).componentToHex.bind(component);
    
    // 数値を16進数に変換
    expect(componentToHex(0)).toBe('00');
    expect(componentToHex(255)).toBe('ff');
    expect(componentToHex(10)).toBe('0a');
  });

  it('should strip HTML correctly', () => {
    // プライベートメソッドをテスト - thisコンテキストを保持するためにbindを使用
    const stripHtml = (component as any).stripHtml.bind(component);
    
    // HTMLタグを削除
    expect(stripHtml('<div>テスト</div>')).toBe('テスト');
    expect(stripHtml('<strong>太字</strong>と<em>斜体</em>')).toBe('太字と斜体');
  });
});
