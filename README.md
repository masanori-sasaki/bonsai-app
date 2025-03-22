# Bonsai App

盆栽の管理を支援するWebアプリケーション

## 開発環境の準備

### 必要なソフトウェア

- **Node.js**: v16.x以上
- **npm**: v8.x以上（Node.jsに同梱）
- **Angular CLI**: v13.x
- **AWS CLI**: 最新版（デプロイ時のみ必要）

### インストール手順

#### 1. Node.jsのインストール

[Node.js公式サイト](https://nodejs.org/)から、v16.x以上のLTS版をダウンロードしてインストールしてください。

インストール確認:
```bash
node -v
npm -v
```

#### 2. Angular CLIのインストール

```bash
npm install -g @angular/cli@13
```

インストール確認:
```bash
ng version
```

#### 3. AWS CLIのインストール（デプロイ時のみ必要）

[AWS CLI公式ドキュメント](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)の手順に従ってインストールしてください。

インストール確認:
```bash
aws --version
```

### プロジェクトのセットアップ

#### 1. リポジトリのクローン

```bash
git clone <リポジトリURL>
cd bonsai-app
```

#### 2. 依存関係のインストール

すべての依存関係（ルート、クライアント、サーバー）を一度にインストールするには:

```bash
npm run install:all
```

または、個別にインストールする場合:

```bash
# ルートディレクトリの依存関係
npm install

# クライアント側の依存関係
cd client
npm install
cd ..

# サーバー側の依存関係
cd server
npm install
cd ..
```


### 開発サーバーの起動

#### 両方のサーバーを同時に起動（推奨）

```bash
npm run dev
```

このコマンドは、クライアント（Angular）とサーバー（Node.js）の両方を同時に起動します。

#### 個別に起動する場合

クライアント側（Angular）のみ:
```bash
npm run client
# または
cd client
npm run start
```

サーバー側（Node.js）のみ:
```bash
npm run server
# または
cd server
npm run dev
```

### アプリケーションへのアクセス

開発サーバーが起動したら、以下のURLでアプリケーションにアクセスできます:

- **フロントエンド（Angular）**: http://localhost:4200
- **バックエンドAPI（Node.js）**: http://localhost:3000


### トラブルシューティング

開発環境のセットアップや実行時に問題が発生した場合は、以下の対処法を試してください：

1. **npm installエラー**:
   - node_modulesディレクトリを削除して再試行
   ```bash
   # ルートディレクトリで
   rm -rf node_modules
   # または Windows の場合
   rmdir /s /q node_modules
   
   npm install
   ```
   - package-lock.jsonを削除して再試行
   ```bash
   rm package-lock.json
   # または Windows の場合
   del package-lock.json
   
   npm install
   ```

2. **ビルドエラー**:
   - distディレクトリを削除して再試行
   ```bash
   # サーバーディレクトリで
   rm -rf dist
   # または Windows の場合
   rmdir /s /q dist
   
   npm run build
   ```
   - TypeScriptのバージョン互換性を確認
   ```bash
   npm list typescript
   ```

3. **Angular CLIエラー**:
   - Angular CLIのキャッシュをクリア
   ```bash
   ng cache clean
   # または
   npm cache clean --force
   ```
   - Angular CLIを再インストール
   ```bash
   npm uninstall -g @angular/cli
   npm install -g @angular/cli@13
   ```

4. **ポートが既に使用されている場合**:
   - 使用中のポートを確認して、プロセスを終了
   ```bash
   # Linuxの場合
   lsof -i :4200  # Angularのデフォルトポート
   lsof -i :3000  # サーバーのデフォルトポート
   
   # Windowsの場合
   netstat -ano | findstr :4200
   netstat -ano | findstr :3000
   
   # プロセスを終了（PIDはnetstatで確認したもの）
   taskkill /F /PID <PID>
   ```

## デプロイ手順

アプリケーションをAWSにデプロイするには、以下の手順に従ってください。

### 1. 環境変数の設定

デプロイを実行する前に、以下の環境変数を設定してください：

- **AWS_ACCESS_KEY_ID**: AWSアクセスキーID
- **AWS_SECRET_ACCESS_KEY**: AWSシークレットアクセスキー
- **AWS_REGION**: AWSリージョン（例: ap-northeast-1）
- **ADMIN_EMAIL**: 管理者メールアドレス

### 2. デプロイコマンド

```bash
# 本番環境へのデプロイ（mainブランチ）
git push origin main

# 開発環境へのデプロイ（developブランチ）
git push origin develop
```

GitHubのCI/CDパイプラインが設定されており、mainブランチへのプッシュで本番環境に、developブランチへのプッシュで開発環境に自動的にデプロイされます。

### 3. 手動デプロイ（必要な場合）

CI/CDを使用せずに手動でデプロイする場合は、以下のコマンドを使用します：

```bash
# すべてのリソースをデプロイ
npm run deploy:all

# バックエンドのみデプロイ
npm run deploy

# フロントエンドの設定を更新
npm run update-frontend

# フロントエンドのみデプロイ
npm run deploy-frontend
```

## AWS無料枠の制限

このプロジェクトはAWS無料枠の範囲内で運用できるように設計されていますが、以下の制限に注意してください：

- **Lambda**: 毎月100万回の無料リクエスト、400,000 GB秒のコンピューティング時間
- **S3**: 5GBのストレージ、20,000 GET/月、2,000 PUT/月
  - フロントエンド用と画像保存用の2つのバケットに分けて使用
  - 画像は適切に圧縮してアップロードし、ストレージ使用量を最小化
- **DynamoDB**: 25GBのストレージ、読み込み/書き込みキャパシティユニットを最小設定
- **Cognito**: 50,000 MAU（月間アクティブユーザー）
- **CloudFront**: 毎月50GBのデータ転送と2,000,000リクエストが無料
  - セキュリティ強化のために導入
  - S3バケットへの直接アクセスを制限し、HTTPS通信を強制

無料枠を超えないようにするためのヒント：
- 画像は自動的に圧縮されます（2MB以上の画像も段階的圧縮アルゴリズムにより対応可能）
- サポートする画像形式: JPG, PNG, GIF（アニメーションGIFは非推奨）, WebP（推奨：より効率的な圧縮が可能）

## プロジェクト概要

Bonsai Appは、盆栽の管理を支援するWebアプリケーションです。主な機能は以下の通りです：

- **ユーザー認証**: ID/パスワードによるログイン機能
- **盆栽管理**: 盆栽の登録、編集、一覧表示、詳細表示
- **作業記録**: 剪定、植替え、水やり、肥料などの作業記録の管理
- **作業予定**: 今後の作業予定の管理
- **画像管理**: 盆栽や作業の画像アップロード、表示機能

## テスト実行方法とカバレッジ計測

### サーバー側（Node.js/Express）

#### テスト実行方法

サーバー側のテストを実行するには、以下のコマンドを使用します：

```bash
cd server
npm test
```

#### カバレッジ計測方法

テストカバレッジを計測するには、以下のコマンドを使用します：

```bash
cd server
npm run test:coverage
```

このコマンドを実行すると、テストが実行され、カバレッジレポートが生成されます。レポートは `server/coverage/lcov-report/index.html` に生成されます。

#### カバレッジレポートの確認方法

生成されたカバレッジレポートをブラウザで開くには、以下のコマンドを使用します：

```bash
# Windowsの場合
start server\coverage\lcov-report\index.html

# macOS/Linuxの場合
open server/coverage/lcov-report/index.html
```

### クライアント側（Angular）

#### テスト実行方法

クライアント側のテストを実行するには、以下のコマンドを使用します：

```bash
cd client
npm test
```

このコマンドはテストを監視モードで実行します。一度だけ実行する場合は、以下のコマンドを使用します：

```bash
cd client
npm test -- --watch=false
```

#### カバレッジ計測方法

テストカバレッジを計測するには、以下のコマンドを使用します：

```bash
cd client
npm run test:coverage
```

監視モードを無効にしてカバレッジを計測する場合は、以下のコマンドを使用します：

```bash
cd client
npm run test:coverage -- --watch=false
```

ヘッドレスモードでテストを実行する場合は、以下のコマンドを使用します：

```bash
cd client
npm run test:coverage -- --watch=false --browsers=ChromeHeadlessCI
```

#### カバレッジレポートの確認方法

生成されたカバレッジレポートをブラウザで開くには、以下のコマンドを使用します：

```bash
# Windowsの場合
start client\coverage\bonsai-app-client\index.html

# macOS/Linuxの場合
open client/coverage/bonsai-app-client/index.html
```

## カバレッジレポートの見方

カバレッジレポートには、以下の4つの指標が表示されます：

1. **Statements（ステートメント）**: コード内のステートメント（命令文）がテストされた割合
2. **Branches（ブランチ）**: 条件分岐（if文など）がテストされた割合
3. **Functions（関数）**: 関数がテストされた割合
4. **Lines（行）**: コード行がテストされた割合

各ファイルやディレクトリごとのカバレッジ情報も確認できます。カバレッジが低い部分は赤色で、高い部分は緑色で表示されます。

### カバレッジ閾値

プロジェクトでは、以下のカバレッジ閾値が設定されています：

- サーバー側（jest.config.js）:
  - Statements: 80%
  - Branches: 80%
  - Functions: 80%
  - Lines: 80%

- クライアント側（karma.conf.js）:
  - Statements: 80%
  - Branches: 80%
  - Functions: 80%
  - Lines: 80%

## テストカバレッジ向上のためのヒント

1. **未テストのコンポーネントとサービスに対するテストケースの追加**:
   - 特にカバレッジが低いファイルから優先的にテストを追加する
   - コンポーネントテストでは、表示内容や動作の検証を行う
   - サービステストでは、APIとの連携や状態管理の検証を行う

2. **既存のテストケースの拡充**:
   - 特にブランチカバレッジを向上させるため、条件分岐のテストを追加する
   - エラーケースや境界値のテストを追加する

3. **モックとスタブの活用**:
   - 外部依存（API、データベースなど）をモック化してテストを安定させる
   - テスト対象以外の部分をスタブ化して、テスト範囲を限定する

4. **TDD（テスト駆動開発）の実践**:
   - 新機能の追加時には、先にテストを書いてから実装を行う
   - リファクタリング時には、既存のテストが通ることを確認しながら進める

## 参考リンク

- [Angular公式ドキュメント](https://angular.io/docs)
- [AWS無料枠の詳細](https://aws.amazon.com/free/)
- [CloudFormationユーザーガイド](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/)
- [DynamoDBデベロッパーガイド](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/)
- [S3開発者ガイド](https://docs.aws.amazon.com/AmazonS3/latest/dev/Welcome.html)
- [盆栽管理の基本](https://www.bonsaiempire.com/basics/bonsai-care)
