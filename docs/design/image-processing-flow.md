# 画像処理フロー

このドキュメントでは、Bonsai App（盆栽管理アプリ）における画像処理のフローを定義します。

## 画像アップロードフロー

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Client as クライアントアプリ
    participant ImageService as 画像処理サービス
    participant API as API Gateway/Lambda
    participant S3 as S3バケット

    User->>Client: 画像ファイル選択
    Client->>ImageService: 画像ファイル渡し
    ImageService->>ImageService: 画像形式検証（JPG/PNG/GIF）
    ImageService->>ImageService: 画像リサイズ（最大1200px）
    ImageService->>ImageService: 画像圧縮（最大2MB）
    ImageService->>Client: 処理済み画像返却
    Client->>Client: プレビュー表示
    
    alt 保存ボタンクリック時
        Client->>API: 署名付きURL取得リクエスト
        API->>S3: 署名付きURL生成
        S3->>API: 署名付きURL
        API->>Client: 署名付きURLと公開URL返却
        Client->>S3: 署名付きURLを使用して画像を直接アップロード
        S3->>Client: アップロード完了
        Client->>Client: 公開URLをデータモデルに設定
    end
```

## 画像処理仕様

### リサイズ仕様
- 最大幅/高さ: 1200px
- アスペクト比は維持
- 元画像が小さい場合は拡大しない

### 圧縮仕様
- 最大ファイルサイズ: 2MB
- JPEG圧縮品質: 70%（初期値）
- PNG/GIF圧縮品質: 90%（初期値）
- 2MB超の場合、段階的に圧縮品質を下げる

### サポート形式
- JPEG/JPG
- PNG
- GIF（アニメーションGIFは非推奨）

## 将来的な拡張性

現在は1枚の画像のみサポートしていますが、将来的には複数画像のアップロードをサポートする予定です。その際には以下の変更が必要になります：

1. UIの拡張（複数画像のプレビューとアップロード）
2. 画像の並べ替え機能
3. サムネイル生成機能（必要に応じて）

## エラーハンドリング

画像アップロード処理では以下のエラーケースを考慮します：

1. 非対応ファイル形式
2. サイズ超過（圧縮後も2MBを超える場合）
3. アップロード失敗（ネットワークエラーなど）
4. S3バケットへのアクセス権限エラー

各エラーケースに対して、ユーザーフレンドリーなエラーメッセージを表示します。
