import IllustrationChooser from './IllustrationChooser'

export default function MaterialPreview({ theme, pairs, onBack, onChangeImage, cardLabel = '名前カード', hintEnabled = false }) {
  const isImagePair = Boolean(pairs[0]?.cardImageUrl)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
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

      {/* ページ1: イラスト台紙（画像ペアの場合はプレースホルダーなし） */}
      <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200 print:break-after-page print:shadow-none print:ring-0">
        <h2 className="mb-4 border-b border-dashed border-stone-300 pb-3 text-base font-bold text-stone-800">
          「{theme}」マッチング　台紙
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {pairs.map((pair) => (
            <div key={pair.id} className="flex flex-col items-center gap-2 rounded-xl border-2 border-stone-800 p-3">
              <img src={pair.imageUrl} alt="" className="h-28 w-28 rounded-lg object-cover" />
              {hintEnabled && <span className="text-xs text-stone-400">{pair.hint}</span>}
              <IllustrationChooser
                meta={pair.imageMeta}
                currentUrl={pair.imageUrl}
                onSelect={(url) => onChangeImage(pair.id, 'imageUrl', url)}
              />
              {!isImagePair && (
                <div className="flex h-14 w-full items-center justify-center rounded-lg border-2 border-dashed border-green-200">
                  <span className="px-2 text-center text-xs text-stone-400">ここに{cardLabel}をおく</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ページ2: 切り取って使うカード（画像ペアの場合は台紙と同じ大きさのイラスト） */}
      <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200 print:shadow-none print:ring-0">
        <h2 className="mb-4 border-b border-dashed border-stone-300 pb-3 text-base font-bold text-stone-800">
          「{theme}」マッチング　{cardLabel}
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {pairs.map((pair) =>
            isImagePair ? (
              <div key={pair.id} className="flex flex-col items-center gap-2 rounded-xl border-2 border-stone-800 p-3">
                <img src={pair.cardImageUrl} alt="" className="h-28 w-28 rounded-lg object-cover" />
                <IllustrationChooser
                  meta={pair.cardImageMeta}
                  currentUrl={pair.cardImageUrl}
                  onSelect={(url) => onChangeImage(pair.id, 'cardImageUrl', url)}
                />
              </div>
            ) : (
              <div key={pair.id} className="p-3">
                <div className="flex h-14 w-full items-center justify-center rounded-lg border-2 border-stone-800">
                  <span className="text-xl font-bold text-stone-800">{pair.label}</span>
                </div>
              </div>
            ),
          )}
        </div>
      </section>
    </div>
  )
}
