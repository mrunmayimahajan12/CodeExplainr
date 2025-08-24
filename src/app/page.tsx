import ClientCodeEditor from "@/components/ClientCodeEditor";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            CodeExplainr <span className="text-sky-400">💡</span>
          </h1>
          <p className="text-slate-400 mt-2" suppressHydrationWarning>
            Explain • Convert • Analyze — powered by local LLMs via Ollama
          </p>
        </header>

        {/* glass card wrapper */}
        <div className="rounded-2xl bg-slate-900/50 backdrop-blur shadow-xl ring-1 ring-white/10">
          <ClientCodeEditor />
        </div>
      </div>
    </main>
  );
}
