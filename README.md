# みんなの有給シフト

スタッフ約5人の小規模職場向けに、有給申請と代替出勤の相談を同じシフト表で見える化するローカルプロトタイプです。

## できること

- スタッフ管理: 名前、入社日、有給残日数、管理者/スタッフ権限
- 月ごとの基本シフト表: 縦がスタッフ、横が日付、セルに勤務区分 `①②③` または休みを表示
- 有給申請: 全日/半日、メモ、人数チェックによる自動ステータス判定
- 代替出勤申請: 本人と既存出勤者は申請不可
- 管理者画面: 有給申請、代替出勤申請、要相談、有給残日数、取得履歴
- CSV取り込み: `date,staffName,workCode` 形式で基本シフトを登録
- LINE通知を後から追加しやすい通知プレースホルダー

## 起動手順

```bash
npm install
npm run db:init
npm run prisma:seed
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## パスワードロック

`.env` に以下を入れると、全画面に簡易パスワードロックがかかります。空欄または未設定ならローカル開発用として無効になります。

```env
BASIC_AUTH_USER="staff"
BASIC_AUTH_PASSWORD="必ず変更してください"
```

公開する時は、推測されにくいユーザー名と長いパスワードにしてください。

## 他の人に見えるようにする方法

このアプリは SQLite を使うため、まずは永続ディスク付きの小さなサーバーに置く方法が扱いやすいです。Vercel のようなサーバーレス環境は SQLite ファイルが永続化されないことがあるため、本番運用には向きません。

おすすめの流れ:

1. GitHub にこのフォルダをアップロードします。
2. Render、Railway、Fly.io、VPS など、永続ディスクを使える環境を選びます。
3. 環境変数を設定します。

```env
DATABASE_URL="file:./dev.db"
BASIC_AUTH_USER="職場用ユーザー名"
BASIC_AUTH_PASSWORD="職場用パスワード"
```

4. 初回だけ以下を実行します。

```bash
npm install
npm run db:setup
npm run build
npm run start
```

動作確認用にサンプルを入れる場合だけ `npm run prisma:seed` を実行します。実際に使い始める時は、CSV取り込みや手入力で基本シフトを登録してください。

### Renderで公開する場合

`render.yaml` と `Dockerfile` を入れてあります。GitHubにこのコードを置いて Render の Blueprint から作成すると、`/data/dev.db` にSQLiteを保存します。

Render側で必ず設定する環境変数:

```env
BASIC_AUTH_USER="職場用ユーザー名"
BASIC_AUTH_PASSWORD="職場用パスワード"
DATABASE_URL="file:/data/dev.db"
```

`BASIC_AUTH_PASSWORD` は職場外に共有しないでください。

同じWi-Fi内だけで一時共有したい場合は、以下で起動します。

```bash
npm run dev:network
```

その後、起動しているPCのIPアドレスを使って `http://PCのIPアドレス:3000` にアクセスします。この場合も `.env` のパスワードロックは有効にしてください。

## サンプルデータ

`npm run db:init` のあとに `npm run prisma:seed` を実行すると、スタッフ5人、2026年5月のダミーシフト、有給申請、代替出勤申請が作られます。

## CSV取り込み形式

画面下部の「基本シフトCSV取り込み」に貼り付けます。

```csv
date,staffName,workCode
2026-05-01,佐藤 花,①
2026-05-01,田中 誠,②
2026-05-01,鈴木 里奈,③
```

添付PDFのような月間シフト表は、最初はCSVか手入力で登録します。将来PDF/Excel対応を追加する場合は、取り込み処理を `src/lib/import.ts` に増やす想定です。

## 画面の使い方

1. トップ画面で月と操作するスタッフを選びます。
2. 自分の勤務日のセルから「有給申請」を押します。
3. 3人未満になりそうな日は「代替者募集中」になります。
4. 他スタッフは同じシフト表から「入れます」を押せます。
5. 管理者画面で有給と代替出勤を承認します。
6. 承認済みの代替出勤はシフト表に `代` として反映されます。

## データベース

SQLiteを使います。設定は `.env` の `DATABASE_URL="file:./dev.db"` です。

主なテーブル:

- `Staff`
- `Shift`
- `LeaveRequest`
- `SubstituteOffer`
- `PaidLeaveHistory`

## LINE通知を追加する場所

`src/lib/notifications.ts` の `notifyTeam` を LINE Messaging API に差し替えると、有給申請や代替申請のタイミングで通知を送れる構造になっています。
