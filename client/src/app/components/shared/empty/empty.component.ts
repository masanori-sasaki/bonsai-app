import { Component } from '@angular/core';

/**
 * 空のコンポーネント
 * 
 * このコンポーネントは何も表示せず、特定のルートパターンをAngularルーターから除外するために使用されます。
 * 主に画像URLなど、Angularルーターで処理すべきでないパスに使用します。
 */
@Component({
  selector: 'app-empty',
  template: '',
  styles: []
})
export class EmptyComponent {}
