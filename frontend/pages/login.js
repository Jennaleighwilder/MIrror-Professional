import { useState } from 'react';
import Head from 'next/head';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function Login() {
  const [email, setEmail] = useState('demo@elitematch.com');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [creatingDemo, setCreatingDemo] = useState(false);
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

  const handleCreateDemo = async () => {
    setError('');
    setCreatingDemo(true);

    try {
      if (!email || !password) {
        setError('Enter an email and password first.');
        return;
      }
      const response = await axios.post(`${API_URL}/auth/register`, {
        company_name: 'Demo Matchmakers',
        email,
        password,
        tier: 'platinum'
      });

      localStorage.setItem('auth_token', response.data.token);
      window.location.href = '/dashboard';
    } catch (err) {
      const message = err.response?.data?.error || 'Unable to create demo account.';
      if (message.toLowerCase().includes('already')) {
        try {
          const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
          });
          localStorage.setItem('auth_token', loginResponse.data.token);
          window.location.href = '/dashboard';
          return;
        } catch (loginError) {
          setError(loginError.response?.data?.error || 'Login failed. Check credentials.');
        }
      } else {
        setError(message);
      }
    } finally {
      setCreatingDemo(false);
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
          <button
            type="button"
            onClick={handleCreateDemo}
            disabled={creatingDemo}
            className="w-full mt-3 px-4 py-3 border border-[#c9a961]/30 rounded-lg text-sm text-[#f5f1e8] hover:border-[#c9a961] transition-colors disabled:opacity-60"
          >
            {creatingDemo ? 'Creating demo account...' : 'Create Demo Account'}
          </button>
          <div className="mt-6 text-xs text-[#d8d3c8]">
            Use your email + password, then click Create Demo Account.
          </div>
        </div>
      </div>
    </>
  );
}
