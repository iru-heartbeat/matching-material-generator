import { useState } from 'react'
import { fetchIllustrationAlternatives, preloadImage } from '../lib/illustration'
import { fetchRealIllustrationAlternatives } from '../lib/api'

export default function IllustrationChooser({ meta, currentUrl, onSelect }) {
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'open'
  const [options, setOptions] = useState([])
  const [stillLoading, setStillLoading] = useState(false)
  const [error, setError] = useState('')

  if (!meta) return null

  async function handleOpen() {
    setOptions([])
    setError('')
    setStatus('loading')
    setStillLoading(true)
    try {
      if (meta.source === 'pixabay-chain') {
        // Pixabay/Pollinationsフォールバックの候補URLは、サーバー側では読み込み確認をしていない。
        // 確認なしでそのまま表示すると、リンク切れや混雑時のPollinations画像が
        // 破損アイコン（空欄）として表示されてしまうため、1件ずつプリロードできたものだけ表示する。
        setStatus('open')
        const alternatives = await fetchRealIllustrationAlternatives(meta.subject, 8)
        for (const url of alternatives) {
          if (url === currentUrl) continue
          try {
            await preloadImage(url)
            setOptions((prev) => [...prev, url])
          } catch {
            // 読み込めない候補は表示しない
          }
        }
      } else {
        // Pollinations生成は1枚ずつ時間がかかるため、届いた分から順に表示する
        setStatus('open')
        await fetchIllustrationAlternatives({ en: meta.subject, emoji: meta.emoji }, 8, (url) => {
          if (url === currentUrl) return
          setOptions((prev) => [...prev, url])
        })
      }
      setStatus('open')
    } catch (err) {
      setError(err.message)
      setStatus('idle')
    } finally {
      setStillLoading(false)
    }
  }

  function handleSelect(url) {
    onSelect(url)
    setStatus('idle')
  }

  return (
    <div className="print:hidden">
      {status !== 'open' && (
        <button
          type="button"
          onClick={handleOpen}
          disabled={status === 'loading'}
          className="mt-1 text-[11px] font-medium text-green-700 hover:text-green-800 disabled:opacity-50"
        >
          {status === 'loading' ? '探しています…' : '違う写真を選ぶ'}
        </button>
      )}

      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}

      {status === 'open' && (
        <div className="mt-2 flex w-56 flex-wrap items-center justify-center gap-1.5">
          {options.map((url) => (
            <button
              key={url}
              type="button"
              onClick={() => handleSelect(url)}
              className="h-12 w-12 overflow-hidden rounded-md border-2 border-transparent hover:border-green-600"
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
          {stillLoading && <p className="w-full text-[11px] text-stone-400">読み込み中…</p>}
          {!stillLoading && options.length === 0 && (
            <p className="text-[11px] text-stone-400">他の候補が見つかりませんでした</p>
          )}
          <button
            type="button"
            onClick={() => setStatus('idle')}
            className="w-full text-[11px] text-stone-400 hover:text-stone-600"
          >
            閉じる
          </button>
        </div>
      )}
    </div>
  )
}
