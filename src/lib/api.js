// Gemini APIのエラー本文（detail）から原因を推測し、ユーザーに分かる形にする。
// 特にRESOURCE_EXHAUSTEDは無料枠/利用上限切れの典型的なサインなので明示する。
function describeGeminiError(data) {
  const base = data.error || '生成に失敗しました'
  if (!data.detail) return base

  try {
    const parsed = JSON.parse(data.detail)
    const status = parsed?.error?.status
    const message = parsed?.error?.message

    if (status === 'RESOURCE_EXHAUSTED') {
      return `${base}（Gemini APIの利用上限（無料枠）に達した可能性があります。しばらく待つか、翌日以降に再試行してください）`
    }
    return message ? `${base}: ${message}` : base
  } catch {
    return `${base}: ${data.detail}`
  }
}

export async function generateWords({ theme, age, pairCount, wordLengthCondition }) {
  const res = await fetch('/api/generate-words', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme, age, pairCount, wordLengthCondition }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(describeGeminiError(data))
  }
  return data.words
}

export async function generateKanjiPairs({ theme, age, pairCount, wordLengthCondition }) {
  const res = await fetch('/api/generate-kanji-pairs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme, age, pairCount, wordLengthCondition }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(describeGeminiError(data))
  }
  return data.pairs
}

export async function fetchRealIllustration(subject) {
  const res = await fetch('/api/fetch-real-illustration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'イラストの取得に失敗しました')
  }
  return data.imageUrl
}

export async function fetchRealIllustrationAlternatives(subject, count = 4) {
  const res = await fetch('/api/fetch-real-illustration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, count }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'イラストの取得に失敗しました')
  }
  return data.images
}
