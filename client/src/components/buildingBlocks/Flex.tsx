import { forwardRef, type ReactEventHandler, type ReactNode } from "react"

import { type Obj } from "#customTypes/globalTypes"

interface FlexProps {
  children?: ReactNode
  onClick?: ReactEventHandler
  center?: boolean
  top?: boolean
  grow?: boolean
  col?: boolean
  style?: Obj
  className?: string
  gap?: number
}

const Flex = forwardRef<HTMLDivElement, FlexProps>(
  (
    { children, onClick, center, top, grow, style, col, className, gap },
    ref
  ) => {
    const innerStyle: Obj = {
      display: "flex",
    }

    if (gap) {
      innerStyle.gap = gap
    }

    if (center) {
      innerStyle.alignItems = "center"
      innerStyle.justifyContent = "center"
    }

    if (top) {
      innerStyle.alignItems = "start"
      innerStyle.justifyContent = "center"
    }

    if (grow) {
      innerStyle.flexGrow = 1
    }

    if (col) {
      innerStyle.flexDirection = "column"
    }

    const finalStyle = {
      ...innerStyle,
      ...style,
    }

    return (
      <div ref={ref} style={finalStyle} className={className} onClick={onClick}>
        {children}
      </div>
    )
  }
)

Flex.displayName = "Flex"

export default Flex
