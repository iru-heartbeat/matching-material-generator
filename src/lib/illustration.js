const STYLE_HINT = 'シンプルな線画, flat illustration, simple line art, for children'

// ことば×イラストモードは常にPollinations AIを最優先で使う（要件書 §4.1）。
// 日本語の単語だけだと画像生成モデルが対象を正しく認識できず、絵柄が崩れやすいため、
// Geminiが付けた英単語（en）を主語にしてプロンプトを組み立てる。
export function buildIllustrationUrl(subjectEn, styleHint = STYLE_HINT) {
  const prompt = `a single, clearly recognizable ${subjectEn} with its distinct characteristic features, ${styleHint}`
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

function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('load failed'))
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
