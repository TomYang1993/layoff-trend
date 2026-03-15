import { redis } from '@/lib/redis'
import googleTrends from 'google-trends-api'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await googleTrends.interestOverTime({
      keyword: 'layoff',
      geo: 'US',
      startTime: new Date(Date.now() - 90 * 24 * 3600 * 1000),
    })

    const data = JSON.parse(result)
    const timeline = data.default?.timelineData || []

    const points = timeline.map(point => ({
      date: point.formattedTime,
      value: point.value[0],
      timestamp: parseInt(point.time) * 1000,
      isPartial: point.isPartial || false,
    }))

    const current = points.length > 0 ? points[points.length - 1].value : null
    const peak = Math.max(...points.map(p => p.value))
    const avg = points.length > 0
      ? Math.round(points.reduce((s, p) => s + p.value, 0) / points.length)
      : null

    const payload = {
      keyword: 'layoff',
      region: 'US',
      period: '3 months',
      current,
      peak,
      average: avg,
      timeline: points,
      fetchedAt: new Date().toISOString(),
    }

    await redis.set('trends-data', JSON.stringify(payload), { ex: 7200 })

    return Response.json({ ok: true, points: points.length, fetchedAt: payload.fetchedAt })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
