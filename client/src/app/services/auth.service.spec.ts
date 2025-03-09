import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { of, throwError } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let apiService: ApiService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        AuthService,
        ApiService
      ]
    });
    service = TestBed.inject(AuthService);
    apiService = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);

    // ローカルストレージのモック
    let store: { [key: string]: string } = {};
    spyOn(localStorage, 'getItem').and.callFake((key) => store[key] || null);
    spyOn(localStorage, 'setItem').and.callFake((key, value) => store[key] = value);
    spyOn(localStorage, 'removeItem').and.callFake((key) => delete store[key]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initAuthState', () => {
    it('should initialize auth state from localStorage', () => {
      // ローカルストレージにデータがある場合
      const user = { id: 'user1', email: 'test@example.com', name: 'Test User', createdAt: '', updatedAt: '' };
      const idToken = 'test-id-token';
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('idToken', idToken);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // サービスを再初期化
      service = new AuthService(apiService, router);

      // 認証状態を確認
      expect(service.getAuthState().isAuthenticated).toBeTrue();
      expect(service.getAuthState().user).toEqual(user);
      expect(service.getAuthState().idToken).toEqual(idToken);
      expect(service.getAuthState().accessToken).toEqual(accessToken);
      expect(service.getAuthState().refreshToken).toEqual(refreshToken);
    });

    it('should initialize with unauthenticated state when localStorage is empty', () => {
      // ローカルストレージが空の場合
      // サービスを再初期化
      service = new AuthService(apiService, router);

      // 認証状態を確認
      expect(service.getAuthState().isAuthenticated).toBeFalse();
      expect(service.getAuthState().user).toBeNull();
      expect(service.getAuthState().idToken).toBeNull();
      expect(service.getAuthState().accessToken).toBeNull();
      expect(service.getAuthState().refreshToken).toBeNull();
    });
  });

  describe('signIn', () => {
    it('should sign in user and update auth state in development environment', () => {
      // 開発環境のテスト
      // environmentオブジェクトをモック
      const originalEnvironment = { ...environment };
      (environment as any).production = false;
      
      const signInRequest = { email: 'test@example.com', password: 'password123' };
      const user = { id: 'user1', email: 'test@example.com', name: 'Test User', createdAt: '', updatedAt: '' };
      const tokens = { idToken: 'id-token', accessToken: 'access-token', refreshToken: 'refresh-token' };
      
      spyOn(apiService, 'post').and.returnValue(of({ user, tokens }));
      
      // サインイン実行
      service.signIn(signInRequest).subscribe(result => {
        expect(result).toEqual(user);
        
        // ローカルストレージに保存されたことを確認
        expect(localStorage.setItem).toHaveBeenCalledWith('idToken', tokens.idToken);
        expect(localStorage.setItem).toHaveBeenCalledWith('accessToken', tokens.accessToken);
        expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', tokens.refreshToken);
        expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(user));
        
        // 認証状態が更新されたことを確認
        expect(service.getAuthState().isAuthenticated).toBeTrue();
        expect(service.getAuthState().user).toEqual(user);
        expect(service.getAuthState().idToken).toEqual(tokens.idToken);
      });
      
      // APIサービスが正しく呼び出されたことを確認
      expect(apiService.post).toHaveBeenCalledWith('auth/login', signInRequest);
    });
    
    it('should handle sign in error', () => {
      // environmentオブジェクトをモック
      (environment as any).production = false;
      
      const signInRequest = { email: 'test@example.com', password: 'wrong-password' };
      const errorMessage = 'サインインに失敗しました。メールアドレスとパスワードを確認してください。';
      
      spyOn(apiService, 'post').and.returnValue(throwError(() => new Error('Invalid credentials')));
      
      // サインイン実行
      service.signIn(signInRequest).subscribe({
        next: () => fail('Expected error, but got success'),
        error: (error) => {
          expect(error.message).toEqual(errorMessage);
          
          // 認証状態が更新されていないことを確認
          expect(service.getAuthState().isAuthenticated).toBeFalse();
        }
      });
      
      // APIサービスが正しく呼び出されたことを確認
      expect(apiService.post).toHaveBeenCalledWith('auth/login', signInRequest);
    });
  });

  describe('signOut', () => {
    it('should sign out user and clear auth state in development environment', () => {
      // 開発環境のテスト
      // environmentオブジェクトをモック
      (environment as any).production = false;
      
      // 認証状態を設定
      const user = { id: 'user1', email: 'test@example.com', name: 'Test User', createdAt: '', updatedAt: '' };
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('idToken', 'id-token');
      localStorage.setItem('accessToken', 'access-token');
      localStorage.setItem('refreshToken', 'refresh-token');
      
      // サービスを再初期化
      service = new AuthService(apiService, router);
      
      spyOn(apiService, 'post').and.returnValue(of(undefined));
      spyOn(router, 'navigate');
      
      // サインアウト実行
      service.signOut();
      
      // APIサービスが正しく呼び出されたことを確認
      expect(apiService.post).toHaveBeenCalledWith('auth/signout', {});
      
      // ローカルストレージがクリアされたことを確認
      expect(localStorage.removeItem).toHaveBeenCalledWith('idToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
      
      // 認証状態がリセットされたことを確認
      expect(service.getAuthState().isAuthenticated).toBeFalse();
      expect(service.getAuthState().user).toBeNull();
      
      // ログイン画面にリダイレクトされたことを確認
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('getProfile', () => {
    it('should get user profile', () => {
      const user = { id: 'user1', email: 'test@example.com', name: 'Test User', createdAt: '', updatedAt: '' };
      
      spyOn(apiService, 'get').and.returnValue(of(user));
      
      // プロファイル取得実行
      service.getProfile().subscribe(result => {
        expect(result).toEqual(user);
      });
      
      // APIサービスが正しく呼び出されたことを確認
      expect(apiService.get).toHaveBeenCalledWith('profile');
    });
    
    it('should handle get profile error', () => {
      const errorMessage = 'プロファイルの取得に失敗しました。';
      
      spyOn(apiService, 'get').and.returnValue(throwError(() => new Error('Failed to get profile')));
      
      // プロファイル取得実行
      service.getProfile().subscribe({
        next: () => fail('Expected error, but got success'),
        error: (error) => {
          expect(error.message).toEqual(errorMessage);
        }
      });
      
      // APIサービスが正しく呼び出されたことを確認
      expect(apiService.get).toHaveBeenCalledWith('profile');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', () => {
      // 認証状態を設定
      const user = { id: 'user1', email: 'test@example.com', name: 'Test User', createdAt: '', updatedAt: '' };
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('idToken', 'id-token');
      
      // サービスを再初期化
      service = new AuthService(apiService, router);
      
      // 認証状態を確認
      expect(service.isAuthenticated()).toBeTrue();
    });
    
    it('should return false when user is not authenticated', () => {
      // 認証状態を設定しない
      
      // サービスを再初期化
      service = new AuthService(apiService, router);
      
      // 認証状態を確認
      expect(service.isAuthenticated()).toBeFalse();
    });
  });
});
