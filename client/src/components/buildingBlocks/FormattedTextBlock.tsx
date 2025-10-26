const FormattedTextBlock = ({
  text,
  style,
}: {
  text: string
  style?: React.CSSProperties
}) => {
  return (
    <pre
      style={{
        borderRadius: 4,
        padding: "10px 15px",
        whiteSpace: "pre-wrap",
        wordWrap: "break-word",
        margin: 0,
        overflow: "auto",
        fontFamily: "inherit",
        ...style,
      }}
    >
      {text}
    </pre>
  )
}

export default FormattedTextBlock
