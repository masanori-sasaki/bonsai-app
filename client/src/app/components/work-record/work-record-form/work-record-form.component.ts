import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkRecordService } from '../../../services/work-record.service';
import { BonsaiService } from '../../../services/bonsai.service';
import { ImageUploadService } from '../../../services/image-upload.service';
import { 
  WorkRecord, 
  WorkType, 
  WORK_TYPE_LABELS 
} from '../../../models/work-record.model';
import { BonsaiDetail } from '../../../models/bonsai.model';

@Component({
  selector: 'app-work-record-form',
  templateUrl: './work-record-form.component.html',
  styleUrls: ['./work-record-form.component.scss']
})
export class WorkRecordFormComponent implements OnInit {
  recordForm!: FormGroup;
  bonsaiId: string = '';
  recordId: string = '';
  bonsai?: BonsaiDetail;
  workRecord?: WorkRecord;
  isEditMode = false;
  loading = true;
  saving = false;
  error = '';
  workTypeLabels = WORK_TYPE_LABELS;
  workTypes: WorkType[] = ['pruning', 'repotting', 'watering', 'fertilizing', 'other'];
  
  // 画像アップロード関連のプロパティ
  imageFiles: File[] = [];
  imagePreviewUrls: string[] = [];
  uploadError: string | null = null;
  isUploading = false;
  
