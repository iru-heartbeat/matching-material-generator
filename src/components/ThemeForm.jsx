import { useState } from 'react'

export default function ThemeForm({ onSubmit, onBack, disabled }) {
  const [theme, setTheme] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!theme.trim()) return
    onSubmit(theme.trim())
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200"
    >
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-2 text-sm font-medium text-stone-500 hover:text-stone-700"
        >
          ← 設定に戻る
        </button>
        <h1 className="text-xl font-bold text-stone-800">テーマを入力</h1>
        <p className="mt-1 text-sm text-stone-500">教材のテーマを入力してください。</p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-stone-700">テーマ</span>
        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="例：どうぶつ、たべもの、のりもの"
          className="rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          required
          autoFocus
        />
      </label>

      <button
        type="submit"
        disabled={disabled}
        className="mt-2 rounded-lg bg-green-700 px-4 py-2.5 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {disabled ? '作成中…' : '教材を作成する'}
      </button>
    </form>
  )
}
