/**
 * Bonsai App Server
 * 
 * このファイルはアプリケーションのエントリーポイントです。
 * AWS Lambda関数のハンドラーとして機能します。
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createSuccessResponse, createErrorResponse } from './utils/response';
import { 
  getBonsaiList, 
  getBonsaiDetail, 
  createBonsai, 
  updateBonsai, 
  deleteBonsai 
} from './handlers/bonsaiHandler';
import { generatePresignedUrl } from './handlers/imageHandler';
import {
  getWorkRecordList,
  getWorkRecordDetail,
  createWorkRecord,
  updateWorkRecord,
  deleteWorkRecord
} from './handlers/workRecordHandler';
import {
  getWorkScheduleList,
  getWorkScheduleDetail,
  createWorkSchedule,
  updateWorkSchedule,
  deleteWorkSchedule
} from './handlers/workScheduleHandler';
import {
  listMonthlyReports,
  getMonthlyReport,
  generateMonthlyReport
} from './handlers/monthlyReportHandler';

/**
 * Lambda関数のハンドラー
 * API Gatewayからのリクエストを処理します
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // リクエストのパスとメソッドを取得（Lambda Function URLとAPI Gateway両方に対応）
    let path = event.path;
    let method = event.httpMethod;
    
    // Lambda Function URLの場合
    if ((event as any).rawPath) {
      path = (event as any).rawPath;
      console.log('Lambda Function URL rawPath:', path);
    }
    
    // Lambda Function URLの場合
    if ((event as any).requestContext && (event as any).requestContext.http && (event as any).requestContext.http.method) {
      method = (event as any).requestContext.http.method;
      console.log('Lambda Function URL method:', method);
    }
    
    // クエリパラメータの処理
    if (!event.queryStringParameters && (event as any).rawQueryString) {
      const rawQueryString = (event as any).rawQueryString;
      console.log('Lambda Function URL rawQueryString:', rawQueryString);
      
      // クエリパラメータをパース
      const queryParams: { [key: string]: string } = {};
      if (rawQueryString) {
        rawQueryString.split('&').forEach((param: string) => {
          const [key, value] = param.split('=');
          if (key && value) {
            queryParams[key] = decodeURIComponent(value);
          }
        });
      }
      
      // イベントオブジェクトにクエリパラメータを設定
      event.queryStringParameters = queryParams;
    }
    
    console.log(`リクエスト: ${method} ${path}`);
    
    // ヘルスチェックエンドポイント（認証不要）
    if (path === '/api/health' && method === 'GET') {
      return createSuccessResponse({
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    }
    
    // 盆栽関連のエンドポイント
    if (path === '/api/bonsai') {
      if (method === 'GET') {
        return await getBonsaiList(event);
      } else if (method === 'POST') {
        return await createBonsai(event);
      }
    }
    
    // パスの分類
    const isRecordsPath = path.endsWith('/records');
    const isSchedulesPath = path.endsWith('/schedules');
    const isBonsaiDetailPath = !isRecordsPath && !isSchedulesPath && path.startsWith('/api/bonsai/');
    
    // 作業記録一覧のエンドポイント
    if (isRecordsPath) {
      const workRecordListMatch = path.match(/^\/api\/bonsai\/([^\/]+)\/records$/);
      if (workRecordListMatch) {
        const bonsaiId = workRecordListMatch[1];
        console.log('作業記録一覧 bonsaiId:', bonsaiId);
        event.pathParameters = { ...event.pathParameters, bonsaiId };
        
        if (method === 'GET') {
          return await getWorkRecordList(event);
        } else if (method === 'POST') {
          return await createWorkRecord(event);
        }
      }
    }
    
    // 作業予定一覧のエンドポイント
    else if (isSchedulesPath) {
      const workScheduleListMatch = path.match(/^\/api\/bonsai\/([^\/]+)\/schedules$/);
      if (workScheduleListMatch) {
        const bonsaiId = workScheduleListMatch[1];
        console.log('作業予定一覧 bonsaiId:', bonsaiId);
        event.pathParameters = { ...event.pathParameters, bonsaiId };
        
        if (method === 'GET') {
          return await getWorkScheduleList(event);
        } else if (method === 'POST') {
          return await createWorkSchedule(event);
        }
      }
    }
    
    // 盆栽詳細のエンドポイント
    else if (isBonsaiDetailPath) {
      const bonsaiDetailMatch = path.match(/^\/api\/bonsai\/([^\/]+)$/);
      if (bonsaiDetailMatch) {
        const bonsaiId = bonsaiDetailMatch[1];
        console.log('盆栽詳細 bonsaiId:', bonsaiId);
        event.pathParameters = { ...event.pathParameters, bonsaiId };
        
        if (method === 'GET') {
          return await getBonsaiDetail(event);
        } else if (method === 'PUT') {
          return await updateBonsai(event);
        } else if (method === 'DELETE') {
          return await deleteBonsai(event);
        }
      }
    }
    
    // 作業予定詳細のエンドポイント - 作業記録詳細よりも先に処理
    const workScheduleDetailMatch = path.match(/^\/api\/schedules\/([^\/\?]+)$/);
    if (workScheduleDetailMatch) {
      const scheduleId = workScheduleDetailMatch[1];
      console.log('作業予定詳細 scheduleId:', scheduleId);
      event.pathParameters = { ...event.pathParameters, scheduleId };
      
      if (method === 'GET') {
        return await getWorkScheduleDetail(event);
      } else if (method === 'PUT') {
        return await updateWorkSchedule(event);
      } else if (method === 'DELETE') {
        return await deleteWorkSchedule(event);
      }
    }
    
    // 作業記録詳細のエンドポイント
    const workRecordDetailMatch = path.match(/^\/api\/records\/([^\/\?]+)$/);
    if (workRecordDetailMatch) {
      const recordId = workRecordDetailMatch[1];
      console.log('作業記録詳細 recordId:', recordId);
      event.pathParameters = { ...event.pathParameters, recordId };
      
      if (method === 'GET') {
        return await getWorkRecordDetail(event);
      } else if (method === 'PUT') {
        return await updateWorkRecord(event);
      } else if (method === 'DELETE') {
        return await deleteWorkRecord(event);
      }
    }
    
    // 画像アップロード用の署名付きURL生成エンドポイント
    if (path === '/api/images/presigned-url' && method === 'POST') {
      return await generatePresignedUrl(event);
    }
    
    // 月次レポート一覧のエンドポイント
    if (path === '/api/reports' && method === 'GET') {
      return await listMonthlyReports(event);
    }
    
    // 月次レポート生成のエンドポイント
    if (path === '/api/reports' && method === 'POST') {
      return await generateMonthlyReport(event);
    }
    
    // 月次レポート詳細のエンドポイント
    const monthlyReportDetailMatch = path.match(/^\/api\/reports\/(\d+)\/(\d+)$/);
    if (monthlyReportDetailMatch) {
      const year = monthlyReportDetailMatch[1];
      const month = monthlyReportDetailMatch[2];
      console.log('月次レポート詳細 year:', year, 'month:', month);
      event.pathParameters = { ...event.pathParameters, year, month };
      
      if (method === 'GET') {
        return await getMonthlyReport(event);
      }
    }
    
    // 未実装のエンドポイント
    return createSuccessResponse({
      message: 'Not Found'
    }, 404);
  } catch (error) {
    console.error('エラー:', error);
    return createErrorResponse(error as Error);
  }
};
