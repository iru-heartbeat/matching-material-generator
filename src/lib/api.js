export async function generateWords({ theme, age, pairCount, wordLengthCondition }) {
  const res = await fetch('/api/generate-words', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme, age, pairCount, wordLengthCondition }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'ことばの生成に失敗しました')
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
    throw new Error(data.error || '漢字の選定に失敗しました')
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
