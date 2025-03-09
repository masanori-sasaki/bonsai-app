import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkScheduleService } from '../../../services/work-schedule.service';
import { BonsaiService } from '../../../services/bonsai.service';
import { 
  WorkSchedule, 
  RecurrenceType,
  RecurrencePattern
} from '../../../models/work-schedule.model';
import { 
  WorkType, 
  WORK_TYPE_LABELS,
  PriorityType
} from '../../../models/work-record.model';
import { BonsaiDetail } from '../../../models/bonsai.model';

@Component({
  selector: 'app-work-schedule-form',
  templateUrl: './work-schedule-form.component.html',
  styleUrls: ['./work-schedule-form.component.scss']
})
export class WorkScheduleFormComponent implements OnInit {
  scheduleForm!: FormGroup;
  recurrenceForm!: FormGroup;
  bonsaiId: string = '';
  scheduleId: string = '';
  bonsai?: BonsaiDetail;
  workSchedule?: WorkSchedule;
  isEditMode = false;
  loading = true;
  saving = false;
  error = '';
  workTypeLabels = WORK_TYPE_LABELS;
  workTypes: WorkType[] = ['pruning', 'repotting', 'watering', 'fertilizing', 'other'];
  
  // カレンダー機能のための拡張プロパティ
  isAllDay = true;
  priorities = [
    { value: 'high', label: '高' },
    { value: 'medium', label: '中' },
    { value: 'low', label: '低' }
  ];
  
  // 繰り返しパターン
  recurrenceTypes: { value: RecurrenceType, label: string }[] = [
    { value: 'none', label: 'なし' },
    { value: 'daily', label: '毎日' },
    { value: 'weekly', label: '毎週' },
    { value: 'monthly', label: '毎月' },
    { value: 'yearly', label: '毎年' },
    { value: 'custom', label: 'カスタム' }
  ];
  showRecurrenceOptions = false;
  
