/**
 * 画像ハンドラー
 * 
 * このファイルは画像関連のAPIリクエストを処理するハンドラー関数を提供します。
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { getUserIdFromRequest } from '../utils/auth';
import { InvalidRequestError } from '../utils/errors';
import { createSuccessResponse, createErrorResponse } from '../utils/response';

// S3クライアントの初期化
const s3 = new S3();
const BUCKET_NAME = process.env.FRONTEND_BUCKET_NAME || 'bonsai-app-dev';
const IMAGE_FOLDER = 'images';

/**
 * 画像アップロード用の署名付きURLを生成
 * 
 * @param event APIGatewayProxyEvent
 * @returns APIGatewayProxyResult
 */
export async function generatePresignedUrl(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // ユーザーIDを取得
    const userId = getUserIdFromRequest(event);
    
    // リクエストボディをパース
    if (!event.body) {
      throw new InvalidRequestError('リクエストボディが空です');
    }
    
    const data = JSON.parse(event.body);
    
    // バリデーション
    if (!data.fileName) {
      throw new InvalidRequestError('ファイル名は必須です');
    }
    if (!data.fileType) {
      throw new InvalidRequestError('ファイルタイプは必須です');
    }
    
    // サポートする画像形式のみ許可
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(data.fileType)) {
      throw new InvalidRequestError('サポートされていない画像形式です。JPG、PNG、GIF、WebP形式のみアップロードできます。');
    }
    
    // ファイル名を安全に処理（拡張子を維持）
    const fileExt = data.fileName.split('.').pop();
    const safeFileName = `${uuidv4()}.${fileExt}`;
    
    // S3のキーを生成（ユーザーIDごとにフォルダ分け）
    const key = `${IMAGE_FOLDER}/${userId}/${safeFileName}`;
    
    // 署名付きURLを生成（有効期限5分）
    const presignedUrl = s3.getSignedUrl('putObject', {
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: data.fileType,
      Expires: 300 // 5分
    });
    
    // 公開URLを生成（CloudFront経由）
    const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN_NAME;
    let publicUrl;
    
    if (cloudFrontDomain) {
      // CloudFrontのOriginPathが/imagesに設定されているため、
      // keyからimagesプレフィックスを除去して重複を避ける
      const keyWithoutPrefix = key.replace(`${IMAGE_FOLDER}/`, '');
      publicUrl = `https://${cloudFrontDomain}/images/${keyWithoutPrefix}`;
      console.log(`Generated CloudFront URL: ${publicUrl} for key: ${key}`);
    } else {
      publicUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
      console.log(`Generated S3 URL: ${publicUrl} for key: ${key}`);
    }
    
    // 成功レスポンスを返す
    return createSuccessResponse({
      url: presignedUrl,
      publicUrl: publicUrl
    });
  } catch (error) {
    // エラーレスポンスを返す
    return createErrorResponse(error as Error);
  }
}
