# UI イベント定義

このドキュメントでは、Bonsai App（盆栽管理アプリ）のユーザーインターフェースで発生するイベントとその処理フローを定義します。

## 目次

1. [認証関連イベント](#認証関連イベント)
2. [ナビゲーションイベント](#ナビゲーションイベント)
3. [盆栽管理イベント](#盆栽管理イベント)
4. [作業記録イベント](#作業記録イベント)
5. [作業予定イベント](#作業予定イベント)
6. [通知イベント](#通知イベント)

## 認証関連イベント

### サインアップ

**イベント名**: `SIGNUP`

**トリガー**: ユーザーがサインアップフォームを送信したとき

**データ**:
```typescript
{
  email: string;
  password: string;
  name: string;
}
```

**処理フロー**:
1. 入力バリデーション
2. Cognito User Poolにユーザー登録リクエスト送信
3. 確認コード入力画面への遷移

### サインイン

**イベント名**: `SIGNIN`

**トリガー**: ユーザーがサインインフォームを送信したとき

**データ**:
```typescript
{
  email: string;
  password: string;
}
```

**処理フロー**:
1. 入力バリデーション
2. Cognito User Poolに認証リクエスト送信
3. 認証成功時：ダッシュボードへリダイレクト
4. 認証失敗時：エラーメッセージ表示

### サインアウト

**イベント名**: `SIGNOUT`

**トリガー**: ユーザーがサインアウトボタンをクリックしたとき

**データ**: なし

**処理フロー**:
1. Cognitoセッションのクリア
2. ローカルストレージのクリア
3. ログイン画面へのリダイレクト

## ナビゲーションイベント

### ページ遷移

**イベント名**: `NAVIGATE`

**トリガー**: ユーザーがナビゲーションリンクをクリックしたとき

**データ**:
```typescript
{
  path: string;
  params?: Record<string, string>;
}
```

**処理フロー**:
1. 現在のルートと遷移先ルートが同じ場合は何もしない
2. 認証が必要なルートの場合、認証状態を確認
3. 認証されていない場合はログイン画面にリダイレクト
4. 認証されている場合は指定されたルートに遷移

### タブ切り替え

**イベント名**: `CHANGE_TAB`

**トリガー**: ユーザーがタブをクリックしたとき

**データ**:
```typescript
{
  tabId: string;
}
```

**処理フロー**:
1. 選択されたタブをアクティブに設定
2. タブに関連するコンテンツを表示

## 盆栽管理イベント

### 盆栽登録

**イベント名**: `CREATE_BONSAI`

**トリガー**: ユーザーが盆栽登録フォームを送信したとき

**データ**:
```typescript
{
  name: string;
  species: string;
  registrationDate: string;
  history?: string;
  imageFiles?: File[];
}
```

**処理フロー**:
1. データバリデーション
2. 画像ファイルがある場合、S3にアップロード
3. APIを通じてバックエンドに盆栽データ作成リクエスト送信
4. 成功時：成功メッセージ表示、ダッシュボードの更新
5. 失敗時：エラーメッセージ表示

### 盆栽編集モード遷移

**イベント名**: `EDIT_BONSAI`

**トリガー**: ユーザーが盆栽詳細画面で編集ボタンをクリックしたとき

**データ**:
```typescript
{
  id: string;
}
```

**処理フロー**:
1. 盆栽編集ページ（/bonsai/:id/edit）に遷移
2. 編集モードで盆栽詳細コンポーネントを表示
3. 盆栽データを編集可能なフォームで表示

### 盆栽詳細画面での最新作業記録表示

**イベント名**: `VIEW_RECENT_WORK_RECORDS`

**トリガー**: ユーザーが盆栽詳細画面の基本情報タブを表示したとき、または最新の作業記録項目をクリックしたとき

**データ**:
```typescript
{
  bonsaiId: string;
  recordId?: string; // クリックした場合のみ
}
```

**処理フロー**:
1. 基本情報タブ表示時：最新の作業記録3件を表示
2. 作業記録項目クリック時：対応する作業記録詳細ページに遷移

### 盆栽詳細画面での作業記録タブ表示

**イベント名**: `VIEW_WORK_RECORDS_TAB`

**トリガー**: ユーザーが盆栽詳細画面の作業記録タブをクリックしたとき

**データ**:
```typescript
{
  bonsaiId: string;
}
```

**処理フロー**:
1. 作業記録タブがクリックされたとき、盆栽IDに紐づくすべての作業記録を取得
2. 取得した作業記録を日付の降順でソートして表示
3. 作業記録項目クリック時：対応する作業記録詳細ページに遷移

### 盆栽詳細画面での作業予定タブ表示

**イベント名**: `VIEW_WORK_SCHEDULES_TAB`

**トリガー**: ユーザーが盆栽詳細画面の作業予定タブをクリックしたとき

**データ**:
```typescript
{
  bonsaiId: string;
}
```

**処理フロー**:
1. 作業予定タブがクリックされたとき、盆栽IDに紐づくすべての作業予定を取得
2. 取得した作業予定を予定日の昇順でソートして表示
3. 作業予定項目クリック時：対応する作業予定詳細ページに遷移

### 盆栽情報更新

**イベント名**: `UPDATE_BONSAI`

**トリガー**: ユーザーが盆栽編集フォームを送信したとき

**データ**:
```typescript
{
  id: string;
  name?: string;
  species?: string;
  registrationDate?: string;
  history?: string;
  imageFiles?: File[];
  removeImageUrls?: string[];
}
```

**処理フロー**:
1. データバリデーション
2. 新しい画像ファイルがある場合、S3にアップロード
3. 削除する画像がある場合、S3から削除リクエスト
4. APIを通じてバックエンドに盆栽データ更新リクエスト送信
5. 成功時：成功メッセージ表示、盆栽詳細表示に戻る
6. 失敗時：エラーメッセージ表示、編集モードを維持

### 盆栽削除

**イベント名**: `DELETE_BONSAI`

**トリガー**: ユーザーが盆栽削除ボタンをクリックし、確認ダイアログで確認したとき

**データ**:
```typescript
{
  id: string;
}
```

**処理フロー**:
1. 削除確認ダイアログ表示
2. 確認後、APIを通じてバックエンドに盆栽削除リクエスト送信
3. 成功時：成功メッセージ表示、ダッシュボードへリダイレクト
4. 失敗時：エラーメッセージ表示

## 作業記録イベント

### 作業記録登録

**イベント名**: `CREATE_WORK_RECORD`

**トリガー**: ユーザーが作業記録フォームを送信したとき

**データ**:
```typescript
{
  bonsaiId: string;
  workTypes: ('pruning' | 'repotting' | 'watering' | 'fertilizing' |'wire'|'wireremove'|'leafpull'|'leafcut'|'leafpeel'|'disinfection'|'carving'|'replant'|'protection'| 'other')[]; // 作業タイプ（剪定、植替え、水やり、肥料、針金かけ、針金はずし、芽摘み、芽切り、葉透かし、消毒、彫刻、改作、その他）の配列
  date: string;
  description: string;
  imageFiles?: File[];
  
  // カレンダー機能用の拡張プロパティ
  isAllDay?: boolean;
  startTime?: string;  // HH:mm形式
  endTime?: string;    // HH:mm形式
  priority?: 'high' | 'medium' | 'low';
  colorCode?: string;  // CSS色コード
}
```

**処理フロー**:
1. データバリデーション
2. 画像ファイルがある場合、S3にアップロード
3. カレンダー拡張情報を含めてAPIを通じてバックエンドに作業記録作成リクエスト送信
4. 成功時：成功メッセージ表示、作業記録一覧の更新
5. 失敗時：エラーメッセージ表示

### 作業記録更新

**イベント名**: `UPDATE_WORK_RECORD`

**トリガー**: ユーザーが作業記録編集フォームを送信したとき

**データ**:
```typescript
{
  id: string;
  workTypes?: ('pruning' | 'repotting' | 'watering' | 'fertilizing' |'wire'|'wireremove'|'leafpull'|'leafcut'|'leafpeel'|'disinfection'|'carving'|'replant'|'protection'| 'other')[];
  date?: string;
  description?: string;
  imageFiles?: File[];
  removeImageUrls?: string[];
  
  // カレンダー機能用の拡張プロパティ
  isAllDay?: boolean;
  startTime?: string;  // HH:mm形式
  endTime?: string;    // HH:mm形式
  priority?: 'high' | 'medium' | 'low';
  colorCode?: string;  // CSS色コード
}
```

**処理フロー**:
1. データバリデーション
2. 新しい画像ファイルがある場合、S3にアップロード
3. 削除する画像がある場合、S3から削除リクエスト
4. カレンダー拡張情報を含めてAPIを通じてバックエンドに作業記録更新リクエスト送信
5. 成功時：成功メッセージ表示、作業記録詳細表示の更新
6. 失敗時：エラーメッセージ表示

### 作業記録削除

**イベント名**: `DELETE_WORK_RECORD`

**トリガー**: ユーザーが作業記録削除ボタンをクリックし、確認ダイアログで確認したとき

**データ**:
```typescript
{
  id: string;
}
```

**処理フロー**:
1. 削除確認ダイアログ表示
2. 確認後、APIを通じてバックエンドに作業記録削除リクエスト送信
3. 成功時：成功メッセージ表示、作業記録一覧の更新
4. 失敗時：エラーメッセージ表示

## 作業予定イベント

### 作業予定登録

**イベント名**: `CREATE_WORK_SCHEDULE`

**トリガー**: ユーザーが作業予定フォームを送信したとき

**データ**:
```typescript
{
  bonsaiId: string;
  workTypes: ('pruning' | 'repotting' | 'watering' | 'fertilizing' |'wire'|'wireremove'|'leafpull'|'leafcut'|'leafpeel'|'disinfection'|'carving'|'replant'|'protection'| 'other')[];
  scheduledDate: string;
  description: string;
  
  // カレンダー機能用の拡張プロパティ
  isAllDay?: boolean;
  startTime?: string;  // HH:mm形式
  endTime?: string;    // HH:mm形式
  priority?: 'high' | 'medium' | 'low';
  colorCode?: string;  // CSS色コード
  
  // 繰り返しパターン
  recurrencePattern?: {
    type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
    interval: number;
    endDate?: string;
    occurrences?: number;
    weekDays?: number[];
    monthDay?: number;
  };
  
  // リマインダー
  reminderDays?: number;  // 予定日の何日前に通知するか
}
```

**処理フロー**:
1. データバリデーション
2. カレンダー拡張情報、繰り返しパターン、リマインダー設定を含めてAPIを通じてバックエンドに作業予定作成リクエスト送信
3. 成功時：成功メッセージ表示、作業予定一覧の更新
4. 失敗時：エラーメッセージ表示

### 作業予定更新

**イベント名**: `UPDATE_WORK_SCHEDULE`

**トリガー**: ユーザーが作業予定編集フォームを送信したとき、または完了チェックボックスをクリックしたとき

**データ**:
```typescript
{
  id: string;
  workTypes?: ('pruning' | 'repotting' | 'watering' | 'fertilizing' |'wire'|'wireremove'|'leafpull'|'leafcut'|'leafpeel'|'disinfection'|'carving'|'replant'|'protection'| 'other')[];
  scheduledDate?: string;
  description?: string;
  completed?: boolean;
  
  // カレンダー機能用の拡張プロパティ
  isAllDay?: boolean;
  startTime?: string;  // HH:mm形式
  endTime?: string;    // HH:mm形式
  priority?: 'high' | 'medium' | 'low';
  colorCode?: string;  // CSS色コード
  
  // 繰り返しパターン
  recurrencePattern?: {
    type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
    interval: number;
    endDate?: string;
    occurrences?: number;
    weekDays?: number[];
    monthDay?: number;
  };
  
  // リマインダー
  reminderDays?: number;  // 予定日の何日前に通知するか
}
```

**処理フロー**:
1. データバリデーション
2. カレンダー拡張情報、繰り返しパターン、リマインダー設定を含めてAPIを通じてバックエンドに作業予定更新リクエスト送信
3. 成功時：成功メッセージ表示、作業予定一覧の更新
4. 失敗時：エラーメッセージ表示
5. 完了に変更された場合、作業記録作成の提案ダイアログを表示

### 作業予定削除

**イベント名**: `DELETE_WORK_SCHEDULE`

**トリガー**: ユーザーが作業予定削除ボタンをクリックし、確認ダイアログで確認したとき

**データ**:
```typescript
{
  id: string;
}
```

**処理フロー**:
1. 削除確認ダイアログ表示
2. 確認後、APIを通じてバックエンドに作業予定削除リクエスト送信
3. 成功時：成功メッセージ表示、作業予定一覧の更新
4. 失敗時：エラーメッセージ表示

## 通知イベント

### 通知表示

**イベント名**: `SHOW_NOTIFICATION`

**トリガー**: システムまたはユーザーアクションの結果として通知が必要なとき

**データ**:
```typescript
{
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number; // ミリ秒単位、デフォルト: 3000
}
```

**処理フロー**:
1. 通知コンポーネントに通知データを渡す
2. 指定された期間（または既定値）通知を表示
3. 期間経過後、通知を自動的に閉じる

### モーダル表示

**イベント名**: `SHOW_MODAL`

**トリガー**: システムまたはユーザーアクションの結果としてモーダルダイアログが必要なとき

**データ**:
```typescript
{
  title: string;
  content: string | Component;
  actions: Array<{
    label: string;
    handler: () => void;
    primary?: boolean;
  }>;
}
```

**処理フロー**:
1. モーダルコンポーネントにデータを渡す
2. モーダルを表示
3. ユーザーのアクション（ボタンクリックなど）に応じて指定されたハンドラを実行
4. モーダルを閉じる
