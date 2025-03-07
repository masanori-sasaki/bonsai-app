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
    return this.http.get<T>(`${this.apiUrl}${path}`, options);
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
    return this.http.post<T>(`${this.apiUrl}${path}`, body, options);
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
    return this.http.put<T>(`${this.apiUrl}${path}`, body, options);
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
    return this.http.delete<T>(`${this.apiUrl}${path}`, options);
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
