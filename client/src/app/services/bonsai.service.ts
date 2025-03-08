import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { 
  Bonsai, 
  BonsaiDetail, 
  BonsaiListResponse, 
  CreateBonsaiRequest, 
  UpdateBonsaiRequest 
} from '../models/bonsai.model';

@Injectable({
  providedIn: 'root'
})
export class BonsaiService {
  constructor(private apiService: ApiService) { }

  /**
   * 盆栽一覧を取得
   * 
   * @param limit 取得件数（オプション）
   * @param nextToken ページネーショントークン（オプション）
   * @returns Observable<BonsaiListResponse>
   */
  getBonsaiList(limit?: number, nextToken?: string): Observable<BonsaiListResponse> {
    const params: any = {};
    
    if (limit) {
      params.limit = limit.toString();
    }
    
    if (nextToken) {
      params.nextToken = nextToken;
    }
    
    return this.apiService.get<BonsaiListResponse>('bonsai', params);
  }

  /**
   * 盆栽詳細を取得
   * 
   * @param bonsaiId 盆栽ID
   * @returns Observable<BonsaiDetail>
   */
  getBonsaiDetail(bonsaiId: string): Observable<BonsaiDetail> {
    return this.apiService.get<BonsaiDetail>(`bonsai/${bonsaiId}`);
  }

  /**
   * 盆栽を作成
   * 
   * @param data 盆栽作成リクエスト
   * @returns Observable<Bonsai>
   */
  createBonsai(data: CreateBonsaiRequest): Observable<Bonsai> {
    return this.apiService.post<Bonsai>('bonsai', data);
  }

  /**
   * 盆栽を更新
   * 
   * @param bonsaiId 盆栽ID
   * @param data 盆栽更新リクエスト
   * @returns Observable<Bonsai>
   */
  updateBonsai(bonsaiId: string, data: UpdateBonsaiRequest): Observable<Bonsai> {
    return this.apiService.put<Bonsai>(`bonsai/${bonsaiId}`, data);
  }

  /**
   * 盆栽を削除
   * 
   * @param bonsaiId 盆栽ID
   * @returns Observable<{message: string, id: string}>
   */
  deleteBonsai(bonsaiId: string): Observable<{message: string, id: string}> {
    return this.apiService.delete<{message: string, id: string}>(`bonsai/${bonsaiId}`);
  }
}
