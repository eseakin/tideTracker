import { ReactNode } from "react"

import AnimateInFlex, { ANIMATION_BY_KEY } from "#blocks/AnimateInFlex"

const Page = ({ children }: { children: ReactNode }) => {
  return (
    <AnimateInFlex
      animation={ANIMATION_BY_KEY.down}
      style={{
        width: "100vw",
        height: "100vh",
        justifyContent: "center",
        minHeight: "100vh",
        overflow: "auto",
        background: "#0a2540",
      }}
    >
      {children}
    </AnimateInFlex>
  )
}

export default Page
