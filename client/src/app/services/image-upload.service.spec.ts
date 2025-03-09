import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ImageUploadService } from './image-upload.service';
import { ApiService } from './api.service';
import { of } from 'rxjs';

describe('ImageUploadService', () => {
  let service: ImageUploadService;
  let apiService: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ImageUploadService, ApiService]
    });
    service = TestBed.inject(ImageUploadService);
    apiService = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('uploadImage', () => {
    it('should upload image successfully', (done) => {
      // モックデータ
      const presignedUrlResponse = {
        url: 'https://example-bucket.s3.amazonaws.com/uploads/image.jpg?AWSAccessKeyId=xxx&Signature=xxx&Expires=xxx',
        publicUrl: 'https://example.com/images/uploads/image.jpg'
      };

      // ファイルモック
      const mockFile = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });

      // ApiServiceのpostメソッドをモック
      spyOn(apiService, 'post').and.returnValue(of(presignedUrlResponse));

      // HttpClientのputメソッドをモック
      spyOn(service as any, 'uploadToS3').and.returnValue(of({}));

      // resizeAndCompressImageメソッドをモック
      spyOn(service as any, 'resizeAndCompressImage').and.returnValue(Promise.resolve(mockFile));

      // サービスメソッドを呼び出し
      service.uploadImage(mockFile).subscribe(result => {
        expect(result).toBe(presignedUrlResponse.publicUrl);
        expect((service as any).resizeAndCompressImage).toHaveBeenCalledWith(mockFile);
        expect(apiService.post).toHaveBeenCalledWith('images/presigned-url', jasmine.objectContaining({
          fileName: jasmine.any(String),
          fileType: 'image/jpeg'
        }));
        expect((service as any).uploadToS3).toHaveBeenCalledWith(
          presignedUrlResponse.url,
          mockFile
        );
        done();
      });
    });
  });

  describe('getPresignedUrl', () => {
    it('should get presigned URL from API', () => {
      // モックデータ
      const presignedUrlResponse = {
        url: 'https://example-bucket.s3.amazonaws.com/uploads/image.jpg?AWSAccessKeyId=xxx&Signature=xxx&Expires=xxx',
        publicUrl: 'https://example.com/images/uploads/image.jpg'
      };

      // ApiServiceのpostメソッドをモック
      spyOn(apiService, 'post').and.returnValue(of(presignedUrlResponse));

      // privateメソッドをテストするためにanyにキャスト
      const service = TestBed.inject(ImageUploadService) as any;
      
      // サービスメソッドを呼び出し
      const fileName = 'test-image.jpg';
      const fileType = 'image/jpeg';
      service.getPresignedUrl(fileName, fileType).subscribe((result: {url: string, publicUrl: string}) => {
        expect(result).toEqual(presignedUrlResponse);
      });

      // ApiServiceのpostメソッドが正しく呼び出されたことを確認
      expect(apiService.post).toHaveBeenCalledWith('images/presigned-url', {
        fileName,
        fileType
      });
    });
  });

  describe('getInitialQuality', () => {
    it('should return correct quality for different file types', () => {
      // privateメソッドをテストするためにanyにキャスト
      const service = TestBed.inject(ImageUploadService) as any;
      
      expect(service.getInitialQuality('image/jpeg')).toBe(0.7);
      expect(service.getInitialQuality('image/webp')).toBe(0.8);
      expect(service.getInitialQuality('image/png')).toBe(0.9);
      expect(service.getInitialQuality('image/gif')).toBe(0.9);
    });
  });

  describe('shouldConvertToWebP', () => {
    it('should determine if image should be converted to WebP', () => {
      // privateメソッドをテストするためにanyにキャスト
      const service = TestBed.inject(ImageUploadService) as any;
      
      // WebPサポートのモック
      spyOn(service, 'isWebPSupported').and.returnValue(true);
      
      // すでにWebPの場合は変換しない
      expect(service.shouldConvertToWebP('image/webp')).toBeFalse();
      
      // GIFの場合は変換しない（アニメーションが失われる可能性があるため）
      expect(service.shouldConvertToWebP('image/gif')).toBeFalse();
      
      // JPEGとPNGの場合は変換する
      expect(service.shouldConvertToWebP('image/jpeg')).toBeTrue();
      expect(service.shouldConvertToWebP('image/png')).toBeTrue();
      
      // WebPがサポートされていない場合は変換しない
      service.isWebPSupported.and.returnValue(false);
      expect(service.shouldConvertToWebP('image/jpeg')).toBeFalse();
    });
  });

  describe('getFileExtension', () => {
    it('should return correct file extension for different file types', () => {
      // privateメソッドをテストするためにanyにキャスト
      const service = TestBed.inject(ImageUploadService) as any;
      
      expect(service.getFileExtension('image/jpeg')).toBe('jpg');
      expect(service.getFileExtension('image/png')).toBe('png');
      expect(service.getFileExtension('image/gif')).toBe('gif');
      expect(service.getFileExtension('image/webp')).toBe('webp');
      expect(service.getFileExtension('unknown/type')).toBe('jpg'); // デフォルト
    });
  });
});
