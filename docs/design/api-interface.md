# API インターフェース定義

このドキュメントでは、Bonsai App（盆栽管理アプリ）のバックエンドAPIのインターフェースを定義します。

## 目次

1. [認証](#認証)
2. [エンドポイント一覧](#エンドポイント一覧)
3. [エラーレスポンス](#エラーレスポンス)
4. [データモデル](#データモデル)

## 認証

すべてのAPIリクエストは、Amazon Cognitoによる認証が必要です。認証されたリクエストには、以下のヘッダーを含める必要があります：

```
Authorization: Bearer <id_token>
```

`<id_token>`は、Cognito認証フローで取得したIDトークンです。

## エンドポイント一覧

### 画像アップロード

```
POST /api/images/presigned-url
```

**認証**: 必須

**リクエストボディ**:
```json
{
  "fileName": "example.jpg",
  "fileType": "image/jpeg"
}
```

**レスポンス**:
```json
{
  "url": "https://bonsai-app-dev-123456789012.s3.amazonaws.com/images/user123/abc123.jpg?AWSAccessKeyId=...",
  "publicUrl": "https://bonsai-app-dev-123456789012.s3.amazonaws.com/images/user123/abc123.jpg"
}
```

### ヘルスチェック

```
GET /api/health
```

**認証**: 不要

**レスポンス**:
```json
{
  "status": "healthy",
  "timestamp": "2025-03-05T14:30:00Z"
}
```

### ユーザープロファイル

#### プロファイル取得

```
GET /api/profile
```

**認証**: 必須

**レスポンス**:
```json
{
  "id": "user123",
  "email": "user@example.com",
  "name": "山田太郎",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-03-01T09:15:00Z"
}
```

#### プロファイル更新

```
PUT /api/profile
```

**認証**: 必須

**リクエストボディ**:
```json
{
  "name": "山田次郎"
}
```

**レスポンス**:
```json
{
  "id": "user123",
  "email": "user@example.com",
  "name": "山田次郎",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-03-05T14:35:00Z"
}
```

### 盆栽

#### 盆栽一覧取得

```
GET /api/bonsai
```

**認証**: 必須

**クエリパラメータ**:
- `limit` (オプション): 取得する最大件数（デフォルト: 20）
- `nextToken` (オプション): ページネーショントークン

**レスポンス**:
```json
{
  "items": [
    {
      "id": "bonsai123",
      "name": "五葉松",
      "species": "五葉松（Pinus parviflora）",
      "registrationDate": "2024-01-15T00:00:00Z",
      "imageUrls": ["https://example.com/images/bonsai123-1.jpg"],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-02-20T15:30:00Z"
    },
    {
      "id": "bonsai456",
      "name": "真柏",
      "species": "真柏（Juniperus chinensis）",
      "registrationDate": "2024-02-10T00:00:00Z",
      "imageUrls": ["https://example.com/images/bonsai456-1.jpg"],
      "createdAt": "2024-02-10T09:00:00Z",
      "updatedAt": "2024-02-10T09:00:00Z"
    }
  ],
  "nextToken": "eyJsYXN0RXZhbHVhdGVkS2V5Ijp7ImlkIjoiYm9uc2FpNDU2In19"
}
```

#### 盆栽詳細取得

```
GET /api/bonsai/{bonsaiId}
```

**認証**: 必須

**パスパラメータ**:
- `bonsaiId`: 盆栽ID

**レスポンス**:
```json
{
  "id": "bonsai123",
  "name": "五葉松",
  "species": "五葉松（Pinus parviflora）",
  "registrationDate": "2024-01-15T00:00:00Z",
  "history": "2023年に購入。元は山採りの素材で、樹齢は推定30年。",
  "imageUrls": [
    "https://example.com/images/bonsai123-1.jpg",
    "https://example.com/images/bonsai123-2.jpg"
  ],
  "recentWorks": [
    {
      "id": "work123",
      "workType": "pruning",
      "date": "2024-02-15T00:00:00Z"
    },
    {
      "id": "work456",
      "workType": "repotting",
      "date": "2024-01-20T00:00:00Z"
    }
  ],
  "upcomingWorks": [
    {
      "id": "schedule123",
      "workType": "fertilizing",
      "scheduledDate": "2024-03-15T00:00:00Z"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-02-20T15:30:00Z"
}
```

#### 盆栽登録

```
POST /api/bonsai
```

**認証**: 必須

**リクエストボディ**:
```json
{
  "name": "黒松",
  "species": "黒松（Pinus thunbergii）",
  "registrationDate": "2024-03-01T00:00:00Z",
  "history": "2024年3月に購入。樹齢は推定10年。",
  "imageUrls": ["https://example.com/images/new-bonsai-1.jpg"]
}
```

**レスポンス**:
```json
{
  "id": "bonsai789",
  "name": "黒松",
  "species": "黒松（Pinus thunbergii）",
  "registrationDate": "2024-03-01T00:00:00Z",
  "history": "2024年3月に購入。樹齢は推定10年。",
  "imageUrls": ["https://example.com/images/new-bonsai-1.jpg"],
  "createdAt": "2024-03-05T14:40:00Z",
  "updatedAt": "2024-03-05T14:40:00Z"
}
```

#### 盆栽更新

```
PUT /api/bonsai/{bonsaiId}
```

**認証**: 必須

**パスパラメータ**:
- `bonsaiId`: 盆栽ID

**リクエストボディ**:
```json
{
  "name": "黒松 - 玄関",
  "history": "2024年3月に購入。樹齢は推定10年。2024年3月に初めての剪定を実施。"
}
```

**レスポンス**:
```json
{
  "id": "bonsai789",
  "name": "黒松 - 玄関",
  "species": "黒松（Pinus thunbergii）",
  "registrationDate": "2024-03-01T00:00:00Z",
  "history": "2024年3月に購入。樹齢は推定10年。2024年3月に初めての剪定を実施。",
  "imageUrls": ["https://example.com/images/new-bonsai-1.jpg"],
  "createdAt": "2024-03-05T14:40:00Z",
  "updatedAt": "2024-03-05T14:45:00Z"
}
```

#### 盆栽削除

```
DELETE /api/bonsai/{bonsaiId}
```

**認証**: 必須

**パスパラメータ**:
- `bonsaiId`: 盆栽ID

**レスポンス**:
```json
{
  "message": "盆栽が正常に削除されました",
  "id": "bonsai789"
}
```

### 作業記録

#### 作業記録一覧取得

```
GET /api/bonsai/{bonsaiId}/records
```

**認証**: 必須

**パスパラメータ**:
- `bonsaiId`: 盆栽ID

**クエリパラメータ**:
- `workType` (オプション): 作業タイプでフィルタリング
- `limit` (オプション): 取得する最大件数（デフォルト: 20）
- `nextToken` (オプション): ページネーショントークン

**レスポンス**:
```json
{
  "items": [
    {
      "id": "record123",
      "bonsaiId": "bonsai123",
      "workType": "pruning",
      "date": "2024-02-15T00:00:00Z",
      "description": "春の芽摘み。新芽を1/3程度間引いた。",
      "imageUrls": [
        "https://example.com/images/record123-before.jpg",
        "https://example.com/images/record123-after.jpg"
      ],
      "isAllDay": true,
      "priority": "medium",
      "createdAt": "2024-02-15T10:00:00Z",
      "updatedAt": "2024-02-15T10:00:00Z"
    },
    {
      "id": "record456",
      "bonsaiId": "bonsai123",
      "workType": "repotting",
      "date": "2024-01-20T00:00:00Z",
      "description": "赤玉土7：鹿沼土3の配合で植え替え。根は1/3程度剪定。",
      "imageUrls": [
        "https://example.com/images/record456-before.jpg",
        "https://example.com/images/record456-after.jpg"
      ],
      "isAllDay": false,
      "startTime": "09:00",
      "endTime": "11:30",
      "priority": "high",
      "createdAt": "2024-01-20T11:30:00Z",
      "updatedAt": "2024-01-20T11:30:00Z"
    }
  ],
  "nextToken": null
}
```

#### 作業記録詳細取得

```
GET /api/records/{recordId}
```

**認証**: 必須

**パスパラメータ**:
- `recordId`: 作業記録ID

**レスポンス**:
```json
{
  "id": "record123",
  "bonsaiId": "bonsai123",
  "workType": "pruning",
  "date": "2024-02-15T00:00:00Z",
  "description": "春の芽摘み。新芽を1/3程度間引いた。次回は7月頃に夏の剪定を予定。",
  "imageUrls": [
    "https://example.com/images/record123-before.jpg",
    "https://example.com/images/record123-after.jpg"
  ],
  "isAllDay": true,
  "priority": "medium",
  "colorCode": "#4CAF50",
  "createdAt": "2024-02-15T10:00:00Z",
  "updatedAt": "2024-02-15T10:00:00Z"
}
```

#### 作業記録登録

```
POST /api/bonsai/{bonsaiId}/records
```

**認証**: 必須

**パスパラメータ**:
- `bonsaiId`: 盆栽ID

**リクエストボディ**:
```json
{
  "workType": "fertilizing",
  "date": "2024-03-05T00:00:00Z",
  "description": "有機肥料を与えた。次回は1ヶ月後を予定。",
  "imageUrls": ["https://example.com/images/new-record-1.jpg"],
  "isAllDay": false,
  "startTime": "09:00",
  "endTime": "09:30",
  "priority": "medium",
  "colorCode": "#FF9800"
}
```

**レスポンス**:
```json
{
  "id": "record789",
  "bonsaiId": "bonsai123",
  "workType": "fertilizing",
  "date": "2024-03-05T00:00:00Z",
  "description": "有機肥料を与えた。次回は1ヶ月後を予定。",
  "imageUrls": ["https://example.com/images/new-record-1.jpg"],
  "isAllDay": false,
  "startTime": "09:00",
  "endTime": "09:30",
  "priority": "medium",
  "colorCode": "#FF9800",
  "createdAt": "2024-03-05T15:00:00Z",
  "updatedAt": "2024-03-05T15:00:00Z"
}
```

#### 作業記録更新

```
PUT /api/records/{recordId}
```

**認証**: 必須

**パスパラメータ**:
- `recordId`: 作業記録ID

**リクエストボディ**:
```json
{
  "description": "有機肥料を与えた。次回は1ヶ月後を予定。効果は良好。",
  "imageUrls": [
    "https://example.com/images/new-record-1.jpg",
    "https://example.com/images/new-record-2.jpg"
  ],
  "priority": "high"
}
```

**レスポンス**:
```json
{
  "id": "record789",
  "bonsaiId": "bonsai123",
  "workType": "fertilizing",
  "date": "2024-03-05T00:00:00Z",
  "description": "有機肥料を与えた。次回は1ヶ月後を予定。効果は良好。",
  "imageUrls": [
    "https://example.com/images/new-record-1.jpg",
    "https://example.com/images/new-record-2.jpg"
  ],
  "isAllDay": false,
  "startTime": "09:00",
  "endTime": "09:30",
  "priority": "high",
  "colorCode": "#FF9800",
  "createdAt": "2024-03-05T15:00:00Z",
  "updatedAt": "2024-03-05T15:05:00Z"
}
```

#### 作業記録削除

```
DELETE /api/records/{recordId}
```

**認証**: 必須

**パスパラメータ**:
- `recordId`: 作業記録ID

**レスポンス**:
```json
{
  "message": "作業記録が正常に削除されました",
  "id": "record789"
}
```

### 作業予定

#### 作業予定一覧取得

```
GET /api/bonsai/{bonsaiId}/schedules
```

**認証**: 必須

**パスパラメータ**:
- `bonsaiId`: 盆栽ID

**クエリパラメータ**:
- `completed` (オプション): 完了状態でフィルタリング（true/false）
- `limit` (オプション): 取得する最大件数（デフォルト: 20）
- `nextToken` (オプション): ページネーショントークン

**レスポンス**:
```json
{
  "items": [
    {
      "id": "schedule123",
      "bonsaiId": "bonsai123",
      "workType": "pruning",
      "scheduledDate": "2024-04-15T00:00:00Z",
      "description": "春の剪定予定",
      "completed": false,
      "isAllDay": true,
      "priority": "high",
      "colorCode": "#4CAF50",
      "reminderDays": 3,
      "createdAt": "2024-03-01T10:00:00Z",
      "updatedAt": "2024-03-01T10:00:00Z"
    },
    {
      "id": "schedule456",
      "bonsaiId": "bonsai123",
      "workType": "fertilizing",
      "scheduledDate": "2024-04-05T00:00:00Z",
      "description": "月次の肥料",
      "completed": false,
      "isAllDay": false,
      "startTime": "10:00",
      "endTime": "10:30",
      "priority": "medium",
      "colorCode": "#FF9800",
      "reminderDays": 1,
      "recurrencePattern": {
        "type": "monthly",
        "interval": 1,
        "occurrences": 6
      },
      "createdAt": "2024-03-05T11:30:00Z",
      "updatedAt": "2024-03-05T11:30:00Z"
    }
  ],
  "nextToken": null
}
```

#### 作業予定登録

```
POST /api/bonsai/{bonsaiId}/schedules
```

**認証**: 必須

**パスパラメータ**:
- `bonsaiId`: 盆栽ID

**リクエストボディ**:
```json
{
  "workType": "repotting",
  "scheduledDate": "2024-05-10T00:00:00Z",
  "description": "2年ぶりの植え替え。赤玉土と鹿沼土を用意する。",
  "isAllDay": true,
  "priority": "high",
  "colorCode": "#2196F3",
  "reminderDays": 7,
  "recurrencePattern": {
    "type": "yearly",
    "interval": 2,
    "occurrences": 5
  }
}
```

**レスポンス**:
```json
{
  "id": "schedule789",
  "bonsaiId": "bonsai123",
  "workType": "repotting",
  "scheduledDate": "2024-05-10T00:00:00Z",
  "description": "2年ぶりの植え替え。赤玉土と鹿沼土を用意する。",
  "completed": false,
  "isAllDay": true,
  "priority": "high",
  "colorCode": "#2196F3",
  "reminderDays": 7,
  "recurrencePattern": {
    "type": "yearly",
    "interval": 2,
    "occurrences": 5
  },
  "createdAt": "2024-03-05T15:30:00Z",
  "updatedAt": "2024-03-05T15:30:00Z"
}
```

#### 作業予定更新

```
PUT /api/schedules/{scheduleId}
```

**認証**: 必須

**パスパラメータ**:
- `scheduleId`: 作業予定ID

**リクエストボディ**:
```json
{
  "scheduledDate": "2024-05-15T00:00:00Z",
  "completed": true,
  "reminderDays": 3
}
```

**レスポンス**:
```json
{
  "id": "schedule789",
  "bonsaiId": "bonsai123",
  "workType": "repotting",
  "scheduledDate": "2024-05-15T00:00:00Z",
  "description": "2年ぶりの植え替え。赤玉土と鹿沼土を用意する。",
  "completed": true,
  "isAllDay": true,
  "priority": "high",
  "colorCode": "#2196F3",
  "reminderDays": 3,
  "recurrencePattern": {
    "type": "yearly",
    "interval": 2,
    "occurrences": 5
  },
  "createdAt": "2024-03-05T15:30:00Z",
  "updatedAt": "2024-03-05T15:35:00Z"
}
```

#### 作業予定削除

```
DELETE /api/schedules/{scheduleId}
```

**認証**: 必須

**パスパラメータ**:
- `scheduleId`: 作業予定ID

**レスポンス**:
```json
{
  "message": "作業予定が正常に削除されました",
  "id": "schedule789"
}
```

### 月次レポート

#### 月次レポート一覧取得

```
GET /api/reports
```

**認証**: 必須

**クエリパラメータ**:
- `limit` (オプション): 取得する最大件数（デフォルト: 20）
- `nextToken` (オプション): ページネーショントークン

**レスポンス**:
```json
{
  "items": [
    {
      "id": "report202503",
      "year": 2025,
      "month": 3,
      "generatedAt": "2025-04-01T00:05:00Z",
      "totalBonsaiCount": 5,
      "totalWorkCount": 12,
      "highlightCount": 2,
      "isNew": true
    },
    {
      "id": "report202502",
      "year": 2025,
      "month": 2,
      "generatedAt": "2025-03-01T00:10:00Z",
      "totalBonsaiCount": 5,
      "totalWorkCount": 8,
      "highlightCount": 1,
      "isNew": false
    }
  ],
  "nextToken": null
}
```

#### 月次レポート詳細取得

```
GET /api/reports/{year}/{month}
```

**認証**: 必須

**パスパラメータ**:
- `year`: 年
- `month`: 月（1-12）

**レスポンス**:
```json
{
  "id": "report202503",
  "userId": "user123",
  "year": 2025,
  "month": 3,
  "generatedAt": "2025-04-01T00:05:00Z",
  "reportTitle": "2025年3月 盆栽管理レポート",
  "coverImageUrl": "https://example.com/images/report-cover-202503.jpg",
  
  "totalBonsaiCount": 5,
  "totalWorkCount": 12,
  "workTypeCounts": {
    "pruning": 3,
    "watering": 5,
    "fertilizing": 2,
    "wire": 1,
    "wireremove": 1
  },
  
  "bonsaiSummaries": [
    {
      "bonsaiId": "bonsai123",
      "bonsaiName": "松風（五葉松）",
      "species": "五葉松",
      "imageUrl": "https://example.com/images/bonsai123-202503.jpg",
      "workRecordIds": ["record123", "record456", "record789"],
      "workTypes": ["pruning", "watering", "fertilizing"],
      "workSummary": "剪定(3/5), 水やり(3/10, 3/20), 肥料(3/15)",
      "hasImportantWork": true
    },
    {
      "bonsaiId": "bonsai456",
      "bonsaiName": "翠松（真柏）",
      "species": "真柏",
      "imageUrl": "https://example.com/images/bonsai456-202503.jpg",
      "workRecordIds": ["record321", "record654"],
      "workTypes": ["watering"],
      "workSummary": "水やり(3/10, 3/20)",
      "hasImportantWork": false
    }
  ],
  
  "highlights": [
    {
      "recordId": "record123",
      "bonsaiId": "bonsai123",
      "bonsaiName": "松風（五葉松）",
      "workTypes": ["pruning"],
      "date": "2025-03-05T00:00:00Z",
      "description": "春の芽出し前の整枝剪定を実施。不要な枝を整理し、樹形を整えた。",
      "imageUrl": "https://example.com/images/record123-after.jpg",
      "importance": "high",
      "highlightReason": "年に一度の重要な剪定作業"
    }
  ],
  
  "recommendedWorks": [
    {
      "bonsaiId": "bonsai123",
      "bonsaiName": "松風（五葉松）",
      "species": "五葉松",
      "workTypes": ["leafpull", "watering"],
      "reason": "成長期に入るため、新芽の管理と水やりが重要です",
      "priority": "high",
      "seasonalTips": "新芽が伸びてきたら芽摘みを行いましょう。成長期に入るため水やりの頻度を増やしましょう。"
    },
    {
      "bonsaiId": "bonsai456",
      "bonsaiName": "翠松（真柏）",
      "species": "真柏",
      "workTypes": ["disinfection", "fertilizing"],
      "reason": "春の病害虫予防と成長促進のため",
      "priority": "medium",
      "seasonalTips": "春の病害虫予防のため消毒を行いましょう。成長期に向けて緩効性肥料を与えましょう。"
    }
  ]
}
```

## エラーレスポンス

APIはエラーが発生した場合、適切なHTTPステータスコードと以下の形式のJSONレスポンスを返します：

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "指定されたリソースが見つかりませんでした",
    "details": {
      "resourceType": "Project",
      "resourceId": "project999"
    }
  }
}
```

### 一般的なエラーコード

| コード | 説明 |
|--------|------|
| `INVALID_REQUEST` | リクエストの形式が不正 |
| `UNAUTHORIZED` | 認証が必要 |
| `FORBIDDEN` | 権限がない |
| `RESOURCE_NOT_FOUND` | リソースが見つからない |
| `VALIDATION_ERROR` | 入力値のバリデーションエラー |
| `CONFLICT` | リソースの競合 |
| `INTERNAL_ERROR` | サーバー内部エラー |

## データモデル

### ユーザー

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string; // ISO 8601形式
  updatedAt: string; // ISO 8601形式
}
```

### 盆栽

```typescript
interface Bonsai {
  id: string;
  userId: string;
  name: string;           // 盆栽の名前
  species: string;        // 樹種
  registrationDate: string; // 登録日（ISO 8601形式）
  history: string;        // 来歴
  imageUrls: string[];    // 画像URL配列
  createdAt: string;      // ISO 8601形式
  updatedAt: string;      // ISO 8601形式
}
```

### 作業記録

```typescript
interface WorkRecord {
  id: string;
  bonsaiId: string;
  workTypes: ('pruning' | 'repotting' | 'watering' | 'fertilizing' |'wire'|'wireremove'|'leafpull'|'leafcut'|'leafpeel'|'disinfection'|'carving'|'replant'|'protection'| 'other')[]; // 作業タイプ（剪定、植替え、水やり、肥料、針金かけ、針金はずし、芽摘み、芽切り、葉透かし、消毒、彫刻、改作、その他）の配列
  date: string;           // 作業日（ISO 8601形式）
  description: string;    // 作業内容の詳細
  imageUrls: string[];    // 作業前後の画像URL配列
  createdAt: string;      // ISO 8601形式
  updatedAt: string;      // ISO 8601形式
  
  // カレンダー表示用の拡張プロパティ（オプション）
  startTime?: string;     // 開始時間（HH:mm形式）
  endTime?: string;       // 終了時間（HH:mm形式）
  isAllDay?: boolean;     // 終日イベントフラグ
  priority?: 'high' | 'medium' | 'low'; // 優先度（高、中、低）
  colorCode?: string;     // 表示色（CSS色コード）
}
```

### 作業予定

```typescript
// 繰り返しパターン
interface RecurrencePattern {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'; // 繰り返しタイプ
  interval: number;       // 間隔（例：2週間ごとなら2）
  endDate?: string;       // 終了日（ISO 8601形式）
  occurrences?: number;   // 繰り返し回数
  weekDays?: number[];    // 週の曜日（0=日曜, 1=月曜, ..., 6=土曜）
  monthDay?: number;      // 月の日（1-31）
}

interface WorkSchedule {
  id: string;
  bonsaiId: string;
  workTypes: ('pruning' | 'repotting' | 'watering' | 'fertilizing' | 'other')[]; // 作業タイプの配列
  scheduledDate: string;  // 予定日（ISO 8601形式）
  description: string;    // 予定内容
  completed: boolean;     // 完了フラグ
  createdAt: string;      // ISO 8601形式
  updatedAt: string;      // ISO 8601形式
  
  // カレンダー表示用の拡張プロパティ（オプション）
  startTime?: string;     // 開始時間（HH:mm形式）
  endTime?: string;       // 終了時間（HH:mm形式）
  isAllDay?: boolean;     // 終日イベントフラグ
  priority?: 'high' | 'medium' | 'low'; // 優先度（高、中、低）
  colorCode?: string;     // 表示色（CSS色コード）
  recurrencePattern?: RecurrencePattern; // 繰り返しパターン
  reminderDays?: number;  // リマインダー日数（予定日の何日前に通知するか）
}
```

### 月次レポート

```typescript
/**
 * 月次レポートモデル
 */
interface MonthlyReport {
  id: string;
  userId: string;         // ユーザーID
  year: number;           // 年
  month: number;          // 月（1-12）
  generatedAt: string;    // 生成日時（ISO 8601形式）
  
  // 集計データ
  totalBonsaiCount: number;  // 盆栽総数
  totalWorkCount: number;    // 作業総数
  workTypeCounts: Record<string, number>;  // 作業タイプ別カウント
  
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
interface BonsaiMonthlySummary {
  bonsaiId: string;
  bonsaiName: string;
  species: string;
  imageUrl?: string;      // 代表画像URL
  workRecordIds: string[]; // 関連する作業記録ID
  workTypes: string[];    // 実施した作業タイプ
  workSummary: string;    // 作業内容のサマリーテキスト
  hasImportantWork: boolean; // 重要な作業があったかどうか
}

/**
 * 作業ハイライト
 */
interface WorkHighlight {
  recordId: string;
  bonsaiId: string;
  bonsaiName: string;
  workTypes: string[];
  date: string;
  description: string;
  imageUrl?: string;
  importance: 'high' | 'medium' | 'low';
  highlightReason: string; // ハイライトされる理由
}

/**
 * 推奨作業
 */
interface RecommendedWork {
  bonsaiId: string;
  bonsaiName: string;
  species: string;        // 樹種
  workTypes: string[];
  reason: string;         // 推奨理由
  priority: 'high' | 'medium' | 'low';
  seasonalTips?: string;  // 季節に応じたアドバイス
}

/**
 * 月次レポート一覧アイテム
 */
interface MonthlyReportListItem {
  id: string;
  year: number;
  month: number;
  generatedAt: string;
  totalBonsaiCount: number;
  totalWorkCount: number;
  highlightCount: number;  // 重要作業の数
  isNew?: boolean;         // 新着フラグ（最新のレポートの場合true）
}
```
