import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BonsaiService } from '../../../services/bonsai.service';
import { WorkRecordService } from '../../../services/work-record.service';
import { WorkScheduleService } from '../../../services/work-schedule.service';
import { ImageUploadService } from '../../../services/image-upload.service';
import { BonsaiDetail } from '../../../models/bonsai.model';
import { WORK_TYPE_LABELS, WorkType, WorkRecord } from '../../../models/work-record.model';
import { WorkSchedule } from '../../../models/work-schedule.model';

@Component({
  selector: 'app-bonsai-detail',
  templateUrl: './bonsai-detail.component.html',
  styleUrls: ['./bonsai-detail.component.scss']
})
export class BonsaiDetailComponent implements OnInit {
  bonsaiId: string = '';
  bonsai?: BonsaiDetail;
  loading = true;
  error = '';
  workTypeLabels = WORK_TYPE_LABELS;
  activeTab = 'info'; // 'info', 'records', 'schedules'
  isEditMode = false;
  
  // 作業記録タブ用のプロパティ
  workRecords: WorkRecord[] = [];
  workRecordsLoading = false;
  workRecordsError = '';
  
  // 作業予定タブ用のプロパティ
  workSchedules: WorkSchedule[] = [];
  workSchedulesLoading = false;
  workSchedulesError = '';

