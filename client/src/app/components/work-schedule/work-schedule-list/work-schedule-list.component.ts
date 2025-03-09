import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkScheduleService } from '../../../services/work-schedule.service';
import { BonsaiService } from '../../../services/bonsai.service';
import { WorkRecordService } from '../../../services/work-record.service';
import { WorkSchedule, WorkScheduleListResponse } from '../../../models/work-schedule.model';
import { WORK_TYPE_LABELS, WorkType } from '../../../models/work-record.model';
import { Bonsai } from '../../../models/bonsai.model';

@Component({
  selector: 'app-work-schedule-list',
  templateUrl: './work-schedule-list.component.html',
  styleUrls: ['./work-schedule-list.component.scss']
})
export class WorkScheduleListComponent implements OnInit {
  bonsaiId: string = '';
  bonsai?: Bonsai;
  workSchedules: WorkSchedule[] = [];
  loading = true;
  error = '';
  nextToken?: string;
  hasMore = false;
  workTypeLabels = WORK_TYPE_LABELS;
  showCompleted = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workScheduleService: WorkScheduleService,
    private workRecordService: WorkRecordService,
    private bonsaiService: BonsaiService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.bonsaiId = id;
        this.loadBonsaiDetail();
        this.loadWorkSchedules();
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
   * 作業予定一覧を読み込む
   */
  loadWorkSchedules(): void {
    if (!this.bonsaiId) {
      console.error('盆栽IDが指定されていません');
      this.error = '盆栽IDが指定されていません。';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.workScheduleService.getWorkScheduleList(
      this.bonsaiId,
      this.showCompleted,
      20,
      this.nextToken
    )
      .subscribe({
        next: (response: WorkScheduleListResponse) => {
          try {
            // レスポンスのitemsプロパティが存在し、配列であることを確認
            const items = response && response.items && Array.isArray(response.items) 
              ? response.items 
              : [];
            
            // スプレッド演算子を使わずに配列を結合
            if (items.length > 0) {
              for (const item of items) {
                this.workSchedules.push(item);
              }
            }
            
            this.nextToken = response?.nextToken;
            this.hasMore = !!this.nextToken;
          } catch (err) {
            console.error('レスポンス処理エラー:', err);
            this.error = 'データの処理中にエラーが発生しました。';
          } finally {
            this.loading = false;
          }
        },
        error: (error) => {
          this.error = '作業予定の取得に失敗しました。';
          console.error('作業予定取得エラー:', error);
          this.loading = false;
        }
      });
  }

  /**
   * 完了済みの表示切替
   */
  toggleShowCompleted(): void {
    this.showCompleted = !this.showCompleted;
    this.workSchedules = [];
    this.nextToken = undefined;
    this.loadWorkSchedules();
  }

  /**
   * もっと読み込むボタンのクリックハンドラ
   */
  onLoadMore(): void {
    if (this.hasMore && !this.loading) {
      this.loadWorkSchedules();
    }
  }

  /**
   * 作業予定の完了状態を切り替える
   * 
   * @param schedule 作業予定
   * @param event イベント
   */
  toggleCompleted(schedule: WorkSchedule, event: Event): void {
    event.stopPropagation();
    
    const updatedSchedule = {
      ...schedule,
      completed: !schedule.completed
    };
    
    this.workScheduleService.updateWorkSchedule(schedule.id, { completed: !schedule.completed })
      .subscribe({
        next: () => {
          // 更新成功
          schedule.completed = !schedule.completed;
          
          // 完了に変更された場合、作業記録作成の提案
          if (schedule.completed) {
            this.promptCreateWorkRecord(schedule);
          }
        },
        error: (error) => {
          this.error = '作業予定の更新に失敗しました。';
          console.error('作業予定更新エラー:', error);
        }
      });
  }

  /**
   * 作業記録作成の提案
   * 
   * @param schedule 作業予定
   */
  promptCreateWorkRecord(schedule: WorkSchedule): void {
    if (confirm('作業記録を作成しますか？')) {
      this.router.navigate(['/bonsai', this.bonsaiId, 'records', 'new'], {
        queryParams: {
          workType: schedule.workType,
          date: schedule.scheduledDate,
          description: schedule.description
        }
      });
    }
  }

  /**
   * 作業予定編集ページに遷移
   * 
   * @param scheduleId 作業予定ID
   */
  viewWorkSchedule(scheduleId: string): void {
    this.router.navigate(['/schedules', scheduleId, 'edit']);
  }

  /**
   * 作業予定作成ページに遷移
   */
  createWorkSchedule(): void {
    this.router.navigate(['/bonsai', this.bonsaiId, 'schedules', 'new']);
  }

  /**
   * 盆栽詳細ページに戻る
   */
  goBack(): void {
    this.router.navigate(['/bonsai', this.bonsaiId]);
  }

  /**
   * 作業予定削除
   * 
   * @param scheduleId 作業予定ID
   * @param event イベント
   */
  deleteWorkSchedule(scheduleId: string, event: Event): void {
    event.stopPropagation();
    
    if (confirm('この作業予定を削除してもよろしいですか？')) {
      this.workScheduleService.deleteWorkSchedule(scheduleId)
        .subscribe({
          next: () => {
            this.workSchedules = this.workSchedules.filter(schedule => schedule.id !== scheduleId);
          },
          error: (error) => {
            this.error = '作業予定の削除に失敗しました。';
            console.error('作業予定削除エラー:', error);
          }
        });
    }
  }
}
