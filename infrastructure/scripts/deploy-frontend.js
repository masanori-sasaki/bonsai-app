/**
 * Bonsai App - フロントエンドデプロイスクリプト
 * 
 * このスクリプトは以下の処理を行います：
 * 1. CloudFormationスタックの出力からフロントエンドS3バケット名を取得
 * 2. ビルドされたフロントエンドファイルをS3バケットにアップロード
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

// 設定
const config = {
  environment: process.env.ENVIRONMENT || 'dev',
  region: process.env.AWS_REGION || 'ap-northeast-1',
  stackName: process.env.STACK_NAME || `BonsaiAppStack-${process.env.ENVIRONMENT || 'dev'}`
};

console.log('フロントエンドデプロイの設定:');
console.log(`- 環境: ${config.environment}`);
console.log(`- リージョン: ${config.region}`);
console.log(`- スタック名: ${config.stackName}`);

// パス設定
const rootDir = path.resolve(__dirname, '..', '..');
const clientDir = path.join(rootDir, 'client');
const distDir = path.join(clientDir, 'dist', 'bonsai-app-client');

// AWS SDK初期化
const cloudformation = new AWS.CloudFormation({ region: config.region });
const s3 = new AWS.S3({ region: config.region });

/**
 * CloudFormationスタックの出力を取得
 */
async function getStackOutputs() {
  console.log(`CloudFormationスタック ${config.stackName} の出力を取得しています...`);
  
  try {
    const response = await cloudformation.describeStacks({
      StackName: config.stackName
    }).promise();
    
    if (!response.Stacks || response.Stacks.length === 0) {
      throw new Error(`スタック ${config.stackName} が見つかりません`);
    }
    
    const outputs = {};
    response.Stacks[0].Outputs.forEach(output => {
      outputs[output.OutputKey] = output.OutputValue;
    });
    
    return outputs;
  } catch (error) {
    console.error('CloudFormation出力取得エラー:', error);
    throw error;
  }
}

/**
 * S3バケットにファイルをアップロード
 */
async function uploadToS3(bucketName, filePath, s3Key, contentType) {
  try {
    const fileContent = fs.readFileSync(filePath);
    
    const params = {
      Bucket: bucketName,
      Key: s3Key,
      Body: fileContent,
      ContentType: contentType
    };
    
    await s3.upload(params).promise();
    return true;
  } catch (error) {
    console.error(`ファイル ${filePath} のアップロードエラー:`, error);
    return false;
  }
}

/**
 * ディレクトリ内のすべてのファイルを再帰的に取得
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });
  
  return arrayOfFiles;
}

/**
 * ファイルのMIMEタイプを取得
 */
function getMimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * フロントエンドファイルをS3にアップロード
 */
async function deployFrontend(bucketName) {
  console.log(`フロントエンドファイルを S3 バケット ${bucketName} にアップロードしています...`);
  
  // distディレクトリが存在するか確認
  if (!fs.existsSync(distDir)) {
    throw new Error(`ビルドディレクトリが見つかりません: ${distDir}`);
  }
  
  // すべてのファイルを取得
  const allFiles = getAllFiles(distDir);
  
  // 成功したアップロードの数
  let successCount = 0;
  
  // 各ファイルをアップロード
  for (const filePath of allFiles) {
    // S3キーを作成（相対パス）
    const relativePath = path.relative(distDir, filePath);
    const s3Key = relativePath.replace(/\\/g, '/'); // Windowsのパス区切り文字をS3形式に変換
    
    // MIMEタイプを取得
    const contentType = getMimeType(filePath);
    
    // アップロード
    console.log(`アップロード中: ${s3Key} (${contentType})`);
    const success = await uploadToS3(bucketName, filePath, s3Key, contentType);
    
    if (success) {
      successCount++;
    }
  }
  
  console.log(`アップロード完了: ${successCount}/${allFiles.length} ファイル`);
  
  if (successCount === allFiles.length) {
    console.log('すべてのファイルが正常にアップロードされました');
  } else {
    console.warn(`${allFiles.length - successCount} ファイルのアップロードに失敗しました`);
  }
}

/**
 * メイン処理
 */
async function main() {
  try {
    // スタック出力を取得
    const outputs = await getStackOutputs();
    console.log('スタック出力:', outputs);
    
    // フロントエンドバケット名を取得
    // FrontendURLからバケット名を抽出（例：http://bonsai-app-dev-123456789012-ap-northeast-1.s3-website-ap-northeast-1.amazonaws.com/）
    let bucketName = '';
    
    if (outputs.FrontendBucketName) {
      // 直接バケット名が出力されている場合
      bucketName = outputs.FrontendBucketName;
    } else if (outputs.FrontendURL) {
      // URLからバケット名を抽出
      const urlMatch = outputs.FrontendURL.match(/http:\/\/([^\.]+)\./);
      if (urlMatch && urlMatch[1]) {
        bucketName = urlMatch[1];
        console.log(`FrontendURLからバケット名を抽出しました: ${bucketName}`);
      }
    }
    
    if (!bucketName) {
      // StorageStackの出力を直接取得してみる
      try {
        console.log('StorageStackの出力を直接取得しています...');
        const storageStackName = `${config.stackName}-StorageStack`;
        const storageStackResponse = await cloudformation.describeStacks({
          StackName: storageStackName
        }).promise();
        
        if (storageStackResponse.Stacks && storageStackResponse.Stacks.length > 0) {
          const storageOutputs = {};
          storageStackResponse.Stacks[0].Outputs.forEach(output => {
            storageOutputs[output.OutputKey] = output.OutputValue;
          });
          
          console.log('StorageStack出力:', storageOutputs);
          
          if (storageOutputs.FrontendBucketName) {
            bucketName = storageOutputs.FrontendBucketName;
            console.log(`StorageStackからバケット名を取得しました: ${bucketName}`);
          }
        }
      } catch (error) {
        console.warn('StorageStackの出力取得に失敗しました:', error.message);
      }
    }
    
    if (!bucketName) {
      throw new Error('フロントエンドバケット名が見つかりません。CloudFormationスタックが正しくデプロイされているか確認してください。');
    }
    
    // フロントエンドをデプロイ
    await deployFrontend(bucketName);
    
    console.log('フロントエンドのデプロイが完了しました');
    console.log(`ウェブサイトURL: ${outputs.FrontendURL}`);
  } catch (error) {
    console.error('フロントエンドデプロイエラー:', error);
    process.exit(1);
  }
}

// スクリプト実行
main();
