import { useState } from 'react'
import ModeSetupScreen from './components/ModeSetupScreen'
import ThemeForm from './components/ThemeForm'
import MaterialPreview from './components/MaterialPreview'
import LoadingScreen from './components/LoadingScreen'
import { generateWords, generateKanjiPairs, fetchRealIllustration, translateWord } from './lib/api'
import { fetchIllustrationImage } from './lib/illustration'

// 同じテーマで再生成しても毎回同じ並びにならないよう、生成結果を画面に渡す前にシャッフルする。
function shuffle(array) {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

const DEFAULT_SETTINGS = {
  mode: 'word-illustration',
  hintEnabled: false,
  age: '小学校低学年',
  pairCount: 6,
  wordLengthCondition: 'none',
}

function App() {
  const [screen, setScreen] = useState('setup') // 'setup' | 'theme' | 'loading' | 'preview' | 'error'
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [theme, setTheme] = useState('')
  const [pairs, setPairs] = useState([])
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState('')

  function handleSetupNext(newSettings) {
    setSettings(newSettings)
    setScreen('theme')
  }

  function handleChangeImage(pairId, field, url) {
    setPairs((prev) => prev.map((pair) => (pair.id === pairId ? { ...pair, [field]: url } : pair)))
  }

  async function handleEditItem(pairId, newWord) {
    const pair = pairs.find((p) => p.id === pairId)
    if (!pair) return

    const { en, emoji } = await translateWord(newWord)

    if (pair.cardImageUrl !== undefined) {
      // イラスト×イラスト: 両側のイラストを新しい単語で作り直す
      const realisticUrl = await fetchRealIllustration(en)
      const lineArtUrl = await fetchIllustrationImage({ en, emoji })
      setPairs((prev) =>
        prev.map((p) =>
          p.id === pairId
            ? {
                ...p,
                hint: newWord,
                imageUrl: realisticUrl,
                cardImageUrl: lineArtUrl,
                imageMeta: { source: 'pixabay-chain', subject: en },
                cardImageMeta: { source: 'pollinations', subject: en, emoji },
              }
            : p,
        ),
      )
    } else {
      const imageUrl = await fetchIllustrationImage({ en, emoji })
      setPairs((prev) =>
        prev.map((p) =>
          p.id === pairId
            ? { ...p, label: newWord, hint: newWord, imageUrl, imageMeta: { source: 'pollinations', subject: en, emoji } }
            : p,
        ),
      )
    }
  }

  async function handleThemeSubmit(themeValue) {
    setScreen('loading')
    setError('')
    setProgress(null)
    setTheme(themeValue)
    try {
      const nextPairs = []

      if (settings.mode === 'illustration-kanji') {
        const kanjiPairs = await generateKanjiPairs({
          theme: themeValue,
          age: settings.age,
          pairCount: settings.pairCount,
          wordLengthCondition: settings.wordLengthCondition,
        })
        // Pollinations AIは同時リクエストに弱いため、1枚ずつ順番に取得する
        for (let i = 0; i < kanjiPairs.length; i++) {
          const { reading, kanji, en, emoji } = kanjiPairs[i]
          setProgress({ current: i + 1, total: kanjiPairs.length })
          const imageUrl = await fetchIllustrationImage({ en, emoji })
          nextPairs.push({
            id: `${i}-${kanji}`,
            imageUrl,
            label: kanji,
            hint: reading,
            imageMeta: { source: 'pollinations', subject: en, emoji },
          })
        }
      } else {
        const words = await generateWords({
          theme: themeValue,
          age: settings.age,
          pairCount: settings.pairCount,
          wordLengthCondition: settings.wordLengthCondition,
        })
        // Pollinations AIは同時リクエストに弱いため、1枚ずつ順番に取得する
        for (let i = 0; i < words.length; i++) {
          const { word, en, emoji } = words[i]
          setProgress({ current: i + 1, total: words.length })

          if (settings.mode === 'illustration-illustration') {
            // リアル画像側は写真であるべきなので絵文字は使わない
            const realisticUrl = await fetchRealIllustration(en)
            const lineArtUrl = await fetchIllustrationImage({ en, emoji })
            nextPairs.push({
              id: `${i}-${word}`,
              imageUrl: realisticUrl,
              cardImageUrl: lineArtUrl,
              hint: word,
              imageMeta: { source: 'pixabay-chain', subject: en },
              cardImageMeta: { source: 'pollinations', subject: en, emoji },
            })
          } else {
            const imageUrl = await fetchIllustrationImage({ en, emoji })
            nextPairs.push({
              id: `${i}-${word}`,
              imageUrl,
              label: word,
              hint: word,
              imageMeta: { source: 'pollinations', subject: en, emoji },
            })
          }
        }
      }

      setPairs(shuffle(nextPairs))
      setScreen('preview')
    } catch (err) {
      setError(err.message)
      setScreen('error')
    }
  }

  return (
    <div className="min-h-svh bg-amber-50 px-4 py-10">
      {screen === 'setup' && <ModeSetupScreen initialSettings={settings} onNext={handleSetupNext} />}

      {(screen === 'theme' || screen === 'error') && (
        <>
          <ThemeForm onSubmit={handleThemeSubmit} onBack={() => setScreen('setup')} disabled={false} />
          {screen === 'error' && (
            <p className="mx-auto mt-4 max-w-md text-center text-sm text-red-600">{error}</p>
          )}
        </>
      )}

      {screen === 'loading' && <LoadingScreen theme={theme} settings={settings} progress={progress} />}

      {screen === 'preview' && settings.mode === 'illustration-illustration' && (
        <MaterialPreview
          theme={theme}
          pairs={pairs}
          onBack={() => setScreen('theme')}
          onChangeImage={handleChangeImage}
          onEditItem={handleEditItem}
          cardLabel="絵カード"
          hintEnabled={settings.hintEnabled}
        />
      )}
      {screen === 'preview' && settings.mode === 'illustration-kanji' && (
        <MaterialPreview
          theme={theme}
          pairs={pairs}
          onBack={() => setScreen('theme')}
          onChangeImage={handleChangeImage}
          onEditItem={handleEditItem}
          cardLabel="漢字カード"
          hintEnabled={settings.hintEnabled}
        />
      )}
      {screen === 'preview' && settings.mode === 'word-illustration' && (
        <MaterialPreview
          theme={theme}
          pairs={pairs}
          onBack={() => setScreen('theme')}
          onChangeImage={handleChangeImage}
          onEditItem={handleEditItem}
          hintEnabled={settings.hintEnabled}
        />
      )}
    </div>
  )
}

export default App
