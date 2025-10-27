// TideChart.tsx
import { Extreme, Point } from "#customTypes/dataTypes"
import {
  interpAt,
  parseExtremes,
  upsampleExtremesToSeries,
} from "#utils/dataHelpers"
import * as d3 from "d3"
import dayjs from "dayjs"
import React, { useEffect, useMemo, useRef, useState } from "react"

type Props = {
  // Provide ONE of these:
  extremes?: Extreme[]

  // Options
  stepMin?: number // upsample interval (if using extremes)
  showMarkers?: boolean
  width?: number
  height?: number
}

const TideChart: React.FC<Props> = ({
  extremes,
  stepMin = 10,
  showMarkers = true,
  width: propWidth,
  height: propHeight,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const markerRefs = useRef<Map<number, SVGGElement>>(new Map())
  const timeLabelRefs = useRef<Map<number, SVGGElement>>(new Map())
  const dayLabelRefs = useRef<Map<number, SVGGElement>>(new Map())
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 })

  useEffect(() => {
    if (propWidth && propHeight) {
      setDimensions({ width: propWidth, height: propHeight })
      return
    }

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setDimensions({ width, height: height || 400 })
      }
    }

    updateDimensions()
    const resizeObserver = new ResizeObserver(updateDimensions)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [propWidth, propHeight])

  // Build the plotted series
  const { series, extremesParsed } = useMemo(() => {
    const ex = parseExtremes(extremes ?? [])
    const ser =
      ex.length >= 2
        ? upsampleExtremesToSeries(ex, stepMin)
        : ex.map(({ t, h }) => ({ t, h }))
    return { series: ser, extremesParsed: ex }
  }, [extremes, stepMin])

  const PAD = 0
  const BOTTOM_PAD = 30

  // Max height (feet) to consider a low tide for labeling/markers
  const LOW_TIDE_MAX_FT = 1.5

  // Filter extremes to only show significant ones (more than 1 foot from neighbors)
  const significantExtremes = useMemo(() => {
    if (extremesParsed.length === 0) return []

    return extremesParsed.filter((extreme, i) => {
      if (i === 0 || i === extremesParsed.length - 1) return true // Always show first and last

      const prev = extremesParsed[i - 1]
      const next = extremesParsed[i + 1]

      const diffFromPrev = Math.abs(extreme.h - prev.h)
      const diffFromNext = Math.abs(extreme.h - next.h)

      return diffFromPrev > 1 || diffFromNext > 1
    })
  }, [extremesParsed])

  // Only lows at or below threshold
  const filteredLowExtremes = useMemo(() => {
    return significantExtremes.filter(
      (e) => e.type === "L" && e.h <= LOW_TIDE_MAX_FT
    )
  }, [significantExtremes])

  // Lowest daytime (9am-6pm) low tide height among filtered lows
  const lowestDaytimeLow = useMemo(() => {
    const lows = filteredLowExtremes.filter((e) => {
      const d = new Date(e.t)
      const hours = d.getHours()
      const minutes = d.getMinutes()
      const hourOfDay = hours + minutes / 60
      return hourOfDay >= 9 && hourOfDay < 18
    })
    return lows.length ? Math.min(...lows.map((e) => e.h)) : Infinity
  }, [filteredLowExtremes])

  const { path, xNow, yNow, y, x, hMin, hMax, dayTicks } = useMemo(() => {
    const W = dimensions.width
    const H = dimensions.height

    const hMin = d3.min(series, (d) => d.h)!
    const hMax = d3.max(series, (d) => d.h)!

    const domain = d3.extent(series, (d) => new Date(d.t)) as [Date, Date]
    const x = d3
      .scaleTime()
      .domain(domain)
      .range([PAD, W - PAD])

    const y = d3
      .scaleLinear()
      .domain([hMin - 0.5, hMax + 0.5])
      .nice()
      .range([H - BOTTOM_PAD, PAD])

    const area = d3
      .area<Point>()
      .x((d) => x(new Date(d.t)))
      .y0(H - BOTTOM_PAD)
      .y1((d) => y(d.h))
      .curve(d3.curveCatmullRom.alpha(0.5))

    const path = area(series)!

    const now = Date.now()
    const hNow = interpAt(now, series)
    const xNow = x(new Date(now))
    const yNow = y(hNow)

    // Generate day ticks (for bold marks)
    const dayTicks = d3
      .scaleTime()
      .domain(domain)
      .range([PAD, W - PAD])
      .ticks(d3.timeDay)

    return { path, xNow, yNow, y, x, hMin, hMax, dayTicks }
  }, [series, dimensions.width, dimensions.height])

  // Animate path changes
  useEffect(() => {
    if (pathRef.current && series.length > 0) {
      const node = d3.select(pathRef.current)
      // Store initial path
      const currentPath = node.attr("d")

      // Only animate if we have a prior path to transition from
      if (currentPath) {
        node.transition().duration(800).ease(d3.easeExpInOut).attr("d", path!)
      } else {
        // First render, just set it
        node.attr("d", path!)
      }
    }
  }, [path])

  // Animate markers
  useEffect(() => {
    const currentIds = new Set(filteredLowExtremes.map((e) => e.t))

    // Fade out markers that are no longer in data
    markerRefs.current.forEach((node, id) => {
      if (!currentIds.has(id)) {
        d3.select(node).transition().duration(300).style("opacity", 0).remove()
      }
    })

    // Fade in new markers
    filteredLowExtremes.forEach((e) => {
      const node = markerRefs.current.get(e.t)
      if (node) {
        d3.select(node).transition().duration(800).style("opacity", 1)
      }
    })
  }, [filteredLowExtremes])

  // Animate time labels
  useEffect(() => {
    const currentIds = new Set(filteredLowExtremes.map((e) => e.t))

    // Slide out and fade labels that are no longer in data
    timeLabelRefs.current.forEach((node, id) => {
      if (!currentIds.has(id)) {
        const xPos = d3.select(node).attr("x")
        d3.select(node)
          .transition()
          .duration(300)
          .style("opacity", 0)
          .attr("x", parseFloat(xPos) - 100)
          .remove()
      }
    })

    // Slide in new labels
    filteredLowExtremes.forEach((e) => {
      const node = timeLabelRefs.current.get(e.t)
      if (node) {
        const xPos = d3.select(node).attr("x")
        d3.select(node)
          .attr("x", parseFloat(xPos) + 100)
          .transition()
          .duration(800)
          .style("opacity", 1)
          .attr("x", xPos)
      }
    })
  }, [filteredLowExtremes])

  // Animate day labels
  useEffect(() => {
    const currentIds = new Set(dayTicks.map((d) => d.getTime()))

    // Slide out and fade labels that are no longer in data
    dayLabelRefs.current.forEach((node, id) => {
      if (!currentIds.has(id)) {
        const yPos = d3.select(node).select("text").attr("y")
        d3.select(node)
          .transition()
          .duration(300)
          .style("opacity", 0)
          .attr("transform", `translate(-100, 0)`)
          .remove()
      }
    })

    // Slide in new labels
    dayTicks.forEach((d, i) => {
      const node = dayLabelRefs.current.get(d.getTime())
      if (node) {
        d3.select(node)
          .attr("transform", "translate(100, 0)")
          .transition()
          .duration(800)
          .style("opacity", 1)
          .attr("transform", "translate(0, 0)")
      }
    })
  }, [dayTicks])

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", minHeight: dimensions.height }}
    >
      <svg
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        width="100%"
        height="100%"
        role="img"
        aria-label="Tide height over time"
      >
        {/* Background */}
        <rect x="0" y="0" width="100%" height="100%" fill="#0a2540" />

        {/* Water gradient + effects */}
        <defs>
          <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2e8bc0" />
            <stop offset="100%" stopColor="#126e99" />
          </linearGradient>

          <pattern
            id="ripples"
            patternUnits="userSpaceOnUse"
            width="120"
            height="20"
          >
            <path
              d="M0,10 Q30,0 60,10 T120,10"
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="2"
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                from="0 0"
                to="120 0"
                dur="6s"
                repeatCount="indefinite"
              />
            </path>
          </pattern>

          <mask id="softFade">
            <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" />
              <stop offset="100%" stopColor="black" />
            </linearGradient>
            <rect width="100%" height="100%" fill="url(#fade)" />
          </mask>
        </defs>

        {/* Day boundary lines (bold) */}
        {dayTicks.map((date: Date, i: number) => {
          const xPos = x(date)
          return (
            <g key={`day-${i}`}>
              <line
                x1={xPos}
                y1={PAD}
                x2={xPos}
                y2={dimensions.height - BOTTOM_PAD}
                stroke="#3aa0ff"
                strokeOpacity="0.7"
                strokeWidth="1.5"
              />
            </g>
          )
        })}

        {/* Tide area */}
        <path ref={pathRef} fill="url(#water)" opacity="0.95" />

        {/* Ripple overlay clipped to area */}
        <g style={{ mixBlendMode: "screen" }}>
          <path d={path} fill="url(#ripples)" mask="url(#softFade)" />
        </g>

        {/* Optional H/L markers (when extremes provided) - only low tides */}
        {showMarkers &&
          filteredLowExtremes.length > 0 &&
          filteredLowExtremes.map((e) => {
            const date = new Date(e.t)
            const hours = date.getHours()
            const minutes = date.getMinutes()
            const hourOfDay = hours + minutes / 60
            const isDaytime = hourOfDay >= 9 && hourOfDay < 18
            const isTopCandidate =
              isDaytime &&
              Number.isFinite(lowestDaytimeLow) &&
              Math.abs(e.h - lowestDaytimeLow) <= 8 / 12

            return (
              <g
                key={e.t}
                ref={(el) => {
                  if (el) markerRefs.current.set(e.t, el)
                }}
                style={{ opacity: 0 }}
              >
                {isTopCandidate && (
                  <circle
                    cx={x(date)}
                    cy={y(e.h)}
                    r="12"
                    fill="rgba(255, 215, 0, 0.35)"
                    stroke="rgba(255, 215, 0, 0.95)"
                    strokeWidth="2.5"
                  />
                )}
                {!isTopCandidate && isDaytime && (
                  <circle
                    cx={x(date)}
                    cy={y(e.h)}
                    r="8"
                    fill="rgba(255, 215, 0, 0.3)"
                    stroke="rgba(255, 215, 0, 0.6)"
                    strokeWidth="1.5"
                  />
                )}
                <circle
                  cx={x(date)}
                  cy={y(e.h)}
                  r={isTopCandidate ? "6" : isDaytime ? "4" : "3"}
                  fill={
                    isTopCandidate
                      ? "#ffd700"
                      : isDaytime
                        ? "#ffd700"
                        : "rgba(255,255,255,0.5)"
                  }
                />
                <text
                  x={x(date)}
                  y={y(e.h) + (isDaytime ? 25 : 20)}
                  textAnchor="middle"
                  fontSize="13"
                  fill={
                    isTopCandidate
                      ? "#ffd700"
                      : isDaytime
                        ? "#ffd700"
                        : "rgba(255,255,255,0.5)"
                  }
                  fontWeight={isTopCandidate || isDaytime ? "bold" : "normal"}
                >
                  {Math.round(e.h * 10) / 10}′
                </text>
              </g>
            )
          })}

        {/* Time labels - only on low tides */}
        {filteredLowExtremes.map((e, i) => {
          const date = new Date(e.t)
          const xPos = x(date)
          const timeStr = dayjs(date).format("h:mm A")

          return (
            <g
              key={`low-tide-time-${i}`}
              ref={(el) => {
                if (el) timeLabelRefs.current.set(e.t, el)
              }}
              style={{ opacity: 0 }}
            >
              <text
                x={xPos}
                y={dimensions.height - BOTTOM_PAD + 20}
                textAnchor="middle"
                fontSize="14"
                fill="rgba(255,255,255,0.75)"
              >
                {timeStr}
              </text>
            </g>
          )
        })}

        {/* Date labels (once per day) */}
        {dayTicks.map((date: Date, i: number) => {
          const xPos = x(date)
          const dayName = date.toLocaleDateString("en-US", { weekday: "short" })
          const monthDay = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })

          const label = `${dayName} ${monthDay}`

          return (
            <g
              key={`date-label-${i}`}
              ref={(el) => {
                if (el) dayLabelRefs.current.set(date.getTime(), el)
              }}
              style={{ opacity: 0 }}
            >
              <text
                x={xPos + 3}
                y={PAD}
                transform={`rotate(180 ${xPos + 3}, ${PAD})`}
                textAnchor="end"
                dominantBaseline="hanging"
                fontSize="36"
                fontWeight="bold"
                fill="rgba(58,160,255,0.25)"
                style={{ writingMode: "vertical-rl" }}
              >
                {label}
              </text>
            </g>
          )
        })}

        {/* Now marker */}
        {Number.isFinite(xNow) && Number.isFinite(yNow) && (
          <>
            <line
              x1={xNow}
              x2={xNow}
              y1={16}
              y2={dimensions.height - BOTTOM_PAD}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="3"
              strokeDasharray="4 6"
            />
            <circle cx={xNow} cy={yNow} r="4" fill="#fff" />
          </>
        )}
      </svg>
    </div>
  )
}

export default TideChart
