"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

// Norway time-aware theme detection
export function useNorwayTimeAwareTheme() {
  const [isDarkMode, setIsDarkMode] = React.useState(false)
  const [isAutoMode, setIsAutoMode] = React.useState(true)

  React.useEffect(() => {
    // Get Norway time (UTC+1, UTC+2 in summer)
    const now = new Date()
    const norwayTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Oslo" }))
    const hour = norwayTime.getHours()
    
    // Auto mode: Dark from 18:00 (6 PM) to 06:00 (6 AM)
    if (isAutoMode) {
      const shouldBeDark = hour >= 18 || hour < 6
      setIsDarkMode(shouldBeDark)
    }
  }, [isAutoMode])

  const toggleTheme = () => {
    setIsAutoMode(false)
    setIsDarkMode(!isDarkMode)
  }

  const setAutoMode = () => {
    setIsAutoMode(true)
  }

  return {
    isDarkMode,
    isAutoMode,
    toggleTheme,
    setAutoMode,
  }
}
