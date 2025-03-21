import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * GETリクエストを送信
   * 
   * @param path APIパス
   * @param params クエリパラメータ
   * @returns Observable<T>
   */
  get<T>(path: string, params: any = {}): Observable<T> {
    const options = {
      headers: this.getHeaders(),
      params: this.buildParams(params)
    };
    // URLの末尾のスラッシュを削除して、正しいパスを構築
    const baseUrl = this.apiUrl.endsWith('/') ? this.apiUrl.slice(0, -1) : this.apiUrl;
    // apiUrlに既に/apiが含まれているか確認
    const apiPath = baseUrl.endsWith('/api') ? path : `api/${path}`;
    return this.http.get<T>(`${baseUrl}/${apiPath}`, options);
  }

  /**
   * POSTリクエストを送信
   * 
   * @param path APIパス
   * @param body リクエストボディ
   * @returns Observable<T>
   */
  post<T>(path: string, body: any): Observable<T> {
    const options = {
      headers: this.getHeaders()
    };
    // URLの末尾のスラッシュを削除して、正しいパスを構築
    const baseUrl = this.apiUrl.endsWith('/') ? this.apiUrl.slice(0, -1) : this.apiUrl;
    // apiUrlに既に/apiが含まれているか確認
    const apiPath = baseUrl.endsWith('/api') ? path : `api/${path}`;
    return this.http.post<T>(`${baseUrl}/${apiPath}`, body, options);
  }

  /**
   * PUTリクエストを送信
   * 
   * @param path APIパス
   * @param body リクエストボディ
   * @returns Observable<T>
   */
  put<T>(path: string, body: any): Observable<T> {
    const options = {
      headers: this.getHeaders()
    };
    // URLの末尾のスラッシュを削除して、正しいパスを構築
    const baseUrl = this.apiUrl.endsWith('/') ? this.apiUrl.slice(0, -1) : this.apiUrl;
    // apiUrlに既に/apiが含まれているか確認
    const apiPath = baseUrl.endsWith('/api') ? path : `api/${path}`;
    return this.http.put<T>(`${baseUrl}/${apiPath}`, body, options);
  }

  /**
   * DELETEリクエストを送信
   * 
   * @param path APIパス
   * @returns Observable<T>
   */
  delete<T>(path: string): Observable<T> {
    const options = {
      headers: this.getHeaders()
    };
    // URLの末尾のスラッシュを削除して、正しいパスを構築
    const baseUrl = this.apiUrl.endsWith('/') ? this.apiUrl.slice(0, -1) : this.apiUrl;
    // apiUrlに既に/apiが含まれているか確認
    const apiPath = baseUrl.endsWith('/api') ? path : `api/${path}`;
    return this.http.delete<T>(`${baseUrl}/${apiPath}`, options);
  }

  /**
   * HTTPヘッダーを取得
   * 
   * @returns HttpHeaders
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('idToken');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * クエリパラメータを構築
   * 
   * @param params パラメータオブジェクト
   * @returns HttpParams
   */
  private buildParams(params: any): HttpParams {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    
    return httpParams;
  }
}
