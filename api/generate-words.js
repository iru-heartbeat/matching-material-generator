const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const { theme, age, pairCount, wordLengthCondition } = req.body || {}
  if (!theme || !pairCount) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'theme と pairCount は必須です' }))
    return
  }

  const conditionText =
    wordLengthCondition === 'single-character'
      ? '\n条件: ことばはすべて、ひらがな1文字で表される単語にしてください。例：は（歯）、ひ（火）、め（目）、て（手）など。1文字だけで意味が通る具体的な名詞のみを選んでください。'
      : ''

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'GEMINI_API_KEY が設定されていません（.env.local を確認してください）' }))
    return
  }

  const prompt = `あなたは日本の特別支援学級向け教材を作る先生の補助AIです。
テーマ「${theme}」に関連する、${age ? `${age}の児童にとってやさしい` : 'やさしい'}「ことば」を${pairCount}個、
具体的なものの名前（名詞）で挙げてください。表記はひらがな、またはひらがな＋やさしい漢字にしてください。${conditionText}
テーマに対してまず思い浮かぶ定番の代表例（例:「動物」なら いぬ・ねこ・うさぎ、「果物」なら りんご・ばなな・みかん など）ばかりに偏らないでください。
同じテーマでも実行のたびに毎回違う顔ぶれになるように、定番も少し混ぜつつ、それ以外の候補も積極的に含めてください。
（今回の生成ID: ${crypto.randomUUID()}）
あわせて、各ことばが指すものを画像生成AIで正確に描かせるための、シンプルで具体的な英単語（en）も付けてください。
さらに、🍎や🐶のように、その単語をそのまま表す絵文字が標準で存在する場合はemojiフィールドに1文字だけ入れてください。
なければ空文字（""）にしてください。無理にこじつけないでください。

出力は次のJSON配列の形式のみとし、説明文やコードブロック記法は含めないでください。
[{"word": "ことば1", "en": "English keyword1", "emoji": "🍎"}, ...]`

  let response
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 1.3 },
        }),
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
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'
  const cleaned = rawText.replace(/```json|```/g, '').trim()

  let words
  try {
    words = JSON.parse(cleaned)
  } catch {
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Gemini応答の解析に失敗しました', raw: rawText }))
    return
  }

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ words }))
}
