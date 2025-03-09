/**
 * テスト環境セットアップスクリプト
 * 
 * このスクリプトは、APIテストに必要なパッケージをインストールします。
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// スクリプトのディレクトリパス
const scriptDir = __dirname;
// プロジェクトのルートディレクトリパス
const projectRoot = path.resolve(scriptDir, '../..');

// package.jsonのパス
const packageJsonPath = path.join(scriptDir, 'package.json');

// package.jsonが存在しない場合は作成
if (!fs.existsSync(packageJsonPath)) {
  console.log('package.jsonを作成しています...');
  
  const packageJson = {
    "name": "bonsai-app-api-test",
    "version": "1.0.0",
    "description": "Bonsai App API テスト用スクリプト",
    "private": true,
    "scripts": {
      "test-work-record": "node test-work-record-api.js"
    },
    "dependencies": {
      "aws-amplify": "^5.3.10",
      "axios": "^1.5.0",
      "uuid": "^9.0.0"
    }
  };
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('package.jsonを作成しました');
}

// 依存パッケージのインストール
console.log('依存パッケージをインストールしています...');
try {
  execSync('npm install', { cwd: scriptDir, stdio: 'inherit' });
  console.log('依存パッケージのインストールが完了しました');
} catch (error) {
  console.error('依存パッケージのインストール中にエラーが発生しました:', error);
  process.exit(1);
}

console.log('\n===== セットアップ完了 =====');
console.log('以下のコマンドでWorkRecord APIテストを実行できます:');
console.log(`cd ${path.relative(process.cwd(), scriptDir)}`);
console.log('npm run test-work-record');
