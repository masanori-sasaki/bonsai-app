/**
 * 月次レポートサービス
 * 
 * このファイルは、月次レポートの生成や取得などの機能を提供します。
 */

import { MonthlyReport, MonthlyReportListResponse, MonthlyReportListItem, BonsaiMonthlySummary, WorkHighlight, RecommendedWork } from '../models/monthlyReport';
import { WorkRecord, WorkType } from '../models/workRecord';
import { Bonsai } from '../models/bonsai';
import { ResourceNotFoundError } from '../utils/errors';
import * as bonsaiService from './bonsaiService';
import * as workRecordService from './workRecordService';
import { createDataStore, DataStore } from '../data/dataStore';
import { getNextMonthRecommendedWorks, RecommendedWorkMaster } from '../data/recommendedWorkMaster';

// 作業タイプの表示名マッピング（ローカル定義）
const WORK_TYPE_LABELS: Record<WorkType, string> = {
  pruning: '剪定',
  repotting: '植替え',
  watering: '水やり',
  fertilizing: '肥料',
  wire: '針金かけ',
  wireremove: '針金はずし',
  leafpull: '芽摘み',
  leafcut: '芽切り',
  leafpeel: '葉透かし',
  disinfection: '消毒',
  carving: '彫刻',
  replant: '改作',
  protection: '保護',
  other: 'その他'
};

// 月次レポートデータストアの作成
const monthlyReportStore: DataStore<MonthlyReport> = createDataStore<MonthlyReport>('monthlyReport');

/**
 * 月次レポート一覧を取得
 * 
 * @param userId ユーザーID
 * @param limit 取得件数（オプション）
 * @param nextToken ページネーショントークン（オプション）
 * @returns 月次レポート一覧レスポンス
 */
export async function listMonthlyReports(
  userId: string,
  limit?: number,
  nextToken?: string
): Promise<MonthlyReportListResponse> {
  // すべての月次レポートを取得
  const allReports = await monthlyReportStore.getAll();
  
  // ユーザーIDに紐づく月次レポートをフィルタリング
  let reports = allReports.filter(report => report.userId === userId);
  
  // 年月の降順でソート（最新のレポートが先頭）
  reports.sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year; // 年の降順
    }
    return b.month - a.month; // 月の降順
  });
  
  // 最新のレポートにisNewフラグを設定
  if (reports.length > 0) {
    reports[0].isNew = true;
  }
  
  // ページネーション処理
  const pageSize = limit || 20;
  let startIndex = 0;
  
  if (nextToken) {
    try {
      // nextTokenから開始インデックスを取得
      const decodedToken = Buffer.from(nextToken, 'base64').toString('utf-8');
      const tokenData = JSON.parse(decodedToken);
      startIndex = tokenData.lastIndex || 0;
    } catch (error) {
      console.error('ページネーショントークンのデコードエラー:', error);
      startIndex = 0;
    }
  }
  
  // 指定された件数分のデータを取得
  const endIndex = Math.min(startIndex + pageSize, reports.length);
  const items: MonthlyReportListItem[] = reports.slice(startIndex, endIndex).map(report => ({
    id: report.id,
    year: report.year,
    month: report.month,
    generatedAt: report.generatedAt,
    totalBonsaiCount: report.totalBonsaiCount,
    totalWorkCount: report.totalWorkCount,
    highlightCount: report.highlights.length,
    isNew: report.isNew
  }));
  
  // 次ページがある場合はnextTokenを生成
  let responseNextToken: string | undefined;
  if (endIndex < reports.length) {
    const tokenData = { lastIndex: endIndex };
    responseNextToken = Buffer.from(JSON.stringify(tokenData)).toString('base64');
  }
  
  return {
    items,
    nextToken: responseNextToken
  };
}

/**
 * 月次レポート詳細を取得
 * 
 * @param userId ユーザーID
 * @param year 年
 * @param month 月（1-12）
 * @returns 月次レポート詳細
 */
export async function getMonthlyReport(
  userId: string,
  year: number,
  month: number
): Promise<MonthlyReport> {
  // すべての月次レポートを取得
  const allReports = await monthlyReportStore.getAll();
  
  // ユーザーID、年、月に一致するレポートを検索
  const report = allReports.find(r => 
    r.userId === userId && 
    r.year === year && 
    r.month === month
  );
  
  if (!report) {
    throw new ResourceNotFoundError('月次レポート', `${year}年${month}月`);
  }
  
  return report;
}

/**
 * 月次レポートを生成
 * 
 * @param userId ユーザーID
 * @param year 年
 * @param month 月（1-12）
 * @returns 生成された月次レポート
 */
