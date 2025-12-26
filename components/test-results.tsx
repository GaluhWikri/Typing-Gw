"use client"

import { motion } from "framer-motion"
import { RotateCcw, Clock, Target, TrendingUp, AlertCircle } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface TestResultsProps {
  wpm: number
  accuracy: number
  errors: number
  timeElapsed: number
  wpmHistory: Array<{ time: number; wpm: number; accuracy: number; errors: number }>
  onRestart: () => void
}

export function TestResults({ wpm, accuracy, errors, timeElapsed, wpmHistory, onRestart }: TestResultsProps) {
  const calculateConsistencyScore = (historySlice: number[]) => {
    if (historySlice.length < 2) return 100
    const mean = historySlice.reduce((a, b) => a + b, 0) / historySlice.length
    if (mean === 0) return 0
    const variance = historySlice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / historySlice.length
    const sd = Math.sqrt(variance)
    return Math.max(0, Math.round(100 - (sd / mean) * 100))
  }

  const consistency = calculateConsistencyScore(wpmHistory.map((h) => h.wpm))

  // Prepare chart data with rolling consistency
  const chartData = wpmHistory.map((point, index) => {
    const historyUpToNow = wpmHistory.slice(0, index + 1).map((h) => h.wpm);
    return {
      ...point,
      consistency: calculateConsistencyScore(historyUpToNow)
    }
  });

  return (

    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 font-mono">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-7xl">

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-12 items-center mb-12">

          {/* Left Column: Big Stats */}
          <div className="flex flex-col gap-12 justify-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col"
            >
              <span className="text-3xl font-bold text-muted-foreground/50 lowercase">wpm</span>
              <span className="text-9xl font-black text-primary leading-[0.8] tracking-tighter">
                {wpm}
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col"
            >
              <span className="text-3xl font-bold text-muted-foreground/50 lowercase">acc</span>
              <span className="text-9xl font-black text-primary leading-[0.8] tracking-tighter">
                {accuracy}%
              </span>
            </motion.div>
          </div>

          {/* Right Column: Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#a1a1aa" opacity={0.1} vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#a1a1aa"
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#a1a1aa"
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#a1a1aa"
                  domain={[0, 100]}
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ padding: 0 }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="wpm"
                  name="WPM"
                  stroke="#eab308"
                  strokeWidth={4}
                  dot={false}
                  activeDot={{ r: 6, fill: "#eab308" }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="accuracy"
                  name="Accuracy"
                  stroke="#eab308"
                  strokeWidth={3}
                  strokeDasharray="8 8"
                  dot={false}
                  activeDot={{ r: 6, fill: "#eab308" }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="consistency"
                  name="Consistency"
                  stroke="#a1a1aa"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: "#a1a1aa" }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="errors"
                  name="Errors"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: "#ef4444" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Bottom Stats & Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 px-4"
        >
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-sm uppercase tracking-wider">Consistency</span>
            <span className="text-3xl font-bold text-foreground">{consistency}%</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-sm uppercase tracking-wider">Errors</span>
            <span className="text-3xl font-bold text-destructive">{errors}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-sm uppercase tracking-wider">Time</span>
            <span className="text-3xl font-bold text-foreground">{timeElapsed}s</span>
          </div>
          {/* Placeholder for raw or other stats if needed */}
          <div className="flex flex-col gap-1 items-start">
            <button
              onClick={onRestart}
              className="group flex items-center gap-3 text-muted-foreground hover:text-foreground transition-all mt-1"
            >
              <div className="bg-primary/20 p-2 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              </div>
              <span className="font-medium">Restart</span>
              <kbd className="px-2 py-0.5 text-xs bg-muted rounded border border-border">Tab</kbd>
            </button>
          </div>
        </motion.div>

        {/* Footer info removed or minimized */}
      </motion.div>
    </div>
  )
}
