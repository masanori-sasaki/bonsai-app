import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkScheduleService } from '../../../services/work-schedule.service';
import { BonsaiService } from '../../../services/bonsai.service';
import { WorkSchedule } from '../../../models/work-schedule.model';
import { WORK_TYPE_LABELS } from '../../../models/work-record.model';
import { Bonsai } from '../../../models/bonsai.model';

@Component({
  selector: 'app-work-schedule-detail',
  templateUrl: './work-schedule-detail.component.html',
  styleUrls: ['./work-schedule-detail.component.scss']
})
export class WorkScheduleDetailComponent implements OnInit {
  scheduleId: string = '';
  workSchedule?: WorkSchedule;
  bonsai?: Bonsai;
  loading = true;
  error = '';
  workTypeLabels = WORK_TYPE_LABELS;

  // 繰り返しタイプの表示名マッピング
  recurrenceTypeLabels: Record<string, string> = {
    'none': '繰り返しなし',
    'daily': '毎日',
    'weekly': '毎週',
    'monthly': '毎月',
    'yearly': '毎年',
    'custom': 'カスタム'
  };

  // 優先度の表示名マッピング
  priorityLabels: Record<string, string> = {
    'high': '高',
    'medium': '中',
    'low': '低'
  };

  /**
   * 作業タイプのラベルを取得
   * 
   * @returns 作業タイプのラベル（複数の場合は結合）
   */
  getWorkTypeLabels(): string {
    if (!this.workSchedule || !this.workSchedule.workTypes || this.workSchedule.workTypes.length === 0) {
      return '作業';
    }
    
    return this.workSchedule.workTypes
      .map(type => this.workTypeLabels[type])
      .join('・');
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workScheduleService: WorkScheduleService,
    private bonsaiService: BonsaiService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.scheduleId = id;
        this.loadWorkScheduleDetail();
      } else {
        this.error = '作業予定IDが指定されていません。';
        this.loading = false;
      }
    });
  }

  /**
   * 作業予定詳細を読み込む
   */
  loadWorkScheduleDetail(): void {
    this.loading = true;
    this.workScheduleService.getWorkScheduleDetail(this.scheduleId)
      .subscribe({
        next: (schedule: WorkSchedule) => {
          this.workSchedule = schedule;
          this.loadBonsaiDetail(schedule.bonsaiId);
        },
        error: (error) => {
          this.error = '作業予定の取得に失敗しました。';
          console.error('作業予定詳細取得エラー:', error);
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
   * 作業予定編集ページに遷移
   */
  editWorkSchedule(): void {
    this.router.navigate(['/schedules', this.scheduleId, 'edit']);
  }

  /**
   * 作業予定一覧ページに戻る
   */
  goBack(): void {
    if (this.workSchedule && this.bonsai) {
      this.router.navigate(['/bonsai', this.workSchedule.bonsaiId, 'schedules']);
    } else {
      this.router.navigate(['/bonsai']);
    }
  }

  /**
   * 盆栽詳細ページに遷移
   */
  viewBonsai(): void {
    if (this.workSchedule) {
      this.router.navigate(['/bonsai', this.workSchedule.bonsaiId]);
    }
  }

  /**
   * 作業予定を削除
   */
  deleteWorkSchedule(): void {
    if (confirm('この作業予定を削除してもよろしいですか？')) {
      this.workScheduleService.deleteWorkSchedule(this.scheduleId)
        .subscribe({
          next: () => {
            if (this.workSchedule) {
              this.router.navigate(['/bonsai', this.workSchedule.bonsaiId, 'schedules']);
            } else {
              this.router.navigate(['/bonsai']);
            }
          },
          error: (error) => {
            this.error = '作業予定の削除に失敗しました。';
            console.error('作業予定削除エラー:', error);
          }
        });
    }
  }

  /**
   * 作業予定の完了状態を切り替える
   */
  toggleCompleted(): void {
    if (this.workSchedule) {
      // const updatedSchedule = {
      //   completed: !this.workSchedule.completed
      // };
       // 更新に必要なすべてのプロパティを含むオブジェクトを作成
       const updatedSchedule = {
        workTypes: this.workSchedule.workTypes,
        scheduledDate: this.workSchedule.scheduledDate,
        description: this.workSchedule.description,
        completed: !this.workSchedule.completed,
        // オプショナルなプロパティも含める
        startTime: this.workSchedule.startTime,
        endTime: this.workSchedule.endTime,
        isAllDay: this.workSchedule.isAllDay,
        priority: this.workSchedule.priority,
        colorCode: this.workSchedule.colorCode,
        recurrencePattern: this.workSchedule.recurrencePattern,
        reminderDays: this.workSchedule.reminderDays
      };

      this.workScheduleService.updateWorkSchedule(this.scheduleId, updatedSchedule)
        .subscribe({
          next: (schedule: WorkSchedule) => {
            this.workSchedule = schedule;
          },
          error: (error) => {
            this.error = '作業予定の更新に失敗しました。';
            console.error('作業予定更新エラー:', error);
          }
        });
    }
  }

  /**
   * 曜日を日本語表示に変換
   * 
   * @param weekDay 曜日番号（0=日曜, 1=月曜, ..., 6=土曜）
   * @returns 日本語の曜日名
   */
  getWeekDayName(weekDay: number): string {
    const weekDayNames = ['日', '月', '火', '水', '木', '金', '土'];
    return weekDayNames[weekDay] || '';
  }

  /**
   * 繰り返しパターンの説明文を生成
   * 
   * @returns 繰り返しパターンの説明文
   */
  getRecurrenceDescription(): string {
    if (!this.workSchedule?.recurrencePattern) {
      return '繰り返しなし';
    }

    const pattern = this.workSchedule.recurrencePattern;
    let description = '';

    switch (pattern.type) {
      case 'daily':
        description = pattern.interval > 1 ? `${pattern.interval}日ごと` : '毎日';
        break;
      case 'weekly':
        description = pattern.interval > 1 ? `${pattern.interval}週間ごと` : '毎週';
        if (pattern.weekDays && pattern.weekDays.length > 0) {
          const weekDays = pattern.weekDays.map(day => this.getWeekDayName(day)).join('・');
          description += `（${weekDays}曜日）`;
        }
        break;
      case 'monthly':
        description = pattern.interval > 1 ? `${pattern.interval}ヶ月ごと` : '毎月';
        if (pattern.monthDay) {
          description += `（${pattern.monthDay}日）`;
        }
        break;
      case 'yearly':
        description = pattern.interval > 1 ? `${pattern.interval}年ごと` : '毎年';
        break;
      case 'custom':
        description = 'カスタム繰り返し';
        break;
      default:
        description = '繰り返しなし';
    }

    if (pattern.endDate) {
      const endDate = new Date(pattern.endDate);
      description += `、${endDate.getFullYear()}年${endDate.getMonth() + 1}月${endDate.getDate()}日まで`;
    } else if (pattern.occurrences) {
      description += `、${pattern.occurrences}回まで`;
    }

    return description;
  }
}
