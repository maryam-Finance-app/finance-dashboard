'use client';
 
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/client';
 
export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
 
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [accountExists, setAccountExists] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'auth_callback_failed'
      ? 'The confirmation link is invalid or expired. Please try again.'
      : null
  );
 
  const resetFeedback = () => {
    setMessage(null);
    setError(null);
    setAccountExists(false);
  };
 
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetFeedback();
 
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
 
    setLoading(false);
 
    if (error) {
      setError(error.message);
      return;
    }
 
    router.push('/');
    router.refresh(); // makes server components pick up the new session
  };
 
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetFeedback();
 
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        // read by the handle_new_user trigger to fill profiles.username
        data: { username },
      },
    });
 
    setLoading(false);
 
    if (error) {
      setError(error.message);
      return;
    }
 
    // With email confirmation on, Supabase returns no error for an email that
    // is already registered. Instead it returns a user with an empty
    // `identities` array and sends no email.
    if (data.user && data.user.identities?.length === 0) {
      setAccountExists(true);
      setError('You already have an account with this email.');
      return;
    }
 
    setMessage('Check your email to confirm your account before logging in.');
  };
 
  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    resetFeedback();
  };
 
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-xl font-semibold">
        {mode === 'login' ? 'Log in' : 'Sign up'}
      </h1>
 
      <form
        onSubmit={mode === 'login' ? handleLogin : handleSignup}
        className="flex flex-col gap-3 w-full max-w-sm"
      >
        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="border p-2 rounded"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (accountExists) resetFeedback();
          }}
          required
          className="border p-2 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="border p-2 rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white p-2 rounded"
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}
        </button>
      </form>
 
      {message && <p className="text-green-600 text-sm">{message}</p>}
 
      {error && (
        <p className="text-red-600 text-sm">
          {error}{' '}
          {accountExists && (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                resetFeedback();
              }}
              className="underline font-medium"
            >
              Log in instead
            </button>
          )}
        </p>
      )}
 
      <button onClick={switchMode} className="text-sm underline">
        {mode === 'login'
          ? "Don't have an account? Sign up"
          : 'Already have an account? Log in'}
      </button>
    </div>
  );
}
