import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { 
  WorkRecord, 
  WorkRecordListResponse, 
  CreateWorkRecordRequest, 
  UpdateWorkRecordRequest 
} from '../models/work-record.model';

@Injectable({
  providedIn: 'root'
})
export class WorkRecordService {
  constructor(private apiService: ApiService) { }

  /**
   * 作業記録一覧を取得
   * 
   * @param bonsaiId 盆栽ID
   * @param workType 作業タイプでフィルタリング（オプション）
   * @param limit 取得件数（オプション）
   * @param nextToken ページネーショントークン（オプション）
   * @returns Observable<WorkRecordListResponse>
   */
  getWorkRecordList(
    bonsaiId: string,
    workType?: string,
    limit?: number,
    nextToken?: string
  ): Observable<WorkRecordListResponse> {
    const params: any = {};
    
    if (workType) {
      params.workType = workType;
    }
    
    if (limit) {
      params.limit = limit.toString();
    }
    
    if (nextToken) {
      params.nextToken = nextToken;
    }
    
    return this.apiService.get<WorkRecordListResponse>(`/bonsai/${bonsaiId}/records`, params);
  }

  /**
   * 作業記録詳細を取得
   * 
   * @param recordId 作業記録ID
   * @returns Observable<WorkRecord>
   */
  getWorkRecordDetail(recordId: string): Observable<WorkRecord> {
    return this.apiService.get<WorkRecord>(`/records/${recordId}`);
  }

  /**
   * 作業記録を作成
   * 
   * @param bonsaiId 盆栽ID
   * @param data 作業記録作成リクエスト
   * @returns Observable<WorkRecord>
   */
  createWorkRecord(bonsaiId: string, data: CreateWorkRecordRequest): Observable<WorkRecord> {
    return this.apiService.post<WorkRecord>(`/bonsai/${bonsaiId}/records`, data);
  }

  /**
   * 作業記録を更新
   * 
   * @param recordId 作業記録ID
   * @param data 作業記録更新リクエスト
   * @returns Observable<WorkRecord>
   */
  updateWorkRecord(recordId: string, data: UpdateWorkRecordRequest): Observable<WorkRecord> {
    return this.apiService.put<WorkRecord>(`/records/${recordId}`, data);
  }

  /**
   * 作業記録を削除
   * 
   * @param recordId 作業記録ID
   * @returns Observable<{message: string, id: string}>
   */
  deleteWorkRecord(recordId: string): Observable<{message: string, id: string}> {
    return this.apiService.delete<{message: string, id: string}>(`/records/${recordId}`);
  }
}
