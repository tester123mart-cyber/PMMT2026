'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import ParticipantDashboard from '@/components/participant/ParticipantDashboard';

export default function Home() {
  const { state, login } = useApp();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !name.trim()) {
      setError('Please enter both your name and email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    login(email.trim(), name.trim());
  };

  // If logged in, show participant dashboard
  if (state.currentUser) {
    return <ParticipantDashboard />;
  }

  // Login screen
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-8 w-full max-w-md animate-fade-in">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏥</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            PMMT
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Medical Mission Coordination
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="input-field"
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field"
              autoComplete="email"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full mt-6">
            Sign In
          </button>
        </form>

        {/* Quick Links */}
        <div className="mt-8 pt-6 border-t border-[var(--border-subtle)]">
          <p className="text-sm text-[var(--text-muted)] text-center">
            Team leaders: Access{' '}
            <a href="/logistics" className="text-blue-400 hover:underline">
              Logistics Dashboard
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