export async function generateMonthlyReport(
  userId: string,
  year: number,
  month: number
): Promise<MonthlyReport> {
  // 既存のレポートがあるか確認
  const allReports = await monthlyReportStore.getAll();
  const existingReport = allReports.find(r => 
    r.userId === userId && 
    r.year === year && 
    r.month === month
  );
  
  if (existingReport) {
    // 既存のレポートがある場合は更新
    return updateMonthlyReport(existingReport.id);
  }
  
  // ユーザーの全盆栽を取得
  const bonsaiList = await bonsaiService.listBonsai(userId);
  const bonsais = bonsaiList.items;
  
  // 対象月の日付範囲を計算
  const startDate = new Date(year, month - 1, 1); // 月は0-11なので-1
  const endDate = new Date(year, month, 0); // 翌月の0日=当月の末日
  
  // 作業タイプ別カウント初期化
  const workTypeCounts: Record<WorkType, number> = {} as Record<WorkType, number>;
  
  // 盆栽ごとのサマリー配列
  const bonsaiSummaries: BonsaiMonthlySummary[] = [];
  
  // 重要作業ハイライト配列
  const highlights: WorkHighlight[] = [];
  
  // 総作業数
  let totalWorkCount = 0;
  
  // 各盆栽に対して処理
  for (const bonsai of bonsais) {
    // 盆栽の作業記録を取得
    const workRecordList = await workRecordService.listWorkRecords(userId, bonsai.id);
    const workRecords = workRecordList.items;
    
    // 対象月の作業記録をフィルタリング
    const monthWorkRecords = workRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });
    
    // 作業記録がない場合はスキップ
    if (monthWorkRecords.length === 0) {
      continue;
    }
    
    // 作業タイプ別カウントを更新
    monthWorkRecords.forEach(record => {
      record.workTypes.forEach(workType => {
        workTypeCounts[workType] = (workTypeCounts[workType] || 0) + 1;
      });
    });
    
    // 総作業数を更新
    totalWorkCount += monthWorkRecords.length;
    
    // 作業記録IDの配列
    const workRecordIds = monthWorkRecords.map(record => record.id);
    
    // 実施した作業タイプの配列（重複なし）
    const workTypes = Array.from(new Set(
      monthWorkRecords.flatMap(record => record.workTypes)
    ));
    
    // 作業内容のサマリーテキスト生成
    const workSummary = monthWorkRecords.map(record => {
      const date = new Date(record.date);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      const workTypeLabels = record.workTypes.map(type => WORK_TYPE_LABELS[type]).join(', ');
      return `${workTypeLabels}(${dateStr})`;
    }).join(', ');
    
    // 重要な作業があるかどうか
    const hasImportantWork = monthWorkRecords.some(record => {
      // 植替え、剪定、針金かけ、針金はずしは重要な作業とみなす
      return record.workTypes.some(type => 
        ['repotting', 'pruning', 'wire', 'wireremove'].includes(type)
      );
    });
    
    // 代表画像URL
    let imageUrl: string | undefined;
    
    // 作業記録の画像から代表画像を選定
    for (const record of monthWorkRecords) {
      if (record.imageUrls && record.imageUrls.length > 0) {
        imageUrl = record.imageUrls[0];
        break;
      }
    }
    
    // 作業記録の画像がない場合は盆栽情報から取得
    if (!imageUrl && bonsai.imageUrls && bonsai.imageUrls.length > 0) {
      imageUrl = bonsai.imageUrls[0];
    }
    
    // 盆栽月次サマリーを追加
    bonsaiSummaries.push({
      bonsaiId: bonsai.id,
      bonsaiName: bonsai.name,
      species: bonsai.species,
      imageUrl,
      workRecordIds,
      workTypes,
      workSummary,
      hasImportantWork
    });
    
    // 重要な作業をハイライトに追加
    if (hasImportantWork) {
      // 重要な作業を含む作業記録を抽出
      const importantRecords = monthWorkRecords.filter(record => 
        record.workTypes.some(type => 
          ['repotting', 'pruning', 'wire', 'wireremove'].includes(type)
        )
      );
      
      // 各重要作業をハイライトに追加
      for (const record of importantRecords) {
        const importantTypes = record.workTypes.filter(type => 
          ['repotting', 'pruning', 'wire', 'wireremove'].includes(type)
        );
        
        // 重要度を決定
        let importance: 'high' | 'medium' | 'low' = 'medium';
        if (record.workTypes.includes('repotting')) {
          importance = 'high'; // 植替えは最重要
        }
        
        // ハイライト理由を生成
        const typeLabels = importantTypes.map(type => WORK_TYPE_LABELS[type]).join('、');
        let highlightReason = `${typeLabels}は盆栽の成長に重要な作業です`;
        
        // 作業タイプに応じた理由を追加
        if (record.workTypes.includes('repotting')) {
          highlightReason = '年に一度の重要な植替え作業';
        } else if (record.workTypes.includes('pruning')) {
          highlightReason = '樹形を整える重要な剪定作業';
        } else if (record.workTypes.includes('wire')) {
          highlightReason = '樹形を作るための針金かけ作業';
        } else if (record.workTypes.includes('wireremove')) {
          highlightReason = '樹皮保護のための針金はずし作業';
        }
        
        // 画像URL
        const imageUrl = record.imageUrls && record.imageUrls.length > 0 
          ? record.imageUrls[0] 
          : undefined;
        
        // ハイライトを追加
        highlights.push({
          recordId: record.id,
          bonsaiId: bonsai.id,
          bonsaiName: bonsai.name,
          workTypes: importantTypes,
          date: record.date,
          description: record.description,
          imageUrl,
          importance,
          highlightReason
        });
      }
    }
  }
  
  // 次月の推奨作業を生成
  const recommendedWorks: RecommendedWork[] = [];
  
  // 各盆栽に対して推奨作業を生成
  for (const bonsai of bonsais) {
    // 次月の推奨作業マスターデータを取得
    const nextMonthRecommendedMasters = getNextMonthRecommendedWorks(month, bonsai.species);
    
    // 各推奨作業マスターデータから推奨作業を生成
    for (const master of nextMonthRecommendedMasters) {
      // 推奨作業を追加
      recommendedWorks.push({
        bonsaiId: bonsai.id,
        bonsaiName: bonsai.name,
        species: bonsai.species,
        workTypes: master.workTypes,
        reason: generateRecommendedReason(master, bonsai),
        priority: master.priority,
        seasonalTips: master.description
      });
    }
  }
  
  // 推奨作業を優先度順にソート
  recommendedWorks.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  // レポートタイトル
  const reportTitle = `${year}年${month}月 盆栽管理レポート`;
  
  // カバー画像URL（ハイライトの画像から選定）
  let coverImageUrl: string | undefined;
  if (highlights.length > 0) {
    // 重要度の高いハイライトから画像を選定
    const sortedHighlights = [...highlights].sort((a, b) => {
      const importanceOrder = { high: 0, medium: 1, low: 2 };
      return importanceOrder[a.importance] - importanceOrder[b.importance];
    });
    
    for (const highlight of sortedHighlights) {
      if (highlight.imageUrl) {
        coverImageUrl = highlight.imageUrl;
        break;
      }
    }
  }
  
  // カバー画像がない場合は盆栽サマリーから選定
  if (!coverImageUrl && bonsaiSummaries.length > 0) {
    for (const summary of bonsaiSummaries) {
      if (summary.imageUrl) {
        coverImageUrl = summary.imageUrl;
        break;
      }
    }
  }
  
  // 月次レポートデータを作成
  const reportData: Omit<MonthlyReport, 'id'> = {
    userId,
    year,
    month,
    generatedAt: new Date().toISOString(),
    totalBonsaiCount: bonsais.length,
    totalWorkCount,
    workTypeCounts,
    bonsaiSummaries,
    highlights,
    recommendedWorks,
    reportTitle,
    coverImageUrl
  };
  
  // 月次レポートを保存
  const newReport = await monthlyReportStore.create(reportData);
  
  return newReport;
}

