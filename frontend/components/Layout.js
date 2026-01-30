import Head from 'next/head';
import { FiSettings } from 'react-icons/fi';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/clients', label: 'Clients' },
  { href: '/reports', label: 'Reports' }
];

export default function Layout({ title, children, showSettings = true }) {
  return (
    <div className="min-h-screen text-[#f5f1e8]">
      <Head>
        <title>{title ? `${title} | Mirror Professional` : 'Mirror Professional'}</title>
      </Head>

      <header className="border-b border-[#c9a961]/15">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="lux-wordmark">Mirror Professional</p>
            <p className="lux-tagline">Psychological Forensics</p>
            <h1 className="text-2xl md:text-3xl font-serif text-[#f5f1e8] mt-3">
              Psychological Forensics Platform
            </h1>
          </div>
          <nav className="flex flex-wrap items-center gap-6 text-sm text-[#d8d3c8]">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-[#c9a961]">
                {link.label}
              </a>
            ))}
            {showSettings && (
              <a href="/settings" className="hover:text-[#c9a961] flex items-center gap-2">
                <FiSettings /> Settings
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  );
}
