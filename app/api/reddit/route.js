import { redis } from '@/lib/redis'

export async function GET() {
  try {
    const cached = await redis.get('reddit-data')

    if (!cached) {
      return Response.json({ error: 'No data yet — cron has not run' }, { status: 503 })
    }

    const data = typeof cached === 'string' ? JSON.parse(cached) : cached

    return Response.json(data, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
