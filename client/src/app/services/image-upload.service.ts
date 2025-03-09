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
    return this.apiService.post<{url: string, publicUrl: string}>('images/presigned-url', {
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
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      throw new Error('サポートされていない画像形式です。JPG、PNG、GIF、WebP形式のみアップロードできます。');
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

        // 初期品質設定
        const initialQuality = this.getInitialQuality(file.type);
        
        // 圧縮処理を開始
        this.compressWithQuality(canvas, file.name, file.type, initialQuality)
          .then(resolve)
          .catch(reject);
      };
      img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * ファイルタイプに基づいて初期圧縮品質を取得
   * 
   * @param fileType ファイルタイプ
   * @returns 初期圧縮品質（0.0〜1.0）
   */
  private getInitialQuality(fileType: string): number {
    switch (fileType) {
      case 'image/jpeg':
        return 0.7; // JPEGは初期品質70%
      case 'image/webp':
        return 0.8; // WebPは初期品質80%
      default:
        return 0.9; // PNG、GIFなどは初期品質90%
    }
  }

  /**
   * 指定された品質で画像を圧縮
   * 
   * @param canvas 画像が描画されたCanvas要素
   * @param fileName ファイル名
   * @param fileType ファイルタイプ
   * @param quality 圧縮品質（0.0〜1.0）
   * @returns 圧縮後のファイル（Promise）
   */
  private compressWithQuality(
    canvas: HTMLCanvasElement, 
    fileName: string, 
    fileType: string, 
    quality: number
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      // 可能であればWebPに変換（ブラウザがサポートしている場合）
      const outputType = this.shouldConvertToWebP(fileType) ? 'image/webp' : fileType;
      
      canvas.toBlob(
        blob => {
          if (!blob) {
            reject(new Error('画像の圧縮に失敗しました'));
            return;
          }

          // 2MB以上の場合はさらに圧縮
          if (blob.size > 2 * 1024 * 1024) {
            // 品質が最低値より高い場合は、さらに圧縮を試みる
            if (quality > 0.3) {
              console.log(`画像サイズ: ${(blob.size / 1024 / 1024).toFixed(2)}MB、品質を下げて再圧縮します（${quality} → ${quality - 0.1}）`);
              // 品質を10%下げて再圧縮
              this.compressWithQuality(canvas, fileName, outputType, quality - 0.1)
                .then(resolve)
                .catch(reject);
              return;
            } else if (outputType !== 'image/webp' && this.isWebPSupported()) {
              // 品質を下げても2MBを超える場合、WebPに変換を試みる
              console.log('WebP形式に変換して圧縮を試みます');
              this.compressWithQuality(canvas, fileName, 'image/webp', 0.7)
                .then(resolve)
                .catch(reject);
              return;
            } else {
              // 最終手段：画像の解像度を下げる
              console.log('解像度を下げて圧縮を試みます');
              this.reduceResolutionAndCompress(canvas, fileName, outputType)
                .then(resolve)
                .catch(reject);
              return;
            }
          }

          // 拡張子を適切に設定
          let extension = this.getFileExtension(outputType);
          let newFileName = fileName;
          
          // ファイル名の拡張子を更新（必要な場合）
          if (outputType !== fileType) {
            const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
            newFileName = `${baseName}.${extension}`;
          }

          const newFile = new File([blob], newFileName, {
            type: outputType,
            lastModified: Date.now()
          });
          
          resolve(newFile);
        },
        outputType,
        quality
      );
    });
  }

  /**
   * 解像度を下げて圧縮
   * 
   * @param canvas 元のCanvas要素
   * @param fileName ファイル名
   * @param fileType ファイルタイプ
   * @returns 圧縮後のファイル（Promise）
   */
  private reduceResolutionAndCompress(
    canvas: HTMLCanvasElement,
    fileName: string,
    fileType: string
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      // 解像度を75%に縮小
      const scaleFactor = 0.75;
      const newWidth = Math.floor(canvas.width * scaleFactor);
      const newHeight = Math.floor(canvas.height * scaleFactor);
      
      const newCanvas = document.createElement('canvas');
      newCanvas.width = newWidth;
      newCanvas.height = newHeight;
      
      const ctx = newCanvas.getContext('2d');
      ctx?.drawImage(canvas, 0, 0, newWidth, newHeight);
      
      // 縮小したキャンバスで再度圧縮を試みる
      this.compressWithQuality(newCanvas, fileName, fileType, 0.6)
        .then(resolve)
        .catch(reject);
    });
  }

  /**
   * WebP形式への変換が可能か判定
   * 
   * @param currentType 現在のファイルタイプ
   * @returns WebPに変換すべきかどうか
   */
  private shouldConvertToWebP(currentType: string): boolean {
    // すでにWebPの場合は変換しない
    if (currentType === 'image/webp') return false;
    
    // GIFの場合はアニメーションが失われる可能性があるため変換しない
    if (currentType === 'image/gif') return false;
    
    // ブラウザがWebPをサポートしているか確認
    return this.isWebPSupported();
  }

  /**
   * ブラウザがWebPをサポートしているか確認
   * 
   * @returns WebPサポート状況
   */
  private isWebPSupported(): boolean {
    const canvas = document.createElement('canvas');
    if (!canvas || !canvas.getContext) {
      return false;
    }
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * ファイルタイプから拡張子を取得
   * 
   * @param fileType ファイルタイプ
   * @returns ファイル拡張子
   */
  private getFileExtension(fileType: string): string {
    switch (fileType) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/gif':
        return 'gif';
      case 'image/webp':
        return 'webp';
      default:
        return 'jpg';
    }
  }
}
