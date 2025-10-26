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

  const { path, xNow, yNow, y, x, hMin, hMax } = useMemo(() => {
    const PAD = 24
    const W = dimensions.width
    const H = dimensions.height

    const hMin = d3.min(series, (d) => d.h)!
    const hMax = d3.max(series, (d) => d.h)!

    const x = d3
      .scaleTime()
      .domain(d3.extent(series, (d) => new Date(d.t)) as [Date, Date])
      .range([PAD, W - PAD])

    const y = d3
      .scaleLinear()
      .domain([hMin - 0.5, hMax + 0.5])
      .nice()
      .range([H - PAD, PAD])

    const area = d3
      .area<Point>()
      .x((d) => x(new Date(d.t)))
      .y0(H - PAD)
      .y1((d) => y(d.h))
      .curve(d3.curveCatmullRom.alpha(0.5))

    const path = area(series)!

    const now = Date.now()
    const hNow = interpAt(now, series)
    const xNow = x(new Date(now))
    const yNow = y(hNow)

    return { path, xNow, yNow, y, x, hMin, hMax }
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

        {/* Tide area */}
        <path d={path} fill="url(#water)" opacity="0.95" />

        {/* Ripple overlay clipped to area */}
        <g style={{ mixBlendMode: "screen" }}>
          <path d={path} fill="url(#ripples)" mask="url(#softFade)" />
        </g>

        {/* Optional H/L markers (when extremes provided) */}
        {showMarkers &&
          extremesParsed.length > 0 &&
          extremesParsed.map((e) => (
            <g key={e.t}>
              <circle cx={x(new Date(e.t))} cy={y(e.h)} r="3" fill="#fff" />
              <text
                x={x(new Date(e.t))}
                y={y(e.h) - 8}
                textAnchor="middle"
                fontSize="10"
                fill="rgba(255,255,255,0.85)"
              >
                {e.type}
                {Math.round(e.h * 10) / 10}′
              </text>
            </g>
          ))}

        {/* Now marker */}
        {Number.isFinite(xNow) && Number.isFinite(yNow) && (
          <>
            <line
              x1={xNow}
              x2={xNow}
              y1={16}
              y2={dimensions.height - 16}
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
