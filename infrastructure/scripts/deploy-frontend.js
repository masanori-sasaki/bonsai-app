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
 * 指定した時間（ミリ秒）待機する
 */
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
 * CloudFormationスタックが完了するまで待機
 */
async function waitForStackCompletion(stackName) {
  console.log(`CloudFormationスタック ${stackName} の完了を待機しています...`);
  
  let stackStatus = await checkStackStatus(stackName);
  let retryCount = 0;
  const maxRetries = 60; // 最大60回（10分）試行
  
  while (retryCount < maxRetries) {
    console.log(`現在のスタック状態: ${stackStatus} (試行: ${retryCount + 1}/${maxRetries})`);
    
    if (stackStatus === 'CREATE_COMPLETE' || stackStatus === 'UPDATE_COMPLETE') {
      console.log(`スタック ${stackName} が正常に完了しました`);
      return true;
    } else if (stackStatus && (
        stackStatus.includes('FAILED') || 
        stackStatus.includes('ROLLBACK_COMPLETE') ||
        stackStatus === 'DOES_NOT_EXIST'
      )) {
      console.error(`スタック ${stackName} が異常な状態です: ${stackStatus}`);
      return false;
    }
    
    // 10秒待機
    await sleep(10000);
    retryCount++;
    
    try {
      stackStatus = await checkStackStatus(stackName);
    } catch (error) {
      console.warn('スタック状態の確認中にエラーが発生しました:', error.message);
    }
  }
  
  console.error(`スタック ${stackName} の待機がタイムアウトしました。現在の状態: ${stackStatus}`);
  return false;
}

/**
 * CloudFormationスタックの出力を取得
 */
async function getStackOutputs() {
  console.log(`CloudFormationスタック ${config.stackName} の出力を取得しています...`);
  
  // まず、メインスタックが完了するまで待機
  const mainStackCompleted = await waitForStackCompletion(config.stackName);
  if (!mainStackCompleted) {
    throw new Error(`メインスタック ${config.stackName} が正常に完了していません。デプロイを中止します。`);
  }
  
  // StorageStackの正確な名前を取得
  console.log('StorageStackの正確な名前を取得しています...');
  const listStacksResponse = await cloudformation.listStacks({
    StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE']
  }).promise();
  
  const storageStackPrefix = `${config.stackName}-StorageStack`;
  const storageStack = listStacksResponse.StackSummaries.find(
    stack => stack.StackName.startsWith(storageStackPrefix)
  );
  
  if (storageStack) {
    console.log(`StorageStackの正確な名前を見つけました: ${storageStack.StackName}`);
    
    // StorageStackが完了するまで待機
    const storageStackCompleted = await waitForStackCompletion(storageStack.StackName);
    if (!storageStackCompleted) {
      throw new Error(`StorageStack ${storageStack.StackName} が正常に完了していません。デプロイを中止します。`);
    }
  }
  
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
 * CloudFrontキャッシュを無効化
 */
async function invalidateCloudFrontCache(distributionId) {
  console.log(`CloudFrontキャッシュを無効化しています... (Distribution ID: ${distributionId})`);
  
  try {
    const cloudfront = new AWS.CloudFront({ region: config.region });
    
    const params = {
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: `deploy-${Date.now()}`,
        Paths: {
          Quantity: 1,
          Items: ['/*']
        }
      }
    };
    
    const response = await cloudfront.createInvalidation(params).promise();
    console.log('CloudFrontキャッシュの無効化を開始しました:', response.Invalidation.Id);
    return true;
  } catch (error) {
    console.error('CloudFrontキャッシュ無効化エラー:', error);
    return false;
  }
}

/**
 * CloudFrontディストリビューションIDを取得
 */
