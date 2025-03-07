import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
// @ts-ignore
import { Auth } from 'aws-amplify';

import { 
  User, 
  AuthState, 
  SignInRequest, 
  SignUpRequest, 
  ConfirmSignUpRequest,
  ForgotPasswordRequest,
  ConfirmForgotPasswordRequest
} from '../models/user.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStateSubject = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    idToken: null,
    accessToken: null,
    refreshToken: null
  });

  authState$ = this.authStateSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    this.initAuthState();
  }

  /**
   * 認証状態を初期化
   */
  private initAuthState(): void {
    const idToken = localStorage.getItem('idToken');
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userJson = localStorage.getItem('user');
    
    if (idToken && userJson) {
      const user = JSON.parse(userJson) as User;
      this.authStateSubject.next({
        isAuthenticated: true,
        user,
        idToken,
        accessToken,
        refreshToken
      });
    }
  }

  /**
   * サインイン
   * 
   * @param request サインインリクエスト
   * @returns Observable<User>
   */
  signIn(request: SignInRequest): Observable<User> {
    // 本番環境ではCognitoを使用
    if (environment.production && environment.cognito) {
      return new Observable<User>(observer => {
        Auth.signIn(request.email, request.password)
          .then((cognitoUser: any) => {
            // Cognitoからユーザー情報を取得
            const idToken = cognitoUser.signInUserSession.idToken.jwtToken;
            const accessToken = cognitoUser.signInUserSession.accessToken.jwtToken;
            const refreshToken = cognitoUser.signInUserSession.refreshToken.token;
            
            // ユーザー情報を構築
            const user: User = {
              id: cognitoUser.attributes.sub,
              email: cognitoUser.attributes.email,
              name: cognitoUser.attributes.name || cognitoUser.attributes.email,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            // ローカルストレージに保存
            localStorage.setItem('idToken', idToken);
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));
            
            // 認証状態を更新
            this.authStateSubject.next({
              isAuthenticated: true,
              user,
              idToken,
              accessToken,
              refreshToken
            });
            
            observer.next(user);
            observer.complete();
          })
          .catch((error: any) => {
            console.error('Cognitoサインインエラー:', error);
            let errorMessage = 'サインインに失敗しました。';
            
            if (error.code === 'UserNotFoundException' || error.code === 'NotAuthorizedException') {
              errorMessage = 'メールアドレスまたはパスワードが正しくありません。';
            } else if (error.code === 'UserNotConfirmedException') {
              errorMessage = 'アカウントが確認されていません。確認コードを入力してください。';
            }
            
            observer.error(new Error(errorMessage));
          });
      });
    } else {
      // 開発環境では簡易的な実装を使用
      return this.apiService.post<{user: User, tokens: {idToken: string, accessToken: string, refreshToken: string}}>('/auth/login', request)
        .pipe(
          map(response => {
            const { user, tokens } = response;
            const { idToken, accessToken, refreshToken } = tokens;
            
            // ローカルストレージに保存
            localStorage.setItem('idToken', idToken);
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));
            
            // 認証状態を更新
            this.authStateSubject.next({
              isAuthenticated: true,
              user,
              idToken,
              accessToken,
              refreshToken
            });
            
            return user;
          }),
          catchError(error => {
            console.error('サインインエラー:', error);
            return throwError(() => new Error('サインインに失敗しました。メールアドレスとパスワードを確認してください。'));
          })
        );
    }
  }

  /**
   * サインアップ
   * 
   * @param request サインアップリクエスト
   * @returns Observable<void>
   */
  signUp(request: SignUpRequest): Observable<void> {
    // 本番環境ではCognitoを使用
    if (environment.production && environment.cognito) {
      return new Observable<void>(observer => {
        Auth.signUp({
          username: request.email,
          password: request.password,
          attributes: {
            email: request.email,
            name: request.name
          }
        })
          .then(() => {
            observer.next();
            observer.complete();
          })
          .catch((error: any) => {
            console.error('Cognitoサインアップエラー:', error);
            let errorMessage = 'サインアップに失敗しました。';
            
            if (error.code === 'UsernameExistsException') {
              errorMessage = 'このメールアドレスは既に登録されています。';
            } else if (error.code === 'InvalidPasswordException') {
              errorMessage = 'パスワードの要件を満たしていません。';
            }
            
            observer.error(new Error(errorMessage));
          });
      });
    } else {
      // 開発環境では簡易的な実装
      return this.apiService.post<void>('/auth/signup', request)
        .pipe(
          catchError(error => {
            console.error('サインアップエラー:', error);
            return throwError(() => new Error('サインアップに失敗しました。'));
          })
        );
    }
  }

  /**
   * サインアップ確認
   * 
   * @param request 確認リクエスト
   * @returns Observable<void>
   */
  confirmSignUp(request: ConfirmSignUpRequest): Observable<void> {
    // 本番環境ではCognitoを使用
    if (environment.production && environment.cognito) {
      return new Observable<void>(observer => {
        Auth.confirmSignUp(request.email, request.code)
          .then(() => {
            observer.next();
            observer.complete();
          })
          .catch((error: any) => {
            console.error('Cognito確認エラー:', error);
            let errorMessage = 'サインアップの確認に失敗しました。';
            
            if (error.code === 'CodeMismatchException') {
              errorMessage = '確認コードが正しくありません。';
            } else if (error.code === 'ExpiredCodeException') {
              errorMessage = '確認コードの有効期限が切れています。';
            }
            
            observer.error(new Error(errorMessage));
          });
      });
    } else {
      // 開発環境では簡易的な実装
      return this.apiService.post<void>('/auth/confirm-signup', request)
        .pipe(
          catchError(error => {
            console.error('サインアップ確認エラー:', error);
            return throwError(() => new Error('サインアップの確認に失敗しました。'));
          })
        );
    }
  }

  /**
   * パスワードリセット要求
   * 
   * @param request パスワードリセットリクエスト
   * @returns Observable<void>
   */
  forgotPassword(request: ForgotPasswordRequest): Observable<void> {
    // 本番環境ではCognitoを使用
    if (environment.production && environment.cognito) {
      return new Observable<void>(observer => {
        Auth.forgotPassword(request.email)
          .then(() => {
            observer.next();
            observer.complete();
          })
          .catch((error: any) => {
            console.error('Cognitoパスワードリセット要求エラー:', error);
            let errorMessage = 'パスワードリセットの要求に失敗しました。';
            
            if (error.code === 'UserNotFoundException') {
              errorMessage = 'このメールアドレスは登録されていません。';
            } else if (error.code === 'LimitExceededException') {
              errorMessage = 'リクエスト回数が制限を超えました。しばらく待ってから再試行してください。';
            }
            
            observer.error(new Error(errorMessage));
          });
      });
    } else {
      // 開発環境では簡易的な実装
      return this.apiService.post<void>('/auth/forgot-password', request)
        .pipe(
          catchError(error => {
            console.error('パスワードリセット要求エラー:', error);
            return throwError(() => new Error('パスワードリセットの要求に失敗しました。'));
          })
        );
    }
  }

  /**
   * パスワードリセット確認
   * 
   * @param request パスワードリセット確認リクエスト
   * @returns Observable<void>
   */
  confirmForgotPassword(request: ConfirmForgotPasswordRequest): Observable<void> {
    // 本番環境ではCognitoを使用
    if (environment.production && environment.cognito) {
      return new Observable<void>(observer => {
        Auth.forgotPasswordSubmit(request.email, request.code, request.newPassword)
          .then(() => {
            observer.next();
            observer.complete();
          })
          .catch((error: any) => {
            console.error('Cognitoパスワードリセット確認エラー:', error);
            let errorMessage = 'パスワードリセットの確認に失敗しました。';
            
            if (error.code === 'CodeMismatchException') {
              errorMessage = '確認コードが正しくありません。';
            } else if (error.code === 'ExpiredCodeException') {
              errorMessage = '確認コードの有効期限が切れています。';
            }
            
            observer.error(new Error(errorMessage));
          });
      });
    } else {
      // 開発環境では簡易的な実装
      return this.apiService.post<void>('/auth/confirm-forgot-password', request)
        .pipe(
          catchError(error => {
            console.error('パスワードリセット確認エラー:', error);
            return throwError(() => new Error('パスワードリセットの確認に失敗しました。'));
          })
        );
    }
  }

  /**
   * サインアウト
   */
  signOut(): void {
    // 本番環境ではCognitoを使用
    if (environment.production && environment.cognito) {
      Auth.signOut()
        .then(() => {
          // ローカルストレージをクリア
          localStorage.removeItem('idToken');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          
          // 認証状態をリセット
          this.authStateSubject.next({
            isAuthenticated: false,
            user: null,
            idToken: null,
            accessToken: null,
            refreshToken: null
          });
          
          // ログイン画面にリダイレクト
          this.router.navigate(['/auth/login']);
        })
        .catch((error: any) => {
          console.error('Cognitoサインアウトエラー:', error);
        });
    } else {
      // 開発環境では簡易的な実装
      this.apiService.post<void>('/auth/signout', {})
        .pipe(
          catchError(error => {
            console.error('サインアウトエラー:', error);
            return of(undefined); // エラーが発生しても続行
          })
        )
        .subscribe(() => {
          // ローカルストレージをクリア
          localStorage.removeItem('idToken');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          
          // 認証状態をリセット
          this.authStateSubject.next({
            isAuthenticated: false,
            user: null,
            idToken: null,
            accessToken: null,
            refreshToken: null
          });
          
          // ログイン画面にリダイレクト
          this.router.navigate(['/auth/login']);
        });
    }
  }

  /**
   * ユーザープロファイルを取得
   * 
   * @returns Observable<User>
   */
  getProfile(): Observable<User> {
    return this.apiService.get<User>('/profile')
      .pipe(
        catchError(error => {
          console.error('プロファイル取得エラー:', error);
          return throwError(() => new Error('プロファイルの取得に失敗しました。'));
        })
      );
  }

  /**
   * 認証状態を取得
   * 
   * @returns AuthState
   */
  getAuthState(): AuthState {
    return this.authStateSubject.value;
  }

  /**
   * 認証済みかどうかを確認
   * 
   * @returns boolean
   */
  isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }
}
