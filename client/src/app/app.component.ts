import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Bonsai App';

  constructor(private authService: AuthService) {}

  /**
   * サインアウト
   */
  signOut(): void {
    this.authService.signOut();
  }

  /**
   * 認証済みかどうかを確認
   * 
   * @returns boolean
   */
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
}
