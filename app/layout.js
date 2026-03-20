import { Analytics } from '@vercel/analytics/next'

export const metadata = {
  metadataBase: new URL('https://layoff-trend.vercel.app'),
  title: 'Layoff Trend Index | Real-Time Tech Layoff Prediction',
  description: 'Multi-signal dashboard tracking layoff activity across the tech industry in real time. Combines LeetCode interview prep activity and Google Trends data.',
  keywords: ['layoff trend', 'tech layoffs', 'layoff tracker', 'leetcode activity', 'job market', 'layoff dashboard', 'real-time layoff data', 'tech industry layoffs'],
  openGraph: {
    title: 'Layoff Trend Index — Real-Time Tech Layoff Prediction',
    description: 'Track layoff activity across the tech industry with live LeetCode interview prep signals and Google Trends data.',
    type: 'website',
    siteName: 'Layoff Trend Index',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Layoff Trend Index — Real-Time Tech Layoff Prediction',
    description: 'Multi-signal dashboard tracking tech layoffs in real time via LeetCode activity and Google Trends.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Layoff Trend Index',
              description: 'Multi-signal dashboard tracking layoff activity across the tech industry in real time. Combines LeetCode interview prep activity and Google Trends data.',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
              featureList: [
                'Real-time LeetCode interview prep activity tracking',
                'Google Trends "layoff" search interest monitoring',
                'Live WebSocket updates every 10 seconds',
                'Multi-signal layoff trend analysis',
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'How does LeetCode activity indicate layoffs?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'When layoffs increase, more engineers start preparing for interviews, driving up active users on popular LeetCode problems like Two Sum. Spikes in LeetCode activity often correlate with major layoff announcements from big tech companies.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What does the Google Trends score mean?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Google Trends scores range from 0 to 100, representing search interest relative to the peak in the selected time period. A score of 100 means peak popularity. Rising "layoff" searches often precede or coincide with major layoff waves.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How often does the data update?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'LeetCode counters update every 10 seconds via a live WebSocket connection. Google Trends data refreshes hourly. All data is fetched live — nothing is pre-recorded.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Can I use this to predict layoffs?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'This dashboard tracks signals that correlate with layoff activity. A spike in LeetCode users or Google searches for "layoff" may indicate that layoffs are happening or that workers are anxious about job security. It is a real-time sentiment indicator based on multiple data signals.',
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
