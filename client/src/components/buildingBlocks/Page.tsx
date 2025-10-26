import { ReactNode } from "react"

import AnimateInFlex, { ANIMATION_BY_KEY } from "#blocks/AnimateInFlex"

const Page = ({ children }: { children: ReactNode }) => {
  return (
    <AnimateInFlex
      animation={ANIMATION_BY_KEY.down}
      style={{
        width: "100vw",
        height: "calc(100vh - 46px)",
        justifyContent: "center",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 55% 23.33%, #fff 0%, #f7f5f3 100%)",
      }}
    >
      {children}
    </AnimateInFlex>
  )
}

export default Page
