import { useState } from 'react'
import { fetchIllustrationAlternatives } from '../lib/illustration'
import { fetchRealIllustrationAlternatives } from '../lib/api'

export default function IllustrationChooser({ meta, currentUrl, onSelect }) {
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'open'
  const [options, setOptions] = useState([])
  const [error, setError] = useState('')

  if (!meta) return null

  async function handleOpen() {
    setStatus('loading')
    setError('')
    try {
      const alternatives =
        meta.source === 'pixabay-chain'
          ? await fetchRealIllustrationAlternatives(meta.subject, 4)
          : await fetchIllustrationAlternatives({ en: meta.subject, emoji: meta.emoji }, 4)
      setOptions(alternatives.filter((url) => url !== currentUrl))
      setStatus('open')
    } catch (err) {
      setError(err.message)
      setStatus('idle')
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
        <div className="mt-2 flex w-32 flex-wrap items-center justify-center gap-1.5">
          {options.length === 0 && (
            <p className="text-[11px] text-stone-400">他の候補が見つかりませんでした</p>
          )}
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
