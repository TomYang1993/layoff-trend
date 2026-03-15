import { redis } from '@/lib/redis'

const SUBREDDITS = ['layoffs', 'recruitinghell', 'overemployed']
const CRON_SECRET = process.env.CRON_SECRET

async function fetchAllPosts(name, headers, maxPages = 10) {
  let posts = []
  let after = null

  for (let i = 0; i < maxPages; i++) {
    const url = `https://www.reddit.com/r/${name}/new.json?limit=100${after ? `&after=${after}` : ''}`
    const res = await fetch(url, { headers, cache: 'no-store' })
    if (!res.ok) break

    const data = await res.json()
    const children = data.data?.children || []
    if (children.length === 0) break

    posts = posts.concat(children)
    after = data.data?.after
    if (!after) break

    // Small delay between pages to be nice to Reddit
    await new Promise(r => setTimeout(r, 500))
  }

  return posts
}

async function fetchSubreddit(name, headers) {
  const [aboutRes, posts] = await Promise.all([
    fetch(`https://www.reddit.com/r/${name}/about.json`, { headers, cache: 'no-store' }),
    fetchAllPosts(name, headers),
  ])

  if (!aboutRes.ok) return null

  const aboutData = await aboutRes.json()
  const sub = aboutData.data

  const now = Math.floor(Date.now() / 1000)
  const oneDayAgo = now - 86400
  const oneWeekAgo = now - 604800
  const postsLast24h = posts.filter(p => p.data.created_utc > oneDayAgo).length
  const postsLastWeek = posts.filter(p => p.data.created_utc > oneWeekAgo).length

  const dayBuckets = {}
  posts.forEach(p => {
    const date = new Date(p.data.created_utc * 1000)
    const key = date.toISOString().slice(0, 10)
    dayBuckets[key] = (dayBuckets[key] || 0) + 1
  })

  const sortedDays = Object.keys(dayBuckets).sort()
  const dailyPosts = []
  if (sortedDays.length > 0) {
    const start = new Date(sortedDays[0])
    const end = new Date(sortedDays[sortedDays.length - 1])
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10)
      dailyPosts.push({ date: key, value: dayBuckets[key] || 0 })
    }
  }

  return {
    name: `r/${name}`,
    subscribers: sub.subscribers,
    activeUsers: sub.accounts_active,
    postsLast24h,
    postsLastWeek,
    totalFetched: posts.length,
    dailyPosts,
    recentPosts: posts.slice(0, 3).map(p => ({
      title: p.data.title,
      score: p.data.score,
      comments: p.data.num_comments,
      created: p.data.created_utc,
      url: `https://reddit.com${p.data.permalink}`,
    })),
  }
}

export async function GET(request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const headers = { 'User-Agent': 'layoff-trend-tracker/1.0' }

    const subreddits = []
    for (const name of SUBREDDITS) {
      const result = await fetchSubreddit(name, headers)
      if (result) subreddits.push(result)
      // Delay between subreddits
      await new Promise(r => setTimeout(r, 1000))
    }

    const payload = {
      subreddits,
      fetchedAt: new Date().toISOString(),
    }

    // Store in Redis with 1 hour TTL (cron runs every 30 min so always fresh)
    await redis.set('reddit-data', JSON.stringify(payload), { ex: 3600 })

    return Response.json({ ok: true, subreddits: subreddits.length, fetchedAt: payload.fetchedAt })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
