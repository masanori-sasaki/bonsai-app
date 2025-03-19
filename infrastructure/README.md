# Bonsai App - デプロイ手順

このドキュメントでは、Bonsai Appをデプロイする手順について説明します。

## 前提条件

1. AWS CLIがインストールされていること
2. AWS認証情報が設定されていること（アクセスキーとシークレットキー）
3. Node.jsとnpmがインストールされていること

## AWS認証情報の設定

AWS CLIを使用して認証情報を設定します：

```bash
aws configure
```

以下の情報を入力します：
- AWS Access Key ID
- AWS Secret Access Key
- Default region name（例：ap-northeast-1）
- Default output format（json）

## デプロイ手順

### 1. 必要なパッケージのインストール

```bash
npm run deploy:install
```

このコマンドは、デプロイに必要な依存関係（archiver、aws-sdk）をインストールします。

### 2. サーバーコードのデプロイ

```bash
npm run deploy
```

このコマンドは以下の処理を行います：
1. サーバーコードをビルド
2. デプロイパッケージ（ZIP）を作成
3. S3バケットにアップロード
4. CloudFormationスタックをデプロイ

### 3. フロントエンド設定の更新

```bash
npm run update-frontend
```

このコマンドは以下の処理を行います：
1. CloudFormationスタックの出力からLambda Function URLを取得
2. フロントエンドの環境設定ファイル（environment.prod.ts）を更新
3. フロントエンドをビルド

### 4. フロントエンドのデプロイ

```bash
npm run deploy-frontend
```

このコマンドは以下の処理を行います：
1. CloudFormationスタックの出力からフロントエンドS3バケット名を取得
2. ビルドされたフロントエンドファイルをS3バケットにアップロード

### 5. 一括デプロイ

上記の手順2、3、4を一度に実行するには：

```bash
npm run deploy:all
```

## 環境変数

デプロイスクリプトは以下の環境変数を使用します：

| 環境変数 | 説明 | デフォルト値 |
|----------|------|------------|
| ENVIRONMENT | デプロイ環境（dev/prod） | dev |
| AWS_REGION | AWSリージョン | ap-northeast-1 |
| DEPLOYMENT_BUCKET | デプロイパッケージをアップロードするS3バケット | bonsai-app-templates-171278323216 |
| STACK_NAME | CloudFormationスタック名 | BonsaiAppStack |
| ADMIN_EMAIL | 管理者メールアドレス | admin@example.com |

環境変数は以下のように設定できます：

```bash
# Windows
set ENVIRONMENT=prod
set ADMIN_EMAIL=your-email@example.com
npm run deploy:all
  
# PowerShell
$env:ENVIRONMENT = "prod"
$env:ADMIN_EMAIL= "your-email@example.com"

# macOS/Linux
ENVIRONMENT=prod ADMIN_EMAIL=your-email@example.com npm run deploy:all
```

## デプロイ後の確認

デプロイが完了したら、CloudFormationコンソールでスタックの出力を確認できます：

1. AWS Management Consoleにログイン
2. CloudFormationサービスに移動
3. スタック「BonsaiAppStack」を選択
4. 「出力」タブを選択

以下の出力が表示されます：
- ApiEndpoint: Lambda Function URL
- FrontendURL: フロントエンドのS3ウェブサイトURL
- UserPoolId: Cognito User Pool ID
- UserPoolClientId: Cognito User Pool Client ID
- UserPoolDomainName: Cognito User Pool ドメイン名

## トラブルシューティング

### デプロイエラー

1. AWS認証情報が正しく設定されているか確認
2. S3バケットが存在し、アクセス可能か確認
3. CloudFormationテンプレートの構文エラーがないか確認

#### ROLLBACK_FAILED状態のスタック

スタックが`ROLLBACK_FAILED`状態になった場合、更新できません。デプロイスクリプトは自動的にこのようなスタックを検出し、削除して再作成します。

もし手動で対応する必要がある場合：

1. AWSコンソールでCloudFormationサービスに移動
2. 問題のあるスタックを選択
3. 「削除」を選択
4. スタックが完全に削除されるのを待つ
5. 再度デプロイを実行

### Lambda関数エラー

1. CloudWatchログでエラーメッセージを確認
2. 環境変数が正しく設定されているか確認
3. IAMロールに必要な権限があるか確認

### フロントエンド接続エラー

1. environment.prod.tsのapiUrlが正しいか確認
2. CORSの設定が正しいか確認
3. ブラウザのコンソールでエラーメッセージを確認
