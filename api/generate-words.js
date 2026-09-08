const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const { theme, age, pairCount, wordLengthCondition, script = 'hiragana' } = req.body || {}
  if (!theme || !pairCount) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'theme と pairCount は必須です' }))
    return
  }

  // カタカナモードは「和語をカタカナ表記に変換する」のではなく、外来語・オノマトペなど
  // テーマの中でも自然にカタカナで書かれる単語だけを選ばせる（ひらがなモードとは選ぶ単語の集合が異なる）。
  // 抽象的な指示だけだと「テーマに合う自然なカタカナ語が浮かばない→テーマを無視して
  // 有名なカタカナ語を出す」という失敗が起きやすいため、テーマ自体の具体例を1つ示す。
  const scriptText =
    script === 'katakana'
      ? `テーマ「${theme}」に該当するものの中から、外来語（カタカナ語）やオノマトペなど、日本語で自然にカタカナで表記される名前を持つものだけを選んでください。
和語や漢語をカタカナに変換するのは禁止です。表記はすべてカタカナにしてください。
重要: あくまで「テーマ「${theme}」の具体例であること」が最優先です。テーマ「${theme}」とは無関係な、別ジャンルのカタカナ語を選ぶのは禁止です。`
      : '具体的なものの名前（名詞）で挙げてください。表記はひらがな、またはひらがな＋やさしい漢字にしてください。'

  // 1文字条件はひらがなモード専用の想定（カタカナの1文字語は実質存在しないため）
  const conditionText =
    wordLengthCondition === 'single-character' && script !== 'katakana'
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
テーマ「${theme}」に関連する、${age ? `${age}の児童にとってやさしい` : 'やさしい'}「ことば」を${pairCount}個選んでください。

最優先の条件（これは絶対に守ってください）: 必ずテーマ「${theme}」の具体例として明確に関連する、具体的なものの名前にしてください。テーマと無関係な単語は理由を問わず選ばないでください。
${scriptText}${conditionText}

そのうえで、テーマ「${theme}」に対してまず思い浮かぶ、最も定番でありがちな代表例ばかりに偏らないでください。
同じテーマでも実行のたびに毎回違う顔ぶれになるように、定番も少し混ぜつつ、それ以外の候補も積極的に含めてください。
ただし、テーマに合う単語が少なく多様性とテーマ適合が両立しない場合は、必ずテーマ適合を優先してください（多様性のためにテーマから外れるのは禁止です）。
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
          // カタカナモードは「テーマ適合」と「カタカナ限定」という複合制約があり、
          // 温度が高いとテーマを無視した無関係なカタカナ語に流れやすいことを実測で確認したため、
          // ひらがなモードより低めに設定する。
          generationConfig: { temperature: script === 'katakana' ? 0.5 : 1.3 },
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
