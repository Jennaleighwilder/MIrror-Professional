import Layout from '../components/Layout';

const SETTINGS = [
  { label: 'Brand Name', value: 'Mirror Professional' },
  { label: 'Theme', value: 'Obsidian Noir + Gilded Gold' },
  { label: 'Default Report', value: 'Luxury Executive Format' },
  { label: 'Data Storage', value: 'Encrypted PostgreSQL' },
  { label: 'Support SLA', value: '24-hour turnaround' }
];

export default function Settings() {
  return (
    <Layout title="Settings">
      <section className="lux-panel p-8 rounded-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-[#a67c52]">Platform settings</p>
        <h2 className="text-3xl font-serif text-[#f5f1e8] mt-2">Luxury configuration</h2>
        <p className="text-[#d8d3c8] mt-2 max-w-2xl">
          Tailor your client experience with premium branding, report templates, and controlled access.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {SETTINGS.map((setting) => (
            <div key={setting.label} className="lux-card rounded-xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#a67c52]">{setting.label}</p>
              <p className="text-lg font-serif text-[#f5f1e8] mt-2">{setting.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-[#c9a961]/15 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-[#d8d3c8]">Need custom branding or a new pricing tier?</p>
            <p className="text-[#f5f1e8] font-medium">Contact support to unlock bespoke configuration.</p>
          </div>
          <button className="lux-button px-6 py-3 rounded-lg font-semibold">
            Request Brand Update
          </button>
        </div>
      </section>
    </Layout>
  );
}
