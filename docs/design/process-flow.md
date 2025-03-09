# 処理フロー

このドキュメントでは、Bonsai App（盆栽管理アプリ）の主要な処理フローを定義します。

## 目次

1. [認証フロー](#認証フロー)
2. [盆栽管理フロー](#盆栽管理フロー)
3. [作業記録管理フロー](#作業記録管理フロー)
4. [作業予定管理フロー](#作業予定管理フロー)

## 認証フロー

### サインアップフロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Client as クライアントアプリ
    participant Cognito as Amazon Cognito
    participant Lambda as Lambda関数
    participant DynamoDB as DynamoDB

    User->>Client: サインアップフォーム入力
    Client->>Client: 入力バリデーション
    Client->>Cognito: サインアップリクエスト
    Cognito->>Cognito: ユーザー作成
    Cognito->>User: 確認コード送信（メール）
    User->>Client: 確認コード入力
    Client->>Cognito: コード検証リクエスト
    Cognito->>Cognito: ユーザー確認
    Cognito->>Lambda: ポストサインアップトリガー
    Lambda->>DynamoDB: ユーザープロファイル作成
    Lambda->>Cognito: 処理完了
    Cognito->>Client: サインアップ完了
    Client->>User: ログイン画面表示
```

### サインインフロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Client as クライアントアプリ
    participant Cognito as Amazon Cognito
    participant API as API Gateway/Lambda

    User->>Client: ログイン情報入力
    Client->>Client: 入力バリデーション
    Client->>Cognito: 認証リクエスト
    Cognito->>Cognito: 認証処理
    alt 認証成功
        Cognito->>Client: トークン返却（ID, Access, Refresh）
        Client->>Client: トークン保存
        Client->>API: プロファイル取得リクエスト（IDトークン付き）
        API->>Client: ユーザープロファイル
        Client->>User: ダッシュボード表示
    else 認証失敗
        Cognito->>Client: エラーレスポンス
        Client->>User: エラーメッセージ表示
    end
```

### トークンリフレッシュフロー

```mermaid
sequenceDiagram
    participant Client as クライアントアプリ
    participant Cognito as Amazon Cognito
    
    Client->>Client: アクセストークン有効期限チェック
    alt トークン期限切れ
        Client->>Cognito: リフレッシュトークンでトークン更新リクエスト
        Cognito->>Cognito: リフレッシュトークン検証
        alt リフレッシュトークン有効
            Cognito->>Client: 新しいトークン返却
            Client->>Client: 新トークン保存
        else リフレッシュトークン無効
            Cognito->>Client: エラーレスポンス
            Client->>Client: ログアウト処理
            Client->>Client: ログイン画面へリダイレクト
        end
    end
```

## 盆栽管理フロー

### 盆栽登録フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Client as クライアントアプリ
    participant ImageService as 画像処理サービス
    participant API as API Gateway/Lambda
    participant S3 as S3バケット
    participant DynamoDB as DynamoDB

    User->>Client: 盆栽登録フォーム入力
    User->>Client: 画像ファイル選択
    Client->>ImageService: 画像ファイル渡し
    ImageService->>ImageService: 画像形式検証（JPG/PNG/GIF）
    ImageService->>ImageService: 画像リサイズ・圧縮
    ImageService->>Client: 処理済み画像返却
    Client->>Client: 画像プレビュー表示
    Client->>Client: 入力バリデーション
    User->>Client: 保存ボタンクリック
    
    alt 画像アップロードあり
        Client->>API: 署名付きURL取得リクエスト
        API->>Client: 署名付きURLと公開URL返却
        Client->>S3: 署名付きURLを使用して画像を直接アップロード
        S3->>Client: アップロード完了
        Client->>Client: 公開URLを盆栽データに設定
    end
    
    Client->>API: 盆栽登録リクエスト
    API->>DynamoDB: 盆栽データ保存
    DynamoDB->>API: 保存確認
    API->>Client: 登録完了レスポンス
    Client->>User: 成功メッセージ表示
    Client->>Client: ダッシュボード更新
```

### 盆栽編集モード遷移フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Client as クライアントアプリ
    participant Router as Angularルーター
    participant Component as 盆栽詳細コンポーネント

    User->>Client: 盆栽詳細画面で編集ボタンをクリック
    Client->>Router: /bonsai/:id/edit へのナビゲーション
    Router->>Component: 盆栽詳細コンポーネントを編集モードで表示
    Component->>Component: URLから編集モードを検出
    Component->>Component: 編集フォームを表示
    Component->>User: 編集可能な盆栽情報を表示
```

### 盆栽情報更新フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Client as クライアントアプリ
    participant ImageService as 画像処理サービス
    participant API as API Gateway/Lambda
    participant S3 as S3バケット
    participant DynamoDB as DynamoDB
    participant Router as Angularルーター

    User->>Client: 編集フォームで盆栽情報を編集
    User->>Client: 画像ファイル選択/変更
    Client->>ImageService: 画像ファイル渡し
    ImageService->>ImageService: 画像形式検証（JPG/PNG/GIF/WebP）
    ImageService->>ImageService: 画像リサイズ・圧縮
    ImageService->>Client: 処理済み画像返却
    Client->>Client: 画像プレビュー表示
    User->>Client: 保存ボタンをクリック
    Client->>Client: 入力バリデーション
    
    alt 新しい画像アップロードあり
        Client->>API: 署名付きURL取得リクエスト
        API->>Client: 署名付きURLと公開URL返却
        Client->>S3: 署名付きURLを使用して画像を直接アップロード
        S3->>Client: アップロード完了
        Client->>Client: 公開URLを盆栽データに設定
    end
    
    Client->>API: 盆栽更新リクエスト
    API->>DynamoDB: 現在の盆栽データ取得
    DynamoDB->>API: 盆栽データ
    API->>DynamoDB: 盆栽データ更新
    DynamoDB->>API: 更新確認
    API->>Client: 更新完了レスポンス
    Client->>Router: /bonsai/:id へのナビゲーション（詳細表示モードに戻る）
    Client->>User: 成功メッセージ表示
    Client->>Client: 盆栽情報更新
```

## 作業記録管理フロー

### 作業記録登録フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Client as クライアントアプリ
    participant ImageService as 画像処理サービス
    participant API as API Gateway/Lambda
    participant S3 as S3バケット
    participant DynamoDB as DynamoDB

    User->>Client: 作業記録フォーム入力
    User->>Client: 作業タイプ、日付、内容入力
    User->>Client: カレンダー機能用の拡張情報入力
    note right of User: 終日イベントフラグ、開始/終了時間、優先度など
    User->>Client: 画像ファイル選択
    Client->>ImageService: 画像ファイル渡し
    ImageService->>ImageService: 画像形式検証（JPG/PNG/GIF/WebP）
    ImageService->>ImageService: 画像リサイズ・圧縮
    ImageService->>Client: 処理済み画像返却
    Client->>Client: 画像プレビュー表示
    Client->>Client: 入力バリデーション
    User->>Client: 保存ボタンクリック
    
    alt 画像アップロードあり
        Client->>API: 署名付きURL取得リクエスト
        API->>Client: 署名付きURLと公開URL返却
        Client->>S3: 署名付きURLを使用して画像を直接アップロード
        S3->>Client: アップロード完了
        Client->>Client: 公開URLを作業記録データに設定
    end
    
    Client->>API: 作業記録登録リクエスト（カレンダー拡張情報含む）
    API->>DynamoDB: 盆栽存在確認
    DynamoDB->>API: 盆栽情報
    API->>DynamoDB: 作業記録データ保存
    DynamoDB->>API: 保存確認
    API->>Client: 登録完了レスポンス
    Client->>User: 成功メッセージ表示
    Client->>Client: 作業記録一覧更新
```

### 作業記録更新フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Client as クライアントアプリ
    participant ImageService as 画像処理サービス
    participant API as API Gateway/Lambda
    participant S3 as S3バケット
    participant DynamoDB as DynamoDB

    User->>Client: 作業記録編集
    User->>Client: 画像ファイル選択/変更
    Client->>ImageService: 画像ファイル渡し
    ImageService->>ImageService: 画像形式検証（JPG/PNG/GIF）
    ImageService->>ImageService: 画像リサイズ・圧縮
    ImageService->>Client: 処理済み画像返却
    Client->>Client: 画像プレビュー表示
    Client->>Client: 入力バリデーション
    User->>Client: 保存ボタンクリック
    
    alt 新しい画像アップロードあり
        Client->>API: 署名付きURL取得リクエスト
        API->>Client: 署名付きURLと公開URL返却
        Client->>S3: 署名付きURLを使用して画像を直接アップロード
        S3->>Client: アップロード完了
        Client->>Client: 公開URLを作業記録データに設定
    end
    
    Client->>API: 作業記録更新リクエスト
    API->>DynamoDB: 現在の作業記録取得
    DynamoDB->>API: 作業記録データ
    API->>DynamoDB: 作業記録データ更新
    DynamoDB->>API: 更新確認
    API->>Client: 更新完了レスポンス
    Client->>User: 成功メッセージ表示
    Client->>Client: 作業記録情報更新
```

## 作業予定管理フロー

### 作業予定登録フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Client as クライアントアプリ
    participant API as API Gateway/Lambda
    participant DynamoDB as DynamoDB

    User->>Client: 作業予定フォーム入力
    User->>Client: 作業タイプ、予定日、内容入力
    User->>Client: カレンダー機能用の拡張情報入力
    note right of User: 終日イベントフラグ、開始/終了時間、優先度
    User->>Client: 繰り返しパターン設定
    note right of User: 繰り返しタイプ、間隔、終了条件など
    User->>Client: リマインダー設定
    note right of User: 何日前に通知するかなど
    Client->>Client: 入力バリデーション
    Client->>API: 作業予定登録リクエスト（カレンダー拡張情報含む）
    API->>DynamoDB: 盆栽存在確認
    DynamoDB->>API: 盆栽情報
    API->>DynamoDB: 作業予定データ保存
    DynamoDB->>API: 保存確認
    API->>Client: 登録完了レスポンス
    Client->>User: 成功メッセージ表示
    Client->>Client: 作業予定一覧更新
```

### 作業予定更新フロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Client as クライアントアプリ
    participant API as API Gateway/Lambda
    participant DynamoDB as DynamoDB

    User->>Client: 作業予定編集/完了マーク
    Client->>Client: 入力バリデーション
    Client->>API: 作業予定更新リクエスト
    API->>DynamoDB: 現在の作業予定取得
    DynamoDB->>API: 作業予定データ
    API->>DynamoDB: 作業予定データ更新
    DynamoDB->>API: 更新確認
    
    alt 作業予定が完了に変更された場合
        API->>Client: 作業記録作成提案
        alt ユーザーが作業記録作成を選択
            Client->>Client: 作業記録フォーム表示（予定データ初期入力）
        end
    end
    
    API->>Client: 更新完了レスポンス
    Client->>User: 成功メッセージ表示
    Client->>Client: 作業予定情報更新
```
