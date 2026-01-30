import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Mirror Professional | Luxury Matchmaking OS</title>
      </Head>
      <div className="min-h-screen text-[#f5f1e8]">
        <header className="border-b border-[#c9a961]/15">
          <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="lux-wordmark">Mirror Professional</p>
              <p className="lux-tagline">Psychological Forensics</p>
              <h1 className="text-2xl md:text-3xl font-serif text-[#f5f1e8] mt-3">Luxury Matchmaking OS</h1>
            </div>
            <div className="flex gap-3">
              <a href="/login" className="px-5 py-2 border border-[#c9a961]/30 rounded-full text-sm text-[#d8d3c8] hover:border-[#c9a961] transition-colors">
                Matchmaker Login
              </a>
              <a href="/dashboard" className="px-5 py-2 lux-button rounded-full font-semibold">
                Enter Dashboard
              </a>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-12">
          <section className="lux-panel p-10 rounded-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-[#a67c52]">Investor ready</p>
            <h2 className="text-4xl md:text-5xl font-serif text-[#f5f1e8] mt-3">
              Sell precision compatibility as a premium service.
            </h2>
            <p className="text-[#d8d3c8] mt-4 max-w-2xl">
              Mirror Professional blends the Mirror Protocol assessment with the Dyad Engine matching
              algorithm to deliver elite compatibility reports, premium client experiences, and
              measurable outcomes.
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <a href="/login" className="px-8 py-3 lux-button rounded-lg font-semibold">
                Launch Demo
              </a>
              <a href="/assess/demo" className="px-8 py-3 border border-[#c9a961]/30 rounded-lg text-[#f5f1e8] hover:border-[#c9a961] transition-colors">
                View Client Portal
              </a>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {[
              {
                title: 'Psychological Forensics',
                description: 'Analyze attachment dynamics, trauma overlap, and value alignment in minutes.'
              },
              {
                title: 'Luxury Client Flow',
                description: 'Invite clients, track progress, and deliver premium reports with confidence.'
              },
              {
                title: 'Monetize Precision',
                description: 'Turn high-touch matchmaking into subscription revenue with strong margins.'
              }
            ].map((card) => (
              <div key={card.title} className="lux-card rounded-2xl p-6">
                <h3 className="text-xl font-serif text-[#f5f1e8]">{card.title}</h3>
                <p className="text-[#d8d3c8] mt-3">{card.description}</p>
              </div>
            ))}
          </section>

          <section className="mt-12 border border-[#c9a961]/20 rounded-2xl p-8 lux-card">
            <h3 className="text-2xl font-serif text-[#f5f1e8] mb-4">Deployment ready</h3>
            <p className="text-[#d8d3c8] max-w-2xl">
              Ship instantly on Railway or host privately. The API, database schema, and dashboard are
              production-ready and designed for B2B sales conversations.
            </p>
          </section>
        </main>
      </div>
    </>
  );
}
