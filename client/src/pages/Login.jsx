import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'buyer' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        const user = await login(form.email, form.password);
        navigate(user.role === 'seller' ? '/dashboard' : '/');
      } else {
        const user = await register(form);
        navigate(user.role === 'seller' ? '/dashboard' : '/');
      }
    } catch {
      setError('Authentication failed. Check details and try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{mode === 'login' ? 'Login' : 'Create account'}</h1>
          <button className="text-sm text-emerald-700 hover:underline" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Register' : 'Have an account? Login'}
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === 'register' && (
            <>
              <input className="input w-full" placeholder="Full name" required value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} />
              <div>
                <label className="text-xs text-gray-500">Role</label>
                <select className="input w-full" value={form.role} onChange={(e)=>setForm({...form, role: e.target.value})}>
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                </select>
              </div>
            </>
          )}
          <input className="input w-full" type="email" placeholder="Email" required value={form.email} onChange={(e)=>setForm({...form, email: e.target.value})} />
          <input className="input w-full" type="password" placeholder="Password" required value={form.password} onChange={(e)=>setForm({...form, password: e.target.value})} />
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button className="btn btn-primary w-full">{mode === 'login' ? 'Login' : 'Register'}</button>
        </form>

        <p className="mt-3 text-xs text-gray-500">Note: For demo purposes, email verification is not enabled.</p>
      </div>
    </div>
  );
}
