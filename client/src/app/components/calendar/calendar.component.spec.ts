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
      end: new Date(2025, 2, 31)
    };

    calendarDataServiceSpy.getCalendarEvents.calls.reset();
    component.handleDatesSet(mockDateInfo);
    expect(calendarDataServiceSpy.getCalendarEvents).toHaveBeenCalledWith(mockDateInfo.start, mockDateInfo.end);
  });
});
