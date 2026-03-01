import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kids Event Finder 🎉',
  description: 'Find fun events for children near you!',
  icons: { icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><text y="32" font-size="32">🎪</text></svg>' }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-amber-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 shadow-md">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
            <span className="text-4xl">🎪</span>
            <div>
              <h1 className="text-2xl font-bold text-white drop-shadow">Kids Event Finder</h1>
              <p className="text-amber-100 text-sm">Discover fun events for your little ones!</p>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-16 py-6 text-center text-sm text-amber-700 border-t border-amber-200">
          <p>🌟 Kids Event Finder — making family time special</p>
        </footer>
      </body>
    </html>
  )
}
