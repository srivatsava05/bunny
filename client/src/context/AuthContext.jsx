import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);
const LS_KEY = 'craftify_auth_v1';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(LS_KEY) || '');
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) localStorage.setItem(LS_KEY, token);
    else localStorage.removeItem(LS_KEY);
  }, [token]);

  async function api(url, opts = {}) {
    const res = await fetch(url, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      if (res.status === 401) {
        setToken('');
        setUser(null);
      }
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    return res.json();
  }

  async function me() {
    if (!token) return;
    try {
      const data = await api('/api/auth/me');
      setUser(data.user);
    } catch {}
  }

  useEffect(() => {
    me();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async ({ name, email, password, role }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    if (!res.ok) throw new Error('Register failed');
    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    setToken('');
    setUser(null);
  };

  const value = useMemo(() => ({ token, user, login, register, logout, api }), [token, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
