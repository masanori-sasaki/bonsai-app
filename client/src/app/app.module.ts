import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// 認証関連コンポーネント
import { LoginComponent } from './components/auth/login/login.component';

// ダッシュボードコンポーネント
import { DashboardComponent } from './components/dashboard/dashboard/dashboard.component';

// 盆栽関連コンポーネント
import { BonsaiListComponent } from './components/bonsai/bonsai-list/bonsai-list.component';
import { BonsaiDetailComponent } from './components/bonsai/bonsai-detail/bonsai-detail.component';

// 作業記録関連コンポーネント
import { WorkRecordListComponent } from './components/work-record/work-record-list/work-record-list.component';
import { WorkRecordDetailComponent } from './components/work-record/work-record-detail/work-record-detail.component';

// 作業予定関連コンポーネント
import { WorkScheduleListComponent } from './components/work-schedule/work-schedule-list/work-schedule-list.component';
import { WorkScheduleDetailComponent } from './components/work-schedule/work-schedule-detail/work-schedule-detail.component';
import { WorkRecordFormComponent } from './components/work-record/work-record-form/work-record-form.component';
import { WorkScheduleFormComponent } from './components/work-schedule/work-schedule-form/work-schedule-form.component';

// カレンダーコンポーネント
import { CalendarComponent } from './components/calendar/calendar.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    BonsaiListComponent,
    BonsaiDetailComponent,
    WorkRecordListComponent,
    WorkRecordDetailComponent,
    WorkScheduleListComponent,
    WorkScheduleDetailComponent,
    WorkRecordFormComponent,
    WorkScheduleFormComponent,
    CalendarComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    FullCalendarModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
