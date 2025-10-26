import { App, Button } from "antd"
import dayjs from "dayjs"

import Flex from "#blocks/Flex"
import { STANDARD_DATE_TIME_FORMAT } from "#utils/dateHelpers"
import { ErrorType, formatError, formatErrorArray } from "#utils/textFormatters"

type OpenErrorModal = (
  error: ErrorType | ErrorType[] | null | undefined,
  context: string
) => void

// Accepts a string to describe the action that caused the error (used in title)
export const useErrorModal = (action: string): OpenErrorModal => {
  const { modal, message } = App.useApp()

  const openErrorModal = (
    error: ErrorType | ErrorType[] | null | undefined,
    context: string
  ) => {
    if (
      !error ||
      (Array.isArray(error) && error.length === 0)
    ) {
      return
    }
    const content = Array.isArray(error)
      ? formatErrorArray(error)
      : formatError(error)

    // Enhance context with user information
    const enhancedContext = `${context}
    ${dayjs().format(STANDARD_DATE_TIME_FORMAT)}`

    console.log("❌ ERROR: ", error)
    const modalInstance = modal.error({
      title: `Error while ${action}`,
      content: (
        <Flex
          style={{
            whiteSpace: "pre-wrap",
            margin: "12px 0 24px",
          }}
        >
          {content}
        </Flex>
      ),
      footer: [
        <Flex style={{ justifyContent: "flex-end" }} gap={12}>
          <Button
            key="ok"
            type="primary"
            onClick={() => modalInstance.destroy()}
          >
            Ok
          </Button>
        </Flex>,
      ],
      maskClosable: true, // Allow clicking outside to close
    })
  }

  return openErrorModal
}

export default useErrorModal
