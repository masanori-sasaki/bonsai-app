import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkRecordService } from '../../../services/work-record.service';
import { BonsaiService } from '../../../services/bonsai.service';
import { WorkRecord, WorkRecordListResponse, WORK_TYPE_LABELS, WorkType } from '../../../models/work-record.model';
import { Bonsai } from '../../../models/bonsai.model';

@Component({
  selector: 'app-work-record-list',
  templateUrl: './work-record-list.component.html',
  styleUrls: ['./work-record-list.component.scss']
})
export class WorkRecordListComponent implements OnInit {
  bonsaiId: string = '';
  bonsai?: Bonsai;
  workRecords: WorkRecord[] = [];
  loading = true;
  error = '';
  nextToken?: string;
  hasMore = false;
  workTypeLabels = WORK_TYPE_LABELS;
  selectedWorkType?: WorkType;
  workTypes: { value: WorkType | '', label: string }[] = [
    { value: '', label: 'すべて' },
    { value: 'pruning', label: '剪定' },
    { value: 'repotting', label: '植替え' },
    { value: 'watering', label: '水やり' },
    { value: 'fertilizing', label: '肥料' },
    { value: 'other', label: 'その他' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workRecordService: WorkRecordService,
    private bonsaiService: BonsaiService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.bonsaiId = id;
        this.loadBonsaiDetail();
        this.loadWorkRecords();
      } else {
        this.error = '盆栽IDが指定されていません。';
        this.loading = false;
      }
    });
  }

  /**
   * 盆栽詳細を読み込む
   */
  loadBonsaiDetail(): void {
    this.bonsaiService.getBonsaiDetail(this.bonsaiId)
      .subscribe({
        next: (bonsai: Bonsai) => {
          this.bonsai = bonsai;
        },
        error: (error) => {
          this.error = '盆栽情報の取得に失敗しました。';
          console.error('盆栽詳細取得エラー:', error);
        }
      });
  }

  /**
   * 作業記録一覧を読み込む
   */
  loadWorkRecords(): void {
    this.loading = true;
    this.workRecordService.getWorkRecordList(
      this.bonsaiId,
      this.selectedWorkType,
      20,
      this.nextToken
    )
      .subscribe({
        next: (response: WorkRecordListResponse) => {
          this.workRecords = [...this.workRecords, ...response.items];
          this.nextToken = response.nextToken;
          this.hasMore = !!response.nextToken;
          this.loading = false;
        },
        error: (error) => {
          this.error = '作業記録の取得に失敗しました。';
          console.error('作業記録取得エラー:', error);
          this.loading = false;
        }
      });
  }

  /**
   * 作業タイプでフィルタリング
   * 
   * @param workType 作業タイプ
   */
  filterByWorkType(workType: WorkType | ''): void {
    this.selectedWorkType = workType || undefined;
    this.workRecords = [];
    this.nextToken = undefined;
    this.loadWorkRecords();
  }

  /**
   * もっと読み込むボタンのクリックハンドラ
   */
  onLoadMore(): void {
    if (this.hasMore && !this.loading) {
      this.loadWorkRecords();
    }
  }

  /**
   * 作業記録詳細ページに遷移
   * 
   * @param recordId 作業記録ID
   */
  viewWorkRecord(recordId: string): void {
    this.router.navigate(['/records', recordId]);
  }

  /**
   * 作業記録作成ページに遷移
   */
  createWorkRecord(): void {
    this.router.navigate(['/bonsai', this.bonsaiId, 'records', 'new']);
  }

  /**
   * 盆栽詳細ページに戻る
   */
  goBack(): void {
    this.router.navigate(['/bonsai', this.bonsaiId]);
  }

  /**
   * 作業記録削除
   * 
   * @param recordId 作業記録ID
   * @param event イベント
   */
  deleteWorkRecord(recordId: string, event: Event): void {
    event.stopPropagation();
    
    if (confirm('この作業記録を削除してもよろしいですか？')) {
      this.workRecordService.deleteWorkRecord(recordId)
        .subscribe({
          next: () => {
            this.workRecords = this.workRecords.filter(record => record.id !== recordId);
          },
          error: (error) => {
            this.error = '作業記録の削除に失敗しました。';
            console.error('作業記録削除エラー:', error);
          }
        });
    }
  }
}
