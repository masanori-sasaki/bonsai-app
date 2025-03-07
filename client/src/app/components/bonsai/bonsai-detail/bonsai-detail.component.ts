import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BonsaiService } from '../../../services/bonsai.service';
import { ImageUploadService } from '../../../services/image-upload.service';
import { BonsaiDetail } from '../../../models/bonsai.model';
import { WORK_TYPE_LABELS, WorkType } from '../../../models/work-record.model';

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

  // 画像アップロード関連のプロパティ
  imagePreview: string | null = null;
  uploadError: string | null = null;
  isUploading = false;
  imageFile: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bonsaiService: BonsaiService,
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
      
      // ファイルサイズチェック（クライアント側でも確認）
      if (file.size > 2 * 1024 * 1024) {
        this.uploadError = 'ファイルサイズが大きすぎます（最大2MB）';
        return;
      }
      
      // ファイル形式チェック
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        this.uploadError = 'サポートされていない画像形式です（JPG、PNG、GIF形式のみ）';
        return;
      }
      
      this.imageFile = file;
      this.uploadError = null;
      
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
          this.loading = false;
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
      // 編集モードの場合は詳細ページに戻る
      this.router.navigate(['/bonsai', this.bonsaiId]);
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
   * 作業予定詳細ページに遷移
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
