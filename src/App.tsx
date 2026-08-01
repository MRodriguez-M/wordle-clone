import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitGuess()
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
    <div className="app">
      <style>{`
        :root {
          color-scheme: dark;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #111827;
          color: #f9fafb;
        }

        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: linear-gradient(135deg, #111827, #1f2937);
        }

        .title {
          margin: 0 0 8px;
          font-size: 2rem;
        }

        .subtitle {
          margin: 0 0 20px;
          color: #d1d5db;
        }

        .board {
          display: grid;
          gap: 8px;
        }

        .row {
          display: grid;
          grid-template-columns: repeat(5, 52px);
          gap: 8px;
        }

        .tile {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          border: 2px solid #4b5563;
          background: #111827;
          font-weight: 700;
          font-size: 1.2rem;
          text-transform: uppercase;
          text-align: center;
          padding: 0;
          color: #f9fafb;
          outline: none;
        }

        .tile:disabled {
          opacity: 1;
          cursor: default;
        }

        .tile.green {
          background: #4caf50;
          border-color: #4caf50;
        }

        .tile.yellow {
          background: #f5b700;
          border-color: #f5b700;
          color: #111827;
        }

        .tile.gray {
          background: #374151;
          border-color: #374151;
        }

        form {
          margin-top: 20px;
          display: flex;
          justify-content: center;
        }

        button {
          padding: 12px 16px;
          border: none;
          border-radius: 10px;
          background: #60a5fa;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .message {
          min-height: 24px;
          margin-top: 12px;
          color: #fbbf24;
          font-weight: 600;
        }

        .keyboard {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 16px;
          width: min(100%, 560px);
        }

        .keyboard-row {
          display: flex;
          justify-content: center;
          gap: 6px;
        }

        .keyboard-key {
          min-width: 38px;
          padding: 10px 8px;
          border: none;
          border-radius: 8px;
          background: #4b5563;
          color: #f9fafb;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          text-transform: uppercase;
        }

        .keyboard-key.wide {
          min-width: 68px;
        }

        .keyboard-key:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .keyboard-key.green {
          background: #4caf50;
          color: #fff;
        }

        .keyboard-key.yellow {
          background: #f5b700;
          color: #111827;
        }

        .keyboard-key.gray {
          background: #374151;
          color: #f9fafb;
        }

        .reset {
          margin-top: 12px;
          background: #374151;
        }
      `}</style>

      <h1 className="title">Wordle Clone</h1>
      <p className="subtitle">Guess the 5-letter word in 6 tries.</p>

      <div className="board">
        {Array.from({ length: 6 }, (_, rowIndex) => {
          const guess = rowIndex === currentRow ? currentGuess : (guesses[rowIndex] ?? '')
          const states = feedback[rowIndex] ?? []

          return (
            <div className="row" key={rowIndex}>
              {Array.from({ length: 5 }, (_, cellIndex) => {
                const letter = guess[cellIndex] ?? ''
                const state = states[cellIndex] ?? ''
                const className = `tile ${state}`.trim()
                const isEditable = rowIndex === currentRow && !gameOver

                return (
                  <input
                    ref={(element) => {
                      if (!inputRefs.current[rowIndex]) {
                        inputRefs.current[rowIndex] = []
                      }
                      inputRefs.current[rowIndex][cellIndex] = element
                    }}
                    className={className}
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

      <form onSubmit={handleSubmit}>
        <button type="submit" disabled={gameOver}>
          Guess
        </button>
      </form>

      <div className="keyboard" aria-label="On-screen keyboard">
        {KEYBOARD_LAYOUT.map((row, rowIndex) => (
          <div className="keyboard-row" key={`keyboard-row-${rowIndex}`}>
            {row.map((key) => {
              const isWide = key === 'enter' || key === 'backspace'
              const label = key === 'enter' ? 'Enter' : key === 'backspace' ? '⌫' : key.toUpperCase()
              const isDisabled = gameOver || (key.length === 1 && currentGuess.length >= 5)
              const keyState = key.length === 1 ? keyboardStates.get(key) : ''
              const stateClass = keyState ? ` ${keyState}` : ''

              return (
                <button
                  key={key}
                  type="button"
                  className={`keyboard-key${isWide ? ' wide' : ''}${stateClass}`}
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

      <p className="message">{message}</p>
      <button type="button" className="reset" onClick={resetGame}>
        New Game
      </button>
    </div>
  )
}

export default App