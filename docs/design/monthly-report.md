# 盆栽月次レポート機能 設計ドキュメント

## 1. 概要

盆栽月次レポート機能は、ユーザーの盆栽管理活動を月単位で集計・可視化し、記録として残すための機能です。月末に自動生成され、すべての盆栽の情報を1つのレポートにまとめて表示します。印刷しやすいデザインを重視し、視覚的に魅力的なレイアウトを提供します。

## 2. 機能要件

### 2.1 レポート生成と表示
- 月末に自動的にレポートを生成
- すべての盆栽の情報を1つのレポートにまとめて表示
- 印刷しやすいスタイル（プリントCSS）を適用
- 過去のレポートを閲覧できる履歴機能

### 2.2 レポートコンテンツ
1. **月ごとの作業記録の集計**
   - 作業タイプ別の実施回数
   - グラフによる視覚化（円グラフや棒グラフ）

2. **盆栽ごとの作業履歴の月次サマリー**
   - 各盆栽に対して実施した作業の一覧
   - 重要な作業のハイライト

3. **画像による盆栽の成長記録**
   - 少なくとも1枚の代表的な写真を表示
   - 可能であれば前月との比較写真

4. **特定の月に行われた重要な作業のハイライト**
   - 特に重要な作業（植替えや大きな剪定など）を強調表示

5. **次月の推奨作業リスト**
   - 樹種や季節に基づいた一般的な推奨作業
   - 盆栽ごとに必要な作業の提案

## 3. 技術設計

### 3.1 データモデル

#### 3.1.1 月次レポートモデル

```typescript
/**
 * 月次レポートモデル
 */
export interface MonthlyReport {
  id: string;
  userId: string;         // ユーザーID
  year: number;           // 年
  month: number;          // 月（1-12）
  generatedAt: string;    // 生成日時（ISO 8601形式）
  
  // 集計データ
  totalBonsaiCount: number;  // 盆栽総数
  totalWorkCount: number;    // 作業総数
  workTypeCounts: Record<WorkType, number>;  // 作業タイプ別カウント
  
  // 盆栽ごとのサマリー
  bonsaiSummaries: BonsaiMonthlySummary[];
  
  // 重要作業ハイライト
  highlights: WorkHighlight[];
  
  // 次月の推奨作業
  recommendedWorks: RecommendedWork[];
  
  // レポートのメタデータ
  reportTitle: string;    // レポートタイトル（例：「2025年3月 盆栽管理レポート」）
  coverImageUrl?: string; // カバー画像URL
}

/**
 * 盆栽月次サマリー
 */
export interface BonsaiMonthlySummary {
  bonsaiId: string;
  bonsaiName: string;
  species: string;
  imageUrl?: string;      // 代表画像URL
  workRecordIds: string[]; // 関連する作業記録ID
  workTypes: WorkType[];   // 実施した作業タイプ
  workSummary: string;    // 作業内容のサマリーテキスト
  hasImportantWork: boolean; // 重要な作業があったかどうか
}

/**
 * 作業ハイライト
 */
export interface WorkHighlight {
  recordId: string;
  bonsaiId: string;
  bonsaiName: string;
  workTypes: WorkType[];
  date: string;
  description: string;
  imageUrl?: string;
  importance: 'high' | 'medium' | 'low';
  highlightReason: string; // ハイライトされる理由
}

/**
 * 推奨作業
 */
export interface RecommendedWork {
  bonsaiId: string;
  bonsaiName: string;
  species: string;        // 樹種
  workTypes: WorkType[];
  reason: string;         // 推奨理由
  priority: 'high' | 'medium' | 'low';
  seasonalTips?: string;  // 季節に応じたアドバイス
}
```

#### 3.1.2 推奨作業マスターデータモデル

```typescript
/**
 * 推奨作業マスターデータ
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
```

### 3.2 コンポーネント設計

#### 3.2.1 フロントエンド

1. **月次レポート一覧コンポーネント**
   - 過去のレポート一覧を表示
   - 各レポートの基本情報（年月、盆栽数、作業数など）を表示
   - レポート詳細へのリンク

2. **月次レポート詳細コンポーネント**
   - レポートのヘッダー（タイトル、期間、サマリー情報）
   - 作業集計セクション（グラフ表示）
   - 盆栽ごとのサマリーセクション
   - 重要作業ハイライトセクション
   - 次月の推奨作業セクション
   - 印刷ボタン

3. **グラフ表示コンポーネント**
   - 作業タイプ別の集計を視覚化（Chart.jsを使用）

#### 3.2.2 バックエンド

1. **月次レポートサービス**
   - レポートデータの取得・保存
   - レポート生成ロジック

2. **月次レポートハンドラー**
   - APIエンドポイントの処理

3. **レポート生成スケジューラー**
   - 月末にレポートを自動生成

4. **推奨作業マスターデータ**
   - 樹種や季節に基づく推奨作業の定義

### 3.3 API設計

#### 3.3.1 クライアント側API（Angular Service）

