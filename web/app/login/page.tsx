export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-zinc-800 bg-zinc-900/60 p-8 shadow-lg">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-zinc-400">Access the DeployFlow Fleet console.</p>
        </div>
        <form className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm" htmlFor="username">Email or username</label>
            <input
              id="username"
              name="username"
              type="text"
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="admin@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  )
}
