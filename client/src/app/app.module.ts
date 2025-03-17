import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';

// Angular Material
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule } from '@angular/material/snack-bar';

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

// 月次レポート関連コンポーネント
import { MonthlyReportListComponent } from './components/monthly-report/monthly-report-list/monthly-report-list.component';
import { MonthlyReportDetailComponent } from './components/monthly-report/monthly-report-detail/monthly-report-detail.component';

// ダイアログコンポーネント
import { BulkWateringDialogComponent } from './components/dialogs/bulk-watering-dialog/bulk-watering-dialog.component';

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
    CalendarComponent,
    MonthlyReportListComponent,
    MonthlyReportDetailComponent,
    BulkWateringDialogComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    FullCalendarModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
