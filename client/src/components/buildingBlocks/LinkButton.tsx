import { Button, type ButtonProps } from "antd"

const LinkButton = ({ children, style, ...props }: ButtonProps) => {
  return (
    <Button
      type="link"
      style={{
        display: "inline-block",
        width: "auto",
        textAlign: "left",
        padding: "4px 0px",
        height: "auto",
        fontSize: "inherit",
        ...style,
      }}
      {...props}
    >
      {children}
    </Button>
  )
}

export default LinkButton
