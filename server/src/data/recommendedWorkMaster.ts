/**
 * 推奨作業マスターデータ
 * 
 * このファイルは、樹種や季節に基づいた推奨作業を定義します。
 * 月次レポートの推奨作業リスト生成に使用されます。
 */

import { WorkType } from '../models/workRecord';

/**
 * 推奨作業マスターデータ型定義
 */
export interface RecommendedWorkMaster {
  id: string;             // 一意のID
  species: string[];      // 適用される樹種（複数可、空配列の場合はすべての樹種に適用）
  months: number[];       // 適用される月（1-12）
  workTypes: WorkType[];  // 推奨される作業タイプ
  description: string;    // 推奨作業の説明
  priority: 'high' | 'medium' | 'low'; // 優先度
  conditions?: {          // 適用条件（オプション）
    minAge?: number;      // 最小樹齢
    maxAge?: number;      // 最大樹齢
    lastWorkTypes?: {     // 前回の作業条件
      types: WorkType[];  // 作業タイプ
      monthsAgo: number;  // 何ヶ月前に行われたか
    }[];
  };
}

/**
 * 推奨作業マスターデータ
 */
export const recommendedWorkMasterData: RecommendedWorkMaster[] = [
  // 春（3-5月）の推奨作業
  {
    id: 'spring_pruning_pine',
    species: ['五葉松', '赤松', '黒松'],
    months: [4],
    workTypes: ['pruning'],
    description: '春の芽出し前の整枝剪定を行いましょう。新芽（みどり）が出てくる前に不要な枝を整理します。',
    priority: 'high'
  },
  {
    id: 'spring_budding_pine',
    species: ['五葉松', '赤松', '黒松'],
    months: [4, 5],
    workTypes: ['leafpull'],
    description: '新芽が伸びてきたら芽摘みを行いましょう。強い芽を残し、弱い芽や不要な芽を摘み取ります。',
    priority: 'high'
  },
  {
    id: 'spring_watering',
    species: [],
    months: [4, 5],
    workTypes: ['watering'],
    description: '成長期に入るため水やりの頻度を増やしましょう。土の表面が乾いたらたっぷりと水を与えます。',
    priority: 'medium'
  },
  {
    id: 'spring_fertilizing',
    species: [],
    months: [4],
    workTypes: ['fertilizing'],
    description: '成長期に向けて緩効性肥料を与えましょう。樹種に合わせた適切な肥料を選びます。',
    priority: 'medium'
  },
  {
    id: 'spring_disinfection',
    species: [],
    months: [4],
    workTypes: ['disinfection'],
    description: '春の病害虫予防のため消毒を行いましょう。新芽が出る前に予防的な消毒を行うことで、病害虫の発生を抑えられます。',
    priority: 'medium'
  },
  {
    id: 'spring_repotting_evergreen',
    species: ['真柏', '杜松', 'シンパク'],
    months: [3, 4],
    workTypes: ['repotting'],
    description: '常緑樹は春の芽吹き前が植え替えに適しています。根を整理し、新しい用土に植え替えましょう。',
    priority: 'high',
    conditions: {
      lastWorkTypes: [
        {
          types: ['repotting'],
          monthsAgo: 24 // 2年以上前に植え替えを行った場合
        }
      ]
    }
  },

  // 夏（6-8月）の推奨作業
  {
    id: 'summer_watering',
    species: [],
    months: [6, 7, 8],
    workTypes: ['watering'],
    description: '夏場は乾燥に注意し、朝夕の涼しい時間帯に水やりを行いましょう。葉水も効果的です。',
    priority: 'high'
  },
  {
    id: 'summer_protection',
    species: [],
    months: [7, 8],
    workTypes: ['protection'],
    description: '強い日差しから保護するため、半日陰に移動するか遮光ネットを使用しましょう。',
    priority: 'high'
  },
  {
    id: 'summer_leafcut_pine',
    species: ['五葉松', '赤松', '黒松'],
    months: [6, 7],
    workTypes: ['leafcut'],
    description: '夏の芽切りを行いましょう。伸びすぎた新芽を切り戻し、樹形を整えます。',
    priority: 'medium'
  },
  {
    id: 'summer_disinfection',
    species: [],
    months: [6, 7, 8],
    workTypes: ['disinfection'],
    description: '夏場は病害虫が発生しやすいため、定期的に消毒を行いましょう。',
    priority: 'medium'
  },

  // 秋（9-11月）の推奨作業
  {
    id: 'autumn_wire',
    species: [],
    months: [10, 11],
    workTypes: ['wire'],
    description: '成長が緩やかになる秋は針金かけに適した時期です。樹形を整えるために針金をかけましょう。',
    priority: 'medium'
  },
  {
    id: 'autumn_repotting_deciduous',
    species: ['楓', '欅', '榎', '梅', '桜'],
    months: [11],
    workTypes: ['repotting'],
    description: '落葉樹は落葉後の秋から冬にかけて植え替えに適しています。根を整理し、新しい用土に植え替えましょう。',
    priority: 'high',
    conditions: {
      lastWorkTypes: [
        {
          types: ['repotting'],
          monthsAgo: 24 // 2年以上前に植え替えを行った場合
        }
      ]
    }
  },
  {
    id: 'autumn_fertilizing',
    species: [],
    months: [9, 10],
    workTypes: ['fertilizing'],
    description: '冬に備えて緩効性肥料を与えましょう。冬越しのための栄養を蓄えさせます。',
    priority: 'medium'
  },
  {
    id: 'autumn_pruning',
    species: [],
    months: [9, 10],
    workTypes: ['pruning'],
    description: '秋の整枝剪定を行いましょう。夏に伸びた枝を整理し、冬の樹形を整えます。',
    priority: 'medium'
  },

  // 冬（12-2月）の推奨作業
  {
    id: 'winter_protection',
    species: [],
    months: [12, 1, 2],
    workTypes: ['protection'],
    description: '寒さから保護するため、風の当たらない場所に移動するか、防寒対策を行いましょう。',
    priority: 'high'
  },
  {
    id: 'winter_watering',
    species: [],
    months: [12, 1, 2],
    workTypes: ['watering'],
    description: '冬場は水やりの頻度を減らしましょう。土が完全に乾いてから少量の水を与えます。',
    priority: 'medium'
  },
  {
    id: 'winter_wireremove',
    species: [],
    months: [1, 2],
    workTypes: ['wireremove'],
    description: '長期間かけていた針金は樹皮に食い込む前に外しましょう。',
    priority: 'medium',
    conditions: {
      lastWorkTypes: [
        {
          types: ['wire'],
          monthsAgo: 3 // 3ヶ月以上前に針金をかけた場合
        }
      ]
    }
  },
  {
    id: 'winter_pruning_deciduous',
    species: ['楓', '欅', '榎', '梅', '桜'],
    months: [1, 2],
    workTypes: ['pruning'],
    description: '落葉樹は落葉期に剪定を行うと樹形が見やすく、適切な剪定ができます。',
    priority: 'high'
  }
];

/**
 * 月に基づいて推奨作業を取得する
 * 
 * @param month 月（1-12）
 * @param species 樹種（オプション）
 * @returns 推奨作業の配列
 */
export function getRecommendedWorksByMonth(month: number, species?: string): RecommendedWorkMaster[] {
  return recommendedWorkMasterData.filter(work => {
    // 月が一致するか確認
    const monthMatch = work.months.includes(month);
    
    // 樹種が指定されている場合、樹種が一致するか確認
    const speciesMatch = !species || 
                         work.species.length === 0 || 
                         work.species.includes(species);
    
    return monthMatch && speciesMatch;
  });
}

/**
 * 次の月の推奨作業を取得する
 * 
 * @param currentMonth 現在の月（1-12）
 * @param species 樹種（オプション）
 * @returns 次の月の推奨作業の配列
 */
export function getNextMonthRecommendedWorks(currentMonth: number, species?: string): RecommendedWorkMaster[] {
  // 次の月を計算（12月の次は1月）
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  
  return getRecommendedWorksByMonth(nextMonth, species);
}
