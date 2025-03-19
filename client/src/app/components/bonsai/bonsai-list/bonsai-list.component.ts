import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BonsaiService } from '../../../services/bonsai.service';
import { Bonsai, BonsaiListResponse } from '../../../models/bonsai.model';

@Component({
  selector: 'app-bonsai-list',
  templateUrl: './bonsai-list.component.html',
  styleUrls: ['./bonsai-list.component.scss']
})
export class BonsaiListComponent implements OnInit {
  bonsaiList: Bonsai[] = [];
  loading = false;
  error = '';
  nextToken?: string;
  hasMore = false;

  constructor(
    private bonsaiService: BonsaiService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadBonsaiList();
  }

  /**
   * 盆栽一覧を読み込む
   */
  loadBonsaiList(): void {
    this.loading = true;
    this.bonsaiService.getBonsaiList(20, this.nextToken)
      .subscribe({
        next: (response: BonsaiListResponse) => {
          this.bonsaiList = [...this.bonsaiList, ...response.items];
          this.nextToken = response.nextToken;
          this.hasMore = !!response.nextToken;
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
   * もっと読み込むボタンのクリックハンドラ
   */
  onLoadMore(): void {
    if (this.hasMore && !this.loading) {
      this.loadBonsaiList();
    }
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
   * 盆栽削除
   * 
   * @param bonsaiId 盆栽ID
   * @param event イベント
   */
  deleteBonsai(bonsaiId: string, event: Event): void {
    event.stopPropagation();
    
    if (confirm('この盆栽を削除してもよろしいですか？')) {
      this.bonsaiService.deleteBonsai(bonsaiId)
        .subscribe({
          next: () => {
            this.bonsaiList = this.bonsaiList.filter(bonsai => bonsai.id !== bonsaiId);
          },
          error: (error) => {
            this.error = '盆栽の削除に失敗しました。';
            console.error('盆栽削除エラー:', error);
          }
        });
    }
  }

  /**
   * 作業タイプの表示名を取得
   * 
   * @param workType 作業タイプ
   * @returns 表示名
   */
  getWorkTypeLabel(workType: string): string {
    const workTypeLabels: Record<string, string> = {
      'pruning': '剪定',
      'repotting': '植替え',
      'watering': '水やり',
      'fertilizing': '肥料',
      'wire': '針金かけ',
      'wireremove': '針金はずし',
      'leafpull': '芽摘み',
      'leafcut': '芽切り',
      'leafpeel': '葉透かし',
      'disinfection': '消毒',
      'carving': '彫刻',
      'replant': '改作',
      'protection': '保護',
      'other': 'その他'
    };
    
    return workTypeLabels[workType] || workType;
  }
}
