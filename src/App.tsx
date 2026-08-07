import { useEffect, useMemo, useRef, useState } from 'react'

type LetterState = 'green' | 'yellow' | 'gray'

const WORD_LIST = [
  'apple',
  'grape',
  'candy',
  'stone',
  'plane',
  'music',
  'light',
  'crane',
  'share',
  'smile',
  'beach',
  'dream',
  'heart',
  'party',
  'cloud',
  'ocean',
  'earth',
  'river',
  'spice',
]

const pickWord = () => WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]

const KEYBOARD_LAYOUT = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
]

function App() {
  const [targetWord, setTargetWord] = useState(() => pickWord())
  const [guesses, setGuesses] = useState<string[]>(Array(6).fill(''))
  const [currentGuess, setCurrentGuess] = useState('')
  const [currentRow, setCurrentRow] = useState(0)
  const [feedback, setFeedback] = useState<LetterState[][]>(
    Array.from({ length: 6 }, () => [])
  )
  const [gameOver, setGameOver] = useState(false)
  const [message, setMessage] = useState('Type a 5-letter word and press Enter.')
  const inputRefs = useRef<Array<Array<HTMLInputElement | null>>>([])

  const getLetterStates = (guess: string, target: string): LetterState[] => {
    const states: LetterState[] = Array(5).fill('gray')
    const targetLetters = target.split('')
    const guessLetters = guess.split('')

    for (let i = 0; i < 5; i += 1) {
      if (guessLetters[i] === targetLetters[i]) {
        states[i] = 'green'
        targetLetters[i] = ''
        guessLetters[i] = ''
      }
    }

    for (let i = 0; i < 5; i += 1) {
      if (!guessLetters[i]) continue

      const targetIndex = targetLetters.findIndex((letter) => letter === guessLetters[i])

      if (targetIndex !== -1) {
        states[i] = 'yellow'
        targetLetters[targetIndex] = ''
      }
    }

    return states
  }

  useEffect(() => {
    if (gameOver) return

    const activeRow = inputRefs.current[currentRow]
    if (!activeRow) return

    const nextIndex = Math.min(currentGuess.length, 4)
    const targetInput = activeRow[nextIndex]

    if (targetInput && document.activeElement !== targetInput) {
      targetInput.focus()
    }
  }, [currentGuess, currentRow, gameOver])

  const handleKeyboardInput = (key: string) => {
    if (gameOver) return

    if (key === 'enter') {
      submitGuess()
      return
    }

    if (key === 'backspace') {
      if (!currentGuess) return

      const updatedGuess = currentGuess.slice(0, -1)
      setCurrentGuess(updatedGuess)
      const nextIndex = Math.max(0, updatedGuess.length)
      inputRefs.current[currentRow][nextIndex]?.focus()
      return
    }

    if (currentGuess.length >= 5) return

    const updatedGuess = `${currentGuess}${key.toLowerCase()}`
    setCurrentGuess(updatedGuess)
    const nextIndex = updatedGuess.length
    inputRefs.current[currentRow][nextIndex]?.focus()
  }

  const resetGame = () => {
    const nextWord = pickWord()
    setTargetWord(nextWord)
    setGuesses(Array(6).fill(''))
    setCurrentGuess('')
    setCurrentRow(0)
    setFeedback(Array.from({ length: 6 }, () => []))
    setGameOver(false)
    setMessage('New game started. Good luck!')
  }

  const submitGuess = () => {
    if (gameOver) return

    const normalizedGuess = currentGuess.trim().toLowerCase()

    if (normalizedGuess.length !== 5) {
      setMessage('Enter exactly 5 letters.')
      return
    }

    if (!WORD_LIST.includes(normalizedGuess)) {
      setMessage('Word not in the list. Try another one.')
      return
    }

    const nextGuesses = [...guesses]
    nextGuesses[currentRow] = normalizedGuess
    setGuesses(nextGuesses)

    const states = getLetterStates(normalizedGuess, targetWord)
    const nextFeedback = [...feedback]
    nextFeedback[currentRow] = states
    setFeedback(nextFeedback)

    if (normalizedGuess === targetWord) {
      setMessage(`Correct! The word was ${targetWord.toUpperCase()}.`)
      setGameOver(true)
      return
    }

    if (currentRow === 5) {
      setMessage(`Game over! The word was ${targetWord.toUpperCase()}.`)
      setGameOver(true)
      return
    }

    setCurrentGuess('')
    setCurrentRow((row) => row + 1)
    setMessage('Try another word.')
  }

  const handleTileChange = (rowIndex: number, cellIndex: number, value: string) => {
    if (rowIndex !== currentRow || gameOver) return

    const cleanedValue = value.toLowerCase().replace(/[^a-z]/g, '').slice(0, 1)
    const nextGuess = currentGuess.padEnd(5, '').split('')
    nextGuess[cellIndex] = cleanedValue
    const updatedGuess = nextGuess.join('').slice(0, 5)

    setCurrentGuess(updatedGuess)

    if (cleanedValue && cellIndex < 4) {
      inputRefs.current[rowIndex][cellIndex + 1]?.focus()
    }
  }

  const keyboardStates = useMemo(() => {
    const stateMap = new Map<string, LetterState>()

    guesses.forEach((guess, rowIndex) => {
      if (!guess) return

      const states = feedback[rowIndex] ?? []

      guess.split('').forEach((letter, letterIndex) => {
        const state = states[letterIndex]
        const currentState = stateMap.get(letter)

        if (!currentState) {
          stateMap.set(letter, state)
          return
        }

        if (currentState === 'gray' && state !== 'gray') {
          stateMap.set(letter, state)
        } else if (currentState === 'yellow' && state === 'green') {
          stateMap.set(letter, state)
        }
      })
    })

    return stateMap
  }, [feedback, guesses])

  const handleTileKeyDown = (rowIndex: number, cellIndex: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !currentGuess[cellIndex] && cellIndex > 0) {
      event.preventDefault()
      const nextGuess = currentGuess.padEnd(5, '').split('')
      nextGuess[cellIndex - 1] = ''
      setCurrentGuess(nextGuess.join('').slice(0, 5))
      inputRefs.current[rowIndex][cellIndex - 1]?.focus()
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      submitGuess()
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-8 text-slate-100">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight sm:text-4xl">Wordle Clone</h1>
      <p className="mb-5 text-sm text-slate-300 sm:text-base">Guess the 5-letter word in 6 tries.</p>

      <div className="grid gap-2">
        {Array.from({ length: 6 }, (_, rowIndex) => {
          const guess = rowIndex === currentRow ? currentGuess : (guesses[rowIndex] ?? '')
          const states = feedback[rowIndex] ?? []

          return (
            <div className="grid grid-cols-5 gap-2" key={rowIndex}>
              {Array.from({ length: 5 }, (_, cellIndex) => {
                const letter = guess[cellIndex] ?? ''
                const state = states[cellIndex] ?? ''
                const tileClasses = {
                  green: 'border-emerald-500 bg-emerald-500 text-white',
                  yellow: 'border-amber-400 bg-amber-400 text-white',
                  gray: 'border-slate-600 bg-slate-700 text-slate-100',
                  '': 'border-slate-500 bg-slate-950 text-slate-100',
                }[state as LetterState | '']
                const isEditable = rowIndex === currentRow && !gameOver

                return (
                  <input
                    ref={(element) => {
                      if (!inputRefs.current[rowIndex]) {
                        inputRefs.current[rowIndex] = []
                      }
                      inputRefs.current[rowIndex][cellIndex] = element
                    }}
                    className={`flex h-13 w-13 items-center justify-center border-2 text-center text-lg font-bold uppercase outline-none disabled:cursor-default disabled:opacity-100 sm:h-14 sm:w-14 sm:text-xl ${tileClasses}`}
                    key={cellIndex}
                    value={letter.toUpperCase()}
                    onChange={(event) => handleTileChange(rowIndex, cellIndex, event.target.value)}
                    onKeyDown={(event) => handleTileKeyDown(rowIndex, cellIndex, event)}
                    maxLength={1}
                    disabled={!isEditable}
                    autoComplete="off"
                    spellCheck={false}
                    aria-label={`Letter ${cellIndex + 1} of row ${rowIndex + 1}`}
                  />
                )
              })}
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex w-full max-w-xl flex-col gap-2" aria-label="On-screen keyboard">
        {KEYBOARD_LAYOUT.map((row, rowIndex) => (
          <div className="flex justify-center gap-2" key={`keyboard-row-${rowIndex}`}>
            {row.map((key) => {
              const isWide = key === 'enter' || key === 'backspace'
              const label = key === 'enter' ? 'Enter' : key === 'backspace' ? '⌫' : key.toUpperCase()
              const isDisabled = gameOver || (key.length === 1 && currentGuess.length >= 5)
              const keyState = key.length === 1 ? (keyboardStates.get(key) ?? '') : ''
              const stateClasses = {
                green: 'bg-emerald-500 text-white',
                yellow: 'bg-amber-400 text-white',
                gray: 'bg-slate-700 text-slate-100',
                '': 'bg-slate-500 text-white',
              }[keyState as LetterState | '']

              return (
                <button
                  key={key}
                  type="button"
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold uppercase disabled:cursor-not-allowed disabled:opacity-60 ${isWide ? 'min-w-[4.25rem]' : 'min-w-[2.25rem]'} ${stateClasses}`}
                  onClick={() => handleKeyboardInput(key)}
                  disabled={isDisabled || (key === 'backspace' && !currentGuess)}
                >
                  {label}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <p className="mt-3 min-h-6 font-semibold text-amber-400">{message}</p>
      <button
        type="button"
        className="mt-3 rounded-xl bg-slate-700 px-4 py-2 font-semibold text-slate-100 transition hover:bg-slate-600"
        onClick={resetGame}
      >
        New Game
      </button>
    </div>
  )
}

export default App