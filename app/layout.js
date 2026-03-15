import { Analytics } from '@vercel/analytics/react'

export const metadata = {
  title: 'LeetCode Two Sum Live Counter | How Many People Are Solving Two Sum Right Now?',
  description: 'See how many people are solving LeetCode\'s Two Sum problem in real time. Live WebSocket counter with historical chart updated every 10 seconds. The most popular coding interview question tracked live.',
  keywords: ['leetcode', 'two sum', 'live counter', 'online users', 'coding interview', 'leetcode statistics', 'leetcode live', 'leetcode online count', 'how many people solving leetcode'],
  openGraph: {
    title: 'LeetCode Two Sum — Live Online Counter',
    description: 'Real-time count of people solving the #1 most popular LeetCode problem right now. Updated every 10 seconds via WebSocket.',
    type: 'website',
    siteName: 'LeetCode Live Counter',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LeetCode Two Sum — Live Online Counter',
    description: 'See how many people are solving Two Sum right now. Live real-time counter.',
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
              name: 'LeetCode Two Sum Live Counter',
              description: 'Real-time tracker showing how many people are currently solving the Two Sum problem on LeetCode. Updated every 10 seconds via WebSocket connection.',
              applicationCategory: 'DeveloperApplication',
              operatingSystem: 'Web',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
              featureList: [
                'Real-time online user count for LeetCode Two Sum',
                'Live WebSocket updates every 10 seconds',
                'Historical line chart of online users',
                'Auto-reconnect on connection loss',
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
                  name: 'How many people are solving LeetCode Two Sum right now?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'The number varies throughout the day. Two Sum is the most popular LeetCode problem, typically showing hundreds to thousands of concurrent solvers. Visit the live counter to see the exact real-time count.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How does the LeetCode live counter work?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'The counter connects directly to LeetCode\'s collaboration WebSocket server, which broadcasts the number of active users on each problem page. The count updates approximately every 10 seconds.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'What is Two Sum on LeetCode?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Two Sum is LeetCode Problem #1 and the most popular coding interview question. Given an array of integers and a target, you must find two numbers that add up to the target. It is often the first problem new programmers solve when preparing for technical interviews.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Why is Two Sum the most popular LeetCode problem?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Two Sum is problem #1 on LeetCode, making it the default starting point. It teaches fundamental concepts like hash maps and array traversal, making it ideal for beginners and a common warm-up for experienced engineers preparing for interviews at companies like Google, Meta, and Amazon.',
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
