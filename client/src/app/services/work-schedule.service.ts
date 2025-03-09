import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { 
  WorkSchedule, 
  WorkScheduleListResponse, 
  CreateWorkScheduleRequest, 
  UpdateWorkScheduleRequest 
} from '../models/work-schedule.model';

@Injectable({
  providedIn: 'root'
})
export class WorkScheduleService {
  constructor(private apiService: ApiService) { }

  /**
   * 作業予定一覧を取得
   * 
   * @param bonsaiId 盆栽ID
   * @param completed 完了状態でフィルタリング（オプション）
   * @param limit 取得件数（オプション）
   * @param nextToken ページネーショントークン（オプション）
   * @returns Observable<WorkScheduleListResponse>
   */
  getWorkScheduleList(
    bonsaiId: string,
    completed?: boolean,
    limit?: number,
    nextToken?: string
  ): Observable<WorkScheduleListResponse> {
    const params: any = {};
    
    if (completed !== undefined) {
      params.completed = completed.toString();
    }
    
    if (limit) {
      params.limit = limit.toString();
    }
    
    if (nextToken) {
      params.nextToken = nextToken;
    }
    
    // APIからのレスポンスを処理して、必ずWorkScheduleListResponse型に変換する
    return this.apiService.get<any>(`bonsai/${bonsaiId}/schedules`, params)
      .pipe(
        map((response: any) => {
          // レスポンスがnullまたはundefinedの場合、空のレスポンスを返す
          if (!response) {
            return { items: [] };
          }
          
          // レスポンスがWorkScheduleListResponse型に準拠しているか確認
          if (!response.items || !Array.isArray(response.items)) {
            // itemsプロパティがない場合や配列でない場合、空の配列を設定
            return { 
              items: [],
              nextToken: response.nextToken
            };
          }
          
          // 正常なレスポンスの場合はそのまま返す
          return response as WorkScheduleListResponse;
        })
      );
  }

  /**
   * 作業予定詳細を取得
   * 
   * @param scheduleId 作業予定ID
   * @returns Observable<WorkSchedule>
   */
  getWorkScheduleDetail(scheduleId: string): Observable<WorkSchedule> {
    return this.apiService.get<WorkSchedule>(`schedules/${scheduleId}`);
  }

  /**
   * 作業予定を作成
   * 
   * @param bonsaiId 盆栽ID
   * @param data 作業予定作成リクエスト
   * @returns Observable<WorkSchedule>
   */
  createWorkSchedule(bonsaiId: string, data: CreateWorkScheduleRequest): Observable<WorkSchedule> {
    return this.apiService.post<WorkSchedule>(`bonsai/${bonsaiId}/schedules`, data);
  }

  /**
   * 作業予定を更新
   * 
   * @param scheduleId 作業予定ID
   * @param data 作業予定更新リクエスト
   * @returns Observable<WorkSchedule>
   */
  updateWorkSchedule(scheduleId: string, data: UpdateWorkScheduleRequest): Observable<WorkSchedule> {
    return this.apiService.put<WorkSchedule>(`schedules/${scheduleId}`, data);
  }

  /**
   * 作業予定を削除
   * 
   * @param scheduleId 作業予定ID
   * @returns Observable<{message: string, id: string}>
   */
  deleteWorkSchedule(scheduleId: string): Observable<{message: string, id: string}> {
    return this.apiService.delete<{message: string, id: string}>(`schedules/${scheduleId}`);
  }
}
