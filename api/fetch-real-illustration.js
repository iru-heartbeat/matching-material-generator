// イラスト×イラストモードの「リアル画像」側専用（要件書 §4.2）。
// このモードのこの側だけ、Pixabay → Iconify → Pollinationsの順で取得する。
// それ以外の全てのイラスト取得はPollinations AIを最優先で使う（§4.1）。
// 検索・生成はいずれも英単語（en）で行う。日本語のままだとヒット率・精度が下がるため。
const ICONIFY_PREFIXES = 'twemoji,noto'

// Pixabayはタグの緩いマッチで検索するため、hits[0]をそのまま採用すると
// 「socks」で「sock flower（花の俗称）」がヒットするような無関係な結果を返すことがある。
// タグに検索語が単語として正確に含まれるものだけを採用し、なければ不採用とする。
function tagsContainWord(tags, word) {
  const pattern = new RegExp(`(^|[,\\s])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[,\\s])`, 'i')
  return pattern.test(tags)
}

async function tryPixabay(subject) {
  const apiKey = process.env.PIXABAY_API_KEY
  if (!apiKey) return null

  const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(subject)}&image_type=photo&safesearch=true&per_page=15`
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const data = await response.json()
    const hit = data.hits?.find((h) => tagsContainWord(h.tags, subject))
    return hit ? hit.webformatURL : null
  } catch {
    return null
  }
}

async function tryIconify(subject) {
  const url = `https://api.iconify.design/search?query=${encodeURIComponent(subject)}&limit=1&prefixes=${ICONIFY_PREFIXES}`
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const data = await response.json()
    const iconId = data.icons?.[0]
    if (!iconId) return null
    return `https://api.iconify.design/${iconId.replace(':', '/')}.svg`
  } catch {
    return null
  }
}

function pollinationsFallback(subject) {
  const prompt = `a single, clearly recognizable ${subject} with its distinct characteristic features, realistic photo style, for children`
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&nologo=true`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const { subject } = req.body || {}
  if (!subject) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'subject は必須です' }))
    return
  }

  const pixabayUrl = await tryPixabay(subject)
  if (pixabayUrl) {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ imageUrl: pixabayUrl, source: 'pixabay' }))
    return
  }

  const iconifyUrl = await tryIconify(subject)
  if (iconifyUrl) {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ imageUrl: iconifyUrl, source: 'iconify' }))
    return
  }

  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ imageUrl: pollinationsFallback(subject), source: 'pollinations' }))
}
