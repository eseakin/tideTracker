import { type CSSProperties, type ReactNode } from "react"

import Flex from "#blocks/Flex"
import { useThemeContext } from "#contexts/ThemeContextProvider"

const Card = ({
  children,
  style,
  className,
}: {
  children: ReactNode
  style?: CSSProperties
  className?: string
}) => {
  const { border, white } = useThemeContext()

  return (
    <Flex
      col
      style={{
        width: 350,
        borderRadius: 12,
        boxShadow: `0px 1px 2px 1px ${border}`,
        border: `1px solid ${border}`,
        padding: "30px 24px",
        background: white,
        ...style,
      }}
      className={className}
    >
      {children}
    </Flex>
  )
}

export default Card
