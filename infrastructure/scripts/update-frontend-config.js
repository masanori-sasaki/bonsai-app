/**
 * Bonsai App - フロントエンド設定更新スクリプト
 * 
 * このスクリプトは以下の処理を行います：
 * 1. CloudFormationスタックの出力からLambda Function URLを取得
 * 2. フロントエンドの環境設定ファイル（environment.prod.ts）を更新
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

console.log('フロントエンド設定更新の設定:');
console.log(`- 環境: ${config.environment}`);
console.log(`- リージョン: ${config.region}`);
console.log(`- スタック名: ${config.stackName}`);

// パス設定
const rootDir = path.resolve(__dirname, '..', '..');
const clientDir = path.join(rootDir, 'client');
const environmentFilePath = path.join(clientDir, 'src', 'environments', 'environment.prod.ts');

// AWS SDK初期化
const cloudformation = new AWS.CloudFormation({ region: config.region });

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
 * 環境設定ファイルを更新
 */
function updateEnvironmentFile(apiUrl, userPoolId, userPoolClientId, userPoolDomain) {
  console.log('フロントエンド環境設定を更新しています...');
  
  // 現在の環境設定を読み込み
  const currentContent = fs.readFileSync(environmentFilePath, 'utf8');
  
  // 既存の設定から値を取得（新しい値が提供されない場合に使用）
  let currentSettings = {
    apiUrl: '',
    userPoolId: '',
    userPoolClientId: '',
    userPoolDomain: ''
  };
  
  try {
    const apiUrlMatch = currentContent.match(/apiUrl: '([^']+)'/);
    if (apiUrlMatch && apiUrlMatch[1]) {
      currentSettings.apiUrl = apiUrlMatch[1];
    }
    
    const userPoolIdMatch = currentContent.match(/userPoolId: '([^']+)'/);
    if (userPoolIdMatch && userPoolIdMatch[1]) {
      currentSettings.userPoolId = userPoolIdMatch[1];
    }
    
    const userPoolClientIdMatch = currentContent.match(/userPoolWebClientId: '([^']+)'/);
    if (userPoolClientIdMatch && userPoolClientIdMatch[1]) {
      currentSettings.userPoolClientId = userPoolClientIdMatch[1];
    }
    
    const userPoolDomainMatch = currentContent.match(/domain: '([^']+)'/);
    if (userPoolDomainMatch && userPoolDomainMatch[1]) {
      currentSettings.userPoolDomain = userPoolDomainMatch[1];
    }
  } catch (error) {
    console.warn('既存の設定の解析中にエラーが発生しました:', error);
  }
  
  // 新しい値または既存の値を使用
  const finalApiUrl = apiUrl || currentSettings.apiUrl;
  const finalUserPoolId = userPoolId || currentSettings.userPoolId;
  const finalUserPoolClientId = userPoolClientId || currentSettings.userPoolClientId;
  const finalUserPoolDomain = userPoolDomain || currentSettings.userPoolDomain;
  
  // 新しい環境設定を作成
  const newContent = `export const environment = {
  production: true,
  apiUrl: '${finalApiUrl}',
  cognito: {
    userPoolId: '${finalUserPoolId}',
    userPoolWebClientId: '${finalUserPoolClientId}',
    domain: '${finalUserPoolDomain}'
  }
};
`;
  
  // ファイルを更新
  fs.writeFileSync(environmentFilePath, newContent);
  console.log('環境設定ファイルを更新しました');
}

/**
 * フロントエンドをビルド
 */
function buildFrontend() {
  console.log('フロントエンドをビルドしています...');
  execSync('npm run build', { cwd: clientDir, stdio: 'inherit' });
  console.log('フロントエンドのビルドが完了しました');
}

/**
 * メイン処理
 */
async function main() {
  try {
    let outputs = {};
    let apiUrl, userPoolId, userPoolClientId, userPoolDomain;
    
    try {
      // スタック出力を取得
      outputs = await getStackOutputs();
      console.log('スタック出力:', outputs);
      
      // 必要な値を取得（出力キーが異なる場合に対応）
      apiUrl = outputs.ApiEndpoint || outputs.LambdaFunctionUrl;
      userPoolId = outputs.UserPoolId;
      userPoolClientId = outputs.UserPoolClientId;
      userPoolDomain = outputs.UserPoolDomainName || outputs.UserPoolDomain;
    } catch (error) {
      console.warn('CloudFormationスタックからの出力取得に失敗しました:', error.message);
      console.warn('既存の設定を使用します。');
    }
    
    // 環境設定ファイルを更新
    updateEnvironmentFile(apiUrl, userPoolId, userPoolClientId, userPoolDomain);
    
    // フロントエンドをビルド
    try {
      buildFrontend();
    } catch (error) {
      console.error('フロントエンドのビルドに失敗しました:', error.message);
      console.warn('環境設定ファイルは更新されましたが、ビルドは完了していません。');
      console.warn('手動でビルドを実行してください: cd client && npm run build');
    }
    
    console.log('フロントエンド設定の更新が完了しました');
  } catch (error) {
    console.error('フロントエンド設定更新エラー:', error);
    process.exit(1);
  }
}

// スクリプト実行
main();
