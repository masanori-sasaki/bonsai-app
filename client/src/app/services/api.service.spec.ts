import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const apiUrl = 'https://api.example.com';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('get', () => {
    it('should make a GET request with correct URL and headers', () => {
      const testData = { id: 1, name: 'Test' };
      const path = 'test';
      const params = { param1: 'value1', param2: 'value2' };
      
      // ローカルストレージのモック
      spyOn(localStorage, 'getItem').and.returnValue('test-token');
      
      service.get(path, params).subscribe(data => {
        expect(data).toEqual(testData);
      });
      
      const req = httpMock.expectOne(`${apiUrl}/api/${path}?param1=value1&param2=value2`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      
      req.flush(testData);
    });
    
    it('should make a GET request without auth header when token is not available', () => {
      const testData = { id: 1, name: 'Test' };
      const path = 'test';
      
      // ローカルストレージのモック
      spyOn(localStorage, 'getItem').and.returnValue(null);
      
      service.get(path).subscribe(data => {
        expect(data).toEqual(testData);
      });
      
      const req = httpMock.expectOne(`${apiUrl}/api/${path}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Authorization')).toBeNull();
      
      req.flush(testData);
    });
    
    it('should handle URL with trailing slash correctly', () => {
      const testData = { id: 1, name: 'Test' };
      const path = 'test';
      const apiUrlWithSlash = 'https://api.example.com/';
      
      // 環境変数のモックを上書き
      spyOnProperty(environment, 'apiUrl', 'get').and.returnValue(apiUrlWithSlash);
      
      service.get(path).subscribe(data => {
        expect(data).toEqual(testData);
      });
      
      const req = httpMock.expectOne(`https://api.example.com/api/${path}`);
      expect(req.request.method).toBe('GET');
      
      req.flush(testData);
    });
  });

  describe('post', () => {
    it('should make a POST request with correct URL, body and headers', () => {
      const testData = { id: 1, name: 'Test' };
      const path = 'test';
      const body = { name: 'Test' };
      
      // ローカルストレージのモック
      spyOn(localStorage, 'getItem').and.returnValue('test-token');
      
      service.post(path, body).subscribe(data => {
        expect(data).toEqual(testData);
      });
      
      const req = httpMock.expectOne(`${apiUrl}/api/${path}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      
      req.flush(testData);
    });
  });

  describe('put', () => {
    it('should make a PUT request with correct URL, body and headers', () => {
      const testData = { id: 1, name: 'Updated Test' };
      const path = 'test/1';
      const body = { name: 'Updated Test' };
      
      // ローカルストレージのモック
      spyOn(localStorage, 'getItem').and.returnValue('test-token');
      
      service.put(path, body).subscribe(data => {
        expect(data).toEqual(testData);
      });
      
      const req = httpMock.expectOne(`${apiUrl}/api/${path}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      
      req.flush(testData);
    });
  });

  describe('delete', () => {
    it('should make a DELETE request with correct URL and headers', () => {
      const testData = { message: 'Deleted successfully', id: '1' };
      const path = 'test/1';
      
      // ローカルストレージのモック
      spyOn(localStorage, 'getItem').and.returnValue('test-token');
      
      service.delete(path).subscribe(data => {
        expect(data).toEqual(testData);
      });
      
      const req = httpMock.expectOne(`${apiUrl}/api/${path}`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      
      req.flush(testData);
    });
  });

  describe('getHeaders', () => {
    it('should return headers with auth token when available', () => {
      // privateメソッドをテストするためにanyにキャスト
      const service = TestBed.inject(ApiService) as any;
      
      // ローカルストレージのモック
      spyOn(localStorage, 'getItem').and.returnValue('test-token');
      
      const headers = service.getHeaders();
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('Authorization')).toBe('Bearer test-token');
    });
    
    it('should return headers without auth token when not available', () => {
      // privateメソッドをテストするためにanyにキャスト
      const service = TestBed.inject(ApiService) as any;
      
      // ローカルストレージのモック
      spyOn(localStorage, 'getItem').and.returnValue(null);
      
      const headers = service.getHeaders();
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('Authorization')).toBeNull();
    });
  });

  describe('buildParams', () => {
    it('should build HttpParams from object', () => {
      // privateメソッドをテストするためにanyにキャスト
      const service = TestBed.inject(ApiService) as any;
      
      const params = {
        param1: 'value1',
        param2: 'value2',
        nullParam: null,
        undefinedParam: undefined
      };
      
      const httpParams = service.buildParams(params);
      
      // nullとundefinedのパラメータは含まれないことを確認
      expect(httpParams.get('param1')).toBe('value1');
      expect(httpParams.get('param2')).toBe('value2');
      expect(httpParams.get('nullParam')).toBeNull();
      expect(httpParams.get('undefinedParam')).toBeNull();
    });
    
    it('should return empty HttpParams for empty object', () => {
      // privateメソッドをテストするためにanyにキャスト
      const service = TestBed.inject(ApiService) as any;
      
      const params = {};
      
      const httpParams = service.buildParams(params);
      
      // パラメータが空であることを確認
      expect(httpParams.keys().length).toBe(0);
    });
  });
});
