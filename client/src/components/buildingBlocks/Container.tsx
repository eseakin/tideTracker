import { type ReactChild } from "#customTypes/globalTypes"

const style = {
  display: `flex`,
  flex: `1 1 auto`,
  justifyContent: `center`,
  width: `100%`,
  margin: `20px 10px`,
  // border: `1px solid red`, // FIX ME
}

interface ContainerProps {
  children: ReactChild
}

export const Container = (props: ContainerProps) => (
  <div style={style}>{props.children}</div>
)