  // リマインダー
  reminderOptions = [
    { value: 0, label: 'なし' },
    { value: 0, label: '当日' },
    { value: 1, label: '1日前' },
    { value: 3, label: '3日前' },
    { value: 7, label: '1週間前' },
    { value: -1, label: 'カスタム' }
  ];
  showCustomReminder = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private workScheduleService: WorkScheduleService,
    private bonsaiService: BonsaiService
  ) { }

  ngOnInit(): void {
    this.initForm();
    
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      const scheduleId = params.get('scheduleId');
      
      if (id) {
        this.bonsaiId = id;
        this.loadBonsaiDetail();
      }
      
      if (scheduleId && scheduleId !== 'new') {
        this.scheduleId = scheduleId;
        this.isEditMode = true;
        this.loadWorkScheduleDetail();
      } else {
        this.isEditMode = false;
        this.loading = false;
        
        // URLクエリパラメータから初期値を設定
        this.route.queryParams.subscribe(params => {
          if (params['workType']) {
            this.scheduleForm.get('workType')?.setValue(params['workType']);
          }
          
          if (params['scheduledDate']) {
            this.scheduleForm.get('scheduledDate')?.setValue(this.formatDateForInput(params['scheduledDate']));
          }
          
          if (params['description']) {
            this.scheduleForm.get('description')?.setValue(params['description']);
          }
        });
      }
    });
  }

  /**
   * フォームの初期化
   */
  initForm(): void {
    // 今日から1週間後の日付をデフォルトに
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    const formattedDate = this.formatDateForInput(defaultDate.toISOString());
    
    this.scheduleForm = this.fb.group({
      workType: ['pruning', Validators.required],
      scheduledDate: [formattedDate, Validators.required],
      startTime: ['09:00'],
      endTime: ['10:00'],
      description: ['', Validators.required],
      priority: ['medium'],
      recurrenceType: ['none'],
      reminderDays: [0]
    });
    
    this.recurrenceForm = this.fb.group({
      interval: [1, [Validators.required, Validators.min(1)]],
      endDate: [''],
      occurrences: [10, [Validators.min(1)]],
      weekDays: [[]],
      monthDay: [1, [Validators.min(1), Validators.max(31)]]
    });
    
    // 繰り返しタイプの変更を監視
    this.scheduleForm.get('recurrenceType')?.valueChanges.subscribe(value => {
      this.showRecurrenceOptions = value !== 'none';
    });
    
    // リマインダーの変更を監視
    this.scheduleForm.get('reminderDays')?.valueChanges.subscribe(value => {
      this.showCustomReminder = value === -1;
    });
    
    // 終日イベントフラグの変更を監視
    this.scheduleForm.get('startTime')?.valueChanges.subscribe(value => {
      if (value && this.isAllDay) {
        this.isAllDay = false;
      }
    });
    
    this.scheduleForm.get('endTime')?.valueChanges.subscribe(value => {
      if (value && this.isAllDay) {
        this.isAllDay = false;
      }
    });
  }

  /**
   * 盆栽詳細を読み込む
   */
  loadBonsaiDetail(): void {
    this.bonsaiService.getBonsaiDetail(this.bonsaiId)
      .subscribe({
        next: (bonsai: BonsaiDetail) => {
          this.bonsai = bonsai;
          if (!this.isEditMode) {
            this.loading = false;
          }
        },
        error: (error) => {
          this.error = '盆栽情報の取得に失敗しました。';
          console.error('盆栽詳細取得エラー:', error);
          this.loading = false;
        }
      });
  }

  /**
   * 作業予定詳細を読み込む（編集モード）
   */
  loadWorkScheduleDetail(): void {
    this.workScheduleService.getWorkScheduleDetail(this.scheduleId)
      .subscribe({
        next: (schedule: WorkSchedule) => {
          this.workSchedule = schedule;
          this.populateForm(schedule);
          this.loading = false;
        },
        error: (error) => {
          this.error = '作業予定の取得に失敗しました。';
          console.error('作業予定詳細取得エラー:', error);
          this.loading = false;
        }
      });
  }

  /**
   * フォームに作業予定データを設定（編集モード）
   * 
   * @param schedule 作業予定
   */
  populateForm(schedule: WorkSchedule): void {
    // フォームに値を設定
    this.scheduleForm.patchValue({
      workType: schedule.workType,
      scheduledDate: this.formatDateForInput(schedule.scheduledDate),
      description: schedule.description,
      // カレンダー拡張プロパティ（存在する場合）
      startTime: schedule.startTime || '',
      endTime: schedule.endTime || '',
      priority: schedule.priority || 'medium',
      reminderDays: schedule.reminderDays !== undefined ? schedule.reminderDays : 0
    });
    
    // 繰り返しパターンを設定
    if (schedule.recurrencePattern) {
      this.scheduleForm.get('recurrenceType')?.setValue(schedule.recurrencePattern.type);
      this.showRecurrenceOptions = schedule.recurrencePattern.type !== 'none';
      
      this.recurrenceForm.patchValue({
        interval: schedule.recurrencePattern.interval,
        endDate: schedule.recurrencePattern.endDate ? this.formatDateForInput(schedule.recurrencePattern.endDate) : '',
        occurrences: schedule.recurrencePattern.occurrences || 10,
        weekDays: schedule.recurrencePattern.weekDays || [],
        monthDay: schedule.recurrencePattern.monthDay || 1
      });
    } else {
      this.scheduleForm.get('recurrenceType')?.setValue('none');
      this.showRecurrenceOptions = false;
    }
    
    // リマインダー設定
    if (schedule.reminderDays !== undefined) {
      const standardReminder = this.reminderOptions.find(r => r.value === schedule.reminderDays);
      if (standardReminder) {
        this.scheduleForm.get('reminderDays')?.setValue(standardReminder.value);
        this.showCustomReminder = false;
      } else {
        this.scheduleForm.get('reminderDays')?.setValue(-1);
        this.showCustomReminder = true;
      }
    }
    
    // 終日イベントフラグを設定
    this.isAllDay = schedule.isAllDay !== undefined ? schedule.isAllDay : true;
  }

  /**
   * ISO日付文字列をinput[type="date"]用にフォーマット
   * 
   * @param isoDateString ISO 8601形式の日付文字列
   * @returns YYYY-MM-DD形式の日付文字列
   */
  formatDateForInput(isoDateString: string): string {
    const date = new Date(isoDateString);
    return date.toISOString().split('T')[0];
  }

  /**
   * 終日イベントフラグを切り替える
   */
  toggleAllDay(): void {
    this.isAllDay = !this.isAllDay;
    
    if (this.isAllDay) {
      // 終日イベントの場合は時間をクリア
      this.scheduleForm.get('startTime')?.setValue('');
      this.scheduleForm.get('endTime')?.setValue('');
    } else {
      // 終日イベントでない場合はデフォルト時間を設定
      this.scheduleForm.get('startTime')?.setValue('09:00');
      this.scheduleForm.get('endTime')?.setValue('10:00');
    }
  }

  /**
   * 作業予定を保存
   */
  saveWorkSchedule(): void {
    if (this.scheduleForm.invalid) {
      // フォームが無効な場合は処理を中止
      this.markFormGroupTouched(this.scheduleForm);
      return;
    }
    
    this.saving = true;
    this.error = '';
    
    // フォームから値を取得
    const formValues = this.scheduleForm.value;
    
    // 日付をISO形式に変換
    const dateObj = new Date(formValues.scheduledDate);
    let isoDate = dateObj.toISOString();
    
    // 時間情報を追加（終日イベントでない場合）
    let startTime = '';
    let endTime = '';
    if (!this.isAllDay && formValues.startTime) {
      startTime = formValues.startTime;
      const [startHours, startMinutes] = formValues.startTime.split(':');
      dateObj.setHours(parseInt(startHours, 10), parseInt(startMinutes, 10));
      isoDate = dateObj.toISOString();
    }
    
    if (!this.isAllDay && formValues.endTime) {
      endTime = formValues.endTime;
    }
    
    // 繰り返しパターンを作成
    let recurrencePattern: RecurrencePattern | undefined;
    if (formValues.recurrenceType !== 'none') {
      const recurrenceValues = this.recurrenceForm.value;
      recurrencePattern = {
        type: formValues.recurrenceType,
        interval: recurrenceValues.interval,
        endDate: recurrenceValues.endDate ? new Date(recurrenceValues.endDate).toISOString() : undefined,
        occurrences: recurrenceValues.occurrences,
        weekDays: recurrenceValues.weekDays,
        monthDay: recurrenceValues.monthDay
      };
    }
    
    // リマインダー日数を設定
    let reminderDays: number | undefined;
    if (formValues.reminderDays !== 0) {
      reminderDays = formValues.reminderDays;
    }
    
    // 作業予定データを作成
    const workScheduleData: any = {
      bonsaiId: this.bonsaiId,
      workType: formValues.workType,
      scheduledDate: isoDate,
      description: formValues.description,
      completed: this.workSchedule?.completed || false,
      // カレンダー拡張プロパティ
      isAllDay: this.isAllDay,
      priority: formValues.priority as PriorityType,
      reminderDays: reminderDays
    };
    
    // 時間情報を追加（終日イベントでない場合）
    if (!this.isAllDay) {
      workScheduleData.startTime = startTime;
      workScheduleData.endTime = endTime;
    }
    
    // 繰り返しパターンを追加（設定されている場合）
    if (recurrencePattern) {
      workScheduleData.recurrencePattern = recurrencePattern;
    }
    
    // 新規作成の場合
    if (!this.isEditMode) {
      this.workScheduleService.createWorkSchedule(this.bonsaiId, workScheduleData)
        .subscribe({
          next: (createdSchedule) => {
            this.saving = false;
            // 作業予定一覧ページに遷移
            this.router.navigate(['/bonsai', this.bonsaiId, 'schedules']);
          },
          error: (error) => {
            this.saving = false;
            this.error = '作業予定の作成に失敗しました。';
            console.error('作業予定作成エラー:', error);
          }
        });
    } else {
      // 更新の場合
      this.workScheduleService.updateWorkSchedule(this.scheduleId, workScheduleData)
        .subscribe({
          next: (updatedSchedule) => {
            this.saving = false;
            // 作業予定一覧ページに遷移
            this.router.navigate(['/bonsai', this.bonsaiId, 'schedules']);
          },
          error: (error) => {
            this.saving = false;
            this.error = '作業予定の更新に失敗しました。';
            console.error('作業予定更新エラー:', error);
          }
        });
    }
  }

  /**
   * フォームグループのすべてのコントロールをタッチ済みにする（バリデーションエラー表示のため）
   * 
   * @param formGroup フォームグループ
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if ((control as FormGroup).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  /**
   * 曜日選択の変更イベントを処理
   * 
   * @param event 変更イベント
   * @param dayIndex 曜日のインデックス（0=日曜, 1=月曜, ..., 6=土曜）
   */
  onWeekDayChange(event: Event, dayIndex: number): void {
    const checkbox = event.target as HTMLInputElement;
    const weekDays = this.recurrenceForm.get('weekDays')?.value as number[] || [];
    
    if (checkbox.checked) {
      // チェックされた場合、曜日を追加
      if (!weekDays.includes(dayIndex)) {
        weekDays.push(dayIndex);
      }
    } else {
      // チェックが外れた場合、曜日を削除
      const index = weekDays.indexOf(dayIndex);
      if (index !== -1) {
        weekDays.splice(index, 1);
      }
    }
    
    // フォームの値を更新
    this.recurrenceForm.get('weekDays')?.setValue(weekDays);
  }

  /**
   * 指定された曜日が選択されているかどうかを確認
   * 
   * @param dayIndex 曜日のインデックス（0=日曜, 1=月曜, ..., 6=土曜）
   * @returns 選択されている場合はtrue、そうでない場合はfalse
   */
  isWeekDaySelected(dayIndex: number): boolean {
    const weekDays = this.recurrenceForm.get('weekDays')?.value as number[] || [];
    return weekDays.includes(dayIndex);
  }

  /**
   * キャンセルして前の画面に戻る
   */
  cancel(): void {
    // 盆栽詳細ページに戻る
    this.router.navigate(['/bonsai', this.bonsaiId]);
  }
}
