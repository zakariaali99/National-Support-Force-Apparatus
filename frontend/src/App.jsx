function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center space-y-6 p-10">
        <h1 className="text-4xl font-bold">
          National Support Force <span className="text-emerald-400">Apparatus</span>
        </h1>
        <p className="text-slate-400 max-w-md mx-auto">
          React + Vite + Tailwind CSS frontend connected to the Django backend.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/api/schema/swagger-ui/"
            className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-400 transition-colors"
          >
            API Docs
          </a>
          <a
            href="http://localhost:8000/admin/"
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:border-slate-500 transition-colors"
          >
            Admin
          </a>
        </div>
      </div>
    </main>
  )
}

export default App