// app/context/ThemeContext.tsx
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

// Define available themes
export type ThemeType = 'blue' | 'green' | 'purple' | 'orange' | 'pink'

type ThemeContextType = {
  theme: ThemeType
  setTheme: (theme: ThemeType) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'blue',
  setTheme: () => null,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Try to get saved theme from localStorage, default to 'blue'
  const [theme, setTheme] = useState<ThemeType>('blue')
  
  // Update the theme and save to localStorage
  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-theme', newTheme)
    }
  }
  
  // Load saved theme on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('dashboard-theme') as ThemeType
      if (savedTheme && ['blue', 'green', 'purple', 'orange', 'pink'].includes(savedTheme)) {
        setTheme(savedTheme)
      }
    }
  }, [])
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleThemeChange }}>
      <div className={`theme-${theme}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

// Custom hook to use the theme
export const useTheme = () => useContext(ThemeContext)
