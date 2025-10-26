import { Input } from "antd"
import { useEffect, useState } from "react"
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom"
import styled from "styled-components"

import { ROUTES } from "#constants/routes"
import ThemeContextProvider, {
  useThemeContext,
} from "#contexts/ThemeContextProvider"
import Home from "./Home"

const SPageContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  justify-content: flex-start;
  width: 100vw;
  height: 100vh;
  background-color: ${({ theme }) => theme.white};
  color: ${({ theme }) => theme.black};
  overflow-x: hidden;
`

const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === "true"

const BaseApp = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      // console.log("e.code => ", e.code)
      // console.log("e.ctrlKey => ", e.ctrlKey)
      const meta = e.getModifierState("Meta")
      if (e.code === "Slash" && meta) setIsSearchOpen(true)
    }
    document.addEventListener("keydown", listener)

    return () => {
      document.removeEventListener("keydown", listener)
    }
  }, [])

  const navigate = useNavigate()
  const location = useLocation()

  const theme = useThemeContext()

  return (
    <SPageContainer theme={theme}>
      {isSearchOpen && <Input.Search />}
      <Routes>
        <Route path={ROUTES.HOME} element={<Home />} />
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </SPageContainer>
  )
}

// Add all contexts here
const App = () => {
  return (
    <BrowserRouter>
      <ThemeContextProvider>
        <BaseApp />
      </ThemeContextProvider>
    </BrowserRouter>
  )
}

export default App
