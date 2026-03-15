import { redis } from '@/lib/redis'

const SUBREDDITS = ['layoffs', 'recruitinghell', 'overemployed']
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const headers = { 'User-Agent': 'layoff-trend-tracker/1.0' }

    // Just fetch /about.json for each subreddit — 3 lightweight calls
    const results = await Promise.all(
      SUBREDDITS.map(async name => {
        const res = await fetch(`https://www.reddit.com/r/${name}/about.json`, { headers, cache: 'no-store' })
        if (!res.ok) return null
        const data = await res.json()
        return {
          name: `r/${name}`,
          subscribers: data.data.subscribers,
          activeUsers: data.data.accounts_active,
        }
      })
    )

    const liveStats = results.filter(Boolean)

    // Merge into existing cached data (keep charts/posts from heavy cron)
    const existing = await redis.get('reddit-data')
    if (existing) {
      const data = typeof existing === 'string' ? JSON.parse(existing) : existing
      data.subreddits = data.subreddits.map(sub => {
        const live = liveStats.find(l => l.name === sub.name)
        if (live) {
          sub.subscribers = live.subscribers
          sub.activeUsers = live.activeUsers
        }
        return sub
      })
      data.liveUpdatedAt = new Date().toISOString()
      await redis.set('reddit-data', JSON.stringify(data), { ex: 3600 })
    }

    return Response.json({ ok: true, stats: liveStats, updatedAt: new Date().toISOString() })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
