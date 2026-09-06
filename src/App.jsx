import { useState } from 'react'
import ModeSetupScreen from './components/ModeSetupScreen'
import ThemeForm from './components/ThemeForm'
import MaterialPreview from './components/MaterialPreview'
import IllustrationMatchPreview from './components/IllustrationMatchPreview'
import LoadingScreen from './components/LoadingScreen'
import { generateWords, generateKanjiPairs, fetchRealIllustration } from './lib/api'
import { fetchIllustrationImage } from './lib/illustration'

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
          nextPairs.push({ id: `${i}-${kanji}`, imageUrl, label: kanji, hint: reading })
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
            nextPairs.push({ id: `${i}-${word}`, word, realisticUrl, lineArtUrl })
          } else {
            const imageUrl = await fetchIllustrationImage({ en, emoji })
            nextPairs.push({ id: `${i}-${word}`, imageUrl, label: word, hint: word })
          }
        }
      }

      setPairs(nextPairs)
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
        <IllustrationMatchPreview
          theme={theme}
          pairs={pairs}
          onBack={() => setScreen('theme')}
          hintEnabled={settings.hintEnabled}
        />
      )}
      {screen === 'preview' && settings.mode === 'illustration-kanji' && (
        <MaterialPreview
          theme={theme}
          pairs={pairs}
          onBack={() => setScreen('theme')}
          cardLabel="漢字カード"
          hintEnabled={settings.hintEnabled}
        />
      )}
      {screen === 'preview' && settings.mode === 'word-illustration' && (
        <MaterialPreview
          theme={theme}
          pairs={pairs}
          onBack={() => setScreen('theme')}
          hintEnabled={settings.hintEnabled}
        />
      )}
    </div>
  )
}

export default App
