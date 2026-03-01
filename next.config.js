/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  },
  experimental: {
    // Allow server-side use of better-sqlite3 (Next.js 14 compatible key)
    serverComponentsExternalPackages: ['better-sqlite3']
  }
}

module.exports = nextConfig
