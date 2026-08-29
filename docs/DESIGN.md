# kinta-kintailogicapp 設計書

小規模店舗（2店舗: 湖西店 / 西駅店）向けの勤怠・売上管理アプリ。日々の勤怠入力、履歴の確認・修正、月次の人時売上高分析を行う。

最終更新: 2026-08-30（本ドキュメントは実装からの棚卸しであり、以後の変更で乖離しないよう随時更新すること）

## 1. 技術スタック

| 項目 | 内容 |
|---|---|
| フレームワーク | Next.js 16.2.1（App Router） |
| UI | React 19 / Tailwind CSS 4 |
| データベース | Firebase Firestore（クライアントSDK直叩き、APIルートなし） |
| グラフ | recharts |
| アイコン | lucide-react |
| 音声入力 | Web Speech API（`hooks/useSpeechRecognition.ts`） |

Firebaseは無料枠（Sparkプラン）を前提とした設計。認証機能はなし（`shopId`はURLのパスパラメータのみで区別しており、アクセス制御は行っていない）。

## 2. ディレクトリ構成

```
app/[shopId]/
  page.tsx                     … 勤怠入力画面（トップ）
  _components/
    HeaderSection.tsx           店舗名表示・日付ピッカー
    SalesDashboard.tsx          売上入力・人時売上高の表示
    StaffSection.tsx            スタッフカードのリスト
    ActionButtons.tsx           スタッフ追加・保存・履歴へのリンク
  history/
    page.tsx                    … 勤務履歴画面（月別一覧・編集・削除）
    _components/HistoryItem.tsx
  analysis/
    page.tsx                    … 人時売上高分析画面
    _components/
      MonthSelector.tsx          月選択・月間平均表示
      ReportGenerator.tsx        日報テキスト自動生成
      SalesChart.tsx             人時売上高の推移グラフ

components/
  atoms/        … CapsLabel, CardContainer, IconButton, TimeInput(未使用・後述)
  molecules/    … StaffCard（勤怠入力の1行）
  organisms/    … ConfirmModal, BottomNav

hooks/
  useAttendanceData.ts   … 勤怠入力画面のデータ取得・集計
  useAttendanceModal.ts  … 勤怠保存時の確認モーダル・保存処理
  useAnalysisData.ts     … 分析画面のデータ取得・集計
  useHistoryData.ts      … 履歴画面のデータ取得（月一覧＋月別データ）
  useHistoryModal.ts     … 履歴の日付変更・削除の確認モーダル
  useSpeechRecognition.ts… 音声入力（スタッフ名等の入力補助）

lib/
  firebase.ts        … Firebase初期化、reconnectFirestore()
  firestoreRetry.ts  … fetchWithRetry()（タイムアウト＋1回リトライ）
  utils.ts           … 勤務時間計算、人時売上高計算、営業日計算の共通関数
```

## 3. データモデル（Firestore）

```
kintai/{shopId}/dailyData/{YYYY-MM-DD}
  id: string            … ドキュメントIDと同じ日付文字列
  date: string
  shop: string           … shopIdの重複保持（フィルタ・デバッグ用）
  sales: number          … その日の売上高
  totalHours: number     … その日の全スタッフ合計勤務時間
  staffList: Array<{
    id: string
    name: string
    startTime: string    … "HH:MM"
    endTime: string       … "HH:MM"（開始より前の値は日付またぎとして解釈）
    breakMinutes: number
    role: 'alba' | 'part'
  }>
  updatedAt: number      … Date.now()
```

