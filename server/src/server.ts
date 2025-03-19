/**
 * Bonsai App Server
 * 
 * このファイルはExpress.jsを使用したサーバーアプリケーションのエントリーポイントです。
 * ローカル開発環境で使用します。
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from './index';
import { createErrorResponse } from './utils/response';

// Expressアプリケーションを作成
const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェアの設定
app.use(cors());
app.use(bodyParser.json());

// ヘルスチェックエンドポイント
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Lambda関数をExpressルートとして統合するためのヘルパー関数
const lambdaToExpress = (path: string, method: string) => {
  return async (req: Request, res: Response) => {
    try {
      console.log('Lambda関数を呼び出し:', path, method);

      // ExpressリクエストをAPI Gateway形式に変換
      const event: Partial<APIGatewayProxyEvent> = {
        path,
        httpMethod: method,
        headers: req.headers as { [name: string]: string },
        queryStringParameters: req.query as { [name: string]: string },
        pathParameters: req.params,
        body: req.body ? JSON.stringify(req.body) : null
      };

      // Lambda関数を呼び出し
      const result = await handler(event as APIGatewayProxyEvent);
      
      // CloudWatch Eventsからのトリガーの場合はvoidが返るため、その場合は200 OKを返す
      if (!result) {
        res.status(200).json({ message: 'OK' });
        return;
      }
      
      // APIGatewayProxyResultの場合はレスポンスを返す
      res.status(result.statusCode).json(JSON.parse(result.body));
    } catch (error) {
      console.error('ルートハンドラーエラー:', error);
      const errorResponse = createErrorResponse(error as Error);
      res.status(errorResponse.statusCode).json(JSON.parse(errorResponse.body));
    }
  };
};

// 盆栽関連のルート
app.get('/api/bonsai', lambdaToExpress('/api/bonsai', 'GET'));
app.post('/api/bonsai', lambdaToExpress('/api/bonsai', 'POST'));
app.get('/api/bonsai/:bonsaiId', (req: Request, res: Response) => {
  const path = `/api/bonsai/${req.params.bonsaiId}`;
  lambdaToExpress(path, 'GET')(req, res);
});
app.put('/api/bonsai/:bonsaiId', (req: Request, res: Response) => {
  const path = `/api/bonsai/${req.params.bonsaiId}`;
  lambdaToExpress(path, 'PUT')(req, res);
});
app.delete('/api/bonsai/:bonsaiId', (req: Request, res: Response) => {
  const path = `/api/bonsai/${req.params.bonsaiId}`;
  lambdaToExpress(path, 'DELETE')(req, res);
});

// 作業記録関連のルート
app.get('/api/bonsai/:bonsaiId/records', (req: Request, res: Response) => {
  const path = `/api/bonsai/${req.params.bonsaiId}/records`;
  lambdaToExpress(path, 'GET')(req, res);
});
app.post('/api/bonsai/:bonsaiId/records', (req: Request, res: Response) => {
  const path = `/api/bonsai/${req.params.bonsaiId}/records`;
  lambdaToExpress(path, 'POST')(req, res);
});
app.get('/api/records/:recordId', (req: Request, res: Response) => {
  const path = `/api/records/${req.params.recordId}`;
  lambdaToExpress(path, 'GET')(req, res);
});
app.put('/api/records/:recordId', (req: Request, res: Response) => {
  const path = `/api/records/${req.params.recordId}`;
  lambdaToExpress(path, 'PUT')(req, res);
});
app.delete('/api/records/:recordId', (req: Request, res: Response) => {
  const path = `/api/records/${req.params.recordId}`;
  lambdaToExpress(path, 'DELETE')(req, res);
});

// 作業予定関連のルート
app.get('/api/bonsai/:bonsaiId/schedules', (req: Request, res: Response) => {
  const path = `/api/bonsai/${req.params.bonsaiId}/schedules`;
  lambdaToExpress(path, 'GET')(req, res);
});
app.post('/api/bonsai/:bonsaiId/schedules', (req: Request, res: Response) => {
  const path = `/api/bonsai/${req.params.bonsaiId}/schedules`;
  lambdaToExpress(path, 'POST')(req, res);
});
app.get('/api/schedules/:scheduleId', (req: Request, res: Response) => {
  const path = `/api/schedules/${req.params.scheduleId}`;
  lambdaToExpress(path, 'GET')(req, res);
});
app.put('/api/schedules/:scheduleId', (req: Request, res: Response) => {
  const path = `/api/schedules/${req.params.scheduleId}`;
  lambdaToExpress(path, 'PUT')(req, res);
});
app.delete('/api/schedules/:scheduleId', (req: Request, res: Response) => {
  const path = `/api/schedules/${req.params.scheduleId}`;
  lambdaToExpress(path, 'DELETE')(req, res);
});

// 画像アップロード関連のルート
app.post('/api/images/presigned-url', lambdaToExpress('/api/images/presigned-url', 'POST'));

// 月次レポート関連のルート
app.get('/api/reports', lambdaToExpress('/api/reports', 'GET'));
app.post('/api/reports', lambdaToExpress('/api/reports', 'POST'));
app.get('/api/reports/:year/:month', (req: Request, res: Response) => {
  const path = `/api/reports/${req.params.year}/${req.params.month}`;
  lambdaToExpress(path, 'GET')(req, res);
});

// 一括水やり関連のルート
app.post('/api/bulk-watering', lambdaToExpress('/api/bulk-watering', 'POST'));

// 認証関連のルート
app.post('/api/auth/login', (req: Request, res: Response) => {
  // 簡易的な認証処理
  const { email, password } = req.body;
  
  // 開発用の簡易認証
  if (email && password) {
    res.json({
      user: {
        id: 'user123',
        email,
        name: 'テストユーザー',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      tokens: {
        idToken: 'mock-id-token',
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      }
    });
  } else {
    res.status(401).json({
      message: '認証に失敗しました。メールアドレスとパスワードを確認してください。'
    });
  }
});

// プロファイル取得エンドポイント
app.get('/api/profile', (req: Request, res: Response) => {
  // 認証トークンの検証（実際の実装ではJWTを検証）
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // 開発用の簡易プロファイル
    res.json({
      id: 'user123',
      email: 'user@example.com',
      name: 'テストユーザー',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } else {
    res.status(401).json({
      message: '認証が必要です。'
    });
  }
});

// エラーハンドリングミドルウェア
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('サーバーエラー:', err);
  res.status(500).json({
    message: 'サーバーエラーが発生しました。',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404ハンドラー
app.use((req: Request, res: Response): void => {
  res.status(404).json({
    message: 'リクエストされたリソースが見つかりません。'
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
  console.log('開発モードで実行中...');
});

export default app;
