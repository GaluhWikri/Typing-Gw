"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { flushSync } from "react-dom"

import { cn } from "@/lib/utils"

export function AnimatedThemeToggler({
    className,
    ...props
}: React.HTMLAttributes<HTMLButtonElement>) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const toggleTheme = async (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!mounted) return

        // @ts-ignore - View Transition API is not yet in all types
        if (!document.startViewTransition) {
            setTheme(theme === "dark" ? "light" : "dark")
            return
        }

        const { clientX: x, clientY: y } = e
        const endRadius = Math.hypot(
            Math.max(x, innerWidth - x),
            Math.max(y, innerHeight - y)
        )

        // @ts-ignore
        const transition = document.startViewTransition(async () => {
            // Force synchronous update if possible, though next-themes might be async internally.
            // Ideally we wrap the state update in flushSync
            flushSync(() => {
                setTheme(theme === "dark" ? "light" : "dark")
            })
        })

        await transition.ready

        const clipPath = [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
        ]

        document.documentElement.animate(
            {
                clipPath: clipPath,
            },
            {
                duration: 500,
                easing: "ease-in-out",
                pseudoElement: "::view-transition-new(root)",
            }
        )
    }

    if (!mounted) {
        return <div className={cn("size-8", className)} />
    }

    return (
        <button
            className={cn(
                "group relative inline-flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted",
                className
            )}
            onClick={toggleTheme}
            {...props}
        >
            <AnimatePresence mode="wait" initial={false}>
                {theme === "dark" ? (
                    <motion.div
                        key="dark"
                        initial={{ scale: 0, rotate: 90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}
                        className="absolute"
                    >
                        <Moon className="size-5" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="light"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: -90 }}
                        transition={{ duration: 0.2 }}
                        className="absolute"
                    >
                        <Sun className="size-5" />
                    </motion.div>
                )}
            </AnimatePresence>
            <span className="sr-only">Toggle theme</span>
        </button>
    )
}
