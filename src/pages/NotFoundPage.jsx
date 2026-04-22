import { Link } from 'react-router-dom'

/**
 * Not found page.
 *
 * @returns {import('react').ReactNode}
 */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#EEF2FB] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-[#B0C0E0] bg-white p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF2FB] text-[#1A3263]">
          🔎
        </div>
        <h1 className="text-2xl font-semibold text-[#1A3263]">Page not found</h1>
        <p className="mt-2 text-sm text-[#5A6E9A]">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/dashboard"
          className="mt-5 inline-flex rounded-lg bg-[#1A3263] px-4 py-2 text-sm font-semibold text-white hover:bg-[#122247]"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