/**
 * 月次レポートを更新
 * 
 * @param reportId 月次レポートID
 * @returns 更新された月次レポート
 */
export async function updateMonthlyReport(reportId: string): Promise<MonthlyReport> {
  // 月次レポートを取得
  const report = await monthlyReportStore.getById(reportId);
  
  if (!report) {
    throw new ResourceNotFoundError('月次レポート', reportId);
  }
  
  // レポートを再生成
  const updatedReport = await generateMonthlyReport(
    report.userId,
    report.year,
    report.month
  );
  
  return updatedReport;
}

/**
 * 推奨作業の理由を生成
 * 
 * @param master 推奨作業マスターデータ
 * @param bonsai 盆栽データ
 * @returns 推奨理由
 */
function generateRecommendedReason(
  master: RecommendedWorkMaster,
  bonsai: Bonsai
): string {
  // 作業タイプに応じた理由を生成
  const workTypeLabels = master.workTypes.map(type => WORK_TYPE_LABELS[type]).join('、');
  
  // 基本的な理由
  let reason = `${workTypeLabels}の時期です`;
  
  // 作業タイプに応じた詳細な理由
  if (master.workTypes.includes('pruning')) {
    reason = '樹形を整えるための剪定時期です';
  } else if (master.workTypes.includes('repotting')) {
    reason = '植え替えに適した時期です';
  } else if (master.workTypes.includes('fertilizing')) {
    reason = '肥料を与えるのに適した時期です';
  } else if (master.workTypes.includes('watering')) {
    if (master.months.some(m => [6, 7, 8].includes(m))) {
      reason = '夏場は水切れに注意が必要です';
    } else if (master.months.some(m => [12, 1, 2].includes(m))) {
      reason = '冬場は水やりの頻度を減らす時期です';
    } else {
      reason = '成長期に入るため水やりが重要です';
    }
  } else if (master.workTypes.includes('protection')) {
    if (master.months.some(m => [7, 8].includes(m))) {
      reason = '夏の強い日差しから保護する時期です';
    } else if (master.months.some(m => [12, 1, 2].includes(m))) {
      reason = '冬の寒さから保護する時期です';
    }
  } else if (master.workTypes.includes('wire')) {
    reason = '針金かけに適した時期です';
  } else if (master.workTypes.includes('wireremove')) {
    reason = '針金はずしの確認が必要な時期です';
  } else if (master.workTypes.includes('leafpull') || master.workTypes.includes('leafcut')) {
    reason = '新芽の管理が重要な時期です';
  } else if (master.workTypes.includes('disinfection')) {
    reason = '病害虫予防のための消毒時期です';
  }
  
  return reason;
}
