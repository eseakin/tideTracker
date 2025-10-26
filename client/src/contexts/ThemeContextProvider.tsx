import { createContext, type ReactNode, useContext } from "react"

export type Hexcode = string

export interface ThemeContextType {
  mainColor: Hexcode
  activeColor: Hexcode
  backgroundColor: Hexcode
  accentColor: Hexcode
  secondaryColor: Hexcode
  highlightColor: Hexcode
  altColor: Hexcode

  white: Hexcode
  black: Hexcode
  disabled: Hexcode
  border: Hexcode

  success: Hexcode
  warning: Hexcode
  error: Hexcode

  gray: {
    1: Hexcode
    2: Hexcode
    3: Hexcode
    4: Hexcode
    5: Hexcode
    6: Hexcode
    7: Hexcode
    8: Hexcode
  }
}

const defaultValue: ThemeContextType = {
  mainColor: "#EDAF68", // Header color
  activeColor: "#d68b36",
  backgroundColor: "#FFDFB5",
  accentColor: "#35CE8D",
  secondaryColor: "#35CE8D",
  highlightColor: "#FFE8CB",
  altColor: "#3F84E5",

  white: "#fefefc", // Slightly warm white
  black: "#141400", // Slightly warm black
  disabled: "#CCC",
  border: "#BBBBBB33",

  success: "#1D8921",
  warning: "#D1A236",
  error: "#D44040",

  gray: {
    1: "#F2F2F2",
    2: "#E2E2E2",
    3: "#D2D2D2",
    4: "#C2C2C2",
    5: "#B2B2B2",
    6: "#A2A2A2",
    7: "#929292",
    8: "#828282",
  },
}

export const ThemeContext = createContext<ThemeContextType>(defaultValue)

const ThemeContextProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeContext.Provider value={defaultValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useThemeContext = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error(
      "useThemeContext must be used within a ThemeContextProvider"
    )
  }
  return context
}

export default ThemeContextProvider
