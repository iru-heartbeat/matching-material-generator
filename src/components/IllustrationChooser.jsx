import { useRef, useState } from 'react'
import { fetchIllustrationAlternatives, preloadImage } from '../lib/illustration'
import { fetchRealIllustrationAlternatives } from '../lib/api'

export default function IllustrationChooser({ meta, currentUrl, onSelect }) {
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'open'
  const [options, setOptions] = useState([])
  const [stillLoading, setStillLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  if (!meta) return null

  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = '' // 同じファイルを連続で選んでもchangeが発火するようにする
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      onSelect(reader.result)
      setStatus('idle')
    }
    reader.readAsDataURL(file)
  }

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
        // Pollinationsは無料枠だと同一IPから同時1リクエストしか受け付けず、
        // 1枚あたり10〜30秒以上かかることもあるため、候補数を絞って待ち時間を短くする。
        // 届いた分から順に表示する。
        setStatus('open')
        await fetchIllustrationAlternatives({ en: meta.subject, emoji: meta.emoji }, 4, (url) => {
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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {status !== 'open' && (
        <div className="mt-1 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleOpen}
            disabled={status === 'loading'}
            className="text-[11px] font-medium text-green-700 hover:text-green-800 disabled:opacity-50"
          >
            {status === 'loading' ? '探しています…' : '違う写真を選ぶ'}
          </button>
          <span className="text-[11px] text-stone-300">|</span>
          <button
            type="button"
            onClick={handleUploadClick}
            className="text-[11px] font-medium text-stone-500 hover:text-stone-700"
          >
            自分の画像を使う
          </button>
        </div>
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
          {stillLoading && (
            <p className="w-full text-[11px] text-stone-400">
              読み込み中…（混み合っていると時間がかかることがあります）
            </p>
          )}
          {!stillLoading && options.length === 0 && (
            <p className="text-[11px] text-stone-400">他の候補が見つかりませんでした</p>
          )}
          <div className="flex w-full items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleUploadClick}
              className="text-[11px] font-medium text-stone-500 hover:text-stone-700"
            >
              自分の画像を使う
            </button>
            <span className="text-[11px] text-stone-300">|</span>
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="text-[11px] text-stone-400 hover:text-stone-600"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
