'use client'

import { useEffect, useState, useRef } from 'react'
import './globals.css'

const WS_URL = 'wss://collaboration-ws.leetcode.com/problems/two-sum'

export default function Home() {
  const [count, setCount] = useState(null)
  const [status, setStatus] = useState('connecting') // connecting | connected | disconnected
  const [lastUpdate, setLastUpdate] = useState(null)
  const [history, setHistory] = useState([]) // [{time: Date, value: number}]
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)

  useEffect(() => {
    function connect() {
      setStatus('connecting')
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        setStatus('connected')
      }

      ws.onmessage = (event) => {
        const num = parseInt(event.data, 10)
        if (!isNaN(num)) {
          setCount(num)
          setLastUpdate(new Date())
          setHistory(prev => {
            const next = [...prev, { time: new Date(), value: num }]
            return next.slice(-60) // keep last 60 data points
          })
        }
      }

      ws.onclose = () => {
        setStatus('disconnected')
        // reconnect after 3 seconds
        reconnectTimer.current = setTimeout(connect, 3000)
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      if (wsRef.current) wsRef.current.close()
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    }
  }, [])

  // Chart dimensions
  const chartW = 560
  const chartH = 200
  const pad = { top: 10, right: 20, bottom: 30, left: 50 }
  const plotW = chartW - pad.left - pad.right
  const plotH = chartH - pad.top - pad.bottom

  const values = history.map(h => h.value)
  const minVal = values.length ? Math.min(...values) : 0
  const maxVal = values.length ? Math.max(...values) : 1
  const yMin = Math.max(0, minVal - Math.ceil((maxVal - minVal) * 0.1 || 10))
  const yMax = maxVal + Math.ceil((maxVal - minVal) * 0.1 || 10)
  const yRange = yMax - yMin || 1

  // Build SVG line path
  const points = history.map((h, i) => {
    const x = pad.left + (i / Math.max(history.length - 1, 1)) * plotW
    const y = pad.top + plotH - ((h.value - yMin) / yRange) * plotH
    return { x, y }
  })
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = linePath + ` L${points[points.length - 1]?.x},${pad.top + plotH} L${points[0]?.x},${pad.top + plotH} Z`

  // Y-axis ticks (5 ticks)
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = yMin + (yRange * i) / 4
    return { val: Math.round(val), y: pad.top + plotH - (i / 4) * plotH }
  })

  // X-axis labels (show ~5 time labels)
  const xLabelCount = Math.min(5, history.length)
  const xLabels = Array.from({ length: xLabelCount }, (_, i) => {
    const idx = Math.round((i / (xLabelCount - 1)) * (history.length - 1))
    const h = history[idx]
    if (!h) return null
    const x = pad.left + (idx / Math.max(history.length - 1, 1)) * plotW
    const t = h.time
    const label = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    return { x, label }
  }).filter(Boolean)

  return (
    <div className="container">
      <div className="title">LeetCode Live</div>
      <div className="problem-name">1. Two Sum</div>

      <div className="count-wrapper">
        <div className={`count ${status}`}>
          {count !== null ? count.toLocaleString() : '—'}
        </div>
        <div className="label">people online right now</div>
      </div>

      {history.length > 1 && (
        <div className="chart-wrapper">
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="chart">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00b8a3" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#00b8a3" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Grid lines & Y ticks */}
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line x1={pad.left} y1={tick.y} x2={pad.left + plotW} y2={tick.y} className="grid-line" />
                <text x={pad.left - 8} y={tick.y + 4} className="tick-label" textAnchor="end">
                  {tick.val.toLocaleString()}
                </text>
              </g>
            ))}

            {/* Area fill */}
            <path d={areaPath} className="chart-area" />

            {/* Line */}
            <path d={linePath} className="chart-line" />

            {/* Current point */}
            {points.length > 0 && (
              <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={4} className="chart-dot" />
            )}

            {/* X-axis labels */}
            {xLabels.map((xl, i) => (
              <text key={i} x={xl.x} y={pad.top + plotH + 20} className="tick-label" textAnchor="middle">
                {xl.label}
              </text>
            ))}

          </svg>
        </div>
      )}

      <div className="status">
        <span className={`dot ${status}`} />
        {status === 'connected' && lastUpdate && (
          <>Live — updated {lastUpdate.toLocaleTimeString()}</>
        )}
        {status === 'connecting' && <>Connecting...</>}
        {status === 'disconnected' && <>Disconnected — reconnecting...</>}
      </div>

      <article className="seo-content">
        <h1>LeetCode Two Sum Live Online Counter</h1>
        <p>
          Track how many people are solving <strong>LeetCode Two Sum</strong> (Problem #1) in real time.
          This page connects directly to LeetCode's WebSocket server and displays the live count of
          concurrent users, updated every 10 seconds.
        </p>

        <div className="faq">
          <details>
            <summary>How many people solve Two Sum every day?</summary>
            <p>
              Two Sum is the most attempted problem on LeetCode with millions of total submissions.
              At any given moment, hundreds to thousands of developers are actively working on it —
              from first-time coders to engineers preparing for interviews at Google, Meta, Amazon, and other top tech companies.
            </p>
          </details>

          <details>
            <summary>What is the Two Sum problem?</summary>
            <p>
              Given an array of integers <code>nums</code> and an integer <code>target</code>,
              return the indices of two numbers that add up to the target.
              The optimal solution uses a hash map for O(n) time complexity.
              It's the classic introduction to data structures and algorithm thinking.
            </p>
          </details>

          <details>
            <summary>Why track live online count?</summary>
            <p>
              Seeing real-time activity gives you a sense of the global coding community.
              Whether it's peak hours in the US, interview season, or a weekend grind session,
              the live counter shows the pulse of competitive programming worldwide.
            </p>
          </details>

          <details>
            <summary>How does this live counter work?</summary>
            <p>
              This page connects directly to LeetCode's collaboration WebSocket server,
              which broadcasts the number of active users on each problem page.
              The count updates approximately every 10 seconds with auto-reconnect on connection loss.
            </p>
          </details>
        </div>
      </article>
    </div>
  )
}
