import { Tooltip } from "antd"

import CopyToClipboard from "#blocks/CopyToClipboard"
import { stringify } from "#utils/textFormatters"

const DataDebugger = ({
  data,
  logString,
}: {
  data: unknown
  logString?: string
}) => {
  if (logString) {
    console.log(`✅🔥 DataDebugger ${logString} => `, data)
  }

  return (
    <div style={{ position: "relative", margin: "10px 0" }}>
      <pre
        style={{
          backgroundColor: "#333",
          borderRadius: 4,
          color: "#eee",
          padding: "10px 15px",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
          margin: 0,
          maxHeight: "80vh",
          overflow: "auto",
        }}
      >
        {typeof data === "string" ? data : stringify(data)}
      </pre>
      <Tooltip title="Copy to clipboard">
        <div
          style={{ position: "absolute", top: 5, right: 8, borderRadius: 4 }}
        >
          <CopyToClipboard data={data} />
        </div>
      </Tooltip>
    </div>
  )
}

export default DataDebugger
