import { Tooltip } from "antd"
import { useEffect, useMemo, useRef, useState } from "react"
import styled from "styled-components"

import FormattedTextBlock from "#blocks/FormattedTextBlock"

// Grow to fill the container. No need to set a width.
const SSpan = styled.span<{ isOverrun: boolean }>`
  display: flex;
  flex-grow: 1;
  flex-wrap: nowrap;
  white-space: nowrap;
  max-width: fit-content;
  min-width: 0; // THIS IS NEEDED TO MAKE FLEX WIDTH GO BELOW CONTENT WIDTH

  &:hover {
    text-decoration: ${(props) => (props.isOverrun ? "underline" : "none")};
  }
`

const ELLIPSIS = "…"

const TextOverrun = ({ text = "" }: { text: string | undefined }) => {
  const [displayText, setDisplayText] = useState(text)
  const [isOverrun, setIsOverrun] = useState(false)
  const [spanElement, setSpanElement] = useState<HTMLSpanElement | null>(null)
  const [isCalculated, setIsCalculated] = useState(false)

  // Ensure displayText is updated when text prop changes
  useEffect(() => {
    setDisplayText(text || "")
    setIsCalculated(false) // Reset calculation state when text changes
  }, [text])
  const [containerWidth, setContainerWidth] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  // Set up ResizeObserver when span element changes
  useEffect(() => {
    if (!spanElement) return

    // Create observer if it doesn't exist
    if (!resizeObserverRef.current) {
      resizeObserverRef.current = new ResizeObserver((entries) => {
        const width = entries[0].contentRect.width
        setContainerWidth(width)
      })
    }

    // Observe the parent element instead of the span itself
    const parentElement = spanElement.parentElement
    if (parentElement) {
      resizeObserverRef.current.observe(parentElement)
    }

    return () => {
      if (resizeObserverRef.current && parentElement) {
        resizeObserverRef.current.unobserve(parentElement)
      }
    }
  }, [spanElement])

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
        resizeObserverRef.current = null
      }
    }
  }, [])

  // Measure and truncate text when text or container width changes
  useEffect(() => {
    if (!spanElement || containerWidth === 0) return

    // Create canvas if it doesn't exist
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas")
    }
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    if (!context) return

    // Get computed styles from the actual span element
    const style = window.getComputedStyle(spanElement)
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`

    const fullTextWidth = context.measureText(text || "").width

    // Using fit-content matches exactly but seems to be off by 1px
    const textOverruns = fullTextWidth > containerWidth + 1

    if (textOverruns) {
      // Calculate the width of the ellipsis first
      const ellipsisWidth = context.measureText(` ${ELLIPSIS}`).width
      const availableWidth = containerWidth - ellipsisWidth

      let left = 0
      let right = (text || "").length
      let result = ""

      // Binary search to find the longest text that fits within available width
      while (left <= right) {
        const mid = Math.floor((left + right) / 2)
        const testText = (text || "").slice(0, mid)
        const testTextWidth = context.measureText(testText).width

        if (testTextWidth <= availableWidth) {
          result = testText
          left = mid + 1
        } else {
          right = mid - 1
        }
      }

      setDisplayText(`${result} ${ELLIPSIS}`)
      setIsOverrun(true)
    } else {
      setDisplayText(text || "")
      setIsOverrun(false)
    }

    setIsCalculated(true)
  }, [text, containerWidth, spanElement])

  const Content = useMemo(
    () => (
      <SSpan ref={setSpanElement} isOverrun={isOverrun}>
        {displayText}
      </SSpan>
    ),
    [displayText, isOverrun]
  )

  // Don't render anything until calculation is complete
  if (!isCalculated) {
    return (
      <SSpan
        ref={setSpanElement}
        isOverrun={false}
        style={{ visibility: "hidden" }}
      >
        {text}
      </SSpan>
    )
  }

  if (isOverrun) {
    return (
      <Tooltip title={<FormattedTextBlock text={text} />}>{Content}</Tooltip>
    )
  }

  return Content
}

export default TextOverrun
