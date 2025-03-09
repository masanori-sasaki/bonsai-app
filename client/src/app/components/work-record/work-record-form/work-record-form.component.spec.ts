import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { WorkRecordFormComponent } from './work-record-form.component';
import { WorkRecordService } from '../../../services/work-record.service';
import { BonsaiService } from '../../../services/bonsai.service';
import { ImageUploadService } from '../../../services/image-upload.service';
import { WorkRecord } from '../../../models/work-record.model';
import { BonsaiDetail } from '../../../models/bonsai.model';

describe('WorkRecordFormComponent', () => {
  let component: WorkRecordFormComponent;
  let fixture: ComponentFixture<WorkRecordFormComponent>;
  let workRecordService: jasmine.SpyObj<WorkRecordService>;
  let bonsaiService: jasmine.SpyObj<BonsaiService>;
  let imageUploadService: jasmine.SpyObj<ImageUploadService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  // テスト用のデータ
  const mockBonsai: BonsaiDetail = {
    id: 'bonsai1',
    userId: 'user1',
    name: '五葉松',
    species: '五葉松（Pinus parviflora）',
    registrationDate: '2025-01-15T00:00:00Z',
    history: '2023年に購入',
    imageUrls: ['https://example.com/images/bonsai1-1.jpg'],
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-02-20T15:30:00Z',
    workRecords: [],
    workSchedules: []
  };

  const mockWorkRecord: WorkRecord = {
    id: 'record1',
    bonsaiId: 'bonsai1',
    workType: 'pruning',
    date: '2025-02-15T10:00:00Z',
    description: '剪定作業を行いました。',
    imageUrls: ['https://example.com/images/record1-1.jpg'],
    createdAt: '2025-02-15T10:30:00Z',
    updatedAt: '2025-02-15T10:30:00Z'
  };

  beforeEach(async () => {
    // サービスのモック
    const workRecordServiceSpy = jasmine.createSpyObj('WorkRecordService', [
      'getWorkRecordDetail',
      'createWorkRecord',
      'updateWorkRecord'
    ]);
    
    const bonsaiServiceSpy = jasmine.createSpyObj('BonsaiService', [
      'getBonsaiDetail'
    ]);
    
    const imageUploadServiceSpy = jasmine.createSpyObj('ImageUploadService', [
      'uploadImage'
    ]);
    
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    
    // ActivatedRouteのモック
    activatedRoute = {
      paramMap: of(convertToParamMap({ id: 'bonsai1', recordId: 'new' })),
      queryParams: of({})
    };

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        RouterTestingModule
      ],
      declarations: [WorkRecordFormComponent],
      providers: [
        FormBuilder,
        { provide: WorkRecordService, useValue: workRecordServiceSpy },
        { provide: BonsaiService, useValue: bonsaiServiceSpy },
        { provide: ImageUploadService, useValue: imageUploadServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).compileComponents();

    workRecordService = TestBed.inject(WorkRecordService) as jasmine.SpyObj<WorkRecordService>;
    bonsaiService = TestBed.inject(BonsaiService) as jasmine.SpyObj<BonsaiService>;
    imageUploadService = TestBed.inject(ImageUploadService) as jasmine.SpyObj<ImageUploadService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    // 盆栽詳細取得のモック
    bonsaiService.getBonsaiDetail.and.returnValue(of(mockBonsai));
    
    fixture = TestBed.createComponent(WorkRecordFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values in create mode', () => {
    expect(component.recordForm).toBeDefined();
    expect(component.isEditMode).toBeFalse();
    expect(component.bonsaiId).toBe('bonsai1');
    expect(component.bonsai).toEqual(mockBonsai);
    
    // フォームの初期値を確認
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    expect(component.recordForm.get('workType')?.value).toBe('pruning');
    expect(component.recordForm.get('date')?.value).toBe(formattedDate);
    expect(component.recordForm.get('description')?.value).toBe('');
  });

  it('should load work record in edit mode', () => {
    // 編集モードのルートパラメータ
    activatedRoute.paramMap = of(convertToParamMap({ id: 'bonsai1', recordId: 'record1' }));
    
    // 作業記録取得のモック
    workRecordService.getWorkRecordDetail.and.returnValue(of(mockWorkRecord));
    
    // コンポーネントを再作成
    fixture = TestBed.createComponent(WorkRecordFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // 編集モードであることを確認
    expect(component.isEditMode).toBeTrue();
    expect(component.recordId).toBe('record1');
    expect(component.workRecord).toEqual(mockWorkRecord);
    
    // フォームに値が設定されることを確認
    expect(component.recordForm.get('workType')?.value).toBe('pruning');
    expect(component.recordForm.get('description')?.value).toBe('剪定作業を行いました。');
    
    // 作業記録取得が呼ばれることを確認
    expect(workRecordService.getWorkRecordDetail).toHaveBeenCalledWith('record1');
  });

  it('should handle error when loading bonsai detail', () => {
    // 盆栽詳細取得エラーのモック
    bonsaiService.getBonsaiDetail.and.returnValue(throwError(() => new Error('Failed to load')));
    
    // コンポーネントを再作成
    fixture = TestBed.createComponent(WorkRecordFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // エラーが設定されることを確認
    expect(component.error).toBe('盆栽情報の取得に失敗しました。');
    expect(component.loading).toBeFalse();
  });

  it('should handle error when loading work record detail', () => {
    // 編集モードのルートパラメータ
    activatedRoute.paramMap = of(convertToParamMap({ id: 'bonsai1', recordId: 'record1' }));
    
    // 作業記録取得エラーのモック
    workRecordService.getWorkRecordDetail.and.returnValue(throwError(() => new Error('Failed to load')));
    
    // コンポーネントを再作成
    fixture = TestBed.createComponent(WorkRecordFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // エラーが設定されることを確認
    expect(component.error).toBe('作業記録の取得に失敗しました。');
    expect(component.loading).toBeFalse();
  });

  it('should format date for input correctly', () => {
    const isoDate = '2025-03-15T10:30:00Z';
    const formattedDate = component.formatDateForInput(isoDate);
    expect(formattedDate).toBe('2025-03-15');
  });

  it('should handle image selection', () => {
    // FileReaderのモック
    const mockFileReader = {
      onload: null,
      readAsDataURL: function(file: File) {
        // onloadを呼び出す
        if (this.onload) {
          (this.onload as any)({ target: { result: 'data:image/jpeg;base64,test' } });
        }
      }
    };
    spyOn(window, 'FileReader').and.returnValue(mockFileReader as any);
    
    // ファイル選択イベントのモック
    const mockFile = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    const mockEvent = {
      target: {
        files: [mockFile]
      }
    } as any;
    
    // 画像選択
    component.onImageSelected(mockEvent);
    
    // 画像が追加されることを確認
    expect(component.imageFiles.length).toBe(1);
    expect(component.imageFiles[0]).toBe(mockFile);
    expect(component.imagePreviewUrls.length).toBe(1);
    expect(component.imagePreviewUrls[0]).toBe('data:image/jpeg;base64,test');
    expect(component.uploadError).toBeNull();
  });

  it('should handle large image file selection', () => {
    // 大きなファイルのモック
    const largeFile = new File(['dummy content'.repeat(1000000)], 'large-image.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 }); // 11MB
    
    // ファイル選択イベントのモック
    const mockEvent = {
      target: {
        files: [largeFile]
      }
    } as any;
    
    // コンソールログのスパイ
    spyOn(console, 'log');
    
    // 画像選択
    component.onImageSelected(mockEvent);
    
    // エラーが設定されることを確認
    expect(component.uploadError).toContain('ファイルサイズが大きすぎます');
    expect(component.imageFiles.length).toBe(0);
  });

  it('should remove image', () => {
    // 画像を追加
    component.imageFiles = [new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' })];
    component.imagePreviewUrls = ['data:image/jpeg;base64,test'];
    
    // 画像を削除
    component.removeImage(0);
    
    // 画像が削除されることを確認
    expect(component.imageFiles.length).toBe(0);
    expect(component.imagePreviewUrls.length).toBe(0);
  });

  it('should not save when form is invalid', () => {
    // フォームを無効な状態にする
    component.recordForm.get('description')?.setValue('');
    
    // 保存
    component.saveWorkRecord();
    
    // createWorkRecordが呼ばれないことを確認
    expect(workRecordService.createWorkRecord).not.toHaveBeenCalled();
  });

  it('should create work record without images', () => {
    // フォームに値を設定
    component.recordForm.get('workType')?.setValue('pruning');
    component.recordForm.get('date')?.setValue('2025-03-15');
    component.recordForm.get('description')?.setValue('剪定作業を行いました。');
    
    // 作成成功のモック
    const newRecord: WorkRecord = {
      id: 'new-record-id',
      bonsaiId: 'bonsai1',
      workType: 'pruning',
      date: '2025-03-15T00:00:00Z',
      description: '剪定作業を行いました。',
      imageUrls: [],
      createdAt: '2025-03-09T00:00:00Z',
      updatedAt: '2025-03-09T00:00:00Z'
    };
    workRecordService.createWorkRecord.and.returnValue(of(newRecord));
    
    // 保存
    component.saveWorkRecord();
    
    // createWorkRecordが正しく呼ばれることを確認
    expect(workRecordService.createWorkRecord).toHaveBeenCalledWith('bonsai1', jasmine.objectContaining({
      bonsaiId: 'bonsai1',
      workType: 'pruning',
      description: '剪定作業を行いました。',
      imageUrls: []
    }));
    
    // 作業記録詳細ページに遷移することを確認
    expect(router.navigate).toHaveBeenCalledWith(['/records', 'new-record-id']);
  });

  it('should update work record without images', () => {
    // 編集モードを設定
    component.isEditMode = true;
    component.recordId = 'record1';
    component.workRecord = mockWorkRecord;
    
    // フォームに値を設定
    component.recordForm.get('workType')?.setValue('pruning');
    component.recordForm.get('date')?.setValue('2025-03-15');
    component.recordForm.get('description')?.setValue('剪定作業を行いました。（更新）');
    
    // 更新成功のモック
    const updatedRecord: WorkRecord = {
      ...mockWorkRecord,
      description: '剪定作業を行いました。（更新）',
      updatedAt: '2025-03-09T00:00:00Z'
    };
    workRecordService.updateWorkRecord.and.returnValue(of(updatedRecord));
    
    // 保存
    component.saveWorkRecord();
    
    // updateWorkRecordが正しく呼ばれることを確認
    expect(workRecordService.updateWorkRecord).toHaveBeenCalledWith('record1', jasmine.objectContaining({
      workType: 'pruning',
      description: '剪定作業を行いました。（更新）'
    }));
    
    // 作業記録詳細ページに遷移することを確認
    expect(router.navigate).toHaveBeenCalledWith(['/records', 'record1']);
  });

  it('should create work record with images', () => {
    // フォームに値を設定
    component.recordForm.get('workType')?.setValue('pruning');
    component.recordForm.get('date')?.setValue('2025-03-15');
    component.recordForm.get('description')?.setValue('剪定作業を行いました。');
    
    // 画像を追加
    const mockFile = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    component.imageFiles = [mockFile];
    component.imagePreviewUrls = ['data:image/jpeg;base64,test'];
    
    // 画像アップロード成功のモック
    imageUploadService.uploadImage.and.returnValue(of('https://example.com/images/uploaded.jpg'));
    
    // 作成成功のモック
    const newRecord: WorkRecord = {
      id: 'new-record-id',
      bonsaiId: 'bonsai1',
      workType: 'pruning',
      date: '2025-03-15T00:00:00Z',
      description: '剪定作業を行いました。',
      imageUrls: ['https://example.com/images/uploaded.jpg'],
      createdAt: '2025-03-09T00:00:00Z',
      updatedAt: '2025-03-09T00:00:00Z'
    };
    workRecordService.createWorkRecord.and.returnValue(of(newRecord));
    
    // 保存
    component.saveWorkRecord();
    
    // uploadImageが呼ばれることを確認
    expect(imageUploadService.uploadImage).toHaveBeenCalledWith(mockFile);
    
    // createWorkRecordが正しく呼ばれることを確認
    expect(workRecordService.createWorkRecord).toHaveBeenCalledWith('bonsai1', jasmine.objectContaining({
      bonsaiId: 'bonsai1',
      workType: 'pruning',
      description: '剪定作業を行いました。',
      imageUrls: ['https://example.com/images/uploaded.jpg']
    }));
  });

  it('should handle error when creating work record', () => {
    // フォームに値を設定
    component.recordForm.get('workType')?.setValue('pruning');
    component.recordForm.get('date')?.setValue('2025-03-15');
    component.recordForm.get('description')?.setValue('剪定作業を行いました。');
    
    // 作成エラーのモック
    workRecordService.createWorkRecord.and.returnValue(throwError(() => new Error('Failed to create')));
    
    // 保存
    component.saveWorkRecord();
    
    // エラーが設定されることを確認
    expect(component.error).toBe('作業記録の作成に失敗しました。');
    expect(component.saving).toBeFalse();
  });

  it('should toggle all day event flag', () => {
    // 初期状態は終日イベント
    expect(component.isAllDay).toBeTrue();
    expect(component.recordForm.get('startTime')?.value).toBe('');
    expect(component.recordForm.get('endTime')?.value).toBe('');
    
    // 終日イベントフラグを切り替え
    component.toggleAllDay();
    
    // 終日イベントでなくなることを確認
    expect(component.isAllDay).toBeFalse();
    expect(component.recordForm.get('startTime')?.value).toBe('09:00');
    expect(component.recordForm.get('endTime')?.value).toBe('10:00');
    
    // もう一度切り替え
    component.toggleAllDay();
    
    // 終日イベントに戻ることを確認
    expect(component.isAllDay).toBeTrue();
    expect(component.recordForm.get('startTime')?.value).toBe('');
    expect(component.recordForm.get('endTime')?.value).toBe('');
  });

  it('should navigate back on cancel in create mode', () => {
    // キャンセル
    component.cancel();
    
    // 盆栽詳細ページに戻ることを確認
    expect(router.navigate).toHaveBeenCalledWith(['/bonsai', 'bonsai1']);
  });

  it('should navigate back on cancel in edit mode', () => {
    // 編集モードを設定
    component.isEditMode = true;
    component.recordId = 'record1';
    
    // キャンセル
    component.cancel();
    
    // 作業記録詳細ページに戻ることを確認
    expect(router.navigate).toHaveBeenCalledWith(['/records', 'record1']);
  });
});
