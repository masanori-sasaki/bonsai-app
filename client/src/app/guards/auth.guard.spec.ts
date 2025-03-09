import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    // AuthServiceのモック
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    
    // Routerのモック
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
    
    guard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate', () => {
    it('should return true for authenticated user', () => {
      // 認証済みユーザーの場合
      authService.isAuthenticated.and.returnValue(true);
      
      const result = guard.canActivate(null!, null!);
      
      expect(result).toBeTrue();
      expect(authService.isAuthenticated).toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });
    
    it('should redirect to login page and return false for unauthenticated user', () => {
      // 未認証ユーザーの場合
      authService.isAuthenticated.and.returnValue(false);
      
      const result = guard.canActivate(null!, null!);
      
      expect(result).toBeFalse();
      expect(authService.isAuthenticated).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  // canActivateChildは実装されていないため、テストは省略
});
