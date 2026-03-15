'use client'

import { useEffect, useState, useRef } from 'react'
import './globals.css'

// ── Shared chart helper ──
function LineChart({ data, color, xFormat, chartW = 500, chartH = 160 }) {
  const pad = { top: 10, right: 20, bottom: 28, left: 50 }
  const plotW = chartW - pad.left - pad.right
  const plotH = chartH - pad.top - pad.bottom

  const values = data.map(d => d.value)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const yMin = Math.max(0, minVal - Math.ceil((maxVal - minVal) * 0.1 || 10))
  const yMax = maxVal + Math.ceil((maxVal - minVal) * 0.1 || 10)
  const yRange = yMax - yMin || 1
  const gradId = `grad-${Math.random().toString(36).slice(2, 8)}`

  const points = data.map((d, i) => ({
    x: pad.left + (i / Math.max(data.length - 1, 1)) * plotW,
    y: pad.top + plotH - ((d.value - yMin) / yRange) * plotH,
  }))
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = linePath + ` L${points[points.length - 1]?.x},${pad.top + plotH} L${points[0]?.x},${pad.top + plotH} Z`

  const yTicks = Array.from({ length: 5 }, (_, i) => ({
    val: Math.round(yMin + (yRange * i) / 4),
    y: pad.top + plotH - (i / 4) * plotH,
  }))

  const xLabelCount = Math.min(5, data.length)
  const xLabels = Array.from({ length: xLabelCount }, (_, i) => {
    const idx = Math.round((i / (xLabelCount - 1)) * (data.length - 1))
    const d = data[idx]
    if (!d) return null
    return { x: pad.left + (idx / Math.max(data.length - 1, 1)) * plotW, label: xFormat(d) }
  }).filter(Boolean)

  return (
    <svg viewBox={`0 0 ${chartW} ${chartH}`} className="chart">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map((tick, i) => (
        <g key={i}>
          <line x1={pad.left} y1={tick.y} x2={pad.left + plotW} y2={tick.y} className="grid-line" />
          <text x={pad.left - 8} y={tick.y + 4} className="tick-label" textAnchor="end">{tick.val.toLocaleString()}</text>
        </g>
      ))}
      <path d={areaPath} fill={`url(#${gradId})`} opacity="0.3" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.length > 0 && (
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={4} fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      )}
      {xLabels.map((xl, i) => (
        <text key={i} x={xl.x} y={pad.top + plotH + 18} className="tick-label" textAnchor="middle">{xl.label}</text>
      ))}
    </svg>
  )
}

// ── LeetCode WebSocket hook ──
const PROBLEMS = [
  { slug: 'two-sum', label: 'Two Sum', color: '#00b8a3' },
  { slug: 'longest-substring-without-repeating-characters', label: 'Longest Substring Without Repeating Characters', color: '#ffa116' },
]

function useLeetCodeWS(slug) {
  const [count, setCount] = useState(null)
  const [status, setStatus] = useState('connecting')
  const [lastUpdate, setLastUpdate] = useState(null)
  const [history, setHistory] = useState([])
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)

  useEffect(() => {
    function connect() {
      setStatus('connecting')
      const ws = new WebSocket(`wss://collaboration-ws.leetcode.com/problems/${slug}`)
      wsRef.current = ws
      ws.onopen = () => setStatus('connected')
      ws.onmessage = (event) => {
        const num = parseInt(event.data, 10)
        if (!isNaN(num)) {
          setCount(num)
          setLastUpdate(new Date())
          setHistory(prev => [...prev, { time: new Date(), value: num }].slice(-60))
        }
      }
      ws.onclose = () => { setStatus('disconnected'); reconnectTimer.current = setTimeout(connect, 3000) }
      ws.onerror = () => ws.close()
    }
    connect()
    return () => { wsRef.current?.close(); clearTimeout(reconnectTimer.current) }
  }, [slug])

  return { count, status, lastUpdate, history }
}

