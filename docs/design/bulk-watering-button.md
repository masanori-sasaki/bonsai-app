# 一括水やりボタン設計

このドキュメントでは、Bonsai App（盆栽管理アプリ）のダッシュボード画面に実装する一括水やりボタンの設計を定義します。

## 目次

1. [概要](#概要)
2. [UI設計](#ui設計)
3. [コンポーネント設計](#コンポーネント設計)
4. [サービス設計](#サービス設計)
5. [インタラクション設計](#インタラクション設計)

## 概要

ダッシュボード画面の右下に固定位置（スクロールに追従）で一括水やりボタンを配置します。このボタンをクリックすると、ユーザーが所有するすべての盆栽に対して一括で水やり作業記録を作成できます。これにより、盆栽の数が多い場合でも、効率的に水やり記録を管理できるようになります。

## UI設計

### 一括水やりボタン

ダッシュボード画面の右下に固定位置（スクロールに追従）で一括水やりボタンを配置します。

```html
<!-- dashboard.component.html に追加 -->
<div class="bulk-watering-button">
  <button class="btn btn-primary rounded-circle" (click)="showBulkWateringDialog()">
    <i class="fas fa-tint"></i>
  </button>
</div>
```

```scss
/* dashboard.component.scss に追加 */
.bulk-watering-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
  
  button {
    width: 60px;
    height: 60px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    
    i {
      font-size: 1.5rem;
    }
  }
}
```

### 一括水やりダイアログ

一括水やりボタンをクリックすると表示されるダイアログです。説明文入力欄と日付表示、確認ボタンとキャンセルボタンを配置します。

```html
<!-- bulk-watering-dialog.component.html -->
<h2 mat-dialog-title>一括水やり</h2>
<div mat-dialog-content>
  <p>すべての盆栽に水やり作業記録を作成します。</p>
  <mat-form-field appearance="fill" class="full-width">
    <mat-label>説明</mat-label>
    <input matInput [(ngModel)]="data.description" placeholder="一括水やり">
  </mat-form-field>
  <p>記録日: {{ data.date | date:'yyyy年MM月dd日' }}</p>
</div>
<div mat-dialog-actions align="end">
  <button mat-button (click)="onCancel()">キャンセル</button>
  <button mat-raised-button color="primary" (click)="onConfirm()">水やりを記録</button>
</div>
```

```scss
/* bulk-watering-dialog.component.scss */
.full-width {
  width: 100%;
}
```

## コンポーネント設計

### ダッシュボードコンポーネントの拡張

```typescript
// dashboard.component.ts に追加
import { MatDialog } from '@angular/material/dialog';
import { BulkWateringDialogComponent } from '../dialogs/bulk-watering-dialog/bulk-watering-dialog.component';
import { WorkRecordService } from '../../services/work-record.service';

// DashboardComponent クラス内に追加
constructor(
  // 既存のコンストラクタパラメータ
  private dialog: MatDialog,
  private workRecordService: WorkRecordService
) { }

/**
 * 一括水やりダイアログを表示
 */
showBulkWateringDialog(): void {
  const dialogRef = this.dialog.open(BulkWateringDialogComponent, {
    width: '400px',
    data: {
      description: '一括水やり',
      date: new Date().toISOString()
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.createBulkWateringRecords(result);
    }
  });
}

/**
 * 一括水やり記録を作成
 * 
 * @param data 一括水やりデータ
 */
createBulkWateringRecords(data: { description: string; date: string }): void {
  this.workRecordService.createBulkWateringRecords(data)
    .subscribe({
      next: (response) => {
        // 成功メッセージ表示
        // 例: this.snackBar.open(`${response.recordCount}件の盆栽に水やり記録を作成しました`, '閉じる', { duration: 3000 });
      },
      error: (error) => {
        console.error('一括水やり記録作成エラー:', error);
        // エラーメッセージ表示
        // 例: this.snackBar.open('水やり記録の作成に失敗しました', '閉じる', { duration: 3000 });
      }
    });
}
```

### 一括水やりダイアログコンポーネント

```typescript
// bulk-watering-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-bulk-watering-dialog',
  templateUrl: './bulk-watering-dialog.component.html',
  styleUrls: ['./bulk-watering-dialog.component.scss']
})
export class BulkWateringDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<BulkWateringDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { description: string; date: string }
  ) { }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close(this.data);
  }
}
```

## サービス設計

### WorkRecordService の拡張

```typescript
// work-record.service.ts に追加
/**
 * 一括水やり記録を作成
 * 
 * @param data 一括水やりデータ
 * @returns Observable<{success: boolean, message: string, recordCount: number, records: any[]}>
 */
createBulkWateringRecords(data: { description: string; date: string }): Observable<{success: boolean, message: string, recordCount: number, records: any[]}> {
  return this.apiService.post<{success: boolean, message: string, recordCount: number, records: any[]}>('bulk-watering', data);
}
```

## インタラクション設計

### 一括水やりフロー

1. ユーザーがダッシュボード画面の右下にある一括水やりボタン（水滴アイコン）をクリック
2. 一括水やりダイアログが表示される
   - デフォルトの説明文「一括水やり」が入力されている
   - 現在の日付が表示されている
3. ユーザーが説明文を編集（任意）
4. ユーザーが「水やりを記録」ボタンをクリック
5. APIを通じてバックエンドに一括水やりリクエストが送信される
6. バックエンドですべての盆栽に対して水やり作業記録が作成される
7. 処理結果がフロントエンドに返却される
8. 成功時：成功メッセージ表示（「○件の盆栽に水やり記録を作成しました」）
9. 失敗時：エラーメッセージ表示