- `shopId`専用のコレクションは存在せず、店舗名の対応（`kosai`→湖西店、それ以外→西駅店）はコード側にハードコードされている（[app/[shopId]/history/page.tsx:17](../app/[shopId]/history/page.tsx#L17)など複数箇所に同じ三項演算子が重複している）。
- 1日1ドキュメントの構成。スタッフごとの履歴やユーザーアカウントの概念はない。
- 認証・アクセス制御なし。URLの`shopId`を知っていれば誰でも閲覧・編集可能。

## 4. 業務ルール・共通計算ロジック（`lib/utils.ts`）

### 4.1 営業日（3時締め）ルール

`getBusinessDateString(baseDate?)`

- 現在時刻が **0:00〜2:59** の間は、暦上の日付ではなく **前日** を「営業日としての今日」とみなす。
- 3:00以降は暦通りの当日を返す。
- 勤怠入力画面（[app/[shopId]/page.tsx](../app/[shopId]/page.tsx)）の初期表示・自動リロード判定、分析画面（[hooks/useAnalysisData.ts](../hooks/useAnalysisData.ts)）の「本日」判定の両方でこの関数に統一されている（2026-08-30時点）。
- 勤怠入力画面には、3時を過ぎて営業日が変わった瞬間に自動でページを新しい日付にリロードする仕組みがある（1分間隔でチェック）。ただし、明示的に`?date=`で過去日付を開いている場合はこの自動リロードは発火しない。

### 4.2 勤務時間の計算

`calculateStaffHours(staff)`

- `終了 - 開始 - 休憩(分)` を時間単位で算出。
- 終了時刻が開始時刻より前（例: 22:00〜2:00）の場合は日付またぎとみなし、終了側に24時間を加算して計算する。
- 現状、勤怠データそのものに「退勤時刻の自動確定」の仕組みはない。日付をまたぐ勤務は、開始・終了の時刻をスタッフ自身が手入力する前提。

### 4.3 人時売上高（生産性指標）の計算

`calculateSalesEfficiency(sales, albaHours, partHours, baseHours = 8)`

```
人時売上高 = 売上 ÷ (アルバイト時間 + パート時間 + 8時間)
```

- 「8時間」は正社員・店長など時間を個別記録していない人員分の固定枠として扱う仮定値。
- アルバイト・パート双方の時間が分母に含まれる（過去に一時的にパート時間が漏れていたバグがあったが、コミット`52f136d`で修正済み）。

### 4.4 人時売上高の評価しきい値

[app/[shopId]/analysis/_components/MonthSelector.tsx:20-24](../app/[shopId]/analysis/_components/MonthSelector.tsx#L20-L24)の`SALES_EFFICIENCY_THRESHOLDS`が正:

| 範囲 | 評価 |
|---|---|
| 5,500円未満 | 低い（人員過多・生産性が低い可能性あり） |
| 5,500〜6,500円 | ベース |
| 6,500〜8,000円 | 良好 |
| 8,000円超 | 厳しい（問題発生の可能性あり） |

この数値は[SalesChart.tsx](../app/[shopId]/analysis/_components/SalesChart.tsx)の基準線・説明文と統一済み（2026-08-27に修正）。**この4つの数値を変更する場合は、`MonthSelector.tsx`と`SalesChart.tsx`の2箇所を必ず両方直すこと。** 過去に一度、`SalesChart.tsx`の表示だけが古い数値のままになっていたことがある。また、かつて`hooks/useAnalysisData.ts`に別の古いしきい値（4,800／6,200円）を使った未使用の`status`フィールドが残っていたが、参照箇所がないことを確認の上で削除済み（コミット`b3ed546`）。

## 5. 通信まわりの設計

### 5.1 タイムアウト＋リトライ（`lib/firestoreRetry.ts`）

- Firestoreの読み取りは`fetchWithRetry()`でラップされている。
- 1回目のタイムアウト: 8秒。失敗したら1秒待って、同じ処理をもう一度だけ実行（合計最大約17秒）。
- 無限ローディングで固まることを防ぐための設計。

### 5.2 再接続（`lib/firebase.ts`の`reconnectFirestore()`）

- Wi-Fi⇔モバイル回線の切り替えやスリープ復帰でFirestoreの内部通信チャンネルが壊れたまま固まるケースがあり、その場合`fetchWithRetry`の自動リトライ（同じチャンネルの上でのリトライ）だけでは直らないことがある。
- 各画面の「再読み込み」ボタン（`refetch`）は、クエリをやり直す前に`disableNetwork(db)`→`enableNetwork(db)`で接続を明示的に切って繋ぎ直す。ページ全体をリロードするのに近い効果を、リロードなしで再現する狙い（2026-08-29対応）。
- 初回読み込み時の自動リトライ（`fetchWithRetry`単体）には、この接続の繋ぎ直しは組み込まれていない（意図的にボタン押下時のみの挙動としている）。

### 5.3 オフラインキャッシュ

- `persistentLocalCache` + `persistentSingleTabManager`でブラウザにキャッシュを保持し、再訪時・電波が弱い時の体感速度を改善している。
- リアルタイムリスナー（`onSnapshot`）は使用しておらず、すべて`getDoc`/`getDocs`による一回読み取り。

## 6. 各画面の挙動

### 6.1 勤怠入力画面（`/[shopId]`）

- URLの`?date=`があればその日付、なければ営業日基準の「今日」（4.1参照）を表示。
- スタッフの追加・削除・時刻入力（4桁数字「1730」→「17:30」に自動整形、全角数字も許容）。
- 保存時、同日のデータが既に存在する場合は上書き確認モーダルを表示（[hooks/useAttendanceModal.ts](../hooks/useAttendanceModal.ts)）。
- 音声入力ボタンでスタッフ名などを入力可能。

### 6.2 履歴画面（`/[shopId]/history`）

- Firestoreに実在する月だけをドキュメントIDから抽出してプルダウンに表示。
- 選択中の月のデータは`where("__name__", ">=", ...)`によるドキュメントID範囲指定で絞り込み取得（分析画面と異なり、ここは全件取得ではない）。
- 各日のデータについて、日付の変更（ドキュメントの移動＝新規作成＋旧削除）・削除が可能。

### 6.3 分析画面（`/[shopId]/analysis`）

- 店舗の全期間の日次データを取得し、月ごとにフィルタして折れ線グラフ・月間平均を表示。
- 「本日」の日報生成カード（`ReportGenerator`）は、営業日基準の「今日」に一致するデータが存在する場合のみ表示し、存在しない場合は「本日のデータはまだ入力されていません」と表示する（2026-08-28修正、以前は保存済みデータの最新日を無条件に「本日」としていた）。

## 7. 既知の設計課題（対応不要〜要検討の順）

1. **分析画面のクエリが全件取得**（[hooks/useAnalysisData.ts:27-28](../hooks/useAnalysisData.ts#L27-L28)）。履歴画面の月一覧取得（[hooks/useHistoryData.ts:27-28](../hooks/useHistoryData.ts#L27-L28)）も同様。小規模店舗の現状データ量では無料枠・速度ともに問題ないが、データが数年分蓄積すると読み込みが遅くなる。対応する場合は履歴画面の月別データ取得と同じ「直近12ヶ月に絞る」方式を導入する（スキーマ変更・既存データへの影響なしで対応可能）。
2. **`components/atoms/TimeInput.tsx`が未使用**。3桁時刻（例:「730」→7:30）にも対応した正しい実装だが、どこからもimportされておらず、実際に使われている[components/molecules/StaffCard.tsx](../components/molecules/StaffCard.tsx)の`formatTimeInput`は4桁入力にしか対応していない（3桁だとエラーになる）。未対応（2026-08-30時点）。
3. **同時編集時の上書き競合**（[hooks/useAttendanceModal.ts](../hooks/useAttendanceModal.ts)）。上書き確認から実際の保存までの間に別端末が保存すると、警告なく上書きされる可能性がある。1人運用が前提の現状では影響小。
4. **スタッフ追加時のID採番が`Date.now().toString()`**（[app/[shopId]/_components/ActionButtons.tsx](../app/[shopId]/_components/ActionButtons.tsx)）。同一ミリ秒内の連打でID重複の可能性がある（レアケース）。
5. **店舗名の対応表（`kosai`→湖西店 等）がコード内に複数箇所ハードコード**されている。店舗が増える場合は一箇所の定数にまとめた方が安全。

## 8. 変更履歴（このドキュメント作成までの主な修正）

| 日付 | 内容 |
|---|---|
| 2026-08-27 | 人時売上高グラフの適正ゾーン表示（説明文・基準線）の数値不整合を修正、5,500/6,500/8,000円に統一 |
| 2026-08-27 | 勤怠入力画面の「今日」判定が`toISOString()`（UTC基準）になっており朝3〜8時台に日付がズレるバグを修正、ローカル時間基準に統一 |
| 2026-08-27 | 分析データ内の未使用・旧しきい値（4,800/6,200円）の`status`フィールドを削除 |
| 2026-08-28 | 分析画面の「本日」判定を、保存済みデータの最新日ではなく実際の営業日と一致するデータのみに変更。未入力時は「本日のデータはまだ入力されていません」と表示 |
| 2026-08-29 | 「再読み込み」ボタン押下時にFirestore接続を明示的に繋ぎ直す（`reconnectFirestore`）よう変更 |
| 2026-08-30 | 勤怠入力画面の初期表示・自動リロードの日付計算を`getBusinessDateString`に統一（初回表示にも3時ルールを適用） |
