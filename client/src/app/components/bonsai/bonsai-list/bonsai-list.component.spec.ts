import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { BonsaiListComponent } from './bonsai-list.component';
import { BonsaiService } from '../../../services/bonsai.service';
import { Bonsai } from '../../../models/bonsai.model';

describe('BonsaiListComponent', () => {
  let component: BonsaiListComponent;
  let fixture: ComponentFixture<BonsaiListComponent>;
  let bonsaiService: jasmine.SpyObj<BonsaiService>;
  let router: jasmine.SpyObj<Router>;

  // テスト用の盆栽データ
  const mockBonsaiList: Bonsai[] = [
    {
      id: 'bonsai1',
      userId: 'user1',
      name: '五葉松',
      species: '五葉松（Pinus parviflora）',
      registrationDate: '2025-01-15T00:00:00Z',
      imageUrls: ['https://example.com/images/bonsai1-1.jpg'],
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-02-20T15:30:00Z'
    },
    {
      id: 'bonsai2',
      userId: 'user1',
      name: '真柏',
      species: '真柏（Juniperus chinensis）',
      registrationDate: '2025-02-10T00:00:00Z',
      imageUrls: ['https://example.com/images/bonsai2-1.jpg'],
      createdAt: '2025-02-10T09:00:00Z',
      updatedAt: '2025-02-10T09:00:00Z'
    }
  ];

  beforeEach(async () => {
    // BonsaiServiceのモック
    const bonsaiServiceSpy = jasmine.createSpyObj('BonsaiService', [
      'getBonsaiList',
      'deleteBonsai'
    ]);
    
    // Routerのモック
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [BonsaiListComponent],
      providers: [
        { provide: BonsaiService, useValue: bonsaiServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    bonsaiService = TestBed.inject(BonsaiService) as jasmine.SpyObj<BonsaiService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    // 盆栽一覧取得のモック
    bonsaiService.getBonsaiList.and.returnValue(of({
      items: mockBonsaiList,
      nextToken: undefined
    }));
    
    fixture = TestBed.createComponent(BonsaiListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load bonsai list on init', () => {
    expect(component.bonsaiList).toEqual(mockBonsaiList);
    expect(component.loading).toBeFalse();
    expect(component.hasMore).toBeFalse();
    expect(bonsaiService.getBonsaiList).toHaveBeenCalledWith(20, undefined);
  });

  it('should handle error when loading bonsai list', () => {
    // エラーを返すようにモック
    bonsaiService.getBonsaiList.and.returnValue(throwError(() => new Error('Failed to load')));
    
    // コンポーネントを再作成
    fixture = TestBed.createComponent(BonsaiListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // エラーが設定されることを確認
    expect(component.error).toBe('盆栽一覧の取得に失敗しました。');
    expect(component.loading).toBeFalse();
  });

  it('should load more bonsai when onLoadMore is called', () => {
    // 次のページがあるようにモック
    component.nextToken = 'next-token';
    component.hasMore = true;
    
    // 追加の盆栽データ
    const additionalBonsai: Bonsai = {
      id: 'bonsai3',
      userId: 'user1',
      name: '楓',
      species: '楓（Acer palmatum）',
      registrationDate: '2025-03-05T00:00:00Z',
      imageUrls: ['https://example.com/images/bonsai3-1.jpg'],
      createdAt: '2025-03-05T14:20:00Z',
      updatedAt: '2025-03-05T14:20:00Z'
    };
    
    // 次のページのモック
    bonsaiService.getBonsaiList.and.returnValue(of({
      items: [additionalBonsai],
      nextToken: undefined
    }));
    
    // もっと読み込むボタンをクリック
    component.onLoadMore();
    
    // 盆栽リストが更新されることを確認
    expect(component.bonsaiList.length).toBe(3);
    expect(component.bonsaiList[2]).toEqual(additionalBonsai);
    expect(component.hasMore).toBeFalse();
    expect(bonsaiService.getBonsaiList).toHaveBeenCalledWith(20, 'next-token');
  });

  it('should not load more when loading is in progress', () => {
    // ロード中の状態を設定
    component.loading = true;
    component.hasMore = true;
    component.nextToken = 'next-token';
    
    // もっと読み込むボタンをクリック
    component.onLoadMore();
    
    // getBonsaiListが2回目は呼ばれないことを確認
    expect(bonsaiService.getBonsaiList).toHaveBeenCalledTimes(1);
  });

  it('should navigate to bonsai detail page', () => {
    // 盆栽詳細ページに遷移
    component.viewBonsaiDetail('bonsai1');
    
    // 正しいルートに遷移することを確認
    expect(router.navigate).toHaveBeenCalledWith(['/bonsai', 'bonsai1']);
  });

  it('should navigate to bonsai creation page', () => {
    // 盆栽作成ページに遷移
    component.createNewBonsai();
    
    // 正しいルートに遷移することを確認
    expect(router.navigate).toHaveBeenCalledWith(['/bonsai/new']);
  });

  it('should delete bonsai after confirmation', () => {
    // confirmのモック
    spyOn(window, 'confirm').and.returnValue(true);
    
    // 削除成功のモック
    bonsaiService.deleteBonsai.and.returnValue(of({
      message: '盆栽が正常に削除されました',
      id: 'bonsai1'
    }));
    
    // イベントのモック
    const event = jasmine.createSpyObj('Event', ['stopPropagation']);
    
    // 盆栽を削除
    component.deleteBonsai('bonsai1', event);
    
    // イベント伝播が停止されることを確認
    expect(event.stopPropagation).toHaveBeenCalled();
    
    // 削除が実行されることを確認
    expect(bonsaiService.deleteBonsai).toHaveBeenCalledWith('bonsai1');
    
    // 盆栽リストから削除されることを確認
    expect(component.bonsaiList.length).toBe(1);
    expect(component.bonsaiList[0].id).toBe('bonsai2');
  });

  it('should not delete bonsai when confirmation is cancelled', () => {
    // confirmのモック（キャンセル）
    spyOn(window, 'confirm').and.returnValue(false);
    
    // イベントのモック
    const event = jasmine.createSpyObj('Event', ['stopPropagation']);
    
    // 盆栽を削除
    component.deleteBonsai('bonsai1', event);
    
    // イベント伝播が停止されることを確認
    expect(event.stopPropagation).toHaveBeenCalled();
    
    // 削除が実行されないことを確認
    expect(bonsaiService.deleteBonsai).not.toHaveBeenCalled();
    
    // 盆栽リストが変更されないことを確認
    expect(component.bonsaiList.length).toBe(2);
  });

  it('should handle error when deleting bonsai', () => {
    // confirmのモック
    spyOn(window, 'confirm').and.returnValue(true);
    
    // 削除エラーのモック
    bonsaiService.deleteBonsai.and.returnValue(throwError(() => new Error('Failed to delete')));
    
    // イベントのモック
    const event = jasmine.createSpyObj('Event', ['stopPropagation']);
    
    // 盆栽を削除
    component.deleteBonsai('bonsai1', event);
    
    // エラーが設定されることを確認
    expect(component.error).toBe('盆栽の削除に失敗しました。');
    
    // 盆栽リストが変更されないことを確認
    expect(component.bonsaiList.length).toBe(2);
  });

  it('should return correct work type label', () => {
    expect(component.getWorkTypeLabel('pruning')).toBe('剪定');
    expect(component.getWorkTypeLabel('repotting')).toBe('植替え');
    expect(component.getWorkTypeLabel('watering')).toBe('水やり');
    expect(component.getWorkTypeLabel('fertilizing')).toBe('肥料');
    expect(component.getWorkTypeLabel('other')).toBe('その他');
    expect(component.getWorkTypeLabel('unknown')).toBe('unknown');
  });
});