  // 画像アップロード関連のプロパティ
  imagePreview: string | null = null;
  uploadError: string | null = null;
  isUploading = false;
  imageFile: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bonsaiService: BonsaiService,
    private workRecordService: WorkRecordService,
    private workScheduleService: WorkScheduleService,
    private imageUploadService: ImageUploadService
  ) { }

  ngOnInit(): void {
    // URLから編集モードかどうかを判断
    this.isEditMode = this.router.url.includes('/edit');
    
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.bonsaiId = id;
        
        // 'new'の場合は新規作成モードとして扱う
        if (id === 'new') {
          this.isEditMode = true;
          this.loading = false;
          // 空の盆栽データを作成
          this.bonsai = {
            id: 'new',
            userId: '', // ユーザーIDを追加（実際の値は保存時に設定される）
            name: '',
            species: '',
            registrationDate: new Date().toISOString(),
            history: '',
            imageUrls: [],
            recentWorks: [],
            upcomingWorks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        } else {
          this.loadBonsaiDetail();
        }
      } else {
        this.error = '盆栽IDが指定されていません。';
        this.loading = false;
      }
    });
  }

  /**
   * コンポーネント初期化後に画像プレビューを設定
   */
  ngAfterViewInit(): void {
    setTimeout(() => {
      // 既存の画像URLがあれば、プレビューを設定
      if (this.bonsai && this.bonsai.imageUrls && this.bonsai.imageUrls.length > 0) {
        this.imagePreview = this.bonsai.imageUrls[0];
      }
    });
  }

  /**
   * 画像選択時の処理
   * 
   * @param event 画像選択イベント
   */
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // ファイルサイズチェック（非常に大きなファイルのみ制限）
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_FILE_SIZE) {
        this.uploadError = `ファイルサイズが大きすぎます（最大${MAX_FILE_SIZE / (1024 * 1024)}MB）。より小さいファイルを選択してください。`;
        return;
      }
      
      // ファイル形式チェック
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        this.uploadError = 'サポートされていない画像形式です（JPG、PNG、GIF、WebP形式のみ）';
        return;
      }
      
      this.imageFile = file;
      this.uploadError = null;
      
      // 大きなファイルの場合は注意メッセージを表示
      if (file.size > 2 * 1024 * 1024) {
        console.log(`大きなファイル（${(file.size / (1024 * 1024)).toFixed(2)}MB）が選択されました。アップロード時に自動的に圧縮されます。`);
      }
      
      // プレビュー表示
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * 画像削除
   */
  removeImage(): void {
    this.imagePreview = null;
    this.imageFile = null;
    if (this.bonsai) {
      this.bonsai.imageUrls = [];
    }
  }

  /**
   * 盆栽詳細を読み込む
   */
  loadBonsaiDetail(): void {
    this.loading = true;
    this.bonsaiService.getBonsaiDetail(this.bonsaiId)
      .subscribe({
        next: (bonsai: BonsaiDetail) => {
          this.bonsai = bonsai;
          
          // recentWorksとupcomingWorksが未定義の場合は空の配列を設定
          if (!this.bonsai.recentWorks) {
            this.bonsai.recentWorks = [];
          }
          if (!this.bonsai.upcomingWorks) {
            this.bonsai.upcomingWorks = [];
          }
          
          // 盆栽に関連する作業記録を取得
          this.workRecordService.getWorkRecordList(this.bonsaiId)
            .subscribe({
              next: (response) => {
          // 作業記録を日付の降順でソート（itemsが存在する場合のみ）
          const sortedRecords = response.items ? response.items.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          ) : [];
                
                // 盆栽データに最新の作業記録を設定
                if (this.bonsai) {
                  this.bonsai.recentWorks = sortedRecords.map(record => ({
                    id: record.id,
                    workTypes: record.workTypes,
                    date: record.date
                  }));
                  // recentWorksが未定義の場合は空の配列を設定
                  if (!this.bonsai.recentWorks) {
                    this.bonsai.recentWorks = [];
                  }
                }
                
                this.loading = false;
              },
              error: (error) => {
                console.error('作業記録取得エラー:', error);
                // 作業記録の取得に失敗しても、盆栽詳細は表示する
                this.loading = false;
              }
            });
        },
        error: (error) => {
          this.error = '盆栽詳細の取得に失敗しました。';
          console.error('盆栽詳細取得エラー:', error);
          this.loading = false;
        }
      });
  }

  /**
   * タブを切り替える
   * 
   * @param tabId タブID
   */
  changeTab(tabId: string): void {
    this.activeTab = tabId;
    
    // 作業記録タブが選択された場合、作業記録一覧を取得
    if (tabId === 'records' && this.bonsaiId && this.bonsaiId !== 'new') {
      this.loadWorkRecords();
    }
    
    // 作業予定タブが選択された場合、作業予定一覧を取得
    if (tabId === 'schedules' && this.bonsaiId && this.bonsaiId !== 'new') {
      this.loadWorkSchedules();
    }
  }
  
  /**
   * 作業記録一覧を取得
   */
  loadWorkRecords(): void {
    if (!this.bonsaiId) return;
    
    this.workRecordsLoading = true;
    this.workRecordsError = '';
    this.workRecords = [];
    
    this.workRecordService.getWorkRecordList(this.bonsaiId)
      .subscribe({
        next: (response) => {
          // 作業記録を日付の降順でソート
          this.workRecords = response.items ? response.items.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          ) : [];
          this.workRecordsLoading = false;
        },
        error: (error) => {
          this.workRecordsError = '作業記録の取得に失敗しました。';
          console.error('作業記録取得エラー:', error);
          this.workRecordsLoading = false;
        }
      });
  }
  
  /**
   * 作業予定一覧を取得
   */
  loadWorkSchedules(): void {
    if (!this.bonsaiId) return;
    
    this.workSchedulesLoading = true;
    this.workSchedulesError = '';
    this.workSchedules = [];
    
    this.workScheduleService.getWorkScheduleList(this.bonsaiId)
      .subscribe({
        next: (response) => {
          // 作業予定を予定日の昇順でソート
          this.workSchedules = response.items ? response.items.sort(
            (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
          ) : [];
          this.workSchedulesLoading = false;
        },
        error: (error) => {
          this.workSchedulesError = '作業予定の取得に失敗しました。';
          console.error('作業予定取得エラー:', error);
          this.workSchedulesLoading = false;
        }
      });
  }

  /**
   * 盆栽編集ページに遷移
   */
  editBonsai(): void {
    this.router.navigate(['/bonsai', this.bonsaiId, 'edit']);
  }

  /**
   * 盆栽一覧ページに戻る
   */
  goBack(): void {
    if (this.isEditMode) {
      if (this.bonsaiId === 'new') {
        // 新規登録モードの場合は盆栽一覧に戻る
        this.router.navigate(['/bonsai']);
      } else {
        // 既存盆栽の編集モードの場合は詳細ページに戻る
        this.router.navigate(['/bonsai', this.bonsaiId]);
      }
    } else {
      // 通常モードの場合は一覧ページに戻る
      this.router.navigate(['/bonsai']);
    }
  }

  /**
   * 盆栽情報を保存
   */
  saveBonsai(): void {
    if (!this.bonsai) return;

    // 新しい画像がある場合はアップロード
    if (this.imageFile) {
      this.isUploading = true;
      this.uploadError = null;
      
      this.imageUploadService.uploadImage(this.imageFile).subscribe({
        next: (imageUrl) => {
          // アップロード成功
          this.isUploading = false;
          this.bonsai!.imageUrls = [imageUrl];
          this.proceedWithSave();
        },
        error: (error) => {
          // アップロードエラー
          this.isUploading = false;
          this.uploadError = '画像のアップロードに失敗しました: ' + error.message;
          console.error('画像アップロードエラー:', error);
        }
      });
    } else {
      // 画像の変更がない場合はそのまま保存
      this.proceedWithSave();
    }
  }

  /**
   * 実際の保存処理
   */
  private proceedWithSave(): void {
    if (!this.bonsai) return;

    const bonsaiData = {
      name: this.bonsai.name,
      species: this.bonsai.species,
      registrationDate: this.bonsai.registrationDate,
      history: this.bonsai.history,
      imageUrls: this.bonsai.imageUrls
    };

    // 新規作成の場合
    if (this.bonsaiId === 'new') {
      this.bonsaiService.createBonsai(bonsaiData)
        .subscribe({
          next: (createdBonsai) => {
            // 作成された盆栽の詳細ページに遷移
            this.router.navigate(['/bonsai', createdBonsai.id]);
          },
          error: (error) => {
            this.error = '盆栽情報の作成に失敗しました。';
            console.error('盆栽作成エラー:', error);
          }
        });
    } else {
      // 更新の場合
      this.bonsaiService.updateBonsai(this.bonsaiId, bonsaiData)
        .subscribe({
          next: (updatedBonsai) => {
            // 詳細ページに戻る
            this.router.navigate(['/bonsai', this.bonsaiId]);
          },
          error: (error) => {
            this.error = '盆栽情報の更新に失敗しました。';
            console.error('盆栽更新エラー:', error);
          }
        });
    }
  }

  /**
   * 盆栽を削除
   */
  deleteBonsai(): void {
    if (confirm('この盆栽を削除してもよろしいですか？')) {
      this.bonsaiService.deleteBonsai(this.bonsaiId)
        .subscribe({
          next: () => {
            this.router.navigate(['/bonsai']);
          },
          error: (error) => {
            this.error = '盆栽の削除に失敗しました。';
            console.error('盆栽削除エラー:', error);
          }
        });
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
   * 作業予定編集ページに遷移
   * 
   * @param scheduleId 作業予定ID
   */
  viewWorkSchedule(scheduleId: string): void {
    this.router.navigate(['/schedules', scheduleId]);
  }

  /**
   * 作業予定作成ページに遷移
   */
  createWorkSchedule(): void {
    this.router.navigate(['/bonsai', this.bonsaiId, 'schedules', 'new']);
  }

  /**
   * 作業タイプの表示名を取得
   * 
   * @param workType 作業タイプ
   * @returns 表示名
   */
  getWorkTypeLabel(workType: string): string {
    return WORK_TYPE_LABELS[workType as WorkType] || workType;
  }
}
