import { useState, type FormEvent } from 'react'

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

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
          gap: 8px;
        }

        input {
          width: 220px;
          padding: 12px 14px;
          border: 1px solid #6b7280;
          border-radius: 10px;
          background: #111827;
          color: #f9fafb;
          font-size: 1rem;
          outline: none;
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
          const guess = guesses[rowIndex] ?? ''
          const states = feedback[rowIndex] ?? []

          return (
            <div className="row" key={rowIndex}>
              {Array.from({ length: 5 }, (_, cellIndex) => {
                const letter = guess[cellIndex] ?? ''
                const state = states[cellIndex] ?? ''
                const className = `tile ${state}`.trim()

                return (
                  <div className={className} key={cellIndex}>
                    {letter.toUpperCase()}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={currentGuess}
          onChange={(event) =>
            setCurrentGuess(
              event.target.value.toLowerCase().replace(/[^a-z]/g, '').slice(0, 5)
            )
          }
          maxLength={5}
          placeholder="Enter a word"
          disabled={gameOver}
          autoFocus
        />
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