```typescript
/**
 * 月次レポートサービス
 */
export class MonthlyReportService {
  /**
   * 月次レポート一覧を取得
   * 
   * @param limit 取得件数（オプション）
   * @param nextToken ページネーショントークン（オプション）
   * @returns Observable<MonthlyReportListResponse>
   */
  getMonthlyReportList(
    limit?: number,
    nextToken?: string
  ): Observable<MonthlyReportListResponse>;

  /**
   * 月次レポート詳細を取得
   * 
   * @param year 年
   * @param month 月（1-12）
   * @returns Observable<MonthlyReport>
   */
  getMonthlyReportDetail(
    year: number,
    month: number
  ): Observable<MonthlyReport>;

  /**
   * 最新の月次レポートを取得
   * 
   * @returns Observable<MonthlyReport>
   */
  getLatestMonthlyReport(): Observable<MonthlyReport>;
}
```

#### 3.3.2 サーバー側API（Lambda Handler）

```typescript
/**
 * 月次レポート一覧を取得
 * 
 * @param event APIGatewayProxyEvent
 * @returns APIGatewayProxyResult
 */
export async function getMonthlyReportList(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult>;

/**
 * 月次レポート詳細を取得
 * 
 * @param event APIGatewayProxyEvent
 * @returns APIGatewayProxyResult
 */
export async function getMonthlyReportDetail(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult>;

/**
 * 月次レポートを生成（スケジューラーから呼び出し）
 * 
 * @param event CloudWatchEvent
 * @returns void
 */
export async function generateMonthlyReport(
  event: any
): Promise<void>;
```

### 3.4 処理フロー

#### 3.4.1 月次レポート生成フロー

1. CloudWatch Eventsが月末にトリガーを発行
2. Lambda関数が起動し、前月の年月を計算
3. アクティブユーザー一覧を取得
4. 各ユーザーに対して：
   a. ユーザーの全盆栽を取得
   b. 対象月の日付範囲を計算
   c. 各盆栽に対して：
      i. 対象月の作業記録を取得
      ii. 作業記録を集計・分析
      iii. 重要作業を特定
      iv. 代表画像を選定（作業記録の画像がない場合は盆栽情報から取得）
      v. 盆栽月次サマリーを作成
   d. 作業タイプ別に集計
   e. 重要作業ハイライトを抽出
   f. 推奨作業マスターデータを取得
   g. 各盆栽に対して：
      i. 樹種・季節に基づく推奨作業を生成
      ii. 推奨作業に優先度を付ける
   h. 月次レポートデータを構築
   i. レポートデータを保存
5. 処理完了ログを記録

#### 3.4.2 月次レポート表示フロー

1. ユーザーがダッシュボードでレポートリンクをクリック
2. レポート一覧画面に遷移
3. レポート一覧を取得・表示
4. ユーザーが特定の月のレポートをクリック
5. レポート詳細画面に遷移
6. レポート詳細を取得
7. 作業タイプ別グラフを生成
8. 盆栽サマリーセクションを生成
9. 重要作業ハイライトセクションを生成
10. 推奨作業セクションを生成
11. レポート詳細を表示
12. ユーザーが印刷ボタンをクリック
13. 印刷用スタイルを適用
14. ブラウザの印刷ダイアログを表示

## 4. 画面設計

### 4.1 月次レポート一覧画面

月次レポート一覧画面では、過去のレポートを年月順に表示します。各レポートには、基本情報（盆栽数、作業数、重要作業の有無など）を表示します。

### 4.2 月次レポート詳細画面

月次レポート詳細画面では、以下のセクションを表示します：

1. **ヘッダー**
   - レポートタイトル（例：「2025年3月 盆栽管理レポート」）
   - 印刷ボタン
   - 代表的な盆栽の画像

2. **今月の作業集計**
   - 作業タイプ別の円グラフ
   - 総作業数、盆栽数、最も多い作業などの基本情報

3. **盆栽ごとの作業サマリー**
   - 各盆栽の名前、樹種
   - 実施した作業の一覧（日付、作業タイプ）
   - 代表画像

4. **今月の重要作業ハイライト**
   - 重要な作業の詳細（盆栽名、作業タイプ、日付、内容）
   - 作業画像

5. **次月の推奨作業**
   - 盆栽ごとの推奨作業リスト
   - 作業タイプ、理由、アドバイスなど

## 5. 実装計画

### 5.1 フロントエンド実装

1. 月次レポートモデルの定義
2. 月次レポートサービスの実装
3. 月次レポート一覧コンポーネントの実装
4. 月次レポート詳細コンポーネントの実装
5. グラフ表示コンポーネントの実装（Chart.jsを使用）
6. 印刷用CSSの実装
7. ルーティング設定の更新

### 5.2 バックエンド実装

1. 月次レポートモデルの定義
2. 推奨作業マスターデータの作成
3. 月次レポートサービスの実装
4. 月次レポートハンドラーの実装
5. レポート生成スケジューラーの実装
6. APIエンドポイントの設定

## 6. テスト計画

### 6.1 単体テスト

- 月次レポートサービスのテスト
- レポート生成ロジックのテスト
- 推奨作業生成ロジックのテスト

### 6.2 統合テスト

- APIエンドポイントのテスト
- レポート生成スケジューラーのテスト

### 6.3 E2Eテスト

- レポート一覧表示のテスト
- レポート詳細表示のテスト
- 印刷機能のテスト
