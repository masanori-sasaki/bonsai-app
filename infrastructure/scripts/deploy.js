/**
 * Bonsai App - Lambda デプロイスクリプト
 * 
 * このスクリプトは以下の処理を行います：
 * 1. サーバーコードをビルド
 * 2. デプロイパッケージ（ZIP）を作成
 * 3. S3バケットにアップロード
 * 4. CloudFormationスタックをデプロイ
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const archiver = require('archiver');

// 設定
const config = {
  environment: process.env.ENVIRONMENT || 'dev',
  region: process.env.AWS_REGION || 'ap-northeast-1',
  s3Bucket: process.env.DEPLOYMENT_BUCKET || 'bonsai-app-templates-171278323216',
  stackName: process.env.STACK_NAME || `BonsaiAppStack-${process.env.ENVIRONMENT || 'dev'}`,
  adminEmail: process.env.ADMIN_EMAIL || 'example@example.com'
};

console.log('デプロイ設定:');
console.log(`- 環境: ${config.environment}`);
console.log(`- リージョン: ${config.region}`);
console.log(`- S3バケット: ${config.s3Bucket}`);
console.log(`- スタック名: ${config.stackName}`);
console.log(`- 管理者メール: ${config.adminEmail}`);

// パス設定
const rootDir = path.resolve(__dirname, '..', '..');
const serverDir = path.join(rootDir, 'server');
const distDir = path.join(serverDir, 'dist');
const packageDir = path.join(rootDir, 'infrastructure', 'package');
const zipPath = path.join(packageDir, 'lambda-package.zip');
const templateDir = path.join(rootDir, 'infrastructure', 'cloudformation');

// S3クライアント初期化
const s3 = new AWS.S3({ region: config.region });
const cloudformation = new AWS.CloudFormation({ region: config.region });

/**
 * サーバーコードをビルド
 */
function buildServerCode() {
  console.log('サーバーコードをビルドしています...');
  execSync('npm run lambda:build', { cwd: serverDir, stdio: 'inherit' });
  console.log('ビルド完了');
}

/**
 * デプロイパッケージ（ZIP）を作成
 */
function createDeploymentPackage() {
  console.log('デプロイパッケージを作成しています...');
  
  // パッケージディレクトリを作成
  if (!fs.existsSync(packageDir)) {
    fs.mkdirSync(packageDir, { recursive: true });
  }
  
  // 既存のZIPファイルを削除
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
  
  // package.jsonをコピー
  const packageJson = require(path.join(serverDir, 'package.json'));
  
  // 開発依存関係を削除
  delete packageJson.devDependencies;
  
  // スクリプトを最小限に
  packageJson.scripts = {
    start: 'node index.js'
  };
  
  // node_modulesをコピー（開発依存関係を除く）
  console.log('依存関係をインストールしています...');
  const tempDir = path.join(packageDir, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // package.jsonを一時ディレクトリに書き込み
  fs.writeFileSync(
    path.join(tempDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // 本番依存関係のみインストール
  execSync('npm install --production', { cwd: tempDir, stdio: 'inherit' });
  
  // ZIPファイルを作成
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // 最大圧縮レベル
    });
    
    output.on('close', () => {
      console.log(`デプロイパッケージを作成しました: ${archive.pointer()} bytes`);
      resolve();
    });
    
    archive.on('error', (err) => {
      reject(err);
    });
    
    archive.pipe(output);
    
    // distディレクトリの内容を追加
    archive.directory(distDir, false);
    
    // node_modulesを追加
    archive.directory(path.join(tempDir, 'node_modules'), 'node_modules');
    
    archive.finalize();
  });
}

/**
 * S3バケットにデプロイパッケージをアップロード
 */