function LeetCodeCard({ slug, label, color }) {
  const { count, status, lastUpdate, history } = useLeetCodeWS(slug)

  return (
    <div className="card">
      <div className="card-header" style={{ color }}>{label}</div>
      <div className="count-wrapper">
        <div className="count" style={{ color: status === 'disconnected' ? '#ef4743' : color }}>
          {count !== null ? count.toLocaleString() : '—'}
        </div>
        <div className="label">people online right now</div>
      </div>
      {history.length > 1 && (
        <div className="chart-wrapper">
          <LineChart data={history} color={color} xFormat={d => d.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} />
        </div>
      )}
      <div className="status">
        <span className="dot" style={{ background: status === 'disconnected' ? '#ef4743' : color, boxShadow: status === 'connected' ? `0 0 6px ${color}` : 'none', animation: status !== 'disconnected' ? 'pulse 2s infinite' : 'none' }} />
        {status === 'connected' && lastUpdate && <>Live — updated {lastUpdate.toLocaleTimeString()}</>}
        {status === 'connecting' && <>Connecting...</>}
        {status === 'disconnected' && <>Reconnecting...</>}
      </div>
    </div>
  )
}

// ── Google Trends card ──
function GoogleTrendsCard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchTrends() {
      try {
        const res = await fetch('/api/trends')
        if (!res.ok) throw new Error(`${res.status}`)
        setData(await res.json())
      } catch (e) { setError(e.message) }
    }
    fetchTrends()
    const interval = setInterval(fetchTrends, 3600000) // refresh hourly
    return () => clearInterval(interval)
  }, [])

  const color = '#4285f4'

  return (
    <div className="card">
      <div className="card-header" style={{ color }}>Google Trends: "layoff"</div>
      {error && <div className="card-error">Failed to load trends data</div>}
      {data && (
        <>
          <div className="count-wrapper">
            <div className="count" style={{ color }}>{data.current ?? '—'}</div>
            <div className="label">search interest (0–100)</div>
          </div>
          <div className="stats-row">
            <div className="stat">
              <div className="stat-value">{data.peak}</div>
              <div className="stat-label">3mo peak</div>
            </div>
            <div className="stat">
              <div className="stat-value">{data.average}</div>
              <div className="stat-label">3mo avg</div>
            </div>
          </div>
          {data.timeline?.length > 1 && (
            <div className="chart-wrapper">
              <LineChart
                data={data.timeline}
                color={color}
                xFormat={d => d.date?.split(', ')?.[0] || d.date}
              />
            </div>
          )}
          <div className="status">
            <span className="dot" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
            US region — last 3 months
          </div>
        </>
      )}
      {!data && !error && <div className="card-loading">Loading trends...</div>}
    </div>
  )
}

