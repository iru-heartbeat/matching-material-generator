import { useMemo } from 'react'
import { shuffle } from '../lib/shuffle'

const LABELS = 'ABCDEFGHIJKL'

export default function IllustrationMatchPreview({ theme, pairs, onBack, hintEnabled = false }) {
  const realisticItems = useMemo(() => pairs.map((pair, i) => ({ ...pair, label: LABELS[i] })), [pairs])
  const lineArtItems = useMemo(
    () => shuffle(pairs.map((pair, i) => ({ ...pair, number: i + 1 }))),
    [pairs],
  )

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between print:hidden">
        <button type="button" onClick={onBack} className="text-sm font-medium text-stone-500 hover:text-stone-700">
          ← テーマ入力に戻る
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-green-700 px-4 py-2 font-semibold text-white transition hover:bg-green-800"
        >
          印刷する
        </button>
      </div>

      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200 print:shadow-none print:ring-0">
        <h2 className="mb-6 text-center text-lg font-bold text-stone-800">
          「{theme}」のマッチング — 同じ意味のイラストどうしを線でつなごう
        </h2>

        <div className="grid grid-cols-2 gap-x-16 gap-y-4">
          <div className="flex flex-col gap-4">
            {realisticItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-stone-200 px-4 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-800">
                  {item.label}
                </span>
                <div className="flex flex-col items-center gap-1">
                  <img src={item.realisticUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  {hintEnabled && <span className="text-[10px] text-stone-400">{item.word}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            {lineArtItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-stone-200 px-4 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800">
                  {item.number}
                </span>
                <div className="flex flex-col items-center gap-1">
                  <img src={item.lineArtUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  {hintEnabled && <span className="text-[10px] text-stone-400">{item.word}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
