import { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' }
];

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchClients = async (status) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const query = status && status !== 'all' ? `?status=${status}` : '';
      const response = await axios.get(`${API_URL}/clients${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(response.data.clients || []);
    } catch (error) {
      console.error('Failed to load clients:', error);
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients(activeFilter);
  }, [activeFilter]);

  return (
    <Layout title="Clients">
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#a67c52]">Client archive</p>
          <h2 className="text-3xl font-serif text-[#f5f1e8] mt-2">Your assessment pipeline</h2>
          <p className="text-[#d8d3c8] mt-2 max-w-xl">
            Track every invitation, see phase progress, and surface attachment style insights the moment they are ready.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                activeFilter === filter.key
                  ? 'bg-[linear-gradient(135deg,#c9a961,#d4a574)] text-[#0d0a0f] border-[#c9a961]'
                  : 'border-[#c9a961]/20 text-[#f5f1e8] hover:border-[#c9a961]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <div className="lux-panel p-6 rounded-2xl">
        {loading ? (
          <div className="text-[#c9a961] text-center py-10">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="text-[#d8d3c8] text-center py-12">
            No clients in this segment yet. Send a new invitation to begin.
          </div>
        ) : (
          <div className="grid gap-4">
            {clients.map((client) => (
              <div key={client.assessment_id} className="lux-card p-4 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="text-[#f5f1e8] font-medium">{client.client_code || 'CLIENT'}</div>
                  <div className="text-sm text-[#d8d3c8]">{client.client_first_name}</div>
                  <div className="text-xs text-[#a67c52]">{client.client_email}</div>
                </div>
                <div className="flex flex-col md:text-right">
                  <span className="text-[#c9a961] text-sm">{client.attachment_style || 'Processing'}</span>
                  <span className="text-[#d8d3c8] text-xs">{client.primary_role_tendency || 'Analysis pending'}</span>
                  <span className="text-[#a67c52] text-xs mt-1">{client.status || 'pending'}</span>
                </div>
                <button className="text-[#e8b86d] hover:text-[#c9a961] font-medium">
                  View Profile →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
