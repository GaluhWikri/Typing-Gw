"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RotateCcw } from "lucide-react"
import { TestResults } from "@/components/test-results"
import { ConfigBar } from "@/components/config-bar"
import { WORD_BANKS } from "@/lib/word-banks"

type Language = "english" | "indonesian"
type Mode = "time" | "words"

export default function TypingTest() {
  const [language, setLanguage] = useState<Language>("english")
  const [mode, setMode] = useState<Mode>("time")
  const [duration, setDuration] = useState(30)
  const [wordCount, setWordCount] = useState(30)

  const [testWords, setTestWords] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [input, setInput] = useState("")
  const [typedChars, setTypedChars] = useState<Array<{ char: string; correct: boolean }>>([])
  const [allTypedWords, setAllTypedWords] = useState<Record<number, Array<{ char: string; correct: boolean }>>>({})
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(duration)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [errors, setErrors] = useState(0)
  const [correctChars, setCorrectChars] = useState(0)
  const [wpmHistory, setWpmHistory] = useState<Array<{ time: number; wpm: number; accuracy: number; errors: number }>>([])

  const inputRef = useRef<HTMLInputElement>(null)
  const testAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    generateWords()
  }, [language, mode, wordCount])

  const generateWords = () => {
    const words = WORD_BANKS[language as keyof typeof WORD_BANKS]
    const count = mode === "time" ? 200 : wordCount
    const generated = Array.from({ length: count }, () => words[Math.floor(Math.random() * words.length)])
    setTestWords(generated)
  }

  const stateRef = useRef({ correctChars, timeLeft, timeElapsed, startTime, duration, mode, errors });

  useEffect(() => {
    stateRef.current = { correctChars, timeLeft, timeElapsed, startTime, duration, mode, errors };
  }, [correctChars, timeLeft, timeElapsed, startTime, duration, mode, errors]);

  useEffect(() => {
    if (!started || finished) return

    const interval = setInterval(() => {
      const current = stateRef.current;

      if (current.mode === "time") {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            finishTest()
            return 0
          }
          return prev - 1
        })
      } else {
        setTimeElapsed((prev) => prev + 1)
      }

      // Calculate WPM for history
      // Note: We need a reliable 'currentTime' for the graph.
      // If mode is time, current time is duration - (timeLeft - 1)
      // Because we just ticked.
      let currentTime = 0;
      if (current.mode === "time") {
        // usage of stateRef.current.timeLeft gives the value from LAST render, which is likely correct before the tick.
        currentTime = current.duration - current.timeLeft + 1;
      } else {
        currentTime = current.timeElapsed + 1;
      }

      const wpm = Math.round(current.correctChars / 5 / (currentTime / 60))

      const totalChars = current.correctChars + current.errors
      const accuracy = totalChars > 0 ? Math.round((current.correctChars / totalChars) * 100) : 100

      setWpmHistory((prev) => [
        ...prev,
        {
          time: currentTime,
          wpm: wpm > 0 ? wpm : 0,
          accuracy,
          errors: current.errors,
        }
      ])
    }, 1000)

    return () => clearInterval(interval)
  }, [started, finished]) // Removed dependencies that change frequently

  // Auto-focus logic
  useEffect(() => {
    inputRef.current?.focus()

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // If test is finished, allow normal navigation
      if (finished) return

      // Handle Tab restart globally
      if (e.key === "Tab") {
        e.preventDefault()
        resetTest()
        return
      }

      // Ignore if user is interacting with UI buttons or inputs (except our main input)
      if (document.activeElement?.tagName === "BUTTON" && e.key === "Enter") return
      if (document.activeElement === inputRef.current) return

      // Ignore modifier keys/shortcuts
      if (e.ctrlKey || e.metaKey || e.altKey) return

      // Focus input for typing
      inputRef.current?.focus()
    }

    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  }, [finished])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (finished) return

    if (!started) {
      setStarted(true)
      setStartTime(Date.now())
    }

    const value = e.target.value
    const currentWord = testWords[currentIndex]

    if (value.length < input.length) {
      setInput(value)
      setCurrentCharIndex(value.length)

      const lastChar = typedChars[typedChars.length - 1]
      if (lastChar?.correct) {
        setCorrectChars((prev) => Math.max(0, prev - 1))
      }

      setTypedChars((prev) => prev.slice(0, -1))
      return
    }

    if (value.endsWith(" ")) {
      const trimmedInput = value.trim()

      const currentWord = testWords[currentIndex]
      const correctInWord = trimmedInput.split("").filter((char, idx) => char === currentWord[idx]).length
      const isWordCorrect = trimmedInput === currentWord

      if (isWordCorrect) {
        setCorrectChars((prev) => prev + 1)
      } else {
        setErrors((prev) => prev + 1)
      }

      setAllTypedWords((prev) => ({ ...prev, [currentIndex]: typedChars }))

      if (mode === "words" && currentIndex + 1 >= wordCount) {
        finishTest()
        return
      }

      setInput("")
      setTypedChars([])
      setCurrentIndex((prev) => prev + 1)
      setCurrentCharIndex(0)

      return
    }

    const newChar = value[value.length - 1]
    const expectedChar = currentWord[currentCharIndex]

    const isCorrect = newChar === expectedChar

    setTypedChars((prev) => [...prev, { char: newChar, correct: isCorrect }])

    if (isCorrect) {
      setCorrectChars((prev) => prev + 1)
    } else {
      setErrors((prev) => prev + 1)
    }

    setInput(value)
    setCurrentCharIndex(value.length)

    if (mode === "words" && currentIndex === wordCount - 1 && value.length === currentWord.length) {
      setAllTypedWords((prev) => ({ ...prev, [currentIndex]: [...typedChars, { char: newChar, correct: isCorrect }] }))
      finishTest()
    }
  }

  const finishTest = () => {
    setFinished(true)
    setStarted(false)

    if (startTime) {
      const actualElapsed = Math.round((Date.now() - startTime) / 1000)
      setTimeElapsed(actualElapsed)
      // Removed synthetic wpmHistory generation
    }
  }

  const resetTest = () => {
    setInput("")
    setCurrentIndex(0)
    setCurrentCharIndex(0)
    setTypedChars([])
    setAllTypedWords({})
    setStarted(false)
    setFinished(false)
    setTimeLeft(duration)
    setStartTime(null)
    setTimeElapsed(0)
    setErrors(0)
    setCorrectChars(0)
    setWpmHistory([])
    generateWords()
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault()
      resetTest()
    }
  }

  const calculateWPM = () => {
    if (!started && !finished) return 0
    const time = finished
      ? mode === "time"
        ? duration
        : timeElapsed
      : mode === "time"
        ? duration - timeLeft
        : timeElapsed
    return time > 0 ? Math.round(correctChars / 5 / (time / 60)) : 0
  }

  const calculateAccuracy = () => {
    const totalChars = correctChars + errors
    return totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100
  }

  if (finished) {
    return (
      <TestResults
        wpm={calculateWPM()}
        accuracy={calculateAccuracy()}
        errors={errors}
        timeElapsed={mode === "time" ? duration : timeElapsed}
        wpmHistory={wpmHistory}
        onRestart={resetTest}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 font-mono">
      <div className="w-full max-w-5xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <div className="flex items-center justify-center gap-4 mb-2">
            <img src="/icon.png" alt="Logo" className="w-18 h-auto object-contain" />
            <h1 className="text-4xl font-bold text-foreground tracking-tight">Typing Gw</h1>
          </div>
          <p className="text-muted-foreground text-sm">Test your typing speed</p>
        </motion.div>

        <ConfigBar
          language={language}
          mode={mode}
          duration={duration}
          wordCount={wordCount}
          onLanguageChange={setLanguage}
          onModeChange={setMode}
          onDurationChange={setDuration}
          onWordCountChange={setWordCount}
          disabled={started}
        />

        <AnimatePresence mode="wait">
          {started && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-6 mb-8"
            >
              <div className="bg-card border border-border px-6 py-4 rounded-lg">
                <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-1">Time</span>
                <div className="text-2xl font-bold text-foreground">{mode === "time" ? timeLeft : timeElapsed}s</div>
              </div>
              <div className="bg-card border border-border px-6 py-4 rounded-lg">
                <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-1">Speed</span>
                <div className="text-2xl font-bold text-foreground">{calculateWPM()} WPM</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          ref={testAreaRef}
          className="relative mb-8 p-8 bg-card border border-border rounded-lg cursor-text hover:border-primary/50 transition-colors"
          onClick={() => inputRef.current?.focus()}
        >
          <div className="text-2xl leading-relaxed flex flex-wrap gap-x-3 gap-y-4">
            {testWords.slice(0, 50).map((word, wordIdx) => (
              <div key={wordIdx} className="inline-flex">
                {word.split("").map((char, charIdx) => {
                  const isCurrentWord = wordIdx === currentIndex
                  const isCurrentChar = isCurrentWord && charIdx === currentCharIndex
                  let typedCharData = null
                  if (isCurrentWord && charIdx < typedChars.length) {
                    typedCharData = typedChars[charIdx]
                  } else if (wordIdx < currentIndex && allTypedWords[wordIdx]) {
                    typedCharData = allTypedWords[wordIdx][charIdx]
                  }

                  let color = "text-muted-foreground/60"
                  if (typedCharData) {
                    color = typedCharData.correct ? "text-foreground" : "text-destructive"
                  }

                  return (
                    <span key={charIdx} className={`relative ${color} transition-colors duration-150`}>
                      {char}
                      {isCurrentChar && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                          className="absolute -left-0.5 top-0 w-0.5 h-full bg-primary rounded-sm"
                        />
                      )}
                    </span>
                  )
                })}
              </div>
            ))}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            className="absolute opacity-0 pointer-events-none"
            autoFocus
          />
        </div>

        <div className="flex justify-center">
          <button
            onClick={resetTest}
            className="group flex items-center gap-3 px-5 py-2.5 rounded-lg bg-card border border-border text-foreground hover:border-primary hover:bg-card/80 transition-all"
          >
            <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-sm font-medium">Restart Test</span>
            <kbd className="px-2 py-0.5 text-xs bg-muted/50 rounded border border-border">Tab</kbd>
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center text-muted-foreground text-sm"
        >
          <p>Press Tab to restart • Start typing to begin your test</p>
        </motion.div>
      </div>
    </div>
  )
}
