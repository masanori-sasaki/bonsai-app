import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BonsaiService } from '../../../services/bonsai.service';
import { AuthService } from '../../../services/auth.service';
import { Bonsai, BonsaiListResponse } from '../../../models/bonsai.model';
import { User } from '../../../models/user.model';

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
    private router: Router
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
}
