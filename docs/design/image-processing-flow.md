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
    participant CloudFront as CloudFront

    User->>Client: 画像ファイル選択
    Client->>ImageService: 画像ファイル渡し
    ImageService->>ImageService: 画像形式検証（JPG/PNG/GIF/WebP）
    ImageService->>ImageService: 画像リサイズ（最大1200px）
    
    rect rgb(240, 248, 255)
        Note over ImageService: 段階的圧縮処理
        ImageService->>ImageService: 初期品質で圧縮
        
        alt 2MB超の場合
            ImageService->>ImageService: 品質を段階的に下げる
            
            alt 品質を下げても2MB超の場合
                ImageService->>ImageService: WebP形式への変換を試みる
                
                alt WebP変換でも2MB超の場合
                    ImageService->>ImageService: 解像度を縮小して再圧縮
                end
            end
        end
    end
    
    ImageService->>Client: 処理済み画像返却
    Client->>Client: プレビュー表示
    
    alt 保存ボタンクリック時
        Client->>API: 署名付きURL取得リクエスト
        API->>S3: 署名付きURL生成
        S3->>API: 署名付きURL
        API->>Client: 署名付きURLとCloudFront経由のURL返却
        Client->>S3: 署名付きURLを使用して画像を直接アップロード
        S3->>Client: アップロード完了
        Client->>Client: CloudFront経由のURLをデータモデルに設定
        Note over Client,CloudFront: 画像表示時はCloudFront経由でアクセス
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
- WebP圧縮品質: 80%（初期値）
- PNG/GIF圧縮品質: 90%（初期値）
- 2MB超の場合の段階的圧縮アルゴリズム:
  1. 品質を段階的に下げる（最低30%まで）
  2. WebP形式への変換を試みる（ブラウザがサポートしている場合）
  3. 解像度を縮小（元の75%）して再圧縮

### サポート形式
- JPEG/JPG
- PNG
- GIF（アニメーションGIFは非推奨）
- WebP（推奨：より効率的な圧縮が可能）

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
5. CloudFrontキャッシュの問題（新しい画像が即時に反映されない場合）
6. CloudFrontディストリビューションの設定エラー

各エラーケースに対して、ユーザーフレンドリーなエラーメッセージを表示します。

### CloudFrontに関する考慮事項

1. **キャッシュ無効化**: 画像が更新された場合、CloudFrontのキャッシュを無効化する必要があります。
2. **URL形式**: CloudFront経由のURLは、S3の直接URLとは異なる形式になります。
3. **エラーレスポンス**: CloudFrontでエラーが発生した場合（403、404など）のカスタムエラーレスポンスを設定します。
4. **セキュリティ**: CloudFrontを使用してHTTPS通信を強制し、S3バケットへの直接アクセスを制限します。
