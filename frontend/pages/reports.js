import { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function Reports() {
  const [clients, setClients] = useState([]);
  const [clientA, setClientA] = useState('');
  const [clientB, setClientB] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/clients?status=completed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(response.data.clients || []);
    } catch (err) {
      console.error('Failed to fetch clients', err);
      if (err.response?.status === 401) {
        window.location.href = '/login';
      }
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const generateReport = async () => {
    if (!clientA || !clientB || clientA === clientB) {
      setError('Select two different completed clients.');
      return;
    }

    setError('');
    setLoading(true);
    setReport(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_URL}/compatibility/generate`,
        { client_a_id: clientA, client_b_id: clientB, template: 'luxury' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReport(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to generate report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Reports">
      <section className="lux-panel p-8 mb-8 rounded-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-[#a67c52]">Compatibility reports</p>
        <h2 className="text-3xl font-serif text-[#f5f1e8] mt-2">Generate a Dyad Engine report</h2>
        <p className="text-[#d8d3c8] mt-2 max-w-2xl">
          Select two completed assessments to produce a full psychological compatibility analysis.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <select
            value={clientA}
            onChange={(event) => setClientA(event.target.value)}
            className="bg-[rgba(13,10,15,0.6)] border border-[rgba(201,169,97,0.2)] rounded-lg px-4 py-3 text-[#f5f1e8]"
          >
            <option value="">Select Client A</option>
            {clients.map((client) => (
              <option key={client.assessment_id} value={client.assessment_id}>
                {client.client_code || client.client_first_name}
              </option>
            ))}
          </select>
          <select
            value={clientB}
            onChange={(event) => setClientB(event.target.value)}
            className="bg-[rgba(13,10,15,0.6)] border border-[rgba(201,169,97,0.2)] rounded-lg px-4 py-3 text-[#f5f1e8]"
          >
            <option value="">Select Client B</option>
            {clients.map((client) => (
              <option key={client.assessment_id} value={client.assessment_id}>
                {client.client_code || client.client_first_name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-300 bg-red-950/30 border border-red-900 px-3 py-2 rounded">
            {error}
          </div>
        )}

        <button
          onClick={generateReport}
          disabled={loading}
          className="mt-6 lux-button px-8 py-3 rounded-lg font-semibold disabled:opacity-60"
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </section>

      {report && (
        <section className="lux-panel p-8 rounded-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#a67c52]">Report summary</p>
              <h3 className="text-2xl font-serif text-[#f5f1e8] mt-2">
                {report.compatibility?.predicted_role_lock?.replace(/_/g, ' / ') || 'Compatibility Report'}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-[#a67c52] text-sm">Overall Score</p>
              <p className="text-3xl font-serif text-[#c9a961]">{report.compatibility?.overall_score ?? '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <ScoreCard label="Surface" value={report.compatibility?.surface_score} />
            <ScoreCard label="Attachment" value={report.compatibility?.attachment_score} />
            <ScoreCard label="Trauma" value={report.compatibility?.trauma_overlap_score} />
            <ScoreCard label="Values" value={report.compatibility?.values_score} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FlagCard title="Red Flags" items={report.compatibility?.red_flags} empty="No critical red flags detected." />
            <FlagCard title="Yellow Flags" items={report.compatibility?.yellow_flags} empty="Low to moderate risk indicators." />
            <FlagCard title="Green Lights" items={report.compatibility?.green_lights} empty="No growth signals logged yet." />
          </div>
        </section>
      )}
    </Layout>
  );
}

function ScoreCard({ label, value }) {
  return (
    <div className="lux-card rounded-xl p-4 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-[#a67c52]">{label}</p>
      <p className="text-2xl font-serif text-[#f5f1e8] mt-2">{value ?? '—'}</p>
    </div>
  );
}

function FlagCard({ title, items, empty }) {
  const list = Array.isArray(items) ? items : [];
  return (
    <div className="lux-card rounded-xl p-4">
      <p className="text-sm uppercase tracking-[0.2em] text-[#a67c52] mb-3">{title}</p>
      {list.length === 0 ? (
        <p className="text-[#d8d3c8] text-sm">{empty}</p>
      ) : (
        <ul className="text-sm text-[#f5f1e8] space-y-2">
          {list.map((item, index) => (
            <li key={`${item.type || 'flag'}-${index}`}>
              <span className="text-[#c9a961]">{item.type?.replace(/_/g, ' ') || 'Flag'}:</span>{' '}
              {item.description || 'Insight detected'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
