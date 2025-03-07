import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkRecordService } from '../../../services/work-record.service';
import { BonsaiService } from '../../../services/bonsai.service';
import { WorkRecord, WORK_TYPE_LABELS } from '../../../models/work-record.model';
import { Bonsai } from '../../../models/bonsai.model';

@Component({
  selector: 'app-work-record-detail',
  templateUrl: './work-record-detail.component.html',
  styleUrls: ['./work-record-detail.component.scss']
})
export class WorkRecordDetailComponent implements OnInit {
  recordId: string = '';
  workRecord?: WorkRecord;
  bonsai?: Bonsai;
  loading = true;
  error = '';
  workTypeLabels = WORK_TYPE_LABELS;
  selectedImageIndex = 0;

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
        this.recordId = id;
        this.loadWorkRecordDetail();
      } else {
        this.error = '作業記録IDが指定されていません。';
        this.loading = false;
      }
    });
  }

  /**
   * 作業記録詳細を読み込む
   */
  loadWorkRecordDetail(): void {
    this.loading = true;
    this.workRecordService.getWorkRecordDetail(this.recordId)
      .subscribe({
        next: (record: WorkRecord) => {
          this.workRecord = record;
          this.loadBonsaiDetail(record.bonsaiId);
        },
        error: (error) => {
          this.error = '作業記録の取得に失敗しました。';
          console.error('作業記録詳細取得エラー:', error);
          this.loading = false;
        }
      });
  }

  /**
   * 盆栽詳細を読み込む
   * 
   * @param bonsaiId 盆栽ID
   */
  loadBonsaiDetail(bonsaiId: string): void {
    this.bonsaiService.getBonsaiDetail(bonsaiId)
      .subscribe({
        next: (bonsai: Bonsai) => {
          this.bonsai = bonsai;
          this.loading = false;
        },
        error: (error) => {
          this.error = '盆栽情報の取得に失敗しました。';
          console.error('盆栽詳細取得エラー:', error);
          this.loading = false;
        }
      });
  }

  /**
   * 作業記録編集ページに遷移
   */
  editWorkRecord(): void {
    this.router.navigate(['/records', this.recordId, 'edit']);
  }

  /**
   * 作業記録一覧ページに戻る
   */
  goBack(): void {
    if (this.workRecord && this.bonsai) {
      this.router.navigate(['/bonsai', this.workRecord.bonsaiId, 'records']);
    } else {
      this.router.navigate(['/bonsai']);
    }
  }

  /**
   * 盆栽詳細ページに遷移
   */
  viewBonsai(): void {
    if (this.workRecord) {
      this.router.navigate(['/bonsai', this.workRecord.bonsaiId]);
    }
  }

  /**
   * 作業記録を削除
   */
  deleteWorkRecord(): void {
    if (confirm('この作業記録を削除してもよろしいですか？')) {
      this.workRecordService.deleteWorkRecord(this.recordId)
        .subscribe({
          next: () => {
            if (this.workRecord) {
              this.router.navigate(['/bonsai', this.workRecord.bonsaiId, 'records']);
            } else {
              this.router.navigate(['/bonsai']);
            }
          },
          error: (error) => {
            this.error = '作業記録の削除に失敗しました。';
            console.error('作業記録削除エラー:', error);
          }
        });
    }
  }

  /**
   * 画像を選択
   * 
   * @param index 画像インデックス
   */
  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  /**
   * 前の画像に移動
   */
  prevImage(): void {
    if (this.workRecord && this.workRecord.imageUrls.length > 0) {
      this.selectedImageIndex = (this.selectedImageIndex - 1 + this.workRecord.imageUrls.length) % this.workRecord.imageUrls.length;
    }
  }

  /**
   * 次の画像に移動
   */
  nextImage(): void {
    if (this.workRecord && this.workRecord.imageUrls.length > 0) {
      this.selectedImageIndex = (this.selectedImageIndex + 1) % this.workRecord.imageUrls.length;
    }
  }
}
