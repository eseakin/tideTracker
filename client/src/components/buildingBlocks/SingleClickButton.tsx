import { Button, ButtonProps } from "antd"
import { ReactNode, useState } from "react"

const SingleClickButton = ({
  onClick,
  children,
  delay = 500,
  ...props
}: {
  onClick: (e?: React.MouseEvent<HTMLElement>) => void
  children: ReactNode
  delay?: number
} & ButtonProps) => {
  const [isClicked, setIsClicked] = useState(false)

  return (
    <Button
      onClick={(e) => {
        if (isClicked) return

        setIsClicked(true)
        onClick(e)
        setTimeout(() => {
          setIsClicked(false)
        }, delay)
      }}
      {...props}
      loading={isClicked}
    >
      {children}
    </Button>
  )
}

export default SingleClickButton
