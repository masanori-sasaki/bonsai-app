import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

// コンポーネントのインポート
import { LoginComponent } from './components/auth/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard/dashboard.component';
import { BonsaiListComponent } from './components/bonsai/bonsai-list/bonsai-list.component';
import { BonsaiDetailComponent } from './components/bonsai/bonsai-detail/bonsai-detail.component';
import { WorkRecordListComponent } from './components/work-record/work-record-list/work-record-list.component';
import { WorkRecordDetailComponent } from './components/work-record/work-record-detail/work-record-detail.component';
import { WorkRecordFormComponent } from './components/work-record/work-record-form/work-record-form.component';
import { WorkScheduleListComponent } from './components/work-schedule/work-schedule-list/work-schedule-list.component';
import { WorkScheduleFormComponent } from './components/work-schedule/work-schedule-form/work-schedule-form.component';
import { WorkScheduleDetailComponent } from './components/work-schedule/work-schedule-detail/work-schedule-detail.component';
import { MonthlyReportListComponent } from './components/monthly-report/monthly-report-list/monthly-report-list.component';
import { MonthlyReportDetailComponent } from './components/monthly-report/monthly-report-detail/monthly-report-detail.component';
import { EmptyComponent } from './components/shared/empty/empty.component';

const routes: Routes = [
  // 認証関連
  { path: 'auth/login', component: LoginComponent },
  
  // ダッシュボード
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  
  // 盆栽関連
  { 
    path: 'bonsai', 
    component: BonsaiListComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'bonsai/:id', 
    component: BonsaiDetailComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'bonsai/:id/edit', 
    component: BonsaiDetailComponent,
    canActivate: [AuthGuard]
  },
  
  // 作業記録関連
  { 
    path: 'bonsai/:id/records', 
    component: WorkRecordListComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'bonsai/:id/records/new', 
    component: WorkRecordFormComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'records/:id', 
    component: WorkRecordDetailComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'records/:recordId/edit', 
    component: WorkRecordFormComponent,
    canActivate: [AuthGuard]
  },
  
  // 作業予定関連
  { 
    path: 'bonsai/:id/schedules', 
    component: WorkScheduleListComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'bonsai/:id/schedules/new', 
    component: WorkScheduleFormComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'schedules/:id', 
    component: WorkScheduleDetailComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'schedules/:scheduleId/edit', 
    component: WorkScheduleFormComponent,
    canActivate: [AuthGuard]
  },
  
  // 月次レポート関連
  { 
    path: 'reports', 
    component: MonthlyReportListComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'reports/:year/:month', 
    component: MonthlyReportDetailComponent,
    canActivate: [AuthGuard]
  },
  
  // デフォルトルート
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  
// 画像パスは除外（CloudFrontからの画像アクセス用）
{ path: 'images/**', component: EmptyComponent },

// ワイルドカードルート
{ path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
