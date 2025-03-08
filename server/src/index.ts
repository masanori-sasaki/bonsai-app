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
    }
    
    // Lambda Function URLの場合
    if ((event as any).requestContext && (event as any).requestContext.http && (event as any).requestContext.http.method) {
      method = (event as any).requestContext.http.method;
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
    
    // 盆栽詳細のエンドポイント
    const bonsaiDetailMatch = path.match(/^\/api\/bonsai\/([^\/]+)$/);
    if (bonsaiDetailMatch) {
      const bonsaiId = bonsaiDetailMatch[1];
      event.pathParameters = { ...event.pathParameters, bonsaiId };
      
      if (method === 'GET') {
        return await getBonsaiDetail(event);
      } else if (method === 'PUT') {
        return await updateBonsai(event);
      } else if (method === 'DELETE') {
        return await deleteBonsai(event);
      }
    }
    
    // 作業記録一覧のエンドポイント
    const workRecordListMatch = path.match(/^\/api\/bonsai\/([^\/]+)\/records$/);
    if (workRecordListMatch) {
      const bonsaiId = workRecordListMatch[1];
      event.pathParameters = { ...event.pathParameters, bonsaiId };
      
      if (method === 'GET') {
        return await getWorkRecordList(event);
      } else if (method === 'POST') {
        return await createWorkRecord(event);
      }
    }
    
    // 作業記録詳細のエンドポイント
    const workRecordDetailMatch = path.match(/^\/api\/records\/([^\/]+)$/);
    if (workRecordDetailMatch) {
      const recordId = workRecordDetailMatch[1];
      event.pathParameters = { ...event.pathParameters, recordId };
      
      if (method === 'GET') {
        return await getWorkRecordDetail(event);
      } else if (method === 'PUT') {
        return await updateWorkRecord(event);
      } else if (method === 'DELETE') {
        return await deleteWorkRecord(event);
      }
    }
    
    // 作業予定一覧のエンドポイント
    const workScheduleListMatch = path.match(/^\/api\/bonsai\/([^\/]+)\/schedules$/);
    if (workScheduleListMatch) {
      const bonsaiId = workScheduleListMatch[1];
      event.pathParameters = { ...event.pathParameters, bonsaiId };
      
      if (method === 'GET') {
        return await getWorkScheduleList(event);
      } else if (method === 'POST') {
        return await createWorkSchedule(event);
      }
    }
    
    // 作業予定詳細のエンドポイント
    const workScheduleDetailMatch = path.match(/^\/api\/schedules\/([^\/]+)$/);
    if (workScheduleDetailMatch) {
      const scheduleId = workScheduleDetailMatch[1];
      event.pathParameters = { ...event.pathParameters, scheduleId };
      
      if (method === 'GET') {
        return await getWorkScheduleDetail(event);
      } else if (method === 'PUT') {
        return await updateWorkSchedule(event);
      } else if (method === 'DELETE') {
        return await deleteWorkSchedule(event);
      }
    }
    
    // 画像アップロード用の署名付きURL生成エンドポイント
    if (path === '/api/images/presigned-url' && method === 'POST') {
      return await generatePresignedUrl(event);
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
