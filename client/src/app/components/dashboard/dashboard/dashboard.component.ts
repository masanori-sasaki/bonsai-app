import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BonsaiService } from '../../../services/bonsai.service';
import { AuthService } from '../../../services/auth.service';
import { WorkRecordService } from '../../../services/work-record.service';
import { CalendarDataService } from '../../../services/calendar-data.service';
import { Bonsai, BonsaiListResponse } from '../../../models/bonsai.model';
import { User } from '../../../models/user.model';
import { BulkWateringDialogComponent } from '../../dialogs/bulk-watering-dialog/bulk-watering-dialog.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  user?: User;
  bonsaiList: Bonsai[] = [];
  recentBonsai: Bonsai[] = [];
  loading = true;
  error = '';

  constructor(
    private bonsaiService: BonsaiService,
    private authService: AuthService,
    private workRecordService: WorkRecordService,
    private calendarDataService: CalendarDataService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadBonsaiList();
  }

  /**
   * ユーザープロファイルを読み込む
   */
  loadUserProfile(): void {
    const authState = this.authService.getAuthState();
    if (authState.user) {
      this.user = authState.user;
    } else {
      this.authService.getProfile()
        .subscribe({
          next: (user: User) => {
            this.user = user;
          },
          error: (error) => {
            console.error('プロファイル取得エラー:', error);
          }
        });
    }
  }

  /**
   * 盆栽一覧を読み込む
   */
  loadBonsaiList(): void {
    this.loading = true;
    this.bonsaiService.getBonsaiList(10)
      .subscribe({
        next: (response: BonsaiListResponse) => {
          this.bonsaiList = response.items;
          this.recentBonsai = [...this.bonsaiList].sort((a, b) => {
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          }).slice(0, 5);
          this.loading = false;
        },
        error: (error) => {
          this.error = '盆栽一覧の取得に失敗しました。';
          console.error('盆栽一覧取得エラー:', error);
          this.loading = false;
        }
      });
  }

  /**
   * 盆栽一覧ページに遷移
   */
  viewAllBonsai(): void {
    this.router.navigate(['/bonsai']);
  }

  /**
   * 盆栽詳細ページに遷移
   * 
   * @param bonsaiId 盆栽ID
   */
  viewBonsaiDetail(bonsaiId: string): void {
    this.router.navigate(['/bonsai', bonsaiId]);
  }

  /**
   * 盆栽登録ページに遷移
   */
  createNewBonsai(): void {
    this.router.navigate(['/bonsai/new']);
  }

  /**
   * サインアウト
   */
  signOut(): void {
    this.authService.signOut();
  }

  /**
   * 一括水やりダイアログを表示
   */
  showBulkWateringDialog(): void {
    const dialogRef = this.dialog.open(BulkWateringDialogComponent, {
      width: '400px',
      data: {
        description: '一括水やり',
        date: new Date().toISOString()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createBulkWateringRecords(result);
      }
    });
  }

  /**
   * 一括水やり記録を作成
   * 
   * @param data 一括水やりデータ
   */
  createBulkWateringRecords(data: { description: string; date: string }): void {
    this.workRecordService.createBulkWateringRecords(data)
      .subscribe({
        next: (response) => {
          // 成功メッセージ表示
          this.snackBar.open(`${response.recordCount}件の盆栽に水やり記録を作成しました`, '閉じる', { duration: 3000 });
          
          // カレンダーデータの更新を通知
          this.calendarDataService.refreshCalendarData();
        },
        error: (error) => {
          console.error('一括水やり記録作成エラー:', error);
          // エラーメッセージ表示
          let errorMessage = '水やり記録の作成に失敗しました';
          
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          
          this.snackBar.open(errorMessage, '閉じる', { duration: 3000 });
        }
      });
  }
}
