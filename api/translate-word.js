const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash'

// 先生が項目（ことば/漢字カードの表示）を編集したときに、イラスト再生成用の
// 英単語（en）と絵文字候補（emoji）だけを取得する軽量エンドポイント。
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const { word } = req.body || {}
  if (!word) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'word は必須です' }))
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'GEMINI_API_KEY が設定されていません（.env.local を確認してください）' }))
    return
  }

  const prompt = `次の日本語の単語「${word}」が指すものを画像生成AIで正確に描かせるための、
シンプルで具体的な英単語（en）を1つ答えてください。
あわせて、🍎や🐶のように、その単語をそのまま表す絵文字が標準で存在する場合はemojiフィールドに1文字だけ入れてください。
なければ空文字（""）にしてください。無理にこじつけないでください。

出力は次のJSON形式のみとし、説明文やコードブロック記法は含めないでください。
{"en": "English keyword", "emoji": "🍎"}`

  let response
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    )
  } catch (err) {
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Gemini APIへの接続に失敗しました', detail: String(err) }))
    return
  }

  if (!response.ok) {
    const detail = await response.text()
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Gemini APIがエラーを返しました', detail }))
    return
  }

  const data = await response.json()
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
  const cleaned = rawText.replace(/```json|```/g, '').trim()

  let result
  try {
    result = JSON.parse(cleaned)
  } catch {
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Gemini応答の解析に失敗しました', raw: rawText }))
    return
  }

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ en: result.en, emoji: result.emoji || '' }))
}
