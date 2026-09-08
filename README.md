# マッチング教材自動生成ツール

特別支援学級（特別支援学級・特別支援学校）向けの「マッチング教材（マッチング教材）」を、テーマを入力するだけで自動生成するツールです。教員がテーマ（例：「動物」「果物」）を入力すると、AIがことば・イラストのペアを生成し、そのまま印刷できるレイアウトに整えて出力します。

## できること

### 4つのマッチングモード

テーマ入力の前に、モード選択画面で以下の4種類から選べます。

| モード | 内容 |
| --- | --- |
| ことば（ひらがな）× イラスト | ひらがな中心のことばとイラストをマッチさせる、基本のモード |
| ことば（カタカナ）× イラスト | 外来語・オノマトペなど、自然にカタカナで書かれることばとイラストをマッチさせる |
| イラスト × 漢字 | イラストの意味に合う漢字をAIが自由に選定してマッチさせる（学年別漢字配当表には縛られない） |
| イラスト × イラスト | 同じテーマを「フォトリアル」と「シンプルな線画」という作風の異なる2種類のイラストで表現し、マッチさせる |


### そのほかの機能

- **年齢・ペア数・ヒント表示のオン/オフ**をモード選択画面でまとめて設定
- **ことばの条件**（例：ひらがな1文字のことばのみ）を指定可能（ひらがなモードのみ）
- 生成された**単語・イラストの並びは毎回シャッフル**され、同じテーマで作り直しても定番の顔ぶれ・配置に固定されない
- 生成後の各カードで「**違う写真を選ぶ**」から候補イラストへの差し替え、「**自分の画像を使う**」から手持ち画像へのアップロード差し替えが可能
- 生成された項目（ことば・漢字）はその場で**編集**でき、編集すると対応するイラストも自動で作り直される
- プレビュー画面からそのまま**印刷**（台紙ページ＋切り取り用カードページの2ページ構成）

## 使い方

1. トップ画面でマッチングモード・対象年齢・ペア数・ヒント表示などを設定し、「次へ」に進む

   <img width="524" height="414" alt="image" src="https://github.com/user-attachments/assets/52a827ef-d3ed-44c3-85f3-a98791ae4ba5" />

2. テーマ（例：「乗り物」「文房具」など）を入力して生成を開始する
3. しばらく待つと、ことば／漢字とイラストの生成が完了し、プレビュー画面が表示される

   <img width="682" height="416" alt="image" src="https://github.com/user-attachments/assets/801a74c6-4c04-479d-b57a-3cd049c1caee" />

4. 気になるイラストがあれば「違う写真を選ぶ」で候補を選び直すか、「自分の画像を使う」で手持ちの画像に差し替える
5. 内容に問題なければ「印刷する」から印刷する（台紙ページと、切り取って使うカードページの2ページが出力される）

   <img width="745" height="427" alt="image" src="https://github.com/user-attachments/assets/4770173b-ce4a-406d-af0b-62677e2f74c3" />


## 使用している技術

- **フロントエンド**: [React](https://react.dev/) 19 + [Vite](https://vite.dev/)、スタイリングは [Tailwind CSS](https://tailwindcss.com/) v4
- **サーバー**: [Vercel](https://vercel.com/) の Serverless Functions（`api/` 配下）
- **ことば・漢字の生成**: [Google Gemini API](https://ai.google.dev/)（無料枠のモデルを使用）
- **イラストの取得・生成**（優先順位あり）
  - 通常のイラスト: [Pollinations AI](https://pollinations.ai/)（APIキー不要の画像生成）
  - イラスト×イラストモードの「リアル画像」側のみ: [Pixabay API](https://pixabay.com/api/docs/) → [Iconify API](https://iconify.design/) → Pollinations AI の順にフォールバック
- **永続化**: サーバー側のデータ保存は行わない（設定の保持が必要な場合のみブラウザの `localStorage` を使用）
- **Lint**: [oxlint](https://oxc.rs/docs/guide/usage/linter.html)

詳しい要件・仕様は [docs/requirements-phase2.md](docs/requirements-phase2.md) を参照してください。

## 開発環境のセットアップ

```bash
npm install
npm run dev
```

`http://localhost:5173` で起動します（`api/` 配下のサーバー関数もVite開発サーバー内でエミュレートされるため、`npm run dev` だけでフル機能を試せます）。

### 必要な環境変数

`.env.local` に以下を設定してください（`.env.local.example` を参照）。

| 変数名 | 用途 | 必須 |
| --- | --- | --- |
| `GEMINI_API_KEY` | ことば・漢字の生成（Google Gemini API） | 必須 |
| `PIXABAY_API_KEY` | イラスト×イラストモードのリアル画像検索（Pixabay API） | 任意（未設定の場合はIconify→Pollinationsにフォールバック） |
| `GEMINI_MODEL` | 使用するGeminiモデルを上書きしたい場合に指定 | 任意（未指定時は `gemini-flash-lite-latest`） |

## その他のコマンド

```bash
npm run build    # 本番ビルド
npm run preview  # ビルド結果のプレビュー
npm run lint     # oxlintによる静的解析
```
