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
  loading = false;
  submitted = false;
  error = '';
  returnUrl = '';

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
    // フォームの初期化
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // リダイレクト先のURLを取得
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  // フォームコントロールへの簡易アクセス
  get f() { return this.loginForm.controls; }

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
          this.error = error.message || 'ログインに失敗しました';
          this.loading = false;
        }
      });
  }
}
