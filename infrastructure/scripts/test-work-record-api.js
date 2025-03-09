/**
 * WorkRecord API テストスクリプト
 * 
 * このスクリプトは、Lambdaにデプロイされた作業記録APIの動作確認を行います。
 * 以下の操作を順番に実行します：
 * 1. 認証トークンの取得（Cognitoを使用）
 * 2. 盆栽の作成（テスト用）
 * 3. 作業記録の作成
 * 4. 作業記録の一覧取得
 * 5. 作業記録の詳細取得
 * 6. 作業記録の更新
 * 7. 作業記録の削除
 * 8. テスト用盆栽の削除
 */

const axios = require('axios');
const readline = require('readline');
const { Auth } = require('aws-amplify');
const { v4: uuidv4 } = require('uuid');

// 環境設定
const API_URL = 'https://amat42gzk53gc6komqnqobuafq0lxfdy.lambda-url.ap-northeast-1.on.aws/';
const COGNITO_CONFIG = {
  userPoolId: 'ap-northeast-1_Uey2a88nX',
  userPoolWebClientId: '3l2ktjm1b1o9ecm1j8vgpdjbqh',
  region: 'ap-northeast-1'
};

// Amplify設定
Auth.configure({
  Auth: {
    region: COGNITO_CONFIG.region,
    userPoolId: COGNITO_CONFIG.userPoolId,
    userPoolWebClientId: COGNITO_CONFIG.userPoolWebClientId
  }
});

// ユーザー入力を取得するためのインターフェース
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ユーザー入力を取得する関数
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// APIクライアントの作成
function createApiClient(idToken) {
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  });
}

// メイン処理
async function main() {
  try {
    console.log('===== WorkRecord API テスト開始 =====');
    
    // 1. 認証
    console.log('\n----- 1. 認証 -----');
    const email = await prompt('メールアドレスを入力してください: ');
    const password = await prompt('パスワードを入力してください: ');
    
    console.log('Cognitoでサインイン中...');
    const cognitoUser = await Auth.signIn(email, password);
    const idToken = cognitoUser.signInUserSession.idToken.jwtToken;
    console.log('サインイン成功！');
    
    // APIクライアントの作成
    const api = createApiClient(idToken);
    
    // 2. テスト用盆栽の作成
    console.log('\n----- 2. テスト用盆栽の作成 -----');
    const bonsaiData = {
      name: `テスト盆栽 ${new Date().toISOString()}`,
      species: 'テスト樹種',
      acquisitionDate: new Date().toISOString(),
      description: 'APIテスト用の盆栽です'
    };
    
    console.log('盆栽データ:', bonsaiData);
    const bonsaiResponse = await api.post('/api/bonsai', bonsaiData);
    const bonsai = bonsaiResponse.data;
    console.log('盆栽作成成功:', bonsai);
    
    // 3. 作業記録の作成
    console.log('\n----- 3. 作業記録の作成 -----');
    const workRecordData = {
      workType: 'pruning',
      date: new Date().toISOString(),
      description: 'APIテスト用の剪定作業記録です'
    };
    
    console.log('作業記録データ:', workRecordData);
    const createResponse = await api.post(`/api/bonsai/${bonsai.id}/records`, workRecordData);
    const createdRecord = createResponse.data;
    console.log('作業記録作成成功:', createdRecord);
    
    // 4. 作業記録の一覧取得
    console.log('\n----- 4. 作業記録の一覧取得 -----');
    const listResponse = await api.get(`/api/bonsai/${bonsai.id}/records`);
    const records = listResponse.data.items;
    console.log(`作業記録一覧取得成功: ${records.length}件`);
    console.log(records);
    
    // 5. 作業記録の詳細取得
    console.log('\n----- 5. 作業記録の詳細取得 -----');
    const detailResponse = await api.get(`/api/records/${createdRecord.id}`);
    const recordDetail = detailResponse.data;
    console.log('作業記録詳細取得成功:', recordDetail);
    
    // 6. 作業記録の更新
    console.log('\n----- 6. 作業記録の更新 -----');
    const updateData = {
      description: '更新されたAPIテスト用の剪定作業記録です',
      workType: 'pruning'
    };
    
    console.log('更新データ:', updateData);
    const updateResponse = await api.put(`/api/records/${createdRecord.id}`, updateData);
    const updatedRecord = updateResponse.data;
    console.log('作業記録更新成功:', updatedRecord);
    
    // 7. 作業記録の削除
    console.log('\n----- 7. 作業記録の削除 -----');
    const deleteResponse = await api.delete(`/api/records/${createdRecord.id}`);
    console.log('作業記録削除成功:', deleteResponse.data);
    
    // 8. テスト用盆栽の削除
    console.log('\n----- 8. テスト用盆栽の削除 -----');
    const deleteBonsaiResponse = await api.delete(`/api/bonsai/${bonsai.id}`);
    console.log('盆栽削除成功:', deleteBonsaiResponse.data);
    
    console.log('\n===== WorkRecord API テスト完了 =====');
    console.log('すべてのテストが正常に完了しました！');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    
    if (error.response) {
      console.error('レスポンスエラー:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  } finally {
    rl.close();
  }
}

// スクリプト実行
main();
