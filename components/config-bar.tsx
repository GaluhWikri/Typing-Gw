"use client"

import { motion } from "framer-motion"

type Language = "english" | "indonesian"
type Mode = "time" | "words"

interface ConfigBarProps {
  language: Language
  mode: Mode
  duration: number
  wordCount: number
  onLanguageChange: (lang: Language) => void
  onModeChange: (mode: Mode) => void
  onDurationChange: (duration: number) => void
  onWordCountChange: (count: number) => void
  disabled: boolean
}

export function ConfigBar({
  language,
  mode,
  duration,
  wordCount,
  onLanguageChange,
  onModeChange,
  onDurationChange,
  onWordCountChange,
  disabled,
}: ConfigBarProps) {
  const buttonClass = (isActive: boolean) => `
    px-4 py-2 rounded-lg text-sm font-medium transition-all
    ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}
    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
  `

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 flex flex-wrap items-center justify-center gap-4 bg-card border border-border rounded-lg p-4"
    >
      {/* Language */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => !disabled && onLanguageChange("english")}
          disabled={disabled}
          className={buttonClass(language === "english")}
        >
          English
        </button>
        <button
          onClick={() => !disabled && onLanguageChange("indonesian")}
          disabled={disabled}
          className={buttonClass(language === "indonesian")}
        >
          Indonesia
        </button>
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-border" />

      {/* Mode */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => !disabled && onModeChange("time")}
          disabled={disabled}
          className={buttonClass(mode === "time")}
        >
          Time
        </button>
        <button
          onClick={() => !disabled && onModeChange("words")}
          disabled={disabled}
          className={buttonClass(mode === "words")}
        >
          Words
        </button>
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-border" />

      {/* Duration/Count */}
      {mode === "time" ? (
        <div className="flex items-center gap-2">
          {[15, 30, 60].map((d) => (
            <button
              key={d}
              onClick={() => !disabled && onDurationChange(d)}
              disabled={disabled}
              className={buttonClass(duration === d)}
            >
              {d}s
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {[
            { value: 15, label: "Short" },
            { value: 30, label: "Medium" },
            { value: 60, label: "Long" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => !disabled && onWordCountChange(option.value)}
              disabled={disabled}
              className={buttonClass(wordCount === option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
