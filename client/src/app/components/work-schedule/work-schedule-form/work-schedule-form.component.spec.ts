import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { WorkScheduleFormComponent } from './work-schedule-form.component';
import { WorkScheduleService } from '../../../services/work-schedule.service';
import { BonsaiService } from '../../../services/bonsai.service';
import { WorkSchedule } from '../../../models/work-schedule.model';
import { BonsaiDetail } from '../../../models/bonsai.model';

describe('WorkScheduleFormComponent', () => {
  let component: WorkScheduleFormComponent;
  let fixture: ComponentFixture<WorkScheduleFormComponent>;
  let workScheduleService: jasmine.SpyObj<WorkScheduleService>;
  let bonsaiService: jasmine.SpyObj<BonsaiService>;
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

  const mockWorkSchedule: WorkSchedule = {
    id: 'schedule1',
    bonsaiId: 'bonsai1',
    workType: 'pruning',
    scheduledDate: '2025-04-15T10:00:00Z',
    description: '剪定予定',
    completed: false,
    createdAt: '2025-02-15T10:30:00Z',
    updatedAt: '2025-02-15T10:30:00Z'
  };

  beforeEach(async () => {
    // サービスのモック
    const workScheduleServiceSpy = jasmine.createSpyObj('WorkScheduleService', [
      'getWorkScheduleDetail',
      'createWorkSchedule',
      'updateWorkSchedule'
    ]);
    
    const bonsaiServiceSpy = jasmine.createSpyObj('BonsaiService', [
      'getBonsaiDetail'
    ]);
    
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    
    // ActivatedRouteのモック
    activatedRoute = {
      paramMap: of(convertToParamMap({ id: 'bonsai1', scheduleId: 'new' })),
      queryParams: of({})
    };

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        RouterTestingModule
      ],
      declarations: [WorkScheduleFormComponent],
      providers: [
        FormBuilder,
        { provide: WorkScheduleService, useValue: workScheduleServiceSpy },
        { provide: BonsaiService, useValue: bonsaiServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).compileComponents();

    workScheduleService = TestBed.inject(WorkScheduleService) as jasmine.SpyObj<WorkScheduleService>;
    bonsaiService = TestBed.inject(BonsaiService) as jasmine.SpyObj<BonsaiService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    // 盆栽詳細取得のモック
    bonsaiService.getBonsaiDetail.and.returnValue(of(mockBonsai));
    
    fixture = TestBed.createComponent(WorkScheduleFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values in create mode', () => {
    expect(component.scheduleForm).toBeDefined();
    expect(component.isEditMode).toBeFalse();
    expect(component.bonsaiId).toBe('bonsai1');
    expect(component.bonsai).toEqual(mockBonsai);
    
    // フォームの初期値を確認
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 7); // 1週間後
    const formattedDate = futureDate.toISOString().split('T')[0];
    
    expect(component.scheduleForm.get('workType')?.value).toBe('pruning');
    expect(component.scheduleForm.get('scheduledDate')?.value).toBe(formattedDate);
    expect(component.scheduleForm.get('description')?.value).toBe('');
    expect(component.scheduleForm.get('completed')?.value).toBeFalse();
  });

  it('should load work schedule in edit mode', () => {
    // 編集モードのルートパラメータ
    activatedRoute.paramMap = of(convertToParamMap({ id: 'bonsai1', scheduleId: 'schedule1' }));
    
    // 作業予定取得のモック
    workScheduleService.getWorkScheduleDetail.and.returnValue(of(mockWorkSchedule));
    
    // コンポーネントを再作成
    fixture = TestBed.createComponent(WorkScheduleFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // 編集モードであることを確認
    expect(component.isEditMode).toBeTrue();
    expect(component.scheduleId).toBe('schedule1');
    expect(component.workSchedule).toEqual(mockWorkSchedule);
    
    // フォームに値が設定されることを確認
    expect(component.scheduleForm.get('workType')?.value).toBe('pruning');
    expect(component.scheduleForm.get('description')?.value).toBe('剪定予定');
    expect(component.scheduleForm.get('completed')?.value).toBeFalse();
    
    // 作業予定取得が呼ばれることを確認
    expect(workScheduleService.getWorkScheduleDetail).toHaveBeenCalledWith('schedule1');
  });

  it('should handle error when loading bonsai detail', () => {
    // 盆栽詳細取得エラーのモック
    bonsaiService.getBonsaiDetail.and.returnValue(throwError(() => new Error('Failed to load')));
    
    // コンポーネントを再作成
    fixture = TestBed.createComponent(WorkScheduleFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // エラーが設定されることを確認
    expect(component.error).toBe('盆栽情報の取得に失敗しました。');
    expect(component.loading).toBeFalse();
  });

  it('should handle error when loading work schedule detail', () => {
    // 編集モードのルートパラメータ
    activatedRoute.paramMap = of(convertToParamMap({ id: 'bonsai1', scheduleId: 'schedule1' }));
    
    // 作業予定取得エラーのモック
    workScheduleService.getWorkScheduleDetail.and.returnValue(throwError(() => new Error('Failed to load')));
    
    // コンポーネントを再作成
    fixture = TestBed.createComponent(WorkScheduleFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // エラーが設定されることを確認
    expect(component.error).toBe('作業予定の取得に失敗しました。');
    expect(component.loading).toBeFalse();
  });

  it('should format date for input correctly', () => {
    const isoDate = '2025-04-15T10:30:00Z';
    const formattedDate = component.formatDateForInput(isoDate);
    expect(formattedDate).toBe('2025-04-15');
  });

  it('should not save when form is invalid', () => {
    // フォームを無効な状態にする
    component.scheduleForm.get('description')?.setValue('');
    
    // 保存
    component.saveWorkSchedule();
    
    // createWorkScheduleが呼ばれないことを確認
    expect(workScheduleService.createWorkSchedule).not.toHaveBeenCalled();
  });

  it('should create work schedule', () => {
    // フォームに値を設定
    component.scheduleForm.get('workType')?.setValue('pruning');
    component.scheduleForm.get('scheduledDate')?.setValue('2025-04-15');
    component.scheduleForm.get('description')?.setValue('剪定予定');
    component.scheduleForm.get('completed')?.setValue(false);
    
    // 作成成功のモック
    const newSchedule: WorkSchedule = {
      id: 'new-schedule-id',
      bonsaiId: 'bonsai1',
      workType: 'pruning',
      scheduledDate: '2025-04-15T00:00:00Z',
      description: '剪定予定',
      completed: false,
      createdAt: '2025-03-09T00:00:00Z',
      updatedAt: '2025-03-09T00:00:00Z'
    };
    workScheduleService.createWorkSchedule.and.returnValue(of(newSchedule));
    
    // 保存
    component.saveWorkSchedule();
    
    // createWorkScheduleが正しく呼ばれることを確認
    expect(workScheduleService.createWorkSchedule).toHaveBeenCalledWith('bonsai1', jasmine.objectContaining({
      bonsaiId: 'bonsai1',
      workType: 'pruning',
      scheduledDate: jasmine.any(String),
      description: '剪定予定',
      completed: false
    }));
    
    // 作業予定詳細ページに遷移することを確認
    expect(router.navigate).toHaveBeenCalledWith(['/schedules', 'new-schedule-id']);
  });

  it('should update work schedule', () => {
    // 編集モードを設定
    component.isEditMode = true;
    component.scheduleId = 'schedule1';
    component.workSchedule = mockWorkSchedule;
    
    // フォームに値を設定
    component.scheduleForm.get('workType')?.setValue('pruning');
    component.scheduleForm.get('scheduledDate')?.setValue('2025-04-20');
    component.scheduleForm.get('description')?.setValue('剪定予定（更新）');
    component.scheduleForm.get('completed')?.setValue(true);
    
    // 更新成功のモック
    const updatedSchedule: WorkSchedule = {
      ...mockWorkSchedule,
      scheduledDate: '2025-04-20T00:00:00Z',
      description: '剪定予定（更新）',
      completed: true,
      updatedAt: '2025-03-09T00:00:00Z'
    };
    workScheduleService.updateWorkSchedule.and.returnValue(of(updatedSchedule));
    
    // 保存
    component.saveWorkSchedule();
    
    // updateWorkScheduleが正しく呼ばれることを確認
    expect(workScheduleService.updateWorkSchedule).toHaveBeenCalledWith('schedule1', jasmine.objectContaining({
      workType: 'pruning',
      scheduledDate: jasmine.any(String),
      description: '剪定予定（更新）',
      completed: true
    }));
    
    // 作業予定詳細ページに遷移することを確認
    expect(router.navigate).toHaveBeenCalledWith(['/schedules', 'schedule1']);
  });

  it('should handle error when creating work schedule', () => {
    // フォームに値を設定
    component.scheduleForm.get('workType')?.setValue('pruning');
    component.scheduleForm.get('scheduledDate')?.setValue('2025-04-15');
    component.scheduleForm.get('description')?.setValue('剪定予定');
    component.scheduleForm.get('completed')?.setValue(false);
    
    // 作成エラーのモック
    workScheduleService.createWorkSchedule.and.returnValue(throwError(() => new Error('Failed to create')));
    
    // 保存
    component.saveWorkSchedule();
    
    // エラーが設定されることを確認
    expect(component.error).toBe('作業予定の作成に失敗しました。');
    expect(component.saving).toBeFalse();
  });

  it('should toggle all day event flag', () => {
    // 初期状態は終日イベント
    expect(component.isAllDay).toBeTrue();
    expect(component.scheduleForm.get('startTime')?.value).toBe('');
    expect(component.scheduleForm.get('endTime')?.value).toBe('');
    
    // 終日イベントフラグを切り替え
    component.toggleAllDay();
    
    // 終日イベントでなくなることを確認
    expect(component.isAllDay).toBeFalse();
    expect(component.scheduleForm.get('startTime')?.value).toBe('09:00');
    expect(component.scheduleForm.get('endTime')?.value).toBe('10:00');
    
    // もう一度切り替え
    component.toggleAllDay();
    
    // 終日イベントに戻ることを確認
    expect(component.isAllDay).toBeTrue();
    expect(component.scheduleForm.get('startTime')?.value).toBe('');
    expect(component.scheduleForm.get('endTime')?.value).toBe('');
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
    component.scheduleId = 'schedule1';
    
    // キャンセル
    component.cancel();
    
    // 作業予定詳細ページに戻ることを確認
    expect(router.navigate).toHaveBeenCalledWith(['/schedules', 'schedule1']);
  });
});