async function getCloudFrontDistributionId() {
  console.log('CloudFrontディストリビューションIDを取得しています...');
  
  try {
    // まず、メインスタックからStorageStackの正確な名前を取得
    console.log('StorageStackの正確な名前を取得しています...');
    const listStacksResponse = await cloudformation.listStacks({
      StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE']
    }).promise();
    
    const storageStackPrefix = `${config.stackName}-StorageStack`;
    const storageStack = listStacksResponse.StackSummaries.find(
      stack => stack.StackName.startsWith(storageStackPrefix)
    );
    
    if (storageStack) {
      console.log(`StorageStackの正確な名前を見つけました: ${storageStack.StackName}`);
      
      // 正確なStorageStack名を使用して出力を取得
      const storageStackResponse = await cloudformation.describeStacks({
        StackName: storageStack.StackName
      }).promise();
      
      if (storageStackResponse.Stacks && storageStackResponse.Stacks.length > 0) {
        const storageOutputs = {};
        storageStackResponse.Stacks[0].Outputs.forEach(output => {
          storageOutputs[output.OutputKey] = output.OutputValue;
        });
        
        console.log('StorageStack出力:', storageOutputs);
        
        if (storageOutputs.CloudFrontDistributionId) {
          console.log(`StorageStackからCloudFrontディストリビューションIDを取得しました: ${storageOutputs.CloudFrontDistributionId}`);
          return storageOutputs.CloudFrontDistributionId;
        }
      }
    }
    
    // StorageStackから取得できなかった場合、メインスタックから取得を試みる
    console.log('メインスタックからCloudFrontディストリビューションIDを取得しています...');
    const mainStackResponse = await cloudformation.describeStacks({
      StackName: config.stackName
    }).promise();
    
    if (mainStackResponse.Stacks && mainStackResponse.Stacks.length > 0) {
      const outputs = {};
      mainStackResponse.Stacks[0].Outputs.forEach(output => {
        outputs[output.OutputKey] = output.OutputValue;
      });
      
      if (outputs.CloudFrontDistributionId) {
        console.log(`メインスタックからCloudFrontディストリビューションIDを取得しました: ${outputs.CloudFrontDistributionId}`);
        return outputs.CloudFrontDistributionId;
      }
    }
    
    console.warn('CloudFrontディストリビューションIDが見つかりませんでした');
    return null;
  } catch (error) {
    console.error('CloudFrontディストリビューションID取得エラー:', error);
    return null;
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
    // StorageStackの正確な名前を取得
    try {
      console.log('StorageStackの正確な名前を取得しています...');
      const listStacksResponse = await cloudformation.listStacks({
        StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE']
      }).promise();
      
      const storageStackPrefix = `${config.stackName}-StorageStack`;
      const storageStack = listStacksResponse.StackSummaries.find(
        stack => stack.StackName.startsWith(storageStackPrefix)
      );
      
      if (storageStack) {
        console.log(`StorageStackの正確な名前を見つけました: ${storageStack.StackName}`);
        
        // 正確なStorageStack名を使用して出力を取得
        const storageStackResponse = await cloudformation.describeStacks({
          StackName: storageStack.StackName
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
      } else {
        console.warn(`StorageStackが見つかりませんでした。検索プレフィックス: ${storageStackPrefix}`);
      }
    } catch (error) {
      console.warn('StorageStackの出力取得に失敗しました:', error.message);
    }
    }
    
    // それでもバケット名が見つからない場合は、FrontendURLから抽出を試みる
    if (!bucketName && outputs.FrontendURL) {
      // URLからバケット名を抽出（より堅牢な方法）
      const urlMatch = outputs.FrontendURL.match(/http:\/\/([^\.]+)\./);
      if (urlMatch && urlMatch[1]) {
        bucketName = urlMatch[1];
        console.log(`FrontendURLからバケット名を抽出しました: ${bucketName}`);
      }
    }
    
    // 最終手段として、環境変数から直接バケット名を取得
    if (!bucketName && process.env.FRONTEND_BUCKET_NAME) {
      bucketName = process.env.FRONTEND_BUCKET_NAME;
      console.log(`環境変数からバケット名を取得しました: ${bucketName}`);
    }
    
    if (!bucketName) {
      throw new Error('フロントエンドバケット名が見つかりません。CloudFormationスタックが正しくデプロイされているか確認してください。\n' +
                     '手動でデプロイするには、環境変数FRONTEND_BUCKET_NAMEを設定してください。\n' +
                     '例: set FRONTEND_BUCKET_NAME=bonsai-app-prod-171278323216-ap-northeast-1 && npm run deploy-frontend');
    }
    
    // フロントエンドをデプロイ
    await deployFrontend(bucketName);
    
    // CloudFrontキャッシュを無効化
    if (outputs.CloudFrontDistributionId) {
      await invalidateCloudFrontCache(outputs.CloudFrontDistributionId);
    } else {
      console.warn('CloudFront Distribution IDが見つかりません。キャッシュ無効化をスキップします。');
    }
    
    console.log('フロントエンドのデプロイが完了しました');
    
    // CloudFrontのURLを表示
    if (outputs.CloudFrontDomainName) {
      console.log(`ウェブサイトURL: https://${outputs.CloudFrontDomainName}`);
    } else {
      console.log(`ウェブサイトURL: ${outputs.FrontendURL}`);
    }
  } catch (error) {
    console.error('フロントエンドデプロイエラー:', error);
    process.exit(1);
  }
}

// スクリプト実行
main();
