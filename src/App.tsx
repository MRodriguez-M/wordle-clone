import { useRef, useState, type FormEvent } from 'react'

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

      <p className="message">{message}</p>
      <button type="button" className="reset" onClick={resetGame}>
        New Game
      </button>
    </div>
  )
}

export default App