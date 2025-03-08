import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { SignInRequest } from '../../../models/user.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  newPasswordForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  returnUrl = '';
  
  // NEW_PASSWORD_REQUIREDチャレンジ用の状態
  showNewPasswordForm = false;
  tempCognitoUser: any = null;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    // すでに認証済みの場合はダッシュボードにリダイレクト
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnInit(): void {
    // ログインフォームの初期化
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // 新しいパスワードフォームの初期化
    this.newPasswordForm = this.formBuilder.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validator: this.passwordMatchValidator
    });

    // リダイレクト先のURLを取得
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  // パスワード一致バリデーター
  passwordMatchValidator(formGroup: FormGroup) {
    const newPassword = formGroup.get('newPassword')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    
    if (newPassword !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    } else {
      formGroup.get('confirmPassword')?.setErrors(null);
    }
  }

  // フォームコントロールへの簡易アクセス
  get f() { return this.loginForm.controls; }
  get nf() { return this.newPasswordForm.controls; }

  onSubmit(): void {
    this.submitted = true;

    // フォームが無効な場合は処理を中止
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    const request: SignInRequest = {
      email: this.f['email'].value,
      password: this.f['password'].value
    };

    this.authService.signIn(request)
      .subscribe({
        next: () => {
          this.router.navigate([this.returnUrl]);
        },
        error: error => {
          // NEW_PASSWORD_REQUIREDチャレンジの処理
          if (error.challengeName === 'NEW_PASSWORD_REQUIRED' && error.cognitoUser) {
            this.tempCognitoUser = error.cognitoUser;
            this.showNewPasswordForm = true;
            this.error = '初回ログインのため、新しいパスワードを設定してください。';
          } else {
            this.error = error.message || 'ログインに失敗しました';
          }
          this.loading = false;
        }
      });
  }

  onSubmitNewPassword(): void {
    this.submitted = true;

    // フォームが無効な場合は処理を中止
    if (this.newPasswordForm.invalid) {
      return;
    }

    this.loading = true;
    const newPassword = this.nf['newPassword'].value;

    this.authService.completeNewPasswordChallenge(this.tempCognitoUser, newPassword)
      .subscribe({
        next: () => {
          this.router.navigate([this.returnUrl]);
        },
        error: error => {
          this.error = error.message || 'パスワードの設定に失敗しました';
          this.loading = false;
        }
      });
  }

  // 通常のログインフォームに戻る
  backToLogin(): void {
    this.showNewPasswordForm = false;
    this.tempCognitoUser = null;
    this.error = '';
    this.submitted = false;
  }
}
