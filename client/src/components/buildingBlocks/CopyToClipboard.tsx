import { CopyOutlined } from "@ant-design/icons"
import { Button, message, Tooltip } from "antd"
import { type MouseEvent } from "react"

import { stringify } from "#utils/textFormatters"

import Flex from "#blocks/Flex"

interface DataProps {
  data: unknown | undefined
  dataGetter?: never
}
interface DataGetterProps {
  data?: never
  dataGetter: () => unknown | undefined
}

type CopyToClipboardProps = (DataProps | DataGetterProps) & {
  label?: string
  compact?: true
}

const CopyToClipboard = ({
  data,
  dataGetter,
  label,
  compact,
}: CopyToClipboardProps) => {
  const copyToClipboard = (e: MouseEvent) => {
    e.stopPropagation()
    let dataToCopy = data
    if (dataGetter) dataToCopy = dataGetter()

    navigator.clipboard
      .writeText(
        typeof dataToCopy === "string" ? dataToCopy : stringify(dataToCopy)
      )
      .then(() => {
        void message.success("Text copied to clipboard")
      })
      .catch(() => {
        void message.error("Failed to copy text")
      })
  }

  const defaultStyle = { borderRadius: 4, fontSize: 14 }
  const style = compact
    ? label
      ? { ...defaultStyle, fontSize: 10, padding: "0px 8px" }
      : { ...defaultStyle, fontSize: 10, width: 20, height: 20, padding: 2 }
    : defaultStyle

  return (
    <Tooltip title="Copy to clipboard">
      {label ? (
        <Button onClick={copyToClipboard} style={style}>
          <Flex center gap={6}>
            {label}
            <CopyOutlined />
          </Flex>
        </Button>
      ) : (
        <Button
          size="middle"
          icon={<CopyOutlined />}
          onClick={copyToClipboard}
          style={style}
        />
      )}
    </Tooltip>
  )
}

export default CopyToClipboard
