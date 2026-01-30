import { useState } from 'react';
import Head from 'next/head';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function Login() {
  const [email, setEmail] = useState('demo@elitematch.com');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      localStorage.setItem('auth_token', response.data.token);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Mirror Professional | Login</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md lux-panel p-8 rounded-2xl">
          <p className="lux-wordmark">Mirror Professional</p>
          <p className="lux-tagline mt-2">Psychological Forensics</p>
          <h1 className="text-3xl font-serif text-[#f5f1e8] mb-2 mt-3">Matchmaker Access</h1>
          <p className="text-sm text-[#c9a961] mb-6">Secure entry for premium partners</p>

          {error && (
            <div className="mb-4 text-sm text-red-200 bg-red-950/40 border border-red-900 px-3 py-2 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[#a67c52] mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-[rgba(13,10,15,0.6)] border border-[rgba(201,169,97,0.2)] rounded px-4 py-2 text-[#f5f1e8] focus:border-[#c9a961] focus:outline-none"
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-[#a67c52] mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-[rgba(13,10,15,0.6)] border border-[rgba(201,169,97,0.2)] rounded px-4 py-2 text-[#f5f1e8] focus:border-[#c9a961] focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full lux-button py-3 rounded-lg font-semibold disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="mt-6 text-xs text-[#d8d3c8]">
            Demo access: <span className="text-[#c9a961]">demo@elitematch.com / demo123</span>
          </div>
        </div>
      </div>
    </>
  );
}
