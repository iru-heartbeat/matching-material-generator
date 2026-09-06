import { MODES, WORD_LENGTH_CONDITIONS } from './ModeSetupScreen'

const MODE_TITLES = Object.fromEntries(MODES.map((m) => [m.id, m.title]))
const CONDITION_LABELS = Object.fromEntries(WORD_LENGTH_CONDITIONS.map((c) => [c.id, c.label]))

export default function LoadingScreen({ theme, settings, progress }) {
  const percent = progress ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 rounded-2xl bg-white p-10 shadow-sm ring-1 ring-stone-200">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 64 64" className="h-full w-full text-amber-900" fill="none">
          <path
            d="M10 26h36v14a10 10 0 0 1-10 10H20a10 10 0 0 1-10-10V26Z"
            fill="#fff"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <path
            d="M46 30h4a6 6 0 0 1 0 12h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <line x1="6" y1="54" x2="50" y2="54" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>

        <svg
          viewBox="0 0 20 40"
          className="absolute -top-8 left-[14px] h-10 w-5 text-stone-300 animate-steam-1 motion-reduce:animate-none"
          fill="none"
        >
          <path d="M10 38C4 30 16 24 10 16C4 8 16 4 10 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <svg
          viewBox="0 0 20 40"
          className="absolute -top-9 left-[34px] h-10 w-5 text-stone-300 animate-steam-2 motion-reduce:animate-none"
          fill="none"
        >
          <path d="M10 38C4 30 16 24 10 16C4 8 16 4 10 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <div className="w-full text-center">
        <p className="text-sm font-medium text-stone-700">教材をいれています…</p>
        {progress && (
          <>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-green-700 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-stone-400">
              イラストを生成しています…（{progress.current}/{progress.total}）
            </p>
          </>
        )}
      </div>

      <dl className="w-full space-y-1.5 rounded-xl bg-stone-50 px-4 py-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-stone-500">テーマ</dt>
          <dd className="font-medium text-stone-800">{theme}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone-500">モード</dt>
          <dd className="font-medium text-stone-800">{MODE_TITLES[settings.mode]}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone-500">対象年齢</dt>
          <dd className="font-medium text-stone-800">{settings.age}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone-500">ペア数</dt>
          <dd className="font-medium text-stone-800">{settings.pairCount}</dd>
        </div>
        {settings.wordLengthCondition && settings.wordLengthCondition !== 'none' && (
          <div className="flex justify-between gap-3">
            <dt className="text-stone-500">ことばの条件</dt>
            <dd className="font-medium text-stone-800">{CONDITION_LABELS[settings.wordLengthCondition]}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <dt className="text-stone-500">ヒント表示</dt>
          <dd className="font-medium text-stone-800">{settings.hintEnabled ? 'オン' : 'オフ'}</dd>
        </div>
      </dl>
    </div>
  )
}
