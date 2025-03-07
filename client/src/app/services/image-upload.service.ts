import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';

/**
 * 画像アップロードサービス
 * 
 * 画像のリサイズ・圧縮処理とS3へのアップロード機能を提供します。
 */
@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  constructor(
    private apiService: ApiService,
    private http: HttpClient
  ) {}

  /**
   * 画像をアップロードし、URLを返す
   * 
   * @param file アップロードする画像ファイル
   * @returns 画像のURL（Observable）
   */
  uploadImage(file: File): Observable<string> {
    // 1. 画像をリサイズ・圧縮
    return from(this.resizeAndCompressImage(file)).pipe(
      // 2. 署名付きURLを取得
      switchMap(processedFile => {
        const fileName = `${Date.now()}-${processedFile.name}`;
        return this.getPresignedUrl(fileName, processedFile.type).pipe(
          // 3. S3に直接アップロード
          switchMap(presignedUrl => {
            return this.uploadToS3(presignedUrl.url, processedFile).pipe(
              map(() => presignedUrl.publicUrl)
            );
          })
        );
      })
    );
  }

  /**
   * 署名付きURLを取得
   * 
   * @param fileName ファイル名
   * @param fileType ファイルタイプ
   * @returns 署名付きURLと公開URL（Observable）
   */
  private getPresignedUrl(fileName: string, fileType: string): Observable<{url: string, publicUrl: string}> {
    return this.apiService.post<{url: string, publicUrl: string}>('/images/presigned-url', {
      fileName,
      fileType
    });
  }

  /**
   * S3に直接アップロード
   * 
   * @param presignedUrl 署名付きURL
   * @param file アップロードするファイル
   * @returns アップロード結果（Observable）
   */
  private uploadToS3(presignedUrl: string, file: File): Observable<any> {
    return this.http.put(presignedUrl, file, {
      headers: {
        'Content-Type': file.type
      }
    });
  }

  /**
   * 画像をリサイズ・圧縮
   * 
   * @param file 元の画像ファイル
   * @returns 処理後の画像ファイル（Promise）
   */
  private async resizeAndCompressImage(file: File): Promise<File> {
    // 画像タイプの検証
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      throw new Error('サポートされていない画像形式です。JPG、PNG、GIF形式のみアップロードできます。');
    }

    // 小さいファイルは処理しない
    if (file.size <= 500 * 1024) { // 500KB以下はそのまま
      return file;
    }

    // Canvas APIを使用して画像をリサイズ・圧縮
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // 元のアスペクト比を維持しながら、最大幅/高さを設定
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;

        if (width > MAX_WIDTH) {
          height = Math.round(height * (MAX_WIDTH / width));
          width = MAX_WIDTH;
        }
        if (height > MAX_HEIGHT) {
          width = Math.round(width * (MAX_HEIGHT / height));
          height = MAX_HEIGHT;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // 品質を調整して圧縮（JPEGの場合）
        const quality = file.type === 'image/jpeg' ? 0.7 : 0.9;
        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error('画像の圧縮に失敗しました'));
              return;
            }
            // 2MB以上の場合はさらに圧縮
            if (blob.size > 2 * 1024 * 1024) {
              // さらに圧縮が必要な場合は、再度圧縮処理を行う
              // 実際の実装では、品質をさらに下げるなどの処理を行う
              console.warn('画像サイズが大きすぎます。さらに圧縮が必要です。');
            }
            const newFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(newFile);
          },
          file.type,
          quality
        );
      };
      img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
      img.src = URL.createObjectURL(file);
    });
  }
}
