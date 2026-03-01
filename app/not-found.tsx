/**
 * Custom 404 page — avoids router-context errors during static prerendering.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center">
      <div className="text-center px-4">
        <div className="text-8xl mb-6">🎪</div>
        <h1 className="text-4xl font-bold text-gray-800 mb-3">404 — Page Not Found</h1>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
          Oops! We couldn{"'"}t find that page. Let{"'"}s get you back to finding fun events!
        </p>
        <a
          href="/"
          className="inline-block bg-gradient-to-r from-amber-400 to-orange-400 text-white px-8 py-3 rounded-2xl font-semibold hover:from-amber-500 hover:to-orange-500 transition-all shadow-md"
        >
          🏠 Back to Events
        </a>
      </div>
    </div>
  )
}
