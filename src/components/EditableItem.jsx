import { useState } from 'react'

// 先生が生成された項目（ことば/漢字）を直接書き換えられるようにする。
// 保存するとonSaveがイラストの再生成まで含めて処理する。
export default function EditableItem({ value, onSave, className = '' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function startEdit() {
    setDraft(value)
    setError('')
    setEditing(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed || trimmed === value) {
      setEditing(false)
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(trimmed)
      setEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <span className={className}>
        {value}
        <button
          type="button"
          onClick={startEdit}
          className="ml-1 align-middle text-[10px] font-normal text-green-700 hover:text-green-800 print:hidden"
        >
          編集
        </button>
      </span>
    )
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col items-center gap-1 print:hidden">
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        autoFocus
        className="w-24 rounded border border-stone-300 px-1.5 py-0.5 text-center text-sm outline-none focus:border-green-600"
      />
      <div className="flex gap-2 text-[11px]">
        <button
          type="submit"
          disabled={saving}
          className="font-medium text-green-700 hover:text-green-800 disabled:opacity-50"
        >
          {saving ? '更新中…' : '保存'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={saving}
          className="text-stone-400 hover:text-stone-600"
        >
          キャンセル
        </button>
      </div>
      {error && <p className="text-[10px] text-red-600">{error}</p>}
    </form>
  )
}
