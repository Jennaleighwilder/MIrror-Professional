// pages/dashboard.js - MATCHMAKER DASHBOARD
// Luxury B2B interface for managing clients and viewing reports

import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUsers, FiFileText, FiTrendingUp, FiTarget } from 'react-icons/fi';
import Layout from '../components/Layout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('auth_token');

      const [statsRes, clientsRes] = await Promise.all([
        axios.get(`${API_URL}/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/clients?status=completed`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsRes.data);
      setClients(clientsRes.data.clients);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        setErrorMessage('Your session expired or is invalid. Please log in again.');
      } else {
        setErrorMessage('Unable to load dashboard data. Check the backend URL or try again.');
      }
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-[#c9a961] text-xl">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (errorMessage) {
    return (
      <Layout title="Dashboard">
        <div className="lux-panel p-6 rounded-2xl">
          <h2 className="text-xl font-serif text-[#f5f1e8] mb-2">Dashboard unavailable</h2>
          <p className="text-[#d8d3c8]">{errorMessage}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 lux-button px-6 py-3 rounded-lg font-semibold"
          >
            Retry
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('auth_token');
              window.location.href = '/login';
            }}
            className="mt-3 px-6 py-3 border border-[#c9a961]/30 rounded-lg text-sm text-[#f5f1e8] hover:border-[#c9a961] transition-colors"
          >
            Reset Login
          </button>
        </div>
      </Layout>
    );
  }
  return (
    <Layout title="Dashboard">
      <section className="lux-panel p-8 mb-10 rounded-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#a67c52]">Executive overview</p>
            <h2 className="text-3xl md:text-4xl font-serif text-[#f5f1e8] mt-2 mb-3">
              Precision matchmaking at luxury scale.
            </h2>
            <p className="text-[#d8d3c8] max-w-2xl">
              The Dyad Engine analyzes Mirror Protocol data to surface the highest-growth pairings,
              flag hidden risk, and produce investor-ready reports in minutes.
            </p>
          </div>
          <div className="lux-card rounded-xl px-6 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#a67c52]">This month</p>
            <div className="text-3xl font-serif text-[#f5f1e8] mt-2">{stats.usage.this_month} assessments</div>
            <p className="text-sm text-[#c9a961] mt-1">
              {stats.usage.limit ? `${stats.usage.limit} plan limit` : 'Unlimited plan'}
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          <StatCard
            icon={<FiUsers />}
            title="Total Assessments"
            value={stats.assessments.total}
            subtitle={`${stats.assessments.completed} completed`}
          color="text-[#c9a961]"
          />
          <StatCard
            icon={<FiFileText />}
            title="Reports Generated"
            value={stats.reports.total}
            subtitle="Compatibility analyses"
          color="text-[#a67c52]"
          />
          <StatCard
            icon={<FiTrendingUp />}
            title="This Month"
            value={stats.usage.this_month}
            subtitle={stats.usage.limit ? `of ${stats.usage.limit} limit` : 'Unlimited'}
          color="text-[#d8d3c8]"
          />
          <StatCard
            icon={<FiTarget />}
            title="Revenue Tier"
            value={stats.subscription.tier.toUpperCase()}
            subtitle={`$${(stats.subscription.monthly_price / 100).toLocaleString()} per month`}
          color="text-[#c9a961]"
          />
        </div>

      <div className="flex flex-wrap items-center gap-4 mb-10">
        <button
          onClick={() => setShowInviteModal(true)}
          className="lux-button px-8 py-3 rounded-lg font-semibold"
        >
          + Invite New Client
        </button>
        <a
          href="/reports"
          className="px-6 py-3 border border-[#c9a961]/30 text-[#f5f1e8] rounded-lg hover:border-[#c9a961] transition-colors"
        >
          View Reports
        </a>
      </div>

      <div className="lux-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif text-[#f5f1e8]">Recent Completed Assessments</h2>
          <span className="text-xs uppercase tracking-[0.2em] text-[#a67c52]">Top 5</span>
        </div>

        {clients.length === 0 ? (
          <p className="text-[#d8d3c8] text-center py-8">No completed assessments yet. Invite your first client!</p>
        ) : (
          <div className="space-y-4">
            {clients.slice(0, 5).map(client => (
              <div key={client.assessment_id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 lux-card hover:border-[#c9a961]/60 transition-colors">
                <div>
                  <div className="text-[#f5f1e8] font-medium">{client.client_code}</div>
                  <div className="text-sm text-[#d8d3c8]">{client.client_first_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-[#c9a961] text-sm">{client.attachment_style || 'Processing'}</div>
                  <div className="text-[#d8d3c8] text-xs">{client.primary_role_tendency || 'Analysis pending'}</div>
                </div>
                <button className="text-[#e8b86d] hover:text-[#c9a961] font-medium">
                  View Details →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={fetchDashboardData}
        />
      )}
    </Layout>
  );
}

function StatCard({ icon, title, value, subtitle, color }) {
  return (
    <div className="lux-card rounded-xl p-6">
      <div className={`${color} text-3xl mb-2`}>{icon}</div>
      <div className="text-[#a67c52] text-sm mb-1 uppercase tracking-[0.2em]">{title}</div>
      <div className="text-[#f5f1e8] text-3xl font-serif mb-1">{value}</div>
      <div className="text-[#d8d3c8] text-xs">{subtitle}</div>
    </div>
  );
}

function InviteModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    client_code: '',
    client_email: '',
    client_first_name: ''
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSending(true);

    try {
      const token = localStorage.getItem('auth_token');

      await axios.post(
        `${API_URL}/clients/invite`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Invitation sent successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to send invitation:', error);
      alert(error.response?.data?.error || 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="lux-panel p-8 max-w-md w-full">
        <h2 className="text-2xl font-serif text-[#f5f1e8] mb-6">Invite New Client</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#a67c52] text-sm mb-2">Client Code (Internal ID)</label>
            <input
              type="text"
              value={formData.client_code}
              onChange={(event) => setFormData({ ...formData, client_code: event.target.value })}
              className="w-full bg-[rgba(13,10,15,0.6)] border border-[rgba(201,169,97,0.2)] rounded px-4 py-2 text-[#f5f1e8] focus:border-[#c9a961] focus:outline-none"
              placeholder="CLIENT-001"
              required
            />
          </div>

          <div>
            <label className="block text-[#a67c52] text-sm mb-2">First Name</label>
            <input
              type="text"
              value={formData.client_first_name}
              onChange={(event) => setFormData({ ...formData, client_first_name: event.target.value })}
              className="w-full bg-[rgba(13,10,15,0.6)] border border-[rgba(201,169,97,0.2)] rounded px-4 py-2 text-[#f5f1e8] focus:border-[#c9a961] focus:outline-none"
              placeholder="Sarah"
              required
            />
          </div>

          <div>
            <label className="block text-[#a67c52] text-sm mb-2">Email Address</label>
            <input
              type="email"
              value={formData.client_email}
              onChange={(event) => setFormData({ ...formData, client_email: event.target.value })}
              className="w-full bg-[rgba(13,10,15,0.6)] border border-[rgba(201,169,97,0.2)] rounded px-4 py-2 text-[#f5f1e8] focus:border-[#c9a961] focus:outline-none"
              placeholder="client@email.com"
              required
            />
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-[#c9a961]/20 text-[#d8d3c8] rounded-lg hover:border-[#c9a961]/60 transition-colors"
              disabled={sending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 lux-button rounded-lg font-semibold disabled:opacity-50"
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
