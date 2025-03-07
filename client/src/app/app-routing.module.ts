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
import { WorkScheduleListComponent } from './components/work-schedule/work-schedule-list/work-schedule-list.component';

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
    path: 'records/:id', 
    component: WorkRecordDetailComponent,
    canActivate: [AuthGuard]
  },
  
  // 作業予定関連
  { 
    path: 'bonsai/:id/schedules', 
    component: WorkScheduleListComponent,
    canActivate: [AuthGuard]
  },
  
  // デフォルトルート
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  
  // ワイルドカードルート
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
