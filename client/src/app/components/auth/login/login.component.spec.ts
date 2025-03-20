import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Component } from '@angular/core';

import { LoginComponent } from './login.component';
import { AuthService } from '../../../services/auth.service';
import { SignInRequest } from '../../../models/user.model';

// テスト用のスタブコンポーネント
@Component({
  selector: 'app-login',
  template: '<div></div>' // 空のテンプレート
})
class LoginComponentStub extends LoginComponent {
  // 親クラスのコンストラクタを呼び出す
  constructor(
    formBuilder: FormBuilder,
    route: ActivatedRoute,
    router: Router,
    authService: AuthService
  ) {
    super(formBuilder, route, router, authService);
  }
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: Partial<ActivatedRoute>;

  beforeEach(async () => {
    // AuthServiceのモック
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isAuthenticated',
      'signIn',
      'completeNewPasswordChallenge'
    ]);
    
    // Routerのモック
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    
    // ActivatedRouteのモック
    const activatedRouteMock = {
      snapshot: {
        queryParams: { returnUrl: '/dashboard' }
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        RouterTestingModule
      ],
      declarations: [LoginComponentStub], // スタブコンポーネントを使用
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    activatedRoute = TestBed.inject(ActivatedRoute) as Partial<ActivatedRoute>;
  });

  beforeEach(() => {
    // 認証状態をリセット
    authService.isAuthenticated.and.returnValue(false);
    
    fixture = TestBed.createComponent(LoginComponentStub); // スタブコンポーネントを使用
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('コンポーネントの初期化', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should redirect to dashboard if already authenticated', () => {
      // コンポーネント作成前に認証済み状態に設定
      authService.isAuthenticated.and.returnValue(true);
      
      // コンポーネントを再作成
      fixture = TestBed.createComponent(LoginComponentStub);
      component = fixture.componentInstance;
      
      // ダッシュボードにリダイレクトされることを確認
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should initialize login form with empty fields', () => {
      expect(component.loginForm).toBeDefined();
      expect(component.loginForm.get('email')?.value).toBe('');
      expect(component.loginForm.get('password')?.value).toBe('');
      expect(component.loginForm.valid).toBeFalse();
    });

    it('should initialize new password form', () => {
      expect(component.newPasswordForm).toBeDefined();
      expect(component.newPasswordForm.get('newPassword')?.value).toBe('');
      expect(component.newPasswordForm.get('confirmPassword')?.value).toBe('');
      expect(component.newPasswordForm.valid).toBeFalse();
    });

    it('should set returnUrl from query params', () => {
      expect(component.returnUrl).toBe('/dashboard');
    });
  });

  describe('フォームバリデーション', () => {
    describe('ログインフォーム', () => {
      it('should validate email field', () => {
        const emailControl = component.loginForm.get('email');
        
        // 空の場合は無効
        emailControl?.setValue('');
        expect(emailControl?.valid).toBeFalse();
        expect(emailControl?.hasError('required')).toBeTrue();
        
        // 無効なメールアドレスの場合は無効
        emailControl?.setValue('invalid-email');
        expect(emailControl?.valid).toBeFalse();
        expect(emailControl?.hasError('email')).toBeTrue();
        
        // 有効なメールアドレスの場合は有効
        emailControl?.setValue('test@example.com');
        expect(emailControl?.valid).toBeTrue();
      });
      
      it('should validate password field', () => {
        const passwordControl = component.loginForm.get('password');
        
        // 空の場合は無効
        passwordControl?.setValue('');
        expect(passwordControl?.valid).toBeFalse();
        expect(passwordControl?.hasError('required')).toBeTrue();
        
        // 短すぎるパスワードの場合は無効
        passwordControl?.setValue('12345');
        expect(passwordControl?.valid).toBeFalse();
        expect(passwordControl?.hasError('minlength')).toBeTrue();
        
        // 十分な長さのパスワードの場合は有効
        passwordControl?.setValue('password123');
        expect(passwordControl?.valid).toBeTrue();
      });
      
      it('should validate the entire form', () => {
        // 初期状態では無効
        expect(component.loginForm.valid).toBeFalse();
        
        // 有効な値を設定
        component.loginForm.get('email')?.setValue('test@example.com');
        component.loginForm.get('password')?.setValue('password123');
        
        // フォーム全体が有効になることを確認
        expect(component.loginForm.valid).toBeTrue();
      });
    });
    
    describe('passwordMatchValidator', () => {
      it('should set error when passwords do not match', () => {
        // フォームに異なるパスワードを設定
        component.newPasswordForm.get('newPassword')?.setValue('password123');
        component.newPasswordForm.get('confirmPassword')?.setValue('password456');
        
        // バリデーターを手動で実行
        component.passwordMatchValidator(component.newPasswordForm);
        
        // エラーが設定されることを確認
        expect(component.newPasswordForm.get('confirmPassword')?.hasError('passwordMismatch')).toBeTrue();
      });
      
      it('should clear error when passwords match', () => {
        // フォームに同じパスワードを設定
        component.newPasswordForm.get('newPassword')?.setValue('password123');
        component.newPasswordForm.get('confirmPassword')?.setValue('password123');
        
        // バリデーターを手動で実行
        component.passwordMatchValidator(component.newPasswordForm);
        
        // エラーがクリアされることを確認
        expect(component.newPasswordForm.get('confirmPassword')?.hasError('passwordMismatch')).toBeFalse();
      });
    });
  });

  describe('ログイン処理', () => {
    describe('onSubmit', () => {
      it('should not call signIn when form is invalid', () => {
        // フォームを無効な状態にする
        component.loginForm.get('email')?.setValue('invalid-email');
        component.loginForm.get('password')?.setValue('');
        
        // 送信
        component.onSubmit();
        
        // signInが呼ばれないことを確認
        expect(authService.signIn).not.toHaveBeenCalled();
        // loadingフラグが設定されないことを確認
        expect(component.loading).toBeFalse();
      });
      
      it('should call signIn and navigate to returnUrl on successful login', fakeAsync(() => {
        // 認証成功のモック
        const user = { id: 'user1', email: 'test@example.com', name: 'Test User', createdAt: '', updatedAt: '' };
        authService.signIn.and.returnValue(of(user));
        
        // 有効なフォームデータを設定
        component.loginForm.get('email')?.setValue('test@example.com');
        component.loginForm.get('password')?.setValue('password123');
        
        // 送信
        component.onSubmit();
        tick(); // 非同期処理の完了を待つ
        
        // loadingフラグが設定されることを確認
        expect(component.loading).toBeTrue();
        
        // signInが正しく呼ばれることを確認
        const expectedRequest: SignInRequest = {
          email: 'test@example.com',
          password: 'password123'
        };
        expect(authService.signIn).toHaveBeenCalledWith(expectedRequest);
        
        // リダイレクトされることを確認
        expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      }));
      
      it('should handle NEW_PASSWORD_REQUIRED challenge', fakeAsync(() => {
        // NEW_PASSWORD_REQUIREDチャレンジのエラーを作成
        const error = new Error('新しいパスワードの設定が必要です');
        (error as any).challengeName = 'NEW_PASSWORD_REQUIRED';
        (error as any).cognitoUser = { username: 'test@example.com' };
        
        // エラーを返すようにモック
        authService.signIn.and.returnValue(throwError(() => error));
        
        // 有効なフォームデータを設定
        component.loginForm.get('email')?.setValue('test@example.com');
        component.loginForm.get('password')?.setValue('password123');
        
        // 送信
        component.onSubmit();
        tick(); // 非同期処理の完了を待つ
        
        // 新しいパスワードフォームが表示されることを確認
        expect(component.showNewPasswordForm).toBeTrue();
        expect(component.tempCognitoUser).toEqual({ username: 'test@example.com' });
        expect(component.error).toContain('新しいパスワード');
        expect(component.loading).toBeFalse();
      }));
      
      it('should handle generic login error', fakeAsync(() => {
        // 認証エラーのモック
        authService.signIn.and.returnValue(throwError(() => new Error('サインインに失敗しました')));
        
        // 有効なフォームデータを設定
        component.loginForm.get('email')?.setValue('test@example.com');
        component.loginForm.get('password')?.setValue('wrong-password');
        
        // 送信
        component.onSubmit();
        tick(); // 非同期処理の完了を待つ
        
        // エラーメッセージが設定されることを確認
        expect(component.error).toBe('サインインに失敗しました');
        expect(component.loading).toBeFalse();
      }));
      
      it('should handle specific error messages from auth service', fakeAsync(() => {
        // 特定のエラーメッセージを持つエラー
        const specificError = new Error('メールアドレスまたはパスワードが正しくありません。');
        authService.signIn.and.returnValue(throwError(() => specificError));
        
        // 有効なフォームデータを設定
        component.loginForm.get('email')?.setValue('test@example.com');
        component.loginForm.get('password')?.setValue('wrong-password');
        
        // 送信
        component.onSubmit();
        tick(); // 非同期処理の完了を待つ
        
        // 特定のエラーメッセージが設定されることを確認
        expect(component.error).toBe('メールアドレスまたはパスワードが正しくありません。');
        expect(component.loading).toBeFalse();
      }));
    });
  });

  describe('新しいパスワード設定処理', () => {
    describe('onSubmitNewPassword', () => {
      beforeEach(() => {
        // NEW_PASSWORD_REQUIRED状態を設定
        component.showNewPasswordForm = true;
        component.tempCognitoUser = { username: 'test@example.com' };
      });
      
      it('should not call completeNewPasswordChallenge when form is invalid', () => {
        // フォームを無効な状態にする
        component.newPasswordForm.get('newPassword')?.setValue('pass');
        component.newPasswordForm.get('confirmPassword')?.setValue('pass');
        
        // 送信
        component.onSubmitNewPassword();
        
        // completeNewPasswordChallengeが呼ばれないことを確認
        expect(authService.completeNewPasswordChallenge).not.toHaveBeenCalled();
        // loadingフラグが設定されないことを確認
        expect(component.loading).toBeFalse();
      });
      
      it('should not call completeNewPasswordChallenge when passwords do not match', () => {
        // パスワードが一致しないフォームを設定
        component.newPasswordForm.get('newPassword')?.setValue('password123');
        component.newPasswordForm.get('confirmPassword')?.setValue('password456');
        
        // バリデーターを手動で実行
        component.passwordMatchValidator(component.newPasswordForm);
        
        // 送信
        component.onSubmitNewPassword();
        
        // completeNewPasswordChallengeが呼ばれないことを確認
        expect(authService.completeNewPasswordChallenge).not.toHaveBeenCalled();
      });
      
      it('should call completeNewPasswordChallenge and navigate on success', fakeAsync(() => {
        // 認証成功のモック
        const user = { id: 'user1', email: 'test@example.com', name: 'Test User', createdAt: '', updatedAt: '' };
        authService.completeNewPasswordChallenge.and.returnValue(of(user));
        
        // 有効なフォームデータを設定
        component.newPasswordForm.get('newPassword')?.setValue('newPassword123');
        component.newPasswordForm.get('confirmPassword')?.setValue('newPassword123');
        
        // 送信
        component.onSubmitNewPassword();
        tick(); // 非同期処理の完了を待つ
        
        // loadingフラグが設定されることを確認
        expect(component.loading).toBeTrue();
        
        // completeNewPasswordChallengeが正しく呼ばれることを確認
        expect(authService.completeNewPasswordChallenge).toHaveBeenCalledWith(
          { username: 'test@example.com' },
          'newPassword123'
        );
        
        // リダイレクトされることを確認
        expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
      }));
      
      it('should handle new password error', fakeAsync(() => {
        // エラーのモック
        authService.completeNewPasswordChallenge.and.returnValue(
          throwError(() => new Error('パスワードの設定に失敗しました'))
        );
        
        // 有効なフォームデータを設定
        component.newPasswordForm.get('newPassword')?.setValue('newPassword123');
        component.newPasswordForm.get('confirmPassword')?.setValue('newPassword123');
        
        // 送信
        component.onSubmitNewPassword();
        tick(); // 非同期処理の完了を待つ
        
        // エラーメッセージが設定されることを確認
        expect(component.error).toBe('パスワードの設定に失敗しました');
        expect(component.loading).toBeFalse();
      }));
      
      it('should handle specific password requirement errors', fakeAsync(() => {
        // パスワード要件エラーのモック
        const specificError = new Error('パスワードの要件を満たしていません。');
        authService.completeNewPasswordChallenge.and.returnValue(throwError(() => specificError));
        
        // 有効なフォームデータを設定
        component.newPasswordForm.get('newPassword')?.setValue('newPassword123');
        component.newPasswordForm.get('confirmPassword')?.setValue('newPassword123');
        
        // 送信
        component.onSubmitNewPassword();
        tick(); // 非同期処理の完了を待つ
        
        // 特定のエラーメッセージが設定されることを確認
        expect(component.error).toBe('パスワードの要件を満たしていません。');
        expect(component.loading).toBeFalse();
      }));
    });
  });

  describe('ログインフォームへの戻り処理', () => {
    describe('backToLogin', () => {
      it('should reset new password form state', () => {
        // NEW_PASSWORD_REQUIRED状態を設定
        component.showNewPasswordForm = true;
        component.tempCognitoUser = { username: 'test@example.com' };
        component.error = 'エラーメッセージ';
        component.submitted = true;
        
        // 通常のログインフォームに戻る
        component.backToLogin();
        
        // 状態がリセットされることを確認
        expect(component.showNewPasswordForm).toBeFalse();
        expect(component.tempCognitoUser).toBeNull();
        expect(component.error).toBe('');
        expect(component.submitted).toBeFalse();
      });
    });
  });
});