  // カレンダー機能のための拡張プロパティ
  isAllDay = true;
  priorities = [
    { value: 'high', label: '高' },
    { value: 'medium', label: '中' },
    { value: 'low', label: '低' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private workRecordService: WorkRecordService,
    private bonsaiService: BonsaiService,
    private imageUploadService: ImageUploadService
  ) { }

  ngOnInit(): void {
    this.initForm();
    
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      const recordId = params.get('recordId');
      
      if (id) {
        this.bonsaiId = id;
        this.loadBonsaiDetail();
      }
      
      if (recordId && recordId !== 'new') {
        this.recordId = recordId;
        this.isEditMode = true;
        this.loadWorkRecordDetail();
      } else {
        this.isEditMode = false;
        this.loading = false;
        
        // URLクエリパラメータから初期値を設定（作業予定から作業記録を作成する場合など）
        this.route.queryParams.subscribe(params => {
          if (params['workType']) {
            this.recordForm.get('workType')?.setValue(params['workType']);
          }
          
          if (params['date']) {
            this.recordForm.get('date')?.setValue(this.formatDateForInput(params['date']));
          }
          
          if (params['description']) {
            this.recordForm.get('description')?.setValue(params['description']);
          }
        });
      }
    });
  }

  /**
   * フォームの初期化
   */
  initForm(): void {
    const today = new Date();
    const formattedDate = this.formatDateForInput(today.toISOString());
    
    this.recordForm = this.fb.group({
      workType: ['pruning', Validators.required],
      date: [formattedDate, Validators.required],
      startTime: ['09:00'],
      endTime: ['10:00'],
      description: ['', Validators.required],
      priority: ['medium']
    });
    
    // 終日イベントフラグの変更を監視
    this.recordForm.get('startTime')?.valueChanges.subscribe(value => {
      if (value && this.isAllDay) {
        this.isAllDay = false;
      }
    });
    
    this.recordForm.get('endTime')?.valueChanges.subscribe(value => {
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
   * 作業記録詳細を読み込む（編集モード）
   */
  loadWorkRecordDetail(): void {
    this.workRecordService.getWorkRecordDetail(this.recordId)
      .subscribe({
        next: (record: WorkRecord) => {
          this.workRecord = record;
          this.populateForm(record);
          this.loading = false;
        },
        error: (error) => {
          this.error = '作業記録の取得に失敗しました。';
          console.error('作業記録詳細取得エラー:', error);
          this.loading = false;
        }
      });
  }

  /**
   * フォームに作業記録データを設定（編集モード）
   * 
   * @param record 作業記録
   */
  populateForm(record: WorkRecord): void {
    // 既存の画像URLをプレビューに設定
    this.imagePreviewUrls = [...record.imageUrls];
    
    // フォームに値を設定
    this.recordForm.patchValue({
      workType: record.workType,
      date: this.formatDateForInput(record.date),
      description: record.description,
      // カレンダー拡張プロパティ（存在する場合）
      startTime: record.startTime || '',
      endTime: record.endTime || '',
      priority: record.priority || 'medium'
    });
    
    // 終日イベントフラグを設定
    this.isAllDay = record.isAllDay !== undefined ? record.isAllDay : true;
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
   * 画像選択時の処理
   * 
   * @param event 画像選択イベント
   */
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        
        // ファイルサイズチェック（非常に大きなファイルのみ制限）
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_FILE_SIZE) {
          this.uploadError = `ファイルサイズが大きすぎます（最大${MAX_FILE_SIZE / (1024 * 1024)}MB）。より小さいファイルを選択してください。`;
          continue;
        }
        
        // ファイル形式チェック
        if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
          this.uploadError = 'サポートされていない画像形式です（JPG、PNG、GIF、WebP形式のみ）';
          continue;
        }
        
        this.imageFiles.push(file);
        this.uploadError = null;
        
        // 大きなファイルの場合は注意メッセージを表示
        if (file.size > 2 * 1024 * 1024) {
          console.log(`大きなファイル（${(file.size / (1024 * 1024)).toFixed(2)}MB）が選択されました。アップロード時に自動的に圧縮されます。`);
        }
        
        // プレビュー表示
        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreviewUrls.push(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  /**
   * 画像削除
   * 
   * @param index 削除する画像のインデックス
   */
  removeImage(index: number): void {
    // プレビューURLと対応するファイルを削除
    this.imagePreviewUrls.splice(index, 1);
    
    // 新しく追加されたファイルの場合はimageFilesからも削除
    if (index < this.imageFiles.length) {
      this.imageFiles.splice(index, 1);
    }
  }

  /**
   * 作業記録を保存
   */
  saveWorkRecord(): void {
    if (this.recordForm.invalid) {
      // フォームが無効な場合は処理を中止
      this.markFormGroupTouched(this.recordForm);
      return;
    }
    
    this.saving = true;
    this.error = '';
    
    // フォームから値を取得
    const formValues = this.recordForm.value;
    
    // 日付をISO形式に変換
    const dateObj = new Date(formValues.date);
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
    
    // 画像がある場合はアップロード
    if (this.imageFiles.length > 0) {
      this.isUploading = true;
      this.uploadImages().then(imageUrls => {
        // 既存の画像URL（編集モードの場合）と新しくアップロードした画像URLを結合
        const allImageUrls = [
          ...(this.workRecord?.imageUrls || []).slice(0, this.imagePreviewUrls.length - this.imageFiles.length),
          ...imageUrls
        ];
        
        this.proceedWithSave(isoDate, formValues, allImageUrls, startTime, endTime);
      }).catch(error => {
        this.isUploading = false;
        this.saving = false;
        this.error = '画像のアップロードに失敗しました: ' + error.message;
        console.error('画像アップロードエラー:', error);
      });
    } else {
      // 画像がない場合は直接保存
      const imageUrls = this.isEditMode ? this.workRecord?.imageUrls || [] : [];
      this.proceedWithSave(isoDate, formValues, imageUrls, startTime, endTime);
    }
  }

  /**
   * 複数画像をアップロード
   * 
   * @returns アップロードされた画像URLの配列（Promise）
   */
  async uploadImages(): Promise<string[]> {
    const uploadPromises = this.imageFiles.map(file => {
      return new Promise<string>((resolve, reject) => {
        this.imageUploadService.uploadImage(file).subscribe({
          next: (imageUrl) => resolve(imageUrl),
          error: (error) => reject(error)
        });
      });
    });
    
    return Promise.all(uploadPromises);
  }

  /**
   * 実際の保存処理
   * 
   * @param isoDate ISO形式の日付
   * @param formValues フォームの値
   * @param imageUrls 画像URL配列
   * @param startTime 開始時間（オプション）
   * @param endTime 終了時間（オプション）
   */
  private proceedWithSave(
    isoDate: string, 
    formValues: any, 
    imageUrls: string[],
    startTime: string,
    endTime: string
  ): void {
    // 作業記録データを作成
    const workRecordData: any = {
      bonsaiId: this.bonsaiId,
      workType: formValues.workType,
      date: isoDate,
      description: formValues.description,
      imageUrls: imageUrls,
      // カレンダー拡張プロパティ
      isAllDay: this.isAllDay,
      priority: formValues.priority
    };
    
    // 時間情報を追加（終日イベントでない場合）
    if (!this.isAllDay) {
      workRecordData.startTime = startTime;
      workRecordData.endTime = endTime;
    }
    
    // 新規作成の場合
    if (!this.isEditMode) {
      this.workRecordService.createWorkRecord(this.bonsaiId, workRecordData)
        .subscribe({
          next: (createdRecord) => {
            this.isUploading = false;
            this.saving = false;
            // 作業記録詳細ページに遷移
            this.router.navigate(['/records', createdRecord.id]);
          },
          error: (error) => {
            this.isUploading = false;
            this.saving = false;
            this.error = '作業記録の作成に失敗しました。';
            console.error('作業記録作成エラー:', error);
          }
        });
    } else {
      // 更新の場合
      this.workRecordService.updateWorkRecord(this.recordId, workRecordData)
        .subscribe({
          next: (updatedRecord) => {
            this.isUploading = false;
            this.saving = false;
            // 作業記録詳細ページに遷移
            this.router.navigate(['/records', this.recordId]);
          },
          error: (error) => {
            this.isUploading = false;
            this.saving = false;
            this.error = '作業記録の更新に失敗しました。';
            console.error('作業記録更新エラー:', error);
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
   * 終日イベントフラグを切り替える
   */
  toggleAllDay(): void {
    this.isAllDay = !this.isAllDay;
    
    if (this.isAllDay) {
      // 終日イベントの場合は時間をクリア
      this.recordForm.get('startTime')?.setValue('');
      this.recordForm.get('endTime')?.setValue('');
    } else {
      // 終日イベントでない場合はデフォルト時間を設定
      this.recordForm.get('startTime')?.setValue('09:00');
      this.recordForm.get('endTime')?.setValue('10:00');
    }
  }

  /**
   * キャンセルして前の画面に戻る
   */
  cancel(): void {
    if (this.isEditMode) {
      // 編集モードの場合は作業記録詳細ページに戻る
      this.router.navigate(['/records', this.recordId]);
    } else {
      // 新規作成モードの場合は盆栽詳細ページに戻る
      this.router.navigate(['/bonsai', this.bonsaiId]);
    }
  }
}
