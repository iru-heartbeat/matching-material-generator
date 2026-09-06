import { useState } from 'react'

export const MODES = [
  {
    id: 'word-illustration',
    title: 'ことば×イラスト',
    description: 'ことばとイラストをマッチさせる、基本のモード。',
    available: true,
  },
  {
    id: 'illustration-illustration',
    title: 'イラスト×イラスト',
    description: '作風の異なる2種類のイラストをマッチさせる。',
    available: true,
  },
  {
    id: 'illustration-kanji',
    title: 'イラスト×漢字',
    description: 'イラストの意味に合う漢字をマッチさせる。',
    available: true,
  },
]

const AGE_OPTIONS = ['未就学', '小学校低学年', '小学校中学年', '小学校高学年', '中学生']

export default function ModeSetupScreen({ initialSettings, onNext }) {
  const [mode, setMode] = useState(initialSettings.mode)
  const [hintEnabled, setHintEnabled] = useState(initialSettings.hintEnabled)
  const [age, setAge] = useState(initialSettings.age)
  const [pairCount, setPairCount] = useState(initialSettings.pairCount)

  function handleSubmit(e) {
    e.preventDefault()
    onNext({ mode, hintEnabled, age, pairCount: Number(pairCount) })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200"
    >
      <div>
        <h1 className="text-xl font-bold text-stone-800">教材の設定</h1>
        <p className="mt-1 text-sm text-stone-500">モードと設定を選んでから、テーマを入力します。</p>
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-stone-700">マッチングモード</span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {MODES.map((m) => {
            const selected = mode === m.id
            return (
              <button
                key={m.id}
                type="button"
                disabled={!m.available}
                onClick={() => setMode(m.id)}
                className={`relative flex flex-col gap-1 rounded-xl border p-4 text-left transition ${
                  selected ? 'border-green-700 bg-green-50 ring-2 ring-green-100' : 'border-stone-200 hover:border-stone-300'
                } ${!m.available ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                {!m.available && (
                  <span className="absolute right-3 top-3 rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-semibold text-stone-500">
                    準備中
                  </span>
                )}
                <span className="font-semibold text-stone-800">{m.title}</span>
                <span className="text-xs text-stone-500">{m.description}</span>
              </button>
            )
          })}
        </div>
      </div>

      <label className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 px-4 py-3">
        <span className="flex flex-col">
          <span className="text-sm font-medium text-stone-700">ヒントを表示する</span>
          <span className="text-xs text-stone-500">イラストの下に対応することばを小さく表示します</span>
        </span>
        <input
          type="checkbox"
          checked={hintEnabled}
          onChange={(e) => setHintEnabled(e.target.checked)}
          className="h-5 w-5 accent-green-700"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">対象年齢</span>
          <select
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          >
            {AGE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">ペア数</span>
          <input
            type="number"
            min={2}
            max={12}
            value={pairCount}
            onChange={(e) => setPairCount(e.target.value)}
            className="rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-2 rounded-lg bg-green-700 px-4 py-2.5 font-semibold text-white transition hover:bg-green-800"
      >
        次へ（テーマ入力）
      </button>
    </form>
  )
}