// ── Reddit cards ──
function SubredditCard({ sub, color }) {
  return (
    <div className="card">
      <div className="card-header" style={{ color }}>{sub.name}</div>
      <div className="count-wrapper">
        <div className="count" style={{ color }}>{sub.subscribers?.toLocaleString() ?? '—'}</div>
        <div className="label">subscribers</div>
      </div>
      <div className="stats-row">
        <div className="stat">
          <div className="stat-value" style={{ color }}>{sub.activeUsers?.toLocaleString()}</div>
          <div className="stat-label">online now</div>
        </div>
        <div className="stat">
          <div className="stat-value">{sub.postsLast24h}</div>
          <div className="stat-label">posts / 24h</div>
        </div>
        <div className="stat">
          <div className="stat-value">{sub.postsLastWeek}</div>
          <div className="stat-label">posts / 7d</div>
        </div>
      </div>
      {sub.dailyPosts?.length > 1 && (
        <div className="chart-wrapper">
          <LineChart
            data={sub.dailyPosts}
            color={color}
            xFormat={d => d.date?.slice(5)} // MM-DD
          />
        </div>
      )}
      {sub.recentPosts?.length > 0 && (
        <div className="recent-posts">
          <div className="recent-posts-title">Latest posts</div>
          {sub.recentPosts.map((post, i) => (
            <a key={i} href={post.url} target="_blank" rel="noopener noreferrer" className="recent-post">
              <span className="post-title">{post.title}</span>
              <span className="post-meta">{post.score} pts · {post.comments} comments</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

const SUBREDDIT_COLORS = {
  'r/layoffs': '#ff4500',
  'r/recruitinghell': '#ff6b35',
  'r/overemployed': '#ff9f1c',
}

function RedditSection() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchReddit() {
      try {
        const res = await fetch('/api/reddit')
        if (!res.ok) throw new Error(`${res.status}`)
        setData(await res.json())
      } catch (e) { setError(e.message) }
    }
    fetchReddit()
    const interval = setInterval(fetchReddit, 300000)
    return () => clearInterval(interval)
  }, [])

  if (error) return <div className="card"><div className="card-error">Failed to load Reddit data</div></div>
  if (!data) return <div className="card"><div className="card-loading">Loading Reddit data...</div></div>

  return (
    <>
      {data.subreddits.map(sub => (
        <SubredditCard key={sub.name} sub={sub} color={SUBREDDIT_COLORS[sub.name] || '#ff4500'} />
      ))}
      <div className="status-footer">
        <span className="dot" style={{ background: '#ff4500', boxShadow: '0 0 6px #ff4500' }} />
        Refreshes every 5 min
      </div>
    </>
  )
}

// ── Main page ──
export default function Home() {
  return (
    <div className="container">
      <h1 className="page-title">Layoff Trend Index</h1>
      <p className="page-subtitle">Multi-signal dashboard tracking layoff trend in real time</p>

      <section className="section">
        <h2 className="section-title">LeetCode Index</h2>
        <div className="cards">
          {PROBLEMS.map(p => <LeetCodeCard key={p.slug} {...p} />)}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Google Trends</h2>
        <div className="cards">
          <GoogleTrendsCard />
        </div>
      </section>

      {/* Reddit section disabled — Reddit blocks cloud IPs
      <section className="section">
        <h2 className="section-title">Reddit Pulse</h2>
        <div className="cards">
          <RedditSection />
        </div>
      </section>
      */}

      <article className="seo-content">
        <h2>About the Layoff Trend Index</h2>
        <p>
          This dashboard combines multiple real-time signals to track layoff activity across the tech industry.
          By monitoring LeetCode interview prep activity, Google search trends for "layoff", and Reddit community engagement,
          you get a multi-dimensional view of the job market's health.
        </p>

        <div className="faq">
          <details>
            <summary>How does the LeetCode index indicate layoffs?</summary>
            <p>
              When layoffs increase, more engineers start preparing for interviews, driving up active users
              on popular LeetCode problems like Two Sum. Spikes in LeetCode activity often correlate with
              major layoff announcements from big tech companies.
            </p>
          </details>

          <details>
            <summary>What does the Google Trends score mean?</summary>
            <p>
              Google Trends scores range from 0 to 100, representing search interest relative to the peak
              in the selected time period. A score of 100 means peak popularity, 50 means half as popular.
              Rising "layoff" searches often precede or coincide with major layoff waves.
            </p>
          </details>

          <details>
            <summary>Why track r/layoffs?</summary>
            <p>
              Reddit's r/layoffs subreddit is where affected workers share real-time reports of layoffs
              before they hit the news. Spikes in subscriber growth and post activity are leading indicators
              of layoff waves in the tech industry and beyond.
            </p>
          </details>

          <details>
            <summary>How often does the data update?</summary>
            <p>
              LeetCode counters update every 10 seconds via WebSocket. Google Trends data refreshes hourly.
              Reddit data refreshes every 5 minutes. All data is fetched live — nothing is pre-recorded.
            </p>
          </details>
        </div>
      </article>
    </div>
  )
}
