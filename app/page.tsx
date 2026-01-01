"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RotateCcw } from "lucide-react"
import { TestResults } from "@/components/test-results"
import { ConfigBar } from "@/components/config-bar"
import { WORD_BANKS } from "@/lib/word-banks"
import { ModeToggle } from "@/components/mode-toggle"
import { KeyboardVisualizer } from "@/components/keyboard-visualizer"

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

  // Visual Keyboard State
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set())
  const [capsLock, setCapsLock] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const testAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Reset test when settings change
    generateWords()
    setTimeLeft(duration)
    setStarted(false)
    setFinished(false)
    setStartTime(null)
    setTimeElapsed(0)
    setErrors(0)
    setCorrectChars(0)
    setCurrentIndex(0)
    setCurrentCharIndex(0)
    setInput("")
    setTypedChars([])
    setAllTypedWords({})
    setWpmHistory([])
    if (inputRef.current) inputRef.current.focus()
  }, [language, mode, wordCount, duration])

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
      let currentTime = 0;
      if (current.mode === "time") {
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
  }, [started, finished])

  // Auto-focus logic & Keyboard Visuals
  useEffect(() => {
    inputRef.current?.focus()

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Visual feedback updates (always run)
      setActiveKeys((prev) => {
        const newSet = new Set(prev)
        newSet.add(e.code)
        return newSet
      })
      if (e.code === "CapsLock" && !e.repeat) {
        setCapsLock(e.getModifierState("CapsLock"))
      }

      // If test is finished, allow normal navigation but keep visuals
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

      // Ignore modifier keys/shortcuts for focusing
      if (e.ctrlKey || e.metaKey || e.altKey) return

      // Focus input for typing
      inputRef.current?.focus()
    }

    const handleGlobalKeyUp = (e: KeyboardEvent) => {
      setActiveKeys((prev) => {
        const newSet = new Set(prev)
        newSet.delete(e.code)
        return newSet
      })
      if (e.code === "CapsLock") {
        setCapsLock(e.getModifierState("CapsLock"))
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown)
    window.addEventListener("keyup", handleGlobalKeyUp)
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown)
      window.removeEventListener("keyup", handleGlobalKeyUp)
    }
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

  // Auto-scroll logic - scroll immediately when moving to new line
  useEffect(() => {
    if (!testAreaRef.current) return

    // Find the currently active character or word element
    const activeElement = testAreaRef.current.querySelector('.active-char') ||
      testAreaRef.current.querySelector('.bg-primary') // fallback to cursor

    if (activeElement) {
      const container = testAreaRef.current.firstElementChild as HTMLElement
      const containerRect = container.getBoundingClientRect()
      const elementRect = activeElement.getBoundingClientRect()

      // Calculate relative position of element inside container
      const relativeTop = elementRect.top - containerRect.top + container.scrollTop
      const containerHeight = container.clientHeight
      const elementVisualPos = elementRect.top - containerRect.top

      // Scroll immediately when element moves beyond first line (more aggressive)
      // This ensures new line is visible as soon as you finish previous line
      if (elementVisualPos > containerHeight * 0.35) {
        container.scrollTo({
          top: relativeTop - 40, // Keep minimal padding at top
          behavior: 'smooth'
        })
      }
    }
  }, [currentIndex, currentCharIndex])

  return (
    <>
      {finished ? (
        <TestResults
          wpm={calculateWPM()}
          accuracy={calculateAccuracy()}
          errors={errors}
          timeElapsed={mode === "time" ? duration : timeElapsed}
          wpmHistory={wpmHistory}
          onRestart={resetTest}
        />
      ) : (
        <div className="h-screen max-h-screen bg-background flex flex-col items-center p-4 font-mono relative overflow-hidden">
          <div className="absolute top-4 right-4 z-50">
            <ModeToggle />
          </div>

          <div className="w-full max-w-5xl flex flex-col h-full">
            {/* Header - Compact */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mt-2 mb-3 text-center shrink-0">
              <div className="flex items-center justify-center gap-3 mb-1">
                <img src="/icon1.png" alt="Logo" className="w-8 h-auto object-contain dark:hidden" />
                <img src="/icon.png" alt="Logo" className="w-8 h-auto object-contain hidden dark:block" />
                <h1 className="text-xl font-bold text-foreground tracking-tight">Typing Gw</h1>
              </div>
              <p className="text-muted-foreground text-[10px] uppercase tracking-widest">Test your typing speed</p>
            </motion.div>

            {/* Config Bar */}
            <div className="shrink-0 z-20 mb-1 scale-90 origin-top">
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
            </div>

            {/* Stats - Compact */}
            <div className="shrink-0 flex flex-col items-center gap-4 mb-3 z-20">
              <div className="flex items-center gap-12">
                <div className="flex flex-col items-start min-w-[60px]">
                  <div className="text-3xl font-bold text-primary tabular-nums leading-none mb-1">
                    {mode === "time" ? timeLeft : timeElapsed}s
                  </div>
                  <span className="text-muted-foreground/60 text-[10px] font-bold tracking-widest uppercase">Time</span>
                </div>
                <div className="w-px h-8 bg-border/50"></div>
                <div className="flex flex-col items-start min-w-[60px]">
                  <div className="text-3xl font-bold text-primary tabular-nums leading-none mb-1">
                    {calculateWPM()}
                  </div>
                  <span className="text-muted-foreground/60 text-[10px] font-bold tracking-widest uppercase">WPM</span>
                </div>
              </div>
            </div>

            {/* Restart Button - Moved above typing area */}
            <div className="flex justify-center shrink-0 mb-2 z-30">
              <button
                onClick={resetTest}
                className="group flex items-center gap-2 px-4 py-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-secondary/50 border border-border/50 text-foreground transition-all"
              >
                <RotateCcw className="w-3 h-3 group-hover:-rotate-180 transition-transform duration-500" />
                <span className="text-[10px] font-medium uppercase tracking-wide">Restart</span>
                <kbd className="hidden sm:inline-flex h-4 select-none items-center gap-1 rounded bg-muted/50 border border-border/50 px-1 font-mono text-[9px] font-medium opacity-50">TAB</kbd>
              </button>
            </div>

            {/* Typing Area with Auto-Scroll */}
            <div
              ref={testAreaRef}
              className="relative w-full max-w-4xl mx-auto mb-4 p-6 bg-transparent rounded-xl cursor-text h-[200px] flex items-start justify-center overflow-hidden focus-within:outline-none shrink-0"
              onClick={() => inputRef.current?.focus()}
            >
              {/* Scrollable text container with hidden scrollbar and bottom padding for keyboard clearance */}
              <div className="absolute inset-0 p-6 pb-32 overflow-y-auto flex content-start flex-wrap gap-x-3 gap-y-3 font-mono text-2xl leading-relaxed tracking-wide select-none transition-opacity duration-200 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {testWords.slice(0, 100).map((word, wordIdx) => {
                  const isCurrentWord = wordIdx === currentIndex
                  return (
                    <div key={wordIdx} className="inline-flex relative">
                      {word.split("").map((char, charIdx) => {
                        const isCurrentChar = isCurrentWord && charIdx === currentCharIndex
                        let typedCharData = null
                        if (isCurrentWord && charIdx < typedChars.length) {
                          typedCharData = typedChars[charIdx]
                        } else if (wordIdx < currentIndex && allTypedWords[wordIdx]) {
                          typedCharData = allTypedWords[wordIdx][charIdx]
                        }

                        let color = "text-muted-foreground/50"
                        let className = `relative transition-colors duration-75 px-px `

                        if (typedCharData) {
                          color = typedCharData.correct ? "text-foreground" : "text-destructive"
                        } else if (isCurrentWord && charIdx === currentCharIndex) {
                          color = "text-primary shadow-sm active-char"
                        }

                        return (
                          <span key={charIdx} className={`${className} ${color}`}>
                            {char}
                            {isCurrentChar && (
                              <motion.span
                                layoutId="cursor"
                                transition={{ type: "spring", stiffness: 600, damping: 40 }}
                                className="absolute -left-1 top-0 bottom-0 w-[3px] bg-primary rounded-full shadow-[0_0_8px_rgba(234,179,8,0.5)]"
                              />
                            )}
                          </span>
                        )
                      })}
                      {/* Visual Cursor for Space/Next Word */}
                      {isCurrentWord && currentCharIndex === word.length && (
                        <span className="relative active-char">
                          &nbsp;
                          <motion.span
                            layoutId="cursor"
                            transition={{ type: "spring", stiffness: 600, damping: 40 }}
                            className="absolute -left-1 top-0 bottom-0 w-[3px] bg-primary rounded-full shadow-[0_0_8px_rgba(234,179,8,0.5)]"
                          />
                        </span>
                      )}
                    </div>
                  )
                })}
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

            {/* 3D Keyboard - Anchored to bottom with proper spacing */}
            <div className="flex-1 w-full mt-auto relative min-h-[280px] max-h-[450px]">
              <div className="absolute inset-0 w-full pointer-events-none">
                <KeyboardVisualizer activeKeys={activeKeys} capsLock={capsLock} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
