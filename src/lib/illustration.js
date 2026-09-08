const STYLE_HINT = 'シンプルな線画, flat illustration, simple line art, for children'

// 「違う写真を選ぶ」の候補が見た目でほぼ区別できない（単色の線画のため）という声を受けて、
// 候補ごとに色を変えて生成する。
const ALT_COLORS = ['blue', 'green', 'red', 'orange', 'purple', 'yellow', 'pink', 'teal']

// ことば×イラストモードは常にPollinations AIを最優先で使う（要件書 §4.1）。
// 日本語の単語だけだと画像生成モデルが対象を正しく認識できず、絵柄が崩れやすいため、
// Geminiが付けた英単語（en）を主語にしてプロンプトを組み立てる。
export function buildIllustrationUrl(subjectEn, styleHint = STYLE_HINT, color) {
  const colorPart = color ? `${color} colored, ` : ''
  const prompt = `a single, clearly recognizable ${colorPart}${subjectEn} with its distinct characteristic features, ${styleHint}`
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&nologo=true`
}

function emojiToCodepoints(emoji) {
  return Array.from(emoji)
    .map((char) => char.codePointAt(0).toString(16))
    .join('-')
}

// 🍎や🍊のように定番の絵文字があるものは、そちらの方が絵柄が安定して分かりやすいため優先する
export function getEmojiImageUrl(emoji) {
  if (!emoji) return null
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${emojiToCodepoints(emoji)}.png`
}

// Pollinationsが混雑すると、onload/onerrorのどちらも発火しないまま応答が返ってこないことがある。
// タイムアウトを設けないと「違う写真を選ぶ」の1件がハングしたまま次の候補に進めず、
// 永遠に読み込み中のまま止まってしまうため、一定時間で失敗扱いにして次へ進める。
// flux モデルは正常時でも1枚あたり10〜20秒程度かかることがあるため、
// 短すぎるタイムアウトは正常な生成まで失敗扱いにしてしまう（実測で15秒は短すぎた）。
export function preloadImage(url, timeoutMs = 45000) {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const timer = setTimeout(() => {
      img.onload = null
      img.onerror = null
      reject(new Error('load timeout'))
    }, timeoutMs)
    img.onload = () => {
      clearTimeout(timer)
      resolve()
    }
    img.onerror = () => {
      clearTimeout(timer)
      reject(new Error('load failed'))
    }
    img.src = url
  })
}

// Pollinations AIは同時リクエストをレート制限するため、1枚ずつ順番に取得する。
// fetch()ではなく<img>と同じ読み込み経路（Image()プリロード）を使うことで、
// fetchのCORS/リファラー制約を回避しつつブラウザキャッシュに載せてから表示する。
export async function fetchIllustrationImage({ en, emoji } = {}, styleHint) {
  if (emoji) {
    const emojiUrl = getEmojiImageUrl(emoji)
    try {
      await preloadImage(emojiUrl)
      return emojiUrl
    } catch {
      // 絵文字画像が取得できなければPollinations AIにフォールバックする
    }
  }

  const baseUrl = buildIllustrationUrl(en, styleHint)
  for (let attempt = 0; attempt < 4; attempt++) {
    const url = attempt === 0 ? baseUrl : `${baseUrl}&retry=${attempt}`
    try {
      await preloadImage(url)
      return url
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }
  }
  throw new Error('イラストの取得に失敗しました（混み合っています。しばらくしてから再度お試しください）')
}

// 「違う写真を選ぶ」用に候補を複数取得する。Pollinations AIは同時リクエストに弱いため、
// ここでも1枚ずつ順番に取得する（絵文字があれば1つ目の候補として含める）。
// 全件そろうまで待つと体感が遅いため、1件取得できるごとにonEachで呼び出し元に通知する。
export async function fetchIllustrationAlternatives({ en, emoji } = {}, count = 4, onEach) {
  const results = []

  if (emoji) {
    const emojiUrl = getEmojiImageUrl(emoji)
    try {
      await preloadImage(emojiUrl)
      results.push(emojiUrl)
      onEach?.(emojiUrl)
    } catch {
      // 取得できなければ候補に含めない
    }
  }

  let variant = 0
  let consecutiveFailures = 0
  while (results.length < count && variant < (count + ALT_COLORS.length) * 2) {
    const color = ALT_COLORS[variant % ALT_COLORS.length]
    const url = `${buildIllustrationUrl(en, STYLE_HINT, color)}&seed=${Date.now()}-${variant}`
    try {
      await preloadImage(url)
      results.push(url)
      onEach?.(url)
      consecutiveFailures = 0
    } catch {
      // Pollinationsの無料枠は同一IPからの同時リクエストを1件しか受け付けず、
      // 埋まっていると即座に429（Queue full）を返す。実測では1枚の生成に
      // 10〜30秒以上かかることもあり、5秒待つ程度では埋まったままのことが多いため、
      // 前の生成が終わるのを待てるだけの間隔を空けてから次を試す。
      consecutiveFailures++
      await new Promise((resolve) => setTimeout(resolve, 10000))
      if (consecutiveFailures >= 12) break
    }
    variant++
  }

  return results
}
