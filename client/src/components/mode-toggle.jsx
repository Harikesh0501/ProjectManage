import { Moon, Sun } from "lucide-react"
import { Button } from "./ui/button"
import { useEffect, useState } from "react"

export function ModeToggle() {
    const [theme, setTheme] = useState(() => {
        // Check localStorage or system preference on initial load
        if (typeof window !== "undefined") {
            return localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        }
        return "dark"
    })

    useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")
        root.classList.add(theme)
        localStorage.setItem("theme", theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark")
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full w-10 h-10 border transition-all dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-900 dark:text-white"
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-slate-300" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}
