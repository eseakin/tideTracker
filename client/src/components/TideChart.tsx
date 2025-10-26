// TideChart.tsx
import { Extreme, Point } from "#customTypes/dataTypes"
import {
  interpAt,
  parseExtremes,
  upsampleExtremesToSeries,
} from "#utils/dataHelpers"
import * as d3 from "d3"
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

  const PAD = 24
  const BOTTOM_PAD = 60

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
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1.5"
              />
            </g>
          )
        })}

        {/* Tide area */}
        <path d={path} fill="url(#water)" opacity="0.95" />

        {/* Ripple overlay clipped to area */}
        <g style={{ mixBlendMode: "screen" }}>
          <path d={path} fill="url(#ripples)" mask="url(#softFade)" />
        </g>

        {/* Optional H/L markers (when extremes provided) - only low tides */}
        {showMarkers &&
          significantExtremes.filter((e) => e.type === "L").length > 0 &&
          significantExtremes
            .filter((e) => e.type === "L")
            .map((e) => (
              <g key={e.t}>
                <circle cx={x(new Date(e.t))} cy={y(e.h)} r="3" fill="#fff" />
                <text
                  x={x(new Date(e.t))}
                  y={y(e.h) + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="rgba(255,255,255,0.85)"
                >
                  {Math.round(e.h * 10) / 10}′
                </text>
              </g>
            ))}

        {/* Time labels - only on low tides */}
        {significantExtremes
          .filter((e) => e.type === "L")
          .map((e, i) => {
            const date = new Date(e.t)
            const xPos = x(date)
            const hours = date.getHours()
            const minutes = date.getMinutes()
            const timeStr =
              hours === 0 && minutes === 0
                ? "12 AM"
                : hours === 12 && minutes === 0
                  ? "12 PM"
                  : hours === 0
                    ? `12:${minutes.toString().padStart(2, "0")} AM`
                    : hours < 12
                      ? `${hours}:${minutes.toString().padStart(2, "0")} AM`
                      : hours === 12
                        ? `12:${minutes.toString().padStart(2, "0")} PM`
                        : `${hours - 12}:${minutes.toString().padStart(2, "0")} PM`

            return (
              <g key={`low-tide-time-${i}`}>
                <text
                  x={xPos}
                  y={dimensions.height - BOTTOM_PAD + 20}
                  textAnchor="middle"
                  fontSize="10"
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

          return (
            <g key={`date-label-${i}`}>
              <text
                x={xPos}
                y={dimensions.height - BOTTOM_PAD + 35}
                textAnchor="middle"
                fontSize="11"
                fontWeight="bold"
                fill="rgba(255,255,255,0.9)"
              >
                {dayName}
              </text>
              <text
                x={xPos}
                y={dimensions.height - BOTTOM_PAD + 48}
                textAnchor="middle"
                fontSize="10"
                fill="rgba(255,255,255,0.7)"
              >
                {monthDay}
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
