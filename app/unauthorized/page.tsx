import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        <div className="space-y-6">
          {/* Status Code */}
          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-white">403</h1>
            <h2 className="text-2xl font-semibold text-slate-100">Access Denied</h2>
          </div>

          {/* Description */}
          <div className="space-y-3 text-slate-400">
            <p>You don't have permission to access this resource.</p>
            <p className="text-sm">Your current role doesn't grant access to this dashboard or feature.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <Link
              href="/dashboard/vendor"
              className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-lg transition duration-200"
            >
              Go to Vendor Dashboard
            </Link>
            <Link
              href="/"
              className="px-6 py-3 border border-slate-600 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-800 text-slate-100 font-semibold rounded-lg transition duration-200"
            >
              Return Home
            </Link>
          </div>

          {/* Help Text */}
          <p className="text-xs text-slate-500 pt-4">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </main>
  );
}