async function uploadToS3() {
  console.log(`S3バケット ${config.s3Bucket} にアップロードしています...`);
  
  const fileContent = fs.readFileSync(zipPath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const s3Key = `${config.environment}/lambda-package-${timestamp}.zip`;
  
  const params = {
    Bucket: config.s3Bucket,
    Key: s3Key,
    Body: fileContent
  };
  
  try {
    await s3.upload(params).promise();
    console.log(`アップロード完了: s3://${config.s3Bucket}/${s3Key}`);
    
    // グローバル変数に保存して、後でテンプレート更新時に使用
    global.lambdaPackageS3Key = s3Key;
    
    return s3Key;
  } catch (error) {
    console.error('S3アップロードエラー:', error);
    throw error;
  }
}

/**
 * CloudFormationテンプレートをS3にアップロード
 */
async function uploadTemplates() {
  console.log('CloudFormationテンプレートをアップロードしています...');
  
  const templates = ['main.yml', 'api.yml', 'auth.yml', 'storage.yml', 'monthly-report-scheduler.yml'];
  const timestamp = new Date().toISOString();
  
  for (const template of templates) {
    let fileContent = fs.readFileSync(path.join(templateDir, template), 'utf8');
    
    // api.ymlの場合、タイムスタンププレースホルダーとLambdaパッケージのS3キーを置換
    if (template === 'api.yml') {
      fileContent = fileContent.replace(/#{Timestamp}/g, timestamp);
      console.log(`テンプレートにタイムスタンプを設定しました: ${timestamp}`);
      
      // Lambda パッケージの S3 キーを置換
      if (global.lambdaPackageS3Key) {
        // CloudFormation テンプレートの構文に合わせて修正
        fileContent = fileContent.replace(/S3Key: !Sub \${Environment}\/lambda-package\.zip/, `S3Key: "${global.lambdaPackageS3Key}"`);
        console.log(`Lambda パッケージの S3 キーを設定しました: ${global.lambdaPackageS3Key}`);
      }
    }
    
    const s3Key = template;
    
    const params = {
      Bucket: config.s3Bucket,
      Key: s3Key,
      Body: fileContent
    };
    
    try {
      await s3.upload(params).promise();
      console.log(`テンプレートをアップロードしました: ${template}`);
    } catch (error) {
      console.error(`テンプレート ${template} のアップロードエラー:`, error);
      throw error;
    }
  }
}

/**
 * CloudFormationスタックの状態を確認
 */
async function checkStackStatus(stackName) {
  try {
    const response = await cloudformation.describeStacks({
      StackName: stackName
    }).promise();
    
    if (response.Stacks && response.Stacks.length > 0) {
      return response.Stacks[0].StackStatus;
    }
    return null;
  } catch (error) {
    if (error.message.includes('does not exist')) {
      return 'DOES_NOT_EXIST';
    }
    throw error;
  }
}

/**
 * 指定した時間（ミリ秒）待機する
 */
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * CloudFormationスタックを削除
 */
async function deleteStack(stackName) {
  console.log(`スタック ${stackName} を削除しています...`);
  
  try {
    await cloudformation.deleteStack({
      StackName: stackName
    }).promise();
    
    console.log('スタックの削除を開始しました。完了までお待ちください...');
    
    // スタックが完全に削除されるまで待機
    let stackStatus = await checkStackStatus(stackName);
    let retryCount = 0;
    const maxRetries = 30; // 最大30回（5分）試行
    
    while (stackStatus !== 'DOES_NOT_EXIST' && retryCount < maxRetries) {
      console.log(`現在のスタック状態: ${stackStatus} (試行: ${retryCount + 1}/${maxRetries})`);
      
      if (stackStatus && stackStatus.includes('FAILED')) {
        console.warn('スタックの削除に問題が発生しました。再試行します...');
        
        // 削除に失敗した場合、再度削除を試みる
        try {
          await cloudformation.deleteStack({
            StackName: stackName
          }).promise();
          console.log('スタックの削除を再試行しました。');
        } catch (deleteError) {
          console.warn('スタックの削除再試行中にエラーが発生しました:', deleteError.message);
        }
      }
      
      // 10秒待機
      await sleep(10000);
      retryCount++;
      
      try {
        stackStatus = await checkStackStatus(stackName);
      } catch (error) {
        console.warn('スタック状態の確認中にエラーが発生しました:', error.message);
        if (error.message.includes('does not exist')) {
          stackStatus = 'DOES_NOT_EXIST';
        }
      }
    }
    
    if (stackStatus === 'DOES_NOT_EXIST') {
      console.log('スタックの削除が完了しました');
      
      // 削除完了後、少し待機してAWSのシステムが完全に状態を更新するのを待つ
      console.log('AWS側の状態更新を待機しています（30秒）...');
      await sleep(30000);
      
      return true;
    } else {
      console.error(`スタックの削除がタイムアウトしました。現在の状態: ${stackStatus}`);
      return false;
    }
  } catch (error) {
    console.error('スタック削除エラー:', error);
    return false;
  }
}

/**
 * CloudFormationスタックをデプロイ
 */
async function deployCloudFormationStack() {
  console.log(`CloudFormationスタック ${config.stackName} をデプロイしています...`);
  
  const templateUrl = `https://${config.s3Bucket}.s3.${config.region}.amazonaws.com/main.yml`;
  
  const params = {
    StackName: config.stackName,
    TemplateURL: templateUrl,
    Capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'],
    Parameters: [
      {
        ParameterKey: 'Environment',
        ParameterValue: config.environment
      },
      {
        ParameterKey: 'AdminEmail',
        ParameterValue: config.adminEmail
      }
    ]
  };
  
  try {
    // スタックの状態を確認
    const stackStatus = await checkStackStatus(config.stackName);
    console.log(`現在のスタック状態: ${stackStatus}`);
    
    // スタックが問題のある状態の場合は削除
    if (stackStatus && (
        stackStatus.includes('ROLLBACK_FAILED') || 
        stackStatus.includes('ROLLBACK_COMPLETE') ||
        stackStatus.includes('CREATE_FAILED') ||
        stackStatus.includes('DELETE_FAILED') ||
        stackStatus.includes('UPDATE_ROLLBACK_FAILED')
      )) {
      console.warn(`スタックが ${stackStatus} 状態です。削除して再作成します...`);
      const deleted = await deleteStack(config.stackName);
      
      if (!deleted) {
        throw new Error('スタックの削除に失敗しました。AWSコンソールで手動で削除してください。');
      }
      
      // スタック作成
      console.log('新しいスタックを作成します...');
      await cloudformation.createStack(params).promise();
    } 
    // スタックが存在しない場合は新規作成
    else if (stackStatus === 'DOES_NOT_EXIST') {
      console.log('新しいスタックを作成します...');
      await cloudformation.createStack(params).promise();
    } 
    // スタックが正常な状態の場合は更新
    else if (stackStatus) {
      console.log('既存のスタックを更新します...');
      try {
        await cloudformation.updateStack(params).promise();
      } catch (error) {
        if (error.message.includes('No updates are to be performed')) {
          console.log('更新の必要はありません');
          return;
        } else {
          throw error;
        }
      }
    }
    
    console.log('スタックの作成/更新を開始しました');
    console.log('CloudFormationコンソールで進捗を確認できます');
  } catch (error) {
    console.error('CloudFormationデプロイエラー:', error);
    throw error;
  }
}

/**
 * メイン処理
 */
async function main() {
  try {
    // サーバーコードをビルド
    buildServerCode();
    
    // デプロイパッケージを作成
    await createDeploymentPackage();
    
    // S3にアップロード
    await uploadToS3();
    
    // テンプレートをアップロード
    await uploadTemplates();
    
    // CloudFormationスタックをデプロイ
    await deployCloudFormationStack();
    
    console.log('デプロイが完了しました');
  } catch (error) {
    console.error('デプロイエラー:', error);
    process.exit(1);
  }
}

// スクリプト実行
main();